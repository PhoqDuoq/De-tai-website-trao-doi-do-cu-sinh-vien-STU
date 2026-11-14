package com.stu.marketplace.identity.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

    @NotBlank(message = "Username/Email cannot be blank")
    private String emailOrStudentCode;

    @NotBlank(message = "Password cannot be blank")
    private String password;
}
