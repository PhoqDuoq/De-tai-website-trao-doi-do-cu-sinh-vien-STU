package com.stu.marketplace.interaction.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FavoriteToggleResponse {

    private Long listingId;
    private boolean favorited;
    private String message;
}
