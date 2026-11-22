import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  MessageSquare,
  Bell,
  User as UserIcon,
  LogOut,
  Shield,
  ShieldAlert,
  Menu,
  X,
  GraduationCap,
  ChevronDown,
  ShoppingBag,
  Heart,
  FileText,
  Building2,
  Phone,
  Mail,
  MapPin,
  Handshake,
  Rocket,
  PenSquare,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { VerificationBadge, RoleBadge } from '@/components/ui/Badge';
import { hasRole } from '@/lib/utils';

export function StudentLayout({ children }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isModerator = hasRole(user?.roles, 'MODERATOR');
  const isAdmin = hasRole(user?.roles, 'ADMIN');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Banner / Announcement */}
      <div className="bg-stu-darkBlue text-white text-xs py-1.5 px-4 text-center font-medium">
        <span className="inline-flex items-center gap-2">
          <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
          <span>Cổng trao đổi đồ dùng nội bộ dành riêng cho sinh viên Trường Đại học Công nghệ Sài Gòn - STU</span>
        </span>
      </div>

      {/* Locked Account Warning Banner */}
      {(user?.status === 'LOCKED' || user?.status === 'BANNED' || user?.accountStatus === 'LOCKED') && (
        <div className="bg-rose-600 text-white text-xs sm:text-sm py-2 px-4 text-center font-bold flex items-center justify-center gap-2 shadow-md">
          <ShieldAlert className="w-5 h-5 shrink-0 animate-pulse" />
          <span>🚨 TÀI KHOẢN CỦA BẠN ĐÃ BỊ KHÓA: Bạn đang bị đình chỉ quyền đăng tin, nhắn tin và giao dịch do vi phạm quy chế STU. Vui lòng liên hệ Ban Quản trị STU.</span>
        </div>
      )}

      {/* Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* STU Brand Logo */}
            <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
              <div className="w-10 h-10 rounded-xl bg-stu-blue flex items-center justify-center text-white shadow-md group-hover:bg-stu-darkBlue transition-colors">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-stu-blue leading-none">
                  STU <span className="text-stu-orange">MARKET</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                  ĐẠI HỌC CÔNG NGHỆ SÀI GÒN
                </span>
              </div>
            </Link>

            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-lg mx-4">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Tìm giáo trình, laptop, máy tính Casio, dụng cụ học tập..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 border border-transparent rounded-full focus:bg-white focus:border-stu-blue focus:ring-2 focus:ring-stu-blue/20 focus:outline-none transition-all placeholder:text-slate-400"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </form>

            {/* Right Action Icons & Auth */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/listings/create">
                <Button variant="accent" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                  Đăng tin
                </Button>
              </Link>

              {isAuthenticated && user ? (
                <>
                  <Link
                    to="/chat"
                    className="p-2 text-slate-600 hover:text-stu-blue hover:bg-slate-100 rounded-full transition-colors relative"
                    title="Tin nhắn"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </Link>

                  <Link
                    to="/notifications"
                    className="p-2 text-slate-600 hover:text-stu-blue hover:bg-slate-100 rounded-full transition-colors relative"
                    title="Thông báo"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
                  </Link>

                  {/* User Profile Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
                    >
                      <div className="w-8 h-8 rounded-full bg-stu-lightBlue text-stu-blue flex items-center justify-center font-bold text-xs border border-stu-blue/30">
                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="text-xs font-semibold text-slate-700 max-w-[120px] truncate">
                        {user.fullName}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200/80 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                        <div className="px-4 py-3 border-b border-slate-100">
                          <p className="text-sm font-bold text-slate-900 truncate">{user.fullName}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                            <VerificationBadge status={user.verificationStatus} />
                          </div>
                        </div>

                        <div className="py-1">
                          <Link
                            to="/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-stu-blue"
                          >
                            <UserIcon className="w-4 h-4 text-slate-400" />
                            Hồ sơ cá nhân sinh viên
                          </Link>

                          <Link
                            to="/seller-profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-stu-blue"
                          >
                            <ShoppingBag className="w-4 h-4 text-slate-400" />
                            Trang cá nhân người bán
                          </Link>

                          <Link
                            to="/my-listings"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-stu-blue"
                          >
                            <FileText className="w-4 h-4 text-slate-400" />
                            Quản lý tin đăng của tôi
                          </Link>

                          <Link
                            to="/transactions"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-stu-blue"
                          >
                            <Handshake className="w-4 h-4 text-slate-400" />
                            Quản lý & Hẹn gặp STU
                          </Link>

                          <Link
                            to="/transaction-history"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-stu-blue"
                          >
                            <Clock className="w-4 h-4 text-slate-400" />
                            Lịch sử & Biên nhận GD
                          </Link>

                          <Link
                            to="/posting-fee"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-stu-blue"
                          >
                            <Rocket className="w-4 h-4 text-slate-400" />
                            Thanh toán phí đẩy tin
                          </Link>

                          <Link
                            to="/favorites"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-stu-blue"
                          >
                            <Heart className="w-4 h-4 text-slate-400" />
                            Tin đăng đã lưu
                          </Link>

                          <Link
                            to="/messages"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-stu-blue"
                          >
                            <MessageSquare className="w-4 h-4 text-slate-400" />
                            Tin nhắn trao đổi
                          </Link>

                          <Link
                            to="/notifications"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-stu-blue"
                          >
                            <Bell className="w-4 h-4 text-slate-400" />
                            Thông báo của tôi
                          </Link>

                          {user.verificationStatus !== 'VERIFIED' && (
                            <Link
                              to="/verify-student"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-amber-600 hover:bg-amber-50"
                            >
                              <GraduationCap className="w-4 h-4 text-amber-500" />
                              Xác thực thẻ sinh viên STU
                            </Link>
                          )}

                          {/* Portal Shortcuts for Staff */}
                          {isModerator && (
                            <Link
                              to="/moderator"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100"
                            >
                              <Shield className="w-4 h-4 text-indigo-600" />
                              Cổng Kiểm duyệt viên
                            </Link>
                          )}

                          {isAdmin && (
                            <Link
                              to="/admin"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-700 bg-rose-50/70 hover:bg-rose-100"
                            >
                              <ShieldAlert className="w-4 h-4 text-rose-600" />
                              Cổng Quản trị viên (Admin)
                            </Link>
                          )}
                        </div>

                        <div className="pt-1 border-t border-slate-100">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 text-left"
                          >
                            <LogOut className="w-4 h-4 text-rose-500" />
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="sm">
                      Đăng ký STU
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex items-center md:hidden gap-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg focus:outline-none"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="pb-3 md:hidden">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Tìm giáo trình, laptop, phụ kiện..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-100 border border-transparent rounded-full focus:bg-white focus:border-stu-blue focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </form>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
            {isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-stu-blue text-white flex items-center justify-center font-bold">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{user.fullName}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <VerificationBadge status={user.verificationStatus} className="mt-1" />
                  </div>
                </div>

                <Link
                  to="/listings/create"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full"
                >
                  <Button variant="accent" size="sm" className="w-full justify-center" leftIcon={<PlusCircle className="w-4 h-4" />}>
                    Đăng tin mới
                  </Button>
                </Link>

                <div className="space-y-1 pt-2">
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Thông tin tài khoản
                  </Link>
                  {user.verificationStatus !== 'VERIFIED' && (
                    <Link
                      to="/verify-student"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg text-sm font-medium text-amber-600 bg-amber-50"
                    >
                      Xác thực thẻ sinh viên STU
                    </Link>
                  )}
                  <Link
                    to="/chat"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Tin nhắn trao đổi
                  </Link>
                  {isModerator && (
                    <Link
                      to="/moderator"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50"
                    >
                      Cổng Kiểm duyệt viên
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg text-sm font-medium text-rose-700 bg-rose-50"
                    >
                      Cổng Quản trị viên
                    </Link>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full justify-center"
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full justify-center">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full justify-center">
                    Đăng ký STU
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Quick Sub-nav bar */}
        <div className="bg-slate-50/90 border-t border-slate-200/70 hidden sm:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1 py-1.5 overflow-x-auto text-xs font-semibold">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-lg transition ${
                  location.pathname === '/' || location.pathname === '/listings'
                    ? 'bg-stu-blue text-white font-bold'
                    : 'text-slate-600 hover:text-stu-blue hover:bg-white'
                }`}
              >
                Trang chủ
              </Link>
              <Link
                to="/listings/create"
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                  location.pathname === '/listings/create' || location.pathname === '/create-post'
                    ? 'bg-stu-blue text-white font-bold'
                    : 'text-slate-600 hover:text-stu-blue hover:bg-white'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Đăng tin</span>
              </Link>
              <Link
                to="/my-listings"
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                  location.pathname === '/my-listings' || location.pathname === '/my-posts'
                    ? 'bg-stu-blue text-white font-bold'
                    : 'text-slate-600 hover:text-stu-blue hover:bg-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Tin của tôi</span>
              </Link>
              <Link
                to="/transactions"
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                  location.pathname.startsWith('/transaction')
                    ? 'bg-stu-blue text-white font-bold'
                    : 'text-slate-600 hover:text-stu-blue hover:bg-white'
                }`}
              >
                <Handshake className="w-3.5 h-3.5" />
                <span>Giao dịch & Hẹn gặp STU</span>
              </Link>
              <Link
                to="/messages"
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                  location.pathname === '/messages' || location.pathname === '/chat'
                    ? 'bg-stu-blue text-white font-bold'
                    : 'text-slate-600 hover:text-stu-blue hover:bg-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Tin nhắn</span>
              </Link>
              <Link
                to="/favorites"
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                  location.pathname === '/favorites'
                    ? 'bg-stu-blue text-white font-bold'
                    : 'text-slate-600 hover:text-stu-blue hover:bg-white'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Đã lưu</span>
              </Link>
              <Link
                to="/posting-fee"
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                  location.pathname === '/posting-fee'
                    ? 'bg-stu-blue text-white font-bold'
                    : 'text-slate-600 hover:text-stu-blue hover:bg-white'
                }`}
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>Đẩy tin</span>
              </Link>
              <Link
                to="/profile"
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ml-auto ${
                  location.pathname === '/profile' || location.pathname === '/seller-profile'
                    ? 'bg-stu-blue text-white font-bold'
                    : 'text-slate-600 hover:text-stu-blue hover:bg-white'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Hồ sơ SV</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1">
        {children || <Outlet />}
      </main>

      {/* University & Academic Project Footer */}
      <footer className="bg-slate-900 text-slate-300 mt-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: University Identity */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-stu-blue flex items-center justify-center text-white font-bold text-sm">
                  STU
                </div>
                <span className="text-white font-bold tracking-tight text-base">
                  STU MARKETPLACE
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nền tảng thương mại điện tử trao đổi đồ dùng học tập, giáo trình, thiết bị công nghệ dành riêng cho cộng đồng sinh viên Trường Đại học Công nghệ Sài Gòn.
              </p>
              <div className="text-xs text-amber-400 font-medium">
                Đồ án Luận văn Tốt nghiệp Đại học STU
              </div>
            </div>

            {/* Col 2: Campus Address & Contact */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white tracking-wider uppercase">Địa chỉ Trường STU</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-stu-orange flex-shrink-0 mt-0.5" />
                  <span>180 Cao Lỗ, Phường 4, Quận 8, TP. Hồ Chí Minh</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-stu-orange flex-shrink-0" />
                  <span>(028) 3850 5520</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-stu-orange flex-shrink-0" />
                  <span>contact@stu.edu.vn</span>
                </li>
              </ul>
            </div>

            {/* Col 3: Safe Exchange & Rules */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white tracking-wider uppercase">Giao dịch an toàn</h4>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>• Điểm hẹn an toàn: Sảnh A, Thư viện, Căn tin STU</li>
                <li>• Xác thực thẻ sinh viên trước khi đăng tin</li>
                <li>• Kiểm tra kỹ thiết bị, sách trước khi xác nhận nhận hàng</li>
                <li>• Báo cáo vi phạm ngay khi phát hiện tin đăng khả nghi</li>
              </ul>
            </div>

            {/* Col 4: Links */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white tracking-wider uppercase">Cổng thông tin</h4>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>
                  <Link to="/" className="hover:text-white transition-colors">Trang chủ Sàn</Link>
                </li>
                <li>
                  <Link to="/verify-student" className="hover:text-white transition-colors">Xác thực sinh viên</Link>
                </li>
                <li>
                  <a href="https://stu.edu.vn" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                    Cổng trường ĐH Công nghệ Sài Gòn
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
            © 2026 STU Marketplace - Trường Đại học Công nghệ Sài Gòn. Hệ thống phục vụ học thuật & phi thương mại hoá.
          </div>
        </div>
      </footer>
    </div>
  );
}
