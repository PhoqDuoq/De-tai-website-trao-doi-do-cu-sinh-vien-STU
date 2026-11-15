package com.stu.marketplace.moderation.dto;

import com.stu.marketplace.moderation.entity.ModerationAuditLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModerationAuditLogResponse {

    private Long id;
    private Long moderatorId;
    private String actionType;
    private String targetType;
    private Long targetId;
    private String reason;
    private LocalDateTime createdAt;

    public static ModerationAuditLogResponse fromEntity(ModerationAuditLog entity) {
        return ModerationAuditLogResponse.builder()
                .id(entity.getId())
                .moderatorId(entity.getModeratorId())
                .actionType(entity.getActionType())
                .targetType(entity.getTargetType())
                .targetId(entity.getTargetId())
                .reason(entity.getReason())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
