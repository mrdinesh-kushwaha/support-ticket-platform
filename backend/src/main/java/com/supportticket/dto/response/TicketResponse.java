package com.supportticket.dto.response;

import com.supportticket.enums.TicketCategory;
import com.supportticket.enums.TicketPriority;
import com.supportticket.enums.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TicketResponse {
    private Long id;
    private String title;
    private String description;
    private TicketStatus status;
    private TicketPriority priority;
    private TicketCategory category;
    private UserResponse createdBy;
    private UserResponse assignedTo;
    private String aiSuggestedResponse;
    private boolean aiTriaged;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long commentCount;
}
