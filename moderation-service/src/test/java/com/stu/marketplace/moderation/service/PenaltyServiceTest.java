package com.stu.marketplace.moderation.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.moderation.dto.IssuePenaltyRequest;
import com.stu.marketplace.moderation.dto.PenaltyResponse;
import com.stu.marketplace.moderation.entity.Penalty;
import com.stu.marketplace.moderation.entity.PenaltyType;
import com.stu.marketplace.moderation.repository.PenaltyRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PenaltyServiceTest {

    @Mock
    private PenaltyRepository penaltyRepository;

    @Mock
    private ModerationAuditLogService auditLogService;

    @InjectMocks
    private PenaltyService penaltyService;

    @Test
    @DisplayName("issuePenalty creates WARNING successfully")
    void issuePenalty_warning_success() {
        when(penaltyRepository.save(any(Penalty.class))).thenAnswer(invocation -> {
            Penalty p = invocation.getArgument(0);
            p.setId(1L);
            p.setCreatedAt(LocalDateTime.now());
            return p;
        });

        IssuePenaltyRequest req = IssuePenaltyRequest.builder()
                .userId(20L)
                .reportId(5L)
                .penaltyType(PenaltyType.WARNING)
                .reason("First warning for inappropriate language in chat")
                .build();

        PenaltyResponse response = penaltyService.issuePenalty(req, 999L);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getPenaltyType()).isEqualTo(PenaltyType.WARNING);
        assertThat(response.getExpiresAt()).isNull();
        verify(penaltyRepository).save(any(Penalty.class));
        verify(auditLogService).logAction(eq(999L), eq("ISSUE_PENALTY_WARNING"), eq("USER"), eq(20L), anyString());
    }

    @Test
    @DisplayName("issuePenalty creates TEMPORARY_BAN with calculated expiresAt")
    void issuePenalty_temporaryBan_success() {
        when(penaltyRepository.save(any(Penalty.class))).thenAnswer(invocation -> {
            Penalty p = invocation.getArgument(0);
            p.setId(2L);
            p.setCreatedAt(LocalDateTime.now());
            return p;
        });

        IssuePenaltyRequest req = IssuePenaltyRequest.builder()
                .userId(30L)
                .reportId(10L)
                .penaltyType(PenaltyType.TEMPORARY_BAN)
                .reason("Repeated listing of prohibited goods")
                .durationDays(14)
                .build();

        PenaltyResponse response = penaltyService.issuePenalty(req, 999L);

        assertThat(response.getId()).isEqualTo(2L);
        assertThat(response.getPenaltyType()).isEqualTo(PenaltyType.TEMPORARY_BAN);
        assertThat(response.getDurationDays()).isEqualTo(14);
        assertThat(response.getExpiresAt()).isAfter(LocalDateTime.now().plusDays(13));
        verify(auditLogService).logAction(eq(999L), eq("ISSUE_PENALTY_TEMPORARY_BAN"), eq("USER"), eq(30L), anyString());
    }

    @Test
    @DisplayName("issuePenalty throws exception when TEMPORARY_BAN has invalid duration")
    void issuePenalty_temporaryBan_invalidDuration_throwsException() {
        IssuePenaltyRequest req = IssuePenaltyRequest.builder()
                .userId(30L)
                .penaltyType(PenaltyType.TEMPORARY_BAN)
                .reason("Invalid ban")
                .durationDays(0)
                .build();

        assertThatThrownBy(() -> penaltyService.issuePenalty(req, 999L))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("must be greater than 0");
    }

    @Test
    @DisplayName("getPenaltiesForUser returns list of user penalties")
    void getPenaltiesForUser_returnsList() {
        Penalty p = Penalty.builder()
                .id(1L)
                .userId(20L)
                .penaltyType(PenaltyType.WARNING)
                .reason("Warning")
                .issuedBy(999L)
                .createdAt(LocalDateTime.now())
                .build();
        when(penaltyRepository.findByUserId(20L)).thenReturn(List.of(p));

        List<PenaltyResponse> results = penaltyService.getPenaltiesForUser(20L);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getUserId()).isEqualTo(20L);
    }
}
