CREATE DATABASE IF NOT EXISTS `stu_identity_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `stu_identity_db`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `actor_id` int NOT NULL,
  `actor_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '127.0.0.1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_name`, `actor_role`, `action`, `target_type`, `target_id`, `details`, `ip_address`, `created_at`) VALUES
(1, 1, 'Quản Trị Viên STU', 'ADMIN', 'SYSTEM_INIT', 'SYSTEM', 'GATEWAY', 'Khởi tạo hệ thống Microservices & API Gateway trên cổng 8080', '127.0.0.1', '2026-11-15 03:54:46'),
(2, 2, 'Kiểm Duyệt Viên STU', 'MODERATOR', 'VERIFY_STUDENT', 'USER_VERIFICATION', '3', 'Phê duyệt thẻ sinh viên MSSV DH52201642 (Hà Thiên Phúc - Khoa CNTT)', '192.168.1.15', '2026-11-16 03:54:46'),
(3, 2, 'Kiểm Duyệt Viên STU', 'MODERATOR', 'APPROVE_LISTING', 'LISTING', '1', 'Duyệt bài đăng: Giáo trình Lập trình Web & Ứng dụng STU', '192.168.1.15', '2026-11-16 03:54:46'),
(4, 1, 'Quản Trị Viên STU', 'ADMIN', 'UPDATE_PACKAGE', 'BILLING', 'BOOST_7_DAYS', 'Cập nhật giá niêm yết gói Đẩy tin nổi bật 7 ngày thành 15.000 VNĐ', '127.0.0.1', '2026-11-17 03:54:46'),
(5, 2, 'Kiểm Duyệt Viên STU', 'MODERATOR', 'VERIFY_STUDENT', 'USER_VERIFICATION', '4', 'Phê duyệt thẻ sinh viên MSSV DH52200413 (Dương Hoài Phong - Khoa Điện tử)', '192.168.1.20', '2026-11-17 09:54:46'),
(6, 1, 'Quản Trị Viên STU', 'ADMIN', 'LOCK_USER', 'USER', '5', 'Khóa tài khoản sinh viên vi phạm quy chế bán đồ cấm trong trường STU', '127.0.0.1', '2026-11-17 23:54:46'),
(7, 1, 'Quản Trị Viên STU', 'ADMIN', 'ADD_CATEGORY', 'CATEGORY', '7', 'Bổ sung danh mục: Phương tiện đi lại (Xe máy/Xe đạp SV)', '127.0.0.1', '2026-11-18 01:54:46'),
(8, 3, 'Hà Thiên Phúc (Người mua STU)', 'STUDENT', 'ABNORMAL_PRICE_ALERT', 'LISTING', '46', 'Cảnh báo tin đăng có mức giá bất thường (12.500.000 đ): "Laptop Gaming ASUS ROG Strix G15 SV STU" - cần Admin kiểm duyệt kỹ.', '127.0.0.1', '2026-11-22 07:50:58'),
(9, 1, 'Quản Trị Viên STU', 'ADMIN', 'APPROVE_LISTING', 'LISTING', '46', 'Quản Trị Viên STU (ADMIN): Phê duyệt hiển thị tin đăng #46: "Laptop Gaming ASUS ROG Strix G15 SV STU" (12.500.000 đ)', '127.0.0.1', '2026-11-22 07:53:43'),
(10, 1, 'Quản Trị Viên STU', 'ADMIN', 'APPROVE_LISTING', 'LISTING', '13', 'Quản Trị Viên STU (ADMIN): Phê duyệt hiển thị tin đăng #13: "Đồ án chuyên ngành" (60.000 đ)', '127.0.0.1', '2026-11-22 07:56:09'),
(11, 1, 'Quản Trị Viên STU', 'ADMIN', 'APPROVE_LISTING', 'LISTING', '12', 'Quản Trị Viên STU (ADMIN): Phê duyệt hiển thị tin đăng #12: "Đồ án chuyên ngành" (60.000 đ)', '127.0.0.1', '2026-11-22 07:56:12'),
(12, 1, 'Quản Trị Viên STU', 'ADMIN', 'REJECT_LISTING', 'LISTING', '46', 'Quản Trị Viên STU (ADMIN): Từ chối tin đăng #46: "Laptop Gaming ASUS ROG Strix G15 SV STU" - Lý do: Sản phẩm thuộc danh mục hàng cấm / không phù hợp quy chế trường STU', '127.0.0.1', '2026-11-22 07:56:19');

DROP TABLE IF EXISTS `refresh_tokens`;
CREATE TABLE `refresh_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `token_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `revoked` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `fk_refresh_token_user` (`user_id`),
  KEY `idx_token_expires` (`expires_at`,`revoked`),
  CONSTRAINT `fk_refresh_token_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user_verifications`;
CREATE TABLE `user_verifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `student_card_image_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `rejection_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified_by` bigint unsigned DEFAULT NULL COMMENT 'Scalar reference to admin user id',
  `verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_verification_user` (`user_id`),
  KEY `idx_verification_status` (`status`),
  CONSTRAINT `fk_verification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `user_verifications` (`id`, `user_id`, `student_card_image_url`, `status`, `rejection_reason`, `verified_by`, `verified_at`, `created_at`) VALUES
(1, 3, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300', 'APPROVED', NULL, NULL, NULL, '2026-11-22 06:48:28'),
(2, 4, 'https://images.unsplash.com/photo-1517055729441-db3aab13588f?w=300', 'APPROVED', NULL, NULL, NULL, '2026-11-22 06:48:28');

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'STU Student code, e.g., DH52001234',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('STUDENT','MODERATOR','ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'STUDENT',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `student_id` (`student_id`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `student_id`, `email`, `password_hash`, `full_name`, `phone_number`, `avatar_url`, `role`, `status`, `created_at`, `updated_at`) VALUES
(1, 'DH52100123', 'admin@stu.edu.vn', '$2a$10$2ozmo3E8Sm80B1sACKu6Fe799.yNptWPwfipu5CcDwh.ql.R7j69O', 'Quản Trị Viên STU', '0901234567', NULL, 'ADMIN', 'ACTIVE', '2026-11-17 14:47:22', '2026-11-24 16:41:39'),
(2, 'DH52100456', 'moderator@stu.edu.vn', '$2a$10$2ozmo3E8Sm80B1sACKu6Fe799.yNptWPwfipu5CcDwh.ql.R7j69O', 'Kiểm Duyệt Viên STU', '0902345678', NULL, 'MODERATOR', 'ACTIVE', '2026-11-17 14:47:22', '2026-11-24 16:41:39'),
(3, 'DH52201642', 'dh52201642@student.stu.edu.vn', '$2a$10$wGS2CwIt9bgFXeaLqBg4MuSPy.9U5cfOsDiQbM91f58PocOheA1Qe', 'Hà Thiên Phúc (Người mua STU)', '0903456789', NULL, 'STUDENT', 'ACTIVE', '2026-11-17 14:47:22', '2026-11-24 16:41:39'),
(4, 'DH52200413', 'dh52200413@student.stu.edu.vn', '$2a$10$wGS2CwIt9bgFXeaLqBg4MuSPy.9U5cfOsDiQbM91f58PocOheA1Qe', 'Dương Hoài Phong (Người bán STU)', '0904567890', NULL, 'STUDENT', 'ACTIVE', '2026-11-17 14:47:22', '2026-11-24 16:41:39'),
(5, 'DH52209999', 'dh52209999@student.stu.edu.vn', '$2a$10$zygQrV3lZbobh2XrT7n8Zu/vTVGehtot7D4czfaHZsX5fanD.drRi', 'Trần Minh Quân', '0909888777', NULL, 'STUDENT', 'ACTIVE', '2026-11-18 03:14:48', '2026-11-18 03:34:07'),
(6, 'DH52208888', 'dh52208888@student.stu.edu.vn', '$2a$10$2p22iXkX.FyNGaphAHhkquJK3hHqE3JbNE8Ylwls8w46WI9jJBj92', 'Lê Hoàng Nam', '0908112233', NULL, 'STUDENT', 'LOCKED', '2026-11-18 03:18:39', '2026-11-18 03:37:44'),
(7, 'DH52201228', 'dh52201229@gmail.com', '$2a$10$DFNwcrkSxt8Y05.IHnqlTuoNAo8725cYwfCyUMwfGkgJ.D3tiqZju', 'Nguyễn Trung Hậu', '0123456789', NULL, 'STUDENT', 'ACTIVE', '2026-11-18 04:03:10', '2026-11-23 13:43:49'),
(8, 'DH52793040', 'dh52793040@student.stu.edu.vn', '$2a$10$vdY7Cpf13tqp8WRBSiba1.8THI7TFMV2wo3prJne3YG3OlRxvgFgu', 'Sinh Viên STU Mới', '0909888999', NULL, 'STUDENT', 'ACTIVE', '2026-11-22 08:02:34', '2026-11-22 08:02:34');

SET FOREIGN_KEY_CHECKS = 1;
