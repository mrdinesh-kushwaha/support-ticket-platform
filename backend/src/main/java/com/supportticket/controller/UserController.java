package com.supportticket.controller;

import com.supportticket.dto.response.UserResponse;
import com.supportticket.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management")
public class UserController {

    private final UserService userService;

    @GetMapping("/agents")
    @PreAuthorize("hasAnyRole('AGENT','ADMIN')")
    @Operation(summary = "Get all agents (for assignment dropdown)")
    public ResponseEntity<List<UserResponse>> getAgents() {
        return ResponseEntity.ok(userService.getAgents());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }
}
