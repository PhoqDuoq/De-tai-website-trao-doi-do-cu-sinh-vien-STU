package com.stu.marketplace.moderation.repository;

import com.stu.marketplace.moderation.entity.ForbiddenKeyword;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ForbiddenKeywordRepository extends JpaRepository<ForbiddenKeyword, Integer> {

    Optional<ForbiddenKeyword> findByKeywordIgnoreCase(String keyword);

    boolean existsByKeywordIgnoreCase(String keyword);

    List<ForbiddenKeyword> findByIsActiveTrue();

    Page<ForbiddenKeyword> findByKeywordContainingIgnoreCase(String keyword, Pageable pageable);

    Page<ForbiddenKeyword> findByCategoryAndIsActive(String category, Boolean isActive, Pageable pageable);
}
