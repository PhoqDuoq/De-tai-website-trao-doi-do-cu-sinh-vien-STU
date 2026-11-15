package com.stu.marketplace.transaction.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionCancelRequest {

    @NotBlank(message = "Cancellation reason is required")
    private String reason;
}
