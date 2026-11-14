package com.stu.marketplace.identity.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.identity.dto.request.*;
import com.stu.marketplace.identity.dto.response.AuthResponse;
import com.stu.marketplace.identity.dto.response.UserProfileResponse;
import com.stu.marketplace.identity.entity.*;
import com.stu.marketplace.identity.repository.PasswordResetTokenRepository;
import com.stu.marketplace.identity.repository.RefreshTokenRepository;
import com.stu.marketplace.identity.repository.RoleRepository;
import com.stu.marketplace.identity.repository.UserRepository;
import com.stu.marketplace.identity.security.JwtTokenProvider;
import com.stu.marketplace.identity.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }

        if (StringUtils.hasText(request.getStudentCode()) && userRepository.existsByStudentCode(request.getStudentCode())) {
            throw new AppException(ErrorCode.STUDENT_CODE_ALREADY_EXISTS);
        }

        Role studentRole = roleRepository.findByCode("STUDENT")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .code("STUDENT")
                        .name("Sinh viên STU")
                        .build()));

        User user = User.builder()
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .studentCode(StringUtils.hasText(request.getStudentCode()) ? request.getStudentCode().trim().toUpperCase() : null)
                .phone(request.getPhone())
                .verificationStatus(VerificationStatus.PENDING)
                .accountStatus(AccountStatus.ACTIVE)
                .roles(new HashSet<>(Collections.singletonList(studentRole)))
                .build();

        user = userRepository.save(user);

        UserPrincipal principal = UserPrincipal.create(user);
        String accessToken = tokenProvider.generateAccessToken(principal);
        String rawRefreshToken = tokenProvider.generateRawRefreshToken();

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenProvider.hashToken(rawRefreshToken))
                .expiresAt(LocalDateTime.now().plusDays(30))
                .build();
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .expiresIn(tokenProvider.getExpirationMs() / 1000)
                .user(mapToProfileResponse(user))
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmailOrStudentCode().trim(),
                            request.getPassword()
                    )
            );

            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            User user = userRepository.findById(principal.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            if (user.getAccountStatus() == AccountStatus.SUSPENDED || user.getAccountStatus() == AccountStatus.LOCKED) {
                throw new AppException(ErrorCode.ACCOUNT_SUSPENDED);
            }

            String accessToken = tokenProvider.generateAccessToken(principal);
            String rawRefreshToken = tokenProvider.generateRawRefreshToken();

            refreshTokenRepository.revokeAllUserTokens(user.getId());

            RefreshToken refreshToken = RefreshToken.builder()
                    .user(user)
                    .tokenHash(tokenProvider.hashToken(rawRefreshToken))
                    .expiresAt(LocalDateTime.now().plusDays(30))
                    .build();
            refreshTokenRepository.save(refreshToken);

            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(rawRefreshToken)
                    .expiresIn(tokenProvider.getExpirationMs() / 1000)
                    .user(mapToProfileResponse(user))
                    .build();
        } catch (BadCredentialsException e) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String tokenHash = tokenProvider.hashToken(request.getRefreshToken());
        RefreshToken storedToken = refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(tokenHash)
                .orElseThrow(() -> new AppException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));

        if (storedToken.isExpired()) {
            storedToken.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(storedToken);
            throw new AppException(ErrorCode.TOKEN_EXPIRED);
        }

        User user = storedToken.getUser();
        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new AppException(ErrorCode.ACCOUNT_SUSPENDED);
        }

        // Token rotation: revoke current token
        storedToken.setRevokedAt(LocalDateTime.now());
        refreshTokenRepository.save(storedToken);

        UserPrincipal principal = UserPrincipal.create(user);
        String newAccessToken = tokenProvider.generateAccessToken(principal);
        String newRawRefreshToken = tokenProvider.generateRawRefreshToken();

        RefreshToken newRefreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenProvider.hashToken(newRawRefreshToken))
                .expiresAt(LocalDateTime.now().plusDays(30))
                .build();
        refreshTokenRepository.save(newRefreshToken);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRawRefreshToken)
                .expiresIn(tokenProvider.getExpirationMs() / 1000)
                .user(mapToProfileResponse(user))
                .build();
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.revokeAllUserTokens(userId);
    }

    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String rawToken = tokenProvider.generateRawRefreshToken();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .tokenHash(tokenProvider.hashToken(rawToken))
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build();

        passwordResetTokenRepository.save(resetToken);
        log.info("Password reset token generated for user {}: {}", user.getEmail(), rawToken);
        return rawToken;
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String tokenHash = tokenProvider.hashToken(request.getToken());
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHashAndUsedAtIsNull(tokenHash)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_RESET_TOKEN));

        if (resetToken.isExpired()) {
            throw new AppException(ErrorCode.INVALID_RESET_TOKEN);
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(resetToken);

        // Invalidate all existing refresh tokens
        refreshTokenRepository.revokeAllUserTokens(user.getId());
    }

    public UserProfileResponse mapToProfileResponse(User user) {
        Set<String> roles = user.getRoles().stream()
                .map(Role::getCode)
                .collect(Collectors.toSet());

        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .studentCode(user.getStudentCode())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .verificationStatus(user.getVerificationStatus())
                .accountStatus(user.getAccountStatus())
                .verifiedAt(user.getVerifiedAt())
                .createdAt(user.getCreatedAt())
                .roles(roles)
                .build();
    }
}
