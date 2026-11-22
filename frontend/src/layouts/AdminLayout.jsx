import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Layers,
  CreditCard,
  BarChart3,
  ArrowLeft,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Shield,
  FileText,
  ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { RoleBadge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    {
      title: 'Tổng quan hệ thống',
      path: '/admin',
      icon: <LayoutDashboard className="w-4 h-4" />,
      exact: true,
    },
    {
      title: 'Quản lý người dùng',
      path: '/admin/users',
      icon: <Users className="w-4 h-4" />,
    },
    {
      title: 'Kiểm duyệt tin đăng',
      path: '/admin/listings',
      icon: <ClipboardCheck className="w-4 h-4" />,
    },
    {
      title: 'Danh mục hàng hoá',
      path: '/admin/categories',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      title: 'Gói phí đăng tin & Niêm yết',
      path: '/admin/billing',
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      title: 'Thống kê & Báo cáo hệ thống',
      path: '/admin/analytics',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      title: 'Nhật ký kiểm toán & Hệ thống',
      path: '/admin/logs',
      icon: <FileText className="w-4 h-4" />,
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg focus:outline-none"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-inner">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-tight text-white text-base">STU ADMIN</span>
                  <span className="bg-rose-950 text-rose-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-rose-800">
                    QUẢN TRỊ VIÊN
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Hệ thống quản trị hạ tầng STU Marketplace</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/moderator"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white bg-indigo-950/80 hover:bg-indigo-900 px-3 py-1.5 rounded-lg border border-indigo-800 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Cổng Moderator</span>
            </Link>

            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về Sàn Sinh Viên</span>
            </Link>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white leading-tight">{user?.fullName}</p>
                <p className="text-[10px] text-rose-400 leading-tight">Admin Hệ thống</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-16 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-auto md:w-64 flex flex-col',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <RoleBadge role="ADMIN" />
              <span className="text-xs text-slate-500 font-medium">Toàn quyền hệ thống</span>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-rose-50 text-rose-700 font-semibold border border-rose-100 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <span className={isActive ? 'text-rose-600' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <Link
              to="/"
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-stu-blue transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Chuyển sang giao diện Sinh viên</span>
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
