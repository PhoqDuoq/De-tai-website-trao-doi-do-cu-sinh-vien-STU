package com.stu.marketplace.interaction.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnreadCountResponse {

    private long unreadCount;
}
