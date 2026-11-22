import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Tag,
  Package,
  X,
  AlertTriangle
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

export function AdminCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    sortOrder: 1,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/v1/admin/categories');
      if (res && res.data && res.data.data) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch categories:', err);
      toast.error('Lỗi khi tải danh mục: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      sortOrder: (categories.length + 1) * 1,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      sortOrder: cat.sortOrder || 1,
      isActive: Boolean(cat.isActive),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleNameChange = (e) => {
    const nameVal = e.target.value;
    // Auto slug if creating new
    if (!editingCategory) {
      const autoSlug = nameVal
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData((prev) => ({ ...prev, name: nameVal, slug: autoSlug }));
    } else {
      setFormData((prev) => ({ ...prev, name: nameVal }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await apiClient.put(`/api/v1/admin/categories/${editingCategory.id}`, formData);
        toast.success(`Cập nhật danh mục "${formData.name}" thành công!`);
      } else {
        await apiClient.post('/api/v1/admin/categories', formData);
        toast.success(`Thêm danh mục "${formData.name}" thành công!`);
      }
      closeModal();
      await fetchCategories();
    } catch (err) {
      toast.error('Lỗi khi lưu danh mục: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (cat) => {
    const nextStatus = !Boolean(cat.isActive);
    try {
      await apiClient.patch(`/api/v1/admin/categories/${cat.id}/status`, { isActive: nextStatus });
      toast.success(`Đã ${nextStatus ? 'kích hoạt hiển thị' : 'ẩn'} danh mục "${cat.name}"!`);
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isActive: nextStatus ? 1 : 0 } : c))
      );
    } catch (err) {
      toast.error('Lỗi khi đổi trạng thái: ' + err.message);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${cat.name}" không?`)) return;

    try {
      const res = await apiClient.delete(`/api/v1/admin/categories/${cat.id}`);
      toast.success(res?.data?.message || `Đã xóa danh mục "${cat.name}"!`);
      await fetchCategories();
    } catch (err) {
      toast.error('Lỗi khi xóa danh mục: ' + err.message);
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      !searchQuery ||
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.slug.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && Boolean(cat.isActive)) ||
      (statusFilter === 'INACTIVE' && !Boolean(cat.isActive));

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-rose-600" />
            <span>Quản Lý Danh Mục Hàng Hóa STU</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cấu hình phân nhóm hàng hóa, tài liệu học tập, giáo trình các khoa CNTT, Điện tử, Xây dựng, Kinh tế trường STU.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchCategories} disabled={isLoading} className="gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button size="sm" onClick={openCreateModal} className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5">
            <Plus className="w-4 h-4" />
            Thêm danh mục mới
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng danh mục</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{categories.length}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Phân cấp nhóm ngành đào tạo STU</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-stu-blue flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đang hoạt động</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                {categories.filter((c) => Boolean(c.isActive)).length}
              </h3>
              <p className="text-[11px] text-emerald-600 mt-0.5">Hiển thị cho sinh viên STU tra cứu</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tin đăng gán danh mục</p>
              <h3 className="text-2xl font-black text-purple-600 mt-1">
                {categories.reduce((acc, c) => acc + (parseInt(c.listingCount) || 0), 0)}
              </h3>
              <p className="text-[11px] text-purple-600 mt-0.5">Đã phân loại vào hệ thống</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm danh mục, slug URL..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Trạng thái:</span>
            <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 text-xs">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({categories.length})
              </button>
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  statusFilter === 'ACTIVE' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đang hiển thị ({categories.filter((c) => Boolean(c.isActive)).length})
              </button>
              <button
                onClick={() => setStatusFilter('INACTIVE')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  statusFilter === 'INACTIVE' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đã ẩn ({categories.filter((c) => !Boolean(c.isActive)).length})
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card className="bg-white border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Thứ tự</th>
                <th className="px-5 py-3.5">Tên danh mục hàng hóa</th>
                <th className="px-5 py-3.5">Đường dẫn Slug</th>
                <th className="px-5 py-3.5 text-center">Số bài đăng</th>
                <th className="px-5 py-3.5 text-center">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-500 mb-2" />
                    Đang tải danh mục hàng hóa STU...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    Không tìm thấy danh mục nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => {
                  const isActive = Boolean(cat.isActive);
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-500 w-16">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 inline-flex items-center justify-center text-xs">
                          {cat.sortOrder ?? cat.id}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                            <Tag className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">{cat.name}</span>
                            <span className="text-[11px] text-slate-400">Mã ID: #{cat.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <code className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded font-mono">
                          /{cat.slug}
                        </code>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100">
                          <Package className="w-3.5 h-3.5" />
                          {cat.listingCount || 0} tin
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => handleToggleStatus(cat)}
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                          }`}
                          title="Nhấp để đổi trạng thái"
                        >
                          {isActive ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-rose-600" />}
                          {isActive ? 'Đang hiển thị' : 'Đã ẩn'}
                        </button>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(cat)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                            title="Chỉnh sửa danh mục"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cat)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                            title="Xóa danh mục"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-base">
                  {editingCategory ? `Chỉnh sửa danh mục: ${editingCategory.name}` : 'Thêm danh mục hàng hóa mới'}
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
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tên danh mục <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="Ví dụ: Giáo trình CNTT & Phần mềm"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Đường dẫn thân thiện (Slug) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="giao-trinh-cntt"
                  className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Dùng cho đường dẫn URL thân thiện trên trình duyệt</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold text-slate-700">Kích hoạt hiển thị ngay</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={closeModal} disabled={isSubmitting}>
                  Hủy bỏ
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-700 text-white">
                  {isSubmitting ? 'Đang lưu...' : editingCategory ? 'Lưu thay đổi' : 'Thêm danh mục'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
