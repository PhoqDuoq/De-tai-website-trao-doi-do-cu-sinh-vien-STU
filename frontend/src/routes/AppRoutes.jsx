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
import { CreateListingPage } from '@/pages/student/CreateListingPage';
import { MyListingsPage } from '@/pages/student/MyListingsPage';
import { FavoritesPage } from '@/pages/student/FavoritesPage';
import { MessagesPage } from '@/pages/student/MessagesPage';
import { TransactionsPage } from '@/pages/student/TransactionsPage';
import { ProfilePage } from '@/pages/student/ProfilePage';
import { PostingFeePage } from '@/pages/student/PostingFeePage';
import { NotificationsPage } from '@/pages/student/NotificationsPage';
import { EditListingPage } from '@/pages/student/EditListingPage';
import { ModeratorDashboard } from '@/pages/moderator/ModeratorDashboard';
import { ModeratorListingsPage } from '@/pages/moderator/ModeratorListingsPage';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
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
        {/* Public browse routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/listings" element={<HomePage />} />
        <Route path="/seller-profile" element={<ProfilePage />} />

        {/* Protected Student Action Routes */}
        <Route
          path="/listings/create"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'MODERATOR', 'ADMIN']}>
              <CreateListingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-post"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'MODERATOR', 'ADMIN']}>
              <CreateListingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-listings"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'MODERATOR', 'ADMIN']}>
              <MyListingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-posts"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'MODERATOR', 'ADMIN']}>
              <MyListingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'MODERATOR', 'ADMIN']}>
              <FavoritesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'MODERATOR', 'ADMIN']}>
              <MessagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'MODERATOR', 'ADMIN']}>
              <MessagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'MODERATOR', 'ADMIN']}>
              <TransactionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transaction-history"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'MODERATOR', 'ADMIN']}>
              <TransactionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'MODERATOR', 'ADMIN']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posting-fee"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'MODERATOR', 'ADMIN']}>
              <PostingFeePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'MODERATOR', 'ADMIN']}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-post"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'MODERATOR', 'ADMIN']}>
              <EditListingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-post/:id"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'MODERATOR', 'ADMIN']}>
              <EditListingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-listing/:id"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'MODERATOR', 'ADMIN']}>
              <EditListingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verify-student"
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
        <Route path="listings" element={<ModeratorListingsPage />} />
        <Route
          path="reports"
          element={
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Xử lý báo cáo vi phạm STU</h3>
              <p className="text-xs text-slate-500 mt-1">Hiện không có báo cáo vi phạm mới nào từ sinh viên.</p>
            </div>
          }
        />
        <Route
          path="keywords"
          element={
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Danh mục từ khóa cấm STU</h3>
              <p className="text-xs text-slate-500 mt-1">Đang kích hoạt bộ lọc tự động 12 từ khóa vi phạm.</p>
            </div>
          }
        />
        <Route
          path="logs"
          element={
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Lịch sử kiểm duyệt</h3>
              <p className="text-xs text-slate-500 mt-1">Ghi nhận 14 lượt phê duyệt gần nhất.</p>
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
        <Route path="users" element={<AdminUsersPage />} />
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
