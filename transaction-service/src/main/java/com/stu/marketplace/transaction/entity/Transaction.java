package com.stu.marketplace.transaction.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "transactions", indexes = {
    @Index(name = "idx_trans_buyer", columnList = "buyer_id"),
    @Index(name = "idx_trans_seller", columnList = "seller_id"),
    @Index(name = "idx_trans_listing", columnList = "listing_id"),
    @Index(name = "idx_trans_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_code", nullable = false, unique = true, length = 32)
    private String transactionCode;

    @Column(name = "listing_id", nullable = false)
    private Long listingId;

    @Column(name = "buyer_id", nullable = false)
    private Long buyerId;

    @Column(name = "seller_id", nullable = false)
    private Long sellerId;

    @Column(name = "agreed_price", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal agreedPrice = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 20)
    @Builder.Default
    private TransactionType transactionType = TransactionType.BUY_SELL;

    @Column(name = "meeting_location")
    private String meetingLocation;

    @Column(name = "meeting_time")
    private LocalDateTime meetingTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private TransactionStatus status = TransactionStatus.REQUESTED;

    @Column(name = "cancel_reason")
    private String cancelReason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<TransactionTimeline> timelines = new ArrayList<>();

    public void addTimeline(TransactionTimeline timeline) {
        timelines.add(timeline);
        timeline.setTransaction(this);
    }
}
