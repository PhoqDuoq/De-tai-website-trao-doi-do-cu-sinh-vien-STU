-- =============================================================================
-- Database 1: stu_identity_db
-- Owning Service: identity-service (Port 8081)
-- Purpose: User authentication, student verification, RBAC, and refresh tokens.
-- Architectural Invariant: Strict microservice isolation. No cross-database FKs.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `stu_identity_db`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `stu_identity_db`;

-- Table 1: users
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `student_id` VARCHAR(20) UNIQUE NULL COMMENT 'STU Student code, e.g., DH52001234',
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `phone_number` VARCHAR(15) NULL,
    `avatar_url` VARCHAR(255) NULL,
    `role` ENUM('STUDENT', 'MODERATOR', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    `status` ENUM('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'BANNED') NOT NULL DEFAULT 'PENDING_VERIFICATION',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: user_verifications (STU Student card verification)
CREATE TABLE IF NOT EXISTS `user_verifications` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `student_card_image_url` VARCHAR(255) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `rejection_reason` VARCHAR(255) NULL,
    `verified_by` BIGINT UNSIGNED NULL COMMENT 'Scalar reference to admin user id',
    `verified_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_verification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_verification_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: refresh_tokens
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL UNIQUE,
    `expires_at` TIMESTAMP NOT NULL,
    `revoked` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_refresh_token_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_token_expires` (`expires_at`, `revoked`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
