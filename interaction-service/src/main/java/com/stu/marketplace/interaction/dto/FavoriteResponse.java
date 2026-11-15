package com.stu.marketplace.interaction.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FavoriteResponse {

    private Long id;
    private Long userId;
    private Long listingId;
    private LocalDateTime createdAt;
}
