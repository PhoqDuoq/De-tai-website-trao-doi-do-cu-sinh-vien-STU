package com.stu.marketplace.interaction.dto;

import lombok.*;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewSummaryResponse {

    private Long userId;
    private Double averageRating;
    private long totalReviews;
    private Map<Integer, Long> ratingBreakdown;
}
