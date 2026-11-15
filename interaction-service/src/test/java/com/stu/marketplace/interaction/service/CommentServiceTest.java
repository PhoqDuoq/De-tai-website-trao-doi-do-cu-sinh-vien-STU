package com.stu.marketplace.interaction.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.interaction.dto.CommentResponse;
import com.stu.marketplace.interaction.dto.CreateCommentRequest;
import com.stu.marketplace.interaction.dto.PagedResponse;
import com.stu.marketplace.interaction.dto.UpdateCommentRequest;
import com.stu.marketplace.interaction.entity.Comment;
import com.stu.marketplace.interaction.repository.CommentRepository;
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
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock
    private CommentRepository commentRepository;

    @InjectMocks
    private CommentService commentService;

    private Comment sampleParentComment;
    private Comment sampleReplyComment;

    @BeforeEach
    void setUp() {
        sampleParentComment = Comment.builder()
                .id(1L)
                .listingId(100L)
                .userId(10L)
                .content("Is this item still available?")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .replies(new ArrayList<>())
                .build();

        sampleReplyComment = Comment.builder()
                .id(2L)
                .listingId(100L)
                .userId(20L)
                .parent(sampleParentComment)
                .content("Yes, it is!")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("getCommentsByListing should return comments with nested replies")
    void testGetCommentsByListing_Success() {
        sampleParentComment.getReplies().add(sampleReplyComment);
        Page<Comment> page = new PageImpl<>(List.of(sampleParentComment), PageRequest.of(0, 10), 1);
        when(commentRepository.findByListingIdAndParentIsNullOrderByCreatedAtDesc(eq(100L), any())).thenReturn(page);

        PagedResponse<CommentResponse> response = commentService.getCommentsByListing(100L, 0, 10);

        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getContent()).isEqualTo("Is this item still available?");
        assertThat(response.getContent().get(0).getReplies()).hasSize(1);
        assertThat(response.getContent().get(0).getReplies().get(0).getContent()).isEqualTo("Yes, it is!");
    }

    @Test
    @DisplayName("addComment without parent should create root comment")
    void testAddComment_Success() {
        CreateCommentRequest request = CreateCommentRequest.builder()
                .listingId(100L)
                .content("Is the price negotiable?")
                .build();

        when(commentRepository.save(any(Comment.class))).thenReturn(sampleParentComment);

        CommentResponse response = commentService.addComment(10L, request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getUserId()).isEqualTo(10L);
        verify(commentRepository).save(any(Comment.class));
    }

    @Test
    @DisplayName("addComment with valid parent should create nested reply")
    void testAddComment_WithParent_Success() {
        CreateCommentRequest request = CreateCommentRequest.builder()
                .listingId(100L)
                .parentId(1L)
                .content("Yes, price is negotiable")
                .build();

        when(commentRepository.findById(1L)).thenReturn(Optional.of(sampleParentComment));
        when(commentRepository.save(any(Comment.class))).thenReturn(sampleReplyComment);

        CommentResponse response = commentService.addComment(20L, request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(2L);
        verify(commentRepository).save(any(Comment.class));
    }

    @Test
    @DisplayName("addComment with parent from different listing should throw BAD_REQUEST")
    void testAddComment_ParentListingMismatch_ThrowsBadRequest() {
        CreateCommentRequest request = CreateCommentRequest.builder()
                .listingId(200L) // different listing ID
                .parentId(1L)
                .content("Mismatch test")
                .build();

        when(commentRepository.findById(1L)).thenReturn(Optional.of(sampleParentComment));

        assertThatThrownBy(() -> commentService.addComment(10L, request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BAD_REQUEST);

        verify(commentRepository, never()).save(any(Comment.class));
    }

    @Test
    @DisplayName("updateComment by author should succeed")
    void testUpdateComment_ByAuthor_Success() {
        UpdateCommentRequest request = new UpdateCommentRequest("Updated content");
        when(commentRepository.findById(1L)).thenReturn(Optional.of(sampleParentComment));
        when(commentRepository.save(any(Comment.class))).thenReturn(sampleParentComment);

        CommentResponse response = commentService.updateComment(10L, 1L, request);

        assertThat(response).isNotNull();
        verify(commentRepository).save(sampleParentComment);
    }

    @Test
    @DisplayName("updateComment by non-author should throw FORBIDDEN")
    void testUpdateComment_ByNonAuthor_ThrowsForbidden() {
        UpdateCommentRequest request = new UpdateCommentRequest("Hacker update");
        when(commentRepository.findById(1L)).thenReturn(Optional.of(sampleParentComment));

        assertThatThrownBy(() -> commentService.updateComment(999L, 1L, request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FORBIDDEN);

        verify(commentRepository, never()).save(any(Comment.class));
    }

    @Test
    @DisplayName("deleteComment by author should succeed")
    void testDeleteComment_ByAuthor_Success() {
        when(commentRepository.findById(1L)).thenReturn(Optional.of(sampleParentComment));

        commentService.deleteComment(10L, Collections.emptyList(), 1L);

        verify(commentRepository).delete(sampleParentComment);
    }

    @Test
    @DisplayName("deleteComment by moderator should succeed")
    void testDeleteComment_ByModerator_Success() {
        when(commentRepository.findById(1L)).thenReturn(Optional.of(sampleParentComment));

        commentService.deleteComment(999L, List.of(new SimpleGrantedAuthority("ROLE_MODERATOR")), 1L);

        verify(commentRepository).delete(sampleParentComment);
    }

    @Test
    @DisplayName("deleteComment by non-author student should throw FORBIDDEN")
    void testDeleteComment_ByStranger_ThrowsForbidden() {
        when(commentRepository.findById(1L)).thenReturn(Optional.of(sampleParentComment));

        assertThatThrownBy(() -> commentService.deleteComment(999L, List.of(new SimpleGrantedAuthority("ROLE_STUDENT")), 1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FORBIDDEN);

        verify(commentRepository, never()).delete(any());
    }
}
