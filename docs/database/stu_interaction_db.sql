CREATE DATABASE IF NOT EXISTS `stu_interaction_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `stu_interaction_db`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `listing_id` bigint unsigned NOT NULL COMMENT 'Logical reference to Listing Service',
  `user_id` bigint unsigned NOT NULL COMMENT 'Logical reference to Identity Service',
  `parent_id` bigint unsigned DEFAULT NULL COMMENT 'Self-reference for nested discussion replies',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_comments_parent` (`parent_id`),
  KEY `idx_comments_listing` (`listing_id`),
  CONSTRAINT `fk_comments_parent` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `conversations`;
CREATE TABLE `conversations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `listing_id` bigint unsigned NOT NULL COMMENT 'Logical reference to Listing Service',
  `buyer_id` bigint unsigned NOT NULL COMMENT 'Logical reference to Identity Service',
  `seller_id` bigint unsigned NOT NULL COMMENT 'Logical reference to Identity Service',
  `last_message_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conversation_participants` (`listing_id`,`buyer_id`,`seller_id`),
  KEY `idx_conversation_buyer` (`buyer_id`),
  KEY `idx_conversation_seller` (`seller_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `conversations` (`id`, `listing_id`, `buyer_id`, `seller_id`, `last_message_at`, `created_at`) VALUES
(1, 1, 1, 3, '2026-11-23 13:49:15', '2026-11-22 08:07:36'),
(3, 44, 1, 4, '2026-11-22 17:38:13', '2026-11-22 17:38:13'),
(5, 36, 1, 4, '2026-11-22 17:38:36', '2026-11-22 17:38:36');

DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL COMMENT 'Logical reference to Identity Service',
  `listing_id` bigint unsigned NOT NULL COMMENT 'Logical reference to Listing Service',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_listing` (`user_id`,`listing_id`),
  KEY `idx_favorites_listing` (`listing_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `favorites` (`id`, `user_id`, `listing_id`, `created_at`) VALUES
(1, 1, 43, '2026-11-18 03:27:53');

DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint unsigned NOT NULL,
  `sender_id` bigint unsigned NOT NULL COMMENT 'Logical reference to Identity Service',
  `message_type` enum('TEXT','IMAGE','LOCATION') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TEXT',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_messages_conversation_date` (`conversation_id`,`created_at`),
  CONSTRAINT `fk_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `messages` (`id`, `conversation_id`, `sender_id`, `message_type`, `content`, `is_read`, `created_at`) VALUES
(1, 1, 3, 'TEXT', 'Hello', 0, '2026-11-23 13:49:15');

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'SYSTEM',
  `reference_id` int DEFAULT NULL,
  `link_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `notifications` (`id`, `user_id`, `title`, `content`, `type`, `reference_id`, `link_url`, `is_read`, `created_at`) VALUES
(1, 3, 'Đề nghị hẹn gặp giao dịch mới', 'Lê Thảo Vy (DH52201456) đã gửi đề nghị hẹn gặp giao dịch cho món đồ "Laptop Dell Latitude E5470" tại Sảnh A lúc 14:30.', 'TRANSACTION', NULL, '/transactions', 1, '2026-11-17 15:59:21'),
(2, 3, 'Xác thực thẻ sinh viên STU thành công', 'Hồ sơ xác minh thẻ SV MSSV DH52201642 của bạn đã được Ban Cố Vấn trường STU phê duyệt chính thức.', 'VERIFICATION', NULL, '/profile', 1, '2026-11-17 14:59:21'),
(3, 3, 'Tin nhắn trao đổi mới từ bạn học', 'Trần Hoài Phong (DH52100889) đã gửi tin nhắn: "Còn đầy đủ mic rời với hộp luôn bạn ơi, mai 9h sáng mình có tiết ở khu C STU nè."', 'MESSAGE', NULL, '/messages', 1, '2026-11-17 12:59:21'),
(4, 3, 'Kích hoạt gói Tin đăng nổi bật STU', 'Gói đẩy bài Trang chủ STU của bạn đã được kích hoạt thành công (thời hạn 7 ngày).', 'SYSTEM', NULL, '/my-listings', 1, '2026-11-16 15:59:21'),
(5, 3, 'Nhắc nhở an toàn từ Ban Cố vấn STU', 'Để tránh rủi ro, sinh viên STU vui lòng chỉ hẹn gặp và kiểm tra đồ dùng trực tiếp trong khuôn viên trường (180 Cao Lỗ).', 'SYSTEM', NULL, '/transactions', 1, '2026-11-15 15:59:21'),
(6, 5, 'Chào mừng gia nhập STU Marketplace!', 'Tài khoản sinh viên STU của bạn đã được khởi tạo thành công. Vui lòng xác minh thẻ sinh viên để bắt đầu trao đổi an toàn.', 'SYSTEM', NULL, '/verify-student', 0, '2026-11-18 03:14:48'),
(7, 6, 'Chào mừng gia nhập STU Marketplace!', 'Tài khoản sinh viên STU của bạn đã được khởi tạo thành công. Vui lòng xác minh thẻ sinh viên để bắt đầu trao đổi an toàn.', 'SYSTEM', NULL, '/verify-student', 0, '2026-11-18 03:18:39'),
(8, 5, 'Tài khoản của bạn đã bị KHÓA', 'Quản trị viên đã khóa tài khoản của bạn do vi phạm quy chế STU. Toàn bộ tin đăng đã bị ẩn và quyền giao dịch bị đình chỉ.', 'SYSTEM', NULL, '/profile', 0, '2026-11-18 03:30:01'),
(9, 5, 'Tài khoản đã được MỞ KHÓA', 'Quản trị viên đã kích hoạt lại tài khoản của bạn. Bạn có thể tiếp tục sử dụng đầy đủ chức năng của Sàn.', 'SYSTEM', NULL, '/', 0, '2026-11-18 03:30:02'),
(10, 5, 'Tài khoản của bạn đã bị KHÓA', 'Quản trị viên đã khóa tài khoản của bạn do vi phạm quy chế STU. Toàn bộ tin đăng đã bị ẩn và quyền giao dịch bị đình chỉ.', 'SYSTEM', NULL, '/profile', 0, '2026-11-18 03:33:42'),
(11, 5, 'Tài khoản đã được MỞ KHÓA', 'Quản trị viên đã kích hoạt lại tài khoản của bạn. Bạn có thể tiếp tục sử dụng đầy đủ chức năng của Sàn.', 'SYSTEM', NULL, '/', 0, '2026-11-18 03:33:42'),
(12, 5, 'Tài khoản của bạn đã bị KHÓA', 'Quản trị viên đã khóa tài khoản của bạn do vi phạm quy chế STU. Toàn bộ tin đăng đã bị ẩn và quyền giao dịch bị đình chỉ.', 'SYSTEM', NULL, '/profile', 0, '2026-11-18 03:34:07'),
(13, 5, 'Tài khoản đã được MỞ KHÓA', 'Quản trị viên đã kích hoạt lại tài khoản của bạn. Bạn có thể tiếp tục sử dụng đầy đủ chức năng của Sàn.', 'SYSTEM', NULL, '/', 0, '2026-11-18 03:34:07'),
(14, 6, 'Tài khoản của bạn đã bị KHÓA', 'Quản trị viên đã khóa tài khoản của bạn do vi phạm quy chế STU. Toàn bộ tin đăng đã bị ẩn và quyền giao dịch bị đình chỉ.', 'SYSTEM', NULL, '/profile', 0, '2026-11-18 03:37:44'),
(15, 7, 'Chào mừng gia nhập STU Marketplace!', 'Tài khoản sinh viên STU của bạn đã được khởi tạo thành công. Vui lòng xác minh thẻ sinh viên để bắt đầu trao đổi an toàn.', 'SYSTEM', NULL, '/verify-student', 0, '2026-11-18 04:03:10'),
(16, 1, '⚠️ Cảnh báo tin giá cao bất thường cần duyệt', 'Sinh viên Hà Thiên Phúc (Người mua STU) vừa đăng tin #46 "Laptop Gaming ASUS ROG Strix G15 SV STU" (12.500.000 đ) đang chờ kiểm duyệt.', 'SYSTEM', NULL, NULL, 1, '2026-11-22 07:50:58'),
(17, 3, 'Tin đăng của bạn đã được duyệt!', 'Tin đăng "Laptop Gaming ASUS ROG Strix G15 SV STU" đã được Quản trị viên duyệt và đang hiển thị công khai trên sàn STU.', 'SYSTEM', NULL, NULL, 0, '2026-11-22 07:53:43'),
(18, 4, 'Tin đăng của bạn đã được duyệt!', 'Tin đăng "Đồ án chuyên ngành" đã được Quản trị viên duyệt và đang hiển thị công khai trên sàn STU.', 'SYSTEM', NULL, NULL, 0, '2026-11-22 07:56:09'),
(19, 4, 'Tin đăng của bạn đã được duyệt!', 'Tin đăng "Đồ án chuyên ngành" đã được Quản trị viên duyệt và đang hiển thị công khai trên sàn STU.', 'SYSTEM', NULL, NULL, 0, '2026-11-22 07:56:12'),
(20, 3, 'Tin đăng bị từ chối kiểm duyệt', 'Tin đăng "Laptop Gaming ASUS ROG Strix G15 SV STU" đã bị từ chối kiểm duyệt. Lý do: Sản phẩm thuộc danh mục hàng cấm / không phù hợp quy chế trường STU', 'WARNING', NULL, NULL, 0, '2026-11-22 07:56:19'),
(21, 8, 'Chào mừng gia nhập STU Marketplace!', 'Tài khoản sinh viên STU của bạn đã được khởi tạo thành công. Vui lòng xác minh thẻ sinh viên để bắt đầu trao đổi an toàn.', 'SYSTEM', NULL, '/verify-student', 0, '2026-11-22 08:02:34'),
(22, 1, 'Tin nhắn trao đổi mới từ bạn học', 'Hà Thiên Phúc (Người mua STU) đã gửi tin nhắn: "Hello"', 'MESSAGE', NULL, '/messages', 0, '2026-11-23 13:49:15');

DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reviewer_id` bigint unsigned NOT NULL COMMENT 'Logical reference to Identity Service',
  `reviewee_id` bigint unsigned NOT NULL COMMENT 'Logical reference to Identity Service',
  `transaction_id` bigint unsigned NOT NULL COMMENT 'Logical reference to Transaction Service',
  `rating` int NOT NULL COMMENT 'Rating scale 1 to 5 stars',
  `comment` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_reviewer_transaction` (`reviewer_id`,`transaction_id`),
  KEY `idx_reviews_reviewee` (`reviewee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `reviews` (`id`, `reviewer_id`, `reviewee_id`, `transaction_id`, `rating`, `comment`, `created_at`) VALUES
(1, 3, 4, 3, 5, 'Giao dịch nhanh chóng, đồ dùng đúng mô tả và đối tác rất thân thiện!', '2026-11-17 16:18:45');

SET FOREIGN_KEY_CHECKS = 1;
