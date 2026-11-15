package com.stu.marketplace.transaction.repository;

import com.stu.marketplace.transaction.entity.Transaction;
import com.stu.marketplace.transaction.entity.TransactionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {

    Optional<Transaction> findByTransactionCode(String transactionCode);

    Page<Transaction> findByBuyerIdOrderByCreatedAtDesc(Long buyerId, Pageable pageable);

    Page<Transaction> findBySellerIdOrderByCreatedAtDesc(Long sellerId, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE (t.buyerId = :userId OR t.sellerId = :userId) ORDER BY t.createdAt DESC")
    Page<Transaction> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE (t.buyerId = :userId OR t.sellerId = :userId) AND t.status = :status ORDER BY t.createdAt DESC")
    Page<Transaction> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") TransactionStatus status, Pageable pageable);

    List<Transaction> findByListingIdOrderByCreatedAtDesc(Long listingId);

    boolean existsByListingIdAndStatusIn(Long listingId, Collection<TransactionStatus> statuses);
}
