package com.supportticket.service.impl;

import com.supportticket.dto.request.AddCommentRequest;
import com.supportticket.dto.request.CreateTicketRequest;
import com.supportticket.dto.request.UpdateTicketRequest;
import com.supportticket.dto.response.*;
import com.supportticket.entity.*;
import com.supportticket.enums.*;
import com.supportticket.exception.AccessDeniedException;
import com.supportticket.exception.BadRequestException;
import com.supportticket.exception.ResourceNotFoundException;
import com.supportticket.repository.*;
import com.supportticket.service.AiTriageService;
import com.supportticket.service.AuthService;
import com.supportticket.service.TicketService;
import com.supportticket.util.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.supportticket.service.NotificationService;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final CommentRepository commentRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final AiTriageService aiTriageService;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request, String userEmail) {
        User creator = authService.getUserEntityByEmail(userEmail);

        Ticket ticket = Ticket.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .status(TicketStatus.OPEN)
                .priority(TicketPriority.MEDIUM)
                .category(TicketCategory.GENERAL_INQUIRY)
                .createdBy(creator)
                .aiTriaged(false)
                .build();

        ticket = ticketRepository.save(ticket);

        // Audit: ticket created
        saveAuditLog(ticket, creator, AuditAction.TICKET_CREATED, null, null,
                "Ticket created by " + creator.getFullName());

        // AI triage (sync — returns immediately with result or fallback)
        performAiTriage(ticket, request.getTitle(), request.getDescription(), creator);

        final Long ticketId = ticket.getId();

        userRepository.findByRole(Role.AGENT).forEach(agent ->
        notificationService.notifyUser(
                agent.getId(),
                ticketId,
                "New ticket from " + creator.getFullName(),
                request.getTitle().trim()
        )
        );

        return toTicketResponse(ticket);
    }

    private void performAiTriage(Ticket ticket, String title, String description, User creator) {
        try {
            AiTriageService.TriageResult result = aiTriageService.triageTicket(title, description);
            ticket.setCategory(result.category());
            ticket.setPriority(result.priority());
            ticket.setAiSuggestedResponse(result.suggestedResponse());
            ticket.setAiTriaged(true);
            ticketRepository.save(ticket);

            saveAuditLog(ticket, creator, AuditAction.AI_TRIAGE_COMPLETED, null,
                    result.category() + " / " + result.priority(),
                    "AI assigned category=" + result.category() + ", priority=" + result.priority());
        } catch (Exception e) {
            log.warn("AI triage async error for ticket {}: {}", ticket.getId(), e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TicketResponse> getTickets(
            String search, TicketStatus status, TicketPriority priority,
            TicketCategory category, Long assigneeId, Pageable pageable, String userEmail) {

        User user = authService.getUserEntityByEmail(userEmail);
        Page<Ticket> page;

        if (user.getRole() == Role.CUSTOMER) {
            page = ticketRepository.findByCreatedByWithFilters(
                    user, blankToNull(search), status, priority, category, pageable);
        } else {
            // AGENT or ADMIN can see all
            page = ticketRepository.findAllWithFilters(
                    blankToNull(search), status, priority, category, assigneeId, pageable);
        }

        return PageResponse.from(page.map(this::toTicketResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public TicketResponse getTicketById(Long id, String userEmail) {
        Ticket ticket = findTicketOrThrow(id);
        User user = authService.getUserEntityByEmail(userEmail);
        assertCanViewTicket(ticket, user);
        return toTicketResponse(ticket);
    }

    @Override
    @Transactional
    public TicketResponse updateTicket(Long id, UpdateTicketRequest request, String userEmail) {
        Ticket ticket = findTicketOrThrow(id);
        User user = authService.getUserEntityByEmail(userEmail);

        // Only agents/admins can update tickets
        if (user.getRole() == Role.CUSTOMER) {
            throw new AccessDeniedException("Customers cannot update ticket metadata");
        }

        if (ticket.getStatus() == TicketStatus.CLOSED && request.getStatus() != TicketStatus.OPEN) {
            throw new BadRequestException("Closed tickets can only be re-opened");
        }

        // Status change
        if (request.getStatus() != null && request.getStatus() != ticket.getStatus()) {
            saveAuditLog(ticket, user, AuditAction.STATUS_CHANGED,
                    ticket.getStatus().name(), request.getStatus().name(),
                    user.getFullName() + " changed status");
            ticket.setStatus(request.getStatus());
        }

        // Priority change
        if (request.getPriority() != null && request.getPriority() != ticket.getPriority()) {
            saveAuditLog(ticket, user, AuditAction.PRIORITY_CHANGED,
                    ticket.getPriority().name(), request.getPriority().name(),
                    user.getFullName() + " changed priority");
            ticket.setPriority(request.getPriority());
        }

        // Category change
        if (request.getCategory() != null && request.getCategory() != ticket.getCategory()) {
            saveAuditLog(ticket, user, AuditAction.CATEGORY_CHANGED,
                    ticket.getCategory().name(), request.getCategory().name(),
                    user.getFullName() + " changed category");
            ticket.setCategory(request.getCategory());
        }

        // Assignment change
        if (request.getAssignedToId() != null) {
            if (request.getAssignedToId() == -1L) {
                // unassign
                saveAuditLog(ticket, user, AuditAction.UNASSIGNED,
                        ticket.getAssignedTo() != null ? ticket.getAssignedTo().getFullName() : null,
                        null, user.getFullName() + " unassigned ticket");
                ticket.setAssignedTo(null);
            } else {
                User assignee = userRepository.findById(request.getAssignedToId())
                        .orElseThrow(() -> new ResourceNotFoundException("User", request.getAssignedToId()));
                if (assignee.getRole() == Role.CUSTOMER) {
                    throw new BadRequestException("Cannot assign ticket to a customer");
                }
                String oldAssignee = ticket.getAssignedTo() != null ? ticket.getAssignedTo().getFullName() : "None";
                saveAuditLog(ticket, user, AuditAction.ASSIGNED,
                        oldAssignee, assignee.getFullName(),
                        user.getFullName() + " assigned to " + assignee.getFullName());
                ticket.setAssignedTo(assignee);
            }
        }

        ticket = ticketRepository.save(ticket);
        if (ticket.getCreatedBy() != null && !ticket.getCreatedBy().getId().equals(user.getId())) {
                notificationService.notifyUser(
                        ticket.getCreatedBy().getId(),
                        ticket.getId(),
                        "Ticket updated by " + user.getFullName(),
                        "Status: " + ticket.getStatus()
                );
            }
        return toTicketResponse(ticket);
    }

    @Override
    @Transactional
    public CommentResponse addComment(Long ticketId, AddCommentRequest request, String userEmail) {
        Ticket ticket = findTicketOrThrow(ticketId);
        User user = authService.getUserEntityByEmail(userEmail);
        assertCanViewTicket(ticket, user);

        if (ticket.getStatus() == TicketStatus.CLOSED) {
            throw new BadRequestException("Cannot add comment to a closed ticket");
        }

        Comment comment = Comment.builder()
                .content(request.getContent().trim())
                .ticket(ticket)
                .author(user)
                .build();

        comment = commentRepository.save(comment);

        saveAuditLog(ticket, user, AuditAction.COMMENT_ADDED, null, null,
                user.getFullName() + " added a comment");

        if (user.getRole() == Role.CUSTOMER) {
            if (ticket.getAssignedTo() != null) {
                notificationService.notifyUser(
                        ticket.getAssignedTo().getId(),
                        ticket.getId(),
                        "New message from " + user.getFullName(),
                        request.getContent().trim()
                );
            } else {
                userRepository.findByRole(Role.AGENT).forEach(agent ->
                        notificationService.notifyUser(
                                agent.getId(),
                                ticket.getId(),
                                "New customer message from " + user.getFullName(),
                                request.getContent().trim()
                        )
                );
            }
        } else {
            notificationService.notifyUser(
                    ticket.getCreatedBy().getId(),
                    ticket.getId(),
                    "New message from " + user.getFullName(),
                    request.getContent().trim()
            );
        }

        return toCommentResponse(comment);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CommentResponse> getComments(Long ticketId, Pageable pageable, String userEmail) {
        Ticket ticket = findTicketOrThrow(ticketId);
        User user = authService.getUserEntityByEmail(userEmail);
        assertCanViewTicket(ticket, user);

        Page<Comment> comments = commentRepository.findByTicketOrderByCreatedAtAsc(ticket, pageable);
        return PageResponse.from(comments.map(this::toCommentResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAuditLogs(Long ticketId, String userEmail) {
        Ticket ticket = findTicketOrThrow(ticketId);
        User user = authService.getUserEntityByEmail(userEmail);
        assertCanViewTicket(ticket, user);

        return auditLogRepository.findByTicketOrderByCreatedAtAsc(ticket)
                .stream()
                .map(this::toAuditResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AnalyticsResponse getAnalytics(String userEmail) {
        User user = authService.getUserEntityByEmail(userEmail);
        if (user.getRole() == Role.CUSTOMER) {
            throw new AccessDeniedException("Analytics is available for agents only");
        }

        Map<String, Long> byPriority = new LinkedHashMap<>();
        for (TicketPriority p : TicketPriority.values()) {
            byPriority.put(p.name(), ticketRepository.countByPriority(p));
        }

        Map<String, Long> byCategory = new LinkedHashMap<>();
        for (TicketCategory c : TicketCategory.values()) {
            byCategory.put(c.name(), ticketRepository.countByCategory(c));
        }

        return AnalyticsResponse.builder()
                .totalTickets(ticketRepository.count())
                .openTickets(ticketRepository.countByStatus(TicketStatus.OPEN))
                .inProgressTickets(ticketRepository.countByStatus(TicketStatus.IN_PROGRESS))
                .resolvedTickets(ticketRepository.countByStatus(TicketStatus.RESOLVED))
                .closedTickets(ticketRepository.countByStatus(TicketStatus.CLOSED))
                .ticketsByPriority(byPriority)
                .ticketsByCategory(byCategory)
                .build();
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private Ticket findTicketOrThrow(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", id));
    }

    private void assertCanViewTicket(Ticket ticket, User user) {
        if (user.getRole() == Role.CUSTOMER &&
                !ticket.getCreatedBy().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have access to this ticket");
        }
    }

    private void saveAuditLog(Ticket ticket, User performedBy, AuditAction action,
                               String oldValue, String newValue, String description) {
        AuditLog log = AuditLog.builder()
                .ticket(ticket)
                .performedBy(performedBy)
                .action(action)
                .oldValue(oldValue)
                .newValue(newValue)
                .description(description)
                .build();
        auditLogRepository.save(log);
    }

    private TicketResponse toTicketResponse(Ticket t) {
        return TicketResponse.builder()
                .id(t.getId())
                .title(t.getTitle())
                .description(t.getDescription())
                .status(t.getStatus())
                .priority(t.getPriority())
                .category(t.getCategory())
                .createdBy(UserMapper.toResponse(t.getCreatedBy()))
                .assignedTo(t.getAssignedTo() != null ? UserMapper.toResponse(t.getAssignedTo()) : null)
                .aiSuggestedResponse(t.getAiSuggestedResponse())
                .aiTriaged(t.isAiTriaged())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .commentCount(t.getComments() != null ? t.getComments().size() : 0)
                .build();
    }

    private CommentResponse toCommentResponse(Comment c) {
        return CommentResponse.builder()
                .id(c.getId())
                .content(c.getContent())
                .author(UserMapper.toResponse(c.getAuthor()))
                .ticketId(c.getTicket().getId())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private AuditLogResponse toAuditResponse(AuditLog a) {
        return AuditLogResponse.builder()
                .id(a.getId())
                .action(a.getAction())
                .oldValue(a.getOldValue())
                .newValue(a.getNewValue())
                .description(a.getDescription())
                .performedBy(a.getPerformedBy() != null ? UserMapper.toResponse(a.getPerformedBy()) : null)
                .createdAt(a.getCreatedAt())
                .build();
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }
}
