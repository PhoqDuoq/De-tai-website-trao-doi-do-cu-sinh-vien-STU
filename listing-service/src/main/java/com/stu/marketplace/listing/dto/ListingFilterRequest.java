package com.stu.marketplace.listing.dto;

import com.stu.marketplace.listing.entity.ItemCondition;
import com.stu.marketplace.listing.entity.ListingStatus;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingFilterRequest {

    private String keyword;
    private Long categoryId;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private ItemCondition condition;
    private ListingStatus status;

    @Builder.Default
    private int page = 0;

    @Builder.Default
    private int size = 20;

    @Builder.Default
    private String sortBy = "createdAt";

    @Builder.Default
    private String sortDir = "DESC";
}
