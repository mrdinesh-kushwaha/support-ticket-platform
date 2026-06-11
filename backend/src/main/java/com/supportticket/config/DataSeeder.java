package com.supportticket.config;

import com.supportticket.entity.*;
import com.supportticket.enums.*;
import com.supportticket.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile({"dev", "prod"})
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

     private static final String DEFAULT_AI_RESPONSE =
            "Hi,\n\n" +
            "Thank you for contacting SupportPro. We have received your request and our support team is currently reviewing the issue.\n\n" +
            "We understand that this may be important for you, and we will work on resolving it as quickly as possible. " +
            "If we need any additional information, we will contact you here on this ticket.\n\n" +
            "Thank you for your patience.\n\n" +
            "Best regards,\n" +
            "Support Team";

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final CommentRepository commentRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties appProperties;

    @Override
    @Transactional
    public void run(String... args) {
        if (!appProperties.getInit().isSampleData()) return;
        if (userRepository.count() > 0) {
            log.info("Sample data already exists, skipping seed");
            return;
        }
        

        log.info("=== Seeding sample data ===");

        // Create users
        User admin = createUser("admin@example.com", "Admin User", Role.ADMIN);
        User agent1 = createUser("agent1@example.com", "Dinesh", Role.AGENT);
        User agent2 = createUser("agent2@example.com", "Syra", Role.AGENT);
        User customer1 = createUser("customer1@example.com", "Neha", Role.CUSTOMER);
        User customer2 = createUser("customer2@example.com", "Ram", Role.CUSTOMER);

        log.info("Created 5 users. Credentials: password = 'password123' for all");

        // Create tickets
        Ticket t1 = createTicket(customer1, "Cannot login to my account",
                "I have been trying to login for the past 2 hours but keep getting 'Invalid credentials' error. I am sure my password is correct as I just reset it.",
                TicketStatus.OPEN, TicketPriority.HIGH, TicketCategory.ACCOUNT_ACCESS, agent1,
                "Thank you for reporting this account access issue. Our security team will investigate your login problem and restore access within 2 hours.");

        Ticket t2 = createTicket(customer1, "Incorrect charge on my invoice",
                "I was charged $99 on November 1st but my plan is only $49/month. Please review and refund the difference.",
                TicketStatus.IN_PROGRESS, TicketPriority.HIGH, TicketCategory.BILLING, agent2,
                "We sincerely apologize for the billing discrepancy. Our billing team has been notified and will review your account to issue a refund within 1 business day.");

        Ticket t3 = createTicket(customer2, "App crashes when uploading files",
                "Every time I try to upload a PDF file larger than 5MB the application crashes and shows a white screen. This happens on Chrome and Firefox.",
                TicketStatus.OPEN, TicketPriority.CRITICAL, TicketCategory.TECHNICAL_ISSUE, null,
                "Thank you for reporting this critical bug. Our engineering team has been alerted and is actively investigating the file upload crash issue.");

        Ticket t4 = createTicket(customer2, "Add dark mode feature",
        "It would be great if you could add a dark mode option to the app. Many users work at night and it would reduce eye strain.",
        TicketStatus.OPEN, TicketPriority.LOW, TicketCategory.FEATURE_REQUEST, null,
        DEFAULT_AI_RESPONSE);

        Ticket t5 = createTicket(customer1, "How to export my data?",
                "I need to export all my data from the platform. Is there a way to do this in bulk? I couldn't find any export option in the settings.",
                TicketStatus.RESOLVED, TicketPriority.MEDIUM, TicketCategory.GENERAL_INQUIRY, agent1,
                "You can export your data by navigating to Settings > Data Management > Export. Select your desired format and date range, then click 'Export'. You'll receive an email with the download link.");

        // Add comments
        addComment(t1, agent1, "I've checked your account. There seems to be an IP block. I'm lifting it now.");
        addComment(t1, customer1, "Thank you! I can login now. What caused the block?");
        addComment(t1, agent1, "It was triggered by 5 failed login attempts from a new device. I've whitelisted your current IP.");

        addComment(t2, agent2, "Confirmed the billing error. Processing refund of $50 now.");
        addComment(t2, customer1, "Thank you for the quick response!");

        addComment(t3, customer2, "This is urgent - I need to submit reports by end of day!");
        addComment(t3, agent1, "We've identified the issue. A fix is being deployed. ETA 1 hour.");

        addComment(t5, agent1, "The export feature is under Settings > Data Management > Export.");
        addComment(t5, customer1, "Found it! Thank you so much.");

        // Audit logs
        saveAudit(t2, agent2, AuditAction.ASSIGNED, null, "Bob Agent", "Bob Agent picked up ticket");
        saveAudit(t2, agent2, AuditAction.STATUS_CHANGED, "OPEN", "IN_PROGRESS", "Agent started working on billing issue");
        saveAudit(t5, agent1, AuditAction.STATUS_CHANGED, "IN_PROGRESS", "RESOLVED", "Issue resolved — export instructions provided");

        log.info("=== Sample data seeded successfully ===");
        log.info("Login credentials (password: password123):");
        log.info("  Admin  : admin@example.com");
        log.info("  Agent  : agent1@example.com / agent2@example.com");
        log.info("  Customer: customer1@example.com / customer2@example.com");
    }

    private User createUser(String email, String name, Role role) {
        User u = User.builder()
                .email(email)
                .fullName(name)
                .password(passwordEncoder.encode("password123"))
                .role(role)
                .enabled(true)
                .build();
        return userRepository.save(u);
    }

    private Ticket createTicket(User createdBy, String title, String description,
                                 TicketStatus status, TicketPriority priority,
                                 TicketCategory category, User assignedTo, String aiResponse) {
        Ticket t = Ticket.builder()
                .title(title)
                .description(description)
                .status(status)
                .priority(priority)
                .category(category)
                .createdBy(createdBy)
                .assignedTo(assignedTo)
                .aiSuggestedResponse(aiResponse)
                .aiTriaged(true)
                .build();
        t = ticketRepository.save(t);
        saveAudit(t, createdBy, AuditAction.TICKET_CREATED, null, null, "Ticket created");
        saveAudit(t, createdBy, AuditAction.AI_TRIAGE_COMPLETED, null,
                category.name() + " / " + priority.name(), "AI triage completed");
        return t;
    }

    private void addComment(Ticket ticket, User author, String content) {
        if (ticket.getStatus() == TicketStatus.CLOSED) {
    throw new IllegalStateException("Cannot add message to a closed ticket");
}
        Comment c = Comment.builder()
                .ticket(ticket)
                .author(author)
                .content(content)
                .build();
        commentRepository.save(c);
        saveAudit(ticket, author, AuditAction.COMMENT_ADDED, null, null,
                author.getFullName() + " added a comment");
    }

    private void saveAudit(Ticket ticket, User by, AuditAction action,
                            String oldVal, String newVal, String desc) {
        auditLogRepository.save(AuditLog.builder()
                .ticket(ticket).performedBy(by).action(action)
                .oldValue(oldVal).newValue(newVal).description(desc)
                .build());
    }
}
