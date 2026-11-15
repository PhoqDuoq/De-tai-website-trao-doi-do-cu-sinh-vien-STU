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

## 4. Interaction Service Endpoints (`/api/v1/favorites/**`, `/api/v1/comments/**`, `/api/v1/conversations/**`, `/api/v1/reviews/**`)

### 4.1 Danh sách yêu thích (Favorites)
- `POST /api/v1/favorites`: Thêm tin đăng vào danh sách yêu thích (yêu cầu JWT). Trả về HTTP 201 Created. Thao tác trùng ném `409 Conflict` (`FAVORITE_ALREADY_EXISTS`).
- `POST /api/v1/favorites/toggle`: Chuyển đổi trạng thái yêu thích (nếu có thì xóa, nếu chưa thì thêm). Trả về HTTP 200 OK kèm cờ `favorited: true/false`.
- `DELETE /api/v1/favorites/{listingId}`: Xóa tin đăng khỏi danh sách yêu thích. Trả về HTTP 200 OK.
- `GET /api/v1/favorites/my-favorites`: Lấy danh sách tin yêu thích của người dùng hiện tại (phân trang, sắp xếp giảm dần theo thời gian tạo).
- `GET /api/v1/favorites/check/{listingId}`: Kiểm tra tin đăng đã được lưu hay chưa (`{"favorited": true/false}`).
- `GET /api/v1/favorites/count/{listingId}`: Lấy tổng số lượt yêu thích của một tin đăng (Public).

### 4.2 Bình luận công khai & Hỏi đáp (Comments)
- `GET /api/v1/comments/listing/{listingId}`: Lấy danh sách bình luận công khai theo cấu trúc phân cấp cây (`replies`) (Public).
- `POST /api/v1/comments`: Đăng câu hỏi/bình luận hoặc trả lời (`parentId` tùy chọn). Trả về HTTP 201 Created.
  - Invariant: Nếu có `parentId`, phải kiểm tra parent thuộc đúng `listingId` (chống inject bình luận chéo).
- `PUT /api/v1/comments/{id}`: Chỉnh sửa nội dung bình luận. Yêu cầu JWT (chính chủ tác giả bình luận). Người khác sửa sẽ trả về `403 Forbidden`.
- `DELETE /api/v1/comments/{id}`: Xóa bình luận (cascade toàn bộ phản hồi con). Yêu cầu JWT (chính chủ tác giả hoặc Staff `ROLE_ADMIN`, `ROLE_MODERATOR`).

### 4.3 Trò chuyện & Nhắn tin 1-1 (Conversations & Messages)
- `POST /api/v1/conversations`: Khởi tạo hoặc lấy cuộc trò chuyện 1-1 giữa người mua và người bán cho một tin đăng.
  - Invariant: Chặn tự chat với chính mình (`buyerId != sellerId`, ném `CANNOT_CHAT_WITH_SELF`).
  - Idempotent: Nếu đã tồn tại cuộc trò chuyện cho `(listingId, buyerId, sellerId)`, trả về conversation hiện có.
- `GET /api/v1/conversations/my-conversations`: Lấy hộp thư đến của người dùng, sắp xếp theo `lastMessageAt DESC`, kèm xem trước tin nhắn mới nhất và số tin chưa đọc.
- `GET /api/v1/conversations/{id}`: Xem chi tiết cuộc trò chuyện. Invariant: Chỉ thành viên tham gia (`buyerId` hoặc `sellerId`) mới được truy cập, người ngoài trả về `403 Forbidden`.
- `GET /api/v1/conversations/{id}/messages`: Lấy danh sách tin nhắn phân trang theo thời gian.
- `POST /api/v1/conversations/{id}/messages`: Gửi tin nhắn (`TEXT`, `IMAGE`, `LOCATION`). Tự động cập nhật `lastMessageAt` của cuộc trò chuyện.
- `PATCH /api/v1/conversations/{id}/read`: Đánh dấu đã đọc các tin nhắn đến từ đối tác.
- `GET /api/v1/conversations/unread-count`: Lấy tổng số tin nhắn chưa đọc của người dùng trên toàn hệ thống.

### 4.4 Đánh giá sau giao dịch (Reviews)
- `POST /api/v1/reviews`: Gửi đánh giá sao (1 đến 5 sao) và nhận xét sau khi giao dịch hoàn tất.
  - Invariant 1: Không được tự đánh giá chính mình (`reviewerId != revieweeId`, ném `CANNOT_REVIEW_SELF`).
  - Invariant 2: Mỗi người tham gia chỉ được đánh giá 1 lần duy nhất cho mỗi giao dịch (`uk_reviewer_transaction`, ném `409 REVIEW_ALREADY_SUBMITTED`).
  - Invariant 3: Thang điểm đánh giá từ 1 đến 5 sao (`@Min(1) @Max(5)`).
- `GET /api/v1/reviews/user/{userId}`: Xem danh sách đánh giá nhận được của một người dùng (Public).
- `GET /api/v1/reviews/user/{userId}/summary`: Xem tổng hợp điểm uy tín trung bình và bảng phân bổ số lượng từng mức sao (1-5 sao) (Public).
- `GET /api/v1/reviews/transaction/{transactionId}`: Xem đánh giá liên quan đến một giao dịch cụ thể.

---

## 5. Transaction Service Endpoints (`/api/v1/transactions/**`)

### 5.1 Quản lý Đề xuất & Tiến trình Giao dịch (Transactions)
- `POST /api/v1/transactions`: Người mua gửi đề xuất giao dịch (`REQUESTED`).
  - Invariant 1: Chặn người bán tự mua/giao dịch tin của chính mình (`buyerId != sellerId`, ném `CANNOT_TRANSACT_OWN_ITEM`).
  - Invariant 2: Sinh mã giao dịch duy nhất dạng `TX-YYYYMMDD-XXXXXX`.
  - Invariant 3: Tự động ghi nhận bản ghi nhật ký lịch sử `REQUESTED` trong `transaction_timeline`.
- `GET /api/v1/transactions/{id}`: Lấy chi tiết thông tin giao dịch, địa điểm hẹn, mã xác nhận và dòng thời gian xử lý. Quyền hạn: Người mua, người bán hoặc Staff.
- `GET /api/v1/transactions/my-transactions`: Tra cứu danh sách giao dịch của tôi với bộ lọc vai trò (`role=BUYER/SELLER/ALL`), trạng thái giao dịch (`status`) và phân trang.
- `GET /api/v1/transactions/{id}/timeline`: Lấy nhật ký dòng thời gian chi tiết các bước chuyển trạng thái và ghi chú của các bên.
- `PATCH /api/v1/transactions/{id}/accept`: Người bán chấp thuận đề xuất giao dịch (`ACCEPTED`).
  - Invariant: Chỉ người bán (`sellerId == currentUserId`) mới được chấp thuận. Trạng thái hiện tại phải là `REQUESTED`.
- `PATCH /api/v1/transactions/{id}/meetup`: Đặt lịch hẹn gặp tại khuôn viên trường STU (`CONFIRMED`).
  - Invariant 1: Thời gian hẹn (`meetingTime`) bắt buộc phải ở tương lai (`@Future`).
  - Invariant 2: Địa điểm hẹn phải thuộc các khu vực an toàn trong trường STU (Sảnh Nhà A, Sảnh Nhà C, Thư viện STU, Căn tin STU, Sân trường STU, Nhà xe sinh viên).
- `PATCH /api/v1/transactions/{id}/confirm`: Xác nhận hoàn tất bàn giao và thanh toán trực tiếp tại trường (`COMPLETED`).
  - Hỗ trợ 2 phương thức an toàn:
    - **Quy trình Mã Xác Nhận (Verification Code)**: Người mua cung cấp mã bảo mật 6 số cho người bán tại buổi gặp; người bán nhập mã để hoàn tất tức thì.
    - **Quy trình Xác Nhận Kép (Dual Confirmation)**: Cả người mua và người bán đều gửi xác nhận; hệ thống kiểm tra nhật ký timeline khi đủ xác nhận 2 phía sẽ chuyển `COMPLETED`.
  - **Đồng bộ liên Microservice**: Khi giao dịch chuyển sang `COMPLETED`, `transaction-service` gọi `ListingClient` (Spring 6 RestClient) gửi yêu cầu cập nhật trạng thái tin đăng sang `SOLD` tại `listing-service` (`PATCH /api/v1/listings/{id}/status`). Nếu `listing-service` gián đoạn, dịch vụ áp dụng logging cảnh báo và fallback an toàn để không làm nghẽn tiến trình.
- `PATCH /api/v1/transactions/{id}/cancel`: Hủy giao dịch kèm lý do bắt buộc (`CANCELLED`). Được phép gọi bởi người mua, người bán hoặc Staff trước khi giao dịch hoàn tất.
- `PATCH /api/v1/transactions/{id}/dispute`: Báo cáo khiếu nại/tranh chấp khi gặp sự cố tại buổi hẹn (`DISPUTED`) để chuyển ban quản trị kiểm duyệt.
- `GET /api/v1/transactions/campus-locations`: Lấy danh mục các điểm hẹn tiêu chuẩn tại trường ĐH Công nghệ Sài Gòn (STU - 180 Cao Lỗ).

---

## 6. Moderation Service Endpoints (`/api/v1/moderation/**`, `/api/v1/reports/**`)

### 6.1 Báo Cáo Vi Phạm (Reports)
- `POST /api/v1/reports`: Người dùng gửi báo cáo vi phạm đối với tin đăng, tài khoản, bình luận, tin nhắn (`PENDING`).
  - Invariant 1: Chặn người dùng tự báo cáo chính mình (`targetType == USER && targetId == currentUserId`, ném mã `CANNOT_REPORT_SELF (5003)`).
  - Invariant 2: Chặn spam báo cáo trùng lặp cho cùng một đối tượng khi đã có báo cáo `PENDING` hoặc `INVESTIGATING` (ném `REPORT_ALREADY_EXISTS (5007)`).
- `GET /api/v1/reports/my-reports`: Người dùng tra cứu lịch sử và trạng thái xử lý các báo cáo do chính mình gửi (Authenticated).
- `GET /api/v1/moderation/reports`: Danh sách hàng đợi báo cáo vi phạm cần duyệt (Phân trang, lọc theo `status`, `targetType`). Quyền hạn: Moderator, Admin.
- `GET /api/v1/moderation/reports/{id}`: Xem chi tiết báo cáo và bằng chứng vi phạm. Quyền hạn: Moderator, Admin.
- `PATCH /api/v1/moderation/reports/{id}/assign`: Moderator nhận xử lý báo cáo (`PENDING -> INVESTIGATING`). Ghi nhận `assigned_moderator_id` và nhật ký audit log.
- `PATCH /api/v1/moderation/reports/{id}/resolve`: Moderator đưa ra phán quyết xử lý vi phạm (`INVESTIGATING -> RESOLVED`).
  - Áp dụng các hành động: `WARNING_SENT`, `CONTENT_REMOVED`, `USER_TEMPORARILY_BANNED`, `USER_PERMANENTLY_BANNED`, `NO_ACTION`.
  - Tự động phát hành bản ghi `Penalty` tương ứng nếu đối tượng là `USER`.
  - Bắt buộc điền ghi chú giải quyết (`resolutionNotes`).
- `PATCH /api/v1/moderation/reports/{id}/dismiss`: Moderator bác bỏ báo cáo không có cơ sở (`DISMISSED`). Bắt buộc điền lý do và ghi audit log.

### 6.2 Bộ Lọc Từ Khóa Cấm Tự Động (Forbidden Keywords)
- `POST /api/v1/moderation/keywords/check`: Kiểm tra nội dung văn bản (tiêu đề, mô tả) có chứa từ khóa cấm/nhạy cảm không. Trả về `clean: bool`, `flaggedKeywords`, `severity` (`AUTO_REJECT` / `FLAG_FOR_REVIEW`) và `suggestedAction` (`PASS`, `FLAG_FOR_REVIEW`, `AUTO_REJECT`).
- `GET /api/v1/moderation/keywords`: Tra cứu danh mục từ khóa cấm (Phân trang, lọc theo danh mục và trạng thái kích hoạt). Quyền hạn: Moderator, Admin.
- `POST /api/v1/moderation/keywords`: Thêm từ khóa cấm mới vào từ điển. Quyền hạn: Moderator, Admin.
- `PUT /api/v1/moderation/keywords/{id}`: Cập nhật từ khóa, danh mục, mức độ nghiêm trọng hoặc bật/tắt kích hoạt. Quyền hạn: Moderator, Admin.
- `DELETE /api/v1/moderation/keywords/{id}`: Xóa từ khóa cấm khỏi từ điển. Quyền hạn: Moderator, Admin.

### 6.3 Xử Phạt & Nhật Ký Kiểm Duyệt (Penalties & Audit Logs)
- `POST /api/v1/moderation/penalties`: Phát hành hình thức xử phạt trực tiếp đối với người dùng vi phạm (`WARNING`, `TEMPORARY_BAN` có thời hạn ngày, `PERMANENT_BAN`). Quyền hạn: Moderator, Admin.
- `GET /api/v1/moderation/penalties/user/{userId}`: Tra cứu lịch sử vi phạm và các án phạt của người dùng. Quyền hạn: Moderator, Admin.
- `GET /api/v1/moderation/penalties`: Danh sách tổng hợp tất cả các quyết định xử phạt trong hệ thống.
- `GET /api/v1/moderation/audit-logs`: Tra cứu nhật ký hành động bất biến của đội ngũ kiểm duyệt viên (lọc theo `moderatorId`, phân trang).
- `GET /api/v1/moderation/audit-logs/target`: Tra cứu lịch sử kiểm duyệt theo loại và mã đối tượng cụ thể (`targetType`, `targetId`).

---

## 7. Billing Service Endpoints (`/api/v1/billing/**`, `/api/v1/invoices/**`)

### 7.1 Gói Phí Đăng Tin & Đẩy Bài (Fee Packages)
- `GET /api/v1/billing/packages`: Lấy danh mục các gói đẩy tin / huy hiệu ưu tiên đang hoạt động (Public / Authenticated).
- `GET /api/v1/billing/packages/{id}`: Xem chi tiết thông tin gói phí.
- `POST /api/v1/billing/packages`: Admin tạo gói phí mới (Mã gói, tên, mô tả, giá tiền, số ngày hiệu lực).
- `PUT /api/v1/billing/packages/{id}`: Admin cập nhật thông tin gói phí hoặc kích hoạt/vô hiệu hóa gói.

### 7.2 Hóa Đơn Dịch Vụ Nền Tảng (Invoices)
- `POST /api/v1/billing/invoices` hoặc `POST /api/v1/invoices`: Người bán tạo hóa đơn mua gói đẩy tin cho bài đăng của mình (`PENDING`).
  - Sinh mã hóa đơn chuẩn định dạng `INV-YYYYMMDD-XXXXXX`.
  - Invariant: Kiểm tra gói phí tồn tại và đang kích hoạt (`is_active = true`).
- `GET /api/v1/billing/invoices/my-invoices`: Người bán xem danh sách hóa đơn dịch vụ của chính mình.
- `GET /api/v1/billing/invoices/{id}`: Xem chi tiết hóa đơn (Kiểm tra quyền sở hữu: chỉ chủ hóa đơn hoặc Staff mới được xem).
- `GET /api/v1/billing/invoices`: Admin tra cứu danh sách toàn bộ hóa đơn trên sàn (lọc theo `status`, phân trang).
- `POST /api/v1/billing/invoices/{id}/cancel`: Hủy hóa đơn đang chờ thanh toán (`PENDING -> EXPIRED`). Chặn hủy nếu hóa đơn đã `PAID`.

### 7.3 Thanh Toán Phí Dịch Vụ Nền Tảng & Kích Hoạt Đẩy Tin (Payments & Boost Activation)
- `POST /api/v1/billing/invoices/{id}/pay`: Xử lý thanh toán phí đăng tin qua Sandbox Gateway (`VNPAY`, `MOMO`, `BANK_TRANSFER`).
  - Sinh mã giao dịch duy nhất dạng `TXN-{GATEWAY}-YYYYMMDD-XXXXXXXX`.
  - Chuyển trạng thái hóa đơn sang `PAID`, ghi nhận thời điểm thanh toán `paid_at`.
  - **Kích hoạt gói ưu tiên liên dịch vụ**: Tự động gọi `ListingBoostClient` (Spring 6 RestClient) gửi thông báo tới `listing-service` để gia hạn và kích hoạt ưu tiên hiển thị cho bài đăng (`is_boosted = true`, `durationDays`). Cơ chế try-catch bảo đảm thanh toán luôn an toàn ngay cả khi `listing-service` gặp sự cố tạm thời.
- `POST /api/v1/billing/payments/callback`: Nhận thông báo IPN từ cổng thanh toán đối tác (Xử lý Idempotent bảo đảm không trừ tiền hoặc kích hoạt trùng lặp).
- `GET /api/v1/billing/invoices/{id}/transactions`: Tra cứu lịch sử các giao dịch thanh toán liên quan đến hóa đơn.

### 7.4 Rào Chắn Nghiệp Vụ Tuyệt Đối (Strict R3 Invariant Guardrail)
- `POST /api/v1/billing/payments/transfers`, `POST /api/v1/billing/transfers`, `POST /api/v1/billing/escrow`:
  - **Quy tắc bất biến**: Tuyệt đối **KHÔNG** hỗ trợ thanh toán mua bán trực tiếp giữa các sinh viên, không mở ví điện tử trung gian, không giữ tiền ký quỹ (escrow) giữa người mua và người bán.
  - Bất kỳ yêu cầu nào cố gắng gọi các luồng thanh toán P2P đều bị chặn ngay lập tức với mã lỗi HTTP 400 Bad Request: `STUDENT_PAYMENT_PROHIBITED (6004)`.

---

## 8. Danh Mục Mã Lỗi Nghiệp Vụ (`ErrorCode`)

| Mã Lỗi | HTTP Status | Thông Điệp Lỗi | Ý Nghĩa Nghiệp Vụ |
|---|:---:|---|---|
| `1001` | 404 | User profile not found | Không tìm thấy tài khoản người dùng |
| `1002` | 409 | User with this email already exists | Email đã được đăng ký trong hệ thống |
| `1003` | 401 | Invalid email or password | Email hoặc mật khẩu không chính xác |
| `1004` | 403 | Student identity card has not been verified yet | Thẻ sinh viên chưa được duyệt |
| `1006` | 401 | JWT authentication token has expired | Token JWT đã hết hạn |
| `1007` | 401 | JWT authentication token signature is invalid | Chữ ký token JWT không hợp lệ |
| `1008` | 403 | User account is suspended or banned | Tài khoản bị tạm khóa hoặc cấm |
| `1009` | 409 | Student ID code is already registered | Mã sinh viên đã được đăng ký |
| `1014` | 403 | User account is locked or suspended | Tài khoản bị khóa (SEC-04) |
| `2001` | 404 | Listing item not found | Không tìm thấy tin đăng |
| `2002` | 404 | Listing category not found | Danh mục không tồn tại |
| `2003` | 403 | User is not authorized to edit or delete this listing | Không có quyền thao tác tin của người khác |
| `2004` | 400 | Cannot transition listing to requested status | Trạng thái chuyển đổi tin đăng không hợp lệ |
| `2005` | 400 | Maximum number of listing images exceeded | Vượt quá số lượng ảnh tối đa |
| `2007` | 400 | Listing must be reviewed and approved by a moderator | Tin đăng chưa được phê duyệt |
| `3001` | 404 | Conversation not found | Cuộc trò chuyện không tồn tại |
| `3002` | 404 | Message not found | Tin nhắn không tồn tại |
| `3003` | 409 | Item is already in user's favorites | Tin đã có trong danh sách yêu thích |
| `3004` | 409 | Review has already been submitted for this transaction | Đã gửi đánh giá cho giao dịch này |
| `3005` | 404 | Comment not found | Bình luận không tồn tại |
| `3006` | 403 | User is not authorized to perform this interaction action | Không có quyền thao tác trên bình luận/tin nhắn |
| `3007` | 400 | User cannot start conversation with themselves | Không thể tự nhắn tin với chính mình |
| `3008` | 400 | User cannot review themselves | Không thể tự đánh giá chính mình |
| `3009` | 400 | Review can only be submitted for completed transactions | Chỉ đánh giá giao dịch đã hoàn tất |
| `3010` | 404 | Favorite item not found | Không tìm thấy tin trong mục yêu thích |
| `4001` | 404 | Transaction record not found | Giao dịch không tồn tại |
| `4002` | 400 | Illegal transaction status change | Trạng thái chuyển đổi giao dịch không hợp lệ |
| `4003` | 400 | Seller cannot transact or buy their own listing | Người bán không thể tự mua đồ của mình |
| `4004` | 403 | User is not authorized to modify this transaction | Không có quyền thao tác trên giao dịch này |
| `4005` | 400 | Meeting time must be in the future | Thời gian hẹn phải ở tương lai |
| `4006` | 400 | Transaction verification code is invalid | Mã xác nhận giao dịch không hợp lệ |
| `4007` | 400 | Transaction has already been completed or cancelled | Giao dịch đã kết thúc, không thể thay đổi |
| `5001` | 404 | Moderation report not found | Không tìm thấy báo cáo vi phạm |
| `5002` | 400 | Content contains prohibited or offensive keywords | Nội dung chứa từ ngữ thô tục hoặc hàng cấm |
| `5003` | 400 | User cannot report themselves | Người dùng không thể tự báo cáo chính mình |
| `5004` | 400 | Report has already been resolved or dismissed | Báo cáo đã được xử lý hoặc bác bỏ |
| `5005` | 409 | Forbidden keyword already exists | Từ khóa cấm đã tồn tại trong từ điển |
| `5006` | 404 | Forbidden keyword not found | Không tìm thấy từ khóa cấm |
| `5007` | 409 | A pending report for this target already exists | Đã có báo cáo đang chờ xử lý cho mục tiêu này |
| `6001` | 404 | Listing fee package not found | Không tìm thấy gói phí đăng tin |
| `6002` | 404 | Invoice record not found | Không tìm thấy hóa đơn dịch vụ |
| `6003` | 400 | Payment processing failed | Xử lý thanh toán thất bại |
| `6004` | 400 | Student-to-student payments are not supported on this platform | Nghiêm cấm giao dịch tiền tệ trực tiếp giữa sinh viên (R3 Invariant) |
| `6005` | 400 | Invoice has already been paid | Hóa đơn đã được thanh toán |
| `6006` | 400 | Invoice is expired or cancelled | Hóa đơn đã hết hạn hoặc bị hủy |
| `6007` | 403 | User is not authorized to access or modify this billing resource | Không có quyền truy cập hóa đơn của người khác |
| `6008` | 400 | Listing fee package is inactive | Gói phí đăng tin hiện đang tạm ngừng hoạt động |
