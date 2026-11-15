package com.stu.marketplace.billing.dto;

import com.stu.marketplace.billing.entity.PaymentGatewayProvider;
import com.stu.marketplace.billing.entity.PaymentStatus;
import com.stu.marketplace.billing.entity.PaymentTransaction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentTransactionResponse {

    private Long id;
    private Long invoiceId;
    private PaymentGatewayProvider gatewayProvider;
    private String gatewayTxnRef;
    private String gatewayResponseCode;
    private BigDecimal amount;
    private PaymentStatus status;
    private LocalDateTime createdAt;

    public static PaymentTransactionResponse fromEntity(PaymentTransaction entity) {
        return PaymentTransactionResponse.builder()
                .id(entity.getId())
                .invoiceId(entity.getInvoice() != null ? entity.getInvoice().getId() : null)
                .gatewayProvider(entity.getGatewayProvider())
                .gatewayTxnRef(entity.getGatewayTxnRef())
                .gatewayResponseCode(entity.getGatewayResponseCode())
                .amount(entity.getAmount())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
