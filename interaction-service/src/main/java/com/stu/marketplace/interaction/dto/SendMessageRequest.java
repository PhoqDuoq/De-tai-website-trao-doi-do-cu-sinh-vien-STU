package com.stu.marketplace.interaction.dto;

import com.stu.marketplace.interaction.entity.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendMessageRequest {

    @NotBlank(message = "Message content cannot be blank")
    @Size(max = 4000, message = "Message content cannot exceed 4000 characters")
    private String content;

    @Builder.Default
    private MessageType messageType = MessageType.TEXT;
}
