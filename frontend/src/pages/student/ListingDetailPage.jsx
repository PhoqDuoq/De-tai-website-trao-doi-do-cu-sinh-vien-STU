import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Star,
  MessageSquare,
  Handshake,
  Heart,
  Flag,
  Clock,
  Building,
  CheckCircle2,
  Tag,
  Share2,
  AlertTriangle,
  X
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { formatVND, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeImage, setActiveImage] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);

  const [reportForm, setReportForm] = useState({
    reason: 'SPAM',
    details: '',
  });

  useEffect(() => {
    const fetchListing = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get(`/api/v1/listings/${id}`);
        if (res && res.data && res.data.data) {
          const data = res.data.data;
          setListing(data);
          if (data.images && data.images.length > 0) {
            setActiveImage(data.images[0].imageUrl);
          } else {
            setActiveImage(
              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80'
            );
          }
        }
      } catch (err) {
        console.warn('Could not load listing detail:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const handleToggleFavorite = async () => {
    try {
      if (isFavorited) {
        await apiClient.delete(`/api/v1/favorites/${id}`);
        setIsFavorited(false);
        toast.info('Đã xóa khỏi danh sách yêu thích');
      } else {
        await apiClient.post(`/api/v1/favorites/${id}`);
        setIsFavorited(true);
        toast.success('Đã lưu vào danh sách yêu thích!');
      }
    } catch (err) {
      toast.error('Không thể cập nhật danh sách yêu thích');
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/v1/reports', {
        targetType: 'LISTING',
        targetId: id,
        reason: reportForm.reason,
        details: reportForm.details,
      });
      toast.success('Báo cáo vi phạm đã được gửi đến Ban Kiểm Duyệt STU. Cảm ơn bạn!');
      setShowReportModal(false);
    } catch (err) {
      toast.error('Lỗi khi gửi báo cáo: ' + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-400">
        Đang tải thông tin chi tiết sản phẩm...
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy bài đăng</h2>
        <p className="text-xs text-slate-500">Món đồ này có thể đã được bán hoặc gỡ khỏi hệ thống.</p>
        <Link to="/">
          <Button variant="primary" size="sm">Về trang chủ</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-stu-blue transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        <span className="text-xs font-mono text-slate-400">
          Mã tin: #{listing.id} • STU MARKETPLACE
        </span>
      </div>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden aspect-[4/3] bg-slate-100 relative shadow-xs">
            <img
              src={activeImage}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-xs text-xs font-bold text-slate-800 px-3 py-1 rounded-full shadow-2xs">
              {listing.item_condition === 'BRAND_NEW'
                ? 'Mới 100%'
                : listing.item_condition === 'LIKE_NEW'
                ? 'Mới 99%'
                : 'Đã sử dụng - Còn tốt'}
            </span>
          </div>

          {/* Thumbnails if available */}
          {listing.images && listing.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {listing.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.imageUrl)}
                  className={`w-18 h-18 rounded-2xl overflow-hidden border-2 transition shrink-0 ${
                    activeImage === img.imageUrl ? 'border-stu-blue shadow-xs' : 'border-slate-200'
                  }`}
                >
                  <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Safety card */}
          <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-slate-900">Cam kết an toàn giao dịch tại STU:</span>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Toàn bộ người bán và người mua đều được xác thực thẻ sinh viên Trường Đại học Công nghệ Sài Gòn.
                Chỉ hẹn gặp trao đổi trực tiếp trong khuôn viên trường (180 Cao Lỗ) để kiểm tra đồ dùng thực tế.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing, Seller & Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-stu-blue">
                {listing.categoryName || 'Đồ dùng học tập'}
              </span>
              <span className="text-xs text-slate-400">
                {listing.created_at ? formatDate(listing.created_at) : 'Hôm nay'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
              {listing.title}
            </h1>

            <div className="text-3xl font-black text-stu-orange">
              {formatVND(listing.price)}
            </div>

            {/* Meetup location */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-stu-blue shrink-0">
                <Building className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px]">Điểm hẹn gặp tại STU:</span>
                <strong className="text-slate-800 font-bold">
                  {listing.location_notes || 'Sảnh A - 180 Cao Lỗ, Quận 8'}
                </strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <Link to="/messages" className="block w-full">
                <button className="w-full py-3 px-4 rounded-xl bg-stu-blue hover:bg-stu-darkBlue text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs cursor-pointer">
                  <MessageSquare className="w-4 h-4" />
                  <span>Nhắn tin thương lượng với người bán</span>
                </button>
              </Link>

              <Link to="/transactions" className="block w-full">
                <button className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs cursor-pointer">
                  <Handshake className="w-4 h-4" />
                  <span>Đề nghị hẹn gặp tại STU</span>
                </button>
              </Link>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleToggleFavorite}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isFavorited
                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-rose-500' : ''}`} />
                  <span>{isFavorited ? 'Đã lưu' : 'Lưu tin'}</span>
                </button>

                <button
                  onClick={() => setShowReportModal(true)}
                  className="py-2 px-3 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Báo cáo tin</span>
                </button>
              </div>
            </div>
          </div>

          {/* Seller Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Thông tin người bán
            </span>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-stu-blue text-white font-black text-lg flex items-center justify-center shrink-0">
                {(listing.sellerName || 'SV').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-slate-900 text-sm truncate">
                    {listing.sellerName || 'Hà Thiên Phúc (SV STU)'}
                  </h3>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </div>
                <p className="text-xs text-slate-500">Khoa Công nghệ Thông tin - STU</p>
                <div className="flex items-center gap-2 mt-1 text-[11px]">
                  <span className="text-amber-500 font-bold flex items-center gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400" /> 4.9
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">Phản hồi chat 98%</span>
                </div>
              </div>
            </div>

            <Link to="/seller-profile">
              <button className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer">
                Xem trang cá nhân người bán
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Tag className="w-5 h-5 text-stu-blue" />
          <span>Mô tả chi tiết đồ dùng</span>
        </h2>
        <div className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
          {listing.description || 'Chưa có mô tả chi tiết từ người bán.'}
        </div>
      </div>

      {/* REPORT VIOLATION MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95">
            <button
              onClick={() => setShowReportModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-rose-600 mb-1">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-bold">Báo cáo vi phạm tin đăng</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Báo cáo sẽ được chuyển thẳng đến Ban Cố vấn và Phòng Công tác Sinh viên STU để xử lý.
            </p>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lý do vi phạm *
                </label>
                <select
                  value={reportForm.reason}
                  onChange={(e) => setReportForm({ ...reportForm, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 focus:border-rose-500 focus:outline-none"
                >
                  <option value="SPAM">Đã bán nhưng vẫn để bài / Tin spam lặp lại</option>
                  <option value="FRAUD_SCAM">Nghi vấn gian lận, lừa đảo chuyển cọc</option>
                  <option value="PROHIBITED_GOODS">Hàng giả, hàng cấm theo quy chế trường STU</option>
                  <option value="OFFENSIVE_CONTENT">Hình ảnh hoặc ngôn từ phản cảm, thô tục</option>
                  <option value="OTHER">Lý do khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả chi tiết bằng chứng vi phạm *
                </label>
                <textarea
                  rows="3"
                  value={reportForm.details}
                  onChange={(e) => setReportForm({ ...reportForm, details: e.target.value })}
                  placeholder="Ghi rõ thông tin để kiểm duyệt viên đối soát..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Gửi báo cáo vi phạm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
