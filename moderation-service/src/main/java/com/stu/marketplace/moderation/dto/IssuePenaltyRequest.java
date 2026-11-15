package com.stu.marketplace.moderation.dto;

import com.stu.marketplace.moderation.entity.PenaltyType;
import jakarta.validation.constraints.NotBlank;
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
public class IssuePenaltyRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    private Long reportId;

    @NotNull(message = "Penalty type is required")
    private PenaltyType penaltyType;

    @NotBlank(message = "Reason is required")
    @Size(max = 255, message = "Reason cannot exceed 255 characters")
    private String reason;

    private Integer durationDays;
}
