package com.stu.marketplace.identity.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    @NotBlank(message = "Email cannot be blank")
    @Email(message = "Email must be valid format")
    private String email;

    @NotBlank(message = "Password cannot be blank")
    @Size(min = 6, max = 50, message = "Password must be between 6 and 50 characters")
    private String password;

    @NotBlank(message = "Full name cannot be blank")
    @Size(max = 150, message = "Full name cannot exceed 150 characters")
    private String fullName;

    @Pattern(regexp = "^[A-Za-z0-9]{5,20}$", message = "Student code must be 5-20 alphanumeric characters, e.g. DH52001234")
    private String studentCode;

    @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$", message = "Phone number must be valid Vietnamese phone format")
    private String phone;
}
