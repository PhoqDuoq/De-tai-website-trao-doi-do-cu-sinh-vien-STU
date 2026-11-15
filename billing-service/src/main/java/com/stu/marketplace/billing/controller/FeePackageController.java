package com.stu.marketplace.billing.controller;

import com.stu.marketplace.common.dto.ApiResponse;
import com.stu.marketplace.billing.dto.FeePackageRequest;
import com.stu.marketplace.billing.dto.FeePackageResponse;
import com.stu.marketplace.billing.dto.PagedResponse;
import com.stu.marketplace.billing.service.FeePackageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/billing/packages")
@RequiredArgsConstructor
public class FeePackageController {

    private final FeePackageService feePackageService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FeePackageResponse>>> getActivePackages() {
        List<FeePackageResponse> response = feePackageService.getActivePackages();
        return ResponseEntity.ok(ApiResponse.success("Active fee packages retrieved", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FeePackageResponse>> getPackageById(@PathVariable Integer id) {
        FeePackageResponse response = feePackageService.getPackageById(id);
        return ResponseEntity.ok(ApiResponse.success("Fee package retrieved", response));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<FeePackageResponse>>> getAllPackages(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PagedResponse<FeePackageResponse> response = feePackageService.getAllPackages(pageable);
        return ResponseEntity.ok(ApiResponse.success("All fee packages retrieved", response));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FeePackageResponse>> createPackage(@Valid @RequestBody FeePackageRequest req) {
        FeePackageResponse response = feePackageService.createPackage(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Fee package created successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FeePackageResponse>> updatePackage(
            @PathVariable Integer id,
            @Valid @RequestBody FeePackageRequest req
    ) {
        FeePackageResponse response = feePackageService.updatePackage(id, req);
        return ResponseEntity.ok(ApiResponse.success("Fee package updated successfully", response));
    }
}
