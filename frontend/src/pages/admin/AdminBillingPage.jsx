import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  RefreshCw,
  X,
  Sparkles,
  Zap,
  Calendar,
  User,
  ExternalLink
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { useToast } from '@/hooks/useToast';
import { formatVND, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

export function AdminBillingPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('PACKAGES'); // 'PACKAGES' | 'INVOICES'
  const [packages, setPackages] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters for Invoices
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL');

  // Modal State for Package
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [pkgFormData, setPkgFormData] = useState({
    packageCode: '',
    name: '',
    description: '',
    price: 0,
    durationDays: 7,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pkgRes, invRes] = await Promise.all([
        apiClient.get('/api/v1/admin/billing/packages'),
        apiClient.get('/api/v1/admin/billing/invoices'),
      ]);

      if (pkgRes?.data?.data) setPackages(pkgRes.data.data);
      if (invRes?.data?.data) setInvoices(invRes.data.data);
    } catch (err) {
      console.warn('Could not fetch billing data:', err);
      toast.error('Lỗi khi tải dữ liệu gói phí & hóa đơn: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Summary calculations
  const totalRevenue = invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

  const totalPaidInvoices = invoices.filter((inv) => inv.status === 'PAID').length;

  // Open Edit Modal
  const openEditModal = (pkg) => {
    setEditingPackage(pkg);
    setPkgFormData({
      packageCode: pkg.packageCode,
      name: pkg.name,
      description: pkg.description || '',
      price: parseFloat(pkg.price) || 0,
      durationDays: pkg.durationDays || 7,
      isActive: Boolean(pkg.isActive),
    });
    setIsModalOpen(true);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingPackage(null);
    setPkgFormData({
      packageCode: 'BOOST_CUSTOM',
      name: '',
      description: '',
      price: 20000,
      durationDays: 14,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPackage(null);
  };

  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    if (!pkgFormData.name.trim() || !pkgFormData.packageCode.trim()) {
      toast.error('Vui lòng nhập đầy đủ mã và tên gói phí');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPackage) {
        await apiClient.put(`/api/v1/admin/billing/packages/${editingPackage.id}`, pkgFormData);
        toast.success(`Cập nhật gói "${pkgFormData.name}" thành công!`);
      } else {
        await apiClient.post('/api/v1/admin/billing/packages', pkgFormData);
        toast.success(`Thêm gói phí mới "${pkgFormData.name}" thành công!`);
      }
      closeModal();
      await fetchData();
    } catch (err) {
      toast.error('Lỗi khi lưu gói phí: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      !invoiceSearch ||
      inv.invoiceCode.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      (inv.userName && inv.userName.toLowerCase().includes(invoiceSearch.toLowerCase())) ||
      (inv.studentCode && inv.studentCode.toLowerCase().includes(invoiceSearch.toLowerCase())) ||
      (inv.listingTitle && inv.listingTitle.toLowerCase().includes(invoiceSearch.toLowerCase()));

    const matchesStatus =
      invoiceStatusFilter === 'ALL' || inv.status === invoiceStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-rose-600" />
            <span>Gói Phí Đăng Tin & Niêm Yết Sàn STU</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản trị cấu hình bảng giá các gói đẩy tin nổi bật, duy trì nền tảng và kiểm soát lịch sử hóa đơn thanh toán của sinh viên.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading} className="gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button size="sm" onClick={openCreateModal} className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5">
            <Plus className="w-4 h-4" />
            Tạo gói phí mới
          </Button>
        </div>
      </div>

      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng doanh thu phí</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{formatVND(totalRevenue)}</h3>
              <p className="text-[11px] text-emerald-600 mt-0.5">Thu từ gói đẩy tin & hỗ trợ sàn</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hóa đơn thanh toán</p>
              <h3 className="text-2xl font-black text-blue-600 mt-1">{totalPaidInvoices} / {invoices.length}</h3>
              <p className="text-[11px] text-blue-600 mt-0.5">Giao dịch mua gói thành công</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gói cước niêm yết</p>
              <h3 className="text-2xl font-black text-purple-600 mt-1">{packages.length} gói</h3>
              <p className="text-[11px] text-purple-600 mt-0.5">
                {packages.filter((p) => Boolean(p.isActive)).length} gói đang mở cho SV
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('PACKAGES')}
            className={`py-3 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'PACKAGES'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Zap className="w-4 h-4" />
            Cấu hình Gói phí niêm yết ({packages.length})
          </button>

          <button
            onClick={() => setActiveTab('INVOICES')}
            className={`py-3 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'INVOICES'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            Lịch sử Hóa đơn & Giao dịch ({invoices.length})
          </button>
        </nav>
      </div>

      {/* TAB 1: PACKAGES LIST */}
      {activeTab === 'PACKAGES' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const isStandard = parseFloat(pkg.price) === 0;
            const isActive = Boolean(pkg.isActive);

            return (
              <Card
                key={pkg.id}
                className={`bg-white border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                  !isActive
                    ? 'border-slate-200 opacity-70'
                    : isStandard
                    ? 'border-slate-300 shadow-xs'
                    : 'border-rose-300 shadow-md ring-1 ring-rose-200'
                }`}
              >
                {!isStandard && (
                  <div className="absolute top-0 right-0 bg-rose-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-lg tracking-wider flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-3 h-3" />
                    ĐẨY TIN VIP
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {pkg.packageCode}
                    </span>
                    <Badge variant={isActive ? 'success' : 'danger'}>
                      {isActive ? 'Đang mở bán' : 'Tạm dừng'}
                    </Badge>
                  </div>

                  <CardTitle className="text-lg font-bold text-slate-900 mt-2">{pkg.name}</CardTitle>
                  <CardDescription className="text-xs text-slate-500 min-h-[36px]">
                    {pkg.description || 'Gói hỗ trợ sinh viên trao đổi đồ dùng trên sàn STU.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black text-slate-900">
                        {isStandard ? '0 VNĐ' : formatVND(pkg.price)}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">/ {pkg.durationDays} ngày</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-400">Thời hạn bài</p>
                      <p className="text-xs font-bold text-slate-700">{pkg.durationDays} ngày</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div>
                      <p className="text-[11px] text-slate-400">Số lượt đã mua:</p>
                      <p className="font-bold text-slate-800">{pkg.totalPurchases || 0} lượt</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400">Doanh thu thu về:</p>
                      <p className="font-bold text-emerald-600">{formatVND(pkg.totalRevenue || 0)}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(pkg)}
                      className="w-full gap-1.5 text-xs text-slate-700 hover:text-rose-600 hover:border-rose-300"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Cấu hình gói phí
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB 2: INVOICES HISTORY */}
      {activeTab === 'INVOICES' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card className="bg-white border-slate-200">
            <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  placeholder="Tìm theo mã HĐ, tên SV, MSSV, tên tin..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Trạng thái:</span>
                <select
                  value={invoiceStatusFilter}
                  onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                  className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PAID">Đã thanh toán (PAID)</option>
                  <option value="PENDING">Chờ thanh toán (PENDING)</option>
                  <option value="FAILED">Thất bại (FAILED)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="bg-white border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Mã Hóa Đơn</th>
                    <th className="px-5 py-3.5">Sinh viên thanh toán</th>
                    <th className="px-5 py-3.5">Tin đăng áp dụng</th>
                    <th className="px-5 py-3.5">Gói cước</th>
                    <th className="px-5 py-3.5">Số tiền</th>
                    <th className="px-5 py-3.5 text-center">Trạng thái</th>
                    <th className="px-5 py-3.5 text-right">Ngày thanh toán</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-500 mb-2" />
                        Đang tải danh sách hóa đơn...
                      </td>
                    </tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                        <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        Không tìm thấy hóa đơn nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-bold font-mono text-slate-800 text-xs">
                          {inv.invoiceCode}
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">
                              {inv.userName ? inv.userName.charAt(0) : 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{inv.userName || 'Sinh viên STU'}</p>
                              <p className="text-[11px] text-slate-400">{inv.studentCode || 'DH5220xxxx'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 max-w-xs truncate">
                          <p className="text-xs font-medium text-slate-800 truncate" title={inv.listingTitle}>
                            {inv.listingTitle || `Tin đăng #${inv.listingId}`}
                          </p>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                            {inv.packageName || inv.packageCode}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 font-bold text-emerald-600">
                          {formatVND(inv.amount)}
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          {inv.status === 'PAID' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Đã thanh toán
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Chờ thanh toán
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right text-xs text-slate-500 font-mono">
                          {formatDate(inv.paidAt || inv.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Package Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-base">
                  {editingPackage ? `Cấu hình gói: ${editingPackage.name}` : 'Tạo gói phí niêm yết mới'}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handlePackageSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mã định danh gói (Code) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingPackage)}
                  value={pkgFormData.packageCode}
                  onChange={(e) => setPkgFormData({ ...pkgFormData, packageCode: e.target.value.toUpperCase() })}
                  placeholder="Ví dụ: BOOST_14_DAYS"
                  className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tên gói hiển thị <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={pkgFormData.name}
                  onChange={(e) => setPkgFormData({ ...pkgFormData, name: e.target.value })}
                  placeholder="Ví dụ: Gói Đẩy Tin Nổi Bật 14 Ngày"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mô tả đặc quyền của gói
                </label>
                <textarea
                  rows={2}
                  value={pkgFormData.description}
                  onChange={(e) => setPkgFormData({ ...pkgFormData, description: e.target.value })}
                  placeholder="Ghim vị trí đầu trang chủ và đầu danh mục tìm kiếm..."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Giá niêm yết (VNĐ) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={pkgFormData.price}
                    onChange={(e) => setPkgFormData({ ...pkgFormData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Thời hạn hiệu lực (Ngày) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={pkgFormData.durationDays}
                    onChange={(e) => setPkgFormData({ ...pkgFormData, durationDays: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pkgFormData.isActive}
                    onChange={(e) => setPkgFormData({ ...pkgFormData, isActive: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Kích hoạt mở bán gói này cho sinh viên STU</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={closeModal} disabled={isSubmitting}>
                  Hủy bỏ
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-700 text-white">
                  {isSubmitting ? 'Đang lưu...' : editingPackage ? 'Lưu thay đổi' : 'Tạo gói phí'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
