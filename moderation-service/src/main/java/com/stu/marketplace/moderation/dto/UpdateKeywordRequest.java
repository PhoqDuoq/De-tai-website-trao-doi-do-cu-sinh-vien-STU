package com.stu.marketplace.moderation.dto;

import com.stu.marketplace.moderation.entity.KeywordSeverity;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateKeywordRequest {

    @Size(max = 100, message = "Keyword cannot exceed 100 characters")
    private String keyword;

    private String category;

    private KeywordSeverity severity;

    private Boolean isActive;
}
