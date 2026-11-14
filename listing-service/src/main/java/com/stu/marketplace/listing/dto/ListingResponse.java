package com.stu.marketplace.listing.dto;

import com.stu.marketplace.listing.entity.ItemCondition;
import com.stu.marketplace.listing.entity.ListingStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingResponse {

    private Long id;
    private Long sellerId;
    private CategoryDto category;
    private String title;
    private String description;
    private BigDecimal price;
    private ItemCondition itemCondition;
    private Integer conditionPercent;
    private ListingStatus status;
    private LocalDateTime publishedAt;
    private LocalDateTime soldAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ListingImageDto> images;
}
