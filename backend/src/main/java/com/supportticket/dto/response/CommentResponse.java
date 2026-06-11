package com.supportticket.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CommentResponse {
    private Long id;
    private String content;
    private UserResponse author;
    private Long ticketId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
