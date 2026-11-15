package com.stu.marketplace.moderation.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.moderation.dto.*;
import com.stu.marketplace.moderation.entity.ForbiddenKeyword;
import com.stu.marketplace.moderation.entity.KeywordSeverity;
import com.stu.marketplace.moderation.repository.ForbiddenKeywordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ForbiddenKeywordServiceTest {

    @Mock
    private ForbiddenKeywordRepository keywordRepository;

    @Mock
    private ModerationAuditLogService auditLogService;

    @InjectMocks
    private ForbiddenKeywordService keywordService;

    private ForbiddenKeyword weaponKeyword;
    private ForbiddenKeyword scamKeyword;

    @BeforeEach
    void setUp() {
        weaponKeyword = ForbiddenKeyword.builder()
                .id(1)
                .keyword("vũ khí")
                .category("WEAPONS")
                .severity(KeywordSeverity.AUTO_REJECT)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();

        scamKeyword = ForbiddenKeyword.builder()
                .id(2)
                .keyword("việc nhẹ lương cao")
                .category("SCAM")
                .severity(KeywordSeverity.FLAG_FOR_REVIEW)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("checkContent returns clean true for empty or null text")
    void checkContent_emptyText_returnsClean() {
        CheckTextResponse responseNull = keywordService.checkContent(null);
        assertThat(responseNull.isClean()).isTrue();
        assertThat(responseNull.getSuggestedAction()).isEqualTo("PASS");

        CheckTextResponse responseEmpty = keywordService.checkContent("   ");
        assertThat(responseEmpty.isClean()).isTrue();
        assertThat(responseEmpty.getSuggestedAction()).isEqualTo("PASS");
    }

    @Test
    @DisplayName("checkContent returns clean true when no forbidden keywords match")
    void checkContent_cleanText_returnsClean() {
        when(keywordRepository.findByIsActiveTrue()).thenReturn(List.of(weaponKeyword, scamKeyword));

        CheckTextResponse response = keywordService.checkContent("Cần bán giáo trình giải tích 1 còn mới");
        assertThat(response.isClean()).isTrue();
        assertThat(response.getFlaggedKeywords()).isEmpty();
        assertThat(response.getSuggestedAction()).isEqualTo("PASS");
    }

    @Test
    @DisplayName("checkContent flags auto-reject keyword with case insensitivity")
    void checkContent_autoRejectKeyword_returnsAutoReject() {
        when(keywordRepository.findByIsActiveTrue()).thenReturn(List.of(weaponKeyword, scamKeyword));

        CheckTextResponse response = keywordService.checkContent("Bán VŨ KHÍ cận chiến tự vệ sinh viên");
        assertThat(response.isClean()).isFalse();
        assertThat(response.getFlaggedKeywords()).contains("vũ khí");
        assertThat(response.getSeverity()).isEqualTo(KeywordSeverity.AUTO_REJECT);
        assertThat(response.getSuggestedAction()).isEqualTo("AUTO_REJECT");
    }

    @Test
    @DisplayName("checkContent flags review keyword when only FLAG_FOR_REVIEW matches")
    void checkContent_flagForReviewKeyword_returnsFlagForReview() {
        when(keywordRepository.findByIsActiveTrue()).thenReturn(List.of(scamKeyword));

        CheckTextResponse response = keywordService.checkContent("Tuyển CTV Việc Nhẹ Lương Cao tại ký túc xá");
        assertThat(response.isClean()).isFalse();
        assertThat(response.getFlaggedKeywords()).contains("việc nhẹ lương cao");
        assertThat(response.getSeverity()).isEqualTo(KeywordSeverity.FLAG_FOR_REVIEW);
        assertThat(response.getSuggestedAction()).isEqualTo("FLAG_FOR_REVIEW");
    }

    @Test
    @DisplayName("createKeyword saves keyword and logs audit action")
    void createKeyword_success() {
        when(keywordRepository.existsByKeywordIgnoreCase("chất cấm")).thenReturn(false);
        when(keywordRepository.save(any(ForbiddenKeyword.class))).thenAnswer(invocation -> {
            ForbiddenKeyword k = invocation.getArgument(0);
            k.setId(10);
            k.setCreatedAt(LocalDateTime.now());
            return k;
        });

        CreateKeywordRequest req = CreateKeywordRequest.builder()
                .keyword("chất cấm")
                .category("PROHIBITED_GOODS")
                .severity(KeywordSeverity.AUTO_REJECT)
                .isActive(true)
                .build();

        KeywordResponse response = keywordService.createKeyword(req, 100L);

        assertThat(response.getId()).isEqualTo(10);
        assertThat(response.getKeyword()).isEqualTo("chất cấm");
        verify(keywordRepository).save(any(ForbiddenKeyword.class));
        verify(auditLogService).logAction(eq(100L), eq("ADD_KEYWORD"), eq("KEYWORD"), eq(10L), anyString());
    }

    @Test
    @DisplayName("createKeyword throws conflict when keyword already exists")
    void createKeyword_duplicate_throwsConflict() {
        when(keywordRepository.existsByKeywordIgnoreCase("vũ khí")).thenReturn(true);

        CreateKeywordRequest req = CreateKeywordRequest.builder()
                .keyword("vũ khí")
                .build();

        assertThatThrownBy(() -> keywordService.createKeyword(req, 100L))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    @DisplayName("updateKeyword updates fields and logs audit")
    void updateKeyword_success() {
        when(keywordRepository.findById(1)).thenReturn(Optional.of(weaponKeyword));
        when(keywordRepository.save(any(ForbiddenKeyword.class))).thenReturn(weaponKeyword);

        UpdateKeywordRequest req = UpdateKeywordRequest.builder()
                .category("MILITARY_WEAPONS")
                .severity(KeywordSeverity.AUTO_REJECT)
                .isActive(false)
                .build();

        KeywordResponse response = keywordService.updateKeyword(1, req, 100L);

        assertThat(weaponKeyword.getCategory()).isEqualTo("MILITARY_WEAPONS");
        assertThat(weaponKeyword.getIsActive()).isFalse();
        verify(auditLogService).logAction(eq(100L), eq("UPDATE_KEYWORD"), eq("KEYWORD"), eq(1L), anyString());
    }

    @Test
    @DisplayName("deleteKeyword removes keyword and logs audit")
    void deleteKeyword_success() {
        when(keywordRepository.findById(1)).thenReturn(Optional.of(weaponKeyword));

        keywordService.deleteKeyword(1, 100L);

        verify(keywordRepository).delete(weaponKeyword);
        verify(auditLogService).logAction(eq(100L), eq("DELETE_KEYWORD"), eq("KEYWORD"), eq(1L), anyString());
    }
}
