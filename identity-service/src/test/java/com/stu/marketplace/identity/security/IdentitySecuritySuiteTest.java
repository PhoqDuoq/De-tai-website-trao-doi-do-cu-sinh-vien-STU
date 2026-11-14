package com.stu.marketplace.identity.security;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.identity.dto.request.ForgotPasswordRequest;
import com.stu.marketplace.identity.dto.request.RefreshTokenRequest;
import com.stu.marketplace.identity.dto.request.RegisterRequest;
import com.stu.marketplace.identity.dto.response.PublicUserProfileResponse;
import com.stu.marketplace.identity.dto.response.UserProfileResponse;
import com.stu.marketplace.identity.entity.*;
import com.stu.marketplace.identity.repository.PasswordResetTokenRepository;
import com.stu.marketplace.identity.repository.RefreshTokenRepository;
import com.stu.marketplace.identity.repository.RoleRepository;
import com.stu.marketplace.identity.repository.UserRepository;
import com.stu.marketplace.identity.service.AuthService;
import com.stu.marketplace.identity.service.UserService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class IdentitySecuritySuiteTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    private JwtTokenProvider tokenProvider;

    private AuthService authService;
    private UserService userService;

    private User activeUser;
    private User lockedUser;
    private Role studentRole;
    private final String secret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider(secret, 3600000L);
        authService = new AuthService(
                userRepository,
                roleRepository,
                refreshTokenRepository,
                passwordResetTokenRepository,
                passwordEncoder,
                authenticationManager,
                tokenProvider
        );
        userService = new UserService(userRepository, authService);

        studentRole = Role.builder().id(1L).code("STUDENT").name("Sinh viên STU").build();
        Set<Role> roles = new HashSet<>();
        roles.add(studentRole);

        activeUser = User.builder()
                .id(10L)
                .email("student10@stu.edu.vn")
                .studentCode("DH52001010")
                .passwordHash("hashed")
                .fullName("Nguyen Van Active")
                .phone("0901234567")
                .accountStatus(AccountStatus.ACTIVE)
                .verificationStatus(VerificationStatus.VERIFIED)
                .roles(roles)
                .createdAt(LocalDateTime.now())
                .build();

        lockedUser = User.builder()
                .id(20L)
                .email("locked@stu.edu.vn")
                .studentCode("DH52002020")
                .passwordHash("hashed")
                .fullName("Nguyen Van Locked")
                .accountStatus(AccountStatus.LOCKED)
                .roles(roles)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("SEC-01: Registration with duplicate studentCode must throw STUDENT_CODE_ALREADY_EXISTS")
    void testRegister_DuplicateStudentCode_ThrowsException() {
        RegisterRequest request = RegisterRequest.builder()
                .email("unique@stu.edu.vn")
                .password("Password123!")
                .fullName("Test")
                .studentCode("DH52001010")
                .build();

        when(userRepository.existsByEmail("unique@stu.edu.vn")).thenReturn(false);
        when(userRepository.existsByStudentCode("DH52001010")).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> authService.register(request));
        assertEquals(ErrorCode.STUDENT_CODE_ALREADY_EXISTS, ex.getErrorCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("SEC-02: Public profile only exposes non-sensitive attributes, no email/phone/studentCode")
    void testPublicProfile_NoPiiExposure() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(activeUser));

        PublicUserProfileResponse publicProfile = userService.getPublicProfile(10L);

        assertNotNull(publicProfile);
        assertEquals(10L, publicProfile.getId());
        assertEquals("Nguyen Van Active", publicProfile.getFullName());
        assertEquals(VerificationStatus.VERIFIED, publicProfile.getVerificationStatus());
    }

    @Test
    @DisplayName("SEC-02: Service-level authorization blocks strangers from accessing private profiles")
    void testPrivateProfile_UnauthorizedStranger_ThrowsForbidden() {
        // Requesting user 99 tries to access private profile of user 10 (not privileged)
        AppException ex = assertThrows(AppException.class, () ->
                userService.getProfile(10L, 99L, false));

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("SEC-02: Privileged admin/moderator can view private profile of any student")
    void testPrivateProfile_AdminAccess_Succeeds() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(activeUser));

        UserProfileResponse response = userService.getProfile(10L, 99L, true);

        assertNotNull(response);
        assertEquals("student10@stu.edu.vn", response.getEmail());
        assertEquals("0901234567", response.getPhone());
    }

    @Test
    @DisplayName("SEC-04: UserPrincipal correctly reflects locked state")
    void testUserPrincipal_LockedAccount_Denied() {
        UserPrincipal principal = UserPrincipal.create(lockedUser);

        assertFalse(principal.isEnabled());
        assertFalse(principal.isAccountNonLocked());
    }

    @Test
    @DisplayName("SEC-04: Tampered JWT token signature is rejected")
    void testJwt_TamperedSignature_Rejected() {
        UserPrincipal principal = UserPrincipal.create(activeUser);
        String validToken = tokenProvider.generateAccessToken(principal);

        // Tamper with the token
        String tamperedToken = validToken.substring(0, validToken.length() - 5) + "ABCDE";

        assertFalse(tokenProvider.validateToken(tamperedToken));
    }

    @Test
    @DisplayName("SEC-04: Expired JWT token is rejected")
    void testJwt_ExpiredToken_Rejected() {
        JwtTokenProvider shortLivedProvider = new JwtTokenProvider(secret, -1000L); // Expired immediately
        UserPrincipal principal = UserPrincipal.create(activeUser);
        String expiredToken = shortLivedProvider.generateAccessToken(principal);

        assertFalse(tokenProvider.validateToken(expiredToken));
    }

    @Test
    @DisplayName("SEC-05: Forgot password with non-existent email returns null without throwing exception")
    void testForgotPassword_NonExistentEmail_ReturnsNullWithoutException() {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email("ghost@stu.edu.vn")
                .build();

        when(userRepository.findByEmail("ghost@stu.edu.vn")).thenReturn(Optional.empty());

        String result = authService.forgotPassword(request);

        assertNull(result);
        verify(passwordResetTokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("SEC-05: Rate limiting prevents spamming password reset tokens within 2 minutes")
    void testForgotPassword_RateLimit_Enforced() {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email("student10@stu.edu.vn")
                .build();

        when(userRepository.findByEmail("student10@stu.edu.vn")).thenReturn(Optional.of(activeUser));

        PasswordResetToken recentToken = PasswordResetToken.builder()
                .id(1L)
                .user(activeUser)
                .tokenHash("hash")
                .createdAt(LocalDateTime.now().minusSeconds(30)) // Created 30 seconds ago
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build();

        when(passwordResetTokenRepository.findTopByUserIdAndUsedAtIsNullOrderByCreatedAtDesc(10L))
                .thenReturn(Optional.of(recentToken));

        String result = authService.forgotPassword(request);

        assertNull(result); // Blocked by rate limiter
        verify(passwordResetTokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("SEC-Edge: Logout revokes all user refresh tokens")
    void testLogout_RevokesAllTokens() {
        authService.logout(10L);

        verify(refreshTokenRepository).revokeAllUserTokens(10L);
    }

    @Test
    @DisplayName("SEC-Edge: Reusing revoked refresh token is rejected")
    void testRefreshToken_RevokedToken_Rejected() {
        RefreshTokenRequest request = RefreshTokenRequest.builder()
                .refreshToken("stale_token")
                .build();

        when(refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(anyString()))
                .thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> authService.refreshToken(request));
        assertEquals(ErrorCode.REFRESH_TOKEN_NOT_FOUND, ex.getErrorCode());
    }
}
