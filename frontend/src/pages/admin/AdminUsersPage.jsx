import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Shield,
  ShieldAlert,
  GraduationCap,
  Lock,
  Unlock,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  Building
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { RoleBadge, VerificationBadge } from '@/components/ui/Badge';

export function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/v1/admin/users');
      if (res && res.data && res.data.data) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch admin users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    const actionName = newStatus === 'LOCKED' ? 'khóa' : 'mở khóa';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionName} tài khoản người dùng này không?`)) return;

    try {
      await apiClient.patch(`/api/v1/admin/users/${userId}/status`, { status: newStatus });
      toast.success(`Đã ${actionName} tài khoản thành công!`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái: ' + err.message);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await apiClient.patch(`/api/v1/admin/users/${userId}/status`, { role: newRole });
      toast.success(`Đã cập nhật vai trò người dùng thành ${newRole}!`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      toast.error('Lỗi khi đổi quyền: ' + err.message);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.studentId && u.studentId.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-rose-600" />
            <span>Quản Lý Người Dùng & Phân Quyền RBAC</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tra cứu tài khoản sinh viên, kiểm duyệt viên, khóa/mở khóa và điều chỉnh phân quyền hệ thống STU.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchUsers}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Làm mới dữ liệu
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo họ tên, email (@stu.edu.vn) hoặc MSSV..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-rose-500 focus:outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 focus:border-rose-500 focus:outline-none"
        >
          <option value="ALL">Tất cả vai trò</option>
          <option value="STUDENT">Sinh viên STU (STUDENT)</option>
          <option value="MODERATOR">Kiểm duyệt viên (MODERATOR)</option>
          <option value="ADMIN">Quản trị viên (ADMIN)</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                <th className="py-3.5 px-4">Người dùng / MSSV</th>
                <th className="py-3.5 px-4">Email STU</th>
                <th className="py-3.5 px-4">Số điện thoại</th>
                <th className="py-3.5 px-4">Vai trò (Role)</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác phân quyền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    Đang tải danh sách người dùng từ MySQL...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    Không tìm thấy người dùng nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{u.fullName}</div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        MSSV: {u.studentId || 'Cán bộ trường'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{u.email}</td>
                    <td className="py-3.5 px-4 text-slate-600">{u.phone || '0903 456 789'}</td>
                    <td className="py-3.5 px-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Đang hoạt động</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>Bị khóa (LOCKED)</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      {/* Role selection dropdown */}
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.id, e.target.value)}
                        className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold bg-white text-slate-700"
                      >
                        <option value="STUDENT">STUDENT</option>
                        <option value="MODERATOR">MODERATOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>

                      {/* Lock / Unlock button */}
                      <button
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer inline-flex items-center gap-1 ${
                          u.status === 'ACTIVE'
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>Khóa</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3" />
                            <span>Mở khóa</span>
                          </>
                        )}
                      </button>
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
