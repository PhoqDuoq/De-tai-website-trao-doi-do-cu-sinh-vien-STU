package com.stu.marketplace.transaction.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionAcceptRequest {

    private String note;
}
