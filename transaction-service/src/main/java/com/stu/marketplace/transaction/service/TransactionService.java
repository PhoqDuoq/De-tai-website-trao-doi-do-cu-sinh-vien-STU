package com.stu.marketplace.transaction.service;

import com.stu.marketplace.common.exception.AppException;
import com.stu.marketplace.common.exception.ErrorCode;
import com.stu.marketplace.transaction.client.ListingClient;
import com.stu.marketplace.transaction.constant.CampusLocation;
import com.stu.marketplace.transaction.dto.*;
import com.stu.marketplace.transaction.entity.*;
import com.stu.marketplace.transaction.repository.TransactionRepository;
import com.stu.marketplace.transaction.repository.TransactionTimelineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final TransactionTimelineRepository timelineRepository;
    private final ListingClient listingClient;

    @Transactional
    public TransactionResponse createProposal(Long buyerId, TransactionProposalRequest request) {
        if (buyerId.equals(request.getSellerId())) {
            throw new AppException(ErrorCode.CANNOT_TRANSACT_OWN_ITEM);
        }

        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomPart = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        String transactionCode = "TX-" + datePart + "-" + randomPart;

        TransactionType type = request.getTransactionType() != null ? request.getTransactionType() : TransactionType.BUY_SELL;

        Transaction transaction = Transaction.builder()
                .transactionCode(transactionCode)
                .listingId(request.getListingId())
                .buyerId(buyerId)
                .sellerId(request.getSellerId())
                .agreedPrice(request.getAgreedPrice())
                .transactionType(type)
                .meetingLocation(request.getMeetingLocation())
                .meetingTime(request.getMeetingTime())
                .status(TransactionStatus.REQUESTED)
                .build();

        Transaction saved = transactionRepository.save(transaction);

        TransactionTimeline initialTimeline = TransactionTimeline.builder()
                .transaction(saved)
                .status(TransactionStatus.REQUESTED)
                .actorId(buyerId)
                .note(request.getNote() != null ? request.getNote().trim() : "Transaction proposal created by buyer")
                .build();
        timelineRepository.save(initialTimeline);

        log.info("Created transaction proposal {} (code: {}) by buyer {} for listing {}",
                saved.getId(), transactionCode, buyerId, request.getListingId());
        return mapToResponse(saved, buyerId);
    }

    @Transactional
    public TransactionResponse acceptProposal(Long sellerId, Long transactionId, TransactionAcceptRequest request) {
        Transaction tx = getExistingTransaction(transactionId);

        if (!tx.getSellerId().equals(sellerId)) {
            throw new AppException(ErrorCode.FORBIDDEN, "Only the seller can accept this transaction proposal");
        }

        if (tx.getStatus() != TransactionStatus.REQUESTED) {
            throw new AppException(ErrorCode.INVALID_TRANSACTION_STATUS,
                    "Transaction cannot be accepted from status: " + tx.getStatus());
        }

        tx.setStatus(TransactionStatus.ACCEPTED);
        Transaction updated = transactionRepository.save(tx);

        String note = (request != null && request.getNote() != null && !request.getNote().isBlank())
                ? request.getNote().trim()
                : "Proposal accepted by seller";

        TransactionTimeline timeline = TransactionTimeline.builder()
                .transaction(updated)
                .status(TransactionStatus.ACCEPTED)
                .actorId(sellerId)
                .note(note)
                .build();
        timelineRepository.save(timeline);

        log.info("Transaction {} accepted by seller {}", transactionId, sellerId);
        return mapToResponse(updated, sellerId);
    }

    @Transactional
    public TransactionResponse scheduleMeetup(Long userId, Long transactionId, MeetupScheduleRequest request) {
        Transaction tx = getExistingTransaction(transactionId);

        if (!tx.getBuyerId().equals(userId) && !tx.getSellerId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN, "Only transaction participants can schedule a meetup");
        }

        if (tx.getStatus() == TransactionStatus.COMPLETED || tx.getStatus() == TransactionStatus.CANCELLED) {
            throw new AppException(ErrorCode.TRANSACTION_ALREADY_TERMINATED);
        }

        if (tx.getStatus() != TransactionStatus.ACCEPTED && tx.getStatus() != TransactionStatus.CONFIRMED) {
            throw new AppException(ErrorCode.INVALID_TRANSACTION_STATUS,
                    "Meetup can only be scheduled for accepted proposals (current: " + tx.getStatus() + ")");
        }

        if (request.getMeetingTime().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.INVALID_MEETING_TIME);
        }

        tx.setMeetingLocation(request.getMeetingLocation().trim());
        tx.setMeetingTime(request.getMeetingTime());
        tx.setStatus(TransactionStatus.CONFIRMED);
        Transaction updated = transactionRepository.save(tx);

        String note = (request.getNote() != null && !request.getNote().isBlank())
                ? request.getNote().trim()
                : "Campus meetup scheduled at " + request.getMeetingLocation().trim();

        TransactionTimeline timeline = TransactionTimeline.builder()
                .transaction(updated)
                .status(TransactionStatus.CONFIRMED)
                .actorId(userId)
                .note(note)
                .build();
        timelineRepository.save(timeline);

        log.info("Transaction {} meetup scheduled by user {} at {} on {}",
                transactionId, userId, request.getMeetingLocation(), request.getMeetingTime());
        return mapToResponse(updated, userId);
    }

    @Transactional
    public TransactionResponse confirmTransaction(Long userId, Long transactionId, TransactionConfirmRequest request, String authToken) {
        Transaction tx = getExistingTransaction(transactionId);

        if (!tx.getBuyerId().equals(userId) && !tx.getSellerId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN, "Only transaction participants can confirm completion");
        }

        if (tx.getStatus() != TransactionStatus.CONFIRMED) {
            throw new AppException(ErrorCode.INVALID_TRANSACTION_STATUS,
                    "Transaction must be in CONFIRMED status before completion (current: " + tx.getStatus() + ")");
        }

        String expectedCode = calculateVerificationCode(tx);
        boolean isCodeProvided = request != null && request.getVerificationCode() != null && !request.getVerificationCode().isBlank();
        boolean completeNow = false;

        if (isCodeProvided) {
            if (!request.getVerificationCode().trim().equalsIgnoreCase(expectedCode)) {
                throw new AppException(ErrorCode.INVALID_VERIFICATION_CODE);
            }
            completeNow = true;
        } else {
            // Dual confirmation workflow
            String actorRole = tx.getBuyerId().equals(userId) ? "BUYER" : "SELLER";
            String note = "CONFIRMED_BY_" + actorRole + (request != null && request.getNote() != null ? ": " + request.getNote().trim() : "");

            TransactionTimeline confirmAudit = TransactionTimeline.builder()
                    .transaction(tx)
                    .status(TransactionStatus.CONFIRMED)
                    .actorId(userId)
                    .note(note)
                    .build();
            timelineRepository.save(confirmAudit);

            Long counterpartyId = tx.getBuyerId().equals(userId) ? tx.getSellerId() : tx.getBuyerId();
            boolean counterpartyConfirmed = timelineRepository.existsByTransactionIdAndActorIdAndNoteStartingWith(
                    tx.getId(), counterpartyId, "CONFIRMED_BY_");

            if (counterpartyConfirmed) {
                completeNow = true;
            }
        }

        if (completeNow) {
            tx.setStatus(TransactionStatus.COMPLETED);
            Transaction saved = transactionRepository.save(tx);

            TransactionTimeline completionTimeline = TransactionTimeline.builder()
                    .transaction(saved)
                    .status(TransactionStatus.COMPLETED)
                    .actorId(userId)
                    .note("Item handover and payment successfully completed on STU campus")
                    .build();
            timelineRepository.save(completionTimeline);

            // Synchronize listing status to SOLD in listing-service
            listingClient.markListingAsSold(saved.getListingId(), authToken, "Sold via transaction " + saved.getTransactionCode());

            log.info("Transaction {} (code: {}) successfully completed by user {}", transactionId, saved.getTransactionCode(), userId);
            return mapToResponse(saved, userId);
        }

        log.info("Transaction {} partially confirmed by user {}, awaiting counterparty confirmation", transactionId, userId);
        return mapToResponse(tx, userId);
    }

    @Transactional
    public TransactionResponse cancelTransaction(Long userId, Collection<? extends GrantedAuthority> authorities,
                                                Long transactionId, TransactionCancelRequest request) {
        Transaction tx = getExistingTransaction(transactionId);

        boolean isBuyer = tx.getBuyerId().equals(userId);
        boolean isSeller = tx.getSellerId().equals(userId);
        boolean isStaff = authorities != null && authorities.stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MODERATOR"));

        if (!isBuyer && !isSeller && !isStaff) {
            throw new AppException(ErrorCode.FORBIDDEN, "Not authorized to cancel this transaction");
        }

        if (tx.getStatus() == TransactionStatus.COMPLETED || tx.getStatus() == TransactionStatus.CANCELLED) {
            throw new AppException(ErrorCode.TRANSACTION_ALREADY_TERMINATED);
        }

        tx.setStatus(TransactionStatus.CANCELLED);
        tx.setCancelReason(request.getReason().trim());
        Transaction saved = transactionRepository.save(tx);

        TransactionTimeline timeline = TransactionTimeline.builder()
                .transaction(saved)
                .status(TransactionStatus.CANCELLED)
                .actorId(userId)
                .note("Cancelled: " + request.getReason().trim())
                .build();
        timelineRepository.save(timeline);

        log.info("Transaction {} cancelled by user {} with reason: {}", transactionId, userId, request.getReason());
        return mapToResponse(saved, userId);
    }

    @Transactional
    public TransactionResponse disputeTransaction(Long userId, Long transactionId, TransactionDisputeRequest request) {
        Transaction tx = getExistingTransaction(transactionId);

        if (!tx.getBuyerId().equals(userId) && !tx.getSellerId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN, "Only participants can raise a dispute");
        }

        if (tx.getStatus() != TransactionStatus.CONFIRMED && tx.getStatus() != TransactionStatus.COMPLETED) {
            throw new AppException(ErrorCode.INVALID_TRANSACTION_STATUS,
                    "Disputes can only be raised for confirmed or completed transactions");
        }

        tx.setStatus(TransactionStatus.DISPUTED);
        Transaction saved = transactionRepository.save(tx);

        TransactionTimeline timeline = TransactionTimeline.builder()
                .transaction(saved)
                .status(TransactionStatus.DISPUTED)
                .actorId(userId)
                .note("Dispute: " + request.getReason().trim())
                .build();
        timelineRepository.save(timeline);

        log.info("Transaction {} disputed by user {} with reason: {}", transactionId, userId, request.getReason());
        return mapToResponse(saved, userId);
    }

    @Transactional(readOnly = true)
    public TransactionResponse getTransactionById(Long userId, boolean isStaff, Long transactionId) {
        Transaction tx = getExistingTransaction(transactionId);

        if (!isStaff && !tx.getBuyerId().equals(userId) && !tx.getSellerId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN, "Not authorized to view this transaction");
        }

        return mapToResponse(tx, userId);
    }

    @Transactional(readOnly = true)
    public PagedResponse<TransactionResponse> getMyTransactions(Long userId, String role, TransactionStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Transaction> txPage;

        if ("BUYER".equalsIgnoreCase(role)) {
            txPage = transactionRepository.findByBuyerIdOrderByCreatedAtDesc(userId, pageable);
        } else if ("SELLER".equalsIgnoreCase(role)) {
            txPage = transactionRepository.findBySellerIdOrderByCreatedAtDesc(userId, pageable);
        } else {
            if (status != null) {
                txPage = transactionRepository.findByUserIdAndStatus(userId, status, pageable);
            } else {
                txPage = transactionRepository.findByUserId(userId, pageable);
            }
        }

        List<TransactionResponse> content = txPage.getContent().stream()
                .map(t -> mapToResponse(t, userId))
                .collect(Collectors.toList());

        return PagedResponse.<TransactionResponse>builder()
                .content(content)
                .page(txPage.getNumber())
                .size(txPage.getSize())
                .totalElements(txPage.getTotalElements())
                .totalPages(txPage.getTotalPages())
                .last(txPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public List<TimelineResponse> getTransactionTimeline(Long userId, boolean isStaff, Long transactionId) {
        Transaction tx = getExistingTransaction(transactionId);

        if (!isStaff && !tx.getBuyerId().equals(userId) && !tx.getSellerId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN, "Not authorized to view transaction timeline");
        }

        return timelineRepository.findByTransactionIdOrderByCreatedAtAsc(transactionId).stream()
                .map(this::mapTimelineToResponse)
                .collect(Collectors.toList());
    }

    public List<CampusLocationDto> getCampusLocations() {
        return CampusLocation.getAll().stream()
                .map(loc -> CampusLocationDto.builder()
                        .code(loc.name())
                        .name(loc.getName())
                        .description(loc.getDescription())
                        .build())
                .collect(Collectors.toList());
    }

    public String calculateVerificationCode(Transaction tx) {
        int hash = Math.abs((tx.getTransactionCode() + "_STU_EXCHANGE_KEY").hashCode());
        return String.format("%06d", hash % 1000000);
    }

    private Transaction getExistingTransaction(Long transactionId) {
        return transactionRepository.findById(transactionId)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));
    }

    private TransactionResponse mapToResponse(Transaction tx, Long currentUserId) {
        boolean buyerConfirmed = timelineRepository.existsByTransactionIdAndActorIdAndNoteStartingWith(
                tx.getId(), tx.getBuyerId(), "CONFIRMED_BY_");
        boolean sellerConfirmed = timelineRepository.existsByTransactionIdAndActorIdAndNoteStartingWith(
                tx.getId(), tx.getSellerId(), "CONFIRMED_BY_");

        List<TimelineResponse> timelines = timelineRepository.findByTransactionIdOrderByCreatedAtAsc(tx.getId())
                .stream()
                .map(this::mapTimelineToResponse)
                .collect(Collectors.toList());

        String verificationCode = null;
        if (tx.getBuyerId().equals(currentUserId) || tx.getStatus() == TransactionStatus.COMPLETED) {
            verificationCode = calculateVerificationCode(tx);
        }

        return TransactionResponse.builder()
                .id(tx.getId())
                .transactionCode(tx.getTransactionCode())
                .listingId(tx.getListingId())
                .buyerId(tx.getBuyerId())
                .sellerId(tx.getSellerId())
                .agreedPrice(tx.getAgreedPrice())
                .transactionType(tx.getTransactionType())
                .meetingLocation(tx.getMeetingLocation())
                .meetingTime(tx.getMeetingTime())
                .status(tx.getStatus())
                .cancelReason(tx.getCancelReason())
                .verificationCode(verificationCode)
                .buyerConfirmed(buyerConfirmed)
                .sellerConfirmed(sellerConfirmed)
                .createdAt(tx.getCreatedAt())
                .updatedAt(tx.getUpdatedAt())
                .timeline(timelines)
                .build();
    }

    private TimelineResponse mapTimelineToResponse(TransactionTimeline timeline) {
        return TimelineResponse.builder()
                .id(timeline.getId())
                .transactionId(timeline.getTransaction().getId())
                .status(timeline.getStatus())
                .note(timeline.getNote())
                .actorId(timeline.getActorId())
                .createdAt(timeline.getCreatedAt())
                .build();
    }
}
