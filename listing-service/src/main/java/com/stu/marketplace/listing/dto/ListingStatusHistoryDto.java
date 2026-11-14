package com.stu.marketplace.listing.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingStatusHistoryDto {

    private Long id;
    private Long listingId;
    private String fromStatus;
    private String toStatus;
    private Long actorId;
    private String reason;
    private LocalDateTime createdAt;
}
