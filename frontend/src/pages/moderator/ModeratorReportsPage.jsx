import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Clock,
  Eye
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export function ModeratorReportsPage() {
  const { toast } = useToast();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/v1/moderation/reports');
      if (res && res.data && res.data.data) {
        setReports(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch moderation reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleResolve = async (id, action) => {
    try {
      await apiClient.patch(`/api/v1/moderation/reports/${id}`, {
        status: action === 'DISMISSED' ? 'DISMISSED' : 'RESOLVED',
        resolutionAction: action,
      });
      toast.success(
        action === 'CONTENT_REMOVED'
          ? 'Đã xử lý: Gỡ bài đăng vi phạm khỏi hệ thống!'
          : action === 'DISMISSED'
          ? 'Đã bác bỏ báo cáo vi phạm.'
          : 'Đã gửi cảnh cáo người dùng vi phạm.'
      );
      setReports((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: action === 'DISMISSED' ? 'DISMISSED' : 'RESOLVED' } : r
        )
      );
    } catch (err) {
      toast.error('Lỗi khi xử lý báo cáo: ' + err.message);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-rose-600" />
            <span>Xử Lý Báo Cáo Vi Phạm Từ Sinh Viên STU</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tiếp nhận tố giác tin đăng sai lệch, gian lận, đồ dùng cấm và hành vi vi phạm quy chế trường.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchReports}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Làm mới danh sách
        </Button>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                <th className="py-3.5 px-4">Người báo cáo</th>
                <th className="py-3.5 px-4">Mục tiêu vi phạm</th>
                <th className="py-3.5 px-4">Lý do & Mô tả</th>
                <th className="py-3.5 px-4">Thời gian</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Quyết định xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    Đang tải danh sách báo cáo vi phạm...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">Không có báo cáo vi phạm nào tồn đọng</p>
                    <p className="text-xs text-slate-400">Tất cả báo cáo từ sinh viên STU đã được xử lý xong.</p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{r.reporterName || 'Sinh viên STU'}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {r.reporterStudentCode ? `MSSV: ${r.reporterStudentCode}` : 'Sinh viên'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{r.listingTitle || `Tin đăng #${r.target_id}`}</div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        {r.target_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="font-bold text-rose-600 block text-xs">{r.reason}</span>
                      <p className="text-slate-600 text-xs mt-0.5 line-clamp-2">{r.details}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 text-xs">
                      {r.created_at ? formatDate(r.created_at) : 'Hôm nay'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          r.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-700'
                            : r.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {r.status === 'PENDING'
                          ? 'Chờ xử lý'
                          : r.status === 'RESOLVED'
                          ? 'Đã giải quyết'
                          : 'Bác bỏ'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      {r.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleResolve(r.id, 'CONTENT_REMOVED')}
                            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
                          >
                            Gỡ bài
                          </button>
                          <button
                            onClick={() => handleResolve(r.id, 'DISMISSED')}
                            className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
                          >
                            Bác bỏ
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
