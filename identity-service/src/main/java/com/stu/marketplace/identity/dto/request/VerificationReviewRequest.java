package com.stu.marketplace.identity.dto.request;

import com.stu.marketplace.identity.entity.StudentVerificationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationReviewRequest {

    @NotNull(message = "Review status is required (APPROVED or REJECTED)")
    private StudentVerificationStatus status;

    private String note;
}
