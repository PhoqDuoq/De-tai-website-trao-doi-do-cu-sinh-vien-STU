# Sàn Trao Đổi Đồ Dùng Cũ STU — Monorepo

Hệ thống nền tảng trao đổi đồ dùng cũ dành cho sinh viên **Trường Đại Học Công Nghệ Sài Gòn (STU)**.  
Dự án được xây dựng theo kiến trúc **Microservices Monorepo** sử dụng **Java 21 LTS**, **Spring Boot 3.3.5**, **Spring Cloud Gateway**, **MySQL 8+ trên WampServer**, và giao diện **React 18 + Vite + Tailwind CSS**.

---

## 1. Tổng Quan Kiến Trúc Hệ Thống (System Architecture)

```
                            ┌─────────────────────────────────────────┐
                            │    Frontend Single Page Application     │
                            │       (React 18 + Vite + Tailwind)      │
                            │           http://localhost:5173         │
                            └────────────────────┬────────────────────┘
                                                 │ HTTP / REST
                                                 ▼
                            ┌─────────────────────────────────────────┐
                            │      Spring Cloud API Gateway           │
                            │           Port: 8080 (Netty)            │
                            │      CORS, Routing, JWT Validation      │
                            └────┬─────┬─────┬─────┬─────┬──────┬─────┘
                                 │     │     │     │     │      │
             ┌───────────────────┘     │     │     │     │      └──────────────────┐
             ▼                         ▼     ▼     ▼     ▼                         ▼
   ┌──────────────────┐   ┌─────────┐┌─────────┐┌─────────┐┌─────────┐   ┌──────────────────┐
   │ identity-service │   │ listing ││ interact││ transact││ moderate│   │ billing-service  │
   │    Port: 8081    │   │ : 8082  ││ : 8083  ││ : 8084  ││ : 8085  │   │    Port: 8086    │
   └─────────┬────────┘   └───┬─────┘└───┬─────┘└───┬─────┘└───┬─────┘   └────────┬─────────┘
             │                │          │          │          │                   │
             ▼                ▼          ▼          ▼          ▼                   ▼
      stu_identity_db    stu_listing  stu_inter  stu_trans  stu_moder     stu_billing_db
                          _db         action_db  action_db   ation_db
             └───────────────────────────┬─────────────────────────────────────────┘
                                         ▼
                            WampServer MySQL 8.4+ (Port 3306)
                     [Strict Isolation: 0 Cross-DB Foreign Keys / Joins]
```

---

## 2. Danh Mục Dịch Vụ & Cổng Kết Nối (Port Directory)

| Dịch vụ / Module | Port | Trách nhiệm chính | Database Schema (Port 3306) |
|---|---|---|---|
| **`frontend/`** | `5173` | Giao diện người dùng Web SPA (Vite + React 18 + Tailwind) | N/A (Gọi qua Gateway) |
| **`api-gateway`** | `8080` | Điểm vào duy nhất (Reverse Proxy, CORS, Netty reactive) | N/A |
| **`identity-service`** | `8081` | Xác thực sinh viên STU, thẻ SV, cấp phát JWT, phân quyền | `stu_identity_db` |
| **`listing-service`** | `8082` | Danh mục hàng cũ, đăng tin, hình ảnh, phân loại đồ dùng | `stu_listing_db` |
| **`interaction-service`** | `8083` | Tin nhắn trao đổi (Chat), bình luận sản phẩm, yêu thích | `stu_interaction_db` |
| **`transaction-service`** | `8084` | Lịch hẹn gặp trao đổi trên khuôn viên STU, tiến trình giao dịch | `stu_transaction_db` |
| **`moderation-service`** | `8085` | Báo cáo lừa đảo, lọc từ khóa cấm, kiểm duyệt tin vi phạm | `stu_moderation_db` |
| **`billing-service`** | `8086` | Thu phí đăng tin & gói đẩy bài viết (KHÔNG thanh toán SV) | `stu_billing_db` |
| **`stu-common`** | N/A | Thư viện dùng chung (ApiResponse, ErrorCode, AppException) | N/A (Shared Library) |

---

## 3. Nguyên Tắc Thiết Kế Cốt Lõi (Architectural Invariants per R3)

1. **Cách ly cơ sở dữ liệu tuyệt đối (Strict Database Isolation)**:
   - Mỗi microservice sở hữu và kết nối duy nhất vào schema cơ sở dữ liệu riêng của nó trên WampServer MySQL (`localhost:3306`).
   - **Nghiêm cấm** sử dụng `FOREIGN KEY` liên schema (ví dụ: `stu_listing_db.listings` không tạo FK vật lý trỏ sang `stu_identity_db.users`).
   - **Nghiêm cấm** sử dụng câu lệnh SQL `JOIN` chéo database.
   - Các thực thể liên quan được lưu dưới dạng khóa logic nguyên bản (scalar ID: `user_id BIGINT`, `listing_id BIGINT`). Tính toàn vẹn dữ liệu được đảm bảo thông qua tầng ứng dụng hoặc REST API.
2. **Phạm vi Billing Service (Listing Fees Only)**:
   - `billing-service` và `stu_billing_db` chỉ xử lý các giao dịch thu phí dịch vụ nền tảng (phí đăng tin nổi bật, gói đẩy tin VIP).
   - **Nghiêm cấm** triển khai ví điện tử hoặc luồng thanh toán tiền giữa sinh viên với sinh viên. Việc trao đổi đồ và thanh toán hàng hóa diễn ra trực tiếp khi gặp mặt tại trường (tiền mặt / trao đổi ngang giá).

---

## 4. Yêu Cầu Môi Trường (Prerequisites)

- **Hệ điều hành**: Windows 10/11 x64
- **Java Development Kit**: Java 21 LTS (OpenJDK / Eclipse Temurin 21.0.13+)
- **Build Tool**: Apache Maven 3.9+
- **Node.js**: v18.0.0+ hoặc v20+ (đã kiểm thử tương thích v26.13.0)
- **Cơ sở dữ liệu**: WampServer MySQL 8.4+ (Port 3306)

---

## 5. Cấu Hình & Cài Đặt (Setup Guide)

### Bước 1: Khởi tạo tệp môi trường
Sao chép `.env.example` thành `.env` tại thư mục gốc:
```powershell
Copy-Item .env.example .env
```

### Bước 2: Khởi tạo Cơ sở dữ liệu MySQL trên WampServer
Đảm bảo dịch vụ MySQL trên WampServer đang chạy tại cổng `3306`.  
Nạp 6 tệp DDL tại thư mục `docs/database/`:
```powershell
mysql -u root -p < docs/database/stu_identity_db.sql
mysql -u root -p < docs/database/stu_listing_db.sql
mysql -u root -p < docs/database/stu_interaction_db.sql
mysql -u root -p < docs/database/stu_transaction_db.sql
mysql -u root -p < docs/database/stu_moderation_db.sql
mysql -u root -p < docs/database/stu_billing_db.sql
```

---

## 6. Hướng Dẫn Biên Dịch & Chạy (Build & Run Guide)

### 6.1 Biên dịch toàn bộ Backend (Maven Multi-Module)
Chạy lệnh sau tại thư mục gốc:
```powershell
mvn clean compile
```
Để đóng gói thành các tệp `.jar`:
```powershell
mvn clean package -DskipTests
```

### 6.2 Cài đặt & Biên dịch Frontend React
Chuyển vào thư mục `frontend`:
```powershell
cd frontend
npm install
npm run build
```
Kết quả build sạch sẽ được tạo ra tại thư mục `frontend/dist/`.

### 6.3 Khởi chạy hệ thống trong môi trường phát triển (Development)

**1. Khởi chạy API Gateway (Port 8080):**
```powershell
cd api-gateway
mvn spring-boot:run
```

**2. Khởi chạy các Microservices:**
Mở các terminal riêng biệt cho từng service:
```powershell
cd identity-service ; mvn spring-boot:run     # Port 8081
cd listing-service ; mvn spring-boot:run      # Port 8082
cd interaction-service ; mvn spring-boot:run  # Port 8083
cd transaction-service ; mvn spring-boot:run  # Port 8084
cd moderation-service ; mvn spring-boot:run   # Port 8085
cd billing-service ; mvn spring-boot:run      # Port 8086
```

**3. Khởi chạy Frontend Dev Server (Port 5173):**
```powershell
cd frontend
npm run dev
```
Truy cập trình duyệt tại: `http://localhost:5173`. Các yêu cầu đến `/api/*` sẽ được Vite tự động chuyển tiếp tới API Gateway tại `http://localhost:8080`.

---

## 7. Cấu Trúc Mã Nguồn Monorepo (Code Layout)

```
San trao doi do dung cu/
├── .env.example
├── .gitignore
├── pom.xml                                   # Root Maven Multi-Module
├── README.md
├── docs/
│   ├── IMPLEMENTATION_PROGRESS.md            # Tiến độ triển khai 4 pha
│   ├── REQUIREMENTS_TRACEABILITY.md          # Ma trận truy vết yêu cầu R1-R4
│   └── database/                             # 6 tệp DDL chuẩn hóa
│       ├── stu_identity_db.sql
│       ├── stu_listing_db.sql
│       ├── stu_interaction_db.sql
│       ├── stu_transaction_db.sql
│       ├── stu_moderation_db.sql
│       └── stu_billing_db.sql
├── stu-common/                               # Thư viện dùng chung
├── api-gateway/                              # Spring Cloud Gateway (8080)
├── identity-service/                         # Microservice Xác thực (8081)
├── listing-service/                          # Microservice Đăng tin (8082)
├── interaction-service/                      # Microservice Tương tác & Chat (8083)
├── transaction-service/                      # Microservice Hẹn gặp giao dịch (8084)
├── moderation-service/                       # Microservice Kiểm duyệt (8085)
├── billing-service/                          # Microservice Phí đăng tin (8086)
└── frontend/                                 # Giao diện React Vite Tailwind (5173)
```
