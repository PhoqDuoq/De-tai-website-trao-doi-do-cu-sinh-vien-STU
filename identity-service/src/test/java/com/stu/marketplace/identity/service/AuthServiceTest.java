package com.stu.marketplace.identity.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.identity.dto.request.LoginRequest;
import com.stu.marketplace.identity.dto.request.RefreshTokenRequest;
import com.stu.marketplace.identity.dto.request.RegisterRequest;
import com.stu.marketplace.identity.dto.response.AuthResponse;
import com.stu.marketplace.identity.entity.*;
import com.stu.marketplace.identity.repository.PasswordResetTokenRepository;
import com.stu.marketplace.identity.repository.RefreshTokenRepository;
import com.stu.marketplace.identity.repository.RoleRepository;
import com.stu.marketplace.identity.repository.UserRepository;
import com.stu.marketplace.identity.security.JwtTokenProvider;
import com.stu.marketplace.identity.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

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

    @Mock
    private JwtTokenProvider tokenProvider;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;
    private Role studentRole;

    @BeforeEach
    void setUp() {
        studentRole = Role.builder().id(1L).code("STUDENT").name("Sinh viên STU").build();
        Set<Role> roles = new HashSet<>();
        roles.add(studentRole);

        sampleUser = User.builder()
                .id(1L)
                .email("student@stu.edu.vn")
                .passwordHash("hashed_password")
                .studentCode("DH52001234")
                .fullName("Nguyen Van A")
                .phone("0901234567")
                .verificationStatus(VerificationStatus.PENDING)
                .accountStatus(AccountStatus.ACTIVE)
                .roles(roles)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should successfully register a new student user")
    void testRegister_Success() {
        RegisterRequest request = RegisterRequest.builder()
                .email("student@stu.edu.vn")
                .password("Password123!")
                .fullName("Nguyen Van A")
                .studentCode("DH52001234")
                .phone("0901234567")
                .build();

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByStudentCode(anyString())).thenReturn(false);
        when(roleRepository.findByCode("STUDENT")).thenReturn(Optional.of(studentRole));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(tokenProvider.generateAccessToken(any(UserPrincipal.class))).thenReturn("access_token_jwt");
        when(tokenProvider.generateRawRefreshToken()).thenReturn("raw_refresh_token");
        when(tokenProvider.hashToken(anyString())).thenReturn("hashed_refresh_token");
        when(tokenProvider.getExpirationMs()).thenReturn(86400000L);

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("access_token_jwt", response.getAccessToken());
        assertEquals("raw_refresh_token", response.getRefreshToken());
        assertEquals("student@stu.edu.vn", response.getUser().getEmail());
        assertEquals("DH52001234", response.getUser().getStudentCode());

        verify(userRepository).save(any(User.class));
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Should throw AppException when registering with existing email")
    void testRegister_DuplicateEmail() {
        RegisterRequest request = RegisterRequest.builder()
                .email("student@stu.edu.vn")
                .password("Password123!")
                .fullName("Nguyen Van A")
                .build();

        when(userRepository.existsByEmail("student@stu.edu.vn")).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> authService.register(request));
        assertEquals(ErrorCode.USER_ALREADY_EXISTS, ex.getErrorCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should successfully authenticate user and return tokens")
    void testLogin_Success() {
        LoginRequest request = LoginRequest.builder()
                .emailOrStudentCode("student@stu.edu.vn")
                .password("Password123!")
                .build();

        UserPrincipal principal = UserPrincipal.create(sampleUser);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(principal);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(tokenProvider.generateAccessToken(any(UserPrincipal.class))).thenReturn("access_token_jwt");
        when(tokenProvider.generateRawRefreshToken()).thenReturn("raw_refresh_token");
        when(tokenProvider.hashToken(anyString())).thenReturn("hashed_refresh_token");
        when(tokenProvider.getExpirationMs()).thenReturn(86400000L);

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("access_token_jwt", response.getAccessToken());
        assertEquals("student@stu.edu.vn", response.getUser().getEmail());
        verify(refreshTokenRepository).revokeAllUserTokens(1L);
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Should throw AppException on invalid credentials")
    void testLogin_BadCredentials() {
        LoginRequest request = LoginRequest.builder()
                .emailOrStudentCode("student@stu.edu.vn")
                .password("WrongPassword")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        AppException ex = assertThrows(AppException.class, () -> authService.login(request));
        assertEquals(ErrorCode.INVALID_CREDENTIALS, ex.getErrorCode());
    }

    @Test
    @DisplayName("Should throw ACCOUNT_LOCKED AppException when authentication fails due to locked account")
    void testLogin_LockedAccount() {
        LoginRequest request = LoginRequest.builder()
                .emailOrStudentCode("locked@stu.edu.vn")
                .password("Password123!")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new LockedException("User account is locked"));

        AppException ex = assertThrows(AppException.class, () -> authService.login(request));
        assertEquals(ErrorCode.ACCOUNT_LOCKED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Should throw ACCOUNT_DISABLED AppException when authentication fails due to disabled account")
    void testLogin_DisabledAccount() {
        LoginRequest request = LoginRequest.builder()
                .emailOrStudentCode("disabled@stu.edu.vn")
                .password("Password123!")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new DisabledException("User account is disabled"));

        AppException ex = assertThrows(AppException.class, () -> authService.login(request));
        assertEquals(ErrorCode.ACCOUNT_DISABLED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Should successfully refresh token with token rotation")
    void testRefreshToken_Success() {
        RefreshTokenRequest request = RefreshTokenRequest.builder()
                .refreshToken("valid_raw_token")
                .build();

        RefreshToken storedToken = RefreshToken.builder()
                .id(1L)
                .user(sampleUser)
                .tokenHash("hashed_token")
                .expiresAt(LocalDateTime.now().plusDays(10))
                .build();

        when(tokenProvider.hashToken("valid_raw_token")).thenReturn("hashed_token");
        when(refreshTokenRepository.findByTokenHashAndRevokedAtIsNull("hashed_token"))
                .thenReturn(Optional.of(storedToken));
        when(tokenProvider.generateAccessToken(any(UserPrincipal.class))).thenReturn("new_access_token");
        when(tokenProvider.generateRawRefreshToken()).thenReturn("new_raw_refresh_token");
        when(tokenProvider.hashToken("new_raw_refresh_token")).thenReturn("new_hashed_token");
        when(tokenProvider.getExpirationMs()).thenReturn(86400000L);

        AuthResponse response = authService.refreshToken(request);

        assertNotNull(response);
        assertEquals("new_access_token", response.getAccessToken());
        assertNotNull(storedToken.getRevokedAt()); // token rotated
        verify(refreshTokenRepository, times(2)).save(any(RefreshToken.class));
    }
}
