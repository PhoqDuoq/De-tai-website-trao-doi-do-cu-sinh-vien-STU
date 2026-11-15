package com.stu.marketplace.interaction.controller;

import com.stu.marketplace.common.dto.ApiResponse;
import com.stu.marketplace.interaction.dto.*;
import com.stu.marketplace.interaction.security.UserPrincipal;
import com.stu.marketplace.interaction.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReviewResponse>> submitReview(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateReviewRequest request) {
        ReviewResponse response = reviewService.submitReview(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<PagedResponse<ReviewResponse>>> getReviewsForUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PagedResponse<ReviewResponse> response = reviewService.getReviewsForUser(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/user/{userId}/summary")
    public ResponseEntity<ApiResponse<ReviewSummaryResponse>> getReviewSummaryForUser(@PathVariable Long userId) {
        ReviewSummaryResponse response = reviewService.getReviewSummaryForUser(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getReviewsByTransaction(@PathVariable Long transactionId) {
        List<ReviewResponse> response = reviewService.getReviewsByTransaction(transactionId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
