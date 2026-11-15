package com.stu.marketplace.moderation.repository;

import com.stu.marketplace.moderation.entity.Report;
import com.stu.marketplace.moderation.entity.ReportReason;
import com.stu.marketplace.moderation.entity.ReportStatus;
import com.stu.marketplace.moderation.entity.ReportTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    Page<Report> findByStatus(ReportStatus status, Pageable pageable);

    Page<Report> findByTargetType(ReportTargetType targetType, Pageable pageable);

    Page<Report> findByStatusAndTargetType(ReportStatus status, ReportTargetType targetType, Pageable pageable);

    Page<Report> findByReporterId(Long reporterId, Pageable pageable);

    Page<Report> findByAssignedModeratorId(Long assignedModeratorId, Pageable pageable);

    boolean existsByReporterIdAndTargetTypeAndTargetIdAndStatusIn(
            Long reporterId,
            ReportTargetType targetType,
            Long targetId,
            Collection<ReportStatus> statuses
    );
}
