package com.stu.marketplace.moderation.dto;

import com.stu.marketplace.moderation.entity.KeywordSeverity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckTextResponse {

    private boolean clean;
    private List<String> flaggedKeywords;
    private KeywordSeverity severity;
    private String suggestedAction; // "PASS", "FLAG_FOR_REVIEW", "AUTO_REJECT"
}
