package com.stu.marketplace.moderation.controller;

import com.stu.marketplace.common.dto.ApiResponse;
import com.stu.marketplace.moderation.dto.*;
import com.stu.marketplace.moderation.entity.ReportReason;
import com.stu.marketplace.moderation.entity.ReportStatus;
import com.stu.marketplace.moderation.entity.ReportTargetType;
import com.stu.marketplace.moderation.security.UserPrincipal;
import com.stu.marketplace.moderation.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    // Student & User Endpoints
    @PostMapping("/api/v1/reports")
    public ResponseEntity<ApiResponse<ReportResponse>> submitReport(
            @Valid @RequestBody CreateReportRequest req,
            @AuthenticationPrincipal UserPrincipal reporter
    ) {
        ReportResponse response = reportService.createReport(req, reporter);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Report submitted successfully", response));
    }

    @GetMapping("/api/v1/reports/my-reports")
    public ResponseEntity<ApiResponse<PagedResponse<ReportResponse>>> getMyReports(
            @AuthenticationPrincipal UserPrincipal reporter,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PagedResponse<ReportResponse> response = reportService.getMyReports(reporter, pageable);
        return ResponseEntity.ok(ApiResponse.success("Reports retrieved successfully", response));
    }

    // Moderator Queue & Management Endpoints
    @GetMapping("/api/v1/moderation/reports")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<ReportResponse>>> getReportQueue(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false) ReportTargetType targetType,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PagedResponse<ReportResponse> response = reportService.getReportQueue(status, targetType, pageable);
        return ResponseEntity.ok(ApiResponse.success("Moderation queue retrieved", response));
    }

    @GetMapping("/api/v1/moderation/reports/{id}")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<ReportResponse>> getReportById(@PathVariable Long id) {
        ReportResponse response = reportService.getReportById(id);
        return ResponseEntity.ok(ApiResponse.success("Report details retrieved", response));
    }

    @PatchMapping("/api/v1/moderation/reports/{id}/assign")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<ReportResponse>> assignReport(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal moderator
    ) {
        ReportResponse response = reportService.assignReport(id, moderator);
        return ResponseEntity.ok(ApiResponse.success("Report assigned to moderator", response));
    }

    @PatchMapping("/api/v1/moderation/reports/{id}/resolve")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<ReportResponse>> resolveReport(
            @PathVariable Long id,
            @Valid @RequestBody ResolveReportRequest req,
            @AuthenticationPrincipal UserPrincipal moderator
    ) {
        ReportResponse response = reportService.resolveReport(id, req, moderator);
        return ResponseEntity.ok(ApiResponse.success("Report resolved successfully", response));
    }

    @PatchMapping("/api/v1/moderation/reports/{id}/dismiss")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<ReportResponse>> dismissReport(
            @PathVariable Long id,
            @Valid @RequestBody DismissReportRequest req,
            @AuthenticationPrincipal UserPrincipal moderator
    ) {
        ReportResponse response = reportService.dismissReport(id, req, moderator);
        return ResponseEntity.ok(ApiResponse.success("Report dismissed", response));
    }
}
