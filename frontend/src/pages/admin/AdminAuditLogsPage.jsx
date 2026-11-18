import React, { useState, useEffect } from 'react';
import {
  FileText,
  Shield,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle2,
  Layers,
  CreditCard,
  UserCheck,
  Clock,
  Terminal,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { RoleBadge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

export function AdminAuditLogsPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/v1/admin/logs');
      if (res?.data?.data) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch audit logs:', err);
      toast.error('Lỗi khi tải nhật ký kiểm toán: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action) => {
    switch (action) {
      case 'LOCK_USER':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
            <Lock className="w-3 h-3 text-rose-600" />
            Khóa tài khoản
          </span>
        );
      case 'UNLOCK_USER':
      case 'ACTIVATE_USER':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
            <Unlock className="w-3 h-3 text-emerald-600" />
            Mở khóa tài khoản
          </span>
        );
      case 'VERIFY_STUDENT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-50 text-stu-blue px-2 py-0.5 rounded-full border border-blue-200">
            <UserCheck className="w-3 h-3 text-stu-blue" />
            Duyệt thẻ SV
          </span>
        );
      case 'APPROVE_LISTING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Duyệt bài đăng
          </span>
        );
      case 'ADD_CATEGORY':
      case 'UPDATE_CATEGORY':
      case 'TOGGLE_CATEGORY_STATUS':
      case 'DELETE_CATEGORY':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
            <Layers className="w-3 h-3 text-amber-600" />
            Cấu hình Danh mục
          </span>
        );
      case 'ADD_BILLING_PACKAGE':
      case 'UPDATE_BILLING_PACKAGE':
      case 'UPDATE_PACKAGE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
            <CreditCard className="w-3 h-3 text-purple-600" />
            Gói phí niêm yết
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
            <Activity className="w-3 h-3 text-slate-600" />
            {action}
          </span>
        );
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.actorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress?.includes(searchQuery);

    const matchesAction =
      actionFilter === 'ALL' ||
      (actionFilter === 'USER' && (log.action.includes('USER') || log.action.includes('STUDENT'))) ||
      (actionFilter === 'LISTING' && log.action.includes('LISTING')) ||
      (actionFilter === 'CATEGORY' && log.action.includes('CATEGORY')) ||
      (actionFilter === 'BILLING' && (log.action.includes('BILLING') || log.action.includes('PACKAGE')));

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-rose-600" />
            <span>Nhật Ký Kiểm Toán & Hệ Thống STU</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ghi nhận toàn bộ thao tác quan trọng của Quản trị viên và Kiểm duyệt viên (Khóa tài khoản, phê duyệt thẻ SV, sửa giá gói phí).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading} className="gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới nhật ký
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng sự kiện ghi nhận</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{logs.length} sự kiện</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Không thể xóa hoặc giả mạo</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Thao tác Quản trị viên</p>
              <h3 className="text-2xl font-black text-rose-600 mt-1">
                {logs.filter((l) => l.actorRole === 'ADMIN').length}
              </h3>
              <p className="text-[11px] text-rose-600 mt-0.5">Khóa tài khoản & phân quyền</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Thao tác Kiểm duyệt</p>
              <h3 className="text-2xl font-black text-indigo-600 mt-1">
                {logs.filter((l) => l.actorRole === 'MODERATOR').length}
              </h3>
              <p className="text-[11px] text-indigo-600 mt-0.5">Xác minh thẻ SV & duyệt tin</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo người thực hiện, nội dung, IP..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Loại sự kiện:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            >
              <option value="ALL">Tất cả sự kiện</option>
              <option value="USER">Tài khoản & Xác minh thẻ SV</option>
              <option value="LISTING">Kiểm duyệt tin đăng</option>
              <option value="CATEGORY">Danh mục hàng hóa</option>
              <option value="BILLING">Gói phí niêm yết</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="bg-white border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Thời gian</th>
                <th className="px-5 py-3.5">Người thực hiện</th>
                <th className="px-5 py-3.5">Hành động</th>
                <th className="px-5 py-3.5">Chi tiết sự kiện</th>
                <th className="px-5 py-3.5 text-right">Địa chỉ IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-500 mb-2" />
                    Đang tải nhật ký kiểm toán...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    Không tìm thấy bản ghi kiểm toán nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <RoleBadge role={log.actorRole} />
                        <span className="font-bold text-slate-900 text-xs">{log.actorName}</span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-700 max-w-md">
                      <p className="font-medium">{log.details}</p>
                      {log.targetType && log.targetId && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          Mục tiêu: {log.targetType} #{log.targetId}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono text-xs text-slate-400 whitespace-nowrap">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
