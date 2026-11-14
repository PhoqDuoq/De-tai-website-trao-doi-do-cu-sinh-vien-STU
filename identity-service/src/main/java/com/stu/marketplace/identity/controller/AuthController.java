package com.stu.marketplace.identity.controller;

import com.stu.marketplace.common.dto.ApiResponse;
import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.identity.dto.request.*;
import com.stu.marketplace.identity.dto.response.AuthResponse;
import com.stu.marketplace.identity.dto.response.UserProfileResponse;
import com.stu.marketplace.identity.security.UserPrincipal;
import com.stu.marketplace.identity.service.AuthService;
import com.stu.marketplace.identity.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal != null) {
            authService.logout(userPrincipal.getId());
        }
        return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        UserProfileResponse response = userService.getProfile(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success("If the account exists, a reset link has been dispatched", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password has been reset successfully", null));
    }
}
