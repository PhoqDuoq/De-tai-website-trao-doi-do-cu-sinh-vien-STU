package com.stu.marketplace.transaction.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionConfirmRequest {

    private String verificationCode;

    private String note;
}
