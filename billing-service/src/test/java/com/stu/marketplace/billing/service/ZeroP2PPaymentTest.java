package com.stu.marketplace.billing.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.billing.client.ListingBoostClient;
import com.stu.marketplace.billing.repository.InvoiceRepository;
import com.stu.marketplace.billing.repository.PaymentTransactionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
class ZeroP2PPaymentTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private ListingBoostClient listingBoostClient;

    @InjectMocks
    private PaymentService paymentService;

    @Test
    @DisplayName("STRICT R3 INVARIANT: Peer-to-peer / student-to-student payments are strictly prohibited with code 6004")
    void testRejectStudentToStudentPayment_StrictR3Invariant() {
        assertThatThrownBy(() -> paymentService.rejectStudentToStudentPayment())
                .isInstanceOf(AppException.class)
                .satisfies(e -> {
                    AppException appEx = (AppException) e;
                    assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.STUDENT_PAYMENT_PROHIBITED);
                    assertThat(appEx.getErrorCode().getCode()).isEqualTo(6004);
                    assertThat(appEx.getMessage()).contains("Student-to-student payments, escrow, and digital wallets are strictly prohibited");
                });
    }
}
