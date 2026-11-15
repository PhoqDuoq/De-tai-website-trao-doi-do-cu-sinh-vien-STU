package com.stu.marketplace.billing.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.billing.dto.CreateInvoiceRequest;
import com.stu.marketplace.billing.dto.InvoiceResponse;
import com.stu.marketplace.billing.dto.PagedResponse;
import com.stu.marketplace.billing.entity.FeePackage;
import com.stu.marketplace.billing.entity.Invoice;
import com.stu.marketplace.billing.entity.InvoiceStatus;
import com.stu.marketplace.billing.repository.FeePackageRepository;
import com.stu.marketplace.billing.repository.InvoiceRepository;
import com.stu.marketplace.billing.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final FeePackageRepository feePackageRepository;

    @Transactional
    public InvoiceResponse createInvoice(CreateInvoiceRequest req, UserPrincipal seller) {
        FeePackage feePackage = feePackageRepository.findById(req.getPackageId())
                .orElseThrow(() -> new AppException(ErrorCode.FEE_PACKAGE_NOT_FOUND, "Fee package not found with id: " + req.getPackageId()));

        if (!Boolean.TRUE.equals(feePackage.getIsActive())) {
            throw new AppException(ErrorCode.PACKAGE_INACTIVE, "Fee package '" + feePackage.getPackageCode() + "' is inactive");
        }

        String invoiceCode = generateInvoiceCode();

        Invoice invoice = Invoice.builder()
                .invoiceCode(invoiceCode)
                .userId(seller.getId())
                .listingId(req.getListingId())
                .feePackage(feePackage)
                .amount(feePackage.getPrice())
                .status(InvoiceStatus.PENDING)
                .build();

        Invoice saved = invoiceRepository.save(invoice);
        log.info("Invoice {} generated for seller {} on listing {} with amount {}",
                saved.getInvoiceCode(), seller.getId(), req.getListingId(), saved.getAmount());

        return InvoiceResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long id, UserPrincipal user) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND, "Invoice not found with id: " + id));

        validateOwnershipOrStaff(invoice, user);
        return InvoiceResponse.fromEntity(invoice);
    }

    @Transactional(readOnly = true)
    public PagedResponse<InvoiceResponse> getMyInvoices(UserPrincipal user, Pageable pageable) {
        Page<Invoice> page = invoiceRepository.findByUserId(user.getId(), pageable);
        return PagedResponse.from(page.map(InvoiceResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public PagedResponse<InvoiceResponse> getAllInvoices(InvoiceStatus status, Pageable pageable) {
        Page<Invoice> page;
        if (status != null) {
            page = invoiceRepository.findByStatus(status, pageable);
        } else {
            page = invoiceRepository.findAll(pageable);
        }
        return PagedResponse.from(page.map(InvoiceResponse::fromEntity));
    }

    @Transactional
    public InvoiceResponse cancelInvoice(Long id, UserPrincipal user) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND, "Invoice not found with id: " + id));

        validateOwnershipOrStaff(invoice, user);

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new AppException(ErrorCode.INVOICE_ALREADY_PAID, "Cannot cancel invoice that has already been paid");
        }

        if (invoice.getStatus() == InvoiceStatus.EXPIRED || invoice.getStatus() == InvoiceStatus.FAILED) {
            throw new AppException(ErrorCode.INVOICE_EXPIRED, "Invoice is already expired or cancelled");
        }

        invoice.setStatus(InvoiceStatus.EXPIRED);
        Invoice updated = invoiceRepository.save(invoice);
        log.info("Invoice {} cancelled by user {}", updated.getInvoiceCode(), user.getId());

        return InvoiceResponse.fromEntity(updated);
    }

    private void validateOwnershipOrStaff(Invoice invoice, UserPrincipal user) {
        boolean isOwner = invoice.getUserId().equals(user.getId());
        boolean isStaff = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MODERATOR"));

        if (!isOwner && !isStaff) {
            throw new AppException(ErrorCode.UNAUTHORIZED_BILLING_ACTION, "User is not authorized to access this invoice");
        }
    }

    private String generateInvoiceCode() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomPart = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "INV-" + datePart + "-" + randomPart;
    }
}
