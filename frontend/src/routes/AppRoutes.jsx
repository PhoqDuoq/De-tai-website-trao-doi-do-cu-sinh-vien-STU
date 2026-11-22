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
import { ListingDetailPage } from '@/pages/student/ListingDetailPage';
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
import { ModeratorReportsPage } from '@/pages/moderator/ModeratorReportsPage';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminListingsModerationPage } from '@/pages/admin/AdminListingsModerationPage';
import { AdminCategoriesPage } from '@/pages/admin/AdminCategoriesPage';
import { AdminBillingPage } from '@/pages/admin/AdminBillingPage';
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage';
import { AdminAuditLogsPage } from '@/pages/admin/AdminAuditLogsPage';
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
        <Route path="/listings/:id" element={<ListingDetailPage />} />
        <Route path="/san-pham/:id" element={<ListingDetailPage />} />
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
        <Route path="reports" element={<ModeratorReportsPage />} />
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
        <Route path="listings" element={<AdminListingsModerationPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="billing" element={<AdminBillingPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="logs" element={<AdminAuditLogsPage />} />
      </Route>

      {/* 5. Common & Error Pages */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
