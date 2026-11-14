package com.stu.marketplace.identity.dto.response;

import com.stu.marketplace.identity.entity.AccountStatus;
import com.stu.marketplace.identity.entity.VerificationStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponse {

    private Long id;
    private String email;
    private String studentCode;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private VerificationStatus verificationStatus;
    private AccountStatus accountStatus;
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;
    private Set<String> roles;
}
