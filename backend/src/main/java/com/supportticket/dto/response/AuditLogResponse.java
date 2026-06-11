package com.supportticket.dto.response;

import com.supportticket.enums.AuditAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuditLogResponse {
    private Long id;
    private AuditAction action;
    private String oldValue;
    private String newValue;
    private String description;
    private UserResponse performedBy;
    private LocalDateTime createdAt;
}
