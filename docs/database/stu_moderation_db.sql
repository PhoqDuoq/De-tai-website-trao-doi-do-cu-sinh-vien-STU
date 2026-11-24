CREATE DATABASE IF NOT EXISTS `stu_moderation_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `stu_moderation_db`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `forbidden_keywords`;
CREATE TABLE `forbidden_keywords` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `keyword` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PROHIBITED_ITEM',
  `severity` enum('AUTO_REJECT','FLAG_FOR_REVIEW') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FLAG_FOR_REVIEW',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `keyword` (`keyword`),
  KEY `idx_keywords_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `forbidden_keywords` (`id`, `keyword`, `category`, `severity`, `is_active`, `created_at`) VALUES
(1, 'vũ khí', 'WEAPON', 'AUTO_REJECT', 1, '2026-11-17 14:34:42'),
(2, 'chất cấm', 'ILLEGAL_SUBSTANCE', 'AUTO_REJECT', 1, '2026-11-17 14:34:42'),
(3, 'thi hộ', 'ACADEMIC_DISHONESTY', 'AUTO_REJECT', 1, '2026-11-17 14:34:42'),
(4, 'lừa đảo', 'FRAUD', 'FLAG_FOR_REVIEW', 1, '2026-11-17 14:34:42');

DROP TABLE IF EXISTS `moderation_audit_logs`;
CREATE TABLE `moderation_audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `moderator_id` bigint unsigned NOT NULL COMMENT 'Logical reference to Identity Service',
  `action_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` bigint unsigned NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_moderator` (`moderator_id`),
  KEY `idx_audit_target` (`target_type`,`target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `penalties`;
CREATE TABLE `penalties` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL COMMENT 'Logical reference to Identity Service',
  `report_id` bigint unsigned DEFAULT NULL COMMENT 'Optional logical reference to reports.id',
  `penalty_type` enum('WARNING','TEMPORARY_BAN','PERMANENT_BAN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration_days` int DEFAULT NULL COMMENT 'Duration in days for TEMPORARY_BAN, null otherwise',
  `issued_by` bigint unsigned NOT NULL COMMENT 'Logical reference to Identity Service (moderator)',
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_penalties_user` (`user_id`),
  KEY `idx_penalties_type` (`penalty_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `reports`;
CREATE TABLE `reports` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reporter_id` bigint unsigned NOT NULL COMMENT 'Logical reference to Identity Service',
  `target_type` enum('LISTING','USER','COMMENT','MESSAGE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` bigint unsigned NOT NULL COMMENT 'Polymorphic logical ID',
  `reason` enum('SPAM','PROHIBITED_GOODS','FRAUD_SCAM','OFFENSIVE_CONTENT','INAPPROPRIATE_BEHAVIOR','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `evidence_image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','INVESTIGATING','RESOLVED','DISMISSED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `assigned_moderator_id` bigint unsigned DEFAULT NULL COMMENT 'Logical reference to Identity Service',
  `resolution_action` enum('NO_ACTION','WARNING_SENT','CONTENT_REMOVED','USER_TEMPORARILY_BANNED','USER_PERMANENTLY_BANNED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resolution_notes` text COLLATE utf8mb4_unicode_ci,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reports_status` (`status`),
  KEY `idx_reports_target` (`target_type`,`target_id`),
  KEY `idx_reports_reporter` (`reporter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
