# Implementation Progress Tracker — STU Marketplace

Dự án: **Sàn Trao Đổi Đồ Dùng Cũ STU (Monorepo Microservices)**  
Thời gian cập nhật: **2026-11-14T22:28:00+07:00**  
Kiến trúc nền tảng: **Java 21 LTS | Spring Boot 3.3.5 | Spring Cloud 2023.0.3 | Vite 5 + React 18 + Tailwind CSS 3 | MySQL 8.4+ on WampServer**

---

## Tổng Quan Tiến Độ Các Pha (Phase Overview)

| Pha (Phase) | Tên Pha | Trạng Thái | Tiến Độ | Tài liệu nghiệm thu |
|---|---|---|---|---|
| **Phase 1** | **Project Foundation & Monorepo Architecture** | **NGHIỆM THU THÀNH CÔNG (READY FOR PHASE 2)** | 10/10 Deliverables | [`docs/PHASE1_RUNTIME_VERIFICATION.md`](PHASE1_RUNTIME_VERIFICATION.md) |
| **Phase 2** | **Core Domain Microservices & JPA Persistence** | **NGHIỆM THU ĐỢT 1 THÀNH CÔNG (SEC-01 to SEC-05 Remediated)** | 100% Đợt 1 (36/36 Tests Pass) | [`docs/PHASE2_BATCH1_ACCEPTANCE.md`](PHASE2_BATCH1_ACCEPTANCE.md)<br>[`docs/PHASE2_IMPLEMENTATION_REPORT.md`](PHASE2_IMPLEMENTATION_REPORT.md)<br>[`docs/API_CONTRACTS.md`](API_CONTRACTS.md) |
| **Phase 3** | **Business Interactions, Campus Meetups & Transactions** | **HOÀN THÀNH ĐỢT 1 (INTERACTION & TRANSACTION SERVICES)** | 100% Đợt 1 (77/77 Tests Pass) | [`docs/API_CONTRACTS.md`](API_CONTRACTS.md) |
| **Phase 4** | Full Integration, Frontend SPA & Verification | Chưa bắt đầu | 0% | TBD |

---

## Chi Tiết Hạng Mục Giai Đoạn 1 (Phase 1 Deliverables Breakdown)

### 1. R1: Baseline Workspace & Environment Audit
- [x] Khởi tạo Git repository và cấu hình `.gitignore` chuẩn hóa đa công nghệ (Java, Node, Vite, IDE, OS).
- [x] Rà soát và ghi nhận hiện trạng ban đầu của thư mục làm việc.
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

### 5. R4: Tài Liệu Hóa & Kiểm Định Runtime Thực Tế (Runtime Verification)
- [x] `README.md` hướng dẫn tổng thể, sơ đồ kiến trúc, port directory, thiết lập môi trường và lệnh chạy.
- [x] `.env.example` liệt kê đầy đủ cấu hình cổng, chuỗi kết nối JDBC, thông tin xác thực MySQL WampServer và secret JWT.
- [x] Tạo 6 tệp DDL chuẩn hóa tại `docs/database/` và đối chiếu an toàn với 6 database có sẵn trên WampServer MySQL (không xóa/ghi đè).
- [x] Biên dịch thực tế xác thực:
  - `mvn clean verify`: 100% BUILD SUCCESS trên Java 21 (9/9 modules, 39.891 s).
  - `npm run build`: Hoàn tất trong 1.46 s tạo static bundle tại `frontend/dist/`.
- [x] Kiểm tra Runtime đồng thời toàn hệ thống:
  - API Gateway Netty (8080) và 6 Microservices (8081 - 8086) khởi động đồng thời, JPA init thành công, Actuator status đạt `UP`.
  - Frontend Vite (5173) khởi động trong 273 ms, phản hồi HTTP 200 OK.
  - CORS preflight phản hồi HTTP 200 OK cho origin `http://localhost:5173`.
  - Vite proxy `/api` chuyển tiếp chính xác qua Gateway đến các microservice.
  - Toàn bộ kết quả được ghi nhận chi tiết tại `docs/PHASE1_RUNTIME_VERIFICATION.md`.

---

## Chi Tiết Hạng Mục Giai Đoạn 2 — Đợt 1 (Phase 2 Deliverables Breakdown: Identity & Listing)

### 1. Identity Service (Port 8081 — `stu_identity_db`)
- [x] JPA Entities: `User`, `Role`, `StudentVerification`, `RefreshToken`, `PasswordResetToken` (chuẩn hóa `char(64)` cho token hash).
- [x] Spring Data JPA Repositories: `UserRepository`, `RoleRepository`, `StudentVerificationRepository`, `RefreshTokenRepository`, `PasswordResetTokenRepository`.
- [x] DTOs & Validation: `RegisterRequest`, `LoginRequest`, `RefreshTokenRequest`, `ForgotPasswordRequest`, `ResetPasswordRequest`, `StudentVerificationRequest`, `VerificationReviewRequest`, `UpdateProfileRequest`, `AuthResponse`, `UserProfileResponse`, `StudentVerificationResponse`.
- [x] Spring Security 6 & JWT HMAC-SHA512: `JwtTokenProvider`, `JwtAuthenticationFilter`, `JwtAuthenticationEntryPoint` (chuẩn hóa envelope 401), `SecurityConfig` (Stateless).
- [x] Nghiệp vụ AuthService: Đăng ký sinh viên, đăng nhập, Token Rotation, thu hồi token, quên mật khẩu.
- [x] Nghiệp vụ UserService: Lấy thông tin tài khoản và cập nhật profile.
- [x] Nghiệp vụ StudentVerificationService: Gửi hồ sơ thẻ sinh viên (`MANUAL_REVIEW`, `INSTITUTION_API`) và xét duyệt cho Moderator.
- [x] Cấu hình `spring.jpa.hibernate.ddl-auto=validate` đạt 100% khớp schema MySQL `stu_identity_db`.
- [x] Kiểm thử: 5 Unit tests (`AuthServiceTest`), 2 Integration tests (`AuthControllerIntegrationTest`) -> 7/7 tests passed.

### 2. Listing Service (Port 8082 — `stu_listing_db`)
- [x] JPA Entities: `Category`, `Listing`, `ListingImage` (`smallint unsigned` sortOrder), `ListingStatusHistory`.
- [x] Spring Data JPA Repositories: `CategoryRepository`, `ListingRepository` (kèm `JpaSpecificationExecutor` cho multi-criteria search), `ListingImageRepository`, `ListingStatusHistoryRepository`.
- [x] DTOs & Validation: `CategoryDto`, `CreateCategoryRequest`, `ListingImageDto`, `CreateListingRequest`, `UpdateListingRequest`, `ListingResponse`, `ListingDetailResponse`, `ListingStatusHistoryDto`, `ListingStatusUpdateRequest`, `ListingFilterRequest`, `PagedResponse`.
- [x] Spring Security & JWT: `JwtTokenValidator`, `JwtAuthFilter`, `JwtAuthenticationEntryPoint` (chuẩn hóa envelope 401), `SecurityConfig`.
- [x] Nghiệp vụ CategoryService: Truy vấn danh mục hoạt động, thêm danh mục cho Admin.
- [x] Nghiệp vụ ListingService:
  - Đăng tin mới (gán sellerId từ token, tạo lịch sử ban đầu DRAFT hoặc PENDING_REVIEW).
  - Cập nhật tin đăng (kiểm tra nghiêm ngặt quyền sở hữu `listing.sellerId == currentUserId`).
  - Lọc động đa tiêu chí (keyword, category, price range, condition) và phân trang chuẩn.
  - Quản lý trạng thái: Người bán chuyển PENDING_REVIEW, HIDDEN, SOLD; chặn người bán tự ý PUBLISHED.
  - Quy trình kiểm duyệt: Moderator phê duyệt PUBLISHED hoặc REJECTED kèm lý do.
- [x] Cấu hình `spring.jpa.hibernate.ddl-auto=validate` đạt 100% khớp schema MySQL `stu_listing_db`.
- [x] Kiểm thử: 5 Unit tests (`ListingServiceTest`), 3 Integration tests (`ListingControllerIntegrationTest`) -> 8/8 tests passed.

### 3. Monorepo Verification & Live Gateway Probing
- [x] `mvn clean verify`: 100% BUILD SUCCESS trên toàn bộ 9/9 modules (34.155 s).
- [x] Live Runtime Probe qua Gateway (8080): Đăng ký user thật, đăng nhập lấy JWT thật, xem profile `GET /users/me`, lấy danh mục, tạo tin đăng mới kèm ảnh, xem `my-listings`, xem chi tiết tin đăng, gửi hồ sơ xác minh sinh viên.
- [x] Tài liệu hợp đồng API: `docs/API_CONTRACTS.md`.
- [x] Báo cáo kỹ thuật chi tiết: `docs/PHASE2_IMPLEMENTATION_REPORT.md`.

### 4. Báo Cáo Khắc Phục Lỗ Hổng Bảo Mật & Nghiệm Thu Đợt 1 (SEC-01 to SEC-05 Remediation)
- [x] **SEC-01**: Khắc phục Moderation Bypass qua trạng thái `HIDDEN` trong `listing-service` (kiểm tra `publishedAt != null`, cấm DRAFT -> HIDDEN, trả về `LISTING_NOT_APPROVED`).
- [x] **SEC-02**: Bảo vệ PII sinh viên qua DTO `PublicUserProfileResponse` (loại bỏ email, SĐT, studentCode ở endpoint công khai), bảo vệ `GET /api/v1/users/{id}` qua `@PreAuthorize`.
- [x] **SEC-03**: Ngăn chặn rò rỉ tin chưa kiểm duyệt trong tìm kiếm công khai `GET /api/v1/listings` (ép buộc vô điều kiện `status = PUBLISHED` với người dùng ẩn danh / sinh viên).
- [x] **SEC-04**: Chặn tài khoản bị khóa/vô hiệu hóa bypass JWT trong `JwtAuthenticationFilter` (kiểm tra `isAccountNonLocked()` và `isEnabled()`, ngắt filter chain trả về HTTP 403 Forbidden).
- [x] **SEC-05**: Chống tấn công dò quét người dùng (User Enumeration) ở chức năng quên mật khẩu (trả về HTTP 200 thông điệp chung thống nhất).
- [x] Bộ kiểm thử bảo mật tự động: 36/36 tests đạt 100% PASS (18 tests `identity-service`, 18 tests `listing-service`).
- [x] Tài liệu nghiệm thu chi tiết: [`docs/PHASE2_BATCH1_ACCEPTANCE.md`](PHASE2_BATCH1_ACCEPTANCE.md).

---

## Chi Tiết Hạng Mục Giai Đoạn 3 — Đợt 1 (Phase 3 Batch 1: Interaction & Transaction Services)

### 1. Interaction Service (Port 8083 — `stu_interaction_db`)
- [x] **JPA Entities & Schema Matching**:
  - `Favorite`: Quản lý tin yêu thích, unique constraint `uk_user_listing (user_id, listing_id)`.
  - `Comment`: Bình luận phân cấp cây (`parent_id` self-reference), cascade deletion.
  - `Conversation`: Cuộc trò chuyện 1-1, unique constraint `uk_conversation_participants (listing_id, buyer_id, seller_id)`.
  - `Message`: Tin nhắn trao đổi (`message_type` ENUM `TEXT`, `IMAGE`, `LOCATION`), cờ `is_read`.
  - `Review`: Đánh giá 1-5 sao sau giao dịch, unique constraint `uk_reviewer_transaction`.
- [x] **Spring Data JPA Repositories**:
  - `FavoriteRepository`, `CommentRepository`, `ConversationRepository`, `MessageRepository`, `ReviewRepository`.
- [x] **Spring Security 6 & JWT (SEC-04 Compliant)**:
  - `UserPrincipal`, `JwtTokenValidator` (HMAC-SHA512), `JwtAuthFilter`, `JwtAuthenticationEntryPoint`, `SecurityConfig`.
  - Chặn token của tài khoản bị khóa/đình chỉ (`LOCKED`, `SUSPENDED`).
  - `GlobalExceptionHandler` bắt lỗi `AppException`, validation errors, `AccessDeniedException`.
- [x] **Nghiệp Vụ & Quyền Sở Hữu (Ownership Checks)**:
  - `FavoriteService`: Thêm, xóa, toggle, kiểm tra trạng thái, xem danh sách yêu thích cá nhân, đếm lượt yêu thích.
  - `CommentService`: Bình luận công khai, kiểm tra parent thuộc cùng listingId (chống cross-listing injection), chỉ tác giả được sửa, chỉ tác giả hoặc Staff được xóa.
  - `ConversationService`: Bắt đầu/lấy cuộc trò chuyện 1-1, chống tự chat với bản thân (`CANNOT_CHAT_WITH_SELF`), truy cập bảo mật chỉ người tham gia (người ngoài nhận 403 Forbidden).
  - `MessageService`: Gửi tin nhắn đa định dạng (`TEXT`, `IMAGE`, `LOCATION`), cập nhật `lastMessageAt`, đánh dấu đã đọc, đếm số tin chưa đọc.
  - `ReviewService`: Đánh giá 1-5 sao, chặn tự đánh giá (`CANNOT_REVIEW_SELF`), chặn đánh giá trùng (`REVIEW_ALREADY_SUBMITTED`), tính toán điểm uy tín trung bình và bảng phân bố sao.
- [x] **REST Controllers**:
  - `FavoriteController` (`/api/v1/favorites/**`)
  - `CommentController` (`/api/v1/comments/**`)
  - `ConversationController` (`/api/v1/conversations/**`)
  - `ReviewController` (`/api/v1/reviews/**`)
- [x] **Kiểm Thử Độc Lập**:
  - 48 tests đạt 100% PASS (0 failures, 0 errors): `FavoriteServiceTest` (9), `CommentServiceTest` (9), `ConversationServiceTest` (7), `MessageServiceTest` (5), `ReviewServiceTest` (7), `InteractionSecuritySuiteTest` (5), `InteractionControllerIntegrationTest` (6).

### 2. Transaction Service (Port 8084 — `stu_transaction_db`)
- [x] **JPA Entities & Schema Matching**:
  - `Transaction`: Đề xuất giao dịch, unique `transaction_code`, agreed price, meeting location & time, status.
  - `TransactionTimeline`: Nhật ký kiểm toán toàn bộ chuyển dịch trạng thái và ghi chú của các bên.
  - Enums: `TransactionStatus` (`REQUESTED`, `ACCEPTED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `DISPUTED`), `TransactionType` (`BUY_SELL`, `EXCHANGE`, `GIVEAWAY`).
- [x] **Spring Data JPA Repositories**:
  - `TransactionRepository`, `TransactionTimelineRepository`.
- [x] **Spring Security 6 & JWT (SEC-04 Compliant)**:
  - `UserPrincipal`, `JwtTokenValidator`, `JwtAuthFilter`, `JwtAuthenticationEntryPoint`, `SecurityConfig`, `GlobalExceptionHandler`.
- [x] **Đồng Bộ Liên Dịch Vụ Resilient (ListingClient)**:
  - Triển khai `ListingClient` và `ListingRestClient` sử dụng Spring 6 `RestClient`.
  - Tự động gọi `PATCH /api/v1/listings/{id}/status` chuyển trạng thái sang `SOLD` khi giao dịch hoàn tất.
  - Bọc try-catch và logging cảnh báo, đảm bảo nếu `listing-service` gián đoạn thì giao dịch vẫn hoàn tất an toàn.
- [x] **Nghiệp Vụ State Machine & Ràng Buộc Cơ Sở**:
  - `createProposal`: Người bán không thể tự mua tin của mình (`CANNOT_TRANSACT_OWN_ITEM`), sinh mã giao dịch duy nhất `TX-YYYYMMDD-XXXXXX`.
  - `acceptProposal`: Chỉ người bán (`sellerId == currentUserId`) được chấp thuận đề xuất.
  - `scheduleMeetup`: Lịch hẹn tại khuôn viên trường STU (Sảnh Nhà A, Sảnh Nhà C, Thư viện, Căn tin, Sân trường, Nhà xe), thời gian bắt buộc ở tương lai (`@Future`).
  - `confirmTransaction`: Hỗ trợ 2 phương thức: mã xác nhận 6 số từ người mua HOẶC xác nhận kép 2 phía. Khi đạt đủ điều kiện, chuyển `COMPLETED` và kích hoạt đồng bộ `SOLD`.
  - `cancelTransaction`: Hủy với lý do bắt buộc trước khi hoàn tất giao dịch.
  - `disputeTransaction`: Báo cáo tranh chấp/sự cố tại buổi hẹn (`DISPUTED`).
  - `getCampusLocations`: Danh mục địa điểm hẹn an toàn tại STU 180 Cao Lỗ.
- [x] **REST Controller**:
  - `TransactionController` (`/api/v1/transactions/**`)
- [x] **Kiểm Thử Độc Lập**:
  - 29 tests đạt 100% PASS (0 failures, 0 errors): `TransactionServiceTest` (18), `TransactionSecuritySuiteTest` (5), `TransactionControllerIntegrationTest` (6).

### 3. Quy Tắc Cách Ly Dữ Liệu (R3 Compliance)
- 100% tuân thủ nguyên tắc microservices:
  - 0 Foreign Key xuyên database giữa `stu_interaction_db`, `stu_transaction_db` và các database khác.
  - 0 SQL JOIN xuyên database.
  - Tất cả liên kết chéo (`user_id`, `listing_id`, `transaction_id`) là scalar ID `BIGINT`.
  - Không xử lý thanh toán tiền giữa sinh viên (giao dịch tiền mặt/trao đổi trực tiếp tại trường).
