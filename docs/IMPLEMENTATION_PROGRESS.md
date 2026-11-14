# Implementation Progress Tracker — STU Marketplace

Dự án: **Sàn Trao Đổi Đồ Dùng Cũ STU (Monorepo Microservices)**  
Thời gian cập nhật: **2026-11-14**  
Kiến trúc nền tảng: **Java 21 LTS | Spring Boot 3.3.5 | Spring Cloud 2023.0.3 | Vite 5 + React 18 + Tailwind CSS 3 | MySQL 8+ on WampServer**

---

## Tổng Quan Tiến Độ Các Pha (Phase Overview)

| Pha (Phase) | Tên Pha | Trạng Thái | Tiến Độ |
|---|---|---|---|
| **Phase 1** | **Project Foundation & Monorepo Architecture** | **HOÀN THÀNH (100%)** | 10/10 Deliverables |
| **Phase 2** | Core Domain Microservices & JPA Persistence | Chưa bắt đầu (Sẵn sàng triển khai) | 0% |
| **Phase 3** | Business Interactions, Campus Meetups & Moderation | Chưa bắt đầu | 0% |
| **Phase 4** | Full Integration, Frontend SPA & Verification | Chưa bắt đầu | 0% |

---

## Chi Tiết Hạng Mục Giai Đoạn 1 (Phase 1 Deliverables Breakdown)

### 1. R1: Baseline Workspace & Environment Audit
- [x] Khởi tạo Git repository và cấu hình `.gitignore` chuẩn hóa đa công nghệ (Java, Node, Vite, IDE, OS).
- [x] Rà soát và ghi nhận hiện trạng ban đầu của thư mục làm việc (trước đó trống rỗng, không có tài liệu hay DDL pre-existing).
- [x] Kiểm định các công cụ môi trường cục bộ:
  - Java 21 LTS: OpenJDK 64-Bit Server VM Temurin-21.0.13+9
  - Maven: Apache Maven 3.9.11
  - Node.js: v26.13.0 / npm: 11.20.0
  - MySQL: WampServer MySQL 8.4.7 Community Server (Port 3306)

### 2. R2: Cấu Trúc Monorepo Maven Multi-Module & API Gateway
- [x] Tạo `pom.xml` gốc với `<packaging>pom</packaging>`, quản lý dependency tập trung qua Spring Boot 3.3.5 và Spring Cloud 2023.0.3 BOM.
- [x] Khởi tạo module `stu-common` cung cấp cấu trúc phản hồi chuẩn hóa:
  - `ApiResponse<T>`: Phong bì dữ liệu API thống nhất (`success`, `code`, `message`, `data`, `timestamp`).
  - `ErrorCode`: Danh mục mã lỗi định danh phân lớp domain (HTTP chuẩn và mã nghiệp vụ 1000 - 6999).
  - `AppException`: Runtime exception chứa `ErrorCode`.
  - `SecurityConstants` & `DatabaseConstants`: Hằng số bảo mật và định danh cơ sở dữ liệu.
- [x] Khởi tạo module `api-gateway`:
  - Sử dụng `spring-cloud-starter-gateway` trên nền Netty reactive runtime.
  - Loại bỏ hoàn toàn `spring-boot-starter-tomcat` để tránh xung đột MVC/Reactive.
  - Cấu hình toàn diện CORS (`allowedOrigins`, `allowedMethods`, `allowedHeaders`, `allowCredentials`).
  - Định tuyến phân giải 6 microservices backend qua cổng 8080.
- [x] Khởi tạo 6 bộ khung dịch vụ backend độc lập:
  - `identity-service` (Port 8081)
  - `listing-service` (Port 8082)
  - `interaction-service` (Port 8083)
  - `transaction-service` (Port 8084)
  - `moderation-service` (Port 8085)
  - `billing-service` (Port 8086)

### 3. R2: Frontend Single Page Application (React 18 + Vite + Tailwind CSS)
- [x] Thiết lập cấu trúc `frontend/`:
  - `package.json` với React 18.3, React Router DOM, Axios, Lucide React, Vite 5, Tailwind CSS 3.
  - `vite.config.js` tích hợp proxy ngược `/api` trỏ về API Gateway port 8080.
  - `tailwind.config.js` & `postcss.config.js` cấu hình bảng màu STU Blue và STU Orange.
  - `index.html`, `src/index.css`, `src/main.jsx`.
  - `src/App.jsx` giao diện bảng điều khiển trung tâm hiển thị ma trận dịch vụ microservices và nguyên tắc kiến trúc.

### 4. R3: Cách Ly Cơ Sở Dữ Liệu & Ràng Buộc Nghiệp Vụ
- [x] Cấu hình độc lập kết nối cơ sở dữ liệu cho từng dịch vụ:
  - `stu_identity_db` -> `identity-service`
  - `stu_listing_db` -> `listing-service`
  - `stu_interaction_db` -> `interaction-service`
  - `stu_transaction_db` -> `transaction-service`
  - `stu_moderation_db` -> `moderation-service`
  - `stu_billing_db` -> `billing-service`
- [x] Tuân thủ 100% nguyên tắc cách ly dữ liệu:
  - 0 Foreign Key liên database (không tham chiếu chéo giữa các schema).
  - 0 SQL JOIN chéo database.
  - Liên kết liên miền lưu trữ dưới dạng scalar ID (khóa logic nguyên bản).
- [x] Tuân thủ phạm vi nghiệp vụ Billing:
  - Chỉ thu phí đăng tin và gói đẩy bài viết cho người bán (`fee_packages`, `invoices`, `payment_transactions`).
  - Tuyệt đối không cung cấp ví trung gian hay xử lý luồng thanh toán tiền giữa sinh viên với sinh viên.

### 5. R4: Tài Liệu Hóa & Kiểm Định Tính Xác Thực (Verification)
- [x] `README.md` hướng dẫn tổng thể, sơ đồ kiến trúc, port directory, thiết lập môi trường và lệnh chạy.
- [x] `.env.example` liệt kê đầy đủ cấu hình cổng, chuỗi kết nối JDBC, thông tin xác thực MySQL WampServer và secret JWT.
- [x] Tạo 6 tệp DDL chuẩn hóa tại `docs/database/`:
  - `stu_identity_db.sql`
  - `stu_listing_db.sql`
  - `stu_interaction_db.sql`
  - `stu_transaction_db.sql`
  - `stu_moderation_db.sql`
  - `stu_billing_db.sql`
- [x] Biên dịch thực tế xác thực:
  - `mvn clean compile`: 100% BUILD SUCCESS trên Java 21 (9/9 modules).
  - `npm run build`: Hoàn tất không cảnh báo lỗi cú pháp.
