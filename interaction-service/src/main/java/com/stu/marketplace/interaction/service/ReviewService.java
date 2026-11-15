package com.stu.marketplace.interaction.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.interaction.dto.CreateReviewRequest;
import com.stu.marketplace.interaction.dto.PagedResponse;
import com.stu.marketplace.interaction.dto.ReviewResponse;
import com.stu.marketplace.interaction.dto.ReviewSummaryResponse;
import com.stu.marketplace.interaction.entity.Review;
import com.stu.marketplace.interaction.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;

    @Transactional
    public ReviewResponse submitReview(Long reviewerId, CreateReviewRequest request) {
        if (reviewerId.equals(request.getRevieweeId())) {
            throw new AppException(ErrorCode.CANNOT_REVIEW_SELF);
        }

        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Rating must be between 1 and 5");
        }

        if (reviewRepository.existsByReviewerIdAndTransactionId(reviewerId, request.getTransactionId())) {
            throw new AppException(ErrorCode.REVIEW_ALREADY_SUBMITTED);
        }

        Review review = Review.builder()
                .reviewerId(reviewerId)
                .revieweeId(request.getRevieweeId())
                .transactionId(request.getTransactionId())
                .rating(request.getRating())
                .comment(request.getComment() != null ? request.getComment().trim() : null)
                .build();

        Review saved = reviewRepository.save(review);
        log.info("User {} reviewed user {} on transaction {} with {} stars",
                reviewerId, request.getRevieweeId(), request.getTransactionId(), request.getRating());
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ReviewResponse> getReviewsForUser(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Review> reviewPage = reviewRepository.findByRevieweeIdOrderByCreatedAtDesc(userId, pageable);

        List<ReviewResponse> content = reviewPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PagedResponse.<ReviewResponse>builder()
                .content(content)
                .page(reviewPage.getNumber())
                .size(reviewPage.getSize())
                .totalElements(reviewPage.getTotalElements())
                .totalPages(reviewPage.getTotalPages())
                .last(reviewPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public ReviewSummaryResponse getReviewSummaryForUser(Long userId) {
        List<Review> reviews = reviewRepository.findByRevieweeId(userId);

        Map<Integer, Long> breakdown = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            breakdown.put(i, 0L);
        }

        for (Review r : reviews) {
            int rating = r.getRating();
            breakdown.put(rating, breakdown.getOrDefault(rating, 0L) + 1);
        }

        Double avg = reviewRepository.calculateAverageRating(userId);
        Double roundedAvg = 0.0;
        if (avg != null) {
            roundedAvg = BigDecimal.valueOf(avg).setScale(1, RoundingMode.HALF_UP).doubleValue();
        }

        return ReviewSummaryResponse.builder()
                .userId(userId)
                .averageRating(roundedAvg)
                .totalReviews(reviews.size())
                .ratingBreakdown(breakdown)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByTransaction(Long transactionId) {
        return reviewRepository.findByTransactionId(transactionId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ReviewResponse mapToResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .reviewerId(review.getRevieweeId().equals(review.getReviewerId()) ? review.getReviewerId() : review.getReviewerId())
                .revieweeId(review.getRevieweeId())
                .transactionId(review.getTransactionId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
