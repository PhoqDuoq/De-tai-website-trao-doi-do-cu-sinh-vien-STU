package com.stu.marketplace.moderation.service;

import com.stu.marketplace.moderation.dto.ModerationAuditLogResponse;
import com.stu.marketplace.moderation.dto.PagedResponse;
import com.stu.marketplace.moderation.entity.ModerationAuditLog;
import com.stu.marketplace.moderation.repository.ModerationAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ModerationAuditLogService {

    private final ModerationAuditLogRepository auditLogRepository;

    @Transactional
    public ModerationAuditLog logAction(Long moderatorId, String actionType, String targetType, Long targetId, String reason) {
        log.info("Moderator {} performed {} on {} id: {}, reason: {}", moderatorId, actionType, targetType, targetId, reason);
        ModerationAuditLog auditLog = ModerationAuditLog.builder()
                .moderatorId(moderatorId)
                .actionType(actionType)
                .targetType(targetType)
                .targetId(targetId)
                .reason(reason)
                .build();
        return auditLogRepository.save(auditLog);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ModerationAuditLogResponse> getAuditLogs(Pageable pageable) {
        Page<ModerationAuditLog> page = auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        return PagedResponse.from(page.map(ModerationAuditLogResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public PagedResponse<ModerationAuditLogResponse> getAuditLogsByModerator(Long moderatorId, Pageable pageable) {
        Page<ModerationAuditLog> page = auditLogRepository.findByModeratorId(moderatorId, pageable);
        return PagedResponse.from(page.map(ModerationAuditLogResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public PagedResponse<ModerationAuditLogResponse> getAuditLogsByTarget(String targetType, Long targetId, Pageable pageable) {
        Page<ModerationAuditLog> page = auditLogRepository.findByTargetTypeAndTargetId(targetType, targetId, pageable);
        return PagedResponse.from(page.map(ModerationAuditLogResponse::fromEntity));
    }
}
