import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Layouts
import { StudentLayout } from '@/layouts/StudentLayout';
import { ModeratorLayout } from '@/layouts/ModeratorLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { AuthLayout } from '@/layouts/AuthLayout';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { VerifyStudentPage } from '@/pages/auth/VerifyStudentPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';

// Portal Dashboards / Pages
import { HomePage } from '@/pages/student/HomePage';
import { ModeratorDashboard } from '@/pages/moderator/ModeratorDashboard';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* 1. Auth Flow Routes (AuthLayout) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* 2. Student Portal Routes (StudentLayout) */}
      <Route element={<StudentLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/listings" element={<HomePage />} />
        <Route
          path="/verify-student"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'MODERATOR', 'ADMIN']}>
              <VerifyStudentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'MODERATOR', 'ADMIN']}>
              <VerifyStudentPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 3. Moderator Portal Routes (ModeratorLayout) */}
      <Route
        path="/moderator"
        element={
          <ProtectedRoute allowedRoles={['MODERATOR', 'ADMIN']}>
            <ModeratorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ModeratorDashboard />} />
        <Route path="verifications" element={<ModeratorDashboard />} />
        <Route
          path="listings"
          element={
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Kiểm duyệt tin đăng sản phẩm</h3>
              <p className="text-xs text-slate-500 mt-1">Danh sách tin đăng chờ duyệt sẽ hiển thị tại đây.</p>
            </div>
          }
        />
        <Route
          path="reports"
          element={
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Xử lý báo cáo vi phạm</h3>
              <p className="text-xs text-slate-500 mt-1">Báo cáo người dùng và bài đăng vi phạm từ sinh viên.</p>
            </div>
          }
        />
        <Route
          path="keywords"
          element={
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Danh mục từ khóa cấm</h3>
              <p className="text-xs text-slate-500 mt-1">Bộ lọc tự động phát hiện ngôn từ tiêu cực hoặc gian lận.</p>
            </div>
          }
        />
        <Route
          path="logs"
          element={
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Lịch sử kiểm duyệt</h3>
              <p className="text-xs text-slate-500 mt-1">Nhật ký các thao tác phê duyệt và xử lý vi phạm.</p>
            </div>
          }
        />
      </Route>

      {/* 4. Admin Portal Routes (AdminLayout) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route
          path="users"
          element={
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Quản lý người dùng & phân quyền</h3>
              <p className="text-xs text-slate-500 mt-1">Danh sách tài khoản sinh viên, kiểm duyệt viên và khóa tài khoản.</p>
            </div>
          }
        />
        <Route
          path="categories"
          element={
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Quản lý danh mục hàng hóa</h3>
              <p className="text-xs text-slate-500 mt-1">Cấu hình các ngành đào tạo STU và nhóm đồ dùng học tập.</p>
            </div>
          }
        />
        <Route
          path="billing"
          element={
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Cấu hình gói phí niêm yết</h3>
              <p className="text-xs text-slate-500 mt-1">Gói đẩy bài & duy trì nền tảng STU Marketplace.</p>
            </div>
          }
        />
        <Route
          path="analytics"
          element={
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Thống kê & Báo cáo tổng thể</h3>
              <p className="text-xs text-slate-500 mt-1">Biểu đồ tăng trưởng người dùng, tin đăng và doanh thu phí.</p>
            </div>
          }
        />
        <Route
          path="logs"
          element={
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Nhật ký kiểm toán hệ thống</h3>
              <p className="text-xs text-slate-500 mt-1">Toàn bộ audit logs các sự kiện quan trọng trong hệ thống.</p>
            </div>
          }
        />
      </Route>

      {/* 5. Common & Error Pages */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
