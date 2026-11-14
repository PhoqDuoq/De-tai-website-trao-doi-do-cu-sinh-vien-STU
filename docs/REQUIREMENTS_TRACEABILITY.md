# Requirements Traceability Matrix — STU Marketplace

Dự án: **Sàn Trao Đổi Đồ Dùng Cũ STU (Monorepo Microservices)**  
Mục đích: Đối chiếu và truy vết các yêu cầu từ Đặc tả đề tài (R1 - R4) sang các thành phần kỹ thuật, cấu hình, và bằng chứng kiểm thử runtime thực tế.

---

## Bảng Đối Chiếu Ma Trận Yêu Cầu (Traceability Matrix)

| Mã YC | Mô tả yêu cầu nghiệp vụ | Thành phần triển khai (Artifacts) | Ràng buộc kiến trúc & Kỹ thuật | Bằng chứng kiểm định Runtime (Verification Evidence) | Trạng thái |
|---|---|---|---|---|---|
| **R1** | Kiểm tra hiện trạng repository, tài liệu luận văn và 6 schema SQL; báo cáo chính xác tệp thiếu. | • Khởi tạo Git repo (`.git`)<br>• `.gitignore`<br>• Khảo sát môi trường và baseline survey báo cáo đầy đủ hiện trạng. | Không giả định có sẵn tệp tài liệu hay DDL; lập danh sách chi tiết các tệp thiếu. | • `git status` xác nhận repo sạch<br>• `docs/PHASE1_RUNTIME_VERIFICATION.md` ghi nhận hiện trạng ban đầu và đối chiếu cấu trúc MySQL hiện có trên WampServer. | **ĐẠT (VERIFIED)** |
| **R2** | Thiết lập kiến trúc nền tảng Monorepo Maven multi-module (Java 21, Spring Boot 3.x, Spring Cloud) với API Gateway và React Frontend (Vite, Tailwind CSS); `.env.example` và `README.md`. | • Root `pom.xml`<br>• `stu-common/`<br>• `api-gateway/`<br>• 6 Service modules<br>• `frontend/`<br>• `.env.example`<br>• `README.md` | • Java 21 LTS<br>• Spring Boot 3.3.5 & Spring Cloud 2023.0.3<br>• Loại trừ Tomcat khỏi Gateway (chạy Netty reactive)<br>• React 18, Vite 5, Tailwind CSS 3 | • `mvn clean verify`: 100% BUILD SUCCESS (9/9 modules, 39.891 s)<br>• `npm run build`: hoàn tất trong 1.46 s<br>• Gateway Netty khởi động tại 8080 trong 4.6 s<br>• Frontend Vite khởi động tại 5173 trong 273 ms (HTTP 200 OK)<br>• CORS preflight HTTP 200 OK<br>• Vite proxy `/api` forward chính xác. | **ĐẠT (VERIFIED)** |
| **R3** | Cách ly nghiêm ngặt 6 cơ sở dữ liệu trên MySQL 8+ (WampServer); không có foreign key liên DB hoặc SQL JOIN chéo; Billing Service chỉ thu phí đăng tin (không trung gian tiền SV). | • 6 tệp DDL tại `docs/database/*.sql`<br>• Cấu hình datasource độc lập trong từng `application.yml`<br>• `DatabaseConstants.java` | • Mỗi service kết nối 1 DB duy nhất<br>• 0 Foreign Key liên database<br>• 0 SQL JOIN chéo database<br>• Billing chỉ thu phí tin đăng<br>• `ddl-auto=none` bảo vệ dữ liệu MySQL WampServer | • 100% cú pháp DDL và schema thực tế trên WampServer MySQL không chứa cross-schema FK<br>• Cả 6 Microservices kết nối độc lập tới đúng schema (`stu_identity_db`, `stu_listing_db`, `stu_interaction_db`, `stu_transaction_db`, `stu_moderation_db`, `stu_billing_db`)<br>• 6/6 service khởi động JPA thành công, Actuator status đạt `UP`. | **ĐẠT (VERIFIED)** |
| **R4** | Duy trì tài liệu theo dõi tiến độ và ma trận truy vết; trung thực trong kiểm thử (không tạo code giả/mock giả mạo kết quả); dừng sau Phase 1. | • `docs/IMPLEMENTATION_PROGRESS.md`<br>• `docs/REQUIREMENTS_TRACEABILITY.md`<br>• `docs/PHASE1_RUNTIME_VERIFICATION.md` | Không hardcode kết quả test; toàn bộ lệnh được chạy thật và ghi nhận nhật ký đầy đủ. | • Nhật ký terminal Maven, Vite, curl, Get-NetTCPConnection thực tế<br>• Dừng đúng phạm vi Phase 1 để người dùng nghiệm thu. | **ĐẠT (VERIFIED)** |

---

## Chi Tiết Truy Vết Cấu Trúc Cơ Sở Dữ Liệu Cách Ly (R3)

| Tên Database | Microservice Sở Hữu | Cổng | Cơ Chế Tham Chiếu Liên Miền (Scalar ID) | Quy Định Nghiệp Vụ Đặc Thù | Trạng thái Runtime |
|---|---|---|---|---|---|
| `stu_identity_db` | `identity-service` | 8081 | Gốc phát sinh `user_id`, cấp phát mã sinh viên `student_id`. | Quản lý xác thực sinh viên STU qua ảnh thẻ sinh viên. | **UP (Port 8081)** |
| `stu_listing_db` | `listing-service` | 8082 | `seller_id BIGINT` (tham chiếu logic tới `stu_identity_db.users.id`). | Quản lý danh mục hàng cũ, giá tiền, ảnh, tình trạng đồ dùng. | **UP (Port 8082)** |
| `stu_interaction_db` | `interaction-service` | 8083 | `user_id BIGINT`, `listing_id BIGINT`, `sender_id BIGINT`. | Bình luận sản phẩm, yêu thích tin đăng, tin nhắn trao đổi. | **UP (Port 8083)** |
| `stu_transaction_db` | `transaction-service` | 8084 | `buyer_id BIGINT`, `seller_id BIGINT`, `listing_id BIGINT`. | Lịch hẹn gặp trao đổi trên khuôn viên STU; KHÔNG xử lý tiền. | **UP (Port 8084)** |
| `stu_moderation_db` | `moderation-service` | 8085 | `reporter_id BIGINT`, `target_id BIGINT` (đa hình). | Báo cáo lừa đảo, lọc từ khóa cấm, biên bản xử lý của mod. | **UP (Port 8085)** |
| `stu_billing_db` | `billing-service` | 8086 | `user_id BIGINT`, `listing_id BIGINT`. | **Chỉ thu phí đăng tin & gói đẩy bài.** Không có ví trung gian SV. | **UP (Port 8086)** |
