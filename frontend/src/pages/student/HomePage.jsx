import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Laptop,
  Calculator,
  Compass,
  Home,
  Bike,
  PlusCircle,
  Search,
  ShieldCheck,
  MapPin,
  Sparkles,
  TrendingUp,
  Tag,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge, VerificationBadge } from '@/components/ui/Badge';
import { formatVND } from '@/lib/utils';

export function HomePage() {
  const { user, isAuthenticated } = useAuth();

  const categories = [
    {
      id: 1,
      name: 'Giáo trình & Sách học',
      icon: <BookOpen className="w-6 h-6 text-blue-600" />,
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
      description: 'Giáo trình CNTT, Cơ khí, Điện tử, QTKD',
    },
    {
      id: 2,
      name: 'Laptop & Máy tính',
      icon: <Laptop className="w-6 h-6 text-indigo-600" />,
      color: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200',
      description: 'Laptop học tập, PC văn phòng, linh kiện',
    },
    {
      id: 3,
      name: 'Máy tính Casio & Dụng cụ',
      icon: <Calculator className="w-6 h-6 text-emerald-600" />,
      color: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
      description: 'Casio fx-580VNX, thước vẽ kỹ thuật',
    },
    {
      id: 4,
      name: 'Thiết bị thí nghiệm',
      icon: <Compass className="w-6 h-6 text-amber-600" />,
      color: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
      description: 'Arduino, ESP32, linh kiện vi mạch STU',
    },
    {
      id: 5,
      name: 'Đồ dùng phòng trọ',
      icon: <Home className="w-6 h-6 text-rose-600" />,
      color: 'bg-rose-50 hover:bg-rose-100 border-rose-200',
      description: 'Bàn ghế học tập, quạt, tủ mini',
    },
    {
      id: 6,
      name: 'Xe cộ & Đi lại',
      icon: <Bike className="w-6 h-6 text-cyan-600" />,
      color: 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200',
      description: 'Xe đạp, mũ bảo hiểm, phụ kiện xe máy',
    },
  ];

  // Placeholder listing showcase to illustrate active marketplace UI
  const sampleListings = [
    {
      id: 101,
      title: 'Giáo trình Cấu trúc Dữ liệu & Giải thuật STU',
      category: 'Giáo trình & Sách',
      price: 45000,
      condition: 'Mới 90%',
      seller: 'Nguyễn Văn An (K20)',
      isVerified: true,
      location: 'Sảnh A - STU',
      time: '30 phút trước',
    },
    {
      id: 102,
      title: 'Máy tính Casio fx-580VN X chính hãng còn bảo hành',
      category: 'Dụng cụ học tập',
      price: 380000,
      condition: 'Mới 98%',
      seller: 'Trần Thị Mai (K21)',
      isVerified: true,
      location: 'Căn tin STU',
      time: '2 giờ trước',
    },
    {
      id: 103,
      title: 'Laptop Dell Latitude 5490 i5 8GB 256GB SSD',
      category: 'Laptop & Máy tính',
      price: 4200000,
      condition: 'Đã qua sử dụng',
      seller: 'Lê Hoàng Nam (K19)',
      isVerified: true,
      location: 'Thư viện STU lầu 2',
      time: '4 giờ trước',
    },
    {
      id: 104,
      title: 'Bộ kit Arduino Uno R3 + Cảm biến thực hành vi điều khiển',
      category: 'Thiết bị thí nghiệm',
      price: 150000,
      condition: 'Mới 95%',
      seller: 'Phạm Minh Đức (K21)',
      isVerified: true,
      location: 'Xưởng thực hành STU',
      time: 'Hôm qua',
    },
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-stu-blue via-blue-700 to-indigo-800 text-white py-16 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cổng Trao Đổi Đồ Dùng Cũ - Trường Đại Học Công Nghệ Sài Gòn</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Trao đổi đồ dùng sinh viên tiện lợi, tiết kiệm & an toàn
            </h1>

            <p className="text-base sm:text-lg text-blue-100 max-w-2xl leading-relaxed">
              Giải pháp kết nối mua bán giáo trình, dụng cụ kỹ thuật, laptop và đồ dùng sinh viên ngay tại khuôn viên trường STU (180 Cao Lỗ).
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/listings/create">
                <Button variant="accent" size="lg" leftIcon={<PlusCircle className="w-5 h-5" />}>
                  Đăng tin miễn phí
                </Button>
              </Link>

              {!isAuthenticated ? (
                <Link to="/register">
                  <Button variant="outline" size="lg" className="border-white/40 text-white bg-white/10 hover:bg-white/20">
                    Đăng ký tài khoản STU
                  </Button>
                </Link>
              ) : (
                <Link to="/verify-student">
                  <Button variant="outline" size="lg" className="border-white/40 text-white bg-white/10 hover:bg-white/20">
                    Xác thực thẻ sinh viên
                  </Button>
                </Link>
              )}
            </div>

            {/* Quick stats / Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 max-w-lg">
              <div>
                <p className="text-2xl font-black text-amber-300">100%</p>
                <p className="text-xs text-blue-200">Sinh viên STU</p>
              </div>
              <div>
                <p className="text-2xl font-black text-amber-300">0 VNĐ</p>
                <p className="text-xs text-blue-200">Phí giao dịch P2P</p>
              </div>
              <div>
                <p className="text-2xl font-black text-amber-300">180</p>
                <p className="text-xs text-blue-200">Cao Lỗ, Quận 8</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Categories Grid */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Tag className="w-5 h-5 text-stu-blue" />
                <span>Danh mục đồ dùng phổ biến</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Tìm kiếm đồ dùng phù hợp theo nhu cầu học tập</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex flex-col items-center text-center group ${cat.color}`}
              >
                <div className="p-3 rounded-2xl bg-white shadow-2xs mb-2.5 group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <h3 className="text-xs font-bold text-slate-800 leading-snug">{cat.name}</h3>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{cat.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Listings Feed */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-stu-orange" />
                <span>Tin đăng mới nhất từ sinh viên</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Các món đồ vừa được sinh viên STU đăng bán hôm nay</p>
            </div>

            <Link
              to="/listings"
              className="text-xs font-semibold text-stu-blue hover:text-stu-darkBlue transition-colors"
            >
              Xem tất cả tin →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {sampleListings.map((item) => (
              <Card key={item.id} className="overflow-hidden group hover:border-stu-blue/40">
                {/* Image Placeholder */}
                <div className="h-44 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                  <div className="text-center p-4">
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] text-slate-400 font-medium">{item.category}</span>
                  </div>
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-[10px] font-semibold text-slate-700 shadow-2xs">
                    {item.condition}
                  </span>
                </div>

                <CardContent className="p-4 space-y-2.5">
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-stu-blue transition-colors">
                    {item.title}
                  </h3>

                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-extrabold text-stu-orange">
                      {formatVND(item.price)}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.time}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                      <span className="font-medium truncate">{item.seller}</span>
                      {item.isVerified && <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />}
                    </div>

                    <span className="flex items-center gap-1 text-[10px] text-slate-400 flex-shrink-0">
                      <MapPin className="w-3 h-3 text-stu-blue" />
                      {item.location}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 3 Pillars of Safety Section */}
        <section className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Tiêu chí an toàn</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">Giao dịch an tâm ngay tại khuôn viên trường</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              STU Marketplace được thiết kế nhằm giải quyết vấn đề lừa đảo, ép giá khi sinh viên mua bán trên các nhóm mạng xã hội trôi nổi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-stu-blue flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">100% Sinh viên STU</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Người bán bắt buộc phải xác minh thẻ sinh viên hợp lệ trước khi được duyệt đăng tin.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-stu-orange flex items-center justify-center text-white">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Hẹn gặp tại trường</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Giao dịch trực tiếp tại Sảnh A, Thư viện, Căn tin STU (180 Cao Lỗ) an toàn, tránh bom hàng.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Xác nhận 2 chiều</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Cả hai bên kiểm tra hàng và xác nhận hoàn tất giao dịch trên hệ thống để đảm bảo minh bạch.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
