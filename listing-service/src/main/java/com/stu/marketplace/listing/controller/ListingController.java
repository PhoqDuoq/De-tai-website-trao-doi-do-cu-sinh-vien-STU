package com.stu.marketplace.listing.controller;

import com.stu.marketplace.common.dto.ApiResponse;
import com.stu.marketplace.listing.dto.*;
import com.stu.marketplace.listing.security.UserPrincipal;
import com.stu.marketplace.listing.service.ListingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/listings")
@RequiredArgsConstructor
public class ListingController {

    private final ListingService listingService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ListingResponse>>> searchListings(ListingFilterRequest filter) {
        PagedResponse<ListingResponse> response = listingService.searchListings(filter != null ? filter : new ListingFilterRequest());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ListingDetailResponse>> getListingById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long currentUserId = userPrincipal != null ? userPrincipal.getId() : null;
        boolean isModerator = userPrincipal != null && userPrincipal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MODERATOR"));

        ListingDetailResponse response = listingService.getListingById(id, currentUserId, isModerator);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my-listings")
    public ResponseEntity<ApiResponse<PagedResponse<ListingResponse>>> getMyListings(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PagedResponse<ListingResponse> response = listingService.getMyListings(userPrincipal.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ListingResponse>> createListing(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CreateListingRequest request) {
        ListingResponse response = listingService.createListing(userPrincipal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Listing created successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ListingResponse>> updateListing(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody UpdateListingRequest request) {
        ListingResponse response = listingService.updateListing(id, userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Listing updated successfully", response));
    }

    @PostMapping("/{id}/submit-review")
    public ResponseEntity<ApiResponse<ListingResponse>> submitForReview(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        ListingResponse response = listingService.submitForReview(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Listing submitted for review successfully", response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ListingResponse>> updateSellerStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody ListingStatusUpdateRequest request) {
        ListingResponse response = listingService.updateSellerStatus(id, userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Listing status updated successfully", response));
    }

    @PatchMapping("/{id}/moderate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<ApiResponse<ListingResponse>> moderateListing(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody ListingStatusUpdateRequest request) {
        ListingResponse response = listingService.moderateListing(id, userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Listing moderated successfully", response));
    }
}
