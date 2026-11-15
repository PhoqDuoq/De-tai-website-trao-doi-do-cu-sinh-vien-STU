package com.stu.marketplace.transaction.dto;

import com.stu.marketplace.transaction.entity.TransactionStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimelineResponse {

    private Long id;
    private Long transactionId;
    private TransactionStatus status;
    private String note;
    private Long actorId;
    private LocalDateTime createdAt;
}
