import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  PenSquare,
  ArrowLeft,
  Check,
  Package,
  Layers,
  Save,
  Trash2,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { formatVND } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export function EditListingPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const [myListings, setMyListings] = useState([]);
  const [selectedId, setSelectedId] = useState(id || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    price: '',
    status: 'ACTIVE',
    description: '',
    primaryImageUrl: '',
  });

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/v1/listings/my-listings');
      if (res && res.data && res.data.data && res.data.data.content) {
        const list = res.data.data.content;
        setMyListings(list);
        const target = id ? list.find((item) => String(item.id) === String(id)) : list[0];
        if (target) {
          setSelectedId(target.id);
          populateForm(target);
        }
      }
    } catch (err) {
      console.warn('Could not fetch listings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const populateForm = (item) => {
    setForm({
      title: item.title || '',
      price: item.price || 0,
      status: item.status || 'ACTIVE',
      description: item.description || '',
      primaryImageUrl:
        item.primaryImageUrl ||
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    });
  };

  useEffect(() => {
    fetchListings();
  }, [id]);

  const handleSelectPost = (postId) => {
    setSelectedId(postId);
    const target = myListings.find((item) => String(item.id) === String(postId));
    if (target) populateForm(target);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedId) return;

    if (Number(form.price) > 10000000) {
      const confirmed = window.confirm(
        `⚠️ CẢNH BÁO GIÁ TRỊ CAO:\n\nBạn đang đặt giá bán là ${formatVND(Number(form.price))} (trên 10 triệu đồng).\n\nVui lòng kiểm tra lại để chắc chắn không nhập thừa số 0. Bạn có muốn tiếp tục lưu giá này không?`
      );
      if (!confirmed) return;
    }

    setIsSaving(true);
    try {
      await apiClient.put(`/api/v1/listings/${selectedId}`, {
        title: form.title,
        price: Number(form.price),
        status: form.status,
        description: form.description,
      });
      toast.success('Đã cập nhật thông tin sản phẩm thành công!');
      setTimeout(() => {
        navigate('/my-listings');
      }, 1000);
    } catch (err) {
      toast.error('Lỗi khi cập nhật sản phẩm: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-stu-blue">
            Chỉnh sửa tin
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Chỉnh sửa thông tin sản phẩm</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cập nhật lại giá bán, tiêu đề hoặc đánh dấu đã bán đồ dùng tại STU
          </p>
        </div>

        {myListings.length > 0 && (
          <select
            value={selectedId}
            onChange={(e) => handleSelectPost(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:border-stu-blue focus:outline-none"
          >
            {myListings.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.id} - {p.title.slice(0, 32)}...
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Main Edit Form */}
      <form
        onSubmit={handleSave}
        className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Image preview */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">Hình ảnh sản phẩm</label>
            <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-[4/3] bg-slate-100 relative shadow-inner">
              <img
                src={form.primaryImageUrl}
                alt={form.title}
                className="w-full h-full object-cover"
              />
              <span
                className={`absolute bottom-2.5 left-2.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  form.status === 'SOLD'
                    ? 'bg-slate-800 text-white'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {form.status === 'SOLD' ? 'Đã bán' : 'Còn giao dịch'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              Hình ảnh đã được chụp và lưu trữ trên hệ thống STU
            </p>
          </div>

          {/* Column 2: Inputs */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tiêu đề sản phẩm *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:border-stu-blue"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Giá bán cập nhật (VNĐ) *
                  </label>
                  {Number(form.price) > 10000000 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      &gt; 10 triệu
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-black focus:outline-none ${
                    Number(form.price) > 10000000
                      ? 'border-amber-400 bg-amber-50/40 text-amber-900 focus:border-amber-500'
                      : 'border-slate-200 text-stu-orange focus:border-stu-blue'
                  }`}
                  required
                />
                {Number(form.price) > 10000000 && (
                  <p className="text-[11px] text-amber-700 font-semibold mt-1.5 flex items-center gap-1 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Giá trên 10 triệu ({formatVND(Number(form.price))}). Vui lòng kiểm tra kỹ tránh nhập thừa số 0.</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trạng thái giao dịch
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:border-stu-blue"
                >
                  <option value="ACTIVE">Còn giao dịch (Đang hiển thị trên sàn STU)</option>
                  <option value="SOLD">Đã bán xong</option>
                  <option value="DRAFT">Ẩn bài / Bản nháp</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mô tả chi tiết đồ dùng
              </label>
              <textarea
                rows="4"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-stu-blue"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <Link to="/my-listings">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại danh sách tin</span>
            </button>
          </Link>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-stu-blue hover:bg-stu-darkBlue text-white text-xs sm:text-sm font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu cập nhật sản phẩm'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
