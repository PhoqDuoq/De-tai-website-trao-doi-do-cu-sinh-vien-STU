package com.stu.marketplace.transaction.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.transaction.client.ListingClient;
import com.stu.marketplace.transaction.constant.CampusLocation;
import com.stu.marketplace.transaction.dto.*;
import com.stu.marketplace.transaction.entity.*;
import com.stu.marketplace.transaction.repository.TransactionRepository;
import com.stu.marketplace.transaction.repository.TransactionTimelineRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private TransactionTimelineRepository timelineRepository;

    @Mock
    private ListingClient listingClient;

    @InjectMocks
    private TransactionService transactionService;

    private Transaction sampleTransaction;

    @BeforeEach
    void setUp() {
        sampleTransaction = Transaction.builder()
                .id(1L)
                .transactionCode("TX-20261115-A8F2")
                .listingId(100L)
                .buyerId(10L)
                .sellerId(20L)
                .agreedPrice(new BigDecimal("150000.00"))
                .transactionType(TransactionType.BUY_SELL)
                .status(TransactionStatus.REQUESTED)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .timelines(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("createProposal should create transaction with REQUESTED status and unique code")
    void testCreateProposal_Success() {
        TransactionProposalRequest request = TransactionProposalRequest.builder()
                .listingId(100L)
                .sellerId(20L)
                .agreedPrice(new BigDecimal("150000.00"))
                .transactionType(TransactionType.BUY_SELL)
                .note("I'd like to buy this book")
                .build();

        when(transactionRepository.save(any(Transaction.class))).thenReturn(sampleTransaction);

        TransactionResponse response = transactionService.createProposal(10L, request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getBuyerId()).isEqualTo(10L);
        assertThat(response.getSellerId()).isEqualTo(20L);
        assertThat(response.getStatus()).isEqualTo(TransactionStatus.REQUESTED);

        verify(transactionRepository).save(any(Transaction.class));
        verify(timelineRepository).save(any(TransactionTimeline.class));
    }

    @Test
    @DisplayName("createProposal should throw CANNOT_TRANSACT_OWN_ITEM when buyer is seller")
    void testCreateProposal_BuyerIsSeller_ThrowsCannotTransactOwnItem() {
        TransactionProposalRequest request = TransactionProposalRequest.builder()
                .listingId(100L)
                .sellerId(10L) // same as buyer
                .agreedPrice(new BigDecimal("150000.00"))
                .build();

        assertThatThrownBy(() -> transactionService.createProposal(10L, request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CANNOT_TRANSACT_OWN_ITEM);

        verify(transactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("acceptProposal should advance status to ACCEPTED when invoked by seller")
    void testAcceptProposal_Success() {
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(sampleTransaction));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

        TransactionAcceptRequest request = new TransactionAcceptRequest("I accept your price");
        TransactionResponse response = transactionService.acceptProposal(20L, 1L, request);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(TransactionStatus.ACCEPTED);
        verify(timelineRepository).save(argThat(t -> t.getStatus() == TransactionStatus.ACCEPTED));
    }

    @Test
    @DisplayName("acceptProposal should throw FORBIDDEN when caller is not seller")
    void testAcceptProposal_CallerNotSeller_ThrowsForbidden() {
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(sampleTransaction));

        assertThatThrownBy(() -> transactionService.acceptProposal(999L, 1L, null))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FORBIDDEN);

        verify(transactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("acceptProposal should throw INVALID_TRANSACTION_STATUS when current status is not REQUESTED")
    void testAcceptProposal_InvalidStatus_ThrowsBadRequest() {
        sampleTransaction.setStatus(TransactionStatus.ACCEPTED);
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(sampleTransaction));

        assertThatThrownBy(() -> transactionService.acceptProposal(20L, 1L, null))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_TRANSACTION_STATUS);
    }

    @Test
    @DisplayName("scheduleMeetup should transition status to CONFIRMED with STU campus location")
    void testScheduleMeetup_Success() {
        sampleTransaction.setStatus(TransactionStatus.ACCEPTED);
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(sampleTransaction));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

        MeetupScheduleRequest request = MeetupScheduleRequest.builder()
                .meetingLocation(CampusLocation.HALL_A.getName())
                .meetingTime(LocalDateTime.now().plusDays(1))
                .note("Meet at 10 AM")
                .build();

        TransactionResponse response = transactionService.scheduleMeetup(10L, 1L, request);

        assertThat(response.getStatus()).isEqualTo(TransactionStatus.CONFIRMED);
        assertThat(response.getMeetingLocation()).isEqualTo(CampusLocation.HALL_A.getName());
        verify(timelineRepository).save(argThat(t -> t.getStatus() == TransactionStatus.CONFIRMED));
    }

    @Test
    @DisplayName("scheduleMeetup should throw INVALID_MEETING_TIME when meetup time is in the past")
    void testScheduleMeetup_PastTime_ThrowsBadRequest() {
        sampleTransaction.setStatus(TransactionStatus.ACCEPTED);
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(sampleTransaction));

        MeetupScheduleRequest request = MeetupScheduleRequest.builder()
                .meetingLocation(CampusLocation.HALL_A.getName())
                .meetingTime(LocalDateTime.now().minusHours(2)) // past time
                .build();

        assertThatThrownBy(() -> transactionService.scheduleMeetup(10L, 1L, request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_MEETING_TIME);
    }

    @Test
    @DisplayName("scheduleMeetup should throw BAD_REQUEST when meetup location is not an approved STU campus location")
    void testScheduleMeetup_InvalidLocation_ThrowsBadRequest() {
        sampleTransaction.setStatus(TransactionStatus.ACCEPTED);
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(sampleTransaction));

        MeetupScheduleRequest request = MeetupScheduleRequest.builder()
                .meetingLocation("Off-campus warehouse, Dist 8")
                .meetingTime(LocalDateTime.now().plusDays(1))
                .build();

        assertThatThrownBy(() -> transactionService.scheduleMeetup(10L, 1L, request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BAD_REQUEST);
    }

    @Test
    @DisplayName("confirmTransaction with valid verification code should transition to COMPLETED and sync SOLD")
    void testConfirmTransaction_Success_WithVerificationCode() {
        sampleTransaction.setStatus(TransactionStatus.CONFIRMED);
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(sampleTransaction));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

        String code = transactionService.calculateVerificationCode(sampleTransaction);
        TransactionConfirmRequest request = new TransactionConfirmRequest(code, "Confirmed with code");

        TransactionResponse response = transactionService.confirmTransaction(20L, 1L, request, "Bearer test-jwt");

        assertThat(response.getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        verify(listingClient).markListingAsSold(eq(100L), eq("Bearer test-jwt"), contains("Sold via transaction"));
        verify(timelineRepository).save(argThat(t -> t.getStatus() == TransactionStatus.COMPLETED));
    }

    @Test
    @DisplayName("confirmTransaction with invalid verification code should throw INVALID_VERIFICATION_CODE")
    void testConfirmTransaction_InvalidVerificationCode_ThrowsBadRequest() {
        sampleTransaction.setStatus(TransactionStatus.CONFIRMED);
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(sampleTransaction));

        TransactionConfirmRequest request = new TransactionConfirmRequest("WRONG_CODE", "Invalid");

        assertThatThrownBy(() -> transactionService.confirmTransaction(20L, 1L, request, "Bearer test-jwt"))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_VERIFICATION_CODE);

        verify(listingClient, never()).markListingAsSold(any(), any(), any());
    }

    @Test
    @DisplayName("confirmTransaction dual confirmation: completes when second party confirms")
    void testConfirmTransaction_DualConfirmation_Success() {
        sampleTransaction.setStatus(TransactionStatus.CONFIRMED);
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(sampleTransaction));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

        // Counterparty (buyer 10) has already confirmed
        when(timelineRepository.existsByTransactionIdAndActorIdAndNoteStartingWith(1L, 10L, "CONFIRMED_BY_"))
                .thenReturn(true);

        TransactionConfirmRequest request = new TransactionConfirmRequest(null, "Seller confirming handover");
        TransactionResponse response = transactionService.confirmTransaction(20L, 1L, request, "Bearer token");

        assertThat(response.getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        verify(listingClient).markListingAsSold(eq(100L), any(), any());
    }

    @Test
    @DisplayName("confirmTransaction should proceed safely if listing sync fails")
    void testConfirmTransaction_Resilience_WhenListingSyncFails() {
        sampleTransaction.setStatus(TransactionStatus.CONFIRMED);
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(sampleTransaction));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

        // Listing service returns false or throws
        when(listingClient.markListingAsSold(any(), any(), any())).thenReturn(false);

        String code = transactionService.calculateVerificationCode(sampleTransaction);
        TransactionConfirmRequest request = new TransactionConfirmRequest(code, "Complete");

        TransactionResponse response = transactionService.confirmTransaction(20L, 1L, request, "Bearer token");

        assertThat(response.getStatus()).isEqualTo(TransactionStatus.COMPLETED);
    }

    @Test
    @DisplayName("cancelTransaction by buyer should transition status to CANCELLED")
    void testCancelTransaction_ByBuyer_Success() {
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(sampleTransaction));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

        TransactionCancelRequest request = new TransactionCancelRequest("Changed mind");
        TransactionResponse response = transactionService.cancelTransaction(10L, Collections.emptyList(), 1L, request);

        assertThat(response.getStatus()).isEqualTo(TransactionStatus.CANCELLED);
        assertThat(response.getCancelReason()).isEqualTo("Changed mind");
        verify(timelineRepository).save(argThat(t -> t.getStatus() == TransactionStatus.CANCELLED));
    }

    @Test
    @DisplayName("cancelTransaction should throw TRANSACTION_ALREADY_TERMINATED if already COMPLETED")
    void testCancelTransaction_WhenAlreadyCompleted_ThrowsTerminated() {
        sampleTransaction.setStatus(TransactionStatus.COMPLETED);
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(sampleTransaction));

        TransactionCancelRequest request = new TransactionCancelRequest("Too late");

        assertThatThrownBy(() -> transactionService.cancelTransaction(10L, Collections.emptyList(), 1L, request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.TRANSACTION_ALREADY_TERMINATED);
    }

    @Test
    @DisplayName("disputeTransaction should transition status to DISPUTED")
    void testDisputeTransaction_Success() {
        sampleTransaction.setStatus(TransactionStatus.CONFIRMED);
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(sampleTransaction));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

        TransactionDisputeRequest request = new TransactionDisputeRequest("Student did not show up at Sảnh Nhà A");
        TransactionResponse response = transactionService.disputeTransaction(10L, 1L, request);

        assertThat(response.getStatus()).isEqualTo(TransactionStatus.DISPUTED);
        verify(timelineRepository).save(argThat(t -> t.getStatus() == TransactionStatus.DISPUTED));
    }

    @Test
    @DisplayName("getTransactionById by participant should succeed")
    void testGetTransactionById_Participant_Success() {
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(sampleTransaction));

        TransactionResponse response = transactionService.getTransactionById(10L, false, 1L);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getTransactionById by stranger should throw FORBIDDEN")
    void testGetTransactionById_Stranger_ThrowsForbidden() {
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(sampleTransaction));

        assertThatThrownBy(() -> transactionService.getTransactionById(999L, false, 1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FORBIDDEN);
    }

    @Test
    @DisplayName("getMyTransactions should return user's transactions")
    void testGetMyTransactions_Success() {
        Page<Transaction> page = new PageImpl<>(List.of(sampleTransaction), PageRequest.of(0, 10), 1);
        when(transactionRepository.findByUserId(eq(10L), any())).thenReturn(page);

        PagedResponse<TransactionResponse> response = transactionService.getMyTransactions(10L, "ALL", null, 0, 10);

        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getCampusLocations should return predefined STU locations")
    void testGetCampusLocations() {
        List<CampusLocationDto> locations = transactionService.getCampusLocations();

        assertThat(locations).isNotEmpty();
        assertThat(locations).extracting(CampusLocationDto::getCode)
                .contains("HALL_A", "HALL_C", "LIBRARY", "CANTEEN", "CAMPUS_YARD", "PARKING_LOT");
    }
}
