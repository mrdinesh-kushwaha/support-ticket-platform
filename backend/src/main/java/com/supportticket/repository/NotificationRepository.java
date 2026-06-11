package com.supportticket.repository;

import com.supportticket.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findTop20ByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserIdAndReadStatusFalse(Long userId);
}