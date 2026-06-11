package com.supportticket.service;

import com.supportticket.dto.request.AddCommentRequest;
import com.supportticket.dto.request.CreateTicketRequest;
import com.supportticket.dto.request.UpdateTicketRequest;
import com.supportticket.dto.response.*;
import com.supportticket.enums.TicketCategory;
import com.supportticket.enums.TicketPriority;
import com.supportticket.enums.TicketStatus;
import org.springframework.data.domain.Pageable;

public interface TicketService {

    TicketResponse createTicket(CreateTicketRequest request, String userEmail);

    PageResponse<TicketResponse> getTickets(
            String search, TicketStatus status, TicketPriority priority,
            TicketCategory category, Long assigneeId, Pageable pageable, String userEmail);

    TicketResponse getTicketById(Long id, String userEmail);

    TicketResponse updateTicket(Long id, UpdateTicketRequest request, String userEmail);

    CommentResponse addComment(Long ticketId, AddCommentRequest request, String userEmail);

    PageResponse<CommentResponse> getComments(Long ticketId, Pageable pageable, String userEmail);

    java.util.List<AuditLogResponse> getAuditLogs(Long ticketId, String userEmail);

    AnalyticsResponse getAnalytics(String userEmail);
}
