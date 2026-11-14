# Requirements Traceability Matrix — STU Marketplace

Dự án: **Sàn Trao Đổi Đồ Dùng Cũ STU (Monorepo Microservices)**  
Mục đích: Đối chiếu và truy vết các yêu cầu từ Đặc tả đề tài (R1 - R4) sang các thành phần kỹ thuật, cấu hình, và bằng chứng kiểm thử thực tế.

---

## Bảng Đối Chiếu Ma Trận Yêu Cầu (Traceability Matrix)

| Mã YC | Mô tả yêu cầu nghiệp vụ | Thành phần triển khai (Artifacts) | Ràng buộc kiến trúc & Kỹ thuật | Bằng chứng kiểm định (Verification Evidence) | Trạng thái |
|---|---|---|---|---|---|
| **R1** | Kiểm tra hiện trạng repository, tài liệu luận văn và 6 schema SQL; báo cáo chính xác tệp thiếu. | • Khởi tạo Git repo (`.git`)<br>• `.gitignore`<br>• Khảo sát môi trường và baseline survey báo cáo đầy đủ hiện trạng. | Không giả định có sẵn tệp tài liệu hay DDL; lập danh sách chi tiết các tệp thiếu. | • `git status` xác nhận repo sạch<br>• Khảo sát thực tế thư mục rỗng và báo cáo rõ trong tài liệu tiến độ. | **ĐẠT (VERIFIED)** |
| **R2** | Thiết lập kiến trúc nền tảng Monorepo Maven multi-module (Java 21, Spring Boot 3.x, Spring Cloud) với API Gateway và React Frontend (Vite, Tailwind CSS); `.env.example` và `README.md`. | • Root `pom.xml`<br>• `stu-common/`<br>• `api-gateway/`<br>• 6 Service modules<br>• `frontend/`<br>• `.env.example`<br>• `README.md` | • Java 21 LTS<br>• Spring Boot 3.3.5 & Spring Cloud 2023.0.3<br>• Loại trừ Tomcat khỏi Gateway (chạy Netty reactive)<br>• React 18, Vite 5, Tailwind CSS 3 | • `mvn clean compile` thành công 100% (9/9 modules)<br>• `npm run build` tạo thành công thư mục `dist/` với 0 lỗi. | **ĐẠT (VERIFIED)** |
| **R3** | Cách ly nghiêm ngặt 6 cơ sở dữ liệu trên MySQL 8+ (WampServer); không có foreign key liên DB hoặc SQL JOIN chéo; Billing Service chỉ thu phí đăng tin (không trung gian tiền SV). | • 6 tệp DDL tại `docs/database/*.sql`<br>• Cấu hình datasource độc lập trong từng `application.yml`<br>• `DatabaseConstants.java` | • Mỗi service kết nối 1 DB duy nhất<br>• 0 Foreign Key liên database<br>• 0 SQL JOIN chéo database<br>• Billing chỉ thu phí tin đăng | • Rà soát 100% cú pháp DDL không chứa cross-schema FK<br>• Kiểm tra cấu hình `application.yml` từng service độc lập. | **ĐẠT (VERIFIED)** |
| **R4** | Duy trì tài liệu theo dõi tiến độ và ma trận truy vết; trung thực trong kiểm thử (không tạo code giả/mock giả mạo kết quả); dừng sau Phase 1. | • `docs/IMPLEMENTATION_PROGRESS.md`<br>• `docs/REQUIREMENTS_TRACEABILITY.md`<br>• Báo cáo handoff chi tiết | Không hardcode kết quả test; lệnh build được chạy thật và ghi nhận nhật ký đầy đủ. | • Nhật ký terminal Maven và Vite thực tế<br>• Dừng đúng phạm vi Phase 1 để người dùng nghiệm thu. | **ĐẠT (VERIFIED)** |

---

## Chi Tiết Truy Vết Cấu Trúc Cơ Sở Dữ Liệu Cách Ly (R3)

| Tên Database | Microservice Sở Hữu | Cổng | Cơ Chế Tham Chiếu Liên Miền (Scalar ID) | Quy Định Nghiệp Vụ Đặc Thù |
|---|---|---|---|---|
| `stu_identity_db` | `identity-service` | 8081 | Gốc phát sinh `user_id`, cấp phát mã sinh viên `student_id`. | Quản lý xác thực sinh viên STU qua ảnh thẻ sinh viên. |
| `stu_listing_db` | `listing-service` | 8082 | `seller_id BIGINT` (tham chiếu logic tới `stu_identity_db.users.id`). | Quản lý danh mục hàng cũ, giá tiền, ảnh, tình trạng đồ dùng. |
| `stu_interaction_db` | `interaction-service` | 8083 | `user_id BIGINT`, `listing_id BIGINT`, `sender_id BIGINT`. | Bình luận sản phẩm, yêu thích tin đăng, tin nhắn trao đổi. |
| `stu_transaction_db` | `transaction-service` | 8084 | `buyer_id BIGINT`, `seller_id BIGINT`, `listing_id BIGINT`. | Lịch hẹn gặp trao đổi trên khuôn viên STU; KHÔNG xử lý tiền. |
| `stu_moderation_db` | `moderation-service` | 8085 | `reporter_id BIGINT`, `target_id BIGINT` (đa hình). | Báo cáo lừa đảo, lọc từ khóa cấm, biên bản xử lý của mod. |
| `stu_billing_db` | `billing-service` | 8086 | `user_id BIGINT`, `listing_id BIGINT`. | **Chỉ thu phí đăng tin & gói đẩy bài.** Không có ví trung gian SV. |
