# TÀI LIỆU KIỂM THỬ HỆ THỐNG (TEST CASES SPECIFICATION)
## ĐỒ ÁN LUẬN VĂN TỐT NGHIỆP ĐẠI HỌC NĂM 2026
**Đề tài:** XÂY DỰNG NỀN TẢNG THƯƠNG MẠI ĐIỆN TỬ TRAO ĐỔI ĐỒ DÙNG CŨ DÀNH CHO SINH VIÊN TRƯỜNG ĐẠI HỌC CÔNG NGHỆ SÀI GÒN (STU MARKETPLACE)  
**Sinh viên thực hiện:**  
- Dương Hoài Phong — MSSV: DH52200413 (Khoa Công nghệ Thông tin)  
- Hà Thiên Phúc — MSSV: DH52201642 (Khoa Công nghệ Thông tin)  
**Giảng viên hướng dẫn:** ThS. [Tên Giảng Viên Hướng Dẫn]  
**Ngày cập nhật:** 23/11/2026  

---

## MỤC LỤC TÀI LIỆU KIỂM THỬ

1. [TỔNG QUAN KẾ HOẠCH KIỂM THỬ](#1-tổng-quan-kế-hoạch-kiểm-thử)
   - 1.1. Mục tiêu kiểm thử
   - 1.2. Phạm vi kiểm thử
   - 1.3. Môi trường kiểm thử (Test Environment)
   - 1.4. Quy ước mã định danh (Test Case ID Convention)
2. [BẢNG TỔNG HỢP KẾT QUẢ KIỂM THỬ THEO PHÂN HỆ](#2-bảng-tổng-hợp-kết-quả-kiểm-thử-theo-phân-hệ)
3. [CHI TIẾT CÁC BẢNG TEST CASES (40 TEST CASES)](#3-chi-tiết-các-bảng-test-cases)
   - [PHÂN HỆ 1: QUẢN LÝ XÁC THỰC & TÀI KHOẢN SINH VIÊN STU (TC_AUTH)](#phân-hệ-1-quản-lý-xác-thực--tài-khoản-sinh-viên-stu-tc_auth)
   - [PHÂN HỆ 2: QUẢN LÝ TIN ĐĂNG & ĐỒ DÙNG HỌC TẬP (TC_LIST)](#phân-hệ-2-quản-lý-tin-đăng--đồ-dùng-học-tập-tc_list)
   - [PHÂN HỆ 3: TƯƠNG TÁC, CHAT & THÔNG BÁO (TC_CHAT)](#phân-hệ-3-tương-tác-chat--thông-báo-tc_chat)
   - [PHÂN HỆ 4: ĐIỀU PHỐI GIAO DỊCH & HẸN GẶP AN TOÀN TẠI STU (TC_TRANS)](#phân-hệ-4-điều-phối-giao-dịch--hẹn-gặp-an-toàn-tại-stu-tc_trans)
   - [PHÂN HỆ 5: ĐÁNH GIÁ ĐỐI TÁC & BÁO CÁO VI PHẠM (TC_MOD)](#phân-hệ-5-đánh-giá-đối-tác--báo-cáo-vi-phạm-tc_mod)
   - [PHÂN HỆ 6: QUẢN TRỊ HỆ THỐNG & NHẬT KÝ KIỂM TOÁN (TC_ADMIN)](#phân-hệ-6-quản-trị-hệ-thống--nhật-ký-kiểm-toán-tc_admin)
4. [KẾT LUẬN & ĐÁNH GIÁ ĐỘ SẴN SÀNG TRIỂN KHAI](#4-kết-luận--đánh-giá-độ-sẵn-sàng-triển-khai)

---

## 1. TỔNG QUAN KẾ HOẠCH KIỂM THỬ

### 1.1. Mục tiêu kiểm thử
- Đảm bảo toàn bộ 6 cụm chức năng theo Sơ đồ Use Case của Luận văn hoạt động chính xác, ổn định và đáp ứng đầy đủ các yêu cầu phi chức năng (bảo mật, toàn vẹn dữ liệu, hiệu năng).
- Kiểm chứng các quy tắc nghiệp vụ đặc thù của Trường Đại học Công nghệ Sài Gòn (STU):
  + Ép buộc định dạng email sinh viên `@student.stu.edu.vn` và kiểm tra MSSV 10 ký tự.
  + Cơ chế xác thực thẻ sinh viên có ảnh chụp minh chứng.
  + Giới hạn khu vực giao dịch an toàn trong khuôn viên trường STU (180 Cao Lỗ, Phường 4, Quận 8).
  + Kiểm soát tin đăng có giá trị cao bất thường (> 10 triệu đồng) để ngăn chặn hành vi lừa đảo hoặc gõ nhầm giá.
  + Tuân thủ nguyên tắc **không can thiệp giữ tiền hàng (Zero P2P Escrow)** nhằm tránh rủi ro pháp lý trung gian thanh toán.
  + Kiểm toán bất biến (Immutable Audit Trail) ghi lại mọi hành động của Quản trị viên và Kiểm duyệt viên.

### 1.2. Phạm vi kiểm thử
- **Kiểm thử chức năng (Functional Testing)**: Black-box testing trên toàn bộ các biểu mẫu, luồng xử lý và giao diện người dùng.
- **Kiểm thử biên & Ngoại lệ (Boundary & Negative Testing)**: Nhập sai định dạng, vượt quá ngưỡng giá, truy cập trái phép khi bị khóa tài khoản hoặc sai vai trò (RBAC).
- **Kiểm thử tích hợp & Dữ liệu thật (Integration & End-to-End Testing)**: Tương tác qua lại giữa 6 cơ sở dữ liệu trên MySQL WampServer và API Gateway Node.js/Express, đảm bảo 0% sử dụng dữ liệu giả (mock data).

### 1.3. Môi trường kiểm thử (Test Environment)
| Thành phần | Cấu hình thử nghiệm thực tế |
| :--- | :--- |
| **Hệ điều hành** | Microsoft Windows 11 Home / Pro 64-bit |
| **Cơ sở dữ liệu** | MySQL 8.0.21 trên nền tảng WampServer 3.2.3 (Port 3306) |
| **Backend API Gateway** | Node.js v20+ / Express RESTful Gateway (Port 8080) |
| **Frontend Web Client** | React 18.3, Vite 5.4, Tailwind CSS 3.4 (Port 5173) |
| **Trình duyệt thử nghiệm** | Google Chrome v131+, Microsoft Edge v131+ |
| **Độ phân giải màn hình** | Desktop (1920x1080), Laptop (1366x768), Mobile (375x812) |

### 1.4. Quy ước mã định danh (Test Case ID Convention)
Mã Test Case được quy chuẩn theo cấu trúc: `TC_<MODULE>_<STT>`
- `TC_AUTH`: Phân hệ Xác thực, Phân quyền & Quản lý Tài khoản Sinh viên STU.
- `TC_LIST`: Phân hệ Đăng tin, Tìm kiếm, Lọc danh mục & Chi tiết Đồ dùng học tập.
- `TC_CHAT`: Phân hệ Nhắn tin trao đổi 1-1, Tin yêu thích & Trung tâm Thông báo.
- `TC_TRANS`: Phân hệ Quản lý Giao dịch, Lập lịch hẹn gặp tại STU & Xuất biên nhận.
- `TC_MOD`: Phân hệ Báo cáo vi phạm, Kiểm duyệt nội dung & Đánh giá sao đối tác.
- `TC_ADMIN`: Phân hệ Quản trị hệ thống, Quản lý danh mục, Gói phí & Nhật ký kiểm toán.

---

## 2. BẢNG TỔNG HỢP KẾT QUẢ KIỂM THỬ THEO PHÂN HỆ

| STT | Phân hệ chức năng | Số lượng Test Cases | Số ca Đạt (PASS) | Số ca Lỗi (FAIL) | Tỷ lệ Đạt | Đánh giá |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| 1 | Quản lý Xác thực & Tài khoản SV (TC_AUTH) | 08 | 08 | 00 | 100% | **ĐẠT** |
| 2 | Quản lý Tin đăng & Đồ dùng STU (TC_LIST) | 08 | 08 | 00 | 100% | **ĐẠT** |
| 3 | Tương tác, Chat & Thông báo (TC_CHAT) | 05 | 05 | 00 | 100% | **ĐẠT** |
| 4 | Điều phối Giao dịch & Hẹn gặp STU (TC_TRANS) | 06 | 06 | 00 | 100% | **ĐẠT** |
| 5 | Đánh giá đối tác & Báo cáo vi phạm (TC_MOD) | 05 | 05 | 00 | 100% | **ĐẠT** |
| 6 | Quản trị hệ thống & Nhật ký kiểm toán (TC_ADMIN) | 08 | 08 | 00 | 100% | **ĐẠT** |
| **TỔNG CỘNG** | **Toàn bộ hệ thống STU Marketplace** | **40** | **40** | **00** | **100.0%** | **XUẤT SẮC** |

---

## 3. CHI TIẾT CÁC BẢNG TEST CASES

### PHÂN HỆ 1: QUẢN LÝ XÁC THỰC & TÀI KHOẢN SINH VIÊN STU (TC_AUTH)

#### TC_AUTH_01: Đăng ký tài khoản sinh viên thành công với email trường STU
- **Mục tiêu**: Kiểm tra luồng đăng ký tài khoản mới khi nhập đúng định dạng email và mã số sinh viên của trường.
- **Tiền điều kiện**: Sinh viên chưa từng tạo tài khoản với email này trên hệ thống.
- **Dữ liệu đầu vào (Test Data)**:
  + Họ và tên: `Nguyễn Trung Hậu`
  + Mã số sinh viên: `DH52200888`
  + Email trường: `dh52200888@student.stu.edu.vn`
  + Số điện thoại: `0938112233`
  + Mật khẩu: `Stu@123456`
- **Các bước thực hiện (Test Steps)**:
  1. Truy cập đường dẫn `http://localhost:5173/register`.
  2. Nhập đầy đủ thông tin vào các trường như Dữ liệu đầu vào.
  3. Nhấn nút **"Đăng ký tài khoản STU"**.
- **Kết quả mong đợi (Expected Result)**:
  + Hệ thống hiển thị thông báo toast: *"Đăng ký tài khoản sinh viên STU thành công!"*.
  + Backend băm mật khẩu bằng thuật toán BCrypt và lưu vào bảng `stu_identity_db.users`.
  + Tự động cấp JWT token và chuyển hướng sinh viên vào trang chủ hoặc trang xác thực thẻ SV.
- **Kết quả thực tế (Actual Result)**: Đúng như mong đợi. Tạo bản ghi mới trong database với vai trò `STUDENT`.
- **Trạng thái**: **PASS**

---

#### TC_AUTH_02: Chặn đăng ký khi người dùng sử dụng email cá nhân ngoài trường
- **Mục tiêu**: Kiểm tra tính năng bảo mật ngăn chặn người ngoài trường đăng ký tài khoản bằng email không thuộc STU.
- **Tiền điều kiện**: Đang ở trang Đăng ký.
- **Dữ liệu đầu vào**:
  + Email: `nguyentrunghau@gmail.com` (Email cá nhân ngoài trường)
  + MSSV: `DH52200888`
- **Các bước thực hiện**:
  1. Nhập email có đuôi `@gmail.com` vào ô "Email sinh viên STU".
  2. Nhấn nút Tab hoặc nhấn Submit "Đăng ký tài khoản STU".
- **Kết quả mong đợi**:
  + Form báo lỗi màu đỏ ngay dưới ô nhập: *"Chỉ chấp nhận email sinh viên STU (@student.stu.edu.vn hoặc @stu.edu.vn)"*.
  + Hệ thống không gửi request đăng ký thành công lên server.
- **Kết quả thực tế**: Giao diện chặn lại ngay lập tức tại Frontend và Backend trả về HTTP 400 nếu bypass client.
- **Trạng thái**: **PASS**

---

#### TC_AUTH_03: Bắt lỗi Realtime (onBlur) khi rời ô nhập Mã số sinh viên không đủ 10 ký tự
- **Mục tiêu**: Kiểm tra cơ chế kiểm tra lỗi tức thời khi người dùng nhấn Tab rời khỏi ô nhập liệu (sửa lỗi theo góp ý của GVHD).
- **Tiền điều kiện**: Đang mở biểu mẫu Đăng ký tài khoản.
- **Dữ liệu đầu vào**: Ô MSSV nhập `DH52` (chỉ có 4 ký tự, thiếu 6 số).
- **Các bước thực hiện**:
  1. Nhấp chuột vào ô "Mã số sinh viên (MSSV)".
  2. Gõ `DH52`.
  3. Nhấn phím **Tab** để chuyển con trỏ sang ô tiếp theo mà **không nhấn nút Submit**.
- **Kết quả mong đợi**:
  + Ô nhập liệu ngay lập tức đổi viền đỏ cảnh báo.
  + Xuất hiện thông báo lỗi ngay dưới ô: *"Mã số sinh viên trường STU phải đúng 10 ký tự (Ví dụ: DH52201642)"*.
- **Kết quả thực tế**: Sự kiện `mode: 'onBlur'` bắt lỗi chính xác và hiển thị cảnh báo đỏ lập tức.
- **Trạng thái**: **PASS**

---

#### TC_AUTH_04: Đăng nhập thành công với tài khoản sinh viên hợp lệ
- **Mục tiêu**: Kiểm tra khả năng xác thực danh tính sinh viên và lưu trữ phiên đăng nhập qua JWT.
- **Tiền điều kiện**: Tài khoản `dh52201642@student.stu.edu.vn` đang hoạt động (`status = 'ACTIVE'`).
- **Dữ liệu đầu vào**:
  + Tên đăng nhập: `dh52201642@student.stu.edu.vn` (hoặc MSSV `DH52201642`)
  + Mật khẩu: `Stu@123456`
- **Các bước thực hiện**:
  1. Truy cập `http://localhost:5173/login`.
  2. Nhập email/MSSV và mật khẩu (hoặc bấm nút "Sinh viên: Hà Thiên Phúc" tại khung Đăng nhập nhanh).
  3. Nhấn **"Đăng nhập hệ thống"**.
- **Kết quả mong đợi**:
  + Đăng nhập thành công, lưu `accessToken` và `refreshToken` vào `localStorage`.
  + Giao diện điều hướng về trang chủ, thanh tiêu đề hiển thị tên sinh viên kèm trạng thái *"Sinh viên STU"*.
- **Kết quả thực tế**: Đăng nhập mượt mà, lưu trữ session token chính xác.
- **Trạng thái**: **PASS**

---

#### TC_AUTH_05: Đăng nhập thất bại khi nhập sai mật khẩu
- **Mục tiêu**: Kiểm tra khả năng từ chối đăng nhập và thông báo lỗi an toàn khi nhập sai thông tin xác thực.
- **Dữ liệu đầu vào**:
  + Tên đăng nhập: `dh52201642@student.stu.edu.vn`
  + Mật khẩu: `SaiMatKhau@999`
- **Các bước thực hiện**:
  1. Vào trang Đăng nhập.
  2. Nhập email đúng nhưng mật khẩu sai.
  3. Nhấn nút Đăng nhập.
- **Kết quả mong đợi**:
  + Thông báo lỗi hiển thị rõ ràng: *"Mật khẩu không chính xác. Vui lòng kiểm tra lại!"*.
  + Không cấp JWT token, giữ nguyên màn hình đăng nhập.
- **Kết quả thực tế**: Đúng như mong đợi. Không rò rỉ cấu trúc lỗi nội bộ.
- **Trạng thái**: **PASS**

---

#### TC_AUTH_06: Tải lên hồ sơ xác thực thẻ sinh viên STU
- **Mục tiêu**: Kiểm tra tính năng gửi ảnh chụp thẻ sinh viên để Ban Kiểm Duyệt cấp tích xanh uy tín.
- **Tiền điều kiện**: Sinh viên đã đăng nhập và chưa được cấp thẻ xanh.
- **Dữ liệu đầu vào**: Tệp ảnh hợp lệ `the_sinh_vien_stu.jpg` (< 5MB).
- **Các bước thực hiện**:
  1. Vào menu người dùng -> Chọn **"Xác thực thẻ sinh viên STU"** (`/verify-student`).
  2. Bấm chọn tệp ảnh thẻ sinh viên STU từ máy tính.
  3. Bấm **"Gửi hồ sơ xác thực"**.
- **Kết quả mong đợi**:
  + Hệ thống tải ảnh lên, tạo bản ghi trong bảng `stu_identity_db.user_verifications` với trạng thái `PENDING` (hoặc `APPROVED` trong môi trường demo).
  + Giao diện thông báo hồ sơ đã được tiếp nhận thành công.
- **Kết quả thực tế**: Hồ sơ gửi thành công, hiển thị huy hiệu thẻ SV đã xác thực.
- **Trạng thái**: **PASS**

---

#### TC_AUTH_07: Tự động đình chỉ quyền đăng tin và giao dịch khi tài khoản bị khóa (status = LOCKED)
- **Mục tiêu**: Kiểm tra rào chắn bảo mật chặn toàn bộ quyền hạn của tài khoản vi phạm.
- **Tiền điều kiện**: Tài khoản `dh52200777@student.stu.edu.vn` bị Quản trị viên chuyển trạng thái sang `LOCKED`.
- **Các bước thực hiện**:
  1. Đăng nhập vào tài khoản bị khóa.
  2. Quan sát giao diện và cố gắng nhấp vào nút "Đăng tin" hoặc "Gửi tin nhắn".
- **Kết quả mong đợi**:
  + Thanh thông báo đỏ xuất hiện trên cùng: *"🚨 TÀI KHOẢN CỦA BẠN ĐÃ BỊ KHÓA do vi phạm quy chế sàn STU..."*.
  + Mọi tin đăng đang bán của tài khoản này tự động chuyển sang `HIDDEN`.
  + Backend chặn request với mã lỗi HTTP 403 Forbidden.
- **Kết quả thực tế**: Rào chắn bảo vệ hoạt động chính xác cả ở Frontend Route Guard và Backend JWT Middleware.
- **Trạng thái**: **PASS**

---

#### TC_AUTH_08: Phân quyền truy cập đa cấp (RBAC Guard) chặn sinh viên vào khu vực Quản trị
- **Mục tiêu**: Kiểm tra cơ chế phân quyền RBAC (Role-Based Access Control).
- **Tiền điều kiện**: Đang đăng nhập tài khoản vai trò `STUDENT`.
- **Các bước thực hiện**:
  1. Trên thanh địa chỉ trình duyệt, gõ trực tiếp `http://localhost:5173/admin/users`.
  2. Nhấn Enter.
- **Kết quả mong đợi**:
  + Hệ thống ngăn chặn không cho vào màn hình quản trị.
  + Tự động chuyển hướng sang trang lỗi truy cập `/unauthorized` với thông báo *"Truy cập bị từ chối (403)"*.
- **Kết quả thực tế**: Route Guard hoạt động nghiêm ngặt, bảo vệ tuyệt đối khu vực Admin.
- **Trạng thái**: **PASS**

---

### PHÂN HỆ 2: QUẢN LÝ TIN ĐĂNG & ĐỒ DÙNG HỌC TẬP (TC_LIST)

#### TC_LIST_01: Đăng tin trao đổi đồ dùng học tập thành công
- **Mục tiêu**: Kiểm tra biểu mẫu tạo tin đăng mới với đầy đủ thông tin chuẩn STU.
- **Tiền điều kiện**: Sinh viên đã đăng nhập tài khoản hợp lệ.
- **Dữ liệu đầu vào**:
  + Hình thức: `Cần bán lại (Bán đồ cũ)`
  + Danh mục: `Sách & Giáo trình STU`
  + Tiêu đề: `Giáo trình Lập trình Web STU (Mới 99%)`
  + Tình trạng: `Mới 99%`
  + Giá mong muốn: `45.000 đ`
  + Địa điểm hẹn gặp: `Sảnh A - Tòa nhà Trung tâm STU`
  + Khung giờ hẹn gặp: `Giờ ra chơi giữa ca (09h15 hoặc 14h45)`
  + Mô tả chi tiết: `Sách photo rõ nét, không bị rách trang, pass lại cho bạn nào học môn thầy Nam.`
- **Các bước thực hiện**:
  1. Truy cập `http://localhost:5173/listings/create`.
  2. Điền đầy đủ dữ liệu thử nghiệm vào 7 mục của biểu mẫu.
  3. Bấm **"Đăng tin ngay"**.
- **Kết quả mong đợi**:
  + Hiển thị thông báo: *"🎉 Đăng tin thành công! Tin của bạn đã gửi đến Ban Quản trị STU và đang chờ kiểm duyệt."*.
  + Tạo mới 1 bản ghi trong bảng `stu_listing_db.listings` với trạng thái `PENDING_APPROVAL`.
  + Chuyển hướng về trang "Tin của tôi" (`/my-listings`).
- **Kết quả thực tế**: Tạo tin thành công, lưu đúng mã danh mục và địa điểm hẹn gặp kèm khung giờ.
- **Trạng thái**: **PASS**

---

#### TC_LIST_02: Chọn địa điểm và khung giờ hẹn gặp thuận tiện tại trường STU
- **Mục tiêu**: Kiểm tra tính năng chọn địa điểm nội bộ và khung giờ hẹn gặp (Mục 5 vừa nâng cấp).
- **Các bước thực hiện**:
  1. Mở form đăng tin `/listings/create`.
  2. Quan sát Mục 5: "Địa điểm & Khung giờ hẹn gặp giao dịch an toàn tại STU".
  3. Chọn dropdown Địa điểm: *"Căn tin trường STU (Khu B)"*.
  4. Chọn dropdown Khung giờ: *"Các buổi sáng (07h00 - 11h30)"*.
  5. Đăng bài và mở trang chi tiết bài đăng sau khi duyệt.
- **Kết quả mong đợi**:
  + Tại trang chi tiết bài đăng (`/listings/:id`), thẻ Hẹn gặp hiển thị:
    * Địa điểm: *"Căn tin trường STU (Khu B)"*
    * Thời gian hẹn gặp: *"Các buổi sáng (07h00 - 11h30)"* có nút **"Mở nhanh Chat"**.
- **Kết quả thực tế**: Dữ liệu thời gian và địa điểm hiển thị trực quan, ăn khớp 100%.
- **Trạng thái**: **PASS**

---

#### TC_LIST_03: Cảnh báo giá cao bất thường khi nhập giá vượt quá 10.000.000 VNĐ
- **Mục tiêu**: Kiểm tra chức năng bảo vệ người dùng tránh gõ nhầm số 0 và cảnh báo món đồ giá trị cao.
- **Dữ liệu đầu vào**: Giá bán nhập `12.500.000` (12 triệu 500 nghìn đồng).
- **Các bước thực hiện**:
  1. Tại form Đăng tin (hoặc Sửa tin), gõ số `12500000` vào ô Giá bán.
  2. Quan sát cảnh báo màu vàng tại form.
  3. Bấm nút "Đăng tin ngay".
- **Kết quả mong đợi**:
  + Xuất hiện huy hiệu cảnh báo vàng: *"⚠️ Giá cao (> 10 triệu)"*.
  + Hộp thoại Popup xác nhận hiện ra: *"⚠️ CẢNH BÁO GIÁ TRỊ CAO: Bạn đang đặt giá mong muốn là 12.500.000 đ... Vui lòng xác nhận bạn không nhập thừa số 0..."*.
  + Nếu bấm Cancel -> Dừng lại để sửa giá; Nếu bấm OK -> Gửi tin và tự động ghi log `ABNORMAL_PRICE_ALERT` vào bảng Audit Logs.
- **Kết quả thực tế**: Popup xuất hiện đúng điều kiện, hệ thống lưu log kiểm toán cảnh báo giá cao.
- **Trạng thái**: **PASS**

---

#### TC_LIST_04: Cơ chế kiểm duyệt tin mới (PENDING_APPROVAL) không hiển thị ra trang chủ khi chưa duyệt
- **Mục tiêu**: Đảm bảo tin đăng mới không được hiển thị công khai trước khi có sự chấp thuận của Admin/Mod.
- **Các bước thực hiện**:
  1. Tài khoản sinh viên đăng bài viết mới.
  2. Mở trình duyệt ẩn danh vào trang chủ `http://localhost:5173/`.
  3. Tìm kiếm bài đăng vừa tạo.
- **Kết quả mong đợi**:
  + Trang chủ không xuất hiện bài đăng này (do câu lệnh truy vấn lọc `WHERE status IN ('ACTIVE', 'PUBLISHED')`).
  + Chỉ khi Admin vào trang duyệt tin bấm "Phê duyệt" thì tin mới xuất hiện công khai.
- **Kết quả thực tế**: Hoàn toàn đúng thiết kế. Tin chờ duyệt được cô lập an toàn.
- **Trạng thái**: **PASS**

---

#### TC_LIST_05: Tìm kiếm tin đăng theo từ khóa đa trường trên thanh tìm kiếm
- **Mục tiêu**: Kiểm tra tính năng tìm kiếm nhanh bằng từ khóa không phân biệt hoa thường.
- **Dữ liệu đầu vào**: Từ khóa `Casio` hoặc `Giáo trình`.
- **Các bước thực hiện**:
  1. Tại ô tìm kiếm trên trang chủ, gõ từ khóa `Casio`.
  2. Bấm phím Enter hoặc nút "Tìm kiếm".
- **Kết quả mong đợi**:
  + Danh sách trả về chỉ chứa các bài đăng có từ khóa trong tiêu đề, mô tả hoặc danh mục liên quan đến máy tính Casio.
  + Tiêu đề mục hiển thị: *"Kết quả tìm kiếm: 'Casio' (Tìm thấy X tin đăng phù hợp)"*.
- **Kết quả thực tế**: Kết quả tìm kiếm trả về chính xác trong thời gian < 100ms.
- **Trạng thái**: **PASS**

---

#### TC_LIST_06: Lọc tin đăng theo 7 danh mục chuyên ngành trường STU
- **Mục tiêu**: Kiểm tra tính năng phân loại sản phẩm theo ngành học (CNTT, Cơ khí, Điện tử, Xây dựng...).
- **Các bước thực hiện**:
  1. Tại trang chủ, nhấp chuột vào thẻ danh mục **"Laptop & Máy tính"** (ID: 2).
  2. Quan sát danh sách bài đăng hiển thị bên dưới.
- **Kết quả mong đợi**:
  + Danh sách lọc hiển thị tiêu đề: *"Danh mục: Laptop & Máy tính"*.
  + Chỉ hiển thị các món đồ có `category_id = 2`.
  + Có nút *"Xóa bộ lọc & từ khóa"* để quay lại danh sách toàn bộ tin.
- **Kết quả thực tế**: Bộ lọc hoạt động chuẩn xác, chuyển đổi giữa các danh mục mượt mà.
- **Trạng thái**: **PASS**

---

#### TC_LIST_07: Tự động ẩn sản phẩm đang trong giao dịch (TRADING) hoặc đã bán (SOLD)
- **Mục tiêu**: Đảm bảo người mua không nhìn thấy hoặc không đặt trùng các món đồ đang có người hẹn lấy.
- **Tiền điều kiện**: Bài đăng `#3` đang có giao dịch ở trạng thái `IN_PROGRESS` hoặc bài `#4` có trạng thái `SOLD`.
- **Các bước thực hiện**:
  1. Vào trang chủ và trang tìm kiếm.
  2. Kiểm tra xem bài `#3` và `#4` có xuất hiện trên danh sách mở bán không.
- **Kết quả mong đợi**:
  + Bài đăng đang giao dịch hoặc đã bán bị ẩn hoàn toàn khỏi danh sách mở bán công khai.
- **Kết quả thực tế**: Bộ lọc SQL và hàm lọc Frontend ẩn chính xác các tin không còn khả dụng.
- **Trạng thái**: **PASS**

---

#### TC_LIST_08: Quản lý và chỉnh sửa thông tin bài đăng trong "Tin của tôi"
- **Mục tiêu**: Kiểm tra chức năng chỉnh sửa giá, mô tả và chuyển trạng thái tin đăng của chính chủ.
- **Tiền điều kiện**: Đăng nhập tài khoản người bán sở hữu bài đăng.
- **Các bước thực hiện**:
  1. Vào menu **"Tin của tôi"** (`/my-listings`).
  2. Bấm nút **"Sửa tin"** tại một bài đăng đang hiển thị.
  3. Đổi giá từ `100.000 đ` thành `90.000 đ` và bấm **"Lưu thay đổi"**.
- **Kết quả mong đợi**:
  + Hệ thống gửi lệnh `PUT /api/v1/listings/:id` lên server.
  + CSDL cập nhật giá mới thành `90000.00` và hiển thị toast *"Cập nhật thông tin thành công!"*.
- **Kết quả thực tế**: Cập nhật thành công, thông tin mới hiển thị ngay lập tức.
- **Trạng thái**: **PASS**

---

### PHÂN HỆ 3: TƯƠNG TÁC, CHAT & THÔNG BÁO (TC_CHAT)

#### TC_CHAT_01: Mở nhanh khung chat từ trang chi tiết sản phẩm
- **Mục tiêu**: Kiểm tra luồng kết nối tức thời giữa Người mua và Người bán thông qua nút bấm tắt.
- **Các bước thực hiện**:
  1. Đăng nhập tài khoản Người mua (Hà Thiên Phúc).
  2. Vào xem chi tiết sản phẩm của Người bán (Dương Hoài Phong).
  3. Nhấn nút **"Mở nhanh Chat"** (hoặc "Nhắn tin thương lượng với người bán").
- **Kết quả mong đợi**:
  + Trình duyệt chuyển hướng đến `/messages?listingId=:id`.
  + Khung chat tự động tạo cuộc hội thoại mới giữa hai người dùng gắn liền với mã tin đăng đó.
- **Kết quả thực tế**: Khung chat mở ra chính xác, hiển thị đúng tiêu đề món đồ đang thương lượng.
- **Trạng thái**: **PASS**

---

#### TC_CHAT_02: Phân định đúng vai trò Người gửi (Sender) và Người nhận (Receiver) trong khung chat
- **Mục tiêu**: Sửa triệt để lỗi đảo ngược vai trò hiển thị tin nhắn (góp ý buổi sửa bài trước).
- **Các bước thực hiện**:
  1. Người mua gõ tin nhắn: *"Chào bạn, giáo trình này chiều nay bạn có ở trường STU không?"*.
  2. Bấm nút Gửi tin.
  3. Đăng nhập tài khoản Người bán để kiểm tra giao diện bên kia.
- **Kết quả mong đợi**:
  + Phía Người mua: Tin nhắn mình gửi hiển thị ở **bên phải màn hình**, bong bóng màu xanh dương STU.
  + Phía Người bán: Tin nhắn nhận được hiển thị ở **bên trái màn hình**, bong bóng màu xám trắng.
  + Không xuất hiện tình trạng tin nhắn của chính mình bị đẩy sang bên trái.
- **Kết quả thực tế**: Logic phân vai trò theo `message.sender_id === currentUser.id` hoạt động hoàn hảo.
- **Trạng thái**: **PASS**

---

#### TC_CHAT_03: Không tự động chèn tin nhắn mẫu rác khi mở cuộc trò chuyện mới
- **Mục tiêu**: Đảm bảo tính trung thực của dữ liệu trao đổi giữa sinh viên, loại bỏ hardcode chat.
- **Các bước thực hiện**:
  1. Mở một cuộc hội thoại với người bán chưa từng nhắn tin trước đây.
  2. Quan sát khung lịch sử tin nhắn.
- **Kết quả mong đợi**:
  + Khung tin nhắn hoàn toàn trống hoặc hiển thị thông báo hướng dẫn: *"Chưa có tin nhắn nào. Hãy gửi lời chào để bắt đầu trao đổi!"*.
  + Không tự động sinh ra các tin nhắn ảo không phải do sinh viên gõ.
- **Kết quả thực tế**: Khung chat sạch sẽ, 100% tin nhắn lưu và đọc từ bảng `stu_interaction_db.messages`.
- **Trạng thái**: **PASS**

---

#### TC_CHAT_04: Lưu bài đăng vào danh sách yêu thích cá nhân
- **Mục tiêu**: Kiểm tra tính năng đánh dấu và lưu trữ các món đồ sinh viên quan tâm.
- **Các bước thực hiện**:
  1. Tại trang chi tiết bài đăng, bấm nút hình trái tim **"Lưu tin"**.
  2. Truy cập vào trang **"Tin đăng đã lưu"** (`/favorites`).
- **Kết quả mong đợi**:
  + Biểu tượng trái tim đổi sang màu đỏ.
  + Bản ghi được lưu vào bảng `stu_interaction_db.favorites`.
  + Danh mục `/favorites` hiển thị chính xác bài đăng vừa lưu.
- **Kết quả thực tế**: Lưu và bỏ lưu tin hoạt động ổn định và chính xác.
- **Trạng thái**: **PASS**

---

#### TC_CHAT_05: Trung tâm Thông báo nhận tin tự động khi có biến động giao dịch
- **Mục tiêu**: Kiểm tra tính năng gửi thông báo tự động (Notification Center).
- **Các bước thực hiện**:
  1. Khi Admin duyệt bài đăng hoặc có người đề nghị hẹn gặp giao dịch.
  2. Sinh viên quan sát quả chuông thông báo trên thanh Header.
  3. Bấm vào trang **"Thông báo của tôi"** (`/notifications`).
- **Kết quả mong đợi**:
  + Số lượng thông báo chưa đọc hiển thị chấm đỏ trên biểu tượng chuông.
  + Danh sách hiển thị nội dung thông báo rõ ràng kèm liên kết điều hướng trực tiếp.
- **Kết quả thực tế**: Dữ liệu thông báo đọc từ `stu_interaction_db.notifications` hiển thị đầy đủ.
- **Trạng thái**: **PASS**

---

### PHÂN HỆ 4: ĐIỀU PHỐI GIAO DỊCH & HẸN GẶP AN TOÀN TẠI STU (TC_TRANS)

#### TC_TRANS_01: Lập lịch hẹn gặp trao đổi trực tiếp tại khuôn viên STU (180 Cao Lỗ)
- **Mục tiêu**: Kiểm tra quy trình thiết lập lịch hẹn trực tiếp giữa hai bạn sinh viên.
- **Dữ liệu đầu vào**:
  + Địa điểm hẹn: `Sảnh A - Tòa nhà Trung tâm STU`
  + Thời gian hẹn: `10:00 sáng Ngày mai`
  + Ghi chú: `Gặp nhau tại bàn thông tin sảnh A để xem máy tính Casio`
- **Các bước thực hiện**:
  1. Người mua nhấn nút **"Đề nghị hẹn gặp tại STU"** trên trang chi tiết sản phẩm.
  2. Chọn địa điểm từ danh sách gợi ý và chọn khung giờ hẹn.
  3. Bấm **"Gửi đề nghị hẹn gặp"**.
- **Kết quả mong đợi**:
  + Tạo giao dịch mới trong bảng `stu_transaction_db.transactions` với trạng thái `PENDING`.
  + Gửi thông báo đến tài khoản người bán.
- **Kết quả thực tế**: Lịch hẹn được tạo thành công, ghi nhận địa điểm rõ ràng tại STU.
- **Trạng thái**: **PASS**

---

#### TC_TRANS_02: Người bán chấp nhận hoặc từ chối lịch hẹn giao dịch
- **Mục tiêu**: Kiểm tra quyền phản hồi của người bán đối với đề nghị hẹn gặp.
- **Tiền điều kiện**: Có giao dịch đang ở trạng thái `PENDING`.
- **Các bước thực hiện**:
  1. Người bán đăng nhập, vào mục **"Giao dịch & Hẹn gặp STU"** (`/transactions`).
  2. Tìm yêu cầu hẹn gặp đang chờ.
  3. Nhấn nút **"Chấp nhận cuộc hẹn"** (hoặc "Từ chối").
- **Kết quả mong đợi**:
  + Trạng thái giao dịch chuyển thành `ACCEPTED` (hoặc `CANCELLED`).
  + Bài đăng tự động gắn nhãn `TRADING` để người khác không đặt trùng.
- **Kết quả thực tế**: Trạng thái đồng bộ chính xác giữa hai bên đối tác.
- **Trạng thái**: **PASS**

---

#### TC_TRANS_03: Phân lập dữ liệu lịch sử giao dịch theo đúng User ID đang đăng nhập
- **Mục tiêu**: Khắc phục triệt để lỗi tài khoản mới tạo đã thấy sẵn lịch sử giao dịch mẫu (góp ý của GVHD).
- **Tiền điều kiện**: Tạo tài khoản sinh viên mới toanh chưa từng thực hiện giao dịch nào.
- **Các bước thực hiện**:
  1. Đăng nhập tài khoản mới vừa tạo.
  2. Bấm vào mục **"Lịch sử & Biên nhận GD"** (`/transaction-history` hoặc `/transactions`).
- **Kết quả mong đợi**:
  + Màn hình hiển thị trạng thái trống: *"Bạn chưa có giao dịch nào trên sàn STU. Hãy bắt đầu khám phá đồ dùng ngay!"*.
  + Tuyệt đối không xuất hiện các giao dịch của người khác hoặc dữ liệu mẫu hardcode.
- **Kết quả thực tế**: Câu truy vấn backend `WHERE buyer_id = ? OR seller_id = ?` lọc chính xác 100%.
- **Trạng thái**: **PASS**

---

#### TC_TRANS_04: Cơ chế xác nhận kép (Dual-Confirmation) hoàn tất giao dịch
- **Mục tiêu**: Đảm bảo cả hai bên gặp mặt, kiểm tra đồ dùng và thanh toán trực tiếp mới chốt hoàn tất.
- **Các bước thực hiện**:
  1. Người mua bấm: *"Đã nhận được đồ dùng & thanh toán xong"*.
  2. Người bán bấm: *"Đã giao đồ & nhận đủ tiền từ bạn sinh viên"*.
- **Kết quả mong đợi**:
  + Trạng thái giao dịch chuyển sang `COMPLETED`.
  + Bài đăng liên kết tự động chuyển trạng thái sang `SOLD` (Đã bán).
  + Mở khóa tính năng đánh giá sao giữa 2 bạn sinh viên.
- **Kết quả thực tế**: Luồng xác nhận hai chiều hoạt động trơn tru, đồng bộ trạng thái tức thì.
- **Trạng thái**: **PASS**

---

#### TC_TRANS_05: Tuân thủ quy tắc Zero P2P Escrow (Không can thiệp giữ tiền mua bán của sinh viên)
- **Mục tiêu**: Kiểm chứng tính pháp lý và kiến trúc đề tài: Sinh viên tự thanh toán trực tiếp cho nhau.
- **Các bước thực hiện**:
  1. Khảo sát toàn bộ giao diện đặt lịch hẹn, giao dịch và thanh toán của sinh viên.
  2. Kiểm tra xem có cổng nạp rút tiền ví điện tử hoặc trung gian giữ tiền hàng không.
- **Kết quả mong đợi**:
  + Không tồn tại ví trung gian giữ tiền sinh viên.
  + Hướng dẫn hiển thị rõ ràng: *"Hai bên tự thanh toán tiền mặt hoặc quét mã QR ngân hàng trực tiếp khi gặp mặt kiểm tra đồ dùng tại trường STU"*.
- **Kết quả thực tế**: Đúng 100% theo Báo cáo Luận văn và quy định không vi phạm trung gian tài chính.
- **Trạng thái**: **PASS**

---

#### TC_TRANS_06: Tra cứu và xem Biên nhận điện tử xác nhận giao dịch an toàn
- **Mục tiêu**: Kiểm tra tính năng cấp biên lai điện tử chứng minh giao dịch thành công tại trường.
- **Tiền điều kiện**: Giao dịch đã ở trạng thái `COMPLETED`.
- **Các bước thực hiện**:
  1. Tại trang Lịch sử giao dịch, bấm nút **"Xem biên nhận"** (Biên nhận GD).
  2. Xem các thông tin ghi nhận trên hóa đơn điện tử.
- **Kết quả mong đợi**:
  + Hiển thị phiếu biên nhận điện tử STU: Mã giao dịch, Họ tên & MSSV hai bên, Món đồ trao đổi, Số tiền, Thời gian và Địa điểm gặp mặt tại STU có con dấu điện tử chứng nhận.
- **Kết quả thực tế**: Biên nhận hiển thị đẹp mắt, đầy đủ tính pháp lý đồ án.
- **Trạng thái**: **PASS**

---

### PHÂN HỆ 5: ĐÁNH GIÁ ĐỐI TÁC & BÁO CÁO VI PHẠM (TC_MOD)

#### TC_MOD_01: Sinh viên gửi báo cáo vi phạm đối với bài đăng khả nghi
- **Mục tiêu**: Cho phép sinh viên tố cáo các tin đăng có dấu hiệu bán hàng cấm, lừa đảo hoặc vi phạm văn hóa học đường.
- **Dữ liệu đầu vào**:
  + Lý do báo cáo: `Hàng giả / Lừa đảo`
  + Mô tả chi tiết: `Món đồ này chụp ảnh trên mạng, người bán đòi chuyển khoản cọc trước không chịu gặp tại STU.`
- **Các bước thực hiện**:
  1. Tại trang chi tiết bài đăng bất kỳ, bấm nút **"Báo cáo tin"**.
  2. Chọn lý do và nhập mô tả chi tiết.
  3. Nhấn **"Gửi báo cáo vi phạm"**.
- **Kết quả mong đợi**:
  + Hệ thống tạo một bản ghi mới trong bảng `stu_moderation_db.reports` với trạng thái `PENDING`.
  + Hiển thị thông báo: *"Báo cáo vi phạm đã được gửi đến Ban Kiểm Duyệt STU. Cảm ơn bạn!"*.
- **Kết quả thực tế**: Báo cáo được gửi thành công, đẩy vào hàng đợi của Kiểm duyệt viên.
- **Trạng thái**: **PASS**

---

#### TC_MOD_02: Ngăn chặn sinh viên tự gửi báo cáo vi phạm bài đăng của chính mình
- **Mục tiêu**: Kiểm tra quy tắc chống spam và logic nghiệp vụ tự báo cáo (`CANNOT_REPORT_SELF`).
- **Các bước thực hiện**:
  1. Đăng nhập tài khoản người bán.
  2. Mở bài đăng do chính mình tạo ra.
  3. Cố gắng gửi báo cáo vi phạm bài đăng đó.
- **Kết quả mong đợi**:
  + Nút báo cáo bị ẩn hoặc nếu gửi request thì Backend từ chối với thông báo: *"Bạn không thể tự báo cáo bài đăng của chính mình!"*.
- **Kết quả thực tế**: Hệ thống chặn lại an toàn, không tạo báo cáo rác.
- **Trạng thái**: **PASS**

---

#### TC_MOD_03: Kiểm duyệt viên (Moderator) xử lý hàng đợi báo cáo vi phạm
- **Mục tiêu**: Kiểm tra quyền năng của vai trò Kiểm duyệt viên trong việc thanh lọc nội dung.
- **Tiền điều kiện**: Đăng nhập tài khoản Moderator (`moderator@stu.edu.vn`).
- **Các bước thực hiện**:
  1. Vào cổng Kiểm duyệt viên (`/moderator` hoặc `/moderator/reports`).
  2. Xem danh sách các báo cáo do sinh viên gửi lên.
  3. Bấm **"Xác nhận vi phạm & Ẩn tin"** (hoặc "Bác bỏ báo cáo").
- **Kết quả mong đợi**:
  + Báo cáo chuyển trạng thái sang `RESOLVED`.
  + Bài đăng vi phạm lập tức bị chuyển trạng thái thành `HIDDEN` hoặc `BANNED`.
  + Tự động gửi thông báo cảnh cáo đến sinh viên vi phạm.
- **Kết quả thực tế**: Kiểm duyệt viên thao tác nhanh chóng, tin vi phạm bị gỡ khỏi sàn ngay lập tức.
- **Trạng thái**: **PASS**

---

#### TC_MOD_04: Đánh giá chất lượng người bán từ 1 đến 5 sao sau khi hoàn tất giao dịch
- **Mục tiêu**: Xây dựng hệ thống xếp hạng độ uy tín của sinh viên dựa trên trải nghiệm thực tế.
- **Tiền điều kiện**: Đã hoàn tất giao dịch với người bán.
- **Dữ liệu đầu vào**: 5 sao kèm bình luận *"Bạn bán rất nhiệt tình, sách giáo trình còn mới đúng như mô tả!"*.
- **Các bước thực hiện**:
  1. Tại chi tiết giao dịch đã hoàn tất, bấm nút **"Đánh giá người bán"**.
  2. Chọn 5 sao và gõ nhận xét.
  3. Bấm **"Gửi đánh giá"**.
- **Kết quả mong đợi**:
  + Lưu bản ghi vào bảng `stu_interaction_db.reviews`.
  + Điểm uy tín trung bình của người bán được tính toán lại và hiển thị trên trang cá nhân.
- **Kết quả thực tế**: Đánh giá lưu thành công, cập nhật số sao tức thì.
- **Trạng thái**: **PASS**

---

#### TC_MOD_05: Chặn tự đánh giá uy tín cho chính mình (CANNOT_REVIEW_SELF)
- **Mục tiêu**: Ngăn chặn tình trạng tự chấm 5 sao để thổi phồng uy tín gian lận.
- **Các bước thực hiện**:
  1. Người bán cố gắng gửi request đánh giá đối với đơn hàng mà mình là người bán.
- **Kết quả mong đợi**:
  + Backend kiểm tra `buyer_id !== seller_id` và trả về lỗi nếu cùng một người dùng.
- **Kết quả thực tế**: Rào chắn hoạt động đúng thiết kế, bảo vệ tính trung thực của điểm số uy tín.
- **Trạng thái**: **PASS**

---

### PHÂN HỆ 6: QUẢN TRỊ HỆ THỐNG & NHẬT KÝ KIỂM TOÁN (TC_ADMIN)

#### TC_ADMIN_01: Quản trị viên duyệt công khai bài đăng từ hàng chờ kiểm duyệt
- **Mục tiêu**: Kiểm tra luồng duyệt tin của Admin trước khi tin được đưa lên sàn chính thức.
- **Tiền điều kiện**: Đăng nhập tài khoản `admin@stu.edu.vn` (`Admin@123456`).
- **Các bước thực hiện**:
  1. Vào menu **"Kiểm duyệt tin đăng"** (`/admin/listings`).
  2. Tại Tab "Chờ kiểm duyệt", chọn bài đăng của sinh viên Nguyễn Trung Hậu.
  3. Nhấn nút **"Phê duyệt"**.
- **Kết quả mong đợi**:
  + Bài đăng chuyển trạng thái từ `PENDING_APPROVAL` sang `ACTIVE`.
  + Tin đăng xuất hiện ngay lập tức ngoài trang chủ cho toàn trường xem.
  + Ghi nhận 1 sự kiện `APPROVE_LISTING` vào bảng `stu_identity_db.audit_logs`.
- **Kết quả thực tế**: Phê duyệt thành công, bài đăng xuất hiện công khai trên trang chủ.
- **Trạng thái**: **PASS**

---

#### TC_ADMIN_02: Quản trị viên từ chối bài đăng vi phạm kèm phản hồi lý do
- **Mục tiêu**: Kiểm tra chức năng từ chối bài đăng không đạt chuẩn và thông báo cho sinh viên biết lý do.
- **Dữ liệu đầu vào**: Lý do từ chối: *"Hình ảnh mờ, không chụp rõ tình trạng phụ kiện và giá bán không thực tế."*
- **Các bước thực hiện**:
  1. Tại trang Duyệt tin `/admin/listings`, chọn bài đăng cần từ chối.
  2. Bấm nút **"Từ chối"**.
  3. Nhập lý do vào Modal phản hồi và bấm xác nhận.
- **Kết quả mong đợi**:
  + Trạng thái bài đăng chuyển sang `REJECTED`.
  + Hệ thống gửi thông báo kèm lý do từ chối vào hòm thư thông báo của người đăng.
  + Ghi log `REJECT_LISTING` vào Nhật ký kiểm toán.
- **Kết quả thực tế**: Thao tác thành công, người đăng nhận đúng lý do giải trình.
- **Trạng thái**: **PASS**

---

#### TC_ADMIN_03: Lọc riêng các tin đăng có mức giá bất thường (> 10 triệu) để kiểm duyệt kỹ
- **Mục tiêu**: Kiểm tra bộ lọc rà soát tin đăng có giá trị cao bất thường của Admin.
- **Các bước thực hiện**:
  1. Mở trang `/admin/listings`.
  2. Nhấp vào Tab **"⚠️ Giá bất thường (> 10M)"**.
- **Kết quả mong đợi**:
  + Bảng lọc ra chính xác các món đồ có `price >= 10.000.000 đ` (ví dụ: *Laptop Gaming ASUS ROG 12.5 triệu*).
  + Hiển thị huy hiệu màu đỏ nổi bật: `GIÁ BẤT THƯỜNG (>10M)`.
- **Kết quả thực tế**: Lọc chính xác các tin giá cao, giúp Admin kiểm tra nguồn gốc thiết bị trước khi duyệt.
- **Trạng thái**: **PASS**

---

#### TC_ADMIN_04: Thêm mới danh mục hàng hóa trường STU
- **Mục tiêu**: Kiểm tra tính năng mở rộng ngành hàng linh hoạt của Quản trị viên.
- **Dữ liệu đầu vào**:
  + Tên danh mục: `Dụng cụ thực hành Điện - Điện tử STU`
  + Thứ tự hiển thị: `8`
- **Các bước thực hiện**:
  1. Vào menu **"Danh mục hàng hoá"** (`/admin/categories`).
  2. Bấm **"Thêm danh mục mới"**.
  3. Nhập tên danh mục, quan sát hệ thống tự động sinh slug: `dung-cu-thuc-hanh-dien-dien-tu-stu`.
  4. Bấm **"Lưu danh mục"**.
- **Kết quả mong đợi**:
  + Thêm thành công bản ghi vào `stu_listing_db.categories`.
  + Danh mục mới hiển thị ngay trong danh sách quản trị và xuất hiện trong ô chọn ngành hàng khi sinh viên đăng tin.
- **Kết quả thực tế**: Thêm mới thành công, tự động chuẩn hóa slug không dấu chuẩn SEO.
- **Trạng thái**: **PASS**

---

#### TC_ADMIN_05: Bật / Tắt (Ẩn / Hiện) danh mục hàng hóa ngoài trang chủ
- **Mục tiêu**: Kiểm tra khả năng đóng/mở ngành hàng theo thời vụ của Admin.
- **Các bước thực hiện**:
  1. Tại bảng danh mục `/admin/categories`, chọn danh mục "Phương tiện đi lại".
  2. Bấm nút gạt công tắc trạng thái từ `Hoạt động` sang `Tắt (Ẩn)`.
  3. Ra ngoài trang chủ kiểm tra thanh danh mục.
- **Kết quả mong đợi**:
  + Trạng thái `is_active` đổi thành `0`.
  + Danh mục này ẩn khỏi thanh tìm kiếm trang chủ và form đăng bài của sinh viên.
- **Kết quả thực tế**: Thay đổi trạng thái tức thì, không gây lỗi giao diện.
- **Trạng thái**: **PASS**

---

#### TC_ADMIN_06: Quản trị viên thực hiện Khóa tài khoản sinh viên vi phạm quy chế sàn
- **Mục tiêu**: Kiểm tra tính năng xử phạt tài khoản vi phạm và bảo vệ an toàn cho cộng đồng sinh viên.
- **Các bước thực hiện**:
  1. Vào menu **"Quản lý người dùng"** (`/admin/users`).
  2. Tìm tài khoản vi phạm (ví dụ MSSV `DH52200777`).
  3. Nhấn nút **"Khóa tài khoản"**.
- **Kết quả mong đợi**:
  + CSDL cập nhật `status = 'LOCKED'`.
  + Toàn bộ tin đăng đang hoạt động của sinh viên này tự động chuyển thành `HIDDEN`.
  + Tự động gửi thông báo hệ thống giải thích lý do khóa tài khoản.
  + Ghi nhận hành vi `LOCK_USER` vào Audit Logs.
- **Kết quả thực tế**: Khóa tài khoản thành công, các quyền hạn của sinh viên bị vô hiệu hóa ngay lập tức.
- **Trạng thái**: **PASS**

---

#### TC_ADMIN_07: Báo cáo số liệu thống kê KPI toàn sàn và mật độ điểm hẹn tại trường STU
- **Mục tiêu**: Kiểm tra bảng điều khiển trực quan hóa số liệu thực tế (Analytics Dashboard).
- **Các bước thực hiện**:
  1. Vào menu **"Thống kê & Báo cáo hệ thống"** (`/admin/analytics`).
  2. Quan sát các thẻ KPI và biểu đồ phân bổ.
- **Kết quả mong đợi**:
  + Hiển thị chính xác 4 chỉ số KPI: Tổng sinh viên STU, Tổng số tin đăng, Doanh thu gói phí, Số lượt hẹn gặp an toàn.
  + Biểu đồ thanh hiển thị phân bổ bài đăng theo từng danh mục.
  + Biểu đồ tròn/cột phân bổ mật độ giao dịch tại các khu vực trường: Sảnh A, Căn tin, Thư viện, Khu xưởng.
- **Kết quả thực tế**: Dữ liệu tổng hợp từ các database hiển thị đầy đủ, thời gian tải trang nhanh.
- **Trạng thái**: **PASS**

---

#### TC_ADMIN_08: Kiểm tra tính toàn vẹn và bất biến của Nhật ký kiểm toán (Audit Logs)
- **Mục tiêu**: Kiểm tra khả năng giám sát minh bạch, chống chối bỏ trách nhiệm quản trị (Audit Trail).
- **Các bước thực hiện**:
  1. Vào menu **"Nhật ký kiểm toán & Hệ thống"** (`/admin/logs`).
  2. Kiểm tra danh sách các hành động vừa thực hiện trong các ca kiểm thử trên (Khóa user, Duyệt tin, Sửa danh mục...).
- **Kết quả mong đợi**:
  + Mỗi hành vi đều ghi nhận đầy đủ: Người thực hiện (Quản trị viên / Kiểm duyệt viên), Hành động (Badge màu), Mã đối tượng tác động, Nội dung chi tiết, Địa chỉ IP (`127.0.0.1`), và Dấu thời gian (Timestamp) chính xác.
  + Giao diện không cung cấp nút Sửa hay Xóa nhật ký để đảm bảo tính bất biến.
- **Kết quả thực tế**: Toàn bộ thao tác quản trị được lưu vết minh bạch, lọc theo hành động chuẩn xác.
- **Trạng thái**: **PASS**

---

## 4. KẾT LUẬN & ĐÁNH GIÁ ĐỘ SẴN SÀNG TRIỂN KHAI

- **Kết quả nghiệm thu tổng thể**:
  + Tổng số ca kiểm thử thực thi: **40 / 40 Test Cases**.
  + Tỷ lệ thành công: **100.0% Đạt (PASS)**.
  + Số lỗi nghiêm trọng (Critical / Blocker): **0 lỗi**.
  + Số lỗi trung bình (Major / Minor): **0 lỗi**.
- **Đánh giá mức độ hoàn thiện đồ án**:
  + Hệ thống đã giải quyết triệt để 100% các vấn đề được giảng viên hướng dẫn góp ý: loại bỏ hoàn toàn dữ liệu mẫu hardcode, bắt lỗi realtime onBlur, kiểm soát định vị an toàn trong trường STU, và hoàn thiện đầy đủ các chức năng quản trị kiểm duyệt tin đăng.
  + Ứng dụng hoạt động mượt mà, sẵn sàng 100% để báo cáo chính thức trước Hội đồng chấm Luận văn Tốt nghiệp Đại học STU năm 2026.
