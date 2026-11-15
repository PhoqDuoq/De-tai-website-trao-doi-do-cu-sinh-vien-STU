package com.stu.marketplace.moderation.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.moderation.dto.*;
import com.stu.marketplace.moderation.entity.*;
import com.stu.marketplace.moderation.repository.ReportRepository;
import com.stu.marketplace.moderation.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final ModerationAuditLogService auditLogService;
    private final PenaltyService penaltyService;

    @Transactional
    public ReportResponse createReport(CreateReportRequest req, UserPrincipal reporter) {
        // Anti-self report invariant
        if (req.getTargetType() == ReportTargetType.USER && req.getTargetId().equals(reporter.getId())) {
            throw new AppException(ErrorCode.CANNOT_REPORT_SELF, "User cannot report themselves");
        }

        // Anti-duplicate pending report invariant
        boolean existsPending = reportRepository.existsByReporterIdAndTargetTypeAndTargetIdAndStatusIn(
                reporter.getId(),
                req.getTargetType(),
                req.getTargetId(),
                List.of(ReportStatus.PENDING, ReportStatus.INVESTIGATING)
        );
        if (existsPending) {
            throw new AppException(ErrorCode.REPORT_ALREADY_EXISTS,
                    "A pending or investigating report already exists for this target by you");
        }

        Report report = Report.builder()
                .reporterId(reporter.getId())
                .targetType(req.getTargetType())
                .targetId(req.getTargetId())
                .reason(req.getReason())
                .details(req.getDetails())
                .evidenceImageUrl(req.getEvidenceImageUrl())
                .status(ReportStatus.PENDING)
                .build();

        Report saved = reportRepository.save(report);
        log.info("Report {} submitted by user {} against {} id: {}",
                saved.getId(), reporter.getId(), req.getTargetType(), req.getTargetId());
        return ReportResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ReportResponse> getMyReports(UserPrincipal reporter, Pageable pageable) {
        Page<Report> page = reportRepository.findByReporterId(reporter.getId(), pageable);
        return PagedResponse.from(page.map(ReportResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public PagedResponse<ReportResponse> getReportQueue(ReportStatus status, ReportTargetType targetType, Pageable pageable) {
        Page<Report> page;
        if (status != null && targetType != null) {
            page = reportRepository.findByStatusAndTargetType(status, targetType, pageable);
        } else if (status != null) {
            page = reportRepository.findByStatus(status, pageable);
        } else if (targetType != null) {
            page = reportRepository.findByTargetType(targetType, pageable);
        } else {
            page = reportRepository.findAll(pageable);
        }
        return PagedResponse.from(page.map(ReportResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public ReportResponse getReportById(Long id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REPORT_NOT_FOUND, "Report not found with id: " + id));
        return ReportResponse.fromEntity(report);
    }

    @Transactional
    public ReportResponse assignReport(Long id, UserPrincipal moderator) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REPORT_NOT_FOUND, "Report not found with id: " + id));

        if (report.getStatus() != ReportStatus.PENDING) {
            throw new AppException(ErrorCode.REPORT_ALREADY_RESOLVED,
                    "Report is in status " + report.getStatus() + " and cannot be claimed");
        }

        report.setStatus(ReportStatus.INVESTIGATING);
        report.setAssignedModeratorId(moderator.getId());
        Report saved = reportRepository.save(report);

        auditLogService.logAction(
                moderator.getId(),
                "ASSIGN_REPORT",
                "REPORT",
                saved.getId(),
                "Claimed report for investigation"
        );

        return ReportResponse.fromEntity(saved);
    }

    @Transactional
    public ReportResponse resolveReport(Long id, ResolveReportRequest req, UserPrincipal moderator) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REPORT_NOT_FOUND, "Report not found with id: " + id));

        if (report.getStatus() == ReportStatus.RESOLVED || report.getStatus() == ReportStatus.DISMISSED) {
            throw new AppException(ErrorCode.REPORT_ALREADY_RESOLVED,
                    "Report has already been finalized with status: " + report.getStatus());
        }

        report.setStatus(ReportStatus.RESOLVED);
        report.setResolutionAction(req.getResolutionAction());
        report.setResolutionNotes(req.getResolutionNotes());
        report.setResolvedAt(LocalDateTime.now());
        report.setAssignedModeratorId(moderator.getId());

        Report saved = reportRepository.save(report);

        // If target is USER and action involves penalty, issue Penalty record
        if (report.getTargetType() == ReportTargetType.USER) {
            if (req.getResolutionAction() == ResolutionAction.USER_TEMPORARILY_BANNED) {
                penaltyService.issuePenalty(IssuePenaltyRequest.builder()
                        .userId(report.getTargetId())
                        .reportId(report.getId())
                        .penaltyType(PenaltyType.TEMPORARY_BAN)
                        .reason(req.getResolutionNotes())
                        .durationDays(7) // Standard 7-day temporary ban
                        .build(), moderator.getId());
            } else if (req.getResolutionAction() == ResolutionAction.USER_PERMANENTLY_BANNED) {
                penaltyService.issuePenalty(IssuePenaltyRequest.builder()
                        .userId(report.getTargetId())
                        .reportId(report.getId())
                        .penaltyType(PenaltyType.PERMANENT_BAN)
                        .reason(req.getResolutionNotes())
                        .build(), moderator.getId());
            } else if (req.getResolutionAction() == ResolutionAction.WARNING_SENT) {
                penaltyService.issuePenalty(IssuePenaltyRequest.builder()
                        .userId(report.getTargetId())
                        .reportId(report.getId())
                        .penaltyType(PenaltyType.WARNING)
                        .reason(req.getResolutionNotes())
                        .build(), moderator.getId());
            }
        }

        auditLogService.logAction(
                moderator.getId(),
                "RESOLVE_REPORT",
                "REPORT",
                saved.getId(),
                "Action: " + req.getResolutionAction() + ", notes: " + req.getResolutionNotes()
        );

        return ReportResponse.fromEntity(saved);
    }

    @Transactional
    public ReportResponse dismissReport(Long id, DismissReportRequest req, UserPrincipal moderator) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REPORT_NOT_FOUND, "Report not found with id: " + id));

        if (report.getStatus() == ReportStatus.RESOLVED || report.getStatus() == ReportStatus.DISMISSED) {
            throw new AppException(ErrorCode.REPORT_ALREADY_RESOLVED,
                    "Report has already been finalized with status: " + report.getStatus());
        }

        report.setStatus(ReportStatus.DISMISSED);
        report.setResolutionAction(ResolutionAction.NO_ACTION);
        report.setResolutionNotes(req.getResolutionNotes());
        report.setResolvedAt(LocalDateTime.now());
        report.setAssignedModeratorId(moderator.getId());

        Report saved = reportRepository.save(report);

        auditLogService.logAction(
                moderator.getId(),
                "DISMISS_REPORT",
                "REPORT",
                saved.getId(),
                "Dismissed: " + req.getResolutionNotes()
        );

        return ReportResponse.fromEntity(saved);
    }
}
