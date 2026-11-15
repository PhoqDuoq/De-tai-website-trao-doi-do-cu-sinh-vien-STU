package com.stu.marketplace.interaction.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.interaction.dto.MessageResponse;
import com.stu.marketplace.interaction.dto.PagedResponse;
import com.stu.marketplace.interaction.dto.SendMessageRequest;
import com.stu.marketplace.interaction.entity.Conversation;
import com.stu.marketplace.interaction.entity.Message;
import com.stu.marketplace.interaction.entity.MessageType;
import com.stu.marketplace.interaction.repository.ConversationRepository;
import com.stu.marketplace.interaction.repository.MessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessageServiceTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private MessageRepository messageRepository;

    @InjectMocks
    private MessageService messageService;

    private Conversation sampleConversation;
    private Message sampleMessage;

    @BeforeEach
    void setUp() {
        sampleConversation = Conversation.builder()
                .id(1L)
                .listingId(100L)
                .buyerId(10L)
                .sellerId(20L)
                .lastMessageAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

        sampleMessage = Message.builder()
                .id(1L)
                .conversation(sampleConversation)
                .senderId(10L)
                .messageType(MessageType.TEXT)
                .content("Hello, when can we meet?")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("sendMessage by participant should persist message and update conversation timestamp")
    void testSendMessage_ByParticipant_Success() {
        SendMessageRequest request = SendMessageRequest.builder()
                .content("Hello, when can we meet?")
                .messageType(MessageType.TEXT)
                .build();

        when(conversationRepository.findById(1L)).thenReturn(Optional.of(sampleConversation));
        when(messageRepository.save(any(Message.class))).thenReturn(sampleMessage);

        MessageResponse response = messageService.sendMessage(10L, 1L, request);

        assertThat(response).isNotNull();
        assertThat(response.getContent()).isEqualTo("Hello, when can we meet?");
        verify(messageRepository).save(any(Message.class));
        verify(conversationRepository).save(sampleConversation);
    }

    @Test
    @DisplayName("sendMessage by stranger should throw FORBIDDEN")
    void testSendMessage_ByStranger_ThrowsForbidden() {
        SendMessageRequest request = SendMessageRequest.builder()
                .content("Unauthorized intrusion")
                .build();

        when(conversationRepository.findById(1L)).thenReturn(Optional.of(sampleConversation));

        assertThatThrownBy(() -> messageService.sendMessage(999L, 1L, request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FORBIDDEN);

        verify(messageRepository, never()).save(any());
    }

    @Test
    @DisplayName("getMessages by participant should return paginated messages")
    void testGetMessages_ByParticipant_Success() {
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(sampleConversation));
        Page<Message> page = new PageImpl<>(List.of(sampleMessage), PageRequest.of(0, 10), 1);
        when(messageRepository.findByConversationIdOrderByCreatedAtDesc(eq(1L), any())).thenReturn(page);

        PagedResponse<MessageResponse> response = messageService.getMessages(10L, 1L, 0, 10);

        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getContent()).isEqualTo("Hello, when can we meet?");
    }

    @Test
    @DisplayName("getMessages by stranger should throw FORBIDDEN")
    void testGetMessages_ByStranger_ThrowsForbidden() {
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(sampleConversation));

        assertThatThrownBy(() -> messageService.getMessages(999L, 1L, 0, 10))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FORBIDDEN);
    }

    @Test
    @DisplayName("markAsRead by participant should invoke repository markMessagesAsRead")
    void testMarkAsRead_ByParticipant_Success() {
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(sampleConversation));
        when(messageRepository.markMessagesAsRead(1L, 20L)).thenReturn(2);

        messageService.markAsRead(20L, 1L);

        verify(messageRepository).markMessagesAsRead(1L, 20L);
    }
}
