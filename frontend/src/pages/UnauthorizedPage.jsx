import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function UnauthorizedPage() {
  const location = useLocation();
  const reason = location.state?.reason || 'Bạn không có quyền truy cập vào chức năng hoặc trang này.';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-600 border border-rose-100 mx-auto flex items-center justify-center shadow-inner">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Truy cập bị từ chối (403)
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">{reason}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full" leftIcon={<Home className="w-4 h-4" />}>
              Về trang chủ Sàn
            </Button>
          </Link>
          <Link to="/verify-student" className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full">
              Xác thực thẻ sinh viên
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
