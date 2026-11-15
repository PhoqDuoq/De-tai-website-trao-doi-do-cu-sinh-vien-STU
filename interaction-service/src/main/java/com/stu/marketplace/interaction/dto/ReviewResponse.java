package com.stu.marketplace.interaction.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse {

    private Long id;
    private Long reviewerId;
    private Long revieweeId;
    private Long transactionId;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
