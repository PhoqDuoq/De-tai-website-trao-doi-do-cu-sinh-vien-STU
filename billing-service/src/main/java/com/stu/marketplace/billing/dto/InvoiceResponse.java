package com.stu.marketplace.billing.dto;

import com.stu.marketplace.billing.entity.Invoice;
import com.stu.marketplace.billing.entity.InvoiceStatus;
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
public class InvoiceResponse {

    private Long id;
    private String invoiceCode;
    private Long userId;
    private Long listingId;
    private Integer packageId;
    private String packageCode;
    private String packageName;
    private Integer durationDays;
    private BigDecimal amount;
    private InvoiceStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;

    public static InvoiceResponse fromEntity(Invoice entity) {
        return InvoiceResponse.builder()
                .id(entity.getId())
                .invoiceCode(entity.getInvoiceCode())
                .userId(entity.getUserId())
                .listingId(entity.getListingId())
                .packageId(entity.getFeePackage() != null ? entity.getFeePackage().getId() : null)
                .packageCode(entity.getFeePackage() != null ? entity.getFeePackage().getPackageCode() : null)
                .packageName(entity.getFeePackage() != null ? entity.getFeePackage().getName() : null)
                .durationDays(entity.getFeePackage() != null ? entity.getFeePackage().getDurationDays() : null)
                .amount(entity.getAmount())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .paidAt(entity.getPaidAt())
                .build();
    }
}
