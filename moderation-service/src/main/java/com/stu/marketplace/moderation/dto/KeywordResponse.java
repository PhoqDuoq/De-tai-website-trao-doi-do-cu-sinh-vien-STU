package com.stu.marketplace.moderation.dto;

import com.stu.marketplace.moderation.entity.ForbiddenKeyword;
import com.stu.marketplace.moderation.entity.KeywordSeverity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KeywordResponse {

    private Integer id;
    private String keyword;
    private String category;
    private KeywordSeverity severity;
    private Boolean isActive;
    private LocalDateTime createdAt;

    public static KeywordResponse fromEntity(ForbiddenKeyword entity) {
        return KeywordResponse.builder()
                .id(entity.getId())
                .keyword(entity.getKeyword())
                .category(entity.getCategory())
                .severity(entity.getSeverity())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
