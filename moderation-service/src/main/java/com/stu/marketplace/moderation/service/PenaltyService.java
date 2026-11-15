package com.stu.marketplace.moderation.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.moderation.dto.IssuePenaltyRequest;
import com.stu.marketplace.moderation.dto.PagedResponse;
import com.stu.marketplace.moderation.dto.PenaltyResponse;
import com.stu.marketplace.moderation.entity.Penalty;
import com.stu.marketplace.moderation.entity.PenaltyType;
import com.stu.marketplace.moderation.repository.PenaltyRepository;
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
public class PenaltyService {

    private final PenaltyRepository penaltyRepository;
    private final ModerationAuditLogService auditLogService;

    @Transactional
    public PenaltyResponse issuePenalty(IssuePenaltyRequest req, Long moderatorId) {
        if (req.getPenaltyType() == PenaltyType.TEMPORARY_BAN) {
            if (req.getDurationDays() == null || req.getDurationDays() <= 0) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Duration in days must be greater than 0 for TEMPORARY_BAN");
            }
        }

        LocalDateTime expiresAt = null;
        if (req.getPenaltyType() == PenaltyType.TEMPORARY_BAN && req.getDurationDays() != null) {
            expiresAt = LocalDateTime.now().plusDays(req.getDurationDays());
        }

        Penalty penalty = Penalty.builder()
                .userId(req.getUserId())
                .reportId(req.getReportId())
                .penaltyType(req.getPenaltyType())
                .reason(req.getReason())
                .durationDays(req.getDurationDays())
                .issuedBy(moderatorId)
                .expiresAt(expiresAt)
                .build();

        Penalty saved = penaltyRepository.save(penalty);
        auditLogService.logAction(
                moderatorId,
                "ISSUE_PENALTY_" + req.getPenaltyType().name(),
                "USER",
                req.getUserId(),
                "Penalty issued: " + req.getReason()
        );

        return PenaltyResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<PenaltyResponse> getPenaltiesForUser(Long userId) {
        return penaltyRepository.findByUserId(userId).stream()
                .map(PenaltyResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public PagedResponse<PenaltyResponse> getAllPenalties(Pageable pageable) {
        Page<Penalty> page = penaltyRepository.findAllByOrderByCreatedAtDesc(pageable);
        return PagedResponse.from(page.map(PenaltyResponse::fromEntity));
    }
}
