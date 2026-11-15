package com.stu.marketplace.interaction.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FavoriteCountResponse {

    private Long listingId;
    private long count;
}
