package com.stu.marketplace.common.constant;

/**
 * Security and authentication constants for STU Marketplace.
 */
public final class SecurityConstants {

    private SecurityConstants() {
        // Private constructor to prevent instantiation
    }

    public static final String HEADER_AUTHORIZATION = "Authorization";
    public static final String TOKEN_PREFIX = "Bearer ";

    // User Roles
    public static final String ROLE_STUDENT = "ROLE_STUDENT";
    public static final String ROLE_MODERATOR = "ROLE_MODERATOR";
    public static final String ROLE_ADMIN = "ROLE_ADMIN";

    // Standard JWT Claims
    public static final String CLAIM_USER_ID = "userId";
    public static final String CLAIM_STUDENT_ID = "studentId";
    public static final String CLAIM_EMAIL = "email";
    public static final String CLAIM_ROLE = "role";
    public static final String CLAIM_STATUS = "status";

    // Token Validity (24 hours in milliseconds)
    public static final long DEFAULT_EXPIRATION_TIME_MS = 86_400_000L;
}
