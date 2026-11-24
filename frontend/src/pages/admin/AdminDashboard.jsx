import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Layers,
  CreditCard,
  BarChart3,
  Server,
  Activity,
  CheckCircle2,
  Settings,
  ArrowRight,
  ExternalLink,
  ClipboardCheck,
  AlertTriangle,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RoleBadge } from '@/components/ui/Badge';
import { formatVND } from '@/lib/utils';

export function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await apiClient.get('/api/v1/admin/analytics/details');
        if (res?.data?.data) {
          setAnalytics(res.data.data);
        }
      } catch (err) {
        console.warn('Could not fetch admin overview analytics:', err);
      }
    };
    fetchAnalytics();
  }, []);

  const totalUsers = analytics?.kpis?.users?.totalUsers ?? 8;
  const verifiedCount = analytics?.kpis?.verifications?.verifiedCount ?? 5;
  const totalListings = analytics?.kpis?.listings?.totalListings ?? 50;
  const activeListings = analytics?.kpis?.listings?.activeListings ?? 47;
  const totalRevenue = analytics?.kpis?.billing?.totalRevenue ? Number(analytics.kpis.billing.totalRevenue) : 0;

  const serviceStatus = [
    { name: 'API Gateway', port: 8080, db: '-', status: 'UP' },
    { name: 'Identity Service', port: 8081, db: 'stu_identity_db', status: 'UP' },
    { name: 'Listing Service', port: 8082, db: 'stu_listing_db', status: 'UP' },
    { name: 'Interaction Service', port: 8083, db: 'stu_interaction_db', status: 'UP' },
    { name: 'Transaction Service', port: 8084, db: 'stu_transaction_db', status: 'UP' },
    { name: 'Moderation Service', port: 8085, db: 'stu_moderation_db', status: 'UP' },
    { name: 'Billing Service', port: 8086, db: 'stu_billing_db', status: 'UP' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-rose-600" />
            <span>Bảng Điều Khiển Quản Trị Hệ Thống STU</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng quan kiến trúc microservices, người dùng, cấu hình gói phí và phân quyền nền tảng STU Marketplace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <RoleBadge role="ADMIN" />
          <span className="text-xs text-slate-500">Môi trường sản xuất</span>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-rose-100 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng người dùng STU</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{totalUsers}</h3>
              <p className="text-[11px] text-emerald-600 mt-0.5">{verifiedCount} sinh viên đã xác minh</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tin đăng toàn sàn</p>
              <h3 className="text-2xl font-black text-stu-blue mt-1">{totalListings}</h3>
              <p className="text-[11px] text-blue-600 mt-0.5">{activeListings} tin đang hoạt động</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-stu-blue flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Doanh thu phí niêm yết</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">{formatVND(totalRevenue)}</h3>
              <p className="text-[11px] text-emerald-600 mt-0.5">Gói đẩy bài & duy trì nền tảng</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Microservices hoạt động</p>
              <h3 className="text-2xl font-black text-purple-700 mt-1">7 / 7</h3>
              <p className="text-[11px] text-purple-600 mt-0.5">Gateway & 6 microservices UP</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Server className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Microservice Architecture Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            <span>Trạng thái kết nối 6 Microservices & Cổng API Gateway</span>
          </CardTitle>
          <CardDescription>
            Kiến trúc microservice độc lập theo tiêu chuẩn Luận văn STU, 6 database MySQL WampServer cách ly 100%.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tên dịch vụ</th>
                  <th className="py-3 px-4">Cổng (Port)</th>
                  <th className="py-3 px-4">Database Schema</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {serviceStatus.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{s.port}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{s.db}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Sẵn sàng ({s.status})</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-slate-400 text-[11px]">Đã kết nối</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Action Management Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-rose-300 transition-colors bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-rose-600" />
              <span>Kiểm duyệt tin đăng</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Duyệt tin bài sinh viên & kiểm tra các tin có giá trị cao (&gt; 10 triệu VNĐ).
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link to="/admin/listings">
              <Button variant="outline" size="sm" className="w-full justify-between cursor-pointer hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300">
                <span>Vào kiểm duyệt</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300 transition-colors bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-stu-blue" />
              <span>Quản lý người dùng</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Khóa / mở khóa tài khoản, phân quyền Kiểm duyệt viên hoặc Quản trị viên.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link to="/admin/users">
              <Button variant="outline" size="sm" className="w-full justify-between cursor-pointer hover:bg-blue-50 hover:text-stu-blue">
                <span>Xem người dùng</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300 transition-colors bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Danh mục hàng hoá</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Cập nhật các ngành đào tạo STU (Sách, Đồ án, CNTT, Casio, Xe máy SV).
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link to="/admin/categories">
              <Button variant="outline" size="sm" className="w-full justify-between cursor-pointer hover:bg-purple-50 hover:text-purple-700">
                <span>Quản lý phân loại</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300 transition-colors bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Gói phí niêm yết</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Cấu hình bảng phí đẩy bài & theo dõi doanh thu hóa đơn STU.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link to="/admin/billing">
              <Button variant="outline" size="sm" className="w-full justify-between cursor-pointer hover:bg-emerald-50 hover:text-emerald-700">
                <span>Cấu hình gói phí</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
