# API Contracts & Specification — STU Marketplace

Dự án: **Sàn Trao Đổi Đồ Dùng Cũ STU (Monorepo Microservices)**  
Giai đoạn: **Phase 2 – Core Domain Microservices & JPA Persistence**  
Phạm vi: **Identity Service (Port 8081) & Listing Service (Port 8082)** thông qua **API Gateway (Port 8080)**  
Thời gian cập nhật: **2026-11-14T23:10:00+07:00**

---

## 1. Quy Chuẩn Giao Thức Chung

### 1.1 Base URL & Routing Entrypoint
- Toàn bộ client gọi qua **API Gateway**: `http://localhost:8080`
- CORS Preflight được cấu hình cho origin: `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000` (hỗ trợ `allowCredentials: true`).

### 1.2 Unified Response Envelope
Mọi phản hồi từ hệ thống đều tuân thủ cấu trúc envelope:

```json
{
  "success": true,
  "code": 200,
  "message": "Operation successful",
  "data": {},
  "timestamp": "2026-11-14T23:00:00Z"
}
```

Trường hợp lỗi:
```json
{
  "success": false,
  "code": 1001,
  "message": "Email already exists in system",
  "data": null,
  "timestamp": "2026-11-14T23:00:00Z"
}
```

Trường hợp Bean Validation thất bại (HTTP 400):
```json
{
  "success": false,
  "code": 400,
  "message": "Validation failed",
  "data": {
    "email": "Invalid STU email format",
    "password": "Password must be at least 8 characters"
  },
  "timestamp": "2026-11-14T23:00:00Z"
}
```

### 1.3 JWT Authentication
- Header: `Authorization: Bearer <access_token>`
- Token Algorithm: HMAC-SHA512
- Expiration: 24 giờ (86400000 ms)
- Claims chứa: `sub` (User ID), `email`, `studentCode`, `roles` (`ROLE_STUDENT`, `ROLE_MODERATOR`, `ROLE_ADMIN`).

---

## 2. Identity Service Endpoints (`/api/v1/auth/**`, `/api/v1/users/**`, `/api/v1/students/**`)

### 2.1 Đăng ký tài khoản sinh viên
- **Endpoint**: `POST /api/v1/auth/register`
- **Quyền hạn**: Public
- **Request Body**:
  ```json
  {
    "email": "sinhvien@stu.edu.vn",
    "password": "Password123!",
    "fullName": "Nguyen Van A",
    "studentCode": "DH52001234",
    "phone": "0901234567"
  }
  ```
- **Validation Rules**:
  - `email`: Not blank, đúng định dạng email, khuyến nghị đuôi `@stu.edu.vn`.
  - `password`: Tối thiểu 8 ký tự, có chữ hoa, chữ thường, chữ số và ký tự đặc biệt.
  - `studentCode`: Không trùng lặp, độ dài tối đa 20 ký tự.
- **Response**: HTTP 200 OK trả về `AuthResponse` chứa access token, refresh token và profile user.

### 2.2 Đăng nhập hệ thống
- **Endpoint**: `POST /api/v1/auth/login`
- **Quyền hạn**: Public
- **Request Body**:
  ```json
  {
    "emailOrStudentCode": "sinhvien@stu.edu.vn",
    "password": "Password123!"
  }
  ```
- **Response**: HTTP 200 OK trả về `AuthResponse` với access token mới và thu hồi các token cũ.

### 2.3 Làm mới Token (Token Rotation)
- **Endpoint**: `POST /api/v1/auth/refresh-token`
- **Quyền hạn**: Public
- **Request Body**:
  ```json
  {
    "refreshToken": "xCMRJ-GGDmLAGhh6hqu6Fo-lGNp6d1uyPsoYt1YbsQs"
  }
  ```
- **Response**: HTTP 200 OK với access token mới; refresh token cũ lập tức bị đánh dấu `revoked_at`.

### 2.4 Quên mật khẩu & Đặt lại mật khẩu
- **Yêu cầu mã đặt lại**: `POST /api/v1/auth/forgot-password`
  - Body: `{"email": "sinhvien@stu.edu.vn"}`
- **Đặt lại mật khẩu**: `POST /api/v1/auth/reset-password`
  - Body: `{"token": "raw_reset_token", "newPassword": "NewPassword123!"}`

### 2.5 Quản lý hồ sơ người dùng
- **Xem thông tin bản thân**: `GET /api/v1/users/me` (Yêu cầu JWT)
- **Cập nhật hồ sơ**: `PUT /api/v1/users/profile` (Yêu cầu JWT)
  - Body: `{"fullName": "Nguyen Van B", "phone": "0987654321", "avatarUrl": "uploads/avatars/me.jpg"}`

### 2.6 Xác minh sinh viên STU
- **Gửi hồ sơ xác minh**: `POST /api/v1/students/verify` (Yêu cầu JWT)
  - Body:
    ```json
    {
      "method": "MANUAL_REVIEW",
      "evidenceReference": "uploads/verifications/the_sv_DH52009999.jpg",
      "studentCode": "DH52009999"
    }
    ```
- **Xem lịch sử xác minh của bản thân**: `GET /api/v1/students/my-verifications` (Yêu cầu JWT)
- **Danh sách chờ duyệt (Moderator/Admin)**: `GET /api/v1/students/verifications`
- **Phê duyệt/Từ chối xác minh (Moderator/Admin)**: `PATCH /api/v1/students/verifications/{id}/review`
  - Body: `{"status": "APPROVED", "rejectionReason": null}`

---

## 3. Listing Service Endpoints (`/api/v1/categories/**`, `/api/v1/listings/**`)

### 3.1 Quản lý danh mục
- **Xem toàn bộ danh mục hoạt động**: `GET /api/v1/categories` (Public)
  - Response: Danh sách `CategoryDto` (id, parentId, name, slug, isActive, createdAt).
- **Xem chi tiết danh mục**: `GET /api/v1/categories/{id}` (Public)
- **Tạo danh mục mới (Admin/Moderator)**: `POST /api/v1/categories`
  - Body: `{"name": "Đồng phục & Dụng cụ STU", "parentId": null}`

### 3.2 Tìm kiếm & Lọc tin đăng
- **Endpoint**: `GET /api/v1/listings`
- **Quyền hạn**: Public
- **Query Parameters**:
  - `keyword`: Tìm theo tiêu đề hoặc mô tả (chứa từ khóa).
  - `categoryId`: Lọc theo ID danh mục.
  - `itemCondition`: `NEW`, `LIKE_NEW`, `USED`.
  - `minPrice`, `maxPrice`: Khoảng giá lọc.
  - `page`: Trang bắt đầu (default: 0).
  - `size`: Số phần tử trên trang (default: 20).
  - `sortBy`: `createdAt`, `price`, `title` (default: `createdAt`).
  - `sortDir`: `desc`, `asc` (default: `desc`).
- **Response**: HTTP 200 OK với `PagedResponse<ListingResponse>` (chỉ trả các tin `status = 'PUBLISHED'`).

### 3.3 Xem chi tiết tin đăng
- **Endpoint**: `GET /api/v1/listings/{id}`
- **Quyền hạn**: Public (người dùng chưa đăng nhập chỉ xem được tin `PUBLISHED`; chính chủ hoặc Moderator có thể xem tin ở trạng thái `DRAFT`, `PENDING_REVIEW`, `HIDDEN`).
- **Response**: HTTP 200 OK trả về `ListingDetailResponse` bao gồm mảng ảnh và lịch sử thay đổi trạng thái (`statusHistory`).

### 3.4 Đăng tin mới
- **Endpoint**: `POST /api/v1/listings`
- **Quyền hạn**: Yêu cầu JWT
- **Request Body**:
  ```json
  {
    "categoryId": 1,
    "title": "Sách Giáo trình Giải tích 1 - STU",
    "description": "Sách còn mới 90%, không rách, đã bọc bìa kiếng cẩn thận.",
    "price": 45000,
    "itemCondition": "USED",
    "conditionPercent": 90,
    "submitForReview": true,
    "images": [
      {
        "storageKey": "uploads/listings/giai_tich_1.jpg",
        "mimeType": "image/jpeg",
        "sortOrder": 0
      }
    ]
  }
  ```
- **Business Rule**:
  - Nếu `submitForReview = true`: Tin đăng khởi tạo ở trạng thái `PENDING_REVIEW` và tạo bản ghi lịch sử trạng thái.
  - Nếu `submitForReview = false`: Khởi tạo ở trạng thái `DRAFT`.
  - Tuyệt đối không cho phép người bán tự đặt trực tiếp trạng thái `PUBLISHED`.

### 3.5 Chỉnh sửa tin đăng
- **Endpoint**: `PUT /api/v1/listings/{id}`
- **Quyền hạn**: Yêu cầu JWT (chính chủ sở hữu tin đăng).
- **Response**: HTTP 200 OK cập nhật thông tin và cập nhật danh sách ảnh.

### 3.6 Gửi kiểm duyệt tin đăng
- **Endpoint**: `POST /api/v1/listings/{id}/submit-review`
- **Quyền hạn**: Yêu cầu JWT (chính chủ sở hữu tin đăng, chuyển từ `DRAFT` hoặc `REJECTED` -> `PENDING_REVIEW`).

### 3.7 Cập nhật trạng thái bởi người bán
- **Endpoint**: `PATCH /api/v1/listings/{id}/status`
- **Quyền hạn**: Yêu cầu JWT (chính chủ sở hữu).
- **Trạng thái cho phép**: `HIDDEN` (tạm ẩn tin), `PUBLISHED` (hiện lại nếu trước đó đã được duyệt), `SOLD` (đã bán).
- **Chặn vi phạm**: Báo lỗi `LISTING_STATUS_INVALID` nếu cố tình duyệt xuất bản khi chưa qua kiểm duyệt.

### 3.8 Kiểm duyệt tin đăng (Moderator / Admin)
- **Endpoint**: `PATCH /api/v1/listings/{id}/moderate`
- **Quyền hạn**: Role `ADMIN` hoặc `MODERATOR`.
- **Request Body**:
  ```json
  {
    "status": "PUBLISHED",
    "reason": "Tin đăng phù hợp quy chế sinh viên STU"
  }
  ```
- **Trạng thái chấp nhận**: `PUBLISHED` (cập nhật `published_at = NOW()`) hoặc `REJECTED` (lưu lý do từ chối vào lịch sử).

---

## 4. Danh Mục Mã Lỗi Nghiệp Vụ (`ErrorCode`)

| Mã Lỗi | HTTP Status | Thông Điệp Lỗi | Ý Nghĩa Nghiệp Vụ |
|---|:---:|---|---|
| `1000` | 400 | User not found | Không tìm thấy tài khoản người dùng |
| `1001` | 400 | User already exists | Email đã được đăng ký trong hệ thống |
| `1002` | 401 | Invalid credentials | Email/Mã sinh viên hoặc mật khẩu không chính xác |
| `1003` | 401 | Unauthorized access | Chưa cung cấp hoặc token JWT không hợp lệ/hết hạn |
| `1004` | 403 | Access denied | Tài khoản không đủ quyền hạn truy cập |
| `1009` | 400 | Student code already exists | Mã sinh viên đã được đăng ký bởi tài khoản khác |
| `1010` | 400 | Verification already submitted | Đã có yêu cầu xác minh đang chờ duyệt |
| `1011` | 404 | Verification request not found | Không tìm thấy hồ sơ xác minh sinh viên |
| `1012` | 400 | Invalid or expired password reset token | Token đặt lại mật khẩu không hợp lệ hoặc quá hạn |
| `1013` | 400 | Refresh token not found or revoked | Refresh token không tồn tại hoặc đã bị thu hồi |
| `2000` | 404 | Listing not found | Không tìm thấy tin đăng |
| `2001` | 400 | Invalid listing status | Trạng thái chuyển đổi tin đăng không hợp lệ |
| `2002` | 403 | Unauthorized listing action | Không có quyền thao tác trên tin đăng của người khác |
| `2003` | 404 | Category not found | Danh mục không tồn tại |
| `2004` | 400 | Maximum images exceeded | Vượt quá số lượng ảnh tối đa (tối đa 10 ảnh) |
| `2006` | 400 | Category slug already exists | Slug danh mục đã bị trùng |
