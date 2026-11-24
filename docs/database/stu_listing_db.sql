CREATE DATABASE IF NOT EXISTS `stu_listing_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `stu_listing_db`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` int unsigned DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `fk_category_parent` (`parent_id`),
  KEY `idx_category_active` (`is_active`,`sort_order`),
  CONSTRAINT `fk_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `categories` (`id`, `parent_id`, `name`, `slug`, `icon_url`, `sort_order`, `is_active`, `created_at`) VALUES
(1, NULL, 'Sách & Giáo trình STU', 'sach-giao-trinh-stu', NULL, 1, 1, '2026-11-17 14:34:42'),
(2, NULL, 'Điện tử & Phụ kiện máy tính', 'dien-tu-may-tinh', NULL, 2, 1, '2026-11-17 14:34:42'),
(3, NULL, 'Dụng cụ vẽ & Mô hình đồ án', 'dung-cu-ve-mo-hinh', NULL, 3, 1, '2026-11-17 14:34:42'),
(4, NULL, 'Kit thực hành & Arduino/ESP32', 'kit-thuc-hanh-arduino', NULL, 4, 1, '2026-11-17 14:34:42'),
(5, NULL, 'Đồ dùng học tập & Máy tính Casio', 'do-dung-hoc-tap', NULL, 5, 1, '2026-11-17 14:34:42'),
(6, NULL, 'Đồ gia dụng phòng trọ', 'do-gia-dung-tro', NULL, 6, 1, '2026-11-17 14:34:42'),
(7, NULL, 'Phương tiện đi lại (Xe máy/Xe đạp)', 'phuong-tien-di-lai', NULL, 7, 1, '2026-11-17 14:34:42');

DROP TABLE IF EXISTS `listing_images`;
CREATE TABLE `listing_images` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `listing_id` bigint unsigned NOT NULL,
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_images_listing_order` (`listing_id`,`display_order`),
  CONSTRAINT `fk_images_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=102 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `listing_images` (`id`, `listing_id`, `image_url`, `display_order`, `is_primary`, `created_at`) VALUES
(1, 1, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', 0, 1, '2026-11-17 14:47:22'),
(2, 2, 'https://images.unsplash.com/photo-1517055729441-db3aab13588f?w=600&auto=format&fit=crop&q=80', 0, 1, '2026-11-17 14:47:22'),
(3, 3, 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80', 0, 1, '2026-11-17 14:47:22'),
(4, 4, 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=80', 0, 1, '2026-11-17 14:47:22'),
(5, 5, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', 0, 1, '2026-11-17 14:49:04'),
(6, 6, 'uploads/listings/1794927230770_Sơ đồ ERD.drawio.png', 0, 1, '2026-11-17 14:53:50'),
(34, 34, 'blob:http://localhost:5173/b7d9c918-81b0-44a0-a308-2343859195fd', 0, 1, '2026-11-17 15:00:17'),
(35, 34, 'blob:http://localhost:5173/f34c015b-4c2c-45fe-a1f9-acd86f66d679', 1, 0, '2026-11-17 15:00:17'),
(36, 34, 'blob:http://localhost:5173/686729b9-f60f-4276-9e66-1dd14bfb2cf6', 2, 0, '2026-11-17 15:00:17'),
(37, 34, 'blob:http://localhost:5173/15cb44a0-72d3-41e5-9106-3eba56e4ce36', 3, 0, '2026-11-17 15:00:17'),
(38, 34, 'blob:http://localhost:5173/bd327993-2adf-459c-92f4-ab3041461c06', 4, 0, '2026-11-17 15:00:17'),
(79, 43, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', 0, 1, '2026-11-17 15:15:06'),
(80, 44, 'blob:http://localhost:5173/6484c714-263a-4fb4-a937-1d83a8af09d0', 0, 1, '2026-11-17 15:16:24'),
(81, 44, 'blob:http://localhost:5173/cd8577fd-dada-4c3d-9e23-6076cba527ef', 1, 0, '2026-11-17 15:16:24'),
(82, 44, 'blob:http://localhost:5173/0448b149-82b5-4862-bff2-1cd2d17935a1', 2, 0, '2026-11-17 15:16:24'),
(83, 44, 'blob:http://localhost:5173/58cbedec-f10c-4480-83d9-d6d8d3f47662', 3, 0, '2026-11-17 15:16:24'),
(84, 44, 'blob:http://localhost:5173/b8e5b435-e822-4afc-af0e-a5fac4c61de2', 4, 0, '2026-11-17 15:16:24'),
(85, 45, 'blob:http://localhost:5173/133b2d38-4705-4bbc-be00-207077275014', 0, 1, '2026-11-18 03:22:50'),
(86, 45, 'blob:http://localhost:5173/10af4221-45c4-4db0-863c-9f1cd9741d27', 1, 0, '2026-11-18 03:22:50'),
(87, 45, 'blob:http://localhost:5173/d5844536-9b01-4719-99ec-3cdadc566a2c', 2, 0, '2026-11-18 03:22:50'),
(88, 45, 'blob:http://localhost:5173/c2169fae-55ad-468c-ba52-1972587c37db', 3, 0, '2026-11-18 03:22:50'),
(89, 45, 'blob:http://localhost:5173/5d4a0505-5a82-4b1e-bb0d-0495191fbffd', 4, 0, '2026-11-18 03:22:50'),
(90, 46, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600', 0, 1, '2026-11-22 07:50:58'),
(91, 47, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', 0, 1, '2026-11-23 13:44:15'),
(92, 48, 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&auto=format&fit=crop&q=80', 0, 1, '2026-11-23 13:44:15'),
(93, 49, 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80', 0, 1, '2026-11-23 13:44:15'),
(94, 50, 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80', 0, 1, '2026-11-23 13:44:15'),
(96, 52, 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80', 0, 1, '2026-11-24 17:37:06'),
(97, 53, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80', 0, 1, '2026-11-24 17:37:06'),
(98, 54, 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80', 0, 1, '2026-11-24 17:37:06'),
(99, 55, 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=80', 0, 1, '2026-11-24 17:37:06'),
(100, 56, 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80', 0, 1, '2026-11-24 17:37:06'),
(101, 57, 'https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?w=600&auto=format&fit=crop&q=80', 0, 1, '2026-11-24 17:37:06');

DROP TABLE IF EXISTS `listings`;
CREATE TABLE `listings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `seller_id` bigint unsigned NOT NULL COMMENT 'Logical reference to Identity Service (stu_identity_db.users.id)',
  `category_id` int unsigned NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT '0 for giveaway or barter exchange',
  `item_condition` enum('BRAND_NEW','LIKE_NEW','USED_GOOD','USED_FAIR') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('DRAFT','PENDING_APPROVAL','ACTIVE','RESERVED','TRADING','SOLD','EXCHANGED','REJECTED','HIDDEN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING_APPROVAL',
  `is_boosted` tinyint(1) NOT NULL DEFAULT '0',
  `boosted_until` timestamp NULL DEFAULT NULL,
  `view_count` int unsigned NOT NULL DEFAULT '0',
  `location_notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'E.g., STU Campus Building A, Canteen',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_listing_seller` (`seller_id`),
  KEY `idx_listing_category_status` (`category_id`,`status`),
  KEY `idx_listing_boosted` (`is_boosted`,`boosted_until`),
  FULLTEXT KEY `idx_listing_fts` (`title`,`description`),
  CONSTRAINT `fk_listing_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `listings` (`id`, `seller_id`, `category_id`, `title`, `description`, `price`, `item_condition`, `status`, `is_boosted`, `boosted_until`, `view_count`, `location_notes`, `created_at`, `updated_at`) VALUES
(1, 3, 1, 'Giáo trình Lập trình Web & Ứng dụng STU', 'Sách photo đẹp bìa kiếng, kèm tài liệu ôn thi cuối kỳ bộ môn CNTT.', '35000.00', 'LIKE_NEW', 'ACTIVE', 1, NULL, 0, 'Sảnh A - Tòa nhà Trung tâm STU', '2026-11-17 14:47:22', '2026-11-17 15:37:05'),
(2, 4, 4, 'Kit thực hành Arduino Uno R3 + Cảm biến IoT', 'Kit thí nghiệm vi điều khiển dùng cho môn Kỹ thuật số, đủ dây cắm và board test.', '120000.00', 'LIKE_NEW', 'ACTIVE', 0, NULL, 0, 'Xưởng thực hành Điện - Điện tử STU', '2026-11-17 14:47:22', '2026-11-17 14:47:22'),
(3, 3, 5, 'Máy tính khoa học Casio fx-580VN X', 'Chính hãng Bitex, còn nguyên tem bảo hành, dùng tốt cho các môn Toán cao cấp & Vật lý.', '350000.00', 'BRAND_NEW', 'ACTIVE', 0, NULL, 0, 'Căn tin trường STU (Khu B)', '2026-11-17 14:47:22', '2026-11-17 14:47:22'),
(4, 4, 3, 'Thước chữ T và bảng vẽ A3 ngành Xây dựng / Kiến trúc', 'Dành cho các bạn K22, K23 học môn Vẽ kỹ thuật, tặng kèm bộ chì 2B-6B.', '80000.00', 'USED_GOOD', 'ACTIVE', 0, NULL, 0, 'Thư viện tầng 3 - Tòa nhà A', '2026-11-17 14:47:22', '2026-11-17 14:47:22'),
(5, 3, 1, 'Sách Giáo trình Lập trình Web STU (Mới 99%)', 'S�ch b�i t?p v� l� thuy?t m?i 99%, c� s?n ghi ch� d? cuong �n t?p cu?i k? c?a th?y b? m�n CNTT STU.', '40000.00', 'LIKE_NEW', 'ACTIVE', 0, NULL, 0, 'Khuôn viên trường Đại học Công Nghệ Sài Gòn (STU)', '2026-11-17 14:49:04', '2026-11-24 17:34:17'),
(6, 4, 3, 'Đồ án chuyên ngành', 'Hình ảnh chất lượng\n\n[Địa điểm hẹn gặp tại STU: Căn tin trường STU (Khu B)]', '60000.00', 'BRAND_NEW', 'ACTIVE', 0, NULL, 0, 'Khuôn viên trường Đại học Công Nghệ Sài Gòn (STU)', '2026-11-17 14:53:50', '2026-11-17 14:53:50'),
(34, 4, 1, 'Lập Trình Ứng Dụng Cơ Sở Dữ Liệu', 'Luận văn tốt nghiệp 2027\n\n[Địa điểm hẹn gặp tại STU: Sân bóng rổ / Sân thể thao STU]', '100000.00', 'USED_GOOD', 'ACTIVE', 0, NULL, 0, 'Khuôn viên trường Đại học Công Nghệ Sài Gòn (STU)', '2026-11-17 15:00:17', '2026-11-17 15:00:17'),
(43, 3, 1, 'Sách Lập trình Hướng đối tượng Java STU', 'S�ch c�n m?i 95%, d?y d? b�i t?p th?c h�nh ph�ng m�y STU', '30000.00', 'LIKE_NEW', 'ACTIVE', 0, NULL, 0, 'Khuôn viên trường Đại học Công Nghệ Sài Gòn (STU)', '2026-11-17 15:15:06', '2026-11-24 17:34:17'),
(44, 4, 1, 'Lập Trình Window', 'Luận Văn Tốt Nghiệp 2027\n\n[Địa điểm hẹn gặp tại STU: Sảnh A - Tòa nhà Trung tâm STU]', '100000.00', 'BRAND_NEW', 'ACTIVE', 0, NULL, 0, 'Khuôn viên trường Đại học Công Nghệ Sài Gòn (STU)', '2026-11-17 15:16:24', '2026-11-17 15:16:24'),
(45, 6, 1, 'Giáo Trình Toán A1', 'Sản phẩm rất chất lượng\n\n[Địa điểm hẹn gặp tại STU: Sảnh A - Tòa nhà Trung tâm STU]', '50000.00', 'LIKE_NEW', 'HIDDEN', 0, NULL, 0, 'Khuôn viên trường Đại học Công Nghệ Sài Gòn (STU)', '2026-11-18 03:22:50', '2026-11-18 03:37:44'),
(46, 3, 2, 'Laptop Gaming ASUS ROG Strix G15 SV STU', 'Máy dùng làm đồ án tốt nghiệp CNTT STU, hoạt động ổn định.', '12500000.00', 'LIKE_NEW', 'REJECTED', 0, NULL, 0, 'Khuôn viên trường Đại học Công Nghệ Sài Gòn (STU)', '2026-11-22 07:50:58', '2026-11-22 07:56:19'),
(47, 7, 1, 'Giáo trình Cấu trúc dữ liệu & Giải thuật STU (bản in rõ nét)', 'Sách giáo trình môn Cấu trúc dữ liệu khoa CNTT STU, có highlight các phần quan trọng cho kỳ thi, còn rất mới.', '45000.00', 'LIKE_NEW', 'ACTIVE', 0, NULL, 15, 'Thư viện STU - Tầng 2 Tòa A • Giờ ra chơi giữa ca (09h15 hoặc 14h45)', '2026-11-23 13:44:15', '2026-11-23 13:44:15'),
(48, 7, 3, 'Bộ thước chữ T và compa chuyên dụng Khoa Xây dựng / Kiến trúc', 'Thước dài 80cm làm đồ án môn vẽ kỹ thuật xây dựng, compa inox chuẩn kỹ thuật, ít dùng.', '80000.00', '', 'PENDING_APPROVAL', 0, NULL, 15, 'Sảnh A - Tòa nhà Trung tâm STU • Buổi chiều 13h00 - 17h00', '2026-11-23 13:44:15', '2026-11-23 13:44:15'),
(49, 7, 5, 'Máy tính khoa học Casio fx-580VN X (Chính hãng Bitex)', 'Máy tính Casio fx-580VN X dùng thi trắc nghiệm Toán và Lý, còn nguyên tem chống giả Bitex, phím bấm nhạy.', '350000.00', 'LIKE_NEW', 'TRADING', 0, NULL, 15, 'Căn tin STU - Khu B • Sau giờ học từ 17h00', '2026-11-23 13:44:15', '2026-11-24 17:34:18'),
(50, 7, 2, 'Chuột không dây Logitech M331 Silent cho Laptop', 'Chuột click êm không ồn trong thư viện và phòng học, dùng pin AA tiết kiệm, đã trao đổi thành công.', '120000.00', '', 'SOLD', 0, NULL, 15, 'Bàn ghế đá Sân trường STU • Thỏa thuận linh hoạt qua Chat', '2026-11-23 13:44:15', '2026-11-23 13:44:15'),
(52, 4, 4, 'Bộ kit Raspberry Pi 4 Model B (RAM 4GB) + Nguồn 5V Type-C', 'Dùng hoàn thành đồ án môn Hệ thống nhúng & IoT khoa CNTT STU, hoạt động ổn định, tặng kèm thẻ nhớ SanDisk 32GB.', '1350000.00', 'LIKE_NEW', 'ACTIVE', 0, NULL, 24, 'Xưởng thực hành Điện - Điện tử STU • Sau giờ học từ 17h00', '2026-11-24 17:37:06', '2026-11-24 17:37:06'),
(53, 3, 2, 'Bàn phím cơ DareU EK87 Tenkeyless (Brown Switch gõ êm)', 'Bàn phím cơ DareU EK87 switch nâu không ồn, phù hợp học code và làm đồ án đêm trong ký túc xá/phòng trọ.', '280000.00', 'USED_GOOD', 'ACTIVE', 0, NULL, 24, 'Sảnh A - Tòa nhà Trung tâm STU • Giờ ra chơi giữa ca (09h15 hoặc 14h45)', '2026-11-24 17:37:06', '2026-11-24 17:37:06'),
(54, 5, 4, 'Đồng hồ vạn năng kim Sanwa YX-360TRF chính hãng', 'Dùng đo điện áp, điện trở cho các môn thực hành cơ sở kỹ thuật điện, kim đo chuẩn xác, còn dây đo zin.', '320000.00', 'LIKE_NEW', 'ACTIVE', 0, NULL, 24, 'Xưởng thực hành Điện - Điện tử STU • Buổi sáng (07h00 - 11h30)', '2026-11-24 17:37:06', '2026-11-24 17:37:06'),
(55, 4, 3, 'Bảng vẽ kỹ thuật A2 kèm bao da quai xách STU', 'Bảng vẽ cơ khí và kiến trúc gỗ ép chống cong vênh, kích thước A2 tiêu chuẩn, tiện mang đi học các ca thực hành.', '150000.00', 'USED_GOOD', 'ACTIVE', 0, NULL, 24, 'Thư viện STU - Tầng 2 Tòa A • Buổi chiều (13h00 - 17h00)', '2026-11-24 17:37:06', '2026-11-24 17:37:06'),
(56, 3, 1, 'Combo sách Luyện thi TOEIC Economy 1000 RC + LC (Bản dịch STU)', 'Bộ sách photo rõ chữ ôn chuẩn đầu ra tiếng Anh B1 của trường STU, có sẵn ghi chú mẹo làm bài Part 5 & 7.', '75000.00', 'LIKE_NEW', 'ACTIVE', 0, NULL, 24, 'Căn tin STU - Khu B • Thỏa thuận linh hoạt qua Chat', '2026-11-24 17:37:06', '2026-11-24 17:37:06'),
(57, 5, 6, 'Nồi cơm điện mini Lock&Lock 0.8L cho sinh viên trọ', 'Nồi cơm điện nhỏ gọn chống dính tốt, nấu nhanh 20 phút cho 1-2 bạn sinh viên trọ quanh khu Cao Lỗ Quận 8.', '210000.00', 'USED_GOOD', 'ACTIVE', 0, NULL, 24, 'Bàn ghế đá Sân trường STU • Sau giờ học từ 17h00', '2026-11-24 17:37:06', '2026-11-24 17:37:06');

SET FOREIGN_KEY_CHECKS = 1;
