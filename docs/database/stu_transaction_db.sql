CREATE DATABASE IF NOT EXISTS `stu_transaction_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `stu_transaction_db`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `transaction_timeline`;
CREATE TABLE `transaction_timeline` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `transaction_id` bigint unsigned NOT NULL,
  `status` enum('REQUESTED','ACCEPTED','CONFIRMED','COMPLETED','CANCELLED','DISPUTED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actor_id` bigint unsigned NOT NULL COMMENT 'Logical reference to Identity Service',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_timeline_trans` (`transaction_id`),
  CONSTRAINT `fk_timeline_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `transaction_code` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Human-readable code, e.g., TX-20261114-A8F2',
  `listing_id` bigint unsigned NOT NULL COMMENT 'Logical reference to Listing Service',
  `buyer_id` bigint unsigned NOT NULL COMMENT 'Logical reference to Identity Service',
  `seller_id` bigint unsigned NOT NULL COMMENT 'Logical reference to Identity Service',
  `agreed_price` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Agreed price for in-person settlement',
  `transaction_type` enum('BUY_SELL','EXCHANGE','GIVEAWAY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BUY_SELL',
  `meeting_location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'E.g., STU Canteen, Building A Lobby',
  `meeting_time` timestamp NULL DEFAULT NULL COMMENT 'Agreed schedule to meet on campus',
  `status` enum('REQUESTED','ACCEPTED','CONFIRMED','COMPLETED','CANCELLED','DISPUTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'REQUESTED',
  `cancel_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_code` (`transaction_code`),
  KEY `idx_trans_buyer` (`buyer_id`),
  KEY `idx_trans_seller` (`seller_id`),
  KEY `idx_trans_listing` (`listing_id`),
  KEY `idx_trans_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `transactions` (`id`, `transaction_code`, `listing_id`, `buyer_id`, `seller_id`, `agreed_price`, `transaction_type`, `meeting_location`, `meeting_time`, `status`, `cancel_reason`, `created_at`, `updated_at`) VALUES
(1, 'TX-STU-2026-001', 1, 3, 4, '35000.00', 'BUY_SELL', 'Sảnh A - Tòa nhà Trung tâm STU', '2026-11-20 02:30:00', 'COMPLETED', NULL, '2026-11-19 07:00:00', '2026-11-20 03:00:00'),
(2, 'TX-STU-2026-002', 2, 3, 4, '120000.00', 'BUY_SELL', 'Xưởng thực hành Điện - Điện tử STU', '2026-11-26 07:45:00', 'ACCEPTED', NULL, '2026-11-24 03:15:00', '2026-11-24 04:00:00');

SET FOREIGN_KEY_CHECKS = 1;
