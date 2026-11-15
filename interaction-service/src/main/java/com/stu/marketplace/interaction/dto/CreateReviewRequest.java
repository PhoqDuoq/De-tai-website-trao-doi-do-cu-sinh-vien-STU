package com.stu.marketplace.interaction.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateReviewRequest {

    @NotNull(message = "Reviewee ID is required")
    private Long revieweeId;

    @NotNull(message = "Transaction ID is required")
    private Long transactionId;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1 star")
    @Max(value = 5, message = "Rating must not exceed 5 stars")
    private Integer rating;

    @Size(max = 2000, message = "Review comment cannot exceed 2000 characters")
    private String comment;
}
