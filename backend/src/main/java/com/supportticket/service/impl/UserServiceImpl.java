package com.supportticket.service.impl;

import com.supportticket.dto.response.UserResponse;
import com.supportticket.enums.Role;
import com.supportticket.exception.ResourceNotFoundException;
import com.supportticket.repository.UserRepository;
import com.supportticket.service.UserService;
import com.supportticket.util.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAgents() {
        return userRepository.findByRoleIn(List.of(Role.AGENT, Role.ADMIN))
                .stream()
                .map(UserMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        return userRepository.findById(id)
                .map(UserMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }
}
