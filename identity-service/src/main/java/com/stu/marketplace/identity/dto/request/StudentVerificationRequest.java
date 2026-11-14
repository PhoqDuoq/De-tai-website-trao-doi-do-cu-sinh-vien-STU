package com.stu.marketplace.identity.dto.request;

import com.stu.marketplace.identity.entity.VerificationMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentVerificationRequest {

    @NotNull(message = "Verification method is required")
    private VerificationMethod method;

    @NotBlank(message = "Evidence reference (image URL or student card reference) is required")
    private String evidenceReference;

    private String studentCode;
}
