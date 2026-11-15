package com.stu.marketplace.moderation.dto;

import com.stu.marketplace.moderation.entity.ReportReason;
import com.stu.marketplace.moderation.entity.ReportTargetType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReportRequest {

    @NotNull(message = "Target type is required")
    private ReportTargetType targetType;

    @NotNull(message = "Target ID is required")
    private Long targetId;

    @NotNull(message = "Report reason is required")
    private ReportReason reason;

    @Size(max = 2000, message = "Details cannot exceed 2000 characters")
    private String details;

    @Size(max = 255, message = "Evidence image URL cannot exceed 255 characters")
    private String evidenceImageUrl;
}
