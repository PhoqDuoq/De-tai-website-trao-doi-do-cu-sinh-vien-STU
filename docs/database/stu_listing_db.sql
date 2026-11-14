-- =============================================================================
-- Database 2: stu_listing_db
-- Owning Service: listing-service (Port 8082)
-- Purpose: Used goods catalog, categories, product condition, and item images.
-- Architectural Invariant: Strict microservice isolation.
--   - seller_id is a scalar BIGINT (logical reference to stu_identity_db.users.id).
--   - NO cross-database foreign keys.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `stu_listing_db`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `stu_listing_db`;

-- Table 1: categories
CREATE TABLE IF NOT EXISTS `categories` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `parent_id` INT UNSIGNED NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `icon_url` VARCHAR(255) NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
    INDEX `idx_category_active` (`is_active`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: listings
CREATE TABLE IF NOT EXISTS `listings` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `seller_id` BIGINT UNSIGNED NOT NULL COMMENT 'Logical reference to Identity Service (stu_identity_db.users.id)',
    `category_id` INT UNSIGNED NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT '0 for giveaway or barter exchange',
    `item_condition` ENUM('BRAND_NEW', 'LIKE_NEW', 'USED_GOOD', 'USED_FAIR') NOT NULL,
    `status` ENUM('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'RESERVED', 'SOLD', 'EXCHANGED', 'REJECTED', 'HIDDEN') NOT NULL DEFAULT 'PENDING_APPROVAL',
    `is_boosted` BOOLEAN NOT NULL DEFAULT FALSE,
    `boosted_until` TIMESTAMP NULL,
    `view_count` INT UNSIGNED NOT NULL DEFAULT 0,
    `location_notes` VARCHAR(255) NULL COMMENT 'E.g., STU Campus Building A, Canteen',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_listing_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
    INDEX `idx_listing_seller` (`seller_id`),
    INDEX `idx_listing_category_status` (`category_id`, `status`),
    INDEX `idx_listing_boosted` (`is_boosted`, `boosted_until`),
    FULLTEXT INDEX `idx_listing_fts` (`title`, `description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: listing_images
CREATE TABLE IF NOT EXISTS `listing_images` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `listing_id` BIGINT UNSIGNED NOT NULL,
    `image_url` VARCHAR(255) NOT NULL,
    `display_order` INT NOT NULL DEFAULT 0,
    `is_primary` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_images_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
    INDEX `idx_images_listing_order` (`listing_id`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
