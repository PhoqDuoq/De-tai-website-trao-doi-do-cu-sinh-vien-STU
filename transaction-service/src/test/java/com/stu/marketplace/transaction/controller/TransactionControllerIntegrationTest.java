package com.stu.marketplace.transaction.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.stu.marketplace.transaction.constant.CampusLocation;
import com.stu.marketplace.transaction.dto.*;
import com.stu.marketplace.transaction.entity.TransactionStatus;
import com.stu.marketplace.transaction.entity.TransactionType;
import com.stu.marketplace.transaction.exception.GlobalExceptionHandler;
import com.stu.marketplace.transaction.security.UserPrincipal;
import com.stu.marketplace.transaction.service.TransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TransactionControllerIntegrationTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock
    private TransactionService transactionService;

    private UserPrincipal testPrincipal;

    @BeforeEach
    void setUp() {
        testPrincipal = UserPrincipal.builder()
                .id(10L)
                .email("student10@stu.edu.vn")
                .studentCode("DH52001010")
                .accountStatus("ACTIVE")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_STUDENT")))
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
                return testPrincipal;
            }
        };

        TransactionController transactionController = new TransactionController(transactionService);

        mockMvc = MockMvcBuilders.standaloneSetup(transactionController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(authPrincipalResolver)
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/transactions returns 201 Created")
    void testCreateProposal_Returns201() throws Exception {
        TransactionProposalRequest request = TransactionProposalRequest.builder()
                .listingId(100L)
                .sellerId(20L)
                .agreedPrice(new BigDecimal("150000.00"))
                .transactionType(TransactionType.BUY_SELL)
                .build();

        TransactionResponse response = TransactionResponse.builder()
                .id(1L)
                .transactionCode("TX-20261115-A8F2")
                .listingId(100L)
                .buyerId(10L)
                .sellerId(20L)
                .agreedPrice(new BigDecimal("150000.00"))
                .status(TransactionStatus.REQUESTED)
                .build();

        when(transactionService.createProposal(eq(10L), any(TransactionProposalRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1L))
                .andExpect(jsonPath("$.data.transactionCode").value("TX-20261115-A8F2"))
                .andExpect(jsonPath("$.data.status").value("REQUESTED"));
    }

    @Test
    @DisplayName("POST /api/v1/transactions with negative price returns 400 Bad Request")
    void testCreateProposal_NegativePrice_Returns400() throws Exception {
        TransactionProposalRequest request = TransactionProposalRequest.builder()
                .listingId(100L)
                .sellerId(20L)
                .agreedPrice(new BigDecimal("-10000.00")) // Invalid negative
                .build();

        mockMvc.perform(post("/api/v1/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("GET /api/v1/transactions/{id} returns 200 OK")
    void testGetTransactionById_Returns200() throws Exception {
        TransactionResponse response = TransactionResponse.builder()
                .id(1L)
                .transactionCode("TX-20261115-A8F2")
                .listingId(100L)
                .buyerId(10L)
                .sellerId(20L)
                .status(TransactionStatus.REQUESTED)
                .build();

        when(transactionService.getTransactionById(eq(10L), eq(false), eq(1L))).thenReturn(response);

        mockMvc.perform(get("/api/v1/transactions/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    @DisplayName("GET /api/v1/transactions/campus-locations returns 200 OK and list of locations")
    void testGetCampusLocations_Returns200() throws Exception {
        List<CampusLocationDto> locations = List.of(
                new CampusLocationDto("HALL_A", "Sảnh Nhà A", "Khu vực sảnh chính tòa nhà A - 180 Cao Lỗ")
        );

        when(transactionService.getCampusLocations()).thenReturn(locations);

        mockMvc.perform(get("/api/v1/transactions/campus-locations")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].code").value("HALL_A"));
    }

    @Test
    @DisplayName("PATCH /api/v1/transactions/{id}/cancel with blank reason returns 400 Bad Request")
    void testCancelTransaction_BlankReason_Returns400() throws Exception {
        TransactionCancelRequest request = new TransactionCancelRequest("   "); // Blank

        mockMvc.perform(patch("/api/v1/transactions/1/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("PATCH /api/v1/transactions/{id}/confirm returns 200 OK")
    void testConfirmTransaction_Returns200() throws Exception {
        TransactionResponse response = TransactionResponse.builder()
                .id(1L)
                .status(TransactionStatus.COMPLETED)
                .build();

        when(transactionService.confirmTransaction(eq(10L), eq(1L), any(), any())).thenReturn(response);

        mockMvc.perform(patch("/api/v1/transactions/1/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TransactionConfirmRequest("123456", "Done"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));
    }
}
