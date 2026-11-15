package com.stu.marketplace.interaction.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stu.marketplace.interaction.dto.*;
import com.stu.marketplace.interaction.exception.GlobalExceptionHandler;
import com.stu.marketplace.interaction.security.UserPrincipal;
import com.stu.marketplace.interaction.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class InteractionControllerIntegrationTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private FavoriteService favoriteService;

    @Mock
    private CommentService commentService;

    @Mock
    private ConversationService conversationService;

    @Mock
    private MessageService messageService;

    @Mock
    private ReviewService reviewService;

    private UserPrincipal testPrincipal;

    @BeforeEach
    void setUp() {
        testPrincipal = UserPrincipal.builder()
                .id(10L)
                .email("student10@stu.edu.vn")
                .studentCode("DH52001010")
                .accountStatus("ACTIVE")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_STUDENT")))
                .build();

        HandlerMethodArgumentResolver authPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().isAssignableFrom(UserPrincipal.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter,
                                          ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest,
                                          WebDataBinderFactory binderFactory) {
                return testPrincipal;
            }
        };

        FavoriteController favoriteController = new FavoriteController(favoriteService);
        CommentController commentController = new CommentController(commentService);
        ConversationController conversationController = new ConversationController(conversationService, messageService);
        ReviewController reviewController = new ReviewController(reviewService);

        mockMvc = MockMvcBuilders.standaloneSetup(favoriteController, commentController, conversationController, reviewController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(authPrincipalResolver)
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/favorites returns 201 Created")
    void testAddFavorite_Returns201() throws Exception {
        FavoriteResponse response = FavoriteResponse.builder()
                .id(1L)
                .userId(10L)
                .listingId(100L)
                .createdAt(LocalDateTime.now())
                .build();

        when(favoriteService.addFavorite(eq(10L), any(FavoriteRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/favorites")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new FavoriteRequest(100L))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1L))
                .andExpect(jsonPath("$.data.listingId").value(100L));
    }

    @Test
    @DisplayName("GET /api/v1/favorites/count/{listingId} returns 200 OK")
    void testGetFavoriteCount_Returns200() throws Exception {
        when(favoriteService.getFavoriteCount(100L)).thenReturn(new FavoriteCountResponse(100L, 7L));

        mockMvc.perform(get("/api/v1/favorites/count/100")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.count").value(7L));
    }

    @Test
    @DisplayName("GET /api/v1/comments/listing/{listingId} returns 200 OK")
    void testGetCommentsByListing_Returns200() throws Exception {
        PagedResponse<CommentResponse> pagedResponse = PagedResponse.<CommentResponse>builder()
                .content(List.of(CommentResponse.builder()
                        .id(1L)
                        .listingId(100L)
                        .userId(20L)
                        .content("Nice product!")
                        .build()))
                .page(0)
                .size(10)
                .totalElements(1)
                .totalPages(1)
                .last(true)
                .build();

        when(commentService.getCommentsByListing(eq(100L), anyInt(), anyInt())).thenReturn(pagedResponse);

        mockMvc.perform(get("/api/v1/comments/listing/100")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].content").value("Nice product!"));
    }

    @Test
    @DisplayName("POST /api/v1/comments with blank content returns 400 Bad Request validation error")
    void testAddComment_BlankContent_Returns400() throws Exception {
        CreateCommentRequest request = CreateCommentRequest.builder()
                .listingId(100L)
                .content("   ") // Blank
                .build();

        mockMvc.perform(post("/api/v1/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("POST /api/v1/conversations returns 201 Created")
    void testStartConversation_Returns201() throws Exception {
        ConversationResponse response = ConversationResponse.builder()
                .id(1L)
                .listingId(100L)
                .buyerId(10L)
                .sellerId(20L)
                .build();

        when(conversationService.startOrGetConversation(eq(10L), any(CreateConversationRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/conversations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateConversationRequest(100L, 20L))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    @DisplayName("GET /api/v1/reviews/user/{userId}/summary returns 200 OK")
    void testGetReviewSummary_Returns200() throws Exception {
        ReviewSummaryResponse summary = ReviewSummaryResponse.builder()
                .userId(20L)
                .averageRating(4.8)
                .totalReviews(10)
                .ratingBreakdown(Map.of(5, 8L, 4, 2L))
                .build();

        when(reviewService.getReviewSummaryForUser(20L)).thenReturn(summary);

        mockMvc.perform(get("/api/v1/reviews/user/20/summary")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.averageRating").value(4.8))
                .andExpect(jsonPath("$.data.totalReviews").value(10));
    }
}
