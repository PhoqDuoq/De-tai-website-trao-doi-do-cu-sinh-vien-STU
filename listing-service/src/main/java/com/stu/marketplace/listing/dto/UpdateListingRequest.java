package com.stu.marketplace.listing.dto;

import com.stu.marketplace.listing.entity.ItemCondition;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateListingRequest {

    private Long categoryId;

    @Size(max = 200, message = "Title cannot exceed 200 characters")
    private String title;

    private String description;

    @DecimalMin(value = "0.0", message = "Price cannot be negative")
    private BigDecimal price;

    private ItemCondition itemCondition;

    @Min(value = 1, message = "Condition percent must be between 1 and 100")
    @Max(value = 100, message = "Condition percent must be between 1 and 100")
    private Integer conditionPercent;

    private List<ListingImageDto> images;
}
