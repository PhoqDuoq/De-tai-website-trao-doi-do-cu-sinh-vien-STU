package com.stu.marketplace.interaction.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationResponse {

    private Long id;
    private Long listingId;
    private Long buyerId;
    private Long sellerId;
    private LocalDateTime lastMessageAt;
    private LocalDateTime createdAt;
    private MessageResponse lastMessage;
    private long unreadCount;
}
