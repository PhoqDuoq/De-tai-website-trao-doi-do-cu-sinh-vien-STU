import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  RefreshCw,
  Search,
  Tag,
  Building,
  User,
  AlertCircle,
  X,
  DollarSign,
  Calendar,
  Filter
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { useToast } from '@/hooks/useToast';
import { formatVND, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

export function AdminListingsModerationPage() {
  const { toast } = useToast();
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  // Rejection Modal State
  const [rejectingListing, setRejectingListing] = useState(null);
  const [rejectReason, setRejectReason] = useState('Mức giá quá cao / bất thường so với đồ dùng cũ sinh viên STU');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail Modal State
  const [previewListing, setPreviewListing] = useState(null);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/v1/admin/listings');
      if (res && res.data && res.data.data) {
        setListings(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch admin listings:', err);
      toast.error('Lỗi khi tải danh sách tin kiểm duyệt: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleApprove = async (listing) => {
    try {
      await apiClient.patch(`/api/v1/admin/listings/${listing.id}`, { status: 'ACTIVE' });
      toast.success(`Đã phê duyệt tin #${listing.id} "${listing.title}" hiển thị công khai trên sàn STU!`);
      setListings((prev) =>
        prev.map((l) => (l.id === listing.id ? { ...l, status: 'ACTIVE' } : l))
      );
    } catch (err) {
      toast.error('Lỗi khi phê duyệt tin: ' + err.message);
    }
  };

  const handleOpenRejectModal = (listing) => {
    setRejectingListing(listing);
    setRejectReason(
      Number(listing.price) >= 10000000
        ? 'Mức giá quá cao / bất thường so với đồ dùng cũ sinh viên STU (> 10 triệu VNĐ)'
        : 'Mức giá không hợp lý so với đồ dùng cũ sinh viên'
    );
    setCustomReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingListing) return;
    setIsSubmitting(true);
    try {
      const finalReason = rejectReason === 'OTHER' ? customReason.trim() : rejectReason;
      if (!finalReason) {
        toast.warning('Vui lòng chọn hoặc nhập lý do từ chối');
        setIsSubmitting(false);
        return;
      }

      await apiClient.patch(`/api/v1/admin/listings/${rejectingListing.id}`, {
        status: 'REJECTED',
        reason: finalReason,
      });

      toast.success(`Đã từ chối tin #${rejectingListing.id}. Thông báo đã được gửi đến người bán!`);
      setListings((prev) =>
        prev.map((l) => (l.id === rejectingListing.id ? { ...l, status: 'REJECTED' } : l))
      );
      setRejectingListing(null);
    } catch (err) {
      toast.error('Lỗi khi từ chối tin: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // KPIs
  const pendingCount = listings.filter((l) => l.status === 'PENDING_APPROVAL' || l.status === 'DRAFT').length;
  const abnormalPriceCount = listings.filter((l) => Number(l.price) >= 10000000).length;
  const activeCount = listings.filter((l) => l.status === 'ACTIVE' || l.status === 'PUBLISHED').length;
  const rejectedCount = listings.filter((l) => l.status === 'REJECTED' || l.status === 'HIDDEN').length;

  // Filtered Listings
  const filteredListings = listings.filter((l) => {
    const matchesSearch =
      !searchQuery ||
      (l.title && l.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.sellerName && l.sellerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.sellerStudentCode && l.sellerStudentCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      String(l.id) === searchQuery.trim();

    let matchesTab = true;
    if (activeTab === 'PENDING') {
      matchesTab = l.status === 'PENDING_APPROVAL' || l.status === 'DRAFT';
    } else if (activeTab === 'ABNORMAL_PRICE') {
      matchesTab = Number(l.price) >= 10000000;
    } else if (activeTab === 'ACTIVE') {
      matchesTab = l.status === 'ACTIVE' || l.status === 'PUBLISHED';
    } else if (activeTab === 'REJECTED') {
      matchesTab = l.status === 'REJECTED' || l.status === 'HIDDEN';
    }

    return matchesSearch && matchesTab;
  });

  const getStatusBadge = (status, price) => {
    const numPrice = Number(price) || 0;
    if (status === 'ACTIVE' || status === 'PUBLISHED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Đang hiển thị</span>
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" />
          <span>Đã từ chối</span>
        </span>
      );
    }
    if (status === 'HIDDEN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
          <span>Đã ẩn</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
        <AlertCircle className="w-3 h-3 text-amber-600" />
        <span>Chờ kiểm duyệt</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-rose-600" />
            <span>Kiểm Duyệt Tin Đăng Toàn Sàn STU</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Phê duyệt bài đăng của sinh viên trước khi hiển thị công khai. Đặc biệt chú trọng kiểm tra các món đồ có giá trị bất thường (&gt; 10 triệu VNĐ).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchListings}
            disabled={isLoading}
            className="gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-stu-blue' : ''}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          onClick={() => setActiveTab('PENDING')}
          className={`cursor-pointer transition-all border ${
            activeTab === 'PENDING'
              ? 'border-amber-400 bg-amber-50/40 shadow-xs'
              : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Chờ kiểm duyệt</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</h3>
              <p className="text-[11px] text-amber-700 mt-0.5">Cần Admin phê duyệt</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('ABNORMAL_PRICE')}
          className={`cursor-pointer transition-all border ${
            activeTab === 'ABNORMAL_PRICE'
              ? 'border-rose-400 bg-rose-50/40 shadow-xs'
              : 'border-slate-200 hover:border-rose-300'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-600 uppercase flex items-center gap-1 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Giá cao (&gt; 10 triệu)</span>
              </p>
              <h3 className="text-2xl font-black text-rose-700 mt-1">{abnormalPriceCount}</h3>
              <p className="text-[11px] text-rose-600 mt-0.5">Mức giá bất thường</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('ACTIVE')}
          className={`cursor-pointer transition-all border ${
            activeTab === 'ACTIVE'
              ? 'border-emerald-400 bg-emerald-50/40 shadow-xs'
              : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Đang hiển thị</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</h3>
              <p className="text-[11px] text-emerald-600 mt-0.5">Công khai trên sàn</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('REJECTED')}
          className={`cursor-pointer transition-all border ${
            activeTab === 'REJECTED'
              ? 'border-slate-400 bg-slate-100/60 shadow-xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Từ chối / Đã ẩn</p>
              <h3 className="text-2xl font-black text-slate-700 mt-1">{rejectedCount}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Vi phạm quy chế STU</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tab buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'PENDING'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Chờ duyệt</span>
              <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[10px]">
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ABNORMAL_PRICE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ABNORMAL_PRICE'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Giá bất thường (&gt; 10M)</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeTab === 'ABNORMAL_PRICE' ? 'bg-white text-rose-700' : 'bg-rose-100 text-rose-800'}`}>
                {abnormalPriceCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ACTIVE'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Đang hiển thị</span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[10px]">
                {activeCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('REJECTED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'REJECTED'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Đã từ chối</span>
              <span className="px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-800 text-[10px]">
                {rejectedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({listings.length})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên tin, MSSV, tên SV..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                <th className="py-3 px-4">Mã / Hình ảnh</th>
                <th className="py-3 px-4">Tiêu đề sản phẩm</th>
                <th className="py-3 px-4">Giá mong muốn</th>
                <th className="py-3 px-4">Người bán (Sinh viên STU)</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác kiểm duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-600" />
                    <span>Đang tải danh sách bài đăng từ cơ sở dữ liệu...</span>
                  </td>
                </tr>
              ) : filteredListings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Không có bài đăng nào phù hợp</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Thử thay đổi bộ lọc hoặc tìm kiếm bằng từ khóa khác.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredListings.map((listing) => {
                  const isHighPrice = Number(listing.price) >= 10000000;
                  const isPending = listing.status === 'PENDING_APPROVAL' || listing.status === 'DRAFT';

                  return (
                    <tr
                      key={listing.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isHighPrice && isPending ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Image & ID */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img
                            src={listing.primaryImageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'}
                            alt={listing.title}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                          />
                          <div>
                            <span className="font-mono font-bold text-slate-500">#{listing.id}</span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {listing.created_at ? formatDate(listing.created_at) : 'Vừa xong'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Title & Category */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 line-clamp-1 hover:text-stu-blue transition cursor-pointer" onClick={() => setPreviewListing(listing)}>
                          {listing.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                            {listing.categoryName || 'Đồ dùng học tập'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {listing.item_condition === 'BRAND_NEW' ? 'Mới 100%' : 'Đã sử dụng'}
                          </span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className={`font-black text-sm ${isHighPrice ? 'text-rose-700' : 'text-stu-orange'}`}>
                          {formatVND(listing.price)}
                        </div>
                        {isHighPrice && (
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold mt-0.5 border border-rose-300">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>GIÁ BẤT THƯỜNG (&gt;10M)</span>
                          </div>
                        )}
                      </td>

                      {/* Seller */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{listing.sellerName || 'Sinh viên STU'}</div>
                        <div className="text-[11px] font-mono text-slate-500">{listing.sellerStudentCode || 'DH52xxxxxx'}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(listing.status, listing.price)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5 ml-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewListing(listing)}
                            className="p-1.5 h-8 text-slate-600 hover:text-stu-blue hover:bg-blue-50 cursor-pointer"
                            title="Xem chi tiết tin đăng"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {listing.status !== 'ACTIVE' && (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(listing)}
                              className="px-2.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1 cursor-pointer shadow-xs"
                              title="Phê duyệt hiển thị công khai trên sàn STU"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Phê duyệt</span>
                            </Button>
                          )}

                          {listing.status !== 'REJECTED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenRejectModal(listing)}
                              className="px-2.5 h-8 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-xs font-bold gap-1 cursor-pointer"
                              title="Từ chối tin đăng kèm lý do"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Từ chối</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL: TỪ CHỐI BÀI ĐĂNG */}
      {rejectingListing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 space-y-4">
            <button
              onClick={() => setRejectingListing(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Từ chối kiểm duyệt tin đăng</h3>
                <p className="text-xs text-slate-500">Mã tin #{rejectingListing.id}: "{rejectingListing.title}"</p>
              </div>
            </div>

            {Number(rejectingListing.price) >= 10000000 && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                <strong>Lưu ý:</strong> Tin đăng này có mức giá <strong>{formatVND(rejectingListing.price)}</strong> vượt ngưỡng cảnh báo 10 triệu VNĐ của sàn sinh viên STU.
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Chọn lý do từ chối gửi đến sinh viên:
              </label>

              <div className="space-y-1.5 text-xs">
                {[
                  'Mức giá quá cao / bất thường so với đồ dùng cũ sinh viên STU',
                  'Hình ảnh sản phẩm bị mờ, không rõ ràng hoặc không có ảnh thật',
                  'Mô tả không đầy đủ tình trạng hoặc thông số kỹ thuật',
                  'Sản phẩm thuộc danh mục hàng cấm / không phù hợp quy chế trường STU',
                  'OTHER'
                ].map((reasonKey) => (
                  <label
                    key={reasonKey}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      rejectReason === reasonKey
                        ? 'border-rose-400 bg-rose-50/50 text-rose-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rejectReason"
                      value={reasonKey}
                      checked={rejectReason === reasonKey}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="accent-rose-600"
                    />
                    <span>{reasonKey === 'OTHER' ? 'Lý do khác (tự nhập cụ thể)...' : reasonKey}</span>
                  </label>
                ))}
              </div>

              {rejectReason === 'OTHER' && (
                <div className="pt-2">
                  <textarea
                    rows={3}
                    placeholder="Nhập nội dung phản hồi chi tiết để sinh viên chỉnh sửa lại tin đăng..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectingListing(null)}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmReject}
                disabled={isSubmitting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
              >
                {isSubmitting ? 'Đang gửi...' : 'Xác nhận từ chối'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: XEM CHI TIẾT TIN ĐĂNG */}
      {previewListing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full rounded-3xl p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setPreviewListing(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-400">MÃ TIN #{previewListing.id}</span>
              {getStatusBadge(previewListing.status, previewListing.price)}
            </div>

            <h2 className="text-xl font-bold text-slate-900">{previewListing.title}</h2>

            <div className="flex items-baseline gap-3">
              <span className={`text-2xl font-black ${Number(previewListing.price) >= 10000000 ? 'text-rose-600' : 'text-stu-orange'}`}>
                {formatVND(previewListing.price)}
              </span>
              {Number(previewListing.price) >= 10000000 && (
                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-xs font-bold border border-rose-300">
                  ⚠️ Giá bất thường &gt; 10 triệu
                </span>
              )}
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-64 flex items-center justify-center">
              <img
                src={previewListing.primaryImageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600'}
                alt={previewListing.title}
                className="w-full h-64 object-cover"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400">Người đăng:</span>
                <p className="font-bold text-slate-800 mt-0.5">{previewListing.sellerName || 'SV STU'}</p>
                <p className="font-mono text-[11px] text-slate-500">{previewListing.sellerStudentCode || 'DH52xxxxxx'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400">Danh mục:</span>
                <p className="font-bold text-slate-800 mt-0.5">{previewListing.categoryName || 'Đồ dùng học tập'}</p>
                <p className="text-[11px] text-slate-500">Tình trạng: {previewListing.item_condition || 'USED_GOOD'}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Mô tả sản phẩm:</h4>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-line leading-relaxed">
                {previewListing.description || 'Không có mô tả chi tiết.'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewListing(null)}
                className="cursor-pointer"
              >
                Đóng
              </Button>

              <div className="flex items-center gap-2">
                {previewListing.status !== 'REJECTED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const target = previewListing;
                      setPreviewListing(null);
                      handleOpenRejectModal(target);
                    }}
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer text-xs font-bold"
                  >
                    Từ chối
                  </Button>
                )}

                {previewListing.status !== 'ACTIVE' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const target = previewListing;
                      setPreviewListing(null);
                      handleApprove(target);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer text-xs font-bold"
                  >
                    Phê duyệt hiển thị
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
