package com.stu.marketplace.billing.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.billing.client.ListingBoostClient;
import com.stu.marketplace.billing.dto.PaymentTransactionResponse;
import com.stu.marketplace.billing.dto.ProcessPaymentRequest;
import com.stu.marketplace.billing.entity.*;
import com.stu.marketplace.billing.repository.InvoiceRepository;
import com.stu.marketplace.billing.repository.PaymentTransactionRepository;
import com.stu.marketplace.billing.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private ListingBoostClient listingBoostClient;

    @InjectMocks
    private PaymentService paymentService;

    private UserPrincipal testSeller;
    private FeePackage testPackage;
    private Invoice testInvoice;

    @BeforeEach
    void setUp() {
        testSeller = UserPrincipal.builder()
                .id(10L)
                .email("seller@stu.edu.vn")
                .studentCode("DH52001010")
                .accountStatus("ACTIVE")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_STUDENT")))
                .build();

        testPackage = FeePackage.builder()
                .id(1)
                .packageCode("BOOST_3_DAYS")
                .name("3-Day Boost")
                .price(new BigDecimal("15000.00"))
                .durationDays(3)
                .isActive(true)
                .build();

        testInvoice = Invoice.builder()
                .id(100L)
                .invoiceCode("INV-20261115-TEST01")
                .userId(10L)
                .listingId(500L)
                .feePackage(testPackage)
                .amount(new BigDecimal("15000.00"))
                .status(InvoiceStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("processSandboxPayment transitions invoice to PAID and notifies boost client")
    void processSandboxPayment_success() {
        when(invoiceRepository.findById(100L)).thenReturn(Optional.of(testInvoice));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(invocation -> {
            PaymentTransaction pt = invocation.getArgument(0);
            pt.setId(1L);
            pt.setCreatedAt(LocalDateTime.now());
            return pt;
        });

        ProcessPaymentRequest req = ProcessPaymentRequest.builder()
                .gatewayProvider(PaymentGatewayProvider.VNPAY)
                .build();

        PaymentTransactionResponse response = paymentService.processSandboxPayment(100L, req, testSeller);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(response.getGatewayProvider()).isEqualTo(PaymentGatewayProvider.VNPAY);
        assertThat(response.getGatewayTxnRef()).startsWith("TXN-VNPAY-");

        assertThat(testInvoice.getStatus()).isEqualTo(InvoiceStatus.PAID);
        assertThat(testInvoice.getPaidAt()).isNotNull();

        verify(invoiceRepository).save(testInvoice);
        verify(listingBoostClient).activateBoost(eq(500L), eq(3), isNull());
    }

    @Test
    @DisplayName("processSandboxPayment throws INVOICE_ALREADY_PAID when invoice is already PAID")
    void processSandboxPayment_alreadyPaid_throwsException() {
        testInvoice.setStatus(InvoiceStatus.PAID);
        when(invoiceRepository.findById(100L)).thenReturn(Optional.of(testInvoice));

        ProcessPaymentRequest req = ProcessPaymentRequest.builder()
                .gatewayProvider(PaymentGatewayProvider.MOMO)
                .build();

        assertThatThrownBy(() -> paymentService.processSandboxPayment(100L, req, testSeller))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("has already been paid");
    }

    @Test
    @DisplayName("processSandboxPayment throws INVOICE_EXPIRED when invoice is expired or cancelled")
    void processSandboxPayment_expired_throwsException() {
        testInvoice.setStatus(InvoiceStatus.EXPIRED);
        when(invoiceRepository.findById(100L)).thenReturn(Optional.of(testInvoice));

        ProcessPaymentRequest req = ProcessPaymentRequest.builder()
                .gatewayProvider(PaymentGatewayProvider.BANK_TRANSFER)
                .build();

        assertThatThrownBy(() -> paymentService.processSandboxPayment(100L, req, testSeller))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Cannot pay expired or cancelled invoice");
    }

    @Test
    @DisplayName("getTransactionsForInvoice returns list of transactions for authorized user")
    void getTransactionsForInvoice_success() {
        PaymentTransaction txn = PaymentTransaction.builder()
                .id(1L)
                .invoice(testInvoice)
                .gatewayProvider(PaymentGatewayProvider.VNPAY)
                .gatewayTxnRef("TXN-VNPAY-123456")
                .amount(new BigDecimal("15000.00"))
                .status(PaymentStatus.SUCCESS)
                .createdAt(LocalDateTime.now())
                .build();

        when(invoiceRepository.findById(100L)).thenReturn(Optional.of(testInvoice));
        when(paymentTransactionRepository.findByInvoiceIdOrderByCreatedAtDesc(100L)).thenReturn(List.of(txn));

        List<PaymentTransactionResponse> results = paymentService.getTransactionsForInvoice(100L, testSeller);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getGatewayTxnRef()).isEqualTo("TXN-VNPAY-123456");
    }
}
