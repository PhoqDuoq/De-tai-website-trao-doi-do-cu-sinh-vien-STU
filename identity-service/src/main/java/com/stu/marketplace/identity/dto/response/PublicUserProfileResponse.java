package com.stu.marketplace.identity.dto.response;

import com.stu.marketplace.identity.entity.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Sanitized public user profile representation.
 * Excludes sensitive PII such as email, phone number, and student code.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicUserProfileResponse {

    private Long id;
    private String fullName;
    private String avatarUrl;
    private String department;
    private String faculty;
    private VerificationStatus verificationStatus;
    private boolean isStudentVerified;
    private LocalDateTime createdAt;
}
