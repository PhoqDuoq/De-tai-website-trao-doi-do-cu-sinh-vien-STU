package com.stu.marketplace.billing.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.stu.marketplace.billing.dto.*;
import com.stu.marketplace.billing.entity.InvoiceStatus;
import com.stu.marketplace.billing.entity.PaymentGatewayProvider;
import com.stu.marketplace.billing.entity.PaymentStatus;
import com.stu.marketplace.billing.exception.GlobalExceptionHandler;
import com.stu.marketplace.billing.security.UserPrincipal;
import com.stu.marketplace.billing.service.FeePackageService;
import com.stu.marketplace.billing.service.InvoiceService;
import com.stu.marketplace.billing.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class BillingControllerIntegrationTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock
    private FeePackageService feePackageService;

    @Mock
    private InvoiceService invoiceService;

    @Mock
    private PaymentService paymentService;

    private UserPrincipal testSeller;

    @BeforeEach
    void setUp() {
        testSeller = UserPrincipal.builder()
                .id(10L)
                .email("seller@stu.edu.vn")
                .studentCode("DH52001010")
                .accountStatus("ACTIVE")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_STUDENT"), new SimpleGrantedAuthority("ROLE_ADMIN")))
                .build();

        HandlerMethodArgumentResolver authPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().isAssignableFrom(UserPrincipal.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter,
                                          ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest,
                                          WebDataBinderFactory binderFactory) {
                return testSeller;
            }
        };

        FeePackageController feePackageController = new FeePackageController(feePackageService);
        InvoiceController invoiceController = new InvoiceController(invoiceService);
        PaymentController paymentController = new PaymentController(paymentService);

        mockMvc = MockMvcBuilders
                .standaloneSetup(feePackageController, invoiceController, paymentController)
                .setCustomArgumentResolvers(authPrincipalResolver, new PageableHandlerMethodArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/billing/packages returns active fee packages")
    void testGetActivePackages() throws Exception {
        FeePackageResponse pkg = FeePackageResponse.builder()
                .id(1)
                .packageCode("BOOST_3_DAYS")
                .name("3-Day Boost")
                .price(new BigDecimal("15000.00"))
                .durationDays(3)
                .isActive(true)
                .build();

        when(feePackageService.getActivePackages()).thenReturn(List.of(pkg));

        mockMvc.perform(get("/api/v1/billing/packages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].packageCode").value("BOOST_3_DAYS"));
    }

    @Test
    @DisplayName("POST /api/v1/billing/invoices creates an invoice")
    void testCreateInvoice() throws Exception {
        CreateInvoiceRequest req = CreateInvoiceRequest.builder()
                .listingId(100L)
                .packageId(1)
                .build();

        InvoiceResponse response = InvoiceResponse.builder()
                .id(1L)
                .invoiceCode("INV-20261115-ABC123")
                .userId(10L)
                .listingId(100L)
                .packageId(1)
                .amount(new BigDecimal("15000.00"))
                .status(InvoiceStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        when(invoiceService.createInvoice(any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/billing/invoices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.invoiceCode").value("INV-20261115-ABC123"))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    @DisplayName("POST /api/v1/billing/invoices/1/pay processes sandbox payment")
    void testPayInvoice() throws Exception {
        ProcessPaymentRequest req = ProcessPaymentRequest.builder()
                .gatewayProvider(PaymentGatewayProvider.VNPAY)
                .build();

        PaymentTransactionResponse response = PaymentTransactionResponse.builder()
                .id(10L)
                .invoiceId(1L)
                .gatewayProvider(PaymentGatewayProvider.VNPAY)
                .gatewayTxnRef("TXN-VNPAY-20261115-001")
                .amount(new BigDecimal("15000.00"))
                .status(PaymentStatus.SUCCESS)
                .createdAt(LocalDateTime.now())
                .build();

        when(paymentService.processSandboxPayment(eq(1L), any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/billing/invoices/1/pay")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("SUCCESS"))
                .andExpect(jsonPath("$.data.gatewayTxnRef").value("TXN-VNPAY-20261115-001"));
    }

    @Test
    @DisplayName("POST /api/v1/billing/payments/transfers throws STUDENT_PAYMENT_PROHIBITED (6004)")
    void testRejectP2PTransfer() throws Exception {
        doThrow(new com.stu.marketplace.common.exception.AppException(
                com.stu.marketplace.common.exception.ErrorCode.STUDENT_PAYMENT_PROHIBITED,
                "Student-to-student payments are not supported on this platform"
        )).when(paymentService).rejectStudentToStudentPayment();

        mockMvc.perform(post("/api/v1/billing/payments/transfers"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value(6004))
                .andExpect(jsonPath("$.message").value("Student-to-student payments are not supported on this platform"));
    }
}
