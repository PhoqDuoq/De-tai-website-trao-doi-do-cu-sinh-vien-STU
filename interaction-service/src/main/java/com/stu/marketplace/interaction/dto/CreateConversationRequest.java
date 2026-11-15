package com.stu.marketplace.interaction.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateConversationRequest {

    @NotNull(message = "Listing ID is required")
    private Long listingId;

    @NotNull(message = "Seller ID is required")
    private Long sellerId;
}
