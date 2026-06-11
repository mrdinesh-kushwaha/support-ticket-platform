package com.supportticket.repository;

import com.supportticket.entity.Ticket;
import com.supportticket.entity.User;
import com.supportticket.enums.TicketCategory;
import com.supportticket.enums.TicketPriority;
import com.supportticket.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    // Agent: all tickets with optional filters
    @Query("""
        SELECT t FROM Ticket t
        WHERE (:search IS NULL OR :search = ''
               OR LOWER(t.title) LIKE LOWER(CONCAT('%',:search,'%'))
               OR LOWER(t.description) LIKE LOWER(CONCAT('%',:search,'%')))
          AND (:status   IS NULL OR t.status   = :status)
          AND (:priority IS NULL OR t.priority = :priority)
          AND (:category IS NULL OR t.category = :category)
          AND (:assigneeId IS NULL OR t.assignedTo.id = :assigneeId)
        """)
    Page<Ticket> findAllWithFilters(
            @Param("search")     String search,
            @Param("status")     TicketStatus status,
            @Param("priority")   TicketPriority priority,
            @Param("category")   TicketCategory category,
            @Param("assigneeId") Long assigneeId,
            Pageable pageable);

    // Customer: own tickets with optional filters
    @Query("""
        SELECT t FROM Ticket t
        WHERE t.createdBy = :user
          AND (:search IS NULL OR :search = ''
               OR LOWER(t.title) LIKE LOWER(CONCAT('%',:search,'%'))
               OR LOWER(t.description) LIKE LOWER(CONCAT('%',:search,'%')))
          AND (:status   IS NULL OR t.status   = :status)
          AND (:priority IS NULL OR t.priority = :priority)
          AND (:category IS NULL OR t.category = :category)
        """)
    Page<Ticket> findByCreatedByWithFilters(
            @Param("user")     User user,
            @Param("search")   String search,
            @Param("status")   TicketStatus status,
            @Param("priority") TicketPriority priority,
            @Param("category") TicketCategory category,
            Pageable pageable);

    long countByStatus(TicketStatus status);
    long countByPriority(TicketPriority priority);
    long countByCategory(TicketCategory category);
}
