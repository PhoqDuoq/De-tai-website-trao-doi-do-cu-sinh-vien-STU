package com.stu.marketplace.listing.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
public class JwtTokenValidator {

    private final SecretKey key;

    public JwtTokenValidator(@Value("${jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public UserPrincipal parseToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            Long userId = Long.parseLong(claims.getSubject());
            String email = claims.get("email", String.class);
            String studentCode = claims.get("studentCode", String.class);

            List<?> rawRoles = claims.get("roles", List.class);
            Collection<SimpleGrantedAuthority> authorities = Collections.emptyList();
            if (rawRoles != null) {
                authorities = rawRoles.stream()
                        .map(r -> new SimpleGrantedAuthority(r.toString()))
                        .collect(Collectors.toList());
            }

            return UserPrincipal.builder()
                    .id(userId)
                    .email(email)
                    .studentCode(studentCode)
                    .authorities(authorities)
                    .build();
        } catch (JwtException | IllegalArgumentException e) {
            log.error("Invalid JWT token in Listing Service: {}", e.getMessage());
            return null;
        }
    }
}
