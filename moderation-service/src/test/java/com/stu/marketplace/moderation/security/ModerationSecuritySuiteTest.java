package com.stu.marketplace.moderation.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class ModerationSecuritySuiteTest {

    private JwtTokenValidator tokenValidator;
    private final String secret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @BeforeEach
    void setUp() {
        tokenValidator = new JwtTokenValidator(secret);
    }

    @Test
    @DisplayName("SEC-04: Token from ACTIVE user is accepted by JwtTokenValidator")
    void testJwtValidator_ActiveAccount_Accepted() {
        String token = Jwts.builder()
                .subject("10")
                .claim("email", "student10@stu.edu.vn")
                .claim("studentCode", "DH52001010")
                .claim("accountStatus", "ACTIVE")
                .claim("roles", List.of("ROLE_STUDENT"))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                .compact();

        UserPrincipal principal = tokenValidator.parseToken(token);

        assertNotNull(principal);
        assertEquals(10L, principal.getId());
        assertEquals("student10@stu.edu.vn", principal.getEmail());
        assertEquals("DH52001010", principal.getStudentCode());
        assertTrue(principal.isEnabled());
        assertTrue(principal.isAccountNonLocked());
    }

    @Test
    @DisplayName("SEC-04: Token from LOCKED user is rejected by JwtTokenValidator")
    void testJwtValidator_LockedAccount_Rejected() {
        String token = Jwts.builder()
                .subject("20")
                .claim("email", "locked@stu.edu.vn")
                .claim("studentCode", "DH52002020")
                .claim("accountStatus", "LOCKED")
                .claim("roles", List.of("ROLE_STUDENT"))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                .compact();

        UserPrincipal principal = tokenValidator.parseToken(token);
        assertNull(principal, "Locked user token must be rejected");
    }

    @Test
    @DisplayName("SEC-04: Token from SUSPENDED user is rejected by JwtTokenValidator")
    void testJwtValidator_SuspendedAccount_Rejected() {
        String token = Jwts.builder()
                .subject("30")
                .claim("email", "suspended@stu.edu.vn")
                .claim("studentCode", "DH52003030")
                .claim("accountStatus", "SUSPENDED")
                .claim("roles", List.of("ROLE_STUDENT"))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                .compact();

        UserPrincipal principal = tokenValidator.parseToken(token);
        assertNull(principal, "Suspended user token must be rejected");
    }

    @Test
    @DisplayName("Token with invalid secret signature is rejected")
    void testJwtValidator_InvalidSignature_Rejected() {
        String wrongSecret = "1111111111111111111111111111111111111111111111111111111111111111";
        String token = Jwts.builder()
                .subject("10")
                .claim("email", "student10@stu.edu.vn")
                .claim("accountStatus", "ACTIVE")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(Keys.hmacShaKeyFor(wrongSecret.getBytes(StandardCharsets.UTF_8)))
                .compact();

        UserPrincipal principal = tokenValidator.parseToken(token);
        assertNull(principal, "Invalid signature token must be rejected");
    }

    @Test
    @DisplayName("Expired token is rejected")
    void testJwtValidator_ExpiredToken_Rejected() {
        String token = Jwts.builder()
                .subject("10")
                .claim("email", "student10@stu.edu.vn")
                .claim("accountStatus", "ACTIVE")
                .issuedAt(new Date(System.currentTimeMillis() - 7200000))
                .expiration(new Date(System.currentTimeMillis() - 3600000))
                .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                .compact();

        UserPrincipal principal = tokenValidator.parseToken(token);
        assertNull(principal, "Expired token must be rejected");
    }
}
