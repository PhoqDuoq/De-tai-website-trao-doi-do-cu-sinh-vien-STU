package com.stu.marketplace.interaction.dto;

import com.stu.marketplace.interaction.entity.MessageType;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageResponse {

    private Long id;
    private Long conversationId;
    private Long senderId;
    private MessageType messageType;
    private String content;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
