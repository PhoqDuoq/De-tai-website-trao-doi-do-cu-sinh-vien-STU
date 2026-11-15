package com.stu.marketplace.interaction.controller;

import com.stu.marketplace.common.dto.ApiResponse;
import com.stu.marketplace.interaction.dto.*;
import com.stu.marketplace.interaction.security.UserPrincipal;
import com.stu.marketplace.interaction.service.FavoriteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @PostMapping
    public ResponseEntity<ApiResponse<FavoriteResponse>> addFavorite(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody FavoriteRequest request) {
        FavoriteResponse response = favoriteService.addFavorite(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response));
    }

    @PostMapping("/toggle")
    public ResponseEntity<ApiResponse<FavoriteToggleResponse>> toggleFavorite(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody FavoriteRequest request) {
        FavoriteToggleResponse response = favoriteService.toggleFavorite(principal.getId(), request.getListingId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{listingId}")
    public ResponseEntity<ApiResponse<Void>> removeFavorite(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long listingId) {
        favoriteService.removeFavorite(principal.getId(), listingId);
        return ResponseEntity.ok(ApiResponse.success("Listing removed from favorites", null));
    }

    @GetMapping("/my-favorites")
    public ResponseEntity<ApiResponse<PagedResponse<FavoriteResponse>>> getMyFavorites(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PagedResponse<FavoriteResponse> response = favoriteService.getMyFavorites(principal.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/check/{listingId}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkFavorite(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long listingId) {
        boolean favorited = favoriteService.isFavorited(principal.getId(), listingId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("favorited", favorited)));
    }

    @GetMapping("/count/{listingId}")
    public ResponseEntity<ApiResponse<FavoriteCountResponse>> getFavoriteCount(@PathVariable Long listingId) {
        FavoriteCountResponse response = favoriteService.getFavoriteCount(listingId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
