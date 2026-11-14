package com.stu.marketplace.identity.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileRequest {

    @Size(max = 150, message = "Full name cannot exceed 150 characters")
    private String fullName;

    @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$", message = "Phone number must be valid Vietnamese phone format")
    private String phone;

    private String avatarUrl;
}
