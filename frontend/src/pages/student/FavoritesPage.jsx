import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Trash2, MessageSquare, MapPin, Star, ShoppingBag, ArrowLeft, Layers } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { formatVND } from '@/lib/utils';
import { apiClient } from '@/api/client';

export function FavoritesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/v1/favorites');
      if (res && res.data && Array.isArray(res.data.data)) {
        setFavorites(res.data.data);
      } else {
        setFavorites([]);
      }
    } catch (err) {
      console.warn('Could not load favorites:', err);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (listingId) => {
    try {
      await apiClient.delete(`/api/v1/favorites/${listingId}`);
      setFavorites((prev) => prev.filter((item) => item.id !== listingId));
      toast.info('Đã xóa món đồ khỏi danh sách yêu thích');
    } catch (err) {
      toast.error('Không thể xóa món đồ yêu thích');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-50 text-rose-600">
            Sản phẩm đã lưu
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">
            Danh sách yêu thích ({favorites.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Các món đồ dùng sinh viên STU bạn đang quan tâm và theo dõi giá
          </p>
        </div>
        <Link to="/">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Tiếp tục khám phá
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 shadow-xs">
          <Layers className="w-8 h-8 animate-pulse mx-auto mb-2 text-stu-blue" />
          <p className="text-sm">Đang tải danh sách đồ dùng đã lưu từ máy chủ...</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
            <Heart className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">Chưa có món đồ nào trong danh sách yêu thích</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Khi lướt xem đồ dùng học tập ngoài trang chủ, bạn có thể bấm vào biểu tượng trái tim để lưu lại theo dõi giá và liên hệ người bán khi cần.
            </p>
          </div>
          <Link to="/">
            <Button variant="primary" size="md" leftIcon={<ShoppingBag className="w-4 h-4" />}>
              Khám phá đồ dùng STU ngay
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition group flex flex-col"
            >
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src={
                    item.primaryImageUrl ||
                    item.imageUrl ||
                    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'
                  }
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <button
                  onClick={() => handleRemoveFavorite(item.id)}
                  title="Bỏ lưu"
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white shadow-md text-rose-500 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer"
                >
                  <Heart className="w-5 h-5 fill-rose-500" />
                </button>
                <span className="absolute bottom-2.5 left-2.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-0.5 rounded-full">
                  Còn giao dịch
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-stu-blue transition-colors">
                    {item.title}
                  </h3>
                  <div className="text-stu-orange font-black text-xl mt-1">
                    {formatVND(item.price)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stu-blue" />
                    <span>{item.location_notes || item.location || 'Khuôn viên STU (180 Cao Lỗ, Q.8)'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{item.sellerName || 'Sinh viên STU'}</span>
                  <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {item.rating || '4.9'}
                  </span>
                </div>

                <Link to={`/listings/${item.id}`} className="w-full">
                  <Button variant="primary" size="sm" className="w-full" leftIcon={<MessageSquare className="w-4 h-4" />}>
                    Xem chi tiết & Hỏi mua
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
