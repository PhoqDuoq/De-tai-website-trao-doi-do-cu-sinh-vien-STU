package com.stu.marketplace.listing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCategoryRequest {

    private Long parentId;

    @NotBlank(message = "Category name cannot be blank")
    @Size(max = 120, message = "Category name cannot exceed 120 characters")
    private String name;

    @NotBlank(message = "Slug cannot be blank")
    @Size(max = 160, message = "Slug cannot exceed 160 characters")
    private String slug;

    @Builder.Default
    private Boolean isActive = true;
}
