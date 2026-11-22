import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { hasRole } from '@/lib/utils';

export function ProtectedRoute({
  children,
  allowedRoles,
  requireVerifiedStudent = false,
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" text="Đang xác minh phiên đăng nhập..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check account lock/suspension status
  const isLocked =
    user.status === 'LOCKED' ||
    user.status === 'BANNED' ||
    user.status === 'SUSPENDED' ||
    user.accountStatus === 'LOCKED' ||
    user.accountStatus === 'SUSPENDED';

  if (isLocked) {
    return (
      <Navigate
        to="/unauthorized"
        state={{
          reason:
            'Tài khoản STU của bạn đã bị KHÓA do vi phạm quy chế sàn. Mọi thao tác đăng bài, nhắn tin và giao dịch đã bị đình chỉ.',
        }}
        replace
      />
    );
  }

  // Check role authorization
  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles = user.roles || [];
    const isAuthorized = allowedRoles.some((role) => hasRole(userRoles, role));

    if (!isAuthorized) {
      return (
        <Navigate
          to="/unauthorized"
          state={{ reason: 'Bạn không có vai trò phù hợp để truy cập khu vực này.' }}
          replace
        />
      );
    }
  }

  // Check verified student status
  if (requireVerifiedStudent && user.verificationStatus !== 'VERIFIED') {
    return (
      <Navigate
        to="/verify-student"
        state={{
          from: location,
          message: 'Bạn cần xác thực thẻ sinh viên STU trước khi thực hiện chức năng này.',
        }}
        replace
      />
    );
  }

  return children ? <>{children}</> : <Outlet />;
}
