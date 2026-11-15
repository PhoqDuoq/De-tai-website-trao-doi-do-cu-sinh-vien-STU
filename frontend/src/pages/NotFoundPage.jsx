import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-blue-50 text-stu-blue border border-blue-100 mx-auto flex items-center justify-center shadow-inner">
          <span className="text-3xl font-black">404</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Không tìm thấy trang
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Đường dẫn bạn yêu cầu không tồn tại hoặc đã được gỡ bỏ khỏi hệ thống Sàn Trao Đổi Đồ Dùng Cũ STU.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full" leftIcon={<Home className="w-4 h-4" />}>
              Về trang chủ Sàn
            </Button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto"
          >
            <Button variant="outline" size="md" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Quay lại trang trước
            </Button>
          </button>
        </div>

        <div className="text-xs text-slate-400 pt-6 border-t border-slate-200">
          Trường Đại học Công nghệ Sài Gòn (STU) - 180 Cao Lỗ, Quận 8
        </div>
      </div>
    </div>
  );
}
