package com.stu.marketplace.interaction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCommentRequest {

    @NotNull(message = "Listing ID is required")
    private Long listingId;

    private Long parentId;

    @NotBlank(message = "Comment content cannot be blank")
    @Size(max = 2000, message = "Comment content cannot exceed 2000 characters")
    private String content;
}
