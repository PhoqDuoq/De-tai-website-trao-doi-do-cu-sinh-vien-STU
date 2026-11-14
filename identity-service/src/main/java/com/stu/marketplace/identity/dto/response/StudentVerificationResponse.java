package com.stu.marketplace.identity.dto.response;

import com.stu.marketplace.identity.entity.StudentVerificationStatus;
import com.stu.marketplace.identity.entity.VerificationMethod;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentVerificationResponse {

    private Long id;
    private Long userId;
    private String userEmail;
    private String studentCode;
    private VerificationMethod method;
    private String evidenceReference;
    private StudentVerificationStatus status;
    private Long reviewedBy;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
}
