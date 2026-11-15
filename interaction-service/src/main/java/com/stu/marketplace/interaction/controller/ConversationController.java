package com.stu.marketplace.interaction.controller;

import com.stu.marketplace.common.dto.ApiResponse;
import com.stu.marketplace.interaction.dto.*;
import com.stu.marketplace.interaction.security.UserPrincipal;
import com.stu.marketplace.interaction.service.ConversationService;
import com.stu.marketplace.interaction.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final MessageService messageService;

    @PostMapping
    public ResponseEntity<ApiResponse<ConversationResponse>> startOrGetConversation(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateConversationRequest request) {
        ConversationResponse response = conversationService.startOrGetConversation(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response));
    }

    @GetMapping("/my-conversations")
    public ResponseEntity<ApiResponse<PagedResponse<ConversationResponse>>> getMyConversations(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PagedResponse<ConversationResponse> response = conversationService.getMyConversations(principal.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConversationResponse>> getConversationDetails(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        ConversationResponse response = conversationService.getConversationDetails(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<PagedResponse<MessageResponse>>> getMessages(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        PagedResponse<MessageResponse> response = messageService.getMessages(principal.getId(), id, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody SendMessageRequest request) {
        MessageResponse response = messageService.sendMessage(principal.getId(), id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        messageService.markAsRead(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Messages marked as read", null));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<UnreadCountResponse>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        UnreadCountResponse response = conversationService.getTotalUnreadCount(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
