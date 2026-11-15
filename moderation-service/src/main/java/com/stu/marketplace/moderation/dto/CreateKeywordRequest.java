package com.stu.marketplace.moderation.dto;

import com.stu.marketplace.moderation.entity.KeywordSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateKeywordRequest {

    @NotBlank(message = "Keyword cannot be blank")
    @Size(max = 100, message = "Keyword cannot exceed 100 characters")
    private String keyword;

    @Builder.Default
    private String category = "PROHIBITED_ITEM";

    @Builder.Default
    private KeywordSeverity severity = KeywordSeverity.FLAG_FOR_REVIEW;

    @Builder.Default
    private Boolean isActive = true;
}
