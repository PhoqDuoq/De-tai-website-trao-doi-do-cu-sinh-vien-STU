package com.stu.marketplace.listing.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtTokenValidator tokenValidator;

    @Value("${stu.security.internal-service-key:stu-marketplace-internal-secret-key-2026}")
    private String internalServiceKey;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String internalKeyHeader = request.getHeader("X-Internal-Service-Key");
            if (StringUtils.hasText(internalKeyHeader) && internalKeyHeader.equals(internalServiceKey)) {
                UserPrincipal internalPrincipal = UserPrincipal.builder()
                        .id(0L)
                        .email("internal-service@stu.edu.vn")
                        .studentCode("INTERNAL")
                        .accountStatus("ACTIVE")
                        .authorities(List.of(
                                new SimpleGrantedAuthority("ROLE_INTERNAL_SERVICE"),
                                new SimpleGrantedAuthority("ROLE_ADMIN")
                        ))
                        .build();

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(internalPrincipal, null, internalPrincipal.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
                filterChain.doFilter(request, response);
                return;
            }

            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt)) {
                UserPrincipal principal = tokenValidator.parseToken(jwt);
                if (principal != null) {
                    if (!principal.isEnabled() || !principal.isAccountNonLocked()) {
                        log.warn("Blocked request from non-active user principal: ID {}", principal.getId());
                    } else {
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                }
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in listing service", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
