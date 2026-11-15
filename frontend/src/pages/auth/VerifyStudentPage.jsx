import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  GraduationCap,
  ShieldCheck,
  UploadCloud,
  FileCheck2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  History,
  Info,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { studentApi } from '@/api/studentApi';
import { extractErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { VerificationBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

const verifySchema = z.object({
  studentCode: z
    .string()
    .min(5, 'Mã số sinh viên tối thiểu 5 ký tự')
    .max(20, 'Mã số sinh viên tối đa 20 ký tự')
    .regex(/^[A-Za-z0-9]+$/, 'Mã số sinh viên chỉ chứa chữ và số (VD: DH52001234)'),
  method: z.enum(['MANUAL_REVIEW', 'INSTITUTION_API']),
  evidenceReference: z
    .string()
    .min(5, 'Vui lòng cung cấp link ảnh hoặc mã định danh thẻ sinh viên')
    .max(500, 'Độ dài tối đa 500 ký tự'),
});

export function VerifyStudentPage() {
  const { user, verifyStudent, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [verifications, setVerifications] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      studentCode: user?.studentCode || '',
      method: 'MANUAL_REVIEW',
      evidenceReference: '',
    },
  });

  const selectedEvidence = watch('evidenceReference');

  // Load past verifications
  useEffect(() => {
    async function loadVerifications() {
      try {
        const res = await studentApi.getMyVerifications();
        if (res.success && res.data) {
          setVerifications(res.data);
        }
      } catch (err) {
        console.warn('Could not load verifications history:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    loadVerifications();
  }, []);

  // Update default studentCode if user updates
  useEffect(() => {
    if (user?.studentCode) {
      setValue('studentCode', user.studentCode);
    }
  }, [user, setValue]);

  const onSubmit = async (data) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      const payload = {
        studentCode: data.studentCode.trim().toUpperCase(),
        method: data.method,
        evidenceReference: data.evidenceReference.trim(),
      };

      const res = await verifyStudent(payload);
      if (res.success) {
        toast.success('Hồ sơ xác minh thẻ sinh viên đã được gửi thành công!');
        // Refresh list
        const updatedList = await studentApi.getMyVerifications();
        if (updatedList.success && updatedList.data) {
          setVerifications(updatedList.data);
        }
        await refreshProfile();
      } else {
        setServerError(res.message || 'Gửi yêu cầu không thành công');
      }
    } catch (err) {
      const msg = extractErrorMessage(err, 'Không thể gửi hồ sơ xác thực. Vui lòng thử lại.');
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAlreadyVerified = user?.verificationStatus === 'VERIFIED';
  const hasPending = verifications.some((v) => v.status === 'PENDING') || user?.verificationStatus === 'PENDING';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Page Title & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-stu-blue" />
            <span>Xác thực Thẻ Sinh Viên STU</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Xác minh danh tính sinh viên Trường Đại học Công nghệ Sài Gòn để kích hoạt quyền đăng tin và mua bán.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Trạng thái hiện tại:</span>
          <VerificationBadge status={user?.verificationStatus || 'PENDING'} />
        </div>
      </div>

      {/* Status Notice Banners */}
      {isAlreadyVerified && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-900">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold">Tài khoản của bạn đã được xác thực sinh viên STU!</p>
            <p className="text-xs text-emerald-700">
              Bạn có toàn quyền sử dụng tất cả tính năng trên hệ thống: đăng tin trao đổi giáo trình, trao đổi đồ dùng và hẹn gặp tại trường.
            </p>
          </div>
        </div>
      )}

      {hasPending && !isAlreadyVerified && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold">Hồ sơ xác thực đang chờ xét duyệt</p>
            <p className="text-xs text-amber-700">
              Ban kiểm duyệt STU đang tiến hành đối chiếu thông tin thẻ sinh viên của bạn. Kết quả sẽ được phản hồi trong vòng 24 giờ.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Verification Form Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gửi yêu cầu xác thực</CardTitle>
              <CardDescription>
                Nhập thông tin mã số sinh viên và tải lên ảnh thẻ sinh viên STU hoặc giấy báo xác nhận sinh viên.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {serverError && (
                <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{serverError}</div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                  label="Mã số sinh viên (MSSV)"
                  placeholder="VD: DH52001234"
                  required
                  leftIcon={<GraduationCap className="w-4 h-4" />}
                  error={errors.studentCode?.message}
                  disabled={isAlreadyVerified}
                  {...register('studentCode')}
                />

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Phương thức xác minh <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-stu-blue focus:ring-2 focus:ring-stu-blue/20"
                    disabled={isAlreadyVerified}
                    {...register('method')}
                  >
                    <option value="MANUAL_REVIEW">Kiểm duyệt thủ công qua ảnh thẻ SV (Khuyến nghị)</option>
                    <option value="INSTITUTION_API">Xác thực qua cổng trường STU SSO / API</option>
                  </select>
                  {errors.method?.message && (
                    <p className="text-xs text-rose-600">{errors.method.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Input
                    label="Liên kết ảnh minh chứng thẻ sinh viên"
                    placeholder="VD: https://storage.stu.edu.vn/cards/DH52001234.jpg"
                    required
                    leftIcon={<ImageIcon className="w-4 h-4" />}
                    helperText="Cung cấp URL hình ảnh thẻ sinh viên hoặc biên nhận học phí có MSSV"
                    error={errors.evidenceReference?.message}
                    disabled={isAlreadyVerified}
                    {...register('evidenceReference')}
                  />

                  {/* Sample presets for student convenience */}
                  {!isAlreadyVerified && (
                    <div className="flex flex-wrap gap-2 pt-1 text-xs">
                      <span className="text-slate-400">Ví dụ mẫu:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setValue(
                            'evidenceReference',
                            `https://stu.edu.vn/uploads/cards/student_${watch('studentCode') || 'DH52001234'}.jpg`
                          )
                        }
                        className="text-stu-blue hover:underline font-medium"
                      >
                        [Link thẻ SV STU]
                      </button>
                    </div>
                  )}
                </div>

                {/* Evidence preview box */}
                {selectedEvidence && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Minh chứng đã nhập:</p>
                    <p className="text-xs font-mono text-slate-700 break-all">{selectedEvidence}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isSubmitting}
                  disabled={isAlreadyVerified || hasPending}
                >
                  {isAlreadyVerified
                    ? 'Bạn đã được xác thực thành công'
                    : hasPending
                    ? 'Hồ sơ đang chờ duyệt'
                    : 'Gửi hồ sơ xác minh'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Instructions & Submission History */}
        <div className="space-y-6">
          <Card className="bg-blue-50/50 border-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-stu-blue flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span>Quy định xác thực STU</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-slate-600">
              <p>• Thẻ sinh viên phải còn hạn sử dụng, rõ họ tên, mã số sinh viên và hình thẻ.</p>
              <p>• Trường hợp mất thẻ, sinh viên có thể dùng bảng điểm hoặc biên lai học phí chính thức của STU.</p>
              <p>• Mỗi mã số sinh viên chỉ được liên kết với một tài khoản duy nhất.</p>
            </CardContent>
          </Card>

          {/* Submission History List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <span>Lịch sử xác minh</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {isLoadingHistory ? (
                <div className="text-xs text-slate-400 py-4 text-center">Đang tải lịch sử...</div>
              ) : verifications.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center">Chưa có yêu cầu xác thực nào.</div>
              ) : (
                <div className="space-y-3">
                  {verifications.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{item.studentCode || 'N/A'}</span>
                        <VerificationBadge status={item.status} />
                      </div>
                      <p className="text-[11px] text-slate-500 truncate" title={item.evidenceReference}>
                        Minh chứng: {item.evidenceReference}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
                        <span>Phương thức: {item.method}</span>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                      {item.rejectionReason && (
                        <p className="text-[11px] text-rose-600 font-medium">Lý do từ chối: {item.rejectionReason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
