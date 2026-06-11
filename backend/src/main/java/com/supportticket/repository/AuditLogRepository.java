package com.supportticket.repository;

import com.supportticket.entity.AuditLog;
import com.supportticket.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByTicketOrderByCreatedAtAsc(Ticket ticket);
}
