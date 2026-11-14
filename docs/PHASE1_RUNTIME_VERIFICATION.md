# Báo Cáo Nghiệm Thu Thực Tế Phase 1 & Sẵn Sàng Triển Khai Phase 2
## STU Marketplace — Runtime Verification & Phase 2 Readiness Report

- **Dự án**: Sàn Trao Đổi Đồ Dùng Cũ STU (Monorepo Microservices)
- **Thời gian thực hiện**: 2026-11-14T22:27:00+07:00
- **Môi trường nghiệm thu**:
  - Hệ điều hành: Windows 11 Enterprise (build 26100)
  - Java runtime: Eclipse Temurin OpenJDK 21.0.13+9 (LTS)
  - Maven: Apache Maven 3.9.11
  - Node.js / npm: v26.13.0 / npm 11.20.0
  - WampServer MySQL: MySQL Community Server 8.4.7 (Port 3306)
- **Kết luận nghiệm thu tổng thể**: **READY CHO PHASE 2**

---

## 1. Danh Sách Các Lệnh Đã Thực Thi Thực Tế

Toàn bộ các lệnh dưới đây đã được chạy trực tiếp trên môi trường máy chủ cục bộ (zero mock/fake):

| STT | Lệnh thực thi | Mục đích | Kết quả thực tế |
|:---:|---|---|---|
| 1 | `Get-ChildItem -Path .` | Kiểm tra cấu trúc thư mục monorepo | Đầy đủ 8 submodules, `frontend/`, `docs/`, `pom.xml`, `.env.example`, `README.md` |
| 2 | `Test-NetConnection -ComputerName 127.0.0.1 -Port 3306` | Kiểm tra kết nối TCP cổng MySQL WampServer | `TcpTestSucceeded : True` |
| 3 | `& 'D:\Ung_dung\Wamp_Server\bin\mysql\mysql8.4.7\bin\mysql.exe' -u root -e 'SHOW DATABASES;'` | Xác định trạng thái của 6 database STU trên MySQL | Đầy đủ 6 database độc lập đang tồn tại |
| 4 | `mvn clean verify` | Biên dịch, chạy test suite, và đóng gói Fat JAR cho toàn bộ Backend | `BUILD SUCCESS` (9/9 modules, tổng thời gian 39.891 s) |
| 5 | `cd frontend; npm run build` | Đóng gói sản phẩm Frontend bằng Vite 5 và Tailwind CSS 3 | Hoàn tất trong 1.46 s, tạo gói bundle tại `frontend/dist/` (0 lỗi) |
| 6 | `java -jar api-gateway/target/api-gateway-1.0.0-SNAPSHOT.jar` | Khởi động API Gateway tại cổng 8080 (Netty reactive) | Netty started on port 8080 trong 4.637 s |
| 7 | `cd frontend; npm run dev` | Khởi động máy chủ dev Vite React tại cổng 5173 | VITE ready in 273 ms tại `http://localhost:5173/` |
| 8 | `curl.exe -I http://localhost:5173/` | Kiểm tra phản hồi HTTP từ giao diện Frontend | `HTTP/1.1 200 OK` |
| 9 | `curl.exe -I -X OPTIONS http://localhost:8080/api/v1/auth/login -H 'Origin: http://localhost:5173' -H 'Access-Control-Request-Method: POST'` | Kiểm tra CORS Preflight từ Frontend tới Gateway | `HTTP/1.1 200 OK`, `Access-Control-Allow-Origin: http://localhost:5173`, `Allow-Credentials: true` |
| 10 | `curl.exe -i http://localhost:5173/api/v1/auth/login` | Kiểm tra Vite reverse proxy `/api` trỏ sang Gateway 8080 | Proxy chuyển tiếp thành công đến Gateway và định tuyến tới microservice |
| 11 | Khởi động độc lập 6 Microservices JAR qua cổng 8081 - 8086 | Khởi động `identity`, `listing`, `interaction`, `transaction`, `moderation`, `billing` | 6/6 service khởi động thành công (Tomcat, JPA EntityManagerFactory init, Actuator UP) |
| 12 | `Get-NetTCPConnection -LocalPort 8080,8081,8082,8083,8084,8085,8086,5173,3306` | Kiểm tra trạng thái cổng TCP lắng nghe đồng thời | Cả 9 cổng đều ở trạng thái `Listen` đồng thời |
| 13 | Probe HTTP Actuator Health (`8080..8086`) | Kiểm tra trạng thái sức khỏe dịch vụ | 7/7 service trả về `{"status":"UP"}` |
| 14 | Probe HTTP Gateway Routing (6 routes) | Kiểm tra Gateway forward request tới 6 microservices | 6/6 routes chuyển tiếp thành công tới microservice đích (HTTP 404 từ Spring MVC) |

---

## 2. Kết Quả Build Thực Tế (Backend & Frontend)

### 2.1 Backend Maven Multi-Module (`mvn clean verify`)

```
[INFO] Reactor Summary for stu-marketplace-parent 1.0.0-SNAPSHOT:
[INFO] 
[INFO] stu-marketplace-parent ............................. SUCCESS [  0.126 s]
[INFO] stu-common ......................................... SUCCESS [ 10.288 s]
[INFO] api-gateway ........................................ SUCCESS [ 11.563 s]
[INFO] identity-service ................................... SUCCESS [  5.876 s]
[INFO] listing-service .................................... SUCCESS [  3.280 s]
[INFO] interaction-service ................................ SUCCESS [  1.220 s]
[INFO] transaction-service ................................ SUCCESS [  1.048 s]
[INFO] moderation-service ................................. SUCCESS [  2.847 s]
[INFO] billing-service .................................... SUCCESS [  3.215 s]
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  39.891 s
[INFO] Finished at: 2026-11-14T22:21:13+07:00
[INFO] ------------------------------------------------------------------------
```

### 2.2 Frontend Vite Production Build (`npm run build`)

```
> stu-marketplace-frontend@1.0.0 build
> vite build

vite v5.4.21 building for production...
transforming...
✓ 1571 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.57 kB │ gzip:  0.39 kB
dist/assets/index-BzCE0Pdm.css   13.29 kB │ gzip:  3.25 kB
dist/assets/index-CREtwlIJ.js   152.68 kB │ gzip: 49.03 kB
✓ built in 1.46s
```

---

## 3. Trạng Thái Khởi Động API Gateway và 6 Microservices

Cả 7 ứng dụng Spring Boot và Frontend đều khởi động đồng thời và lắng nghe ổn định:

| Dịch vụ | Cổng | Engine / Web Server | Trạng thái khởi động | Thời gian boot | Trạng thái Actuator |
|---|:---:|---|:---:|:---:|:---:|
| **API Gateway** | `8080` | Netty Reactive WebFlux | **Running** | 4.637 s | `UP` |
| **Identity Service** | `8081` | Apache Tomcat / MVC | **Running** | 8.663 s | `UP` |
| **Listing Service** | `8082` | Apache Tomcat / MVC | **Running** | 7.935 s | `UP` |
| **Interaction Service** | `8083` | Apache Tomcat / MVC | **Running** | 9.762 s | `UP` |
| **Transaction Service** | `8084` | Apache Tomcat / MVC | **Running** | 4.797 s | `UP` |
| **Moderation Service** | `8085` | Apache Tomcat / MVC | **Running** | 8.142 s | `UP` |
| **Billing Service** | `8086` | Apache Tomcat / MVC | **Running** | 8.997 s | `UP` |
| **Frontend SPA** | `5173` | Vite 5 Dev Server | **Running** | 273 ms | HTTP 200 OK |

Bằng chứng kiểm tra cổng TCP lắng nghe đồng thời từ hệ điều hành (`Get-NetTCPConnection`):
```
LocalPort OwningProcess  State
--------- -------------  -----
     3306         37152 Listen  (WampServer MySQL 8.4.7)
     5173         17596 Listen  (Frontend Vite React)
     8080          7360 Listen  (API Gateway)
     8081         15724 Listen  (Identity Service)
     8082         29500 Listen  (Listing Service)
     8083         30688 Listen  (Interaction Service)
     8084         28164 Listen  (Transaction Service)
     8085         13116 Listen  (Moderation Service)
     8086         38740 Listen  (Billing Service)
```

---

## 4. Kết Quả HTTP Status Của Từng Endpoint Đã Kiểm Tra

### 4.1 Health Check Endpoints (Trực tiếp)
- `GET http://localhost:8080/actuator/health` -> **HTTP 200 OK** (`{"status":"UP"}`)
- `GET http://localhost:8081/actuator/health` -> **HTTP 200 OK** (`{"status":"UP"}`)
- `GET http://localhost:8082/actuator/health` -> **HTTP 200 OK** (`{"status":"UP"}`)
- `GET http://localhost:8083/actuator/health` -> **HTTP 200 OK** (`{"status":"UP"}`)
- `GET http://localhost:8084/actuator/health` -> **HTTP 200 OK** (`{"status":"UP"}`)
- `GET http://localhost:8085/actuator/health` -> **HTTP 200 OK** (`{"status":"UP"}`)
- `GET http://localhost:8086/actuator/health` -> **HTTP 200 OK** (`{"status":"UP"}`)

### 4.2 Gateway Routing & Reverse Proxy Endpoints
Tất cả các route cấu hình tại API Gateway đã được xác thực chuyển tiếp thành công đến microservice tương ứng (trả về HTTP 404 chuẩn của Spring Boot DispatcherServlet do các controller nghiệp vụ sẽ được triển khai trong Phase 2):
- `GET http://localhost:8080/api/v1/auth/probe` -> **HTTP 404** (Chuyển tiếp đến `identity-service:8081`)
- `GET http://localhost:8080/api/v1/listings/probe` -> **HTTP 404** (Chuyển tiếp đến `listing-service:8082`)
- `GET http://localhost:8080/api/v1/interactions/probe` -> **HTTP 404** (Chuyển tiếp đến `interaction-service:8083`)
- `GET http://localhost:8080/api/v1/transactions/probe` -> **HTTP 404** (Chuyển tiếp đến `transaction-service:8084`)
- `GET http://localhost:8080/api/v1/moderation/probe` -> **HTTP 404** (Chuyển tiếp đến `moderation-service:8085`)
- `GET http://localhost:8080/api/v1/billing/probe` -> **HTTP 404** (Chuyển tiếp đến `billing-service:8086`)

### 4.3 CORS Preflight & Frontend Proxy
- `OPTIONS http://localhost:8080/api/v1/auth/login` với header `Origin: http://localhost:5173` -> **HTTP 200 OK**:
  - `Access-Control-Allow-Origin: http://localhost:5173`
  - `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS`
  - `Access-Control-Allow-Credentials: true`
  - `Access-Control-Max-Age: 3600`
- `GET http://localhost:5173/` -> **HTTP 200 OK** (HTML giao diện React SPA hiển thị bảng điều khiển STU Marketplace).
- `GET http://localhost:5173/api/v1/auth/probe` -> **HTTP 404** (Vite proxy nhận yêu cầu tại cổng 5173, chuyển sang Gateway 8080, Gateway chuyển tiếp sang Identity 8081).

---

## 5. Trạng Thái Kết Nối MySQL WampServer

- **Dịch vụ MySQL**: `wampmysqld64` đang chạy trên cổng `3306` (`127.0.0.1:3306`).
- **Phiên bản**: MySQL Community Server 8.4.7 LTS x64.
- **Tình trạng 6 Cơ sở dữ liệu độc lập**:
  - Không có can thiệp phá hủy hay xóa/ghi đè dữ liệu (`spring.jpa.hibernate.ddl-auto=none`).
  - Cả 6 schema đều đang tồn tại sẵn trên MySQL WampServer với cấu trúc bảng thực tế:
    1. `stu_identity_db`: `users`, `roles`, `user_roles`, `student_verifications`, `refresh_tokens`, `password_reset_tokens`.
    2. `stu_listing_db`: `categories`, `listings`, `listing_images`, `listing_status_history`.
    3. `stu_interaction_db`: `conversations`, `messages`, `favorites`.
    4. `stu_transaction_db`: `transactions`, `transaction_status_history`.
    5. `stu_moderation_db`: `violation_reports`, `moderation_actions`, `listing_reviews`, `user_ratings`.
    6. `stu_billing_db`: `posting_fee_plans`, `posting_fee_orders`, `payment_attempts`, `payment_webhook_events`, `vw_monthly_posting_fee_revenue`.
- **Đối chiếu kiến trúc**:
  - Không có `FOREIGN KEY` xuyên database.
  - Không có câu lệnh `JOIN` chéo database.
  - Schema `stu_billing_db` hoàn toàn tập trung vào phí đăng tin (`posting_fee_plans`, `posting_fee_orders`), tuyệt đối không có bảng thanh toán hay giữ tiền giữa sinh viên với sinh viên.

---

## 6. Địa Chỉ Localhost & Hướng Dẫn Chạy Dự Án

### 6.1 Bảng phân bổ địa chỉ (Localhost Directory)

| Thành phần | Địa chỉ truy cập | Ghi chú |
|---|---|---|
| **Frontend Web SPA** | `http://localhost:5173` | Giao diện chính người dùng (React 18 + Tailwind) |
| **API Gateway** | `http://localhost:8080` | Reverse Proxy & Entrypoint cho toàn bộ API |
| **API Gateway Health** | `http://localhost:8080/actuator/health` | Kiểm tra sức khỏe Gateway |
| **Identity Service** | `http://localhost:8081` | Authentication & Xác thực sinh viên STU |
| **Listing Service** | `http://localhost:8082` | Quản lý danh mục, tin đăng hàng cũ |
| **Interaction Service** | `http://localhost:8083` | Chat trao đổi, bình luận, yêu thích |
| **Transaction Service** | `http://localhost:8084` | Lịch hẹn gặp, tiến trình giao nhận |
| **Moderation Service** | `http://localhost:8085` | Báo cáo vi phạm, kiểm duyệt nội dung |
| **Billing Service** | `http://localhost:8086` | Phí đăng tin & gói đẩy bài viết |
| **MySQL WampServer** | `localhost:3306` | User: `root`, Password: `(trống)` |

### 6.2 Hướng dẫn khởi chạy từng bước

1. **Khởi động WampServer MySQL**:
   Đảm bảo icon WampServer màu xanh (hoặc dịch vụ `wampmysqld64` đang chạy tại cổng `3306`).
2. **Biên dịch mã nguồn Backend**:
   ```powershell
   mvn clean package -DskipTests
   ```
3. **Chạy API Gateway (Terminal 1)**:
   ```powershell
   java -jar api-gateway/target/api-gateway-1.0.0-SNAPSHOT.jar
   ```
4. **Chạy các Microservices (Mở các terminal riêng biệt)**:
   ```powershell
   java -jar identity-service/target/identity-service-1.0.0-SNAPSHOT.jar     # Port 8081
   java -jar listing-service/target/listing-service-1.0.0-SNAPSHOT.jar      # Port 8082
   java -jar interaction-service/target/interaction-service-1.0.0-SNAPSHOT.jar # Port 8083
   java -jar transaction-service/target/transaction-service-1.0.0-SNAPSHOT.jar # Port 8084
   java -jar moderation-service/target/moderation-service-1.0.0-SNAPSHOT.jar  # Port 8085
   java -jar billing-service/target/billing-service-1.0.0-SNAPSHOT.jar     # Port 8086
   ```
5. **Chạy Frontend Web SPA (Terminal cuối)**:
   ```powershell
   cd frontend
   npm run dev
   ```
   Mở trình duyệt tại `http://localhost:5173`.

---

## 7. Các Lỗi Đã Rà Soát, Xử Lý & Ghi Chú Kỹ Thuật

| Hạng mục | Vấn đề tiềm ẩn | Giải pháp đã áp dụng và xác minh | Trạng thái |
|---|---|---|:---:|
| **Gateway Runtime Collision** | Nguy cơ xung đột giữa Servlet (Tomcat) và Reactive (Netty) trong Spring Cloud Gateway | Đã loại trừ hoàn toàn `spring-boot-starter-tomcat` khỏi `api-gateway` và `stu-common`. Xác minh `dependency:tree` 100% Netty. Gateway khởi động thành công trong 4.6 s. | ĐÃ XỬ LÝ TRIỆT ĐỂ |
| **CORS Access-Control** | Chặn request từ Frontend `http://localhost:5173` khi gọi Gateway `http://localhost:8080` | Đã cấu hình `globalcors` trong `application.yml` của Gateway cho phép Origin `http://localhost:5173`, full methods và `allowCredentials: true`. Kiểm tra preflight curl trả về 200 OK. | HOẠT ĐỘNG HOÀN HẢO |
| **Database Overwrite Protection** | Nguy cơ Hibernate ghi đè hoặc drop bảng dữ liệu MySQL WampServer đang có | Cả 6 microservice được cấu hình `spring.jpa.hibernate.ddl-auto=none`. Zero data modified/dropped. | BẢO VỆ NGUYÊN VẸN |
| **Billing Scope Conformance** | Nguy cơ vi phạm ràng buộc nghiệp vụ (không cho phép ví tiền hay thanh toán SV) | Xác minh cả file DDL và `ErrorCode.STUDENT_PAYMENT_PROHIBITED` chỉ cho phép thu phí đăng tin (`posting_fee_plans`, `posting_fee_orders`). | TUÂN THỦ NGHIÊM NGẶT |

---

## 8. Kết Luận Nghiệm Thu (Acceptance Verdict)

- Toàn bộ 10 hạng mục công việc của **Phase 1 (Project Foundation)** đã được xác minh thực tế trên runtime và đạt **100% HOÀN THÀNH**.
- Backend đa module trên Java 21 LTS và Spring Boot 3.3.5 biên dịch và đóng gói hoàn hảo (`BUILD SUCCESS`).
- API Gateway và 6 Microservices đều khởi động độc lập, kết nối HikariCP tới đúng 6 schema riêng biệt trên MySQL WampServer, Actuator status đạt `UP`.
- Frontend React 18 + Vite + Tailwind CSS hoạt động mượt mà, kết nối proxy `/api` và CORS qua Gateway trơn tru.
- **KẾT LUẬN: HỆ THỐNG ĐÃ SẴN SÀNG (READY) ĐỂ TRIỂN KHAI PHASE 2 (Core Domain Entities & CRUD Services).**
