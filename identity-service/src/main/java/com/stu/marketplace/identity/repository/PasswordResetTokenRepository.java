package com.stu.marketplace.identity.repository;

import com.stu.marketplace.identity.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    Optional<PasswordResetToken> findByTokenHashAndUsedAtIsNull(String tokenHash);

    Optional<PasswordResetToken> findTopByUserIdAndUsedAtIsNullOrderByCreatedAtDesc(Long userId);
}
