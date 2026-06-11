package com.supportticket.config;

import com.supportticket.entity.User;
import com.supportticket.enums.Role;
import com.supportticket.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("prod")          // ← prod profile pe hi chalega
@RequiredArgsConstructor
@Slf4j
public class ProdDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedUserIfNotExists("agent1@example.com",   "Dinesh Agent",    Role.AGENT);
        seedUserIfNotExists("agent2@example.com",   "Syra Agent",      Role.AGENT);
        seedUserIfNotExists("customer1@example.com","Neha Customer",Role.CUSTOMER);
        seedUserIfNotExists("admin@example.com",    "Admin User",     Role.ADMIN);
        log.info("=== Demo users ready ===");
    }

    private void seedUserIfNotExists(String email, String name, Role role) {
        if (userRepository.existsByEmail(email)) {
            log.info("User already exists, skipping: {}", email);
            return;
        }
        User user = User.builder()
                .email(email)
                .fullName(name)
                .password(passwordEncoder.encode("password123"))
                .role(role)
                .enabled(true)
                .build();
        userRepository.save(user);
        log.info("Created demo user: {} ({})", email, role);
    }
}