package com.stu.marketplace.billing.controller;

import com.stu.marketplace.common.dto.ApiResponse;
import com.stu.marketplace.billing.dto.PaymentCallbackRequest;
import com.stu.marketplace.billing.dto.PaymentTransactionResponse;
import com.stu.marketplace.billing.dto.ProcessPaymentRequest;
import com.stu.marketplace.billing.security.UserPrincipal;
import com.stu.marketplace.billing.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping({"/api/v1/billing/invoices/{id}/pay", "/api/v1/invoices/{id}/pay"})
    public ResponseEntity<ApiResponse<PaymentTransactionResponse>> payInvoice(
            @PathVariable Long id,
            @Valid @RequestBody ProcessPaymentRequest req,
            @AuthenticationPrincipal UserPrincipal user
    ) {
        PaymentTransactionResponse response = paymentService.processSandboxPayment(id, req, user);
        return ResponseEntity.ok(ApiResponse.success("Platform listing fee payment completed successfully", response));
    }

    @PostMapping("/api/v1/billing/payments/callback")
    public ResponseEntity<ApiResponse<PaymentTransactionResponse>> handleCallback(
            @Valid @RequestBody PaymentCallbackRequest req
    ) {
        PaymentTransactionResponse response = paymentService.handleGatewayCallback(req);
        return ResponseEntity.ok(ApiResponse.success("Gateway callback processed", response));
    }

    @GetMapping({"/api/v1/billing/invoices/{id}/transactions", "/api/v1/invoices/{id}/transactions"})
    public ResponseEntity<ApiResponse<List<PaymentTransactionResponse>>> getInvoiceTransactions(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user
    ) {
        List<PaymentTransactionResponse> response = paymentService.getTransactionsForInvoice(id, user);
        return ResponseEntity.ok(ApiResponse.success("Payment transactions retrieved", response));
    }

    /**
     * Strict R3 Invariant Guard: Prohibits student-to-student payments, escrow, and digital wallets.
     */
    @PostMapping({"/api/v1/billing/payments/transfers", "/api/v1/billing/transfers", "/api/v1/billing/escrow"})
    public ResponseEntity<ApiResponse<Void>> rejectPeerToPeerPayment() {
        paymentService.rejectStudentToStudentPayment();
        return ResponseEntity.badRequest().build();
    }
}
