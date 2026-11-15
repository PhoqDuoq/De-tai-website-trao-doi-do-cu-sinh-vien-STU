package com.stu.marketplace.moderation.repository;

import com.stu.marketplace.moderation.entity.ModerationAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ModerationAuditLogRepository extends JpaRepository<ModerationAuditLog, Long> {

    Page<ModerationAuditLog> findByModeratorId(Long moderatorId, Pageable pageable);

    Page<ModerationAuditLog> findByTargetTypeAndTargetId(String targetType, Long targetId, Pageable pageable);

    Page<ModerationAuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
