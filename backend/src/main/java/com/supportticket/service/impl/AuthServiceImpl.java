package com.supportticket.service.impl;

import com.supportticket.dto.request.LoginRequest;
import com.supportticket.dto.request.RegisterRequest;
import com.supportticket.dto.response.AuthResponse;
import com.supportticket.dto.response.UserResponse;
import com.supportticket.entity.User;
import com.supportticket.enums.Role;
import com.supportticket.exception.BadRequestException;
import com.supportticket.exception.ResourceNotFoundException;
import com.supportticket.repository.UserRepository;
import com.supportticket.security.service.JwtService;
import com.supportticket.service.AuthService;
import com.supportticket.util.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new BadRequestException("Email is already registered: " + request.getEmail());
        }

        Role role = Role.CUSTOMER;
     
        User user = User.builder()
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .role(role)
                .enabled(true)
                .build();

        userRepository.save(user);
        log.info("Registered new user: {} ({})", user.getEmail(), user.getRole());

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(userDetails);

        return buildAuthResponse(user, token);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword()));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .authorities("ROLE_" + user.getRole().name())
                .disabled(!user.isEnabled())
                .build();

        String token = jwtService.generateToken(userDetails);

        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(user, token);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = getUserEntityByEmail(email);
        return UserMapper.toResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public User getUserEntityByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }
}
