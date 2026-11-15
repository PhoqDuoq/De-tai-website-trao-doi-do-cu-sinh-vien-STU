package com.stu.marketplace.moderation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.stu.marketplace.moderation.dto.*;
import com.stu.marketplace.moderation.entity.*;
import com.stu.marketplace.moderation.exception.GlobalExceptionHandler;
import com.stu.marketplace.moderation.security.UserPrincipal;
import com.stu.marketplace.moderation.service.ForbiddenKeywordService;
import com.stu.marketplace.moderation.service.ModerationAuditLogService;
import com.stu.marketplace.moderation.service.PenaltyService;
import com.stu.marketplace.moderation.service.ReportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ModerationControllerIntegrationTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock
    private ReportService reportService;

    @Mock
    private ForbiddenKeywordService keywordService;

    @Mock
    private PenaltyService penaltyService;

    @Mock
    private ModerationAuditLogService auditLogService;

    private UserPrincipal testPrincipal;

    @BeforeEach
    void setUp() {
        testPrincipal = UserPrincipal.builder()
                .id(10L)
                .email("student10@stu.edu.vn")
                .studentCode("DH52001010")
                .accountStatus("ACTIVE")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_STUDENT"), new SimpleGrantedAuthority("ROLE_MODERATOR")))
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

        ReportController reportController = new ReportController(reportService);
        ForbiddenKeywordController keywordController = new ForbiddenKeywordController(keywordService);
        PenaltyController penaltyController = new PenaltyController(penaltyService);
        ModerationAuditController auditController = new ModerationAuditController(auditLogService);

        mockMvc = MockMvcBuilders
                .standaloneSetup(reportController, keywordController, penaltyController, auditController)
                .setCustomArgumentResolvers(authPrincipalResolver, new PageableHandlerMethodArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/reports creates a report and returns 201 Created")
    void testSubmitReport() throws Exception {
        CreateReportRequest req = CreateReportRequest.builder()
                .targetType(ReportTargetType.LISTING)
                .targetId(50L)
                .reason(ReportReason.PROHIBITED_GOODS)
                .details("Suspected illicit trade")
                .build();

        ReportResponse response = ReportResponse.builder()
                .id(1L)
                .reporterId(10L)
                .targetType(ReportTargetType.LISTING)
                .targetId(50L)
                .reason(ReportReason.PROHIBITED_GOODS)
                .details("Suspected illicit trade")
                .status(ReportStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        when(reportService.createReport(any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    @DisplayName("GET /api/v1/reports/my-reports returns user's submitted reports")
    void testGetMyReports() throws Exception {
        ReportResponse r = ReportResponse.builder()
                .id(1L)
                .reporterId(10L)
                .targetType(ReportTargetType.LISTING)
                .targetId(50L)
                .reason(ReportReason.SPAM)
                .status(ReportStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        PagedResponse<ReportResponse> pagedResponse = PagedResponse.<ReportResponse>builder()
                .content(List.of(r))
                .page(0)
                .size(20)
                .totalElements(1)
                .totalPages(1)
                .last(true)
                .build();

        when(reportService.getMyReports(any(), any())).thenReturn(pagedResponse);

        mockMvc.perform(get("/api/v1/reports/my-reports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].id").value(1));
    }

    @Test
    @DisplayName("PATCH /api/v1/moderation/reports/1/assign claims report")
    void testAssignReport() throws Exception {
        ReportResponse response = ReportResponse.builder()
                .id(1L)
                .status(ReportStatus.INVESTIGATING)
                .assignedModeratorId(10L)
                .build();

        when(reportService.assignReport(eq(1L), any())).thenReturn(response);

        mockMvc.perform(patch("/api/v1/moderation/reports/1/assign"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("INVESTIGATING"))
                .andExpect(jsonPath("$.data.assignedModeratorId").value(10));
    }

    @Test
    @DisplayName("PATCH /api/v1/moderation/reports/1/resolve resolves report")
    void testResolveReport() throws Exception {
        ResolveReportRequest req = ResolveReportRequest.builder()
                .resolutionAction(ResolutionAction.CONTENT_REMOVED)
                .resolutionNotes("Removed infringing listing")
                .build();

        ReportResponse response = ReportResponse.builder()
                .id(1L)
                .status(ReportStatus.RESOLVED)
                .resolutionAction(ResolutionAction.CONTENT_REMOVED)
                .resolutionNotes("Removed infringing listing")
                .build();

        when(reportService.resolveReport(eq(1L), any(), any())).thenReturn(response);

        mockMvc.perform(patch("/api/v1/moderation/reports/1/resolve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("RESOLVED"));
    }

    @Test
    @DisplayName("POST /api/v1/moderation/keywords/check checks content for forbidden words")
    void testCheckKeywords() throws Exception {
        CheckTextRequest req = CheckTextRequest.builder()
                .text("Bán giáo trình giải tích")
                .build();

        CheckTextResponse checkResponse = CheckTextResponse.builder()
                .clean(true)
                .flaggedKeywords(Collections.emptyList())
                .suggestedAction("PASS")
                .build();

        when(keywordService.checkContent(anyString())).thenReturn(checkResponse);

        mockMvc.perform(post("/api/v1/moderation/keywords/check")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.clean").value(true))
                .andExpect(jsonPath("$.data.suggestedAction").value("PASS"));
    }

    @Test
    @DisplayName("POST /api/v1/moderation/penalties creates penalty")
    void testIssuePenalty() throws Exception {
        IssuePenaltyRequest req = IssuePenaltyRequest.builder()
                .userId(30L)
                .penaltyType(PenaltyType.WARNING)
                .reason("First warning for inappropriate content")
                .build();

        PenaltyResponse response = PenaltyResponse.builder()
                .id(1L)
                .userId(30L)
                .penaltyType(PenaltyType.WARNING)
                .reason("First warning for inappropriate content")
                .issuedBy(10L)
                .createdAt(LocalDateTime.now())
                .build();

        when(penaltyService.issuePenalty(any(), anyLong())).thenReturn(response);

        mockMvc.perform(post("/api/v1/moderation/penalties")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.penaltyType").value("WARNING"));
    }
}
