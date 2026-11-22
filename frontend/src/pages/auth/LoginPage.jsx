import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Sparkles, GraduationCap, ShieldCheck, ShieldAlert, ShoppingBag, Store } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { extractErrorMessage, clearAuthData } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';

const loginSchema = z.object({
  emailOrStudentCode: z
    .string()
    .min(1, 'Vui lòng nhập Email hoặc Mã số sinh viên')
    .max(100, 'Không được vượt quá 100 ký tự'),
  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu')
    .min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
});

export function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrStudentCode: '',
      password: '',
    },
  });

  const handleQuickLogin = async (email, pass, defaultRoute) => {
    // Purge any stale tokens to avoid session cross-contamination
    clearAuthData();
    setValue('emailOrStudentCode', email);
    setValue('password', pass);
    setIsSubmitting(true);
    setServerError('');
    try {
      const res = await login({ emailOrStudentCode: email, password: pass });
      if (res.success) {
        toast.success(`Đăng nhập thành công với vai trò ${res.user?.role || res.user?.roles?.[0] || 'STU'}!`);
        navigate(defaultRoute, { replace: true });
      } else {
        setServerError(res.message || 'Đăng nhập không thành công');
      }
    } catch (err) {
      const msg = extractErrorMessage(err, 'Đăng nhập không thành công');
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data) => {
    // Clean stale session
    clearAuthData();
    setServerError('');
    setIsSubmitting(true);
    try {
      const res = await login(data);
      if (res.success) {
        toast.success(`Chào mừng bạn quay lại, ${res.user?.fullName || 'Sinh viên STU'}!`);
        // Navigate safely based on role to avoid getting trapped in unauthorized admin routes
        const role = res.user?.role || res.user?.roles?.[0];
        let targetRoute = '/';
        if (role === 'ADMIN') {
          targetRoute = '/admin';
        } else if (role === 'MODERATOR') {
          targetRoute = '/moderator';
        } else {
          // If student, only redirect to 'from' if it's not a restricted staff route
          targetRoute = (from && !from.startsWith('/admin') && !from.startsWith('/moderator')) ? from : '/';
        }

        navigate(targetRoute, { replace: true });
      } else {
        setServerError(res.message || 'Đăng nhập không thành công');
      }
    } catch (err) {
      const msg = extractErrorMessage(err, 'Email, MSSV hoặc mật khẩu không chính xác.');
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <Card className="border-slate-200/90 shadow-lg">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-stu-lightBlue text-stu-blue">
              <LogIn className="w-5 h-5" />
            </span>
            <CardTitle className="text-2xl font-bold text-slate-900">Đăng nhập</CardTitle>
          </div>
          <CardDescription className="text-slate-500">
            Sử dụng email STU (<code className="text-stu-blue">@stu.edu.vn</code>) hoặc mã số sinh viên để tiếp tục.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {serverError && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{serverError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email hoặc Mã số sinh viên"
              placeholder="VD: DH52001234 hoặc student@stu.edu.vn"
              required
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.emailOrStudentCode?.message}
              {...register('emailOrStudentCode')}
            />

            <div>
              <Input
                label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu của bạn"
                required
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />
              <div className="flex justify-end mt-1.5">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-stu-blue hover:text-stu-darkBlue transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
            >
              Đăng nhập ngay
            </Button>
          </form>

          {/* Demo RBAC Quick Login Panel for Thesis Defense */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Tài khoản mẫu kiểm thử phân quyền (RBAC Demo)</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin('dh52201642@student.stu.edu.vn', 'Stu@123456', '/')
                }
                className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-stu-blue font-bold text-xs">
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>Người mua (STU)</span>
                </div>
                <div className="text-[10px] text-slate-600 font-semibold mt-0.5 truncate">
                  Hà Thiên Phúc
                </div>
                <div className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-mono font-bold mt-1 inline-block">
                  DH52201642
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickLogin('dh52200413@student.stu.edu.vn', 'Stu@123456', '/')
                }
                className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                  <Store className="w-4 h-4 shrink-0" />
                  <span>Người bán (STU)</span>
                </div>
                <div className="text-[10px] text-slate-600 font-semibold mt-0.5 truncate">
                  Dương Hoài Phong
                </div>
                <div className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-mono font-bold mt-1 inline-block">
                  DH52200413
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickLogin('moderator@stu.edu.vn', 'Admin@123456', '/moderator')
                }
                className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Kiểm duyệt viên</span>
                </div>
                <div className="text-[10px] text-slate-600 font-semibold mt-0.5 truncate">
                  Ban Kiểm Duyệt
                </div>
                <div className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-mono font-bold mt-1 inline-block">
                  ROLE: MODERATOR
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickLogin('admin@stu.edu.vn', 'Admin@123456', '/admin')
                }
                className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Quản trị viên</span>
                </div>
                <div className="text-[10px] text-slate-600 font-semibold mt-0.5 truncate">
                  Admin Hệ Thống
                </div>
                <div className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-mono font-bold mt-1 inline-block">
                  ROLE: ADMIN
                </div>
              </button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 pt-2 text-center text-xs text-slate-500">
          <p>
            Chưa có tài khoản sinh viên?{' '}
            <Link to="/register" className="font-semibold text-stu-blue hover:underline">
              Đăng ký tài khoản STU
            </Link>
          </p>

          <div className="pt-2 border-t border-slate-100 w-full flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Nền tảng thương mại nội bộ Đại học Công nghệ Sài Gòn</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
