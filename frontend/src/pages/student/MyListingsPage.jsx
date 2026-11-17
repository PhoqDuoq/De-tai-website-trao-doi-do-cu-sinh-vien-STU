import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  PenSquare,
  CheckCircle2,
  Rocket,
  Trash2,
  Clock,
  Eye,
  Tag,
  AlertCircle,
  Package,
  Layers,
} from 'lucide-react';
import { listingApi } from '@/api/listingApi';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { formatVND, formatDate } from '@/lib/utils';
import { apiClient } from '@/api/client';

export function MyListingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [listings, setListings] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyListings = async () => {
    setIsLoading(true);
    try {
      const res = await listingApi.getMyListings();
      if (res && res.data && res.data.content) {
        setListings(res.data.content);
      }
    } catch (err) {
      console.warn('Could not load user listings:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, []);

  const handleMarkAsSold = async (id) => {
    try {
      await listingApi.updateStatus(id, { status: 'SOLD' });
      toast.success('Đã cập nhật trạng thái bài đăng thành "Đã bán"');
      fetchMyListings();
    } catch (err) {
      toast.error('Không thể cập nhật trạng thái tin');
    }
  };

  const handleDeleteListing = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin đăng này khỏi hệ thống không?')) return;
    try {
      await apiClient.delete(`/api/v1/listings/${id}`);
      toast.success('Đã xóa tin đăng thành công');
      fetchMyListings();
    } catch (err) {
      toast.error('Không thể xóa tin đăng');
    }
  };

  // Filter listings
  const filteredListings = listings.filter((item) => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return item.status === 'ACTIVE' || item.status === 'PUBLISHED';
    if (filter === 'PENDING') return item.status === 'PENDING' || item.status === 'DRAFT';
    if (filter === 'SOLD') return item.status === 'SOLD';
    return true;
  });

  const counts = {
    all: listings.length,
    active: listings.filter((l) => l.status === 'ACTIVE' || l.status === 'PUBLISHED').length,
    pending: listings.filter((l) => l.status === 'PENDING' || l.status === 'DRAFT').length,
    sold: listings.filter((l) => l.status === 'SOLD').length,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-stu-blue">
            Quản lý tin đăng
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Tin đăng của tôi</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Theo dõi tình trạng tin đăng, đánh dấu đã bán và đẩy tin nổi bật trên sàn STU
          </p>
        </div>
        <Link to="/listings/create">
          <Button variant="accent" size="md" leftIcon={<Plus className="w-4 h-4" />}>
            Đăng tin mới
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-xs flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
            filter === 'ALL'
              ? 'bg-stu-blue text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Tất cả</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] ${filter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {counts.all}
          </span>
        </button>

        <button
          onClick={() => setFilter('ACTIVE')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
            filter === 'ACTIVE'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Đang hiển thị</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] ${filter === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {counts.active}
          </span>
        </button>

        <button
          onClick={() => setFilter('PENDING')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
            filter === 'PENDING'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Bản nháp / Chờ duyệt</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] ${filter === 'PENDING' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {counts.pending}
          </span>
        </button>

        <button
          onClick={() => setFilter('SOLD')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
            filter === 'SOLD'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Đã bán</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] ${filter === 'SOLD' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {counts.sold}
          </span>
        </button>
      </div>

      {/* Listings List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            <Layers className="w-8 h-8 animate-pulse mx-auto mb-2 text-stu-blue" />
            <p className="text-sm">Đang tải danh sách bài đăng từ máy chủ...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">Chưa có bài đăng nào trong mục này</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Hãy chia sẻ giáo trình hoặc thiết bị học tập cũ của bạn cho bạn bè cùng trường STU ngay hôm nay.
            </p>
            <Link to="/listings/create">
              <Button variant="accent" size="sm">Đăng tin ngay</Button>
            </Link>
          </div>
        ) : (
          filteredListings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:border-stu-blue/40 transition group"
            >
              <div className="flex flex-col sm:flex-row gap-5">
                <img
                  src={
                    item.primaryImageUrl ||
                    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'
                  }
                  alt={item.title}
                  className="w-full sm:w-40 h-36 object-cover rounded-2xl bg-slate-100 shrink-0"
                />

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                          item.status === 'SOLD'
                            ? 'bg-slate-100 text-slate-600'
                            : item.status === 'ACTIVE' || item.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {item.status === 'SOLD'
                          ? 'Đã hoàn tất giao dịch'
                          : item.status === 'ACTIVE' || item.status === 'PUBLISHED'
                          ? 'Đang hiển thị trên sàn STU'
                          : 'Bản nháp / Chờ duyệt'}
                      </span>
                      <span className="text-xs text-slate-400">
                        Mã tin: #{item.id} • {item.created_at ? formatDate(item.created_at) : 'Hôm nay'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-lg mt-2 truncate group-hover:text-stu-blue transition-colors">
                      {item.title}
                    </h3>
                    <div className="text-stu-orange font-black text-lg mt-0.5">
                      {formatVND(item.price)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.description}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <Link to={`/edit-post/${item.id}`}>
                      <button className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                        <PenSquare className="w-3.5 h-3.5 text-stu-blue" />
                        <span>Chỉnh sửa</span>
                      </button>
                    </Link>

                    {item.status !== 'SOLD' && (
                      <button
                        onClick={() => handleMarkAsSold(item.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đánh dấu đã bán</span>
                      </button>
                    )}

                    <Link to="/posting-fee">
                      <button className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-stu-blue text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                        <Rocket className="w-3.5 h-3.5" />
                        <span>Đẩy tin nổi bật</span>
                      </button>
                    </Link>

                    <button
                      onClick={() => handleDeleteListing(item.id)}
                      className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1.5 ml-auto cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa tin</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
