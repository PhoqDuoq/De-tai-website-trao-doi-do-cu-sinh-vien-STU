package com.stu.marketplace.identity.repository;

import com.stu.marketplace.identity.entity.StudentVerification;
import com.stu.marketplace.identity.entity.StudentVerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentVerificationRepository extends JpaRepository<StudentVerification, Long> {

    List<StudentVerification> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<StudentVerification> findFirstByUserIdOrderByCreatedAtDesc(Long userId);

    boolean existsByUserIdAndStatus(Long userId, StudentVerificationStatus status);

    List<StudentVerification> findByStatusOrderByCreatedAtAsc(StudentVerificationStatus status);
}
