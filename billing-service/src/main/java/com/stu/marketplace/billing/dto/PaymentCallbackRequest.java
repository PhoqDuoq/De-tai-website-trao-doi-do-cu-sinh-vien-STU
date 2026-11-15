package com.stu.marketplace.billing.dto;

import com.stu.marketplace.billing.entity.PaymentGatewayProvider;
import com.stu.marketplace.billing.entity.PaymentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCallbackRequest {

    @NotNull(message = "Gateway provider is required")
    private PaymentGatewayProvider gatewayProvider;

    @NotBlank(message = "Gateway txn ref is required")
    private String gatewayTxnRef;

    private String gatewayResponseCode;

    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    @NotNull(message = "Payment status is required")
    private PaymentStatus status;

    private String payloadJson;
}
