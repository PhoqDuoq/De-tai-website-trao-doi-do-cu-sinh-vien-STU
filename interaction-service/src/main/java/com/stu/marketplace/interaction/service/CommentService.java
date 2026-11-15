package com.stu.marketplace.interaction.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.interaction.dto.*;
import com.stu.marketplace.interaction.entity.Comment;
import com.stu.marketplace.interaction.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;

    @Transactional(readOnly = true)
    public PagedResponse<CommentResponse> getCommentsByListing(Long listingId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Comment> commentPage = commentRepository.findByListingIdAndParentIsNullOrderByCreatedAtDesc(listingId, pageable);

        List<CommentResponse> content = commentPage.getContent().stream()
                .map(this::mapToResponseWithReplies)
                .collect(Collectors.toList());

        return PagedResponse.<CommentResponse>builder()
                .content(content)
                .page(commentPage.getNumber())
                .size(commentPage.getSize())
                .totalElements(commentPage.getTotalElements())
                .totalPages(commentPage.getTotalPages())
                .last(commentPage.isLast())
                .build();
    }

    @Transactional
    public CommentResponse addComment(Long userId, CreateCommentRequest request) {
        Comment parent = null;
        if (request.getParentId() != null) {
            parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));

            if (!parent.getListingId().equals(request.getListingId())) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Parent comment does not belong to the same listing");
            }
        }

        Comment comment = Comment.builder()
                .listingId(request.getListingId())
                .userId(userId)
                .parent(parent)
                .content(request.getContent().trim())
                .build();

        Comment saved = commentRepository.save(comment);
        log.info("User {} posted comment {} on listing {}", userId, saved.getId(), request.getListingId());
        return mapToResponse(saved);
    }

    @Transactional
    public CommentResponse updateComment(Long userId, Long commentId, UpdateCommentRequest request) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));

        if (!comment.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN, "You are only permitted to edit your own comment");
        }

        comment.setContent(request.getContent().trim());
        Comment updated = commentRepository.save(comment);
        log.info("User {} updated comment {}", userId, commentId);
        return mapToResponseWithReplies(updated);
    }

    @Transactional
    public void deleteComment(Long userId, Collection<? extends GrantedAuthority> authorities, Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));

        boolean isAuthor = comment.getUserId().equals(userId);
        boolean isStaff = authorities != null && authorities.stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MODERATOR"));

        if (!isAuthor && !isStaff) {
            throw new AppException(ErrorCode.FORBIDDEN, "Not authorized to delete this comment");
        }

        commentRepository.delete(comment);
        log.info("Comment {} deleted by user {} (isAuthor={}, isStaff={})", commentId, userId, isAuthor, isStaff);
    }

    private CommentResponse mapToResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .listingId(comment.getListingId())
                .userId(comment.getUserId())
                .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    private CommentResponse mapToResponseWithReplies(Comment comment) {
        CommentResponse response = mapToResponse(comment);
        if (comment.getReplies() != null && !comment.getReplies().isEmpty()) {
            response.setReplies(comment.getReplies().stream()
                    .map(this::mapToResponseWithReplies)
                    .collect(Collectors.toList()));
        }
        return response;
    }
}
