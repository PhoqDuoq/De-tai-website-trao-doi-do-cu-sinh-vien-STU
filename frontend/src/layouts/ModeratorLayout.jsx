import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  FileText,
  History,
  GraduationCap,
  ArrowLeft,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Filter,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { RoleBadge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export function ModeratorLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    {
      title: 'Tổng quan kiểm duyệt',
      path: '/moderator',
      icon: <LayoutDashboard className="w-4 h-4" />,
      exact: true,
    },
    {
      title: 'Xác minh thẻ sinh viên',
      path: '/moderator/verifications',
      icon: <GraduationCap className="w-4 h-4" />,
    },
    {
      title: 'Kiểm duyệt tin đăng',
      path: '/moderator/listings',
      icon: <FileCheck className="w-4 h-4" />,
    },
    {
      title: 'Xử lý báo cáo vi phạm',
      path: '/moderator/reports',
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    {
      title: 'Từ khóa cấm & Vi phạm',
      path: '/moderator/keywords',
      icon: <Filter className="w-4 h-4" />,
    },
    {
      title: 'Lịch sử kiểm duyệt',
      path: '/moderator/logs',
      icon: <History className="w-4 h-4" />,
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-indigo-900 text-white shadow-md">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-indigo-200 hover:text-white rounded-lg focus:outline-none"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-indigo-700 flex items-center justify-center text-indigo-100 shadow-inner">
                <ShieldCheck className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-tight text-white text-base">STU MODERATOR</span>
                  <span className="bg-indigo-700/80 text-indigo-200 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-500/50">
                    CỔNG KIỂM DUYỆT
                  </span>
                </div>
                <p className="text-[10px] text-indigo-300">Hệ thống giám sát nội dung & xác minh STU</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-indigo-200 hover:text-white bg-indigo-800/80 hover:bg-indigo-800 px-3 py-1.5 rounded-lg border border-indigo-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về Sàn Sinh Viên</span>
            </Link>

            <div className="flex items-center gap-2 pl-3 border-l border-indigo-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white leading-tight">{user?.fullName}</p>
                <p className="text-[10px] text-indigo-300 leading-tight">Kiểm duyệt viên</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-indigo-300 hover:text-rose-300 hover:bg-indigo-800 rounded-lg transition-colors"
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
              <RoleBadge role="MODERATOR" />
              <span className="text-xs text-slate-500 font-medium">Bảo vệ quyền lợi STU</span>
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
                      ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>{item.icon}</span>
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
