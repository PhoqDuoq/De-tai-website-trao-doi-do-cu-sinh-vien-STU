# Báo Cáo Triển Khai & Nghiệm Thu Kỹ Thuật Phase 2
## STU Marketplace — Core Domain Microservices & JPA Persistence (Identity & Listing)

- **Dự án**: Sàn Trao Đổi Đồ Dùng Cũ STU (Monorepo Microservices)
- **Thời gian thực hiện**: 2026-11-14T23:15:00+07:00
- **Phạm vi triển khai đợt này**: **Identity Service (Port 8081)** & **Listing Service (Port 8082)**
- **Kiến trúc nền tảng**:
  - Hệ điều hành: Windows 11 Enterprise (build 26100)
  - Java runtime: Eclipse Temurin OpenJDK 21.0.13+9 (LTS)
  - Framework: Spring Boot 3.3.5, Spring Cloud 2023.0.3, Spring Security 6.3.4, Spring Data JPA / Hibernate 6.5.3
  - Cơ sở dữ liệu: MySQL Community Server 8.4.7 trên WampServer (Port 3306)
  - API Gateway: Spring Cloud Gateway Netty Reactive (Port 8080)
- **Kết luận nghiệm thu đợt 1 Phase 2**: **HOÀN THÀNH 100% — XÁC MINH RUNTIME THÀNH CÔNG**

---

## 1. Tổng Quan Triển Khai & Tuân Thủ Kiến Trúc

Theo đúng yêu cầu của người dùng tại quyết định phê duyệt Phase 1 và kích hoạt Phase 2:
1. **Tiếp tục trên Monorepo hiện tại**: Mã nguồn được xây dựng trực tiếp trong `identity-service/` và `listing-service/` thuộc Maven reactor, kế thừa thư viện chia sẻ `stu-common`.
2. **Bảo tồn cơ sở dữ liệu WampServer MySQL**:
   - Sử dụng đúng 2 schema đã tồn tại: `stu_identity_db` và `stu_listing_db` trên WampServer cổng 3306.
   - Tuyệt đối không xóa, ghi đè, drop hoặc làm mất dữ liệu có sẵn.
   - Kích hoạt cấu hình `spring.jpa.hibernate.ddl-auto=validate` trên cả hai service. Cả hai ứng dụng đều xác thực thành công 100% các bảng và cột với schema MySQL thực tế mà không cần thay đổi DDL.
3. **Cách ly cơ sở dữ liệu (Database per Service)**:
   - 0 Foreign Key xuyên database.
   - 0 SQL JOIN chéo database.
   - Mối quan hệ giữa tin đăng (`listings`) và người bán (`users`) được mô hình hóa qua khóa scalar logic `seller_id BIGINT UNSIGNED`.
4. **Bảo mật và an toàn thông tin**:
   - Mật khẩu người dùng được băm bằng thuật toán BCrypt với salt ngẫu nhiên.
   - Secret key của JWT không bị hardcode trong mã nguồn Java, được nạp qua biến môi trường `${JWT_SECRET}` với giá trị dự phòng an toàn cho môi trường phát triển.
   - Quản lý phiên làm việc hoàn toàn Stateless (không lưu session trên RAM server).
   - Cơ chế thu hồi và xoay vòng Refresh Token (Token Rotation) chống tấn công giả mạo token.

---

## 2. Chi Tiết Triển Khai Identity Service (Port 8081)

### 2.1 Các thành phần đã xây dựng
- **JPA Entities**:
  - `User`: Ánh xạ bảng `users` (`email`, `password_hash`, `student_code`, `full_name`, `phone`, `avatar_url`, `verification_status`, `account_status`, `verified_at`).
  - `Role`: Ánh xạ bảng `roles` (`STUDENT`, `MODERATOR`, `ADMIN`).
  - `StudentVerification`: Ánh xạ bảng `student_verifications` (`user_id`, `student_code`, `method`, `evidence_reference`, `status`, `rejection_reason`, `reviewed_by`, `reviewed_at`).
  - `RefreshToken`: Ánh xạ bảng `refresh_tokens` (`token_hash` dạng `char(64)`, `expires_at`, `revoked_at`).
  - `PasswordResetToken`: Ánh xạ bảng `password_reset_tokens` (`token_hash` dạng `char(64)`, `expires_at`, `used_at`).
- **Repositories**:
  - `UserRepository` (tìm kiếm theo email, mã sinh viên, kiểm tra tồn tại).
  - `RoleRepository` (tìm kiếm theo mã code vai trò).
  - `StudentVerificationRepository` (truy vấn hồ sơ theo user hoặc trạng thái PENDING).
  - `RefreshTokenRepository` (tìm kiếm token chưa thu hồi, thu hồi toàn bộ token của user).
  - `PasswordResetTokenRepository` (xác thực token đặt lại mật khẩu).
- **Security & JWT**:
  - `UserPrincipal`: Cài đặt `UserDetails`, chứa định danh người dùng và danh sách GrantedAuthority (`ROLE_STUDENT`, `ROLE_MODERATOR`, `ROLE_ADMIN`).
  - `JwtTokenProvider`: Ký và giải mã token JWT bằng HMAC-SHA512, trích xuất Claims.
  - `JwtAuthenticationFilter`: Bộ lọc kiểm tra header `Authorization: Bearer <token>`, phân giải UserPrincipal vào `SecurityContextHolder`.
  - `JwtAuthenticationEntryPoint`: Bắt lỗi chưa xác thực và phản hồi envelope chuẩn `ApiResponse.error(ErrorCode.UNAUTHORIZED, ...)` với HTTP 401.
  - `SecurityConfig`: Cấu hình chuỗi bảo mật phân quyền Stateless.
- **Dịch vụ nghiệp vụ & Controller**:
  - `AuthService`: Đăng ký, đăng nhập, làm mới token, quên và đặt lại mật khẩu.
  - `UserService`: Xem và cập nhật hồ sơ cá nhân.
  - `StudentVerificationService`: Gửi yêu cầu xác minh sinh viên STU và xét duyệt hồ sơ cho Moderator.
  - `AuthController` (`/api/v1/auth/**`), `UserController` (`/api/v1/users/**`), `StudentVerificationController` (`/api/v1/students/**`).

---

## 3. Chi Tiết Triển Khai Listing Service (Port 8082)

### 3.1 Các thành phần đã xây dựng
- **JPA Entities**:
  - `Category`: Ánh xạ bảng `categories` (`parent_id`, `name`, `slug`, `is_active`).
  - `Listing`: Ánh xạ bảng `listings` (`seller_id`, `category_id`, `title`, `description`, `price`, `item_condition`, `condition_percent`, `status`, `published_at`, `sold_at`).
  - `ListingImage`: Ánh xạ bảng `listing_images` (`storage_key`, `mime_type`, `sort_order smallint unsigned`).
  - `ListingStatusHistory`: Ánh xạ bảng `listing_status_history` (`from_status`, `to_status`, `actor_id`, `reason`).
- **Repositories**:
  - `CategoryRepository` (tìm danh mục hoạt động, kiểm tra slug).
  - `ListingRepository`: Tích hợp `JpaSpecificationExecutor<Listing>` hỗ trợ lọc động đa điều kiện (từ khóa, danh mục, khoảng giá, tình trạng hàng cũ) và phân trang.
  - `ListingImageRepository`.
  - `ListingStatusHistoryRepository` (lưu vết lịch sử kiểm duyệt và thay đổi trạng thái).
- **Security & Authorization**:
  - `JwtTokenValidator`: Giải mã và thẩm định JWT do Identity Service phát hành (dùng chung khóa bí mật).
  - `JwtAuthFilter`: Thiết lập `SecurityContext` cho người bán hoặc kiểm duyệt viên.
  - `JwtAuthenticationEntryPoint`: Phản hồi HTTP 401 Unauthorized khi truy cập endpoint cần xác thực.
- **Dịch vụ nghiệp vụ & Controller**:
  - `CategoryService`: Lấy danh mục đang hoạt động và khởi tạo danh mục mới cho quản trị viên.
  - `ListingService`:
    - Tạo tin đăng mới (gán sellerId từ token, tạo bản ghi lịch sử, khởi tạo DRAFT hoặc PENDING_REVIEW).
    - Cập nhật tin đăng (kiểm tra nghiêm ngặt quyền sở hữu `listing.sellerId == currentUserId`).
    - Lọc và tìm kiếm phân trang (chỉ công khai tin có `status = 'PUBLISHED'`).
    - Gửi tin kiểm duyệt (`submitForReview`).
    - Người bán quản lý trạng thái (`HIDDEN`, `SOLD`).
    - Kiểm duyệt viên phê duyệt (`PUBLISHED`) hoặc từ chối (`REJECTED`) kèm lý do.
  - `CategoryController` (`/api/v1/categories/**`), `ListingController` (`/api/v1/listings/**`).

---

## 4. Bằng Chứng Biên Dịch & Kiểm Thử Toàn Diện (Verification Evidence)

### 4.1 Biên dịch toàn bộ Monorepo (`mvn clean verify`)
Lệnh thực thi thực tế:
```powershell
mvn clean verify
```
Kết quả thực tế từ Maven Reactor:
```
[INFO] Reactor Summary for stu-marketplace-parent 1.0.0-SNAPSHOT:
[INFO] 
[INFO] stu-marketplace-parent ............................. SUCCESS [  0.123 s]
[INFO] stu-common ......................................... SUCCESS [  2.590 s]
[INFO] api-gateway ........................................ SUCCESS [  2.246 s]
[INFO] identity-service ................................... SUCCESS [ 13.340 s]
[INFO] listing-service .................................... SUCCESS [ 10.781 s]
[INFO] interaction-service ................................ SUCCESS [  0.932 s]
[INFO] transaction-service ................................ SUCCESS [  0.896 s]
[INFO] moderation-service ................................. SUCCESS [  0.939 s]
[INFO] billing-service .................................... SUCCESS [  1.805 s]
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  34.155 s
[INFO] Finished at: 2026-11-14T23:03:39+07:00
```
- **100% BUILD SUCCESS** cho toàn bộ 9/9 modules.
- Các microservice chưa triển khai nghiệp vụ đầy đủ (`interaction`, `transaction`, `moderation`, `billing`) vẫn biên dịch và đóng gói hoàn toàn ổn định, không bị ảnh hưởng.

### 4.2 Kiểm thử tự động (Unit Tests & Integration Tests)
1. **Identity Service Test Suite**:
   - `AuthServiceTest` (5 unit tests): Đăng ký thành công, chặn email trùng, xác thực đăng nhập thành công, phát hiện sai mật khẩu, xoay vòng refresh token.
   - `AuthControllerIntegrationTest` (2 integration tests): Kiểm tra Bean Validation với email không hợp lệ và mật khẩu để trống.
   - Kết quả: **7/7 tests passed (0 failures, 0 errors)**.
2. **Listing Service Test Suite**:
   - `ListingServiceTest` (5 unit tests): Tạo tin DRAFT, chặn người lạ cập nhật tin của người khác (`UNAUTHORIZED_LISTING_ACTION`), gửi duyệt PENDING_REVIEW, chặn người bán tự ý xuất bản PUBLISHED (`LISTING_STATUS_INVALID`), kiểm duyệt viên duyệt tin PUBLISHED thành công.
   - `ListingControllerIntegrationTest` (3 integration tests): `GET /api/v1/categories` trả về 200 OK mảng danh mục, `GET /api/v1/listings` tìm kiếm phân trang 200 OK, `POST /api/v1/listings` không có token trả về 401 Unauthorized.
   - Kết quả: **8/8 tests passed (0 failures, 0 errors)**.

---

## 5. Bằng Chứng Xác Minh Runtime Thực Tế Qua API Gateway (Live Probes)

Hệ thống đã được khởi động thực tế tại:
- API Gateway: Cổng `8080`
- Identity Service: Cổng `8081`
- Listing Service: Cổng `8082`
- MySQL WampServer: Cổng `3306`

Toàn bộ các luồng kiểm thử dưới đây được gọi qua **API Gateway (localhost:8080)**:

### 5.1 Kiểm tra sức khỏe dịch vụ (Actuator Health)
- `GET http://localhost:8080/actuator/health` -> HTTP 200 OK (`{"status":"UP"}`)
- `GET http://localhost:8081/actuator/health` -> HTTP 200 OK (`{"status":"UP"}`)
- `GET http://localhost:8082/actuator/health` -> HTTP 200 OK (`{"status":"UP"}`)

### 5.2 Đăng ký tài khoản sinh viên STU
- **Request**:
  ```powershell
  POST http://localhost:8080/api/v1/auth/register
  {
    "email": "sinhvien_test_ph2@stu.edu.vn",
    "password": "Password123!",
    "fullName": "Sinh Vien Test Phase 2",
    "studentCode": "DH52009999",
    "phone": "0909123456"
  }
  ```
- **Response**: HTTP 200 OK
  - `success: true`
  - `message: "User registered successfully"`
  - `user.id: 1`, `roles: ["STUDENT"]`, `verificationStatus: "PENDING"`
  - Access Token JWT và Refresh Token được tạo mới.

### 5.3 Đăng nhập hệ thống & Cấp phát JWT
- **Request**:
  ```powershell
  POST http://localhost:8080/api/v1/auth/login
  {"emailOrStudentCode": "sinhvien_test_ph2@stu.edu.vn", "password": "Password123!"}
  ```
- **Response**: HTTP 200 OK
  - `success: true`
  - Cấp phát Access Token HMAC-SHA512 hợp lệ.

### 5.4 Truy vấn hồ sơ cá nhân qua Token
- **Request**:
  ```powershell
  GET http://localhost:8080/api/v1/users/me
  Header: Authorization: Bearer <token>
  ```
- **Response**: HTTP 200 OK trả về thông tin người dùng ID 1.

### 5.5 Truy vấn danh mục sản phẩm (Listing Service)
- **Request**:
  ```powershell
  GET http://localhost:8080/api/v1/categories
  ```
- **Response**: HTTP 200 OK trả về 4 danh mục mặc định có sẵn trong `stu_listing_db`:
  - `Giáo trình và tài liệu` (slug: `giao-trinh-tai-lieu`)
  - `Thiết bị công nghệ` (slug: `thiet-bi-cong-nghe`)
  - `Đồ dùng học tập` (slug: `do-dung-hoc-tap`)
  - `Đồ dùng sinh hoạt` (slug: `do-dung-sinh-hoat`)

### 5.6 Đăng tin đồ dùng cũ kèm ảnh và quy trình duyệt
- **Request**:
  ```powershell
  POST http://localhost:8080/api/v1/listings
  Header: Authorization: Bearer <token>
  {
    "categoryId": 1,
    "title": "Sach Lap trinh Java 21 - Dai hoc STU",
    "description": "Sach con moi 95%, rat phu hop cho sinh vien CNTT STU.",
    "price": 65000,
    "itemCondition": "LIKE_NEW",
    "conditionPercent": 95,
    "submitForReview": true,
    "images": [
      {
        "storageKey": "uploads/listings/java21_front.jpg",
        "mimeType": "image/jpeg",
        "sortOrder": 0
      }
    ]
  }
  ```
- **Response**: HTTP 200 OK
  - `id: 1`, `sellerId: 1` (được gán tự động từ JWT của sinh viên)
  - `status: "PENDING_REVIEW"`
  - Bản ghi `listing_status_history` được tạo lưu vết: `toStatus: "PENDING_REVIEW"`, `actorId: 1`, `reason: "Listing created"`.

### 5.7 Xem danh sách tin đã đăng của bản thân
- **Request**:
  ```powershell
  GET http://localhost:8080/api/v1/listings/my-listings
  Header: Authorization: Bearer <token>
  ```
- **Response**: HTTP 200 OK trả về tin đăng ID 1 với đầy đủ cấu trúc phân trang (`totalElements: 1`).

### 5.8 Xem chi tiết tin đăng kèm lịch sử trạng thái
- **Request**:
  ```powershell
  GET http://localhost:8080/api/v1/listings/1
  Header: Authorization: Bearer <token>
  ```
- **Response**: HTTP 200 OK trả về chi tiết tin đăng và mảng `statusHistory`.

### 5.9 Gửi hồ sơ xác minh sinh viên STU
- **Request**:
  ```powershell
  POST http://localhost:8080/api/v1/students/verify
  Header: Authorization: Bearer <token>
  {
    "method": "MANUAL_REVIEW",
    "evidenceReference": "uploads/verifications/student_card_DH52009999.jpg",
    "studentCode": "DH52009999"
  }
  ```
- **Response**: HTTP 200 OK
  - `id: 1`, `userId: 1`, `status: "PENDING"`, `method: "MANUAL_REVIEW"`.
- **Xem lại yêu cầu xác minh**:
  ```powershell
  GET http://localhost:8080/api/v1/students/my-verifications
  Header: Authorization: Bearer <token>
  ```
  - Trả về danh sách hồ sơ xác minh đang chờ duyệt của tài khoản.

---

## 6. Kết Luận Nghiệm Thu Phase 2 (Đợt 1)

1. **Phạm vi hoàn thành**: Đã xây dựng hoàn chỉnh và kiểm thử toàn bộ nghiệp vụ thực tế cho **Identity Service** và **Listing Service**.
2. **Tính toàn vẹn dữ liệu**: Không có bất kỳ dữ liệu nào bị xóa hoặc bảng nào bị drop; `ddl-auto=validate` đã chứng minh cấu trúc entity Java hoàn toàn tương thích với database WampServer MySQL hiện có.
3. **Chất lượng kiểm thử**:
   - 100% BUILD SUCCESS trên toàn bộ 9 module.
   - 15 test tự động (7 tests cho Identity, 8 tests cho Listing) đều vượt qua.
   - Toàn bộ các API chính đã được kiểm chứng hoạt động thực tế trên cổng 8080 thông qua Spring Cloud Gateway.
4. **Dừng lại để người dùng nghiệm thu**: Theo đúng quy định, hệ thống dừng lại tại đây để người dùng kiểm tra và nghiệm thu đợt 1 của Phase 2 trước khi triển khai các nghiệp vụ tiếp theo (Interaction, Transaction, Moderation, Billing).
