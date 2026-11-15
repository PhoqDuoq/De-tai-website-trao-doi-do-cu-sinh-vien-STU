package com.stu.marketplace.transaction.dto;

import com.stu.marketplace.transaction.entity.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionProposalRequest {

    @NotNull(message = "Listing ID is required")
    private Long listingId;

    @NotNull(message = "Seller ID is required")
    private Long sellerId;

    @NotNull(message = "Agreed price is required")
    @DecimalMin(value = "0.0", message = "Agreed price must be non-negative")
    private BigDecimal agreedPrice;

    @Builder.Default
    private TransactionType transactionType = TransactionType.BUY_SELL;

    private String meetingLocation;

    private LocalDateTime meetingTime;

    private String note;
}
