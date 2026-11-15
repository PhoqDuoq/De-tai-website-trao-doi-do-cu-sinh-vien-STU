-- =============================================================================
-- Database 5: stu_moderation_db
-- Owning Service: moderation-service (Port 8085)
-- Purpose: Moderation reports against scam listings/users, forbidden word filter, and audit logs.
-- Architectural Invariant: Strict microservice isolation.
--   - reporter_id and assigned_moderator_id are scalar references to Identity Service.
--   - target_id is a polymorphic scalar reference (pointing to listing, user, comment, or message).
--   - NO cross-database foreign keys.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `stu_moderation_db`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `stu_moderation_db`;

-- Table 1: reports
CREATE TABLE IF NOT EXISTS `reports` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `reporter_id` BIGINT UNSIGNED NOT NULL COMMENT 'Logical reference to Identity Service',
    `target_type` ENUM('LISTING', 'USER', 'COMMENT', 'MESSAGE') NOT NULL,
    `target_id` BIGINT UNSIGNED NOT NULL COMMENT 'Polymorphic logical ID',
    `reason` ENUM('SPAM', 'PROHIBITED_GOODS', 'FRAUD_SCAM', 'OFFENSIVE_CONTENT', 'INAPPROPRIATE_BEHAVIOR', 'OTHER') NOT NULL,
    `details` TEXT NULL,
    `evidence_image_url` VARCHAR(255) NULL,
    `status` ENUM('PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'PENDING',
    `assigned_moderator_id` BIGINT UNSIGNED NULL COMMENT 'Logical reference to Identity Service',
    `resolution_action` ENUM('NO_ACTION', 'WARNING_SENT', 'CONTENT_REMOVED', 'USER_TEMPORARILY_BANNED', 'USER_PERMANENTLY_BANNED') NULL,
    `resolution_notes` TEXT NULL,
    `resolved_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_reports_status` (`status`),
    INDEX `idx_reports_target` (`target_type`, `target_id`),
    INDEX `idx_reports_reporter` (`reporter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: forbidden_keywords (Automated filter dictionary)
CREATE TABLE IF NOT EXISTS `forbidden_keywords` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `keyword` VARCHAR(100) NOT NULL UNIQUE,
    `category` VARCHAR(50) NOT NULL DEFAULT 'PROHIBITED_ITEM',
    `severity` ENUM('AUTO_REJECT', 'FLAG_FOR_REVIEW') NOT NULL DEFAULT 'FLAG_FOR_REVIEW',
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_keywords_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: moderation_audit_logs (History of moderator actions)
CREATE TABLE IF NOT EXISTS `moderation_audit_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `moderator_id` BIGINT UNSIGNED NOT NULL COMMENT 'Logical reference to Identity Service',
    `action_type` VARCHAR(50) NOT NULL,
    `target_type` VARCHAR(50) NOT NULL,
    `target_id` BIGINT UNSIGNED NOT NULL,
    `reason` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_audit_moderator` (`moderator_id`),
    INDEX `idx_audit_target` (`target_type`, `target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 4: penalties (Account and listing penalties issued by moderation)
CREATE TABLE IF NOT EXISTS `penalties` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'Logical reference to Identity Service',
    `report_id` BIGINT UNSIGNED NULL COMMENT 'Optional logical reference to reports.id',
    `penalty_type` ENUM('WARNING', 'TEMPORARY_BAN', 'PERMANENT_BAN') NOT NULL,
    `reason` VARCHAR(255) NOT NULL,
    `duration_days` INT NULL COMMENT 'Duration in days for TEMPORARY_BAN, null otherwise',
    `issued_by` BIGINT UNSIGNED NOT NULL COMMENT 'Logical reference to Identity Service (moderator)',
    `expires_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_penalties_user` (`user_id`),
    INDEX `idx_penalties_type` (`penalty_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
