import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { studentApi } from '@/api/studentApi';
import { useToast } from '@/hooks/useToast';
import { extractErrorMessage } from '@/api/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { VerificationBadge, RoleBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

export function ModeratorDashboard() {
  const { toast } = useToast();
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);

  const fetchVerifications = async () => {
    setIsLoading(true);
    try {
      const res = await studentApi.getPendingVerifications();
      if (res.success && res.data) {
        setPendingVerifications(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch pending verifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleReview = async (id, status) => {
    const note = window.prompt(
      status === 'APPROVED'
        ? 'Ghi chú phê duyệt (tùy chọn):'
        : 'Lý do từ chối xác thực thẻ sinh viên:'
    );

    if (status === 'REJECTED' && note === null) {
      return; // cancelled
    }

    setReviewingId(id);
    try {
      const res = await studentApi.reviewVerification(id, {
        status,
        note: note || undefined,
      });

      if (res.success) {
        toast.success(
          status === 'APPROVED'
            ? 'Đã duyệt xác thực thẻ sinh viên thành công!'
            : 'Đã từ chối hồ sơ xác minh.'
        );
        await fetchVerifications();
      } else {
        toast.error(res.message || 'Xử lý không thành công');
      }
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Lỗi khi xử lý hồ sơ kiểm duyệt'));
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            <span>Bàn Làm Việc Kiểm Duyệt Viên STU</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Giám sát tin đăng, xử lý báo cáo vi phạm và phê duyệt hồ sơ thẻ sinh viên Đại học Công nghệ Sài Gòn.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchVerifications}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Làm mới
        </Button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-indigo-100 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Thẻ SV chờ duyệt</p>
              <h3 className="text-2xl font-black text-indigo-700 mt-1">
                {pendingVerifications.length}
              </h3>
              <p className="text-[11px] text-indigo-600 mt-0.5">Cần đối chiếu thông tin</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tin đăng chờ duyệt</p>
              <h3 className="text-2xl font-black text-amber-700 mt-1">3</h3>
              <p className="text-[11px] text-amber-600 mt-0.5">Chờ xét duyệt hình ảnh & mô tả</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-100 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Báo cáo vi phạm</p>
              <h3 className="text-2xl font-black text-rose-700 mt-1">0</h3>
              <p className="text-[11px] text-rose-600 mt-0.5">Không có báo cáo khẩn</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Từ khóa cấm kích hoạt</p>
              <h3 className="text-2xl font-black text-purple-700 mt-1">12</h3>
              <p className="text-[11px] text-purple-600 mt-0.5">Bộ lọc tự động hoạt động</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Filter className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Work Queue: Student Verification Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <span>Danh sách hồ sơ thẻ sinh viên cần duyệt ({pendingVerifications.length})</span>
              </CardTitle>
              <CardDescription>
                Đối chiếu mã số sinh viên STU và hình ảnh thẻ sinh viên để cấp quyền hoạt động đầy đủ.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">Đang tải danh sách hồ sơ...</div>
          ) : pendingVerifications.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Hiện không có hồ sơ sinh viên nào chờ duyệt!</p>
              <p className="text-xs text-slate-400">Tất cả yêu cầu xác minh thẻ SV đã được giải quyết.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Mã số SV</th>
                    <th className="py-3 px-4">Phương thức</th>
                    <th className="py-3 px-4">Minh chứng thẻ SV</th>
                    <th className="py-3 px-4">Thời gian gửi</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingVerifications.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{item.studentCode || 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-600">{item.method}</td>
                      <td className="py-3 px-4 max-w-xs truncate font-mono text-slate-600" title={item.evidenceReference}>
                        {item.evidenceReference}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(item.createdAt)}</td>
                      <td className="py-3 px-4">
                        <VerificationBadge status={item.status} />
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="primary"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={reviewingId === item.id}
                          onClick={() => handleReview(item.id, 'APPROVED')}
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        >
                          Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={reviewingId === item.id}
                          onClick={() => handleReview(item.id, 'REJECTED')}
                          leftIcon={<XCircle className="w-3.5 h-3.5" />}
                        >
                          Từ chối
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
