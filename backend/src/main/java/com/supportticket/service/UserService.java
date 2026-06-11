package com.supportticket.service;

import com.supportticket.dto.response.UserResponse;
import com.supportticket.enums.Role;

import java.util.List;

public interface UserService {
    List<UserResponse> getAgents();
    UserResponse getUserById(Long id);
}
