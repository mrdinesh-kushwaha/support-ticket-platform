package com.supportticket.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private Long id;
    private Long ticketId;
    private String title;
    private String message;
    private boolean readStatus;
    private LocalDateTime createdAt;
}