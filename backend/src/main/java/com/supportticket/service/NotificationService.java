package com.supportticket.service;

import com.supportticket.dto.response.NotificationResponse;

import java.util.List;

public interface NotificationService {
    void notifyUser(Long userId, Long ticketId, String title, String message);
    List<NotificationResponse> getMyNotifications(String email);
    long unreadCount(String email);
    void markAllRead(String email);
}