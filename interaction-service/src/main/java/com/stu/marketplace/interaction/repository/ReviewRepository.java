package com.stu.marketplace.interaction.repository;

import com.stu.marketplace.interaction.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Optional<Review> findByReviewerIdAndTransactionId(Long reviewerId, Long transactionId);

    boolean existsByReviewerIdAndTransactionId(Long reviewerId, Long transactionId);

    Page<Review> findByRevieweeIdOrderByCreatedAtDesc(Long revieweeId, Pageable pageable);

    List<Review> findByRevieweeId(Long revieweeId);

    List<Review> findByTransactionId(Long transactionId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.revieweeId = :revieweeId")
    Double calculateAverageRating(@Param("revieweeId") Long revieweeId);

    long countByRevieweeId(Long revieweeId);
}
