package com.stu.marketplace.listing.dto;

import com.stu.marketplace.listing.entity.ListingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingStatusUpdateRequest {

    @NotNull(message = "Target status is required")
    private ListingStatus status;

    private String reason;
}
