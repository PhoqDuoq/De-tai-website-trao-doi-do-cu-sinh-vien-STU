package com.stu.marketplace.billing.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInvoiceRequest {

    @NotNull(message = "Listing ID is required")
    private Long listingId;

    @NotNull(message = "Fee Package ID is required")
    private Integer packageId;
}
