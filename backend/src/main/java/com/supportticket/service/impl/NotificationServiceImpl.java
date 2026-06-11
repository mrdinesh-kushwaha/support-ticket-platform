package com.supportticket.service.impl;

import com.supportticket.dto.response.NotificationResponse;
import com.supportticket.entity.Notification;
import com.supportticket.entity.User;
import com.supportticket.repository.NotificationRepository;
import com.supportticket.service.AuthService;
import com.supportticket.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final AuthService authService;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public void notifyUser(Long userId, Long ticketId, String title, String message) {
        Notification notification = notificationRepository.save(
                Notification.builder()
                        .userId(userId)
                        .ticketId(ticketId)
                        .title(title)
                        .message(message)
                        .readStatus(false)
                        .build()
        );

        messagingTemplate.convertAndSend(
                "/topic/notifications/" + userId,
                toResponse(notification)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(String email) {
        User user = authService.getUserEntityByEmail(email);
        return notificationRepository.findTop20ByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long unreadCount(String email) {
        User user = authService.getUserEntityByEmail(email);
        return notificationRepository.countByUserIdAndReadStatusFalse(user.getId());
    }

    @Override
    @Transactional
    public void markAllRead(String email) {
        User user = authService.getUserEntityByEmail(email);
        List<Notification> notifications =
                notificationRepository.findTop20ByUserIdOrderByCreatedAtDesc(user.getId());

        notifications.forEach(n -> n.setReadStatus(true));
        notificationRepository.saveAll(notifications);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .ticketId(n.getTicketId())
                .title(n.getTitle())
                .message(n.getMessage())
                .readStatus(n.isReadStatus())
                .createdAt(n.getCreatedAt())
                .build();
    }
}