package com.stu.marketplace.moderation.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.moderation.dto.*;
import com.stu.marketplace.moderation.entity.*;
import com.stu.marketplace.moderation.repository.ReportRepository;
import com.stu.marketplace.moderation.security.UserPrincipal;
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
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private ModerationAuditLogService auditLogService;

    @Mock
    private PenaltyService penaltyService;

    @InjectMocks
    private ReportService reportService;

    private UserPrincipal studentPrincipal;
    private UserPrincipal moderatorPrincipal;
    private Report testReport;

    @BeforeEach
    void setUp() {
        studentPrincipal = UserPrincipal.builder()
                .id(10L)
                .email("student10@stu.edu.vn")
                .studentCode("DH52001010")
                .accountStatus("ACTIVE")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_STUDENT")))
                .build();

        moderatorPrincipal = UserPrincipal.builder()
                .id(999L)
                .email("mod@stu.edu.vn")
                .studentCode("DH52000999")
                .accountStatus("ACTIVE")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_MODERATOR")))
                .build();

        testReport = Report.builder()
                .id(1L)
                .reporterId(10L)
                .targetType(ReportTargetType.LISTING)
                .targetId(50L)
                .reason(ReportReason.PROHIBITED_GOODS)
                .details("Suspected prohibited item")
                .status(ReportStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("createReport succeeds for valid listing report")
    void createReport_validListing_success() {
        when(reportRepository.existsByReporterIdAndTargetTypeAndTargetIdAndStatusIn(anyLong(), any(), anyLong(), any()))
                .thenReturn(false);
        when(reportRepository.save(any(Report.class))).thenAnswer(invocation -> {
            Report r = invocation.getArgument(0);
            r.setId(100L);
            r.setCreatedAt(LocalDateTime.now());
            return r;
        });

        CreateReportRequest req = CreateReportRequest.builder()
                .targetType(ReportTargetType.LISTING)
                .targetId(50L)
                .reason(ReportReason.PROHIBITED_GOODS)
                .details("Suspicious prohibited weapon listing")
                .build();

        ReportResponse response = reportService.createReport(req, studentPrincipal);

        assertThat(response.getId()).isEqualTo(100L);
        assertThat(response.getStatus()).isEqualTo(ReportStatus.PENDING);
        assertThat(response.getReporterId()).isEqualTo(10L);
        verify(reportRepository).save(any(Report.class));
    }

    @Test
    @DisplayName("createReport throws CANNOT_REPORT_SELF when reporting own user profile")
    void createReport_selfReport_throwsException() {
        CreateReportRequest req = CreateReportRequest.builder()
                .targetType(ReportTargetType.USER)
                .targetId(10L) // same as studentPrincipal.id
                .reason(ReportReason.SPAM)
                .details("Reporting myself")
                .build();

        assertThatThrownBy(() -> reportService.createReport(req, studentPrincipal))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("User cannot report themselves");
    }

    @Test
    @DisplayName("createReport throws REPORT_ALREADY_EXISTS when pending report exists")
    void createReport_duplicatePending_throwsException() {
        when(reportRepository.existsByReporterIdAndTargetTypeAndTargetIdAndStatusIn(eq(10L), eq(ReportTargetType.LISTING), eq(50L), any()))
                .thenReturn(true);

        CreateReportRequest req = CreateReportRequest.builder()
                .targetType(ReportTargetType.LISTING)
                .targetId(50L)
                .reason(ReportReason.SPAM)
                .build();

        assertThatThrownBy(() -> reportService.createReport(req, studentPrincipal))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("already exists for this target");
    }

    @Test
    @DisplayName("assignReport transitions status from PENDING to INVESTIGATING")
    void assignReport_pendingReport_transitionsToInvestigating() {
        when(reportRepository.findById(1L)).thenReturn(Optional.of(testReport));
        when(reportRepository.save(any(Report.class))).thenReturn(testReport);

        ReportResponse response = reportService.assignReport(1L, moderatorPrincipal);

        assertThat(testReport.getStatus()).isEqualTo(ReportStatus.INVESTIGATING);
        assertThat(testReport.getAssignedModeratorId()).isEqualTo(999L);
        verify(auditLogService).logAction(eq(999L), eq("ASSIGN_REPORT"), eq("REPORT"), eq(1L), anyString());
    }

    @Test
    @DisplayName("assignReport throws exception if report is already RESOLVED")
    void assignReport_alreadyResolved_throwsException() {
        testReport.setStatus(ReportStatus.RESOLVED);
        when(reportRepository.findById(1L)).thenReturn(Optional.of(testReport));

        assertThatThrownBy(() -> reportService.assignReport(1L, moderatorPrincipal))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("cannot be claimed");
    }

    @Test
    @DisplayName("resolveReport transitions status to RESOLVED and logs audit")
    void resolveReport_investigatingReport_resolvesSuccessfully() {
        testReport.setStatus(ReportStatus.INVESTIGATING);
        testReport.setAssignedModeratorId(999L);
        when(reportRepository.findById(1L)).thenReturn(Optional.of(testReport));
        when(reportRepository.save(any(Report.class))).thenReturn(testReport);

        ResolveReportRequest req = ResolveReportRequest.builder()
                .resolutionAction(ResolutionAction.CONTENT_REMOVED)
                .resolutionNotes("Listing content removed due to policy violation")
                .build();

        ReportResponse response = reportService.resolveReport(1L, req, moderatorPrincipal);

        assertThat(testReport.getStatus()).isEqualTo(ReportStatus.RESOLVED);
        assertThat(testReport.getResolutionAction()).isEqualTo(ResolutionAction.CONTENT_REMOVED);
        assertThat(testReport.getResolvedAt()).isNotNull();
        verify(auditLogService).logAction(eq(999L), eq("RESOLVE_REPORT"), eq("REPORT"), eq(1L), anyString());
    }

    @Test
    @DisplayName("resolveReport on USER with ban issues penalty")
    void resolveReport_userTargetBan_issuesPenalty() {
        Report userReport = Report.builder()
                .id(2L)
                .reporterId(10L)
                .targetType(ReportTargetType.USER)
                .targetId(25L)
                .reason(ReportReason.FRAUD_SCAM)
                .status(ReportStatus.INVESTIGATING)
                .build();

        when(reportRepository.findById(2L)).thenReturn(Optional.of(userReport));
        when(reportRepository.save(any(Report.class))).thenReturn(userReport);

        ResolveReportRequest req = ResolveReportRequest.builder()
                .resolutionAction(ResolutionAction.USER_TEMPORARILY_BANNED)
                .resolutionNotes("Scam detected; 7 days temporary ban applied")
                .build();

        reportService.resolveReport(2L, req, moderatorPrincipal);

        assertThat(userReport.getStatus()).isEqualTo(ReportStatus.RESOLVED);
        verify(penaltyService).issuePenalty(argThat(p ->
                p.getUserId().equals(25L) &&
                p.getPenaltyType() == PenaltyType.TEMPORARY_BAN &&
                p.getDurationDays() == 7
        ), eq(999L));
    }

    @Test
    @DisplayName("dismissReport transitions status to DISMISSED")
    void dismissReport_success() {
        testReport.setStatus(ReportStatus.INVESTIGATING);
        when(reportRepository.findById(1L)).thenReturn(Optional.of(testReport));
        when(reportRepository.save(any(Report.class))).thenReturn(testReport);

        DismissReportRequest req = DismissReportRequest.builder()
                .resolutionNotes("Unfounded report after investigation")
                .build();

        ReportResponse response = reportService.dismissReport(1L, req, moderatorPrincipal);

        assertThat(testReport.getStatus()).isEqualTo(ReportStatus.DISMISSED);
        assertThat(testReport.getResolutionAction()).isEqualTo(ResolutionAction.NO_ACTION);
        verify(auditLogService).logAction(eq(999L), eq("DISMISS_REPORT"), eq("REPORT"), eq(1L), anyString());
    }
}
