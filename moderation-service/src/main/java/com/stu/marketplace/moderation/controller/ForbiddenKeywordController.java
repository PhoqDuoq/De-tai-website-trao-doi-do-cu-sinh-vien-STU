package com.stu.marketplace.moderation.controller;

import com.stu.marketplace.common.dto.ApiResponse;
import com.stu.marketplace.moderation.dto.*;
import com.stu.marketplace.moderation.security.UserPrincipal;
import com.stu.marketplace.moderation.service.ForbiddenKeywordService;
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

@RestController
@RequestMapping("/api/v1/moderation/keywords")
@RequiredArgsConstructor
public class ForbiddenKeywordController {

    private final ForbiddenKeywordService keywordService;

    @PostMapping("/check")
    public ResponseEntity<ApiResponse<CheckTextResponse>> checkText(@Valid @RequestBody CheckTextRequest req) {
        CheckTextResponse response = keywordService.checkContent(req.getText());
        return ResponseEntity.ok(ApiResponse.success("Content keyword check completed", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<KeywordResponse>>> getKeywords(
            @PageableDefault(size = 50, sort = "keyword", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        PagedResponse<KeywordResponse> response = keywordService.getAllKeywords(pageable);
        return ResponseEntity.ok(ApiResponse.success("Forbidden keywords retrieved", response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<KeywordResponse>> createKeyword(
            @Valid @RequestBody CreateKeywordRequest req,
            @AuthenticationPrincipal UserPrincipal moderator
    ) {
        KeywordResponse response = keywordService.createKeyword(req, moderator.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Forbidden keyword created successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<KeywordResponse>> updateKeyword(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateKeywordRequest req,
            @AuthenticationPrincipal UserPrincipal moderator
    ) {
        KeywordResponse response = keywordService.updateKeyword(id, req, moderator.getId());
        return ResponseEntity.ok(ApiResponse.success("Forbidden keyword updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteKeyword(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserPrincipal moderator
    ) {
        keywordService.deleteKeyword(id, moderator.getId());
        return ResponseEntity.ok(ApiResponse.success("Forbidden keyword deleted successfully", null));
    }
}
