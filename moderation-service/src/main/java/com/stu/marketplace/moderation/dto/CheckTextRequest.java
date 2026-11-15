package com.stu.marketplace.moderation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckTextRequest {

    @NotBlank(message = "Text to check cannot be blank")
    private String text;

    private String category;
}
