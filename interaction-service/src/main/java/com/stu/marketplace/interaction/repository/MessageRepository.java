package com.stu.marketplace.interaction.repository;

import com.stu.marketplace.interaction.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    Page<Message> findByConversationIdOrderByCreatedAtDesc(Long conversationId, Pageable pageable);

    List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    Optional<Message> findTopByConversationIdOrderByCreatedAtDesc(Long conversationId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.id = :conversationId AND m.senderId != :userId AND m.isRead = false")
    long countUnreadMessagesByConversation(@Param("conversationId") Long conversationId, @Param("userId") Long userId);

    @Query("SELECT COUNT(m) FROM Message m JOIN m.conversation c WHERE (c.buyerId = :userId OR c.sellerId = :userId) AND m.senderId != :userId AND m.isRead = false")
    long countTotalUnreadMessagesForUser(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.conversation.id = :conversationId AND m.senderId != :userId AND m.isRead = false")
    int markMessagesAsRead(@Param("conversationId") Long conversationId, @Param("userId") Long userId);
}
