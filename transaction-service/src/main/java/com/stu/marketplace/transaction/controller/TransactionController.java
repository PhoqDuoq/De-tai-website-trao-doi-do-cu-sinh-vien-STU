package com.stu.marketplace.transaction.controller;

import com.stu.marketplace.common.dto.ApiResponse;
import com.stu.marketplace.transaction.dto.*;
import com.stu.marketplace.transaction.entity.TransactionStatus;
import com.stu.marketplace.transaction.security.UserPrincipal;
import com.stu.marketplace.transaction.service.TransactionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    public ResponseEntity<ApiResponse<TransactionResponse>> createProposal(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody TransactionProposalRequest request) {
        TransactionResponse response = transactionService.createProposal(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransactionById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        boolean isStaff = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MODERATOR"));
        TransactionResponse response = transactionService.getTransactionById(principal.getId(), isStaff, id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my-transactions")
    public ResponseEntity<ApiResponse<PagedResponse<TransactionResponse>>> getMyTransactions(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "ALL") String role,
            @RequestParam(required = false) TransactionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PagedResponse<TransactionResponse> response = transactionService.getMyTransactions(principal.getId(), role, status, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<ApiResponse<List<TimelineResponse>>> getTransactionTimeline(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        boolean isStaff = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MODERATOR"));
        List<TimelineResponse> response = transactionService.getTransactionTimeline(principal.getId(), isStaff, id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/accept")
    public ResponseEntity<ApiResponse<TransactionResponse>> acceptProposal(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody(required = false) TransactionAcceptRequest request) {
        TransactionResponse response = transactionService.acceptProposal(principal.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Transaction proposal accepted successfully", response));
    }

    @PatchMapping("/{id}/meetup")
    public ResponseEntity<ApiResponse<TransactionResponse>> scheduleMeetup(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody MeetupScheduleRequest request) {
        TransactionResponse response = transactionService.scheduleMeetup(principal.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Meetup appointment scheduled successfully", response));
    }

    @PatchMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<TransactionResponse>> confirmTransaction(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody(required = false) TransactionConfirmRequest request,
            HttpServletRequest httpRequest) {
        String authToken = httpRequest.getHeader("Authorization");
        TransactionResponse response = transactionService.confirmTransaction(principal.getId(), id, request, authToken);
        return ResponseEntity.ok(ApiResponse.success("Transaction confirmation processed", response));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<TransactionResponse>> cancelTransaction(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody TransactionCancelRequest request) {
        TransactionResponse response = transactionService.cancelTransaction(principal.getId(), principal.getAuthorities(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Transaction cancelled successfully", response));
    }

    @PatchMapping("/{id}/dispute")
    public ResponseEntity<ApiResponse<TransactionResponse>> disputeTransaction(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody TransactionDisputeRequest request) {
        TransactionResponse response = transactionService.disputeTransaction(principal.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Transaction marked as disputed", response));
    }

    @GetMapping("/campus-locations")
    public ResponseEntity<ApiResponse<List<CampusLocationDto>>> getCampusLocations() {
        List<CampusLocationDto> locations = transactionService.getCampusLocations();
        return ResponseEntity.ok(ApiResponse.success(locations));
    }
}
