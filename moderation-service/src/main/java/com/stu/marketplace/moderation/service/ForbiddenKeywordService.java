package com.stu.marketplace.moderation.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.moderation.dto.*;
import com.stu.marketplace.moderation.entity.ForbiddenKeyword;
import com.stu.marketplace.moderation.entity.KeywordSeverity;
import com.stu.marketplace.moderation.repository.ForbiddenKeywordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ForbiddenKeywordService {

    private final ForbiddenKeywordRepository keywordRepository;
    private final ModerationAuditLogService auditLogService;

    @Transactional(readOnly = true)
    public CheckTextResponse checkContent(String text) {
        if (!StringUtils.hasText(text)) {
            return CheckTextResponse.builder()
                    .clean(true)
                    .flaggedKeywords(Collections.emptyList())
                    .suggestedAction("PASS")
                    .build();
        }

        List<ForbiddenKeyword> activeKeywords = keywordRepository.findByIsActiveTrue();
        String normalizedText = text.toLowerCase();

        List<String> flagged = new ArrayList<>();
        boolean hasAutoReject = false;

        for (ForbiddenKeyword kw : activeKeywords) {
            String term = kw.getKeyword().toLowerCase().trim();
            if (StringUtils.hasText(term) && normalizedText.contains(term)) {
                flagged.add(kw.getKeyword());
                if (kw.getSeverity() == KeywordSeverity.AUTO_REJECT) {
                    hasAutoReject = true;
                }
            }
        }

        if (flagged.isEmpty()) {
            return CheckTextResponse.builder()
                    .clean(true)
                    .flaggedKeywords(Collections.emptyList())
                    .suggestedAction("PASS")
                    .build();
        }

        KeywordSeverity highestSeverity = hasAutoReject ? KeywordSeverity.AUTO_REJECT : KeywordSeverity.FLAG_FOR_REVIEW;
        String action = hasAutoReject ? "AUTO_REJECT" : "FLAG_FOR_REVIEW";

        return CheckTextResponse.builder()
                .clean(false)
                .flaggedKeywords(flagged)
                .severity(highestSeverity)
                .suggestedAction(action)
                .build();
    }

    @Transactional
    public KeywordResponse createKeyword(CreateKeywordRequest req, Long moderatorId) {
        String trimmed = req.getKeyword().trim();
        if (keywordRepository.existsByKeywordIgnoreCase(trimmed)) {
            throw new AppException(ErrorCode.KEYWORD_ALREADY_EXISTS, "Forbidden keyword '" + trimmed + "' already exists");
        }

        ForbiddenKeyword entity = ForbiddenKeyword.builder()
                .keyword(trimmed)
                .category(req.getCategory() != null ? req.getCategory().trim() : "PROHIBITED_ITEM")
                .severity(req.getSeverity() != null ? req.getSeverity() : KeywordSeverity.FLAG_FOR_REVIEW)
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .build();

        ForbiddenKeyword saved = keywordRepository.save(entity);
        auditLogService.logAction(moderatorId, "ADD_KEYWORD", "KEYWORD", saved.getId().longValue(), "Added keyword: " + trimmed);
        return KeywordResponse.fromEntity(saved);
    }

    @Transactional
    public KeywordResponse updateKeyword(Integer id, UpdateKeywordRequest req, Long moderatorId) {
        ForbiddenKeyword entity = keywordRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.KEYWORD_NOT_FOUND, "Keyword not found with id: " + id));

        if (StringUtils.hasText(req.getKeyword())) {
            String trimmed = req.getKeyword().trim();
            if (!trimmed.equalsIgnoreCase(entity.getKeyword()) && keywordRepository.existsByKeywordIgnoreCase(trimmed)) {
                throw new AppException(ErrorCode.KEYWORD_ALREADY_EXISTS, "Keyword '" + trimmed + "' already exists");
            }
            entity.setKeyword(trimmed);
        }

        if (StringUtils.hasText(req.getCategory())) {
            entity.setCategory(req.getCategory().trim());
        }
        if (req.getSeverity() != null) {
            entity.setSeverity(req.getSeverity());
        }
        if (req.getIsActive() != null) {
            entity.setIsActive(req.getIsActive());
        }

        ForbiddenKeyword updated = keywordRepository.save(entity);
        auditLogService.logAction(moderatorId, "UPDATE_KEYWORD", "KEYWORD", updated.getId().longValue(), "Updated keyword: " + updated.getKeyword());
        return KeywordResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteKeyword(Integer id, Long moderatorId) {
        ForbiddenKeyword entity = keywordRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.KEYWORD_NOT_FOUND, "Keyword not found with id: " + id));

        keywordRepository.delete(entity);
        auditLogService.logAction(moderatorId, "DELETE_KEYWORD", "KEYWORD", id.longValue(), "Deleted keyword: " + entity.getKeyword());
    }

    @Transactional(readOnly = true)
    public PagedResponse<KeywordResponse> getAllKeywords(Pageable pageable) {
        Page<ForbiddenKeyword> page = keywordRepository.findAll(pageable);
        return PagedResponse.from(page.map(KeywordResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public List<KeywordResponse> getActiveKeywords() {
        return keywordRepository.findByIsActiveTrue().stream()
                .map(KeywordResponse::fromEntity)
                .toList();
    }
}
