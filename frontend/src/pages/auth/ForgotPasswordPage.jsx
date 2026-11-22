import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { authApi } from '@/api/authApi';
import { extractErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập địa chỉ email sinh viên STU')
    .email('Email không đúng định dạng')
    .refine(
      (val) => {
        const lower = (val || '').trim().toLowerCase();
        return lower.endsWith('@student.stu.edu.vn') || lower.endsWith('@stu.edu.vn');
      },
      'Bắt buộc phải là email sinh viên trường STU (@student.stu.edu.vn hoặc @stu.edu.vn)'
    ),
});

export function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { email: '' },
  });

  const onSubmit = async (data) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      await authApi.forgotPassword(data.email.trim().toLowerCase());
      setSubmittedEmail(data.email.trim());
      setIsSuccess(true);
    } catch (err) {
      const msg = extractErrorMessage(err, 'Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại.');
      setServerError(msg);
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
              <KeyRound className="w-5 h-5" />
            </span>
            <CardTitle className="text-2xl font-bold text-slate-900">Quên mật khẩu</CardTitle>
          </div>
          <CardDescription className="text-slate-500">
            Nhập email tài khoản STU của bạn để nhận liên kết khôi phục mật khẩu.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isSuccess ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3.5 text-emerald-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-sm text-emerald-900">Yêu cầu đã được ghi nhận</p>
                  <p className="text-emerald-800 leading-relaxed">
                    Nếu email <span className="font-semibold text-emerald-950">{submittedEmail}</span> tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hòm thư của bạn.
                  </p>
                  <p className="text-emerald-700 pt-1">
                    Vui lòng kiểm tra hộp thư đến (và thư mục Spam/Quảng cáo).
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/login" className="block w-full">
                  <Button variant="primary" size="lg" className="w-full">
                    Quay lại Đăng nhập
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{serverError}</div>
                </div>
              )}

              <Input
                label="Email đăng ký tài khoản"
                type="email"
                placeholder="VD: student@stu.edu.vn"
                required
                leftIcon={<Mail className="w-4 h-4" />}
                helperText="Hệ thống sẽ gửi mã hoặc link xác thực đến email này"
                error={errors.email?.message}
                {...register('email')}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                isLoading={isSubmitting}
              >
                Gửi yêu cầu khôi phục
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex justify-center pt-2 border-t border-slate-100">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-stu-blue transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang Đăng nhập</span>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
