package com.stu.marketplace.billing.dto;

import com.stu.marketplace.billing.entity.PaymentGatewayProvider;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessPaymentRequest {

    @NotNull(message = "Payment gateway provider is required")
    private PaymentGatewayProvider gatewayProvider;
}
