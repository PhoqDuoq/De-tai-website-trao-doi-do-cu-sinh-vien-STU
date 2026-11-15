-- =============================================================================
-- Database 3: stu_interaction_db
-- Owning Service: interaction-service (Port 8083)
-- Purpose: Social features, favorite saved listings, Q&A comments, and peer chat.
-- Architectural Invariant: Strict microservice isolation.
--   - user_id, reviewer_id, reviewee_id, sender_id, buyer_id, seller_id are scalar references to Identity Service.
--   - listing_id is a scalar reference to Listing Service.
--   - transaction_id is a scalar reference to Transaction Service.
--   - NO cross-database foreign keys.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `stu_interaction_db`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `stu_interaction_db`;

-- Table 1: favorites (Saved items)
CREATE TABLE IF NOT EXISTS `favorites` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'Logical reference to Identity Service',
    `listing_id` BIGINT UNSIGNED NOT NULL COMMENT 'Logical reference to Listing Service',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_user_listing` (`user_id`, `listing_id`),
    INDEX `idx_favorites_listing` (`listing_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: comments (Public Q&A on listings)
CREATE TABLE IF NOT EXISTS `comments` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `listing_id` BIGINT UNSIGNED NOT NULL COMMENT 'Logical reference to Listing Service',
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'Logical reference to Identity Service',
    `parent_id` BIGINT UNSIGNED NULL COMMENT 'Self-reference for nested discussion replies',
    `content` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_comments_parent` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE,
    INDEX `idx_comments_listing` (`listing_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: reviews (Post-transaction ratings between students)
CREATE TABLE IF NOT EXISTS `reviews` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `reviewer_id` BIGINT UNSIGNED NOT NULL COMMENT 'Logical reference to Identity Service',
    `reviewee_id` BIGINT UNSIGNED NOT NULL COMMENT 'Logical reference to Identity Service',
    `transaction_id` BIGINT UNSIGNED NOT NULL COMMENT 'Logical reference to Transaction Service',
    `rating` INT NOT NULL COMMENT 'Rating scale 1 to 5 stars',
    `comment` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_reviewer_transaction` (`reviewer_id`, `transaction_id`),
    INDEX `idx_reviews_reviewee` (`reviewee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 4: conversations (1-on-1 direct chat threads)
CREATE TABLE IF NOT EXISTS `conversations` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `listing_id` BIGINT UNSIGNED NOT NULL COMMENT 'Logical reference to Listing Service',
    `buyer_id` BIGINT UNSIGNED NOT NULL COMMENT 'Logical reference to Identity Service',
    `seller_id` BIGINT UNSIGNED NOT NULL COMMENT 'Logical reference to Identity Service',
    `last_message_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_conversation_participants` (`listing_id`, `buyer_id`, `seller_id`),
    INDEX `idx_conversation_buyer` (`buyer_id`),
    INDEX `idx_conversation_seller` (`seller_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 5: messages (Chat messages)
CREATE TABLE IF NOT EXISTS `messages` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `conversation_id` BIGINT UNSIGNED NOT NULL,
    `sender_id` BIGINT UNSIGNED NOT NULL COMMENT 'Logical reference to Identity Service',
    `message_type` ENUM('TEXT', 'IMAGE', 'LOCATION') NOT NULL DEFAULT 'TEXT',
    `content` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
    INDEX `idx_messages_conversation_date` (`conversation_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
