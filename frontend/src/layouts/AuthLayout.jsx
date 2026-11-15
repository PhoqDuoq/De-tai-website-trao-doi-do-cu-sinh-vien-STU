import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { GraduationCap, ShieldCheck, MapPin, Sparkles, ArrowLeft, ShoppingBag } from 'lucide-react';

export function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Left Column: STU Campus & Benefits Banner (Visible on lg+) */}
      <div className="relative hidden lg:flex lg:w-1/2 bg-gradient-to-br from-stu-darkBlue via-stu-blue to-blue-900 text-white p-12 flex-col justify-between overflow-hidden">
        {/* Background decorative patterns */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-stu-orange/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white block">
                STU <span className="text-stu-orange">MARKET</span>
              </span>
              <span className="text-xs text-blue-200 tracking-wider font-medium">
                ĐẠI HỌC CÔNG NGHỆ SÀI GÒN
              </span>
            </div>
          </Link>
        </div>

        {/* Middle Feature Highlights */}
        <div className="relative z-10 my-auto py-8 space-y-8 max-w-lg">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-300 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nền Tảng Nội Bộ Trường STU</span>
            </span>
            <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight">
              Trao đổi đồ dùng học tập an toàn, tiết kiệm & tiện lợi
            </h1>
            <p className="mt-3 text-sm text-blue-100/90 leading-relaxed">
              Giải pháp thương mại điện tử sinh viên giúp kết nối người mua và người bán ngay trong khuôn viên trường STU.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Xác thực danh tính sinh viên STU</h4>
                <p className="text-xs text-blue-200 mt-0.5">
                  Đảm bảo 100% người dùng là sinh viên trường qua mã số sinh viên và thẻ sinh viên.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="w-9 h-9 rounded-xl bg-blue-400/20 text-blue-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Điểm hẹn trao đổi an toàn tại trường</h4>
                <p className="text-xs text-blue-200 mt-0.5">
                  Hẹn gặp trực tiếp tại Sảnh A, Thư viện, Căn tin STU (180 Cao Lỗ) để xem hàng và nhận đồ.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Tiết kiệm chi phí & bảo vệ môi trường</h4>
                <p className="text-xs text-blue-200 mt-0.5">
                  Tái sử dụng giáo trình, laptop, dụng cụ kỹ thuật, đồ án giữa các khóa sinh viên.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Attribution */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-blue-200">
          <span>Trường Đại học Công nghệ Sài Gòn (STU)</span>
          <span>180 Cao Lỗ, P.4, Q.8, TP.HCM</span>
        </div>
      </div>

      {/* Right Column: Auth Form Area */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-y-auto">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-stu-blue transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về trang chủ Sàn</span>
          </Link>

          {/* Mobile STU Logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-stu-blue text-white flex items-center justify-center font-bold text-xs">
              STU
            </div>
            <span className="text-xs font-bold text-stu-blue">STU MARKET</span>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto my-auto py-8">
          {children || <Outlet />}
        </div>

        <div className="text-center text-xs text-slate-400 py-2">
          © 2026 STU Marketplace. Đồ án Luận văn Tốt nghiệp ĐH Công nghệ Sài Gòn.
        </div>
      </div>
    </div>
  );
}
