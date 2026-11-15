package com.stu.marketplace.moderation.controller;

import com.stu.marketplace.common.dto.ApiResponse;
import com.stu.marketplace.moderation.dto.IssuePenaltyRequest;
import com.stu.marketplace.moderation.dto.PagedResponse;
import com.stu.marketplace.moderation.dto.PenaltyResponse;
import com.stu.marketplace.moderation.security.UserPrincipal;
import com.stu.marketplace.moderation.service.PenaltyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/moderation/penalties")
@RequiredArgsConstructor
public class PenaltyController {

    private final PenaltyService penaltyService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<PenaltyResponse>> issuePenalty(
            @Valid @RequestBody IssuePenaltyRequest req,
            @AuthenticationPrincipal UserPrincipal moderator
    ) {
        PenaltyResponse response = penaltyService.issuePenalty(req, moderator.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Penalty issued successfully", response));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<PenaltyResponse>>> getPenaltiesForUser(@PathVariable Long userId) {
        List<PenaltyResponse> response = penaltyService.getPenaltiesForUser(userId);
        return ResponseEntity.ok(ApiResponse.success("User penalties retrieved", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<PenaltyResponse>>> getAllPenalties(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PagedResponse<PenaltyResponse> response = penaltyService.getAllPenalties(pageable);
        return ResponseEntity.ok(ApiResponse.success("Penalties retrieved successfully", response));
    }
}
