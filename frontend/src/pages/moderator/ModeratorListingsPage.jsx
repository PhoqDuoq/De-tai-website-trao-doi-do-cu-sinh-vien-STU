import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Building,
  RefreshCw,
  Search,
  Tag
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { useToast } from '@/hooks/useToast';
import { formatVND, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export function ModeratorListingsPage() {
  const { toast } = useToast();
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/v1/moderation/listings');
      if (res && res.data && res.data.data) {
        setListings(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch moderation listings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleUpdateStatus = async (listingId, newStatus) => {
    try {
      await apiClient.patch(`/api/v1/moderation/listings/${listingId}`, { status: newStatus });
      toast.success(
        newStatus === 'ACTIVE'
          ? 'Đã duyệt hiển thị bài đăng trên sàn STU!'
          : newStatus === 'HIDDEN'
          ? 'Đã ẩn bài đăng khỏi sàn!'
          : 'Đã từ chối bài đăng do vi phạm quy chế STU'
      );
      setListings((prev) =>
        prev.map((l) => (l.id === listingId ? { ...l, status: newStatus } : l))
      );
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái tin: ' + err.message);
    }
  };

  const filteredListings = listings.filter((l) => {
    const matchesSearch =
      !searchQuery ||
      (l.title && l.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.sellerName && l.sellerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.sellerStudentCode && l.sellerStudentCode.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'ACTIVE' && (l.status === 'ACTIVE' || l.status === 'PUBLISHED')) ||
      (filterStatus === 'PENDING' && (l.status === 'PENDING' || l.status === 'DRAFT')) ||
      (filterStatus === 'HIDDEN' && l.status === 'HIDDEN');
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck className="w-7 h-7 text-indigo-600" />
            <span>Kiểm Duyệt Tin Đăng Sản Phẩm Sinh Viên STU</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Xét duyệt nội dung bài đăng, ngăn chặn hàng giả, từ ngữ không phù hợp hoặc đồ dùng cấm trao đổi.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchListings}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Làm mới tin đăng
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên bài đăng, sinh viên hoặc MSSV..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 focus:border-indigo-500 focus:outline-none"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hiển thị (ACTIVE)</option>
          <option value="PENDING">Chờ duyệt (PENDING)</option>
          <option value="HIDDEN">Đã ẩn / Vi phạm (HIDDEN)</option>
        </select>
      </div>

      {/* Listings Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                <th className="py-3.5 px-4">Sản phẩm</th>
                <th className="py-3.5 px-4">Người đăng</th>
                <th className="py-3.5 px-4">Giá bán</th>
                <th className="py-3.5 px-4">Điểm hẹn STU</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Quyết định kiểm duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    Đang tải danh sách bài đăng từ MySQL...
                  </td>
                </tr>
              ) : filteredListings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    Không có tin đăng nào cần kiểm duyệt
                  </td>
                </tr>
              ) : (
                filteredListings.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            l.primaryImageUrl ||
                            'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop&q=80'
                          }
                          alt={l.title}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 truncate max-w-xs">{l.title}</h4>
                          <span className="text-[11px] text-slate-500">{l.categoryName || 'Đồ dùng học tập'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{l.sellerName || 'Sinh viên STU'}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {l.sellerStudentCode ? `MSSV: ${l.sellerStudentCode}` : 'Sinh viên'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-black text-stu-orange whitespace-nowrap">
                      {formatVND(l.price)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      <div className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[160px]">{l.location_notes || 'Sảnh A - STU'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          l.status === 'ACTIVE' || l.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : l.status === 'SOLD'
                            ? 'bg-slate-100 text-slate-600'
                            : l.status === 'HIDDEN'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {l.status === 'ACTIVE' || l.status === 'PUBLISHED'
                          ? 'Đã duyệt (ACTIVE)'
                          : l.status === 'SOLD'
                          ? 'Đã bán xong'
                          : l.status === 'HIDDEN'
                          ? 'Đã gỡ / Ẩn bài'
                          : 'Chờ duyệt'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      {l.status !== 'ACTIVE' && (
                        <button
                          onClick={() => handleUpdateStatus(l.id, 'ACTIVE')}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Duyệt</span>
                        </button>
                      )}
                      {l.status !== 'HIDDEN' && (
                        <button
                          onClick={() => handleUpdateStatus(l.id, 'HIDDEN')}
                          className="px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Gỡ bài</span>
                        </button>
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
