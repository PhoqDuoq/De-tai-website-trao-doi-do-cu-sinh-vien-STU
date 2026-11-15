package com.stu.marketplace.billing.controller;

import com.stu.marketplace.common.dto.ApiResponse;
import com.stu.marketplace.billing.dto.CreateInvoiceRequest;
import com.stu.marketplace.billing.dto.InvoiceResponse;
import com.stu.marketplace.billing.dto.PagedResponse;
import com.stu.marketplace.billing.entity.InvoiceStatus;
import com.stu.marketplace.billing.security.UserPrincipal;
import com.stu.marketplace.billing.service.InvoiceService;
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
@RequestMapping({"/api/v1/billing/invoices", "/api/v1/invoices"})
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping
    public ResponseEntity<ApiResponse<InvoiceResponse>> createInvoice(
            @Valid @RequestBody CreateInvoiceRequest req,
            @AuthenticationPrincipal UserPrincipal seller
    ) {
        InvoiceResponse response = invoiceService.createInvoice(req, seller);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Listing fee invoice created successfully", response));
    }

    @GetMapping("/my-invoices")
    public ResponseEntity<ApiResponse<PagedResponse<InvoiceResponse>>> getMyInvoices(
            @AuthenticationPrincipal UserPrincipal user,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PagedResponse<InvoiceResponse> response = invoiceService.getMyInvoices(user, pageable);
        return ResponseEntity.ok(ApiResponse.success("Invoices retrieved successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user
    ) {
        InvoiceResponse response = invoiceService.getInvoiceById(id, user);
        return ResponseEntity.ok(ApiResponse.success("Invoice details retrieved", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<ApiResponse<PagedResponse<InvoiceResponse>>> getAllInvoices(
            @RequestParam(required = false) InvoiceStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PagedResponse<InvoiceResponse> response = invoiceService.getAllInvoices(status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Invoices retrieved successfully", response));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<InvoiceResponse>> cancelInvoice(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user
    ) {
        InvoiceResponse response = invoiceService.cancelInvoice(id, user);
        return ResponseEntity.ok(ApiResponse.success("Invoice cancelled successfully", response));
    }
}
