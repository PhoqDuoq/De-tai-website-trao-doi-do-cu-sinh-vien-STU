package com.stu.marketplace.moderation.controller;

import com.stu.marketplace.common.dto.ApiResponse;
import com.stu.marketplace.moderation.dto.ModerationAuditLogResponse;
import com.stu.marketplace.moderation.dto.PagedResponse;
import com.stu.marketplace.moderation.service.ModerationAuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/moderation/audit-logs")
@RequiredArgsConstructor
public class ModerationAuditController {

    private final ModerationAuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<ModerationAuditLogResponse>>> getAuditLogs(
            @RequestParam(required = false) Long moderatorId,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PagedResponse<ModerationAuditLogResponse> response;
        if (moderatorId != null) {
            response = auditLogService.getAuditLogsByModerator(moderatorId, pageable);
        } else {
            response = auditLogService.getAuditLogs(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success("Moderation audit logs retrieved", response));
    }

    @GetMapping("/target")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<ModerationAuditLogResponse>>> getAuditLogsByTarget(
            @RequestParam String targetType,
            @RequestParam Long targetId,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PagedResponse<ModerationAuditLogResponse> response = auditLogService.getAuditLogsByTarget(targetType, targetId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Target audit logs retrieved", response));
    }
}
