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
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Demo fallback: default to student Hà Thiên Phúc
    req.user = {
      id: 3,
      email: 'dh52201642@student.stu.edu.vn',
      fullName: 'Hà Thiên Phúc (SV STU)',
      studentCode: 'DH52201642',
      roles: ['STUDENT'],
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
    };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = {
        id: 3,
        email: 'dh52201642@student.stu.edu.vn',
        fullName: 'Hà Thiên Phúc (SV STU)',
        studentCode: 'DH52201642',
        roles: ['STUDENT'],
        status: 'ACTIVE',
        verificationStatus: 'VERIFIED',
      };
      return next();
    }
    req.user = user;
    next();
  });
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
    const defaultPassword = await bcrypt.hash('Stu@123456', 10);
    const adminPassword = await bcrypt.hash('Admin@123456', 10);

    // 1. Create or ensure accounts in stu_identity_db
    await pool.query(`
      INSERT INTO stu_identity_db.users (id, student_id, email, password_hash, full_name, phone_number, role, status)
      VALUES 
      (1, 'DH52100123', 'admin@stu.edu.vn', '${adminPassword}', 'Quản Trị Viên STU', '0901234567', 'ADMIN', 'ACTIVE'),
      (2, 'DH52100456', 'moderator@stu.edu.vn', '${adminPassword}', 'Kiểm Duyệt Viên STU', '0902345678', 'MODERATOR', 'ACTIVE'),
      (3, 'DH52201642', 'dh52201642@student.stu.edu.vn', '${defaultPassword}', 'Hà Thiên Phúc (SV STU)', '0903456789', 'STUDENT', 'ACTIVE'),
      (4, 'DH52200413', 'dh52200413@student.stu.edu.vn', '${defaultPassword}', 'Dương Hoài Phong', '0904567890', 'STUDENT', 'ACTIVE')
      ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);
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
      return failure(res, 'Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu');
    }

    // Check existing email
    const [existing] = await pool.query(
      'SELECT id FROM stu_identity_db.users WHERE email = ? OR (student_id = ? AND student_id IS NOT NULL)',
      [email, studentCode || null]
    );

    if (existing.length > 0) {
      return failure(res, 'Email hoặc Mã số sinh viên đã tồn tại trên hệ thống STU');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO stu_identity_db.users (student_id, email, password_hash, full_name, phone_number, role, status)
       VALUES (?, ?, ?, ?, ?, 'STUDENT', 'ACTIVE')`,
      [studentCode || null, email, passwordHash, fullName, phone || null]
    );

    return success(
      res,
      { id: result.insertId, email, fullName, studentCode },
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

    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      return failure(res, 'Tài khoản của bạn đã bị tạm khóa do vi phạm quy chế STU', 403);
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
    const { keyword, categoryId, page = 0, size = 20 } = req.query;
    let query = `
      SELECT l.id, l.title, l.description, l.price, l.item_condition as itemCondition, 
             l.status, l.location_notes as locationNotes, l.created_at as createdAt,
             c.name as categoryName, u.full_name as sellerName, u.student_id as sellerStudentCode,
             (SELECT image_url FROM stu_listing_db.listing_images WHERE listing_id = l.id ORDER BY display_order ASC LIMIT 1) as primaryImageUrl
      FROM stu_listing_db.listings l
      LEFT JOIN stu_listing_db.categories c ON l.category_id = c.id
      LEFT JOIN stu_identity_db.users u ON l.seller_id = u.id
      WHERE l.status IN ('ACTIVE', 'PUBLISHED')
    `;
    const params = [];

    if (keyword) {
      query += ' AND (l.title LIKE ? OR l.description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (categoryId) {
      query += ' AND l.category_id = ?';
      params.push(categoryId);
    }

    query += ' ORDER BY l.id DESC LIMIT ? OFFSET ?';
    params.push(Number(size), Number(page) * Number(size));

    const [listings] = await pool.query(query, params);
    const [countResult] = await pool.query("SELECT count(*) as total FROM stu_listing_db.listings WHERE status IN ('ACTIVE', 'PUBLISHED')");

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
    const { categoryId, title, description, price, itemCondition, submitForReview, images } = req.body;

    if (!title || !description || categoryId === undefined) {
      return failure(res, 'Vui lòng cung cấp đầy đủ Tiêu đề, Danh mục và Mô tả sản phẩm');
    }

    // Map itemCondition to DB Enum
    let dbCondition = 'USED_GOOD';
    if (itemCondition === 'NEW') dbCondition = 'BRAND_NEW';
    else if (itemCondition === 'LIKE_NEW') dbCondition = 'LIKE_NEW';
    else if (itemCondition === 'USED') dbCondition = 'USED_GOOD';

    const status = submitForReview ? 'ACTIVE' : 'DRAFT'; // Set ACTIVE directly for instant smooth demo

    const [result] = await pool.query(
      `INSERT INTO stu_listing_db.listings 
       (seller_id, category_id, title, description, price, item_condition, status, location_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Khuôn viên trường Đại học Công Nghệ Sài Gòn (STU)')`,
      [req.user.id, Number(categoryId), title, description, Number(price) || 0, dbCondition, status]
    );

    const listingId = result.insertId;

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

app.get('/api/v1/conversations', authenticateToken, async (req, res) => {
  try {
    const [convs] = await pool.query(
      `SELECT c.*, l.title as listingTitle, l.price as listingPrice,
              (SELECT image_url FROM stu_listing_db.listing_images WHERE listing_id = l.id LIMIT 1) as listingImage,
              u1.full_name as buyerName, u2.full_name as sellerName
       FROM stu_interaction_db.conversations c
       LEFT JOIN stu_listing_db.listings l ON c.listing_id = l.id
       LEFT JOIN stu_identity_db.users u1 ON c.buyer_id = u1.id
       LEFT JOIN stu_identity_db.users u2 ON c.seller_id = u2.id
       WHERE c.buyer_id = ? OR c.seller_id = ?
       ORDER BY c.last_message_at DESC`,
      [req.user.id, req.user.id]
    );

    // If empty, return sample demo conversations
    if (convs.length === 0) {
      return success(res, [
        {
          id: 1,
          partnerName: 'Lê Thảo Vy (DH52201456)',
          listingTitle: 'Laptop Dell Latitude E5470',
          lastMessage: 'Bạn có bớt thêm chút xăng xe cho sinh viên STU không? Mình qua cổng 180 Cao Lỗ xem máy luôn.',
          lastTime: '14:20',
          unread: 1,
          listingPrice: 3500000,
        },
        {
          id: 2,
          partnerName: 'Trần Hoài Phong (DH52100889)',
          listingTitle: 'Tai nghe Gaming Havit H2002d',
          lastMessage: 'Còn đầy đủ mic rời với hộp luôn bạn ơi, mai 9h sáng mình có tiết ở khu C STU nè.',
          lastTime: 'Hôm qua',
          unread: 0,
          listingPrice: 350000,
        },
        {
          id: 3,
          partnerName: 'Phạm Gia Bảo (DH52003312)',
          listingTitle: 'Bộ sách CNTT (Cấu trúc dữ liệu, Java)',
          lastMessage: 'Mình lấy trọn bộ sách nhé, chiều nay 4h30 gặp ở thư viện STU nha!',
          lastTime: '10:05',
          unread: 0,
          listingPrice: 250000,
        },
      ]);
    }
    return success(res, convs);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// ==========================================
// 6. TRANSACTIONS & MEETUPS AT STU CAMPUS
// ==========================================

app.get('/api/v1/transactions', authenticateToken, async (req, res) => {
  try {
    const [txs] = await pool.query(
      `SELECT t.*, l.title as listingTitle,
              (SELECT image_url FROM stu_listing_db.listing_images WHERE listing_id = l.id LIMIT 1) as listingImage,
              u1.full_name as buyerName, u2.full_name as sellerName
       FROM stu_transaction_db.transactions t
       LEFT JOIN stu_listing_db.listings l ON t.listing_id = l.id
       LEFT JOIN stu_identity_db.users u1 ON t.buyer_id = u1.id
       LEFT JOIN stu_identity_db.users u2 ON t.seller_id = u2.id
       WHERE t.buyer_id = ? OR t.seller_id = ?
       ORDER BY t.id DESC`,
      [req.user.id, req.user.id]
    );

    // If empty, return structured sample transactions
    if (txs.length === 0) {
      return success(res, [
        {
          id: 1,
          transaction_code: 'TX-STU-8841',
          listingTitle: 'Laptop Dell Latitude E5470 (Core i5, RAM 8GB)',
          partnerName: 'Lê Thảo Vy (DH52201456)',
          agreed_price: 3350000,
          meeting_location: 'Sảnh A - Tòa nhà Trung tâm STU',
          meeting_time: '14:30 Chiều nay',
          status: 'REQUESTED',
          listingImage: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=200&q=80',
        },
        {
          id: 2,
          transaction_code: 'TX-STU-8839',
          listingTitle: 'Tai nghe Gaming Havit H2002d',
          partnerName: 'Trần Hoài Phong (DH52100889)',
          agreed_price: 320000,
          meeting_location: 'Căn tin trường STU (Khu B)',
          meeting_time: '09:00 Sáng mai',
          status: 'ACCEPTED',
          listingImage: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=200&q=80',
        },
        {
          id: 3,
          transaction_code: 'TX-STU-8820',
          listingTitle: 'Giáo trình Lập trình Web & Ứng dụng STU',
          partnerName: 'Phạm Gia Bảo (DH52003312)',
          agreed_price: 35000,
          meeting_location: 'Thư viện tầng 3 - Tòa nhà A',
          meeting_time: 'Hôm qua',
          status: 'COMPLETED',
          listingImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80',
        },
      ]);
    }

    return success(res, txs);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

app.patch('/api/v1/transactions/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query(
      'UPDATE stu_transaction_db.transactions SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    return success(res, { id: req.params.id, status }, 'Cập nhật trạng thái giao dịch thành công!');
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

// Get moderation listings
app.get('/api/v1/moderation/listings', authenticateToken, requireRole('MODERATOR', 'ADMIN'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.*, c.name as categoryName, u.full_name as sellerName, u.student_id as sellerStudentCode,
             (SELECT image_url FROM stu_listing_db.listing_images WHERE listing_id = l.id LIMIT 1) as primaryImageUrl
      FROM stu_listing_db.listings l
      LEFT JOIN stu_listing_db.categories c ON l.category_id = c.id
      LEFT JOIN stu_identity_db.users u ON l.seller_id = u.id
      ORDER BY l.id DESC
    `);
    return success(res, rows);
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Update listing moderation status
app.patch('/api/v1/moderation/listings/:id', authenticateToken, requireRole('MODERATOR', 'ADMIN'), async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE stu_listing_db.listings SET status = ? WHERE id = ?', [status, req.params.id]);
    return success(res, { id: req.params.id, status }, 'Cập nhật trạng thái kiểm duyệt tin thành công!');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

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
    if (status) {
      await pool.query('UPDATE stu_identity_db.users SET status = ? WHERE id = ?', [status, req.params.id]);
    }
    if (role) {
      await pool.query('UPDATE stu_identity_db.users SET role = ? WHERE id = ?', [role, req.params.id]);
    }
    return success(res, { id: req.params.id, status, role }, 'Cập nhật tài khoản người dùng thành công!');
  } catch (err) {
    return failure(res, err.message, 500);
  }
});

// Get system analytics
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

// Start Express Server
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 STU MARKETPLACE BACKEND API GATEWAY RUNNING ON PORT ${PORT}`);
  console.log(`🔗 Connecting to WampServer MySQL 8.0 on port 3306...`);
  console.log(`=======================================================`);
  await initDatabaseDefaults();
});
