package com.supportticket.controller;

import com.supportticket.dto.request.AddCommentRequest;
import com.supportticket.dto.request.CreateTicketRequest;
import com.supportticket.dto.request.UpdateTicketRequest;
import com.supportticket.dto.response.*;
import com.supportticket.enums.TicketCategory;
import com.supportticket.enums.TicketPriority;
import com.supportticket.enums.TicketStatus;
import com.supportticket.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@Tag(name = "Tickets", description = "Ticket management endpoints")
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    @Operation(summary = "Create a new ticket (AI triage runs automatically)")
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @RequestBody CreateTicketRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.createTicket(request, userDetails.getUsername()));
    }

    @GetMapping
    @Operation(summary = "Get tickets — customers see own; agents see all. Supports search, filter & pagination")
    public ResponseEntity<PageResponse<TicketResponse>> getTickets(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketPriority priority,
            @RequestParam(required = false) TicketCategory category,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal UserDetails userDetails) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), sort);

        return ResponseEntity.ok(ticketService.getTickets(
                search, status, priority, category, assigneeId, pageable, userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single ticket by ID")
    public ResponseEntity<TicketResponse> getTicketById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ticketService.getTicketById(id, userDetails.getUsername()));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update ticket (agents only) — status, priority, category, assignment")
    public ResponseEntity<TicketResponse> updateTicket(
            @PathVariable Long id,
            @RequestBody UpdateTicketRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ticketService.updateTicket(id, request, userDetails.getUsername()));
    }

    @PostMapping("/{id}/comments")
    @Operation(summary = "Add a comment to a ticket")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long id,
            @Valid @RequestBody AddCommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.addComment(id, request, userDetails.getUsername()));
    }

    @GetMapping("/{id}/comments")
    @Operation(summary = "Get paginated comments for a ticket")
    public ResponseEntity<PageResponse<CommentResponse>> getComments(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100),
                Sort.by("createdAt").ascending());
        return ResponseEntity.ok(ticketService.getComments(id, pageable, userDetails.getUsername()));
    }

    @GetMapping("/{id}/audit-logs")
    @Operation(summary = "Get audit trail for a ticket")
    public ResponseEntity<List<AuditLogResponse>> getAuditLogs(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ticketService.getAuditLogs(id, userDetails.getUsername()));
    }

    @GetMapping("/analytics")
    @Operation(summary = "Get ticket analytics (agents only)")
    public ResponseEntity<AnalyticsResponse> getAnalytics(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ticketService.getAnalytics(userDetails.getUsername()));
    }
}
