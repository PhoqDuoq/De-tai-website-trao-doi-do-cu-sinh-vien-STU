package com.stu.marketplace.interaction.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.interaction.dto.CreateReviewRequest;
import com.stu.marketplace.interaction.dto.PagedResponse;
import com.stu.marketplace.interaction.dto.ReviewResponse;
import com.stu.marketplace.interaction.dto.ReviewSummaryResponse;
import com.stu.marketplace.interaction.entity.Review;
import com.stu.marketplace.interaction.repository.ReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @InjectMocks
    private ReviewService reviewService;

    private Review sampleReview;

    @BeforeEach
    void setUp() {
        sampleReview = Review.builder()
                .id(1L)
                .reviewerId(10L)
                .revieweeId(20L)
                .transactionId(500L)
                .rating(5)
                .comment("Very good student, punctual and polite!")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("submitReview should persist review with valid data")
    void testSubmitReview_Success() {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .revieweeId(20L)
                .transactionId(500L)
                .rating(5)
                .comment("Very good student, punctual and polite!")
                .build();

        when(reviewRepository.existsByReviewerIdAndTransactionId(10L, 500L)).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenReturn(sampleReview);

        ReviewResponse response = reviewService.submitReview(10L, request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getRating()).isEqualTo(5);
        verify(reviewRepository).save(any(Review.class));
    }

    @Test
    @DisplayName("submitReview should throw CANNOT_REVIEW_SELF when reviewer == reviewee")
    void testSubmitReview_SelfReview_ThrowsBadRequest() {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .revieweeId(10L) // same as reviewer
                .transactionId(500L)
                .rating(5)
                .build();

        assertThatThrownBy(() -> reviewService.submitReview(10L, request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CANNOT_REVIEW_SELF);

        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("submitReview should throw REVIEW_ALREADY_SUBMITTED on duplicate review")
    void testSubmitReview_Duplicate_ThrowsConflict() {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .revieweeId(20L)
                .transactionId(500L)
                .rating(5)
                .build();

        when(reviewRepository.existsByReviewerIdAndTransactionId(10L, 500L)).thenReturn(true);

        assertThatThrownBy(() -> reviewService.submitReview(10L, request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.REVIEW_ALREADY_SUBMITTED);

        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("submitReview should throw BAD_REQUEST when rating is out of range 1..5")
    void testSubmitReview_InvalidRating_ThrowsBadRequest() {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .revieweeId(20L)
                .transactionId(500L)
                .rating(6)
                .build();

        assertThatThrownBy(() -> reviewService.submitReview(10L, request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BAD_REQUEST);

        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("getReviewsForUser should return paginated reviews")
    void testGetReviewsForUser_Success() {
        Page<Review> page = new PageImpl<>(List.of(sampleReview), PageRequest.of(0, 10), 1);
        when(reviewRepository.findByRevieweeIdOrderByCreatedAtDesc(eq(20L), any())).thenReturn(page);

        PagedResponse<ReviewResponse> response = reviewService.getReviewsForUser(20L, 0, 10);

        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getRevieweeId()).isEqualTo(20L);
    }

    @Test
    @DisplayName("getReviewSummaryForUser should return average rating and star breakdown")
    void testGetReviewSummaryForUser_Success() {
        when(reviewRepository.findByRevieweeId(20L)).thenReturn(List.of(sampleReview));
        when(reviewRepository.calculateAverageRating(20L)).thenReturn(5.0);

        ReviewSummaryResponse summary = reviewService.getReviewSummaryForUser(20L);

        assertThat(summary.getUserId()).isEqualTo(20L);
        assertThat(summary.getAverageRating()).isEqualTo(5.0);
        assertThat(summary.getTotalReviews()).isEqualTo(1);
        assertThat(summary.getRatingBreakdown().get(5)).isEqualTo(1L);
    }

    @Test
    @DisplayName("getReviewsByTransaction should return all reviews for transaction")
    void testGetReviewsByTransaction_Success() {
        when(reviewRepository.findByTransactionId(500L)).thenReturn(List.of(sampleReview));

        List<ReviewResponse> list = reviewService.getReviewsByTransaction(500L);

        assertThat(list).hasSize(1);
        assertThat(list.get(0).getTransactionId()).isEqualTo(500L);
    }
}
