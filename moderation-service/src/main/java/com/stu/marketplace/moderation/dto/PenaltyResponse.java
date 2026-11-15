package com.stu.marketplace.moderation.dto;

import com.stu.marketplace.moderation.entity.Penalty;
import com.stu.marketplace.moderation.entity.PenaltyType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PenaltyResponse {

    private Long id;
    private Long userId;
    private Long reportId;
    private PenaltyType penaltyType;
    private String reason;
    private Integer durationDays;
    private Long issuedBy;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;

    public static PenaltyResponse fromEntity(Penalty entity) {
        return PenaltyResponse.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .reportId(entity.getReportId())
                .penaltyType(entity.getPenaltyType())
                .reason(entity.getReason())
                .durationDays(entity.getDurationDays())
                .issuedBy(entity.getIssuedBy())
                .expiresAt(entity.getExpiresAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
