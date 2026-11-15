package com.stu.marketplace.interaction.repository;

import com.stu.marketplace.interaction.entity.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByListingIdAndBuyerIdAndSellerId(Long listingId, Long buyerId, Long sellerId);

    @Query("SELECT c FROM Conversation c WHERE c.buyerId = :userId OR c.sellerId = :userId ORDER BY c.lastMessageAt DESC")
    Page<Conversation> findByUserParticipation(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT c FROM Conversation c WHERE c.buyerId = :userId OR c.sellerId = :userId")
    Page<Conversation> findAllByUserParticipation(@Param("userId") Long userId, Pageable pageable);
}
