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
public class MessageService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

    @Transactional
    public MessageResponse sendMessage(Long senderId, Long conversationId, SendMessageRequest request) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        if (!conversation.getBuyerId().equals(senderId) && !conversation.getSellerId().equals(senderId)) {
            throw new AppException(ErrorCode.FORBIDDEN, "Access denied: you are not a participant in this conversation");
        }

        MessageType type = request.getMessageType() != null ? request.getMessageType() : MessageType.TEXT;

        Message message = Message.builder()
                .conversation(conversation)
                .senderId(senderId)
                .messageType(type)
                .content(request.getContent().trim())
                .isRead(false)
                .build();

        Message saved = messageRepository.save(message);

        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        log.info("User {} sent message {} in conversation {}", senderId, saved.getId(), conversationId);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public PagedResponse<MessageResponse> getMessages(Long userId, Long conversationId, int page, int size) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        if (!conversation.getBuyerId().equals(userId) && !conversation.getSellerId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN, "Access denied: you are not a participant in this conversation");
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<Message> messagePage = messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, pageable);

        List<MessageResponse> content = messagePage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PagedResponse.<MessageResponse>builder()
                .content(content)
                .page(messagePage.getNumber())
                .size(messagePage.getSize())
                .totalElements(messagePage.getTotalElements())
                .totalPages(messagePage.getTotalPages())
                .last(messagePage.isLast())
                .build();
    }

    @Transactional
    public void markAsRead(Long userId, Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        if (!conversation.getBuyerId().equals(userId) && !conversation.getSellerId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN, "Access denied: you are not a participant in this conversation");
        }

        int updatedCount = messageRepository.markMessagesAsRead(conversationId, userId);
        log.info("User {} marked {} messages as read in conversation {}", userId, updatedCount, conversationId);
    }

    private MessageResponse mapToResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .senderId(message.getSenderId())
                .messageType(message.getMessageType())
                .content(message.getContent())
                .isRead(message.getIsRead())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
