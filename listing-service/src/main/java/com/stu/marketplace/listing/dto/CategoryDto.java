package com.stu.marketplace.listing.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryDto {

    private Long id;
    private Long parentId;
    private String name;
    private String slug;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
