package com.stu.marketplace.interaction.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.interaction.dto.*;
import com.stu.marketplace.interaction.entity.Conversation;
import com.stu.marketplace.interaction.entity.Message;
import com.stu.marketplace.interaction.repository.ConversationRepository;
import com.stu.marketplace.interaction.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

    @Transactional
    public ConversationResponse startOrGetConversation(Long buyerId, CreateConversationRequest request) {
        if (buyerId.equals(request.getSellerId())) {
            throw new AppException(ErrorCode.CANNOT_CHAT_WITH_SELF);
        }

        Conversation conversation = conversationRepository
                .findByListingIdAndBuyerIdAndSellerId(request.getListingId(), buyerId, request.getSellerId())
                .orElseGet(() -> {
                    Conversation newConv = Conversation.builder()
                            .listingId(request.getListingId())
                            .buyerId(buyerId)
                            .sellerId(request.getSellerId())
                            .lastMessageAt(LocalDateTime.now())
                            .build();
                    Conversation saved = conversationRepository.save(newConv);
                    log.info("Started new conversation {} between buyer {} and seller {} for listing {}",
                            saved.getId(), buyerId, request.getSellerId(), request.getListingId());
                    return saved;
                });

        return mapToResponse(conversation, buyerId);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ConversationResponse> getMyConversations(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Conversation> conversationPage = conversationRepository.findByUserParticipation(userId, pageable);

        List<ConversationResponse> content = conversationPage.getContent().stream()
                .map(c -> mapToResponse(c, userId))
                .collect(Collectors.toList());

        return PagedResponse.<ConversationResponse>builder()
                .content(content)
                .page(conversationPage.getNumber())
                .size(conversationPage.getSize())
                .totalElements(conversationPage.getTotalElements())
                .totalPages(conversationPage.getTotalPages())
                .last(conversationPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public ConversationResponse getConversationDetails(Long userId, Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        if (!conversation.getBuyerId().equals(userId) && !conversation.getSellerId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN, "Access denied: you are not a participant in this conversation");
        }

        return mapToResponse(conversation, userId);
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse getTotalUnreadCount(Long userId) {
        long count = messageRepository.countTotalUnreadMessagesForUser(userId);
        return UnreadCountResponse.builder().unreadCount(count).build();
    }

    private ConversationResponse mapToResponse(Conversation conversation, Long currentUserId) {
        MessageResponse lastMessageResponse = messageRepository
                .findTopByConversationIdOrderByCreatedAtDesc(conversation.getId())
                .map(m -> MessageResponse.builder()
                        .id(m.getId())
                        .conversationId(conversation.getId())
                        .senderId(m.getSenderId())
                        .messageType(m.getMessageType())
                        .content(m.getContent())
                        .isRead(m.getIsRead())
                        .createdAt(m.getCreatedAt())
                        .build())
                .orElse(null);

        long unreadCount = messageRepository.countUnreadMessagesByConversation(conversation.getId(), currentUserId);

        return ConversationResponse.builder()
                .id(conversation.getId())
                .listingId(conversation.getListingId())
                .buyerId(conversation.getBuyerId())
                .sellerId(conversation.getSellerId())
                .lastMessageAt(conversation.getLastMessageAt())
                .createdAt(conversation.getCreatedAt())
                .lastMessage(lastMessageResponse)
                .unreadCount(unreadCount)
                .build();
    }
}
