package com.stu.marketplace.billing.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.billing.client.ListingBoostClient;
import com.stu.marketplace.billing.dto.PaymentCallbackRequest;
import com.stu.marketplace.billing.dto.PaymentTransactionResponse;
import com.stu.marketplace.billing.dto.ProcessPaymentRequest;
import com.stu.marketplace.billing.entity.*;
import com.stu.marketplace.billing.repository.InvoiceRepository;
import com.stu.marketplace.billing.repository.PaymentTransactionRepository;
import com.stu.marketplace.billing.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ListingBoostClient listingBoostClient;

    /**
     * Strict R3 Invariant Guard: Student-to-student payments, escrow, or digital wallets
     * are strictly prohibited on this platform.
     */
    public void rejectStudentToStudentPayment() {
        log.warn("BLOCKED student-to-student payment attempt per R3 invariant");
        throw new AppException(ErrorCode.STUDENT_PAYMENT_PROHIBITED,
                "Student-to-student payments, escrow, and digital wallets are strictly prohibited");
    }

    @Transactional
    public PaymentTransactionResponse processSandboxPayment(Long invoiceId, ProcessPaymentRequest req, UserPrincipal user) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND, "Invoice not found with id: " + invoiceId));

        validateOwnership(invoice, user);

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new AppException(ErrorCode.INVOICE_ALREADY_PAID, "Invoice " + invoice.getInvoiceCode() + " has already been paid");
        }

        if (invoice.getStatus() == InvoiceStatus.EXPIRED || invoice.getStatus() == InvoiceStatus.FAILED) {
            throw new AppException(ErrorCode.INVOICE_EXPIRED, "Cannot pay expired or cancelled invoice: " + invoice.getInvoiceCode());
        }

        String txnRef = "TXN-" + req.getGatewayProvider().name() + "-" +
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" +
                UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();

        PaymentTransaction transaction = PaymentTransaction.builder()
                .invoice(invoice)
                .gatewayProvider(req.getGatewayProvider())
                .gatewayTxnRef(txnRef)
                .gatewayResponseCode("00")
                .amount(invoice.getAmount())
                .status(PaymentStatus.SUCCESS)
                .callbackPayload("{\"source\":\"sandbox_payment\",\"gateway\":\"" + req.getGatewayProvider() + "\",\"status\":\"SUCCESS\"}")
                .build();

        PaymentTransaction savedTxn = paymentTransactionRepository.save(transaction);

        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaidAt(LocalDateTime.now());
        invoiceRepository.save(invoice);

        log.info("Invoice {} successfully PAID via sandbox {} (txnRef: {})",
                invoice.getInvoiceCode(), req.getGatewayProvider(), txnRef);

        // Notify listing-service to activate boost
        int durationDays = (invoice.getFeePackage() != null && invoice.getFeePackage().getDurationDays() != null)
                ? invoice.getFeePackage().getDurationDays() : 3;
        listingBoostClient.activateBoost(invoice.getListingId(), durationDays, null);

        return PaymentTransactionResponse.fromEntity(savedTxn);
    }

    @Transactional
    public PaymentTransactionResponse handleGatewayCallback(PaymentCallbackRequest callback) {
        // Idempotent callback check
        Optional<PaymentTransaction> existing = paymentTransactionRepository.findByGatewayTxnRef(callback.getGatewayTxnRef());
        if (existing.isPresent()) {
            log.info("Idempotent callback received for already processed txnRef: {}", callback.getGatewayTxnRef());
            return PaymentTransactionResponse.fromEntity(existing.get());
        }

        log.warn("Callback received for uninitiated transaction ref: {}", callback.getGatewayTxnRef());
        throw new AppException(ErrorCode.PAYMENT_FAILED, "Unknown payment transaction reference: " + callback.getGatewayTxnRef());
    }

    @Transactional(readOnly = true)
    public List<PaymentTransactionResponse> getTransactionsForInvoice(Long invoiceId, UserPrincipal user) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND, "Invoice not found with id: " + invoiceId));

        validateOwnership(invoice, user);

        return paymentTransactionRepository.findByInvoiceIdOrderByCreatedAtDesc(invoiceId).stream()
                .map(PaymentTransactionResponse::fromEntity)
                .toList();
    }

    private void validateOwnership(Invoice invoice, UserPrincipal user) {
        boolean isOwner = invoice.getUserId().equals(user.getId());
        boolean isStaff = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MODERATOR"));

        if (!isOwner && !isStaff) {
            throw new AppException(ErrorCode.UNAUTHORIZED_BILLING_ACTION, "User is not authorized to access this invoice");
        }
    }
}
