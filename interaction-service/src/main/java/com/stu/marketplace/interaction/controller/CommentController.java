package com.stu.marketplace.interaction.controller;

import com.stu.marketplace.common.dto.ApiResponse;
import com.stu.marketplace.interaction.dto.*;
import com.stu.marketplace.interaction.security.UserPrincipal;
import com.stu.marketplace.interaction.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/listing/{listingId}")
    public ResponseEntity<ApiResponse<PagedResponse<CommentResponse>>> getCommentsByListing(
            @PathVariable Long listingId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        PagedResponse<CommentResponse> response = commentService.getCommentsByListing(listingId, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateCommentRequest request) {
        CommentResponse response = commentService.addComment(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateCommentRequest request) {
        CommentResponse response = commentService.updateComment(principal.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Comment updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        commentService.deleteComment(principal.getId(), principal.getAuthorities(), id);
        return ResponseEntity.ok(ApiResponse.success("Comment deleted successfully", null));
    }
}
