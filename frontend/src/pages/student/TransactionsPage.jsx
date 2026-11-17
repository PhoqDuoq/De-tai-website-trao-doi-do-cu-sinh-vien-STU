import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Handshake,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  MessageSquare,
  Search,
  Filter,
  ArrowRight,
  FileText,
  Plus,
  ChevronRight,
  Check,
  Building,
  User,
  ShieldCheck,
  Receipt,
  Download,
  Star,
  X
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { formatVND, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export function TransactionsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'history' ? 'history' : 'active');
  const [filterStatus, setFilterStatus] = useState('all');
  const [historySearch, setHistorySearch] = useState('');
  const [historyType, setHistoryType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const [transactions, setTransactions] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);
  const [receiptTx, setReceiptTx] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // Post-transaction review state
  const [reviewTx, setReviewTx] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Form state for creating new transaction
  const [newTxForm, setNewTxForm] = useState({
    listingId: 1,
    title: 'Giáo trình Lập trình Web & Ứng dụng STU',
    agreedPrice: 35000,
    meetingLocation: 'Sảnh A - Tòa nhà Trung tâm STU',
    meetingTime: '15:30 Chiều nay',
  });

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/v1/transactions');
      if (res && res.data && res.data.data) {
        setTransactions(res.data.data);
        if (res.data.data.length > 0 && !selectedTx) {
          setSelectedTx(res.data.data[0]);
        }
      }
    } catch (err) {
      console.warn('Could not load transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleUpdateStatus = async (txId, newStatus) => {
    try {
      await apiClient.patch(`/api/v1/transactions/${txId}/status`, { status: newStatus });
      toast.success(
        newStatus === 'ACCEPTED'
          ? 'Đã xác nhận lịch hẹn gặp tại STU!'
          : newStatus === 'COMPLETED'
          ? 'Đã xác nhận hoàn tất giao dịch và chuyển giao đồ dùng!'
          : 'Đã hủy đề nghị giao dịch'
      );
      // Update local state
      setTransactions((prev) =>
        prev.map((t) => (t.id === txId ? { ...t, status: newStatus } : t))
      );
      if (selectedTx && selectedTx.id === txId) {
        setSelectedTx((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      toast.error('Không thể cập nhật trạng thái: ' + err.message);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewTx) return;
    setIsSubmittingReview(true);
    try {
      await apiClient.post(`/api/v1/transactions/${reviewTx.id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment || 'Giao dịch nhanh chóng, đồ dùng đúng mô tả và đối tác rất thân thiện!',
      });
      toast.success('Đã gửi đánh giá đối tác sinh viên STU thành công!');
      setReviewTx(null);
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      toast.error('Không thể gửi đánh giá: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/v1/transactions', newTxForm);
      toast.success('Đã gửi đề nghị giao dịch hẹn gặp tại khuôn viên STU!');
      setShowNewModal(false);
      fetchTransactions();
    } catch (err) {
      toast.error('Lỗi khi tạo đề nghị: ' + err.message);
    }
  };

  // Filter transactions for Active Tab
  const filteredActiveTxs = transactions.filter((t) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending_confirm') return t.status === 'REQUESTED' || t.status === 'PENDING';
    if (filterStatus === 'confirmed') return t.status === 'ACCEPTED';
    if (filterStatus === 'completed') return t.status === 'COMPLETED';
    if (filterStatus === 'cancelled') return t.status === 'CANCELLED';
    return true;
  });

  // Filter transactions for History Tab
  const filteredHistoryTxs = transactions.filter((t) => {
    const matchesSearch =
      !historySearch ||
      (t.transaction_code && t.transaction_code.toLowerCase().includes(historySearch.toLowerCase())) ||
      (t.listingTitle && t.listingTitle.toLowerCase().includes(historySearch.toLowerCase())) ||
      (t.partnerName && t.partnerName.toLowerCase().includes(historySearch.toLowerCase()));
    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REQUESTED':
      case 'PENDING':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Chờ xác nhận</span>;
      case 'ACCEPTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-stu-blue">Đã hẹn gặp STU</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Hoàn tất</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">Đã hủy</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner Navigation */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-stu-blue">
              Giao dịch sinh viên
            </span>
            <span className="text-xs text-slate-500 font-medium">Khuôn viên 180 Cao Lỗ, Quận 8</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1.5">
            Quản lý Giao dịch & Hẹn gặp STU
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Hẹn gặp trực tiếp tại các địa điểm trường STU (Sảnh A, Thư viện, Căn tin) để kiểm tra đồ dùng an toàn
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-view toggle */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'active'
                  ? 'bg-stu-blue text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Handshake className="w-3.5 h-3.5" />
              <span>Điều phối hẹn gặp</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-stu-blue text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lịch sử & Biên nhận</span>
            </button>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo đề nghị hẹn gặp</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: ACTIVE TRANSACTIONS WORKSPACE (Split view) */}
      {activeTab === 'active' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          {/* Left Panel: Transaction List (5 columns) */}
          <div className="lg:col-span-5 border-r border-slate-200 flex flex-col">
            {/* Filter Pills */}
            <div className="p-3 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto bg-slate-50/50">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'pending_confirm', label: 'Chờ xác nhận' },
                { id: 'confirmed', label: 'Đã hẹn gặp' },
                { id: 'completed', label: 'Hoàn tất' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    filterStatus === tab.id
                      ? 'bg-stu-blue text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* List Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[600px]">
              {isLoading ? (
                <div className="p-8 text-center text-slate-400">Đang tải danh sách giao dịch...</div>
              ) : filteredActiveTxs.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Handshake className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs">Không có giao dịch nào ở mục này</p>
                </div>
              ) : (
                filteredActiveTxs.map((tx) => {
                  const isSelected = selectedTx && selectedTx.id === tx.id;
                  return (
                    <div
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className={`p-4 cursor-pointer transition flex flex-col gap-2.5 ${
                        isSelected
                          ? 'bg-blue-50/70 border-l-4 border-stu-blue'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-slate-700">
                          {tx.transaction_code || `TX-STU-${tx.id}`}
                        </span>
                        {getStatusBadge(tx.status)}
                      </div>

                      <div className="flex gap-3">
                        <img
                          src={
                            tx.listingImage ||
                            'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&auto=format&fit=crop&q=80'
                          }
                          alt={tx.listingTitle}
                          className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-slate-900 truncate">
                            {tx.listingTitle || 'Sản phẩm trao đổi STU'}
                          </h4>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            Đối tác: {tx.partnerName || 'Sinh viên STU'}
                          </p>
                          <p className="text-sm font-extrabold text-stu-orange mt-1">
                            {formatVND(tx.agreed_price || tx.price || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Transaction Detail & Controls (7 columns) */}
          <div className="lg:col-span-7 p-6 bg-slate-50 flex flex-col justify-between overflow-y-auto">
            {selectedTx ? (
              <div className="space-y-6">
                {/* Header card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-mono text-slate-400">
                        Mã giao dịch: {selectedTx.transaction_code || `TX-STU-${selectedTx.id}`}
                      </span>
                      <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                        {selectedTx.listingTitle || 'Sản phẩm trao đổi sinh viên STU'}
                      </h2>
                    </div>
                    {getStatusBadge(selectedTx.status)}
                  </div>

                  {/* Stepper Progress Bar */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mt-4">
                    <div
                      className={`p-2.5 rounded-xl font-bold border ${
                        selectedTx.status === 'REQUESTED' ||
                        selectedTx.status === 'ACCEPTED' ||
                        selectedTx.status === 'COMPLETED'
                          ? 'bg-blue-50 text-stu-blue border-blue-200'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      1. Đề nghị giao dịch
                    </div>
                    <div
                      className={`p-2.5 rounded-xl font-bold border ${
                        selectedTx.status === 'ACCEPTED' || selectedTx.status === 'COMPLETED'
                          ? 'bg-blue-50 text-stu-blue border-blue-200'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      2. Xác nhận hẹn gặp STU
                    </div>
                    <div
                      className={`p-2.5 rounded-xl font-bold border ${
                        selectedTx.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      3. Hoàn tất trao đổi
                    </div>
                  </div>
                </div>

                {/* Info Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-stu-blue" />
                    <span>Chi tiết điểm hẹn gặp & Đối tác</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div>
                      <span className="text-slate-500 block text-xs">Đối tác sinh viên:</span>
                      <strong className="text-slate-800 font-bold">
                        {selectedTx.partnerName || 'Lê Thảo Vy (DH52201456)'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">Thời gian hẹn:</span>
                      <strong className="text-slate-800 font-bold">
                        {selectedTx.meeting_time || '14:30 - Hôm nay'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">Địa điểm hẹn gặp tại STU:</span>
                      <strong className="text-stu-blue font-bold flex items-center gap-1 mt-0.5">
                        <Building className="w-3.5 h-3.5 shrink-0" />
                        {selectedTx.meeting_location || 'Sảnh A - 180 Cao Lỗ'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">Giá tiền thỏa thuận:</span>
                      <strong className="text-stu-orange text-lg font-black">
                        {formatVND(selectedTx.agreed_price || selectedTx.price || 0)}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-800">
                    <p className="font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      Lưu ý an toàn từ Ban Cố vấn STU:
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed">
                      Để tránh gian lận, sinh viên STU vui lòng chỉ hẹn gặp trực tiếp trong khuôn viên trường
                      (180 Cao Lỗ, P.4, Q.8), kiểm tra thiết bị hoạt động bình thường trước khi thanh toán tiền mặt
                      hoặc chuyển khoản.
                    </p>
                  </div>
                </div>

                {/* Workflow Actions */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <Link to="/messages">
                    <button className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                      <MessageSquare className="w-4 h-4 text-stu-blue" />
                      <span>Nhắn tin với đối tác</span>
                    </button>
                  </Link>

                  <div className="flex flex-wrap items-center gap-2">
                    {selectedTx.status !== 'CANCELLED' && selectedTx.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedTx.id, 'CANCELLED')}
                        className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition cursor-pointer"
                      >
                        Hủy đề nghị
                      </button>
                    )}

                    {selectedTx.status === 'REQUESTED' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedTx.id, 'ACCEPTED')}
                        className="px-5 py-2.5 rounded-xl bg-stu-blue hover:bg-stu-darkBlue text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Xác nhận lịch hẹn tại STU</span>
                      </button>
                    )}

                    {selectedTx.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedTx.id, 'COMPLETED')}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Xác nhận đã nhận hàng / Hoàn tất</span>
                      </button>
                    )}

                    {selectedTx.status === 'COMPLETED' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setReviewTx(selectedTx)}
                          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Star className="w-4 h-4 fill-white" />
                          <span>Đánh giá đối tác</span>
                        </button>
                        <button
                          onClick={() => setReceiptTx(selectedTx)}
                          className="px-4 py-2.5 rounded-xl bg-blue-50 text-stu-blue hover:bg-blue-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Receipt className="w-4 h-4" />
                          <span>Xem biên nhận điện tử</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="m-auto text-center text-slate-400 py-12">
                <Handshake className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm">Chọn một giao dịch từ cột bên trái để xem tiến trình</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: TRANSACTION HISTORY LEDGER & RECEIPTS (Full width table) */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-stu-blue">
                Biên lai lưu trữ
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Lịch sử giao dịch đã thực hiện</h2>
              <p className="text-xs text-slate-500">Tra cứu toàn bộ biên nhận mua bán, trao đổi đồ dùng cũ tại STU</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 px-5 py-3 rounded-2xl text-right">
              <div className="text-[11px] font-bold text-emerald-700">Tổng giá trị giao dịch hoàn tất</div>
              <div className="text-2xl font-black text-emerald-700">3.735.000 đ</div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Tra cứu theo mã GD, tên sản phẩm hoặc sinh viên..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-stu-blue"
              />
            </div>
            <select
              value={historyType}
              onChange={(e) => setHistoryType(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50"
            >
              <option value="all">Tất cả loại giao dịch</option>
              <option value="seller">Đơn bán ra</option>
              <option value="buyer">Đơn mua vào</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                    <th className="py-3.5 px-4">Mã GD / Ngày</th>
                    <th className="py-3.5 px-4">Sản phẩm & Điểm hẹn STU</th>
                    <th className="py-3.5 px-4">Đối tác sinh viên</th>
                    <th className="py-3.5 px-4">Số tiền</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4 text-right">Biên nhận</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {filteredHistoryTxs.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-xs text-stu-blue">
                          {t.transaction_code || `TX-STU-${t.id}`}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{t.meeting_time || 'Gần đây'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{t.listingTitle}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{t.meeting_location || '180 Cao Lỗ, Quận 8'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-700">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold mr-1.5 bg-blue-50 text-stu-blue">
                          SV STU
                        </span>
                        {t.partnerName || 'Phạm Gia Bảo'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-extrabold text-stu-orange">
                        {formatVND(t.agreed_price || t.price || 0)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(t.status)}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5 ml-auto">
                          {t.status === 'COMPLETED' && (
                            <button
                              onClick={() => setReviewTx(t)}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-700 transition cursor-pointer flex items-center gap-1"
                              title="Đánh giá đối tác sinh viên"
                            >
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                              <span>Đánh giá</span>
                            </button>
                          )}
                          <button
                            onClick={() => setReceiptTx(t)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-stu-blue text-xs font-bold text-stu-blue hover:bg-blue-50 transition cursor-pointer flex items-center gap-1"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Biên nhận</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: BIÊN NHẬN GIAO DỊCH ĐIỆN TỬ STU */}
      {receiptTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95">
            <button
              onClick={() => setReceiptTx(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* STU Official Header */}
            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <span className="text-[10px] font-black tracking-widest text-stu-blue uppercase">
                TRƯỜNG ĐẠI HỌC CÔNG NGHỆ SÀI GÒN - STU
              </span>
              <h3 className="text-base font-black text-slate-900 mt-1 uppercase">
                BIÊN NHẬN TRAO ĐỔI ĐỒ DÙNG SINH VIÊN
              </h3>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                MÃ GD: {receiptTx.transaction_code || `TX-STU-${receiptTx.id}`}
              </p>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Sản phẩm trao đổi:</span>
                <strong className="text-slate-800 text-right max-w-[200px] truncate">
                  {receiptTx.listingTitle}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Đối tác sinh viên:</span>
                <strong className="text-slate-800">{receiptTx.partnerName || 'Lê Thảo Vy'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Địa điểm hẹn tại STU:</span>
                <strong className="text-stu-blue text-right">{receiptTx.meeting_location || 'Sảnh A'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời gian hẹn:</span>
                <strong className="text-slate-800">{receiptTx.meeting_time || 'Hôm nay'}</strong>
              </div>
              <div className="pt-2 border-t border-dashed border-slate-200 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">Giá trị giao dịch:</span>
                <span className="font-black text-stu-orange text-lg">
                  {formatVND(receiptTx.agreed_price || receiptTx.price || 0)}
                </span>
              </div>
            </div>

            {/* Verification Stamp & QR Code */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1 text-[11px] text-slate-500">
              <div className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Đã xác nhận trao đổi trực tiếp tại 180 Cao Lỗ, STU</span>
              </div>
              <p>Biên nhận điện tử được tạo tự động bởi hệ thống Luận văn STU 2026.</p>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  toast.success('Đã tải xuống biên nhận dạng PDF thành công!');
                  setReceiptTx(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-stu-blue hover:bg-stu-darkBlue text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Lưu biên nhận PDF</span>
              </button>
              <button
                onClick={() => setReceiptTx(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: ĐỀ NGHỊ GIAO DỊCH MỚI */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95">
            <button
              onClick={() => setShowNewModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Đề nghị hẹn gặp giao dịch mới</h3>
            <p className="text-xs text-slate-500 mb-4">
              Chọn đồ dùng và thời gian hẹn gặp bạn sinh viên tại khuôn viên trường STU
            </p>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên món đồ cần mua/bán</label>
                <input
                  type="text"
                  value={newTxForm.title}
                  onChange={(e) => setNewTxForm({ ...newTxForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-stu-blue focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giá thỏa thuận (VNĐ)</label>
                  <input
                    type="number"
                    value={newTxForm.agreedPrice}
                    onChange={(e) => setNewTxForm({ ...newTxForm, agreedPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-stu-orange focus:border-stu-blue focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thời gian hẹn gặp</label>
                  <input
                    type="text"
                    value={newTxForm.meetingTime}
                    onChange={(e) => setNewTxForm({ ...newTxForm, meetingTime: e.target.value })}
                    placeholder="VD: 10h sáng mai"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-stu-blue focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa điểm hẹn gặp tại STU</label>
                <select
                  value={newTxForm.meetingLocation}
                  onChange={(e) => setNewTxForm({ ...newTxForm, meetingLocation: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-stu-blue focus:outline-none font-medium"
                >
                  <option value="Sảnh A - Tòa nhà Trung tâm STU">Sảnh A - Tòa nhà Trung tâm STU</option>
                  <option value="Thư viện tầng 3 - Tòa nhà A STU">Thư viện tầng 3 - Tòa nhà A STU</option>
                  <option value="Căn tin trường STU (Khu B)">Căn tin trường STU (Khu B)</option>
                  <option value="Khu ghế đá sân trường STU">Khu ghế đá sân trường STU</option>
                  <option value="Cổng chính 180 Cao Lỗ, Phường 4, Quận 8">Cổng chính 180 Cao Lỗ, Phường 4, Quận 8</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-stu-blue hover:bg-stu-darkBlue text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  Gửi đề nghị hẹn gặp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: ĐÁNH GIÁ ĐỐI TÁC SINH VIÊN STU */}
      {reviewTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95">
            <button
              onClick={() => setReviewTx(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-3 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center mb-2">
                <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Đánh giá giao dịch & Đối tác STU</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Món đồ: <strong className="text-slate-700">{reviewTx.listingTitle}</strong>
              </p>
              <p className="text-[11px] text-stu-blue font-semibold">
                Đối tác: {reviewTx.partnerName || 'Sinh viên STU'}
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 pt-4">
              {/* Star Rating Picker */}
              <div className="text-center">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Bạn chấm điểm thế nào cho buổi giao dịch này?
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1.5 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          star <= reviewRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200 fill-slate-100 hover:text-amber-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-semibold text-amber-600 mt-1 inline-block">
                  {reviewRating === 5
                    ? 'Tuyệt vời (5/5 sao)'
                    : reviewRating === 4
                    ? 'Rất tốt (4/5 sao)'
                    : reviewRating === 3
                    ? 'Bình thường (3/5 sao)'
                    : reviewRating === 2
                    ? 'Chưa hài lòng (2/5 sao)'
                    : 'Rất tệ (1/5 sao)'}
                </span>
              </div>

              {/* Comment text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nhận xét về đối tác & tình trạng thực tế của đồ dùng:
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Ví dụ: Bạn sinh viên rất đúng giờ tại Sảnh A STU, sách còn mới nguyên, giao dịch uy tín!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-stu-blue focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500">
                ⭐ Đánh giá của bạn sẽ được lưu vào điểm uy tín công khai của sinh viên nhằm xây dựng cộng đồng STU an toàn, minh bạch.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewTx(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Để sau
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Star className="w-4 h-4 fill-white" />
                  <span>{isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
