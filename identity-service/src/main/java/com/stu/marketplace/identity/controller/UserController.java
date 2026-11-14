package com.stu.marketplace.identity.controller;

import com.stu.marketplace.common.dto.ApiResponse;
import com.stu.marketplace.identity.dto.request.UpdateProfileRequest;
import com.stu.marketplace.identity.dto.response.PublicUserProfileResponse;
import com.stu.marketplace.identity.dto.response.UserProfileResponse;
import com.stu.marketplace.identity.security.UserPrincipal;
import com.stu.marketplace.identity.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUser(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        UserProfileResponse response = userService.getProfile(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateCurrentUser(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserProfileResponse response = userService.updateProfile(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    @GetMapping("/{id}/public")
    public ResponseEntity<ApiResponse<PublicUserProfileResponse>> getPublicUserProfile(@PathVariable Long id) {
        PublicUserProfileResponse response = userService.getPublicProfile(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long currentUserId = userPrincipal != null ? userPrincipal.getId() : null;
        boolean isPrivileged = userPrincipal != null && userPrincipal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MODERATOR"));
        UserProfileResponse response = userService.getProfile(id, currentUserId, isPrivileged);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
