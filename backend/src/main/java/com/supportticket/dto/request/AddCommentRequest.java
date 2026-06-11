package com.supportticket.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AddCommentRequest {

    @NotBlank(message = "Comment content is required")
    @Size(min = 1, max = 5000, message = "Comment must be 1–5000 characters")
    private String content;
}
