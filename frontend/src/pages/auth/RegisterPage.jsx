import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock, Phone, GraduationCap, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { extractErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Họ và tên tối thiểu 2 ký tự')
      .max(150, 'Họ và tên tối đa 150 ký tự'),
    studentCode: z
      .string()
      .min(1, 'Vui lòng nhập Mã số sinh viên (MSSV)')
      .refine(
        (val) => {
          const upper = (val || '').trim().toUpperCase();
          return /^DH[0-9]{8}$/i.test(upper) || /^[A-Za-z0-9]{8,12}$/.test(upper);
        },
        {
          message: 'Mã số sinh viên không hợp lệ (MSSV trường STU gồm đúng 10 ký tự, Ví dụ: DH52201642)',
        }
      ),
    email: z
      .string()
      .min(1, 'Vui lòng nhập email sinh viên STU')
      .email('Email không đúng định dạng')
      .refine(
        (val) => {
          const lower = (val || '').trim().toLowerCase();
          return lower.endsWith('@student.stu.edu.vn') || lower.endsWith('@stu.edu.vn');
        },
        {
          message: 'Bắt buộc sử dụng email sinh viên chính thống của trường (@student.stu.edu.vn hoặc @stu.edu.vn). Chặn email cá nhân bên ngoài.',
        }
      ),
    phone: z
      .string()
      .min(1, 'Vui lòng nhập số điện thoại liên hệ')
      .refine((val) => /^(0|\+84)[0-9]{9}$/.test((val || '').replace(/\s+/g, '')), {
        message: 'Số điện thoại phải gồm 10 chữ số hợp lệ (Ví dụ: 0901234567)',
      }),
    password: z
      .string()
      .min(6, 'Mật khẩu phải từ 6 đến 50 ký tự')
      .max(50, 'Mật khẩu tối đa 50 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      studentCode: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      const payload = {
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        ...(data.studentCode ? { studentCode: data.studentCode.trim().toUpperCase() } : {}),
        ...(data.phone ? { phone: data.phone.trim() } : {}),
      };

      const res = await registerUser(payload);
      if (res.success) {
        toast.success('Đăng ký tài khoản STU thành công! Chào mừng bạn gia nhập Sàn.');
        navigate('/verify-student');
      } else {
        setServerError(res.message || 'Đăng ký không thành công');
      }
    } catch (err) {
      const msg = extractErrorMessage(err, 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
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
              <UserPlus className="w-5 h-5" />
            </span>
            <CardTitle className="text-2xl font-bold text-slate-900">Đăng ký tài khoản STU</CardTitle>
          </div>
          <CardDescription className="text-slate-500">
            Tạo tài khoản sinh viên để đăng tin, trao đổi giáo trình & dụng cụ học tập.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {serverError && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{serverError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <Input
              label="Họ và tên"
              placeholder="VD: Nguyễn Văn An"
              required
              leftIcon={<User className="w-4 h-4" />}
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Mã số sinh viên (MSSV)"
                placeholder="VD: DH52201642"
                required
                leftIcon={<GraduationCap className="w-4 h-4" />}
                helperText="MSSV trường STU gồm 10 ký tự (báo lỗi ngay khi rời ô)"
                error={errors.studentCode?.message}
                {...register('studentCode', {
                  onBlur: (e) => {
                    const code = (e.target.value || '').trim();
                    if (/^DH[0-9]{8}$/i.test(code)) {
                      const currentEmail = getValues('email');
                      if (!currentEmail) {
                        setValue('email', `${code.toLowerCase()}@student.stu.edu.vn`, { shouldValidate: true });
                      }
                    }
                  },
                })}
              />

              <Input
                label="Số điện thoại"
                placeholder="VD: 0901234567"
                required
                leftIcon={<Phone className="w-4 h-4" />}
                helperText="Hẹn gặp trao đổi tại STU"
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>

            <Input
              label="Email Sinh Viên STU"
              type="email"
              placeholder="VD: dh52201642@student.stu.edu.vn"
              required
              leftIcon={<Mail className="w-4 h-4" />}
              helperText="Bắt buộc sử dụng email @student.stu.edu.vn hoặc @stu.edu.vn (chặn email ngoài)"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tối thiểu 6 ký tự"
                required
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                {...register('password')}
              />

              <Input
                label="Xác nhận mật khẩu"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu"
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
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>

            <div className="pt-1">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
              >
                Đăng ký tài khoản
              </Button>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 pt-2 text-center text-xs text-slate-500">
          <p>
            Đã có tài khoản sinh viên?{' '}
            <Link to="/login" className="font-semibold text-stu-blue hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
