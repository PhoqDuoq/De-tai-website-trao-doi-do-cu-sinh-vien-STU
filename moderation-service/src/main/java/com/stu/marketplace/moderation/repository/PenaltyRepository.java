package com.stu.marketplace.moderation.repository;

import com.stu.marketplace.moderation.entity.Penalty;
import com.stu.marketplace.moderation.entity.PenaltyType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PenaltyRepository extends JpaRepository<Penalty, Long> {

    List<Penalty> findByUserId(Long userId);

    Page<Penalty> findByUserId(Long userId, Pageable pageable);

    List<Penalty> findByUserIdAndPenaltyType(Long userId, PenaltyType penaltyType);

    Page<Penalty> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
