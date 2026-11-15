package com.stu.marketplace.interaction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateCommentRequest {

    @NotBlank(message = "Comment content cannot be blank")
    @Size(max = 2000, message = "Comment content cannot exceed 2000 characters")
    private String content;
}
