package com.stu.marketplace.billing.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.billing.dto.CreateInvoiceRequest;
import com.stu.marketplace.billing.dto.InvoiceResponse;
import com.stu.marketplace.billing.dto.PagedResponse;
import com.stu.marketplace.billing.entity.FeePackage;
import com.stu.marketplace.billing.entity.Invoice;
import com.stu.marketplace.billing.entity.InvoiceStatus;
import com.stu.marketplace.billing.repository.FeePackageRepository;
import com.stu.marketplace.billing.repository.InvoiceRepository;
import com.stu.marketplace.billing.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private FeePackageRepository feePackageRepository;

    @InjectMocks
    private InvoiceService invoiceService;

    private UserPrincipal testSeller;
    private UserPrincipal otherUser;
    private FeePackage activePackage;
    private FeePackage inactivePackage;
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

        otherUser = UserPrincipal.builder()
                .id(20L)
                .email("other@stu.edu.vn")
                .studentCode("DH52002020")
                .accountStatus("ACTIVE")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_STUDENT")))
                .build();

        activePackage = FeePackage.builder()
                .id(1)
                .packageCode("BOOST_3_DAYS")
                .name("3-Day Boost")
                .price(new BigDecimal("15000.00"))
                .durationDays(3)
                .isActive(true)
                .build();

        inactivePackage = FeePackage.builder()
                .id(2)
                .packageCode("INACTIVE_PKG")
                .name("Inactive")
                .price(new BigDecimal("50000.00"))
                .durationDays(10)
                .isActive(false)
                .build();

        testInvoice = Invoice.builder()
                .id(1L)
                .invoiceCode("INV-20261115-TEST01")
                .userId(10L)
                .listingId(100L)
                .feePackage(activePackage)
                .amount(new BigDecimal("15000.00"))
                .status(InvoiceStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("createInvoice creates pending invoice with generated invoiceCode")
    void createInvoice_success() {
        when(feePackageRepository.findById(1)).thenReturn(Optional.of(activePackage));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> {
            Invoice inv = invocation.getArgument(0);
            inv.setId(10L);
            inv.setCreatedAt(LocalDateTime.now());
            return inv;
        });

        CreateInvoiceRequest req = CreateInvoiceRequest.builder()
                .listingId(100L)
                .packageId(1)
                .build();

        InvoiceResponse response = invoiceService.createInvoice(req, testSeller);

        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getUserId()).isEqualTo(10L);
        assertThat(response.getListingId()).isEqualTo(100L);
        assertThat(response.getAmount()).isEqualByComparingTo("15000.00");
        assertThat(response.getStatus()).isEqualTo(InvoiceStatus.PENDING);
        assertThat(response.getInvoiceCode()).startsWith("INV-");
        verify(invoiceRepository).save(any(Invoice.class));
    }

    @Test
    @DisplayName("createInvoice throws PACKAGE_INACTIVE when package is not active")
    void createInvoice_inactivePackage_throwsException() {
        when(feePackageRepository.findById(2)).thenReturn(Optional.of(inactivePackage));

        CreateInvoiceRequest req = CreateInvoiceRequest.builder()
                .listingId(100L)
                .packageId(2)
                .build();

        assertThatThrownBy(() -> invoiceService.createInvoice(req, testSeller))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("is inactive");
    }

    @Test
    @DisplayName("getInvoiceById allows invoice owner to view invoice")
    void getInvoiceById_ownerAccess_success() {
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(testInvoice));

        InvoiceResponse response = invoiceService.getInvoiceById(1L, testSeller);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getInvoiceCode()).isEqualTo("INV-20261115-TEST01");
    }

    @Test
    @DisplayName("getInvoiceById throws UNAUTHORIZED_BILLING_ACTION when accessed by different user")
    void getInvoiceById_unauthorizedAccess_throwsException() {
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(testInvoice));

        assertThatThrownBy(() -> invoiceService.getInvoiceById(1L, otherUser))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("not authorized");
    }

    @Test
    @DisplayName("cancelInvoice transitions pending invoice to EXPIRED")
    void cancelInvoice_pending_success() {
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(testInvoice));
        when(invoiceRepository.save(any(Invoice.class))).thenReturn(testInvoice);

        InvoiceResponse response = invoiceService.cancelInvoice(1L, testSeller);

        assertThat(testInvoice.getStatus()).isEqualTo(InvoiceStatus.EXPIRED);
        verify(invoiceRepository).save(testInvoice);
    }

    @Test
    @DisplayName("cancelInvoice throws INVOICE_ALREADY_PAID when trying to cancel paid invoice")
    void cancelInvoice_alreadyPaid_throwsException() {
        testInvoice.setStatus(InvoiceStatus.PAID);
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(testInvoice));

        assertThatThrownBy(() -> invoiceService.cancelInvoice(1L, testSeller))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("already been paid");
    }
}
