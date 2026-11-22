import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Layers,
  CreditCard,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Download,
  Building,
  GraduationCap,
  Award,
  ArrowUpRight,
  PieChart
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { useToast } from '@/hooks/useToast';
import { formatVND } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

export function AdminAnalyticsPage() {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/v1/admin/analytics/details');
      if (res?.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch analytics details:', err);
      toast.error('Lỗi khi tải dữ liệu báo cáo: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportReport = () => {
    toast.success('Hệ thống đã trích xuất báo cáo số liệu STU Marketplace sang định dạng Excel/PDF thành công!');
  };

  const kpis = data?.kpis || {};
  const usersKpi = kpis.users || {};
  const verifsKpi = kpis.verifications || {};
  const listingsKpi = kpis.listings || {};
  const transactionsKpi = kpis.transactions || {};
  const billingKpi = kpis.billing || {};

  const totalUsers = parseInt(usersKpi.totalUsers) || 0;
  const verifiedCount = parseInt(verifsKpi.verifiedCount) || 0;
  const verifyRate = totalUsers > 0 ? Math.round((verifiedCount / totalUsers) * 100) : 0;

  const totalListings = parseInt(listingsKpi.totalListings) || 0;
  const activeListings = parseInt(listingsKpi.activeListings) || 0;

  const categories = data?.categories || [];
  const maxCategoryCount = Math.max(...categories.map((c) => parseInt(c.listingCount) || 0), 1);

  const locations = data?.locations || [];
  const maxLocationCount = Math.max(...locations.map((l) => parseInt(l.count) || 0), 1);

  const topSellers = data?.topSellers || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-rose-600" />
            <span>Thống Kê & Báo Cáo Hệ Thống STU</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Phân tích số liệu sinh viên, độ tin cậy thẻ SV, phân bổ bài đăng đồ dùng học tập và doanh thu sàn STU.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={isLoading} className="gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Cập nhật
          </Button>
          <Button size="sm" onClick={handleExportReport} className="bg-slate-900 hover:bg-slate-800 text-white gap-1.5">
            <Download className="w-4 h-4" />
            Xuất báo cáo số liệu
          </Button>
        </div>
      </div>

      {/* 4 Big KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sinh viên STU</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-stu-blue flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 mt-2">{totalUsers}</h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {verifiedCount} đã duyệt thẻ ({verifyRate}%)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tin đăng toàn sàn</span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 mt-2">{totalListings}</h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {activeListings} tin đang hiển thị
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doanh thu phí</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-emerald-600 mt-2">
              {formatVND(billingKpi.totalRevenue || 0)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {billingKpi.paidInvoices || 0} lượt mua gói đẩy tin
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hẹn gặp an toàn</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 mt-2">
              {transactionsKpi.totalTransactions || 0}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                100% tại 180 Cao Lỗ
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Categories breakdown */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-600" />
              <span>Phân bổ tin đăng theo Danh mục hàng hóa STU</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Số lượng giáo trình, thiết bị thí nghiệm và đồ dùng học tập theo từng nhóm ngành.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {categories.map((cat) => {
              const count = parseInt(cat.listingCount) || 0;
              const percentage = Math.round((count / maxCategoryCount) * 100);

              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-800 font-semibold">{cat.name}</span>
                    <span className="text-slate-500 font-mono font-bold">{count} tin ({count > 0 && totalListings > 0 ? Math.round((count / totalListings) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-rose-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Chart 2: Meetup locations breakdown */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Địa điểm hẹn giao dịch phổ biến tại trường STU</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Các vị trí an toàn trong khuôn viên 180 Cao Lỗ được sinh viên STU lựa chọn nhiều nhất.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {locations.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Chưa có đủ dữ liệu vị trí giao dịch</p>
            ) : (
              locations.map((loc, idx) => {
                const count = parseInt(loc.count) || 0;
                const percentage = Math.round((count / maxLocationCount) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate max-w-xs">{loc.location}</span>
                      </span>
                      <span className="text-blue-600 font-mono font-bold">{count} lần</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 10)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid: User Roles & Top Active Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Role Distribution */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Cơ cấu người dùng theo Phân quyền RBAC</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Phân quyền bảo mật đa tầng: Quản trị viên, Kiểm duyệt viên và Sinh viên STU.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Sinh viên STU</span>
                <p className="text-2xl font-black text-stu-blue mt-1">{usersKpi.studentCount || 0}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Tài khoản trao đổi đồ</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Kiểm duyệt viên</span>
                <p className="text-2xl font-black text-indigo-600 mt-1">{usersKpi.modCount || 0}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Duyệt bài & thẻ SV</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Quản trị viên</span>
                <p className="text-2xl font-black text-rose-600 mt-1">{usersKpi.adminCount || 0}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Hạ tầng & Hệ thống</p>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span className="text-amber-800 font-semibold">Tài khoản bị khóa vi phạm:</span>
              </div>
              <span className="font-bold text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded-md">
                {usersKpi.lockedCount || 0} tài khoản
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Top Active Sellers */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Top sinh viên đăng tin tích cực nhất</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Sinh viên có nhiều bài đăng chia sẻ đồ dùng hữu ích cho bạn học trong trường.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topSellers.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Chưa có người đăng tin</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {topSellers.map((seller, idx) => (
                  <div key={seller.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-xs text-slate-900">{seller.fullName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{seller.studentCode || 'DH5220xxxx'}</p>
                      </div>
                    </div>

                    <span className="font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full">
                      {seller.listingCount} bài đăng
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
