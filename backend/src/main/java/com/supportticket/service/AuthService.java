package com.supportticket.service;

import com.supportticket.dto.request.LoginRequest;
import com.supportticket.dto.request.RegisterRequest;
import com.supportticket.dto.response.AuthResponse;
import com.supportticket.dto.response.UserResponse;
import com.supportticket.entity.User;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    UserResponse getCurrentUser(String email);
    User getUserEntityByEmail(String email);
}
