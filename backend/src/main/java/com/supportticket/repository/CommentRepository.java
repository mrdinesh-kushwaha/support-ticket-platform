package com.supportticket.repository;

import com.supportticket.entity.Comment;
import com.supportticket.entity.Ticket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    Page<Comment> findByTicketOrderByCreatedAtAsc(Ticket ticket, Pageable pageable);
}
