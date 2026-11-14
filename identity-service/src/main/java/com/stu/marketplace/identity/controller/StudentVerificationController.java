package com.stu.marketplace.identity.controller;

import com.stu.marketplace.common.dto.ApiResponse;
import com.stu.marketplace.identity.dto.request.StudentVerificationRequest;
import com.stu.marketplace.identity.dto.request.VerificationReviewRequest;
import com.stu.marketplace.identity.dto.response.StudentVerificationResponse;
import com.stu.marketplace.identity.security.UserPrincipal;
import com.stu.marketplace.identity.service.StudentVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
public class StudentVerificationController {

    private final StudentVerificationService verificationService;

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<StudentVerificationResponse>> submitVerification(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody StudentVerificationRequest request) {
        StudentVerificationResponse response = verificationService.submitVerification(userPrincipal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Verification request submitted successfully", response));
    }

    @GetMapping("/my-verifications")
    public ResponseEntity<ApiResponse<List<StudentVerificationResponse>>> getMyVerifications(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<StudentVerificationResponse> list = verificationService.getUserVerifications(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/verifications")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<ApiResponse<List<StudentVerificationResponse>>> getPendingVerifications() {
        List<StudentVerificationResponse> list = verificationService.getPendingVerifications();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PatchMapping("/verifications/{id}/review")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<ApiResponse<StudentVerificationResponse>> reviewVerification(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody VerificationReviewRequest request) {
        StudentVerificationResponse response = verificationService.reviewVerification(id, userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Verification reviewed successfully", response));
    }
}
