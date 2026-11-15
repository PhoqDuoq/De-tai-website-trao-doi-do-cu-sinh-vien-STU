package com.stu.marketplace.billing.repository;

import com.stu.marketplace.billing.entity.FeePackage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeePackageRepository extends JpaRepository<FeePackage, Integer> {

    Optional<FeePackage> findByPackageCode(String packageCode);

    boolean existsByPackageCode(String packageCode);

    List<FeePackage> findByIsActiveTrue();

    Page<FeePackage> findAll(Pageable pageable);
}
