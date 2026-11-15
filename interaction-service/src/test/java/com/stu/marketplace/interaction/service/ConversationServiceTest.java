package com.stu.marketplace.interaction.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.interaction.dto.ConversationResponse;
import com.stu.marketplace.interaction.dto.CreateConversationRequest;
import com.stu.marketplace.interaction.dto.PagedResponse;
import com.stu.marketplace.interaction.dto.UnreadCountResponse;
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
class ConversationServiceTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private MessageRepository messageRepository;

    @InjectMocks
    private ConversationService conversationService;

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
                .content("Hello, I am interested!")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("startOrGetConversation should reject self chat")
    void testStartConversation_SelfChat_ThrowsBadRequest() {
        CreateConversationRequest request = new CreateConversationRequest(100L, 10L);

        assertThatThrownBy(() -> conversationService.startOrGetConversation(10L, request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CANNOT_CHAT_WITH_SELF);

        verify(conversationRepository, never()).save(any());
    }

    @Test
    @DisplayName("startOrGetConversation should return existing conversation if already created")
    void testStartConversation_ExistingReturnsIdempotent() {
        CreateConversationRequest request = new CreateConversationRequest(100L, 20L);
        when(conversationRepository.findByListingIdAndBuyerIdAndSellerId(100L, 10L, 20L))
                .thenReturn(Optional.of(sampleConversation));

        ConversationResponse response = conversationService.startOrGetConversation(10L, request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        verify(conversationRepository, never()).save(any());
    }

    @Test
    @DisplayName("startOrGetConversation should create new conversation when not existing")
    void testStartConversation_Success() {
        CreateConversationRequest request = new CreateConversationRequest(100L, 20L);
        when(conversationRepository.findByListingIdAndBuyerIdAndSellerId(100L, 10L, 20L))
                .thenReturn(Optional.empty());
        when(conversationRepository.save(any(Conversation.class))).thenReturn(sampleConversation);

        ConversationResponse response = conversationService.startOrGetConversation(10L, request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        verify(conversationRepository).save(any(Conversation.class));
    }

    @Test
    @DisplayName("getMyConversations should return user conversations with last message and unread count")
    void testGetMyConversations_Success() {
        Page<Conversation> page = new PageImpl<>(List.of(sampleConversation), PageRequest.of(0, 10), 1);
        when(conversationRepository.findByUserParticipation(eq(10L), any())).thenReturn(page);
        when(messageRepository.findTopByConversationIdOrderByCreatedAtDesc(1L)).thenReturn(Optional.of(sampleMessage));
        when(messageRepository.countUnreadMessagesByConversation(1L, 10L)).thenReturn(0L);

        PagedResponse<ConversationResponse> response = conversationService.getMyConversations(10L, 0, 10);

        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getLastMessage()).isNotNull();
        assertThat(response.getContent().get(0).getLastMessage().getContent()).isEqualTo("Hello, I am interested!");
    }

    @Test
    @DisplayName("getConversationDetails by participant should succeed")
    void testGetConversationDetails_ByParticipant_Success() {
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(sampleConversation));

        ConversationResponse response = conversationService.getConversationDetails(10L, 1L);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getConversationDetails by stranger should throw FORBIDDEN")
    void testGetConversationDetails_ByStranger_ThrowsForbidden() {
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(sampleConversation));

        assertThatThrownBy(() -> conversationService.getConversationDetails(999L, 1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FORBIDDEN);
    }

    @Test
    @DisplayName("getTotalUnreadCount should return unread message count for user")
    void testGetTotalUnreadCount_Success() {
        when(messageRepository.countTotalUnreadMessagesForUser(10L)).thenReturn(3L);

        UnreadCountResponse response = conversationService.getTotalUnreadCount(10L);

        assertThat(response.getUnreadCount()).isEqualTo(3L);
    }
}
