import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = 8080;
const JWT_SECRET = 'STU_MARKETPLACE_SUPER_SECRET_KEY_2026';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection pool connecting to WampServer MySQL
const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Helper for standardized ApiResponse
function success(res, data = null, message = 'Success', code = 200) {
  return res.status(code).json({
    success: true,
    code,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

function failure(res, message = 'Error', code = 400) {
  return res.status(code).json({
    success: false,
    code,
    message,
    data: null,
    timestamp: new Date().toISOString(),
  });
}

// Authentication Middleware (with demo-friendly fallback to Hà Thiên Phúc if unauthenticated)
// Authentication Middleware (with real-time lock status verification in MySQL)
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  let userId = null;
  let decodedUser = null;

  if (token) {
    try {
      decodedUser = jwt.verify(token, JWT_SECRET);
      userId = decodedUser.id;
    } catch (err) {
      return failure(res, 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.', 401);
    }
  } else {
    return failure(res, 'Chưa đăng nhập hoặc phiên làm việc đã kết thúc. Vui lòng đăng nhập để tiếp tục.', 401);
  }

  // Real-time check against stu_identity_db.users in MySQL
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.full_name as fullName, u.student_id as studentCode,
              u.role, u.status,
              (SELECT status FROM stu_identity_db.user_verifications WHERE user_id = u.id ORDER BY id DESC LIMIT 1) as verificationStatus
       FROM stu_identity_db.users u
       WHERE u.id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return failure(res, 'Tài khoản người dùng không tồn tại trên hệ thống STU', 401);
    }

    const dbUser = rows[0];

    // Enforce lock status immediately
    if (dbUser.status === 'LOCKED' || dbUser.status === 'BANNED' || dbUser.status === 'SUSPENDED') {
      return failure(
        res,
        'Tài khoản STU của bạn đã bị KHÓA do vi phạm quy chế sàn. Mọi thao tác giao dịch, đăng bài và nhắn tin đã bị đình chỉ.',
        403
      );
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      fullName: dbUser.fullName,
      studentCode: dbUser.studentCode,
      role: dbUser.role,
      roles: [dbUser.role],
      status: dbUser.status,
      verificationStatus: dbUser.verificationStatus || 'VERIFIED',
    };
    next();
  } catch (dbErr) {
    console.error('authenticateToken DB check error:', dbErr);
    if (decodedUser) {
      req.user = decodedUser;
      return next();
    }
    return failure(res, 'Lỗi xác thực người dùng: ' + dbErr.message, 500);
  }
}

// Role-Based Access Control (RBAC) Middleware
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return failure(res, 'Chưa xác thực người dùng', 401);
    }
    const userRoles = req.user.roles || [req.user.role];
    const isAllowed = allowedRoles.some((role) => userRoles.includes(role));
    if (!isAllowed) {
      return failure(
        res,
        `Quyền truy cập bị từ chối: Tài khoản của bạn không có vai trò phù hợp (Yêu cầu: ${allowedRoles.join('/')})!`,
        403
      );
    }
    next();
  };
}

// Helper to seed initial accounts
async function initDatabaseDefaults() {
  try {
    // 0. Ensure status column in stu_identity_db.users supports 'LOCKED', 'ACTIVE', 'BANNED'
    try {
      await pool.query('ALTER TABLE stu_identity_db.users MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT "ACTIVE"');
    } catch (e) {}

    const defaultPassword = await bcrypt.hash('Stu@123456', 10);
    const adminPassword = await bcrypt.hash('Admin@123456', 10);

    // 1. Create or ensure accounts in stu_identity_db
    try {
      await pool.query('ALTER TABLE stu_identity_db.user_verifications MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT "PENDING"');
    } catch (e) {}

    await pool.query(`
      INSERT INTO stu_identity_db.users (id, student_id, email, password_hash, full_name, phone_number, role, status)
      VALUES 
      (1, 'DH52100123', 'admin@stu.edu.vn', '${adminPassword}', 'Quản Trị Viên STU', '0901234567', 'ADMIN', 'ACTIVE'),
      (2, 'DH52100456', 'moderator@stu.edu.vn', '${adminPassword}', 'Kiểm Duyệt Viên STU', '0902345678', 'MODERATOR', 'ACTIVE'),
      (3, 'DH52201642', 'dh52201642@student.stu.edu.vn', '${defaultPassword}', 'Hà Thiên Phúc (Người mua STU)', '0903456789', 'STUDENT', 'ACTIVE'),
      (4, 'DH52200413', 'dh52200413@student.stu.edu.vn', '${defaultPassword}', 'Dương Hoài Phong (Người bán STU)', '0904567890', 'STUDENT', 'ACTIVE')
      ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash), role = VALUES(role), status = VALUES(status);
    `);

    // Ensure student verifications
    await pool.query(`
      INSERT INTO stu_identity_db.user_verifications (user_id, student_card_image_url, status)
      VALUES (3, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300', 'APPROVED'),
             (4, 'https://images.unsplash.com/photo-1517055729441-db3aab13588f?w=300', 'APPROVED')
      ON DUPLICATE KEY UPDATE status = 'APPROVED';
    `);

    // 2. Sample listings in stu_listing_db
    const [rows] = await pool.query('SELECT count(*) as count FROM stu_listing_db.listings');
    if (rows[0].count === 0) {
      await pool.query(`
        INSERT INTO stu_listing_db.listings (id, seller_id, category_id, title, description, price, item_condition, status, location_notes)
        VALUES
        (1, 3, 1, 'Giáo trình Lập trình Web & Ứng dụng STU', 'Sách photo đẹp bìa kiếng, kèm tài liệu ôn thi cuối kỳ bộ môn CNTT.', 35000, 'LIKE_NEW', 'ACTIVE', 'Sảnh A - Tòa nhà Trung tâm STU'),
        (2, 4, 4, 'Kit thực hành Arduino Uno R3 + Cảm biến IoT', 'Kit thí nghiệm vi điều khiển dùng cho môn Kỹ thuật số, đủ dây cắm và board test.', 120000, 'LIKE_NEW', 'ACTIVE', 'Xưởng thực hành Điện - Điện tử STU'),
        (3, 3, 5, 'Máy tính khoa học Casio fx-580VN X', 'Chính hãng Bitex, còn nguyên tem bảo hành, dùng tốt cho các môn Toán cao cấp & Vật lý.', 350000, 'BRAND_NEW', 'ACTIVE', 'Căn tin trường STU (Khu B)'),
        (4, 4, 3, 'Thước chữ T và bảng vẽ A3 ngành Xây dựng / Kiến trúc', 'Dành cho các bạn K22, K23 học môn Vẽ kỹ thuật, tặng kèm bộ chì 2B-6B.', 80000, 'USED_GOOD', 'ACTIVE', 'Thư viện tầng 3 - Tòa nhà A');
      `);

      await pool.query(`
        INSERT INTO stu_listing_db.listing_images (listing_id, image_url, display_order, is_primary)
        VALUES
        (1, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', 0, 1),
        (2, 'https://images.unsplash.com/photo-1517055729441-db3aab13588f?w=600&auto=format&fit=crop&q=80', 0, 1),
        (3, 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80', 0, 1),
        (4, 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=80', 0, 1);
      `);
    }
    // 3. Ensure Notifications Table in stu_interaction_db
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stu_interaction_db.notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'SYSTEM',
        reference_id INT NULL,
        link_url VARCHAR(255) NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [notifRows] = await pool.query('SELECT count(*) as count FROM stu_interaction_db.notifications');
    if (notifRows[0].count === 0) {
      await pool.query(`
        INSERT INTO stu_interaction_db.notifications (user_id, title, content, type, link_url, is_read, created_at)
        VALUES
        (3, 'Đề nghị hẹn gặp giao dịch mới', 'Lê Thảo Vy (DH52201456) đã gửi đề nghị hẹn gặp giao dịch cho món đồ \"Laptop Dell Latitude E5470\" tại Sảnh A lúc 14:30.', 'TRANSACTION', '/transactions', 0, NOW()),
        (3, 'Xác thực thẻ sinh viên STU thành công', 'Hồ sơ xác minh thẻ SV MSSV DH52201642 của bạn đã được Ban Cố Vấn trường STU phê duyệt chính thức.', 'VERIFICATION', '/profile', 0, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
        (3, 'Tin nhắn trao đổi mới từ bạn học', 'Trần Hoài Phong (DH52100889) đã gửi tin nhắn: \"Còn đầy đủ mic rời với hộp luôn bạn ơi, mai 9h sáng mình có tiết ở khu C STU nè.\"', 'MESSAGE', '/messages', 0, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
        (3, 'Kích hoạt gói Tin đăng nổi bật STU', 'Gói đẩy bài Trang chủ STU của bạn đã được kích hoạt thành công (thời hạn 7 ngày).', 'SYSTEM', '/my-listings', 1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
        (3, 'Nhắc nhở an toàn từ Ban Cố vấn STU', 'Để tránh rủi ro, sinh viên STU vui lòng chỉ hẹn gặp và kiểm tra đồ dùng trực tiếp trong khuôn viên trường (180 Cao Lỗ).', 'SYSTEM', '/transactions', 1, DATE_SUB(NOW(), INTERVAL 2 DAY));
      `);
    }

    // 4. Ensure Audit Logs Table in stu_identity_db
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stu_identity_db.audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        actor_id INT NOT NULL,
        actor_name VARCHAR(100) NOT NULL,
        actor_role VARCHAR(50) NOT NULL,
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50) NOT NULL,
        target_id VARCHAR(100) NULL,
        details TEXT NULL,
        ip_address VARCHAR(50) DEFAULT '127.0.0.1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [auditRows] = await pool.query('SELECT count(*) as count FROM stu_identity_db.audit_logs');
    if (auditRows[0].count === 0) {
      await pool.query(`
        INSERT INTO stu_identity_db.audit_logs (actor_id, actor_name, actor_role, action, target_type, target_id, details, ip_address, created_at)
        VALUES
        (1, 'Quản Trị Viên STU', 'ADMIN', 'SYSTEM_INIT', 'SYSTEM', 'GATEWAY', 'Khởi tạo hệ thống Microservices & API Gateway trên cổng 8080', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 3 DAY)),
        (2, 'Kiểm Duyệt Viên STU', 'MODERATOR', 'VERIFY_STUDENT', 'USER_VERIFICATION', '3', 'Phê duyệt thẻ sinh viên MSSV DH52201642 (Hà Thiên Phúc - Khoa CNTT)', '192.168.1.15', DATE_SUB(NOW(), INTERVAL 2 DAY)),
        (2, 'Kiểm Duyệt Viên STU', 'MODERATOR', 'APPROVE_LISTING', 'LISTING', '1', 'Duyệt bài đăng: Giáo trình Lập trình Web & Ứng dụng STU', '192.168.1.15', DATE_SUB(NOW(), INTERVAL 2 DAY)),
        (1, 'Quản Trị Viên STU', 'ADMIN', 'UPDATE_PACKAGE', 'BILLING', 'BOOST_7_DAYS', 'Cập nhật giá niêm yết gói Đẩy tin nổi bật 7 ngày thành 15.000 VNĐ', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 1 DAY)),
        (2, 'Kiểm Duyệt Viên STU', 'MODERATOR', 'VERIFY_STUDENT', 'USER_VERIFICATION', '4', 'Phê duyệt thẻ sinh viên MSSV DH52200413 (Dương Hoài Phong - Khoa Điện tử)', '192.168.1.20', DATE_SUB(NOW(), INTERVAL 18 HOUR)),
        (1, 'Quản Trị Viên STU', 'ADMIN', 'LOCK_USER', 'USER', '5', 'Khóa tài khoản sinh viên vi phạm quy chế bán đồ cấm trong trường STU', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
        (1, 'Quản Trị Viên STU', 'ADMIN', 'ADD_CATEGORY', 'CATEGORY', '7', 'Bổ sung danh mục: Phương tiện đi lại (Xe máy/Xe đạp SV)', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 2 HOUR));
      `);
    }

    // 5. Ensure diverse sample invoices in stu_billing_db.invoices
    const [invCount] = await pool.query('SELECT count(*) as count FROM stu_billing_db.invoices');
    if (invCount[0].count <= 1) {
      await pool.query(`
        INSERT INTO stu_billing_db.invoices (invoice_code, user_id, listing_id, package_id, amount, status, created_at, paid_at)
        VALUES
        ('INV-914205', 4, 2, 2, 10000, 'PAID', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
        ('INV-439281', 3, 3, 3, 15000, 'PAID', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
        ('INV-192847', 4, 4, 2, 10000, 'PAID', DATE_SUB(NOW(), INTERVAL 12 HOUR), DATE_SUB(NOW(), INTERVAL 12 HOUR)),
        ('INV-556712', 3, 1, 3, 15000, 'PAID', DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR)),
        ('INV-773129', 4, 2, 2, 10000, 'PENDING', NOW(), NULL);
      `);
    }

    console.log('✅ CSDL MySQL trên WampServer đã được khởi tạo và kiểm tra thành công!');
  } catch (err) {
    console.error('Lỗi khởi tạo CSDL:', err.message);
  }
}

// ==========================================
// 1. AUTHENTICATION API ENDPOINTS
// ==========================================

// Register
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, studentCode, phone } = req.body;

    if (!email || !password || !fullName) {
      return failure(res, 'Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu', 400);
    }

    const trimmedEmail = (email || '').trim().toLowerCase();

    // RÀNG BUỘC EMAIL SINH VIÊN CHÍNH THỐNG:
    // Bắt buộc email đăng ký phải có đuôi trường (@student.stu.edu.vn hoặc @stu.edu.vn)
    // Chặn hoàn toàn các email cá nhân bên ngoài (@gmail.com, @yahoo.com,...)
    const isStuEmail = /^[\w.-]+@(student\.stu\.edu\.vn|stu\.edu\.vn)$/i.test(trimmedEmail);
    if (!isStuEmail) {
      return failure(
        res,
        'Email không hợp lệ! Bắt buộc phải sử dụng email sinh viên trường STU (@student.stu.edu.vn hoặc @stu.edu.vn). Hệ thống chặn mọi email cá nhân bên ngoài.',
        400
      );
    }

    // RÀNG BUỘC MÃ SỐ SINH VIÊN (MSSV):
    let finalStudentCode = null;
    if (studentCode && studentCode.trim()) {
      finalStudentCode = studentCode.trim().toUpperCase();
      if (!/^DH[0-9]{8}$/i.test(finalStudentCode) && !/^[A-Z0-9]{8,12}$/i.test(finalStudentCode)) {
        return failure(
          res,
          'Mã số sinh viên không hợp lệ! MSSV trường STU gồm đúng 10 ký tự (Ví dụ: DH52201642 hoặc DH52001234).',
          400
        );
      }
    }

    // Check existing email or studentCode
    const [existing] = await pool.query(
      'SELECT id, email, student_id FROM stu_identity_db.users WHERE email = ? OR (student_id = ? AND student_id IS NOT NULL)',
      [trimmedEmail, finalStudentCode || null]
    );

    if (existing.length > 0) {
      if (existing[0].email === trimmedEmail) {
        return failure(res, 'Email sinh viên này đã được đăng ký tài khoản trên hệ thống STU', 400);
      }
      return failure(res, 'Mã số sinh viên này đã được đăng ký tài khoản trên hệ thống STU', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO stu_identity_db.users (student_id, email, password_hash, full_name, phone_number, role, status)
       VALUES (?, ?, ?, ?, ?, 'STUDENT', 'ACTIVE')`,
      [finalStudentCode || null, trimmedEmail, passwordHash, fullName.trim(), phone ? phone.trim() : null]
    );

    const newUserId = result.insertId;

    // Create a pending verification entry for this new student
    try {
      await pool.query(
        `INSERT INTO stu_identity_db.user_verifications (user_id, student_card_image_url, status)
         VALUES (?, NULL, 'PENDING')`,
        [newUserId]
      );
    } catch (e) {
      // ignore if duplicate or schema diff
    }

    // Welcome notification in Notification Center
    try {
      await pool.query(
        `INSERT INTO stu_interaction_db.notifications (user_id, title, content, type, link_url)
         VALUES (?, 'Chào mừng gia nhập STU Marketplace!', 'Tài khoản sinh viên STU của bạn đã được khởi tạo thành công. Vui lòng xác minh thẻ sinh viên để bắt đầu trao đổi an toàn.', 'SYSTEM', '/verify-student')`,
        [newUserId]
      );
    } catch (e) {
      // ignore
    }

    const tokenPayload = {
      id: newUserId,
      email,
      fullName,
      studentCode: studentCode || null,
      roles: ['STUDENT'],
      status: 'ACTIVE',
      verificationStatus: 'PENDING',
    };

    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign({ id: newUserId }, JWT_SECRET, { expiresIn: '30d' });

    return success(
      res,
      {
        accessToken,
        refreshToken,
        user: tokenPayload,
      },
      'Đăng ký tài khoản sinh viên STU thành công!',
      201
    );
  } catch (err) {
    console.error(err);
    return failure(res, 'Lỗi hệ thống khi đăng ký: ' + err.message, 500);
  }
});

// Login
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { emailOrStudentCode, password } = req.body;

    if (!emailOrStudentCode || !password) {
      return failure(res, 'Vui lòng nhập Email/MSSV và Mật khẩu');
    }

    const [users] = await pool.query(
      `SELECT u.*, v.status as verification_status 
       FROM stu_identity_db.users u
       LEFT JOIN stu_identity_db.user_verifications v ON u.id = v.user_id
       WHERE u.email = ? OR u.student_id = ?
       ORDER BY v.id DESC LIMIT 1`,
      [emailOrStudentCode, emailOrStudentCode]
    );

    if (users.length === 0) {
      return failure(res, 'Tài khoản không tồn tại trong hệ thống STU', 401);
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return failure(res, 'Mật khẩu không chính xác', 401);
    }

    if (user.status === 'LOCKED' || user.status === 'BANNED' || user.status === 'SUSPENDED') {
      return failure(
        res,
        'Tài khoản STU của bạn đã bị KHÓA do vi phạm quy chế sàn. Vui lòng liên hệ Quản trị viên hoặc Phòng Công tác Sinh viên STU.',
        403
      );
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      studentCode: user.student_id,
      roles: [user.role],
      status: user.status,
      verificationStatus: user.verification_status || 'VERIFIED',
    };

    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });

    return success(res, {
      accessToken,
      refreshToken,
      user: tokenPayload,
    }, 'Đăng nhập thành công!');
  } catch (err) {
    console.error(err);
    return failure(res, 'Lỗi khi đăng nhập: ' + err.message, 500);
  }
});

// Get Current User Profile
app.get('/api/v1/users/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.student_id, u.email, u.full_name, u.phone_number, u.role, u.status,
              v.status as verification_status
       FROM stu_identity_db.users u
       LEFT JOIN stu_identity_db.user_verifications v ON u.id = v.user_id
       WHERE u.id = ? ORDER BY v.id DESC LIMIT 1`,
      [req.user.id]
    );

    if (users.length === 0) {
      return failure(res, 'Người dùng không tồn tại', 404);
    }

    const user = users[0];
    return success(res, {
      id: user.id,
      studentCode: user.student_id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone_number,
      roles: [user.role],
      status: user.status,
      verificationStatus: user.verification_status || 'VERIFIED',
    });
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Logout
app.post('/api/v1/auth/logout', (req, res) => {
  return success(res, null, 'Đăng xuất thành công');
});

// ==========================================
// 2. STUDENT VERIFICATION API
// ==========================================

app.post('/api/v1/students/verify', authenticateToken, async (req, res) => {
  try {
    const { studentCode, evidenceReference } = req.body;
    const cardImage = evidenceReference || 'https://stu.edu.vn/card-demo.jpg';

    if (studentCode) {
      const code = studentCode.trim().toUpperCase();
      if (!/^DH[0-9]{8}$/i.test(code) && !/^[A-Z0-9]{8,12}$/i.test(code)) {
        return failure(res, 'Mã số sinh viên không hợp lệ! MSSV trường STU gồm 10 ký tự (Ví dụ: DH52201642)', 400);
      }
      await pool.query('UPDATE stu_identity_db.users SET student_id = ? WHERE id = ?', [code, req.user.id]);
    }

    const [result] = await pool.query(
      `INSERT INTO stu_identity_db.user_verifications (user_id, student_card_image_url, status)
       VALUES (?, ?, 'APPROVED')`,
      [req.user.id, cardImage]
    );

    return success(res, { id: result.insertId, status: 'APPROVED' }, 'Xác minh thẻ sinh viên STU thành công!', 201);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

app.get('/api/v1/students/my-verifications', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM stu_identity_db.user_verifications WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    return success(res, rows);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// ==========================================
// 3. CATEGORIES & LISTINGS API
// ==========================================

// Get Categories
app.get('/api/v1/categories', async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT id, name, slug, icon_url, sort_order, is_active FROM stu_listing_db.categories WHERE is_active = 1 ORDER BY sort_order ASC'
    );
    return success(res, categories);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Get Public Listings (Search, filter, paging)
app.get('/api/v1/listings', async (req, res) => {
  try {
    const { keyword, search, q, categoryId, page = 0, size = 50 } = req.query;
    const searchTerm = (keyword || search || q || '').trim();

    let query = `
      SELECT l.id, l.title, l.description, l.price, l.item_condition as itemCondition, 
             l.status, l.location_notes as locationNotes, l.created_at as createdAt,
             c.name as categoryName, u.full_name as sellerName, u.student_id as sellerStudentCode,
             (SELECT image_url FROM stu_listing_db.listing_images WHERE listing_id = l.id ORDER BY display_order ASC LIMIT 1) as primaryImageUrl
      FROM stu_listing_db.listings l
      LEFT JOIN stu_listing_db.categories c ON l.category_id = c.id
      LEFT JOIN stu_identity_db.users u ON l.seller_id = u.id
      WHERE l.status IN ('ACTIVE', 'PUBLISHED')
        AND l.status NOT IN ('TRADING', 'IN_TRANSACTION', 'RESERVED', 'PENDING_MEETUP', 'SOLD', 'HIDDEN', 'BANNED')
        AND l.id NOT IN (
          SELECT DISTINCT listing_id FROM stu_transaction_db.transactions 
          WHERE status IN ('ACCEPTED', 'IN_PROGRESS', 'CONFIRMED')
        )
    `;
    const params = [];

    if (searchTerm) {
      query += ' AND (l.title LIKE ? OR l.description LIKE ? OR c.name LIKE ? OR l.location_notes LIKE ?)';
      params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
    }

    if (categoryId) {
      query += ' AND l.category_id = ?';
      params.push(categoryId);
    }

    query += ' ORDER BY l.id DESC LIMIT ? OFFSET ?';
    params.push(Number(size), Number(page) * Number(size));

    const [listings] = await pool.query(query, params);
    const [countResult] = await pool.query(`
      SELECT count(*) as total 
      FROM stu_listing_db.listings l
      WHERE l.status IN ('ACTIVE', 'PUBLISHED')
        AND l.status NOT IN ('TRADING', 'IN_TRANSACTION', 'RESERVED', 'PENDING_MEETUP', 'SOLD', 'HIDDEN', 'BANNED')
        AND l.id NOT IN (
          SELECT DISTINCT listing_id FROM stu_transaction_db.transactions 
          WHERE status IN ('ACCEPTED', 'IN_PROGRESS', 'CONFIRMED')
        )
    `);

    return success(res, {
      content: listings,
      totalElements: countResult[0].total,
      totalPages: Math.ceil(countResult[0].total / Number(size)),
      page: Number(page),
      size: Number(size),
    });
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Get Single Listing Detail
app.get('/api/v1/listings/:id', async (req, res) => {
  try {
    const [listings] = await pool.query(
      `SELECT l.*, c.name as categoryName, u.full_name as sellerName, u.email as sellerEmail, u.phone_number as sellerPhone
       FROM stu_listing_db.listings l
       LEFT JOIN stu_listing_db.categories c ON l.category_id = c.id
       LEFT JOIN stu_identity_db.users u ON l.seller_id = u.id
       WHERE l.id = ?`,
      [req.params.id]
    );

    if (listings.length === 0) {
      return failure(res, 'Không tìm thấy tin đăng', 404);
    }

    const listing = listings[0];
    const [images] = await pool.query(
      'SELECT id, image_url as imageUrl, display_order as displayOrder, is_primary as isPrimary FROM stu_listing_db.listing_images WHERE listing_id = ? ORDER BY display_order ASC',
      [listing.id]
    );

    return success(res, { ...listing, images });
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Create New Listing
app.post('/api/v1/listings', authenticateToken, async (req, res) => {
  try {
    const {
      categoryId,
      title,
      description,
      price,
      itemCondition,
      submitForReview,
      images,
      locationNotes,
      campusLocation,
      meetupTime,
    } = req.body;

    if (!title || !description || categoryId === undefined) {
      return failure(res, 'Vui lòng cung cấp đầy đủ Tiêu đề, Danh mục và Mô tả sản phẩm');
    }

    // Map itemCondition to DB Enum
    let dbCondition = 'USED_GOOD';
    if (itemCondition === 'NEW') dbCondition = 'BRAND_NEW';
    else if (itemCondition === 'LIKE_NEW') dbCondition = 'LIKE_NEW';
    else if (itemCondition === 'USED') dbCondition = 'USED_GOOD';

    const numPrice = Number(price) || 0;
    // Luồng kiểm duyệt tin đăng STU:
    // Mọi tin gửi duyệt sẽ chuyển sang PENDING_APPROVAL để Quản trị viên kiểm duyệt trước khi hiển thị công khai
    const status = submitForReview ? 'PENDING_APPROVAL' : 'DRAFT';

    let finalLocationNotes = 'Khuôn viên trường Đại học Công Nghệ Sài Gòn (STU)';
    if (locationNotes) {
      finalLocationNotes = locationNotes;
    } else if (campusLocation) {
      finalLocationNotes = meetupTime ? `${campusLocation} • ${meetupTime}` : campusLocation;
    }

    const [result] = await pool.query(
      `INSERT INTO stu_listing_db.listings 
       (seller_id, category_id, title, description, price, item_condition, status, location_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, Number(categoryId), title, description, numPrice, dbCondition, status, finalLocationNotes]
    );

    const listingId = result.insertId;

    // Cảnh báo kiểm toán nếu giá cao bất thường (>= 10.000.000 đ)
    if (numPrice >= 10000000) {
      await recordAuditLog({
        actorId: req.user.id,
        actorName: req.user.fullName,
        actorRole: req.user.role,
        action: 'ABNORMAL_PRICE_ALERT',
        targetType: 'LISTING',
        targetId: listingId,
        details: `Cảnh báo tin đăng có mức giá bất thường (${numPrice.toLocaleString('vi-VN')} đ): "${title}" - cần Admin kiểm duyệt kỹ.`
      });
    }

    // Thông báo cho Ban Quản trị (Admin) về tin đăng mới
    try {
      await pool.query(
        `INSERT INTO stu_interaction_db.notifications (user_id, title, content, type)
         VALUES (1, ?, ?, 'SYSTEM')`,
        [
          numPrice >= 10000000 ? '⚠️ Cảnh báo tin giá cao bất thường cần duyệt' : 'Tin đăng mới cần kiểm duyệt',
          `Sinh viên ${req.user.fullName} vừa đăng tin #${listingId} "${title}" (${numPrice.toLocaleString('vi-VN')} đ) đang chờ kiểm duyệt.`
        ]
      );
    } catch (notifErr) {
      console.warn('Notification to admin warning:', notifErr.message);
    }

    // Insert Images
    if (Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const imgUrl = images[i].previewUrl || images[i].storageKey || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';
        await pool.query(
          `INSERT INTO stu_listing_db.listing_images (listing_id, image_url, display_order, is_primary)
           VALUES (?, ?, ?, ?)`,
          [listingId, imgUrl, i, i === 0 ? 1 : 0]
        );
      }
    } else {
      // Default placeholder if none provided
      await pool.query(
        `INSERT INTO stu_listing_db.listing_images (listing_id, image_url, display_order, is_primary)
         VALUES (?, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', 0, 1)`,
        [listingId]
      );
    }

    return success(res, { id: listingId, title, status }, 'Đăng tin sản phẩm lên sàn STU thành công!', 201);
  } catch (err) {
    console.error(err);
    return failure(res, 'Lỗi khi tạo tin: ' + err.message, 500);
  }
});

// My Listings
app.get('/api/v1/listings/my-listings', authenticateToken, async (req, res) => {
  try {
    const [listings] = await pool.query(
      `SELECT l.*, c.name as categoryName,
              (SELECT image_url FROM stu_listing_db.listing_images WHERE listing_id = l.id LIMIT 1) as primaryImageUrl
       FROM stu_listing_db.listings l
       LEFT JOIN stu_listing_db.categories c ON l.category_id = c.id
       WHERE l.seller_id = ? ORDER BY l.id DESC`,
      [req.user.id]
    );
    return success(res, { content: listings, totalElements: listings.length });
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Update Status (SOLD, HIDDEN, ACTIVE)
app.patch('/api/v1/listings/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query(
      'UPDATE stu_listing_db.listings SET status = ? WHERE id = ? AND seller_id = ?',
      [status, req.params.id, req.user.id]
    );
    return success(res, { id: req.params.id, status }, 'Cập nhật trạng thái tin thành công');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Update Listing Details (Title, Description, Price, Status)
app.put('/api/v1/listings/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, price, status } = req.body;
    await pool.query(
      `UPDATE stu_listing_db.listings 
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           price = COALESCE(?, price),
           status = COALESCE(?, status),
           updated_at = NOW()
       WHERE id = ? AND seller_id = ?`,
      [title, description, price ? Number(price) : null, status, req.params.id, req.user.id]
    );
    return success(res, { id: req.params.id, title, price, status }, 'Cập nhật tin đăng thành công!');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Update Profile
app.put('/api/v1/users/me', authenticateToken, async (req, res) => {
  try {
    const { fullName, phone, faculty, avatarUrl } = req.body;
    await pool.query(
      'UPDATE stu_identity_db.users SET full_name = COALESCE(?, full_name), phone_number = COALESCE(?, phone_number) WHERE id = ?',
      [fullName, phone, req.user.id]
    );
    return success(res, { fullName, phone }, 'Cập nhật hồ sơ sinh viên thành công!');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Delete Listing
app.delete('/api/v1/listings/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM stu_listing_db.listing_images WHERE listing_id = ?', [req.params.id]);
    await pool.query('DELETE FROM stu_listing_db.listings WHERE id = ? AND seller_id = ?', [req.params.id, req.user.id]);
    return success(res, null, 'Đã xóa tin đăng thành công');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// ==========================================
// 4. FAVORITES & INTERACTIONS
// ==========================================

app.get('/api/v1/favorites', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT f.id as favoriteId, l.*, c.name as categoryName, u.full_name as sellerName,
              (SELECT image_url FROM stu_listing_db.listing_images WHERE listing_id = l.id LIMIT 1) as primaryImageUrl
       FROM stu_interaction_db.favorites f
       JOIN stu_listing_db.listings l ON f.listing_id = l.id
       LEFT JOIN stu_listing_db.categories c ON l.category_id = c.id
       LEFT JOIN stu_identity_db.users u ON l.seller_id = u.id
       WHERE f.user_id = ? ORDER BY f.id DESC`,
      [req.user.id]
    );
    return success(res, rows);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

app.post('/api/v1/favorites/:listingId', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'INSERT IGNORE INTO stu_interaction_db.favorites (user_id, listing_id) VALUES (?, ?)',
      [req.user.id, req.params.listingId]
    );
    return success(res, { favorited: true }, 'Đã thêm vào danh sách yêu thích!');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

app.delete('/api/v1/favorites/:listingId', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM stu_interaction_db.favorites WHERE user_id = ? AND listing_id = ?',
      [req.user.id, req.params.listingId]
    );
    return success(res, { favorited: false }, 'Đã xóa khỏi danh sách yêu thích!');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// ==========================================
// 5. MESSAGES & 1-ON-1 CHAT
// ==========================================

// Get user conversations
app.get('/api/v1/conversations', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const [convs] = await pool.query(
      `SELECT c.id, c.listing_id as listingId, c.buyer_id as buyerId, c.seller_id as sellerId,
              c.last_message_at as lastMessageAt, c.created_at as createdAt,
              l.title as listingTitle, l.price as listingPrice,
              (SELECT image_url FROM stu_listing_db.listing_images WHERE listing_id = l.id LIMIT 1) as listingImage,
              u1.full_name as buyerName, u1.student_id as buyerStudentCode,
              u2.full_name as sellerName, u2.student_id as sellerStudentCode,
              (SELECT content FROM stu_interaction_db.messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) as lastMessage,
              (SELECT created_at FROM stu_interaction_db.messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) as lastMessageTime
       FROM stu_interaction_db.conversations c
       LEFT JOIN stu_listing_db.listings l ON c.listing_id = l.id
       LEFT JOIN stu_identity_db.users u1 ON c.buyer_id = u1.id
       LEFT JOIN stu_identity_db.users u2 ON c.seller_id = u2.id
       WHERE c.buyer_id = ? OR c.seller_id = ?
       ORDER BY c.last_message_at DESC, c.id DESC`,
      [currentUserId, currentUserId]
    );

    const formatted = convs.map((c) => {
      const isBuyer = c.buyerId === currentUserId;
      const partnerName = isBuyer ? c.sellerName : c.buyerName;
      const partnerRole = isBuyer ? 'Người bán' : 'Người mua';
      const partnerCode = isBuyer ? c.sellerStudentCode : c.buyerStudentCode;
      return {
        ...c,
        isBuyer,
        partnerName: partnerName ? `${partnerName} (${partnerRole})` : (isBuyer ? 'Người bán STU' : 'Người mua STU'),
        rawPartnerName: partnerName || (isBuyer ? 'Người bán STU' : 'Người mua STU'),
        partnerRole,
        partnerCode,
        initial: (partnerName || 'SV').split(' ').pop().slice(0, 2).toUpperCase(),
        time: c.lastMessageTime
          ? new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Mới tạo',
      };
    });

    return success(res, formatted);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Create or get conversation for a listing
app.post('/api/v1/conversations', authenticateToken, async (req, res) => {
  try {
    const { listingId } = req.body;
    if (!listingId) return failure(res, 'Vui lòng cung cấp mã sản phẩm (listingId)');

    const [listings] = await pool.query(
      `SELECT l.id, l.seller_id, l.title, l.price,
              (SELECT image_url FROM stu_listing_db.listing_images WHERE listing_id = l.id LIMIT 1) as listingImage,
              u.full_name as sellerName, u.student_id as sellerStudentCode
       FROM stu_listing_db.listings l
       LEFT JOIN stu_identity_db.users u ON l.seller_id = u.id
       WHERE l.id = ?`,
      [listingId]
    );

    if (listings.length === 0) return failure(res, 'Sản phẩm không tồn tại trên sàn STU', 404);
    const listing = listings[0];
    const buyerId = req.user.id;
    const sellerId = listing.seller_id;

    if (buyerId === sellerId) {
      return failure(res, 'Bạn không thể tự nhắn tin cho sản phẩm do chính bạn đăng bán');
    }

    // Check if conversation already exists
    const [existing] = await pool.query(
      `SELECT id FROM stu_interaction_db.conversations
       WHERE listing_id = ? AND buyer_id = ? AND seller_id = ?`,
      [listingId, buyerId, sellerId]
    );

    let convId;
    if (existing.length > 0) {
      convId = existing[0].id;
    } else {
      const [insertRes] = await pool.query(
        `INSERT INTO stu_interaction_db.conversations (listing_id, buyer_id, seller_id, last_message_at)
         VALUES (?, ?, ?, NOW())`,
        [listingId, buyerId, sellerId]
      );
      convId = insertRes.insertId;
    }

    return success(res, {
      id: convId,
      listingId: listing.id,
      buyerId,
      sellerId,
      listingTitle: listing.title,
      listingPrice: listing.price,
      listingImage: listing.listingImage,
      partnerName: `${listing.sellerName} (Người bán)`,
      isBuyer: true,
    }, 'Khởi tạo cuộc trò chuyện thành công');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Get messages in a conversation
app.get('/api/v1/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const convId = req.params.id;
    const [convs] = await pool.query(
      'SELECT buyer_id, seller_id FROM stu_interaction_db.conversations WHERE id = ?',
      [convId]
    );
    if (convs.length === 0) return failure(res, 'Hội thoại không tồn tại', 404);
    const conv = convs[0];
    if (conv.buyer_id !== req.user.id && conv.seller_id !== req.user.id) {
      return failure(res, 'Bạn không có quyền truy cập hội thoại này', 403);
    }

    const [messages] = await pool.query(
      `SELECT m.id, m.conversation_id, m.sender_id, m.message_type, m.content as text,
              m.created_at, u.full_name as senderName
       FROM stu_interaction_db.messages m
       LEFT JOIN stu_identity_db.users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.id ASC`,
      [convId]
    );

    const mapped = messages.map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      sender: m.sender_id === req.user.id ? 'me' : 'them',
      senderName: m.senderName,
      text: m.text,
      time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: m.created_at,
    }));

    return success(res, mapped);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Send a message
app.post('/api/v1/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const convId = req.params.id;
    const { content } = req.body;
    if (!content || !content.trim()) {
      return failure(res, 'Nội dung tin nhắn không được để trống');
    }

    const [convs] = await pool.query(
      `SELECT c.*, l.title as listingTitle
       FROM stu_interaction_db.conversations c
       LEFT JOIN stu_listing_db.listings l ON c.listing_id = l.id
       WHERE c.id = ?`,
      [convId]
    );
    if (convs.length === 0) return failure(res, 'Hội thoại không tồn tại', 404);
    const conv = convs[0];
    if (conv.buyer_id !== req.user.id && conv.seller_id !== req.user.id) {
      return failure(res, 'Bạn không có quyền gửi tin nhắn trong hội thoại này', 403);
    }

    const [result] = await pool.query(
      `INSERT INTO stu_interaction_db.messages (conversation_id, sender_id, message_type, content)
       VALUES (?, ?, 'TEXT', ?)`,
      [convId, req.user.id, content.trim()]
    );

    await pool.query('UPDATE stu_interaction_db.conversations SET last_message_at = NOW() WHERE id = ?', [convId]);

    // Send notification to recipient
    const recipientId = (conv.buyer_id === req.user.id) ? conv.seller_id : conv.buyer_id;
    try {
      await pool.query(
        `INSERT INTO stu_interaction_db.notifications (user_id, title, content, type, link_url)
         VALUES (?, 'Tin nhắn trao đổi mới từ bạn học', ?, 'MESSAGE', '/messages')`,
        [recipientId, `${req.user.fullName} đã gửi tin nhắn: "${content.trim().slice(0, 80)}"`]
      );
    } catch (notifErr) {}

    return success(res, {
      id: result.insertId,
      conversationId: convId,
      senderId: req.user.id,
      sender: 'me',
      senderName: req.user.fullName,
      text: content.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    }, 'Gửi tin nhắn thành công');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// ==========================================
// 6. TRANSACTIONS & MEETUPS AT STU CAMPUS
// ==========================================

app.get('/api/v1/transactions', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const [txs] = await pool.query(
      `SELECT t.*, l.title as listingTitle, l.price as listingOriginalPrice,
              (SELECT image_url FROM stu_listing_db.listing_images WHERE listing_id = l.id LIMIT 1) as listingImage,
              u1.full_name as buyerName, u1.student_id as buyerStudentCode,
              u2.full_name as sellerName, u2.student_id as sellerStudentCode
       FROM stu_transaction_db.transactions t
       LEFT JOIN stu_listing_db.listings l ON t.listing_id = l.id
       LEFT JOIN stu_identity_db.users u1 ON t.buyer_id = u1.id
       LEFT JOIN stu_identity_db.users u2 ON t.seller_id = u2.id
       WHERE t.buyer_id = ? OR t.seller_id = ?
       ORDER BY t.id DESC`,
      [currentUserId, currentUserId]
    );

    const formatted = txs.map((t) => {
      const isBuyer = t.buyer_id === currentUserId;
      const partnerName = isBuyer
        ? (t.sellerName ? `${t.sellerName} (${t.sellerStudentCode || 'Người bán'})` : 'Người bán STU')
        : (t.buyerName ? `${t.buyerName} (${t.buyerStudentCode || 'Người mua'})` : 'Người mua STU');
      return {
        ...t,
        isBuyer,
        partnerName,
      };
    });

    return success(res, formatted);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

app.patch('/api/v1/transactions/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const txId = req.params.id;

    await pool.query(
      'UPDATE stu_transaction_db.transactions SET status = ? WHERE id = ?',
      [status, txId]
    );

    // Sync listing status:
    // If ACCEPTED -> listing becomes TRADING (hidden from public browsing)
    // If COMPLETED -> listing becomes SOLD
    // If CANCELLED -> restore listing to ACTIVE
    if (status === 'ACCEPTED') {
      await pool.query(
        `UPDATE stu_listing_db.listings SET status = 'TRADING'
         WHERE id = (SELECT listing_id FROM stu_transaction_db.transactions WHERE id = ?)`,
        [txId]
      );
    } else if (status === 'COMPLETED') {
      await pool.query(
        `UPDATE stu_listing_db.listings SET status = 'SOLD'
         WHERE id = (SELECT listing_id FROM stu_transaction_db.transactions WHERE id = ?)`,
        [txId]
      );
    } else if (status === 'CANCELLED') {
      await pool.query(
        `UPDATE stu_listing_db.listings SET status = 'ACTIVE'
         WHERE id = (SELECT listing_id FROM stu_transaction_db.transactions WHERE id = ?)`,
        [txId]
      );
    }

    return success(res, { id: txId, status }, 'Cập nhật trạng thái giao dịch thành công!');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// ==========================================
// 7. BILLING & BOOST PACKAGES
// ==========================================

app.get('/api/v1/billing/packages', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM stu_billing_db.fee_packages WHERE is_active = 1 ORDER BY price ASC');
    return success(res, rows);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

app.post('/api/v1/billing/boost', authenticateToken, async (req, res) => {
  try {
    const { listingId, packageId } = req.body;
    const invCode = 'INV-' + Date.now().toString().slice(-6);
    await pool.query(
      `INSERT INTO stu_billing_db.invoices (invoice_code, user_id, listing_id, package_id, amount, status, paid_at)
       VALUES (?, ?, ?, ?, 15000, 'PAID', NOW())`,
      [invCode, req.user.id, listingId || 1, packageId || 3]
    );
    await pool.query('UPDATE stu_listing_db.listings SET is_boosted = 1 WHERE id = ?', [listingId || 1]);
    return success(res, { invoiceCode: invCode }, 'Kích hoạt gói đẩy tin nổi bật thành công!');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

app.post('/api/v1/transactions', authenticateToken, async (req, res) => {
  try {
    const { listingId, agreedPrice, meetingLocation, meetingTime } = req.body;

    const [listings] = await pool.query('SELECT seller_id FROM stu_listing_db.listings WHERE id = ?', [listingId]);
    if (listings.length === 0) return failure(res, 'Không tìm thấy sản phẩm');

    const sellerId = listings[0].seller_id;
    const txCode = 'TX-STU-' + Date.now().toString().slice(-6);

    const [result] = await pool.query(
      `INSERT INTO stu_transaction_db.transactions
       (transaction_code, listing_id, buyer_id, seller_id, agreed_price, meeting_location, meeting_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'REQUESTED')`,
      [txCode, listingId, req.user.id, sellerId, agreedPrice || 0, meetingLocation || 'Sảnh A - STU', meetingTime || new Date()]
    );

    return success(res, { id: result.insertId, transactionCode: txCode }, 'Đã gửi đề nghị hẹn gặp giao dịch tại STU!', 201);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// ==========================================
// NOTIFICATIONS API ENDPOINTS
// ==========================================

// Get Notifications for Current Student
app.get('/api/v1/notifications', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM stu_interaction_db.notifications
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    const [unreadResult] = await pool.query(
      `SELECT count(*) as unreadCount FROM stu_interaction_db.notifications
       WHERE user_id = ? AND is_read = 0`,
      [req.user.id]
    );

    return success(res, {
      notifications: rows,
      unreadCount: unreadResult[0].unreadCount || 0,
    });
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Mark Single Notification as Read
app.patch('/api/v1/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'UPDATE stu_interaction_db.notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    return success(res, { id: req.params.id, is_read: 1 }, 'Đã đánh dấu đã đọc');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Mark All Notifications as Read
app.patch('/api/v1/notifications/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'UPDATE stu_interaction_db.notifications SET is_read = 1 WHERE user_id = ?',
      [req.user.id]
    );
    return success(res, null, 'Đã đánh dấu tất cả là đã đọc');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Delete Notification
app.delete('/api/v1/notifications/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM stu_interaction_db.notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    return success(res, null, 'Đã xóa thông báo');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// ==========================================
// REPORTS & REVIEWS API ENDPOINTS
// ==========================================

// Submit Violation Report
app.post('/api/v1/reports', authenticateToken, async (req, res) => {
  try {
    const { targetType = 'LISTING', targetId, reason = 'SPAM', details } = req.body;
    const [result] = await pool.query(
      `INSERT INTO stu_moderation_db.reports 
       (reporter_id, target_type, target_id, reason, details, status)
       VALUES (?, ?, ?, ?, ?, 'PENDING')`,
      [req.user.id, targetType, targetId, reason, details || 'Báo cáo từ sinh viên STU']
    );
    return success(res, { id: result.insertId }, 'Đã gửi báo cáo vi phạm đến Ban Kiểm Duyệt STU!', 201);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Moderator: Get all reports
app.get('/api/v1/moderation/reports', authenticateToken, requireRole('MODERATOR', 'ADMIN'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, u.full_name as reporterName, u.student_id as reporterStudentCode,
             l.title as listingTitle
      FROM stu_moderation_db.reports r
      LEFT JOIN stu_identity_db.users u ON r.reporter_id = u.id
      LEFT JOIN stu_listing_db.listings l ON r.target_type = 'LISTING' AND r.target_id = l.id
      ORDER BY r.id DESC
    `);
    return success(res, rows);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Moderator: Resolve Report
app.patch('/api/v1/moderation/reports/:id', authenticateToken, requireRole('MODERATOR', 'ADMIN'), async (req, res) => {
  try {
    const { status, resolutionAction } = req.body;
    await pool.query(
      `UPDATE stu_moderation_db.reports 
       SET status = ?, resolution_action = ?, resolved_at = NOW() 
       WHERE id = ?`,
      [status || 'RESOLVED', resolutionAction || 'WARNING_SENT', req.params.id]
    );
    return success(res, null, 'Đã xử lý báo cáo vi phạm thành công!');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Submit Transaction Review
app.post('/api/v1/transactions/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const [txs] = await pool.query('SELECT seller_id, buyer_id FROM stu_transaction_db.transactions WHERE id = ?', [req.params.id]);
    const sellerId = txs.length > 0 ? txs[0].seller_id : 3;
    const revieweeId = txs.length > 0 && req.user.id === txs[0].buyer_id ? txs[0].seller_id : (txs[0]?.buyer_id || 4);

    await pool.query(
      `INSERT INTO stu_interaction_db.reviews (reviewer_id, reviewee_id, transaction_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, revieweeId, req.params.id, Math.min(5, Math.max(1, Number(rating) || 5)), comment || 'Đồ dùng rất tốt, đúng mô tả!']
    );
    return success(res, null, 'Cảm ơn bạn đã gửi đánh giá đối tác sinh viên STU!', 201);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// ==========================================
// 8. MODERATOR ENDPOINTS (RBAC PROTECTED)
// ==========================================

// Get pending student verifications
app.get('/api/v1/students/verifications', authenticateToken, requireRole('MODERATOR', 'ADMIN'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT v.id, v.user_id as userId, v.student_card_image_url as evidenceReference,
             v.status, v.created_at as createdAt,
             u.full_name as fullName, u.student_id as studentCode, u.email,
             'MANUAL_REVIEW' as method
      FROM stu_identity_db.user_verifications v
      JOIN stu_identity_db.users u ON v.user_id = u.id
      ORDER BY v.id DESC
    `);
    return success(res, rows);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Review student verification
app.patch('/api/v1/students/verifications/:id/review', authenticateToken, requireRole('MODERATOR', 'ADMIN'), async (req, res) => {
  try {
    const { status, note } = req.body;
    await pool.query(
      'UPDATE stu_identity_db.user_verifications SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    return success(res, { id: req.params.id, status, note }, 'Đã xử lý hồ sơ xác minh thành công!');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Get moderation & admin listings
app.get(['/api/v1/moderation/listings', '/api/v1/admin/listings'], authenticateToken, requireRole('MODERATOR', 'ADMIN'), async (req, res) => {
  try {
    const { status, abnormalOnly } = req.query;
    let sql = `
      SELECT l.*, c.name as categoryName, u.full_name as sellerName, u.student_id as sellerStudentCode,
             (CASE WHEN l.price >= 10000000 THEN 1 ELSE 0 END) as isAbnormalPrice,
             (SELECT image_url FROM stu_listing_db.listing_images WHERE listing_id = l.id LIMIT 1) as primaryImageUrl
      FROM stu_listing_db.listings l
      LEFT JOIN stu_listing_db.categories c ON l.category_id = c.id
      LEFT JOIN stu_identity_db.users u ON l.seller_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (status && status !== 'ALL') {
      sql += ' AND l.status = ?';
      params.push(status);
    }
    if (abnormalOnly === 'true' || abnormalOnly === '1') {
      sql += ' AND l.price >= 10000000';
    }
    // Prioritize PENDING_APPROVAL and high price items on top
    sql += ` ORDER BY 
      CASE WHEN l.status = 'PENDING_APPROVAL' THEN 0 
           WHEN l.status = 'DRAFT' THEN 1 
           WHEN l.status = 'ACTIVE' THEN 2 
           ELSE 3 END ASC,
      CASE WHEN l.price >= 10000000 THEN 0 ELSE 1 END ASC,
      l.id DESC`;

    const [rows] = await pool.query(sql, params);
    return success(res, rows);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Update listing moderation status (Approve / Reject / Hide)
app.patch(['/api/v1/moderation/listings/:id', '/api/v1/admin/listings/:id'], authenticateToken, requireRole('MODERATOR', 'ADMIN'), async (req, res) => {
  try {
    const { status, reason } = req.body;
    const listingId = req.params.id;

    const [listingRows] = await pool.query('SELECT seller_id, title, price FROM stu_listing_db.listings WHERE id = ?', [listingId]);
    if (listingRows.length === 0) {
      return failure(res, 'Không tìm thấy tin đăng', 404);
    }
    const listing = listingRows[0];

    await pool.query('UPDATE stu_listing_db.listings SET status = ? WHERE id = ?', [status, listingId]);

    // Record audit log
    const actionName = status === 'ACTIVE' ? 'APPROVE_LISTING' : (status === 'REJECTED' ? 'REJECT_LISTING' : 'UPDATE_LISTING_STATUS');
    const actionDesc = status === 'ACTIVE'
      ? `Phê duyệt hiển thị tin đăng #${listingId}: "${listing.title}" (${Number(listing.price).toLocaleString('vi-VN')} đ)`
      : status === 'REJECTED'
      ? `Từ chối tin đăng #${listingId}: "${listing.title}"${reason ? ` - Lý do: ${reason}` : ''}`
      : `Chuyển trạng thái tin đăng #${listingId} thành ${status}`;

    await recordAuditLog({
      actorId: req.user.id,
      actorName: req.user.fullName,
      actorRole: req.user.role,
      action: actionName,
      targetType: 'LISTING',
      targetId: listingId,
      details: `${req.user.fullName} (${req.user.role}): ${actionDesc}`
    });

    // Send real-time notification to the seller
    try {
      const notifTitle = status === 'ACTIVE' 
        ? 'Tin đăng của bạn đã được duyệt!' 
        : status === 'REJECTED' 
        ? 'Tin đăng bị từ chối kiểm duyệt' 
        : 'Trạng thái tin đăng đã cập nhật';
      const notifBody = status === 'ACTIVE'
        ? `Tin đăng "${listing.title}" đã được Quản trị viên duyệt và đang hiển thị công khai trên sàn STU.`
        : status === 'REJECTED'
        ? `Tin đăng "${listing.title}" đã bị từ chối kiểm duyệt.${reason ? ` Lý do: ${reason}` : ''}`
        : `Tin đăng "${listing.title}" vừa được cập nhật sang trạng thái ${status}.`;

      await pool.query(
        'INSERT INTO stu_interaction_db.notifications (user_id, title, content, type) VALUES (?, ?, ?, ?)',
        [listing.seller_id, notifTitle, notifBody, status === 'REJECTED' ? 'WARNING' : 'SYSTEM']
      );
    } catch (notifErr) {
      console.warn('Seller notification warning:', notifErr.message);
    }

    return success(res, { id: listingId, status }, 'Cập nhật trạng thái kiểm duyệt tin thành công!');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Reviews API: Get user reviews
app.get('/api/v1/users/:id/reviews', async (req, res) => {
  try {
    const [reviews] = await pool.query(`
      SELECT r.id, r.reviewer_id as reviewerId, r.reviewee_id as revieweeId,
             r.transaction_id as transactionId, r.rating, r.comment, r.created_at as createdAt,
             u.full_name as reviewerName, u.student_id as reviewerStudentCode
      FROM stu_interaction_db.reviews r
      JOIN stu_identity_db.users u ON u.id = r.reviewer_id
      WHERE r.reviewee_id = ?
      ORDER BY r.id DESC
    `, [req.params.id]);
    return success(res, reviews);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Helper to record system and admin audit logs
async function recordAuditLog({ actorId, actorName, actorRole, action, targetType, targetId, details, ip = '127.0.0.1' }) {
  try {
    await pool.query(
      `INSERT INTO stu_identity_db.audit_logs (actor_id, actor_name, actor_role, action, target_type, target_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [actorId, actorName, actorRole, action, targetType, targetId ? String(targetId) : null, details || '', ip]
    );
  } catch (err) {
    console.warn('recordAuditLog warning:', err.message);
  }
}

// ==========================================
// 9. ADMIN ENDPOINTS (RBAC PROTECTED)
// ==========================================

// Get all users
app.get('/api/v1/admin/users', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT u.id, u.student_id as studentId, u.email, u.full_name as fullName,
             u.phone_number as phone, u.role, u.status, u.created_at as createdAt,
             (SELECT status FROM stu_identity_db.user_verifications WHERE user_id = u.id ORDER BY id DESC LIMIT 1) as verificationStatus
      FROM stu_identity_db.users u
      ORDER BY u.id ASC
    `);
    return success(res, users);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Update user status or role (Lock/Unlock account, promote)
app.patch('/api/v1/admin/users/:id/status', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { status, role } = req.body;
    const targetUserId = req.params.id;

    if (status) {
      await pool.query('UPDATE stu_identity_db.users SET status = ? WHERE id = ?', [status, targetUserId]);

      if (status === 'LOCKED' || status === 'BANNED' || status === 'SUSPENDED') {
        // Automatically hide all active listings of the locked user
        await pool.query('UPDATE stu_listing_db.listings SET status = "HIDDEN" WHERE seller_id = ? AND status = "ACTIVE"', [targetUserId]);

        // Send high-priority alert notification
        try {
          await pool.query(
            `INSERT INTO stu_interaction_db.notifications (user_id, title, content, type, link_url)
             VALUES (?, 'Tài khoản của bạn đã bị KHÓA', 'Quản trị viên đã khóa tài khoản của bạn do vi phạm quy chế STU. Toàn bộ tin đăng đã bị ẩn và quyền giao dịch bị đình chỉ.', 'SYSTEM', '/profile')`,
            [targetUserId]
          );
        } catch (e) {}

        await recordAuditLog({
          actorId: req.user.id,
          actorName: req.user.fullName,
          actorRole: req.user.role,
          action: 'LOCK_USER',
          targetType: 'USER',
          targetId: targetUserId,
          details: `Khóa tài khoản người dùng #${targetUserId} và tự động ẩn toàn bộ tin đăng đang hoạt động.`
        });
      } else if (status === 'ACTIVE') {
        // Restore listings when unlocked
        await pool.query('UPDATE stu_listing_db.listings SET status = "ACTIVE" WHERE seller_id = ? AND status = "HIDDEN"', [targetUserId]);

        try {
          await pool.query(
            `INSERT INTO stu_interaction_db.notifications (user_id, title, content, type, link_url)
             VALUES (?, 'Tài khoản đã được MỞ KHÓA', 'Quản trị viên đã kích hoạt lại tài khoản của bạn. Bạn có thể tiếp tục sử dụng đầy đủ chức năng của Sàn.', 'SYSTEM', '/')`,
            [targetUserId]
          );
        } catch (e) {}

        await recordAuditLog({
          actorId: req.user.id,
          actorName: req.user.fullName,
          actorRole: req.user.role,
          action: 'UNLOCK_USER',
          targetType: 'USER',
          targetId: targetUserId,
          details: `Mở khóa tài khoản người dùng #${targetUserId} và khôi phục các tin đăng đã ẩn.`
        });
      }
    }

    if (role) {
      await pool.query('UPDATE stu_identity_db.users SET role = ? WHERE id = ?', [role, targetUserId]);
      await recordAuditLog({
        actorId: req.user.id,
        actorName: req.user.fullName,
        actorRole: req.user.role,
        action: 'CHANGE_ROLE',
        targetType: 'USER',
        targetId: targetUserId,
        details: `Cập nhật vai trò người dùng #${targetUserId} thành ${role}`
      });
    }

    const message = status === 'LOCKED'
      ? 'Đã khóa tài khoản thành công! Toàn bộ tin đăng của người dùng đã bị ẩn và quyền truy cập bị đình chỉ.'
      : 'Cập nhật tài khoản người dùng thành công!';

    return success(res, { id: targetUserId, status, role }, message);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// ==========================================
// ADMIN CATEGORIES MANAGEMENT
// ==========================================

// Get all categories with listing counts
app.get('/api/v1/admin/categories', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const [categories] = await pool.query(`
      SELECT c.id, c.parent_id as parentId, c.name, c.slug, c.icon_url as iconUrl,
             c.sort_order as sortOrder, c.is_active as isActive, c.created_at as createdAt,
             COUNT(l.id) as listingCount
      FROM stu_listing_db.categories c
      LEFT JOIN stu_listing_db.listings l ON l.category_id = c.id
      GROUP BY c.id, c.parent_id, c.name, c.slug, c.icon_url, c.sort_order, c.is_active, c.created_at
      ORDER BY c.sort_order ASC, c.id ASC
    `);
    return success(res, categories);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Create category
app.post('/api/v1/admin/categories', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, slug, sortOrder, isActive, iconUrl } = req.body;
    if (!name || !name.trim()) return failure(res, 'Tên danh mục không được để trống');
    const finalSlug = (slug && slug.trim()) || name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const finalSort = parseInt(sortOrder) || 10;
    const finalActive = isActive !== undefined ? (isActive ? 1 : 0) : 1;

    const [result] = await pool.query(
      `INSERT INTO stu_listing_db.categories (name, slug, sort_order, is_active, icon_url)
       VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), finalSlug, finalSort, finalActive, iconUrl || null]
    );

    await recordAuditLog({
      actorId: req.user.id,
      actorName: req.user.fullName,
      actorRole: req.user.role,
      action: 'ADD_CATEGORY',
      targetType: 'CATEGORY',
      targetId: result.insertId,
      details: `Thêm danh mục hàng hóa mới: "${name.trim()}" (slug: ${finalSlug})`
    });

    return success(res, { id: result.insertId, name: name.trim(), slug: finalSlug, sortOrder: finalSort, isActive: finalActive }, 'Thêm danh mục mới thành công!');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Update category
app.put('/api/v1/admin/categories/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const catId = req.params.id;
    const { name, slug, sortOrder, isActive, iconUrl } = req.body;
    if (!name || !name.trim()) return failure(res, 'Tên danh mục không được để trống');
    const finalSlug = (slug && slug.trim()) || name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    await pool.query(
      `UPDATE stu_listing_db.categories
       SET name = ?, slug = ?, sort_order = ?, is_active = ?, icon_url = ?
       WHERE id = ?`,
      [name.trim(), finalSlug, parseInt(sortOrder) || 0, isActive ? 1 : 0, iconUrl || null, catId]
    );

    await recordAuditLog({
      actorId: req.user.id,
      actorName: req.user.fullName,
      actorRole: req.user.role,
      action: 'UPDATE_CATEGORY',
      targetType: 'CATEGORY',
      targetId: catId,
      details: `Cập nhật thông tin danh mục #${catId} thành "${name.trim()}"`
    });

    return success(res, { id: catId, name: name.trim(), slug: finalSlug, sortOrder, isActive }, 'Cập nhật danh mục thành công!');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Toggle category active status
app.patch('/api/v1/admin/categories/:id/status', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const catId = req.params.id;
    const { isActive } = req.body;
    await pool.query('UPDATE stu_listing_db.categories SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, catId]);

    await recordAuditLog({
      actorId: req.user.id,
      actorName: req.user.fullName,
      actorRole: req.user.role,
      action: 'TOGGLE_CATEGORY_STATUS',
      targetType: 'CATEGORY',
      targetId: catId,
      details: `${isActive ? 'Hiện' : 'Ẩn'} danh mục #${catId}`
    });

    return success(res, { id: catId, isActive: isActive ? 1 : 0 }, 'Cập nhật trạng thái danh mục thành công!');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Delete category
app.delete('/api/v1/admin/categories/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const catId = req.params.id;
    const [listings] = await pool.query('SELECT count(*) as count FROM stu_listing_db.listings WHERE category_id = ?', [catId]);
    if (listings[0].count > 0) {
      await pool.query('UPDATE stu_listing_db.categories SET is_active = 0 WHERE id = ?', [catId]);
      return success(res, { id: catId, isActive: 0 }, `Danh mục hiện có ${listings[0].count} tin đăng. Hệ thống đã tự động chuyển sang trạng thái ẨN để bảo toàn dữ liệu sinh viên.`);
    }

    await pool.query('DELETE FROM stu_listing_db.categories WHERE id = ?', [catId]);

    await recordAuditLog({
      actorId: req.user.id,
      actorName: req.user.fullName,
      actorRole: req.user.role,
      action: 'DELETE_CATEGORY',
      targetType: 'CATEGORY',
      targetId: catId,
      details: `Xóa danh mục hàng hóa #${catId}`
    });

    return success(res, { id: catId }, 'Đã xóa danh mục thành công!');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// ==========================================
// ADMIN BILLING & INVOICE MANAGEMENT
// ==========================================

// Get all packages with revenue and usage stats
app.get('/api/v1/admin/billing/packages', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.package_code as packageCode, p.name, p.description,
             p.price, p.duration_days as durationDays, p.is_active as isActive, p.created_at as createdAt,
             (SELECT COUNT(*) FROM stu_billing_db.invoices i WHERE i.package_id = p.id AND i.status = 'PAID') as totalPurchases,
             (SELECT COALESCE(SUM(i.amount), 0) FROM stu_billing_db.invoices i WHERE i.package_id = p.id AND i.status = 'PAID') as totalRevenue
      FROM stu_billing_db.fee_packages p
      ORDER BY p.price ASC
    `);
    return success(res, rows);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Create billing package
app.post('/api/v1/admin/billing/packages', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { packageCode, name, description, price, durationDays, isActive } = req.body;
    if (!name || !packageCode) return failure(res, 'Mã gói và tên gói là bắt buộc');

    const [result] = await pool.query(
      `INSERT INTO stu_billing_db.fee_packages (package_code, name, description, price, duration_days, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [packageCode.trim().toUpperCase(), name.trim(), description || '', price || 0, parseInt(durationDays) || 7, isActive ? 1 : 0]
    );

    await recordAuditLog({
      actorId: req.user.id,
      actorName: req.user.fullName,
      actorRole: req.user.role,
      action: 'ADD_BILLING_PACKAGE',
      targetType: 'BILLING',
      targetId: result.insertId,
      details: `Tạo gói phí niêm yết mới: "${name}" (${packageCode}) - ${price} VNĐ / ${durationDays} ngày`
    });

    return success(res, { id: result.insertId }, 'Thêm gói phí niêm yết thành công!');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Update billing package
app.put('/api/v1/admin/billing/packages/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const pkgId = req.params.id;
    const { name, description, price, durationDays, isActive } = req.body;

    await pool.query(
      `UPDATE stu_billing_db.fee_packages
       SET name = ?, description = ?, price = ?, duration_days = ?, is_active = ?
       WHERE id = ?`,
      [name, description, price, parseInt(durationDays) || 7, isActive ? 1 : 0, pkgId]
    );

    await recordAuditLog({
      actorId: req.user.id,
      actorName: req.user.fullName,
      actorRole: req.user.role,
      action: 'UPDATE_BILLING_PACKAGE',
      targetType: 'BILLING',
      targetId: pkgId,
      details: `Cập nhật cấu hình gói phí #${pkgId} (${name}) - ${price} VNĐ`
    });

    return success(res, { id: pkgId }, 'Cập nhật gói phí thành công!');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Get invoices history
app.get('/api/v1/admin/billing/invoices', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.id, i.invoice_code as invoiceCode, i.user_id as userId,
             u.full_name as userName, u.student_id as studentCode,
             i.listing_id as listingId, l.title as listingTitle,
             i.package_id as packageId, p.name as packageName, p.package_code as packageCode,
             i.amount, i.status, i.created_at as createdAt, i.paid_at as paidAt
      FROM stu_billing_db.invoices i
      LEFT JOIN stu_identity_db.users u ON u.id = i.user_id
      LEFT JOIN stu_listing_db.listings l ON l.id = i.listing_id
      LEFT JOIN stu_billing_db.fee_packages p ON p.id = i.package_id
      ORDER BY i.created_at DESC
    `);
    return success(res, rows);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// ==========================================
// ADMIN DETAILED ANALYTICS & REPORTS
// ==========================================

app.get('/api/v1/admin/analytics/details', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    // 1. Overall KPIs
    const [users] = await pool.query(`
      SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN role = 'STUDENT' THEN 1 ELSE 0 END) as studentCount,
        SUM(CASE WHEN role = 'MODERATOR' THEN 1 ELSE 0 END) as modCount,
        SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) as adminCount,
        SUM(CASE WHEN status = 'LOCKED' OR status = 'BANNED' THEN 1 ELSE 0 END) as lockedCount
      FROM stu_identity_db.users
    `);

    const [verifs] = await pool.query(`
      SELECT 
        SUM(CASE WHEN status = 'VERIFIED' THEN 1 ELSE 0 END) as verifiedCount,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pendingCount,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejectedCount
      FROM stu_identity_db.user_verifications
    `);

    const [listings] = await pool.query(`
      SELECT 
        COUNT(*) as totalListings,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as activeListings,
        SUM(CASE WHEN status = 'SOLD' THEN 1 ELSE 0 END) as soldListings,
        SUM(CASE WHEN status = 'HIDDEN' THEN 1 ELSE 0 END) as hiddenListings,
        SUM(CASE WHEN is_boosted = 1 THEN 1 ELSE 0 END) as boostedListings
      FROM stu_listing_db.listings
    `);

    const [transactions] = await pool.query(`
      SELECT 
        COUNT(*) as totalTransactions,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completedTransactions,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pendingTransactions,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelledTransactions
      FROM stu_transaction_db.transactions
    `);

    const [billing] = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) as totalRevenue,
        COUNT(*) as totalInvoices,
        SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as paidInvoices
      FROM stu_billing_db.invoices
    `);

    // 2. Category distribution
    const [categories] = await pool.query(`
      SELECT c.id, c.name, COUNT(l.id) as listingCount
      FROM stu_listing_db.categories c
      LEFT JOIN stu_listing_db.listings l ON l.category_id = c.id
      GROUP BY c.id, c.name
      ORDER BY listingCount DESC
    `);

    // 3. Campus meetup locations distribution
    const [locations] = await pool.query(`
      SELECT COALESCE(location_notes, 'Khuôn viên trường STU (180 Cao Lỗ)') as location, COUNT(*) as count
      FROM stu_listing_db.listings
      WHERE location_notes IS NOT NULL AND location_notes != ''
      GROUP BY location_notes
      ORDER BY count DESC
      LIMIT 6
    `);

    // 4. Top active sellers
    const [topSellers] = await pool.query(`
      SELECT u.id, u.full_name as fullName, u.student_id as studentCode, COUNT(l.id) as listingCount
      FROM stu_identity_db.users u
      JOIN stu_listing_db.listings l ON l.seller_id = u.id
      GROUP BY u.id, u.full_name, u.student_id
      ORDER BY listingCount DESC
      LIMIT 5
    `);

    return success(res, {
      kpis: {
        users: users[0] || {},
        verifications: verifs[0] || { verifiedCount: 0, pendingCount: 0, rejectedCount: 0 },
        listings: listings[0] || {},
        transactions: transactions[0] || { totalTransactions: 0, completedTransactions: 0 },
        billing: billing[0] || { totalRevenue: 0, paidInvoices: 0 },
      },
      categories,
      locations,
      topSellers,
    });
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Basic system analytics for dashboard
app.get('/api/v1/admin/analytics', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const [uCount] = await pool.query('SELECT count(*) as totalUsers FROM stu_identity_db.users');
    const [lCount] = await pool.query('SELECT count(*) as totalListings FROM stu_listing_db.listings');
    const [tCount] = await pool.query('SELECT count(*) as totalTransactions FROM stu_transaction_db.transactions');
    const [bSum] = await pool.query('SELECT COALESCE(sum(amount), 0) as totalRevenue FROM stu_billing_db.invoices WHERE status = "PAID"');
    return success(res, {
      totalUsers: uCount[0].totalUsers,
      totalListings: lCount[0].totalListings,
      totalTransactions: tCount[0].totalTransactions,
      totalRevenue: bSum[0].totalRevenue,
    });
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// ==========================================
// ADMIN AUDIT LOGS ENDPOINT
// ==========================================

app.get('/api/v1/admin/logs', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const [logs] = await pool.query(`
      SELECT id, actor_id as actorId, actor_name as actorName, actor_role as actorRole,
             action, target_type as targetType, target_id as targetId,
             details, ip_address as ipAddress, created_at as createdAt
      FROM stu_identity_db.audit_logs
      ORDER BY id DESC
      LIMIT 200
    `);
    return success(res, logs);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Start Express Server
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 STU MARKETPLACE BACKEND API GATEWAY RUNNING ON PORT ${PORT}`);
  console.log(`🔗 Connecting to WampServer MySQL 8.0 on port 3306...`);
  console.log(`=======================================================`);
  await initDatabaseDefaults();
});
