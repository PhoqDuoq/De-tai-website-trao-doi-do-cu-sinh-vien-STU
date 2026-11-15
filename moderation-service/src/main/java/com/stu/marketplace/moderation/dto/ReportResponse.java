package com.stu.marketplace.moderation.dto;

import com.stu.marketplace.moderation.entity.Report;
import com.stu.marketplace.moderation.entity.ReportReason;
import com.stu.marketplace.moderation.entity.ReportStatus;
import com.stu.marketplace.moderation.entity.ReportTargetType;
import com.stu.marketplace.moderation.entity.ResolutionAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {

    private Long id;
    private Long reporterId;
    private ReportTargetType targetType;
    private Long targetId;
    private ReportReason reason;
    private String details;
    private String evidenceImageUrl;
    private ReportStatus status;
    private Long assignedModeratorId;
    private ResolutionAction resolutionAction;
    private String resolutionNotes;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;

    public static ReportResponse fromEntity(Report entity) {
        return ReportResponse.builder()
                .id(entity.getId())
                .reporterId(entity.getReporterId())
                .targetType(entity.getTargetType())
                .targetId(entity.getTargetId())
                .reason(entity.getReason())
                .details(entity.getDetails())
                .evidenceImageUrl(entity.getEvidenceImageUrl())
                .status(entity.getStatus())
                .assignedModeratorId(entity.getAssignedModeratorId())
                .resolutionAction(entity.getResolutionAction())
                .resolutionNotes(entity.getResolutionNotes())
                .resolvedAt(entity.getResolvedAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
