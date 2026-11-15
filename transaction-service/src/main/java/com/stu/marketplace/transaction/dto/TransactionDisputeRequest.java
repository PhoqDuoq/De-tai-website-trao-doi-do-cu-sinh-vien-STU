package com.stu.marketplace.transaction.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionDisputeRequest {

    @NotBlank(message = "Dispute reason is required")
    private String reason;
}
