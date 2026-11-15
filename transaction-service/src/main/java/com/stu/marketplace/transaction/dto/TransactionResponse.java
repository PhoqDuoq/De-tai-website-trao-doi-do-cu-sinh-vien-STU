package com.stu.marketplace.transaction.dto;

import com.stu.marketplace.transaction.entity.TransactionStatus;
import com.stu.marketplace.transaction.entity.TransactionType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionResponse {

    private Long id;
    private String transactionCode;
    private Long listingId;
    private Long buyerId;
    private Long sellerId;
    private BigDecimal agreedPrice;
    private TransactionType transactionType;
    private String meetingLocation;
    private LocalDateTime meetingTime;
    private TransactionStatus status;
    private String cancelReason;
    private String verificationCode;
    private boolean buyerConfirmed;
    private boolean sellerConfirmed;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @Builder.Default
    private List<TimelineResponse> timeline = new ArrayList<>();
}
