-- =============================================================================
-- Database 6: stu_billing_db
-- Owning Service: billing-service (Port 8086)
-- Purpose: Platform listing fee collection only (priority boosts, VIP badges).
-- ARCHITECTURAL INVARIANT & CONSTRAINT (R3):
--   - Strict microservice isolation.
--   - ONLY manages platform listing fees paid by sellers (phí đăng tin & gói đẩy tin).
--   - STRICTLY PROHIBITED: No student-to-student payments, no platform escrow wallet.
--   - user_id is a scalar reference to Identity Service (seller paying the fee).
--   - listing_id is a scalar reference to Listing Service (item receiving the boost).
--   - NO cross-database foreign keys.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `stu_billing_db`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `stu_billing_db`;

-- Table 1: fee_packages (Listing fee boost package catalog)
CREATE TABLE IF NOT EXISTS `fee_packages` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `package_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'E.g., BOOST_3_DAYS, VIP_BADGE_7_DAYS',
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `duration_days` INT NOT NULL DEFAULT 3,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_packages_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: invoices (Platform listing fee invoices issued to sellers)
CREATE TABLE IF NOT EXISTS `invoices` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `invoice_code` VARCHAR(32) NOT NULL UNIQUE COMMENT 'E.g., INV-20261114-9912',
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'Logical reference to Identity Service (seller paying fee)',
    `listing_id` BIGINT UNSIGNED NOT NULL COMMENT 'Logical reference to Listing Service (item receiving boost)',
    `package_id` INT UNSIGNED NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'EXPIRED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `paid_at` TIMESTAMP NULL,
    CONSTRAINT `fk_invoices_package` FOREIGN KEY (`package_id`) REFERENCES `fee_packages` (`id`),
    INDEX `idx_invoices_user` (`user_id`),
    INDEX `idx_invoices_listing` (`listing_id`),
    INDEX `idx_invoices_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: payment_transactions (External payment gateway logs for listing fees)
CREATE TABLE IF NOT EXISTS `payment_transactions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `invoice_id` BIGINT UNSIGNED NOT NULL,
    `gateway_provider` ENUM('VNPAY', 'MOMO', 'BANK_TRANSFER') NOT NULL,
    `gateway_txn_ref` VARCHAR(100) NOT NULL UNIQUE,
    `gateway_response_code` VARCHAR(20) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('SUCCESS', 'FAILED', 'PENDING') NOT NULL DEFAULT 'PENDING',
    `callback_payload` JSON NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_payments_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`),
    INDEX `idx_payments_invoice` (`invoice_id`),
    INDEX `idx_payments_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
