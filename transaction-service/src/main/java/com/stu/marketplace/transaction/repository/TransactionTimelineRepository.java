package com.stu.marketplace.transaction.repository;

import com.stu.marketplace.transaction.entity.TransactionStatus;
import com.stu.marketplace.transaction.entity.TransactionTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionTimelineRepository extends JpaRepository<TransactionTimeline, Long> {

    List<TransactionTimeline> findByTransactionIdOrderByCreatedAtAsc(Long transactionId);

    boolean existsByTransactionIdAndActorIdAndStatus(Long transactionId, Long actorId, TransactionStatus status);

    boolean existsByTransactionIdAndActorIdAndNoteStartingWith(Long transactionId, Long actorId, String prefix);
}
