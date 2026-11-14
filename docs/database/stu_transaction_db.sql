-- =============================================================================
-- Database 4: stu_transaction_db
-- Owning Service: transaction-service (Port 8084)
-- Purpose: Student item exchange proposals, campus meetup schedules, and status tracking.
-- Architectural Invariant: Strict microservice isolation.
--   - NO student-to-student monetary payments processed here (cash/barter upon meeting).
--   - buyer_id and seller_id are scalar references to Identity Service.
--   - listing_id is a scalar reference to Listing Service.
--   - NO cross-database foreign keys.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `stu_transaction_db`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `stu_transaction_db`;

-- Table 1: transactions
CREATE TABLE IF NOT EXISTS `transactions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `transaction_code` VARCHAR(32) NOT NULL UNIQUE COMMENT 'Human-readable code, e.g., TX-20261114-A8F2',
    `listing_id` BIGINT UNSIGNED NOT NULL COMMENT 'Logical reference to Listing Service',
    `buyer_id` BIGINT UNSIGNED NOT NULL COMMENT 'Logical reference to Identity Service',
    `seller_id` BIGINT UNSIGNED NOT NULL COMMENT 'Logical reference to Identity Service',
    `agreed_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Agreed price for in-person settlement',
    `transaction_type` ENUM('BUY_SELL', 'EXCHANGE', 'GIVEAWAY') NOT NULL DEFAULT 'BUY_SELL',
    `meeting_location` VARCHAR(255) NULL COMMENT 'E.g., STU Canteen, Building A Lobby',
    `meeting_time` TIMESTAMP NULL COMMENT 'Agreed schedule to meet on campus',
    `status` ENUM('REQUESTED', 'ACCEPTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'DISPUTED') NOT NULL DEFAULT 'REQUESTED',
    `cancel_reason` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_trans_buyer` (`buyer_id`),
    INDEX `idx_trans_seller` (`seller_id`),
    INDEX `idx_trans_listing` (`listing_id`),
    INDEX `idx_trans_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: transaction_timeline (Audit trail of state transitions)
CREATE TABLE IF NOT EXISTS `transaction_timeline` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `transaction_id` BIGINT UNSIGNED NOT NULL,
    `status` ENUM('REQUESTED', 'ACCEPTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'DISPUTED') NOT NULL,
    `note` VARCHAR(255) NULL,
    `actor_id` BIGINT UNSIGNED NOT NULL COMMENT 'Logical reference to Identity Service',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_timeline_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE,
    INDEX `idx_timeline_trans` (`transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
