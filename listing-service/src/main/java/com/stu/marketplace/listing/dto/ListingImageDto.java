package com.stu.marketplace.listing.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingImageDto {

    private Long id;

    @NotBlank(message = "Storage key / image URL cannot be blank")
    private String storageKey;

    @Builder.Default
    private String mimeType = "image/jpeg";

    @Builder.Default
    private Integer sortOrder = 0;
}
