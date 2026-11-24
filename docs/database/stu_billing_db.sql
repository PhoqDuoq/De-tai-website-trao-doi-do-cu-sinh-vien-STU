CREATE DATABASE IF NOT EXISTS `stu_billing_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `stu_billing_db`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `fee_packages`;
CREATE TABLE `fee_packages` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `package_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'E.g., BOOST_3_DAYS, VIP_BADGE_7_DAYS',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration_days` int NOT NULL DEFAULT '3',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `package_code` (`package_code`),
  KEY `idx_packages_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `fee_packages` (`id`, `package_code`, `name`, `description`, `price`, `duration_days`, `is_active`, `created_at`) VALUES
(1, 'FREE_STANDARD', 'Gói Sinh viên Tiêu chuẩn', 'Đăng tin miễn phí không giới hạn', '0.00', 30, 1, '2026-11-17 14:34:42'),
(2, 'BOOST_3_DAYS', 'Gói Đẩy Tin Nổi Bật 3 Ngày', 'Ghim ưu tiên đầu danh mục', '10000.00', 3, 1, '2026-11-17 14:34:42'),
(3, 'BOOST_7_DAYS', 'Gói Đẩy Tin Nổi Bật 7 Ngày', 'Ghim trang chủ STU Market 7 ngày', '15000.00', 7, 1, '2026-11-17 14:34:42');

DROP TABLE IF EXISTS `invoices`;
CREATE TABLE `invoices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `invoice_code` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'E.g., INV-20261114-9912',
  `user_id` bigint unsigned NOT NULL COMMENT 'Logical reference to Identity Service (seller paying fee)',
  `listing_id` bigint unsigned NOT NULL COMMENT 'Logical reference to Listing Service (item receiving boost)',
  `package_id` int unsigned NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('PENDING','PAID','EXPIRED','FAILED','REFUNDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `paid_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_code` (`invoice_code`),
  KEY `fk_invoices_package` (`package_id`),
  KEY `idx_invoices_user` (`user_id`),
  KEY `idx_invoices_listing` (`listing_id`),
  KEY `idx_invoices_status` (`status`),
  CONSTRAINT `fk_invoices_package` FOREIGN KEY (`package_id`) REFERENCES `fee_packages` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `invoices` (`id`, `invoice_code`, `user_id`, `listing_id`, `package_id`, `amount`, `status`, `created_at`, `paid_at`) VALUES
(1, 'INV-825327', 3, 1, 1, '15000.00', 'PAID', '2026-11-17 15:37:05', '2026-11-17 15:37:05'),
(2, 'INV-914205', 4, 2, 2, '10000.00', 'PAID', '2026-11-16 03:54:46', '2026-11-16 03:54:46'),
(3, 'INV-439281', 3, 3, 3, '15000.00', 'PAID', '2026-11-17 03:54:46', '2026-11-17 03:54:46'),
(4, 'INV-192847', 4, 4, 2, '10000.00', 'PAID', '2026-11-17 15:54:46', '2026-11-17 15:54:46'),
(5, 'INV-556712', 3, 1, 3, '15000.00', 'PAID', '2026-11-18 01:54:46', '2026-11-18 01:54:46'),
(6, 'INV-773129', 4, 2, 2, '10000.00', 'PENDING', '2026-11-18 03:54:46', NULL),
(7, 'INV-274478', 3, 1, 1, '15000.00', 'PAID', '2026-11-22 17:41:14', '2026-11-22 17:41:14');

DROP TABLE IF EXISTS `payment_transactions`;
CREATE TABLE `payment_transactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `invoice_id` bigint unsigned NOT NULL,
  `gateway_provider` enum('VNPAY','MOMO','BANK_TRANSFER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `gateway_txn_ref` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gateway_response_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('SUCCESS','FAILED','PENDING') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `callback_payload` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `gateway_txn_ref` (`gateway_txn_ref`),
  KEY `idx_payments_invoice` (`invoice_id`),
  KEY `idx_payments_status` (`status`),
  CONSTRAINT `fk_payments_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
