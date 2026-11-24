import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Rocket,
  QrCode,
  CheckCircle,
  CreditCard,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  Zap,
  Info
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { formatVND } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export function PostingFeePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [packages, setPackages] = useState([
    {
      id: 1,
      name: 'Gói Sinh viên Tiêu chuẩn',
      duration: 'Hiển thị 30 ngày',
      price: 0,
      description: 'Đăng tin miễn phí không giới hạn cho sinh viên STU.',
      badge: 'Miễn phí SV',
      popular: false,
    },
    {
      id: 2,
      name: 'Gói Đẩy Tin Nổi Bật 3 Ngày',
      duration: 'Hiển thị 3 ngày',
      price: 10000,
      description: 'Ghim ưu tiên đầu danh mục khi bạn học cùng khoa lọc đồ dùng học tập liên quan.',
      badge: 'Bán nhanh',
      popular: false,
    },
    {
      id: 3,
      name: 'Gói Đẩy Tin Nổi Bật 7 Ngày',
      duration: 'Hiển thị 7 ngày',
      price: 15000,
      description: 'Ghim trang chủ STU Market 7 ngày kèm huy hiệu nổi bật ưu tiên.',
      badge: 'Được chuộng nhất',
      popular: true,
    },
  ]);

  const [selectedPackage, setSelectedPackage] = useState(packages[2]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchBillingPackages = async () => {
      try {
        const res = await apiClient.get('/api/v1/billing/packages');
        if (res?.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped = res.data.data.map((p) => ({
            id: p.id,
            name: p.name,
            duration: `Hiển thị ${p.duration_days} ngày`,
            price: Number(p.price),
            description: p.description,
            badge: Number(p.price) === 0 ? 'Miễn phí SV' : (p.duration_days >= 7 ? 'Được chuộng nhất' : 'Bán nhanh'),
            popular: p.duration_days >= 7,
          }));
          setPackages(mapped);
          setSelectedPackage(mapped[mapped.length - 1]);
        }
      } catch (err) {
        console.warn('Could not load billing packages from API:', err);
      }
    };
    fetchBillingPackages();
  }, []);

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      const res = await apiClient.post('/api/v1/billing/boost', {
        packageId: selectedPackage.id,
        listingId: 1, // Boost demo
      });
      toast.success(
        `Kích hoạt ${selectedPackage.name} thành công! Tin đăng của bạn đã được ưu tiên hiển thị trên sàn STU.`
      );
      setTimeout(() => {
        navigate('/my-listings');
      }, 1200);
    } catch (err) {
      toast.error('Lỗi thanh toán: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-stu-blue">
            Dịch vụ tiếp cận
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">
            Thanh toán phí dịch vụ & Đẩy tin nổi bật
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Nâng cấp tin đăng giúp tiếp cận nhanh hơn tới hơn 15.000 sinh viên tại Đại học Công nghệ Sài Gòn
          </p>
        </div>

        <Link to="/my-listings">
          <button className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer">
            Về quản lý tin của tôi
          </button>
        </Link>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Package Options (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-stu-orange" />
            <span>1. Lựa chọn gói tiếp cận cho tin đăng của bạn</span>
          </h2>

          <div className="space-y-3">
            {packages.map((pkg) => {
              const isSelected = selectedPackage.id === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`p-5 rounded-3xl border-2 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative ${
                    isSelected
                      ? 'border-stu-blue bg-blue-50/40 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-blue-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">{pkg.name}</span>
                      <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-semibold">
                        {pkg.duration}
                      </span>
                      {pkg.popular && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                          Phổ biến
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 max-w-lg">{pkg.description}</p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0">
                    <div
                      className={`font-black text-lg ${
                        pkg.price === 0 ? 'text-emerald-600' : 'text-stu-orange'
                      }`}
                    >
                      {pkg.price === 0 ? 'Miễn phí' : formatVND(pkg.price)}
                    </div>
                    <span
                      className={`text-[11px] font-bold ${
                        isSelected ? 'text-stu-blue' : 'text-slate-400'
                      }`}
                    >
                      {isSelected ? '✓ Đang chọn' : 'Nhấp để chọn'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
            <Info className="w-5 h-5 text-stu-blue shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-slate-800">Quy định niêm yết của trường STU:</span>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Toàn bộ sinh viên STU đều được hỗ trợ đăng tin thường hoàn toàn miễn phí. Các gói phí dịch vụ bổ sung
                (10.000đ - 15.000đ) được dùng để duy trì hạ tầng máy chủ và bảo trì sàn trao đổi đồ dùng sinh viên.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Summary & VietQR (1 col) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-stu-blue" />
              <span>Chi tiết thanh toán</span>
            </h3>

            <div className="space-y-3 text-xs mt-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Sinh viên thực hiện:</span>
                <span className="font-bold text-slate-800">
                  {user?.fullName || 'Hà Thiên Phúc (DH52201642)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gói dịch vụ đã chọn:</span>
                <span className="font-bold text-stu-blue text-right max-w-[160px] truncate">
                  {selectedPackage.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời gian duy trì:</span>
                <span className="font-semibold text-slate-700">{selectedPackage.duration}</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-700 text-sm">Tổng thanh toán:</span>
                <span className="text-2xl font-black text-stu-orange">
                  {selectedPackage.price === 0 ? '0 đ' : formatVND(selectedPackage.price)}
                </span>
              </div>
            </div>

            {/* QR Code Demo Section */}
            {selectedPackage.price > 0 && (
              <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                <div className="text-xs font-bold text-slate-800">
                  Quét mã QR qua App Ngân Hàng
                </div>
                <div className="w-36 h-36 mx-auto bg-white p-2.5 rounded-2xl border border-slate-200 flex items-center justify-center shadow-xs">
                  {/* Real VietQR mock pattern */}
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=STU_MARKET_BOOST_DH52201642_15000"
                    alt="VietQR STU"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  Cú pháp: <span className="font-bold text-stu-blue">STU DH52201642</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleConfirmPayment}
            disabled={isProcessing}
            className="w-full py-3.5 px-4 rounded-xl bg-stu-blue hover:bg-stu-darkBlue text-white font-bold text-xs sm:text-sm transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>
              {isProcessing
                ? 'Đang xử lý...'
                : selectedPackage.price === 0
                ? 'Kích hoạt gói miễn phí'
                : 'Xác nhận đã chuyển khoản & Kích hoạt'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
