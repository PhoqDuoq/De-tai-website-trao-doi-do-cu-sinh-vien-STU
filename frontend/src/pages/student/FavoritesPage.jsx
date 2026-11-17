import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Trash2, MessageSquare, MapPin, Star, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { formatVND } from '@/lib/utils';
import { apiClient } from '@/api/client';

export function FavoritesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback items if none favorited yet
  const sampleFavorites = [
    {
      id: 1,
      title: 'Giáo trình Lập trình Web & Ứng dụng STU',
      price: 35000,
      sellerName: 'Hà Thiên Phúc (SV STU)',
      location: 'Sảnh A - STU',
      rating: 5.0,
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 2,
      title: 'Máy tính khoa học Casio fx-580VN X',
      price: 350000,
      sellerName: 'Dương Hoài Phong',
      location: 'Căn tin STU',
      rating: 4.9,
      imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 3,
      title: 'Kit thực hành Arduino Uno R3 + Cảm biến IoT',
      price: 120000,
      sellerName: 'Lê Thảo Vy',
      location: 'Xưởng thực hành STU',
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1517055729441-db3aab13588f?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/v1/favorites');
      if (res && res.data && res.data.data && res.data.data.length > 0) {
        setFavorites(res.data.data);
      } else {
        setFavorites(sampleFavorites);
      }
    } catch {
      setFavorites(sampleFavorites);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemoveFavorite = (id) => {
    setFavorites((prev) => prev.filter((item) => item.id !== id));
    toast.info('Đã xóa món đồ khỏi danh sách yêu thích');
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition group flex flex-col"
          >
            <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
              <img
                src={item.imageUrl || item.primaryImageUrl}
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
                  <span>{item.location || 'Khuôn viên STU (180 Cao Lỗ, Q.8)'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{item.sellerName}</span>
                <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {item.rating || '4.9'}
                </span>
              </div>

              <Link to="/messages" className="w-full">
                <Button variant="primary" size="sm" className="w-full" leftIcon={<MessageSquare className="w-4 h-4" />}>
                  Nhắn tin hỏi mua
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
