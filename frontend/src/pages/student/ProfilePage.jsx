import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  GraduationCap,
  ShieldCheck,
  Star,
  ShoppingBag,
  TrendingUp,
  Award,
  Phone,
  Mail,
  Building,
  Calendar,
  Camera,
  Save,
  Eye,
  MessageSquare,
  CheckCircle,
  Clock,
  Sparkles,
  Layers
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { formatVND } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'public_seller'
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form state
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    studentCode: user?.studentCode || '',
    email: user?.email || '',
    faculty: 'Công nghệ Thông tin',
    studentClass: 'D22_TH01',
    phone: user?.phone || '',
    bio: 'Sinh viên Trường Đại học Công nghệ Sài Gòn (STU). Sàn thương mại điện tử trao đổi đồ dùng học tập nội bộ.',
  });

  const [myListings, setMyListings] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    // Fetch profile and listings
    const fetchUserData = async () => {
      try {
        const res = await apiClient.get('/api/v1/users/me');
        if (res && res.data && res.data.data) {
          const u = res.data.data;
          setFormData((prev) => ({
            ...prev,
            fullName: u.fullName || prev.fullName,
            phone: u.phone || prev.phone,
            studentCode: u.studentCode || prev.studentCode,
            email: u.email || prev.email,
          }));

          // Fetch reviews for this user
          try {
            const resReviews = await apiClient.get(`/api/v1/users/${u.id}/reviews`);
            if (resReviews?.data?.data && Array.isArray(resReviews.data.data)) {
              setReviews(resReviews.data.data);
            }
          } catch (rErr) {
            console.warn('Could not load reviews:', rErr);
          }
        }
      } catch (err) {
        console.warn('Could not load profile from API:', err);
      }

      try {
        const resListings = await apiClient.get('/api/v1/listings/my-listings');
        if (resListings && resListings.data && resListings.data.data && resListings.data.data.content) {
          setMyListings(resListings.data.data.content);
        }
      } catch (err) {
        console.warn('Could not load listings:', err);
      }
    };

    fetchUserData();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiClient.put('/api/v1/users/me', {
        fullName: formData.fullName,
        phone: formData.phone,
        faculty: formData.faculty,
      });
      toast.success('Đã lưu và cập nhật hồ sơ sinh viên STU thành công!');
    } catch (err) {
      toast.error('Lỗi khi lưu hồ sơ: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-stu-blue">
              Hồ sơ sinh viên
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sinh viên STU đã xác thực</span>
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Hồ sơ cá nhân & Thông tin sinh viên</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Quản lý định danh sinh viên Trường Đại học Công nghệ Sài Gòn (180 Cao Lỗ)
          </p>
        </div>

        {/* Tab switch button */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'personal'
                ? 'bg-stu-blue text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Hồ sơ của tôi</span>
          </button>
          <button
            onClick={() => setActiveTab('public_seller')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'public_seller'
                ? 'bg-stu-blue text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Trang người bán công khai</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PERSONAL PROFILE VIEW */}
      {activeTab === 'personal' && (
        <div className="space-y-6">
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Tin đã đăng</div>
              <div className="text-2xl font-black text-stu-blue mt-1">
                {myListings.length > 0 ? myListings.length : 5}
              </div>
              <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Đang hiển thị trên sàn</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Giao dịch thành công</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">14</div>
              <div className="text-[11px] text-slate-500 mt-1">Tại khuôn viên STU</div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Điểm uy tín STU</div>
              <div className="text-2xl font-black text-amber-500 mt-1 flex items-center gap-1">
                <span>4.9</span>
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Từ 28 đánh giá sinh viên</div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Tiết kiệm / Thu nhập</div>
              <div className="text-2xl font-black text-stu-orange mt-1">2.450.000 đ</div>
              <div className="text-[11px] text-emerald-600 font-bold mt-1">Tái sử dụng đồ cũ</div>
            </div>
          </div>

          {/* Form and Avatar layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Card: Student ID card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-stu-blue to-sky-400 text-white font-black text-3xl flex items-center justify-center shadow-lg">
                  {formData.fullName.slice(0, 2).toUpperCase()}
                </div>
                <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white text-white flex items-center justify-center text-xs shadow-xs">
                  <CheckCircle className="w-4 h-4" />
                </span>
              </div>

              <h2 className="font-bold text-lg text-slate-900 mt-4">{formData.fullName}</h2>
              <p className="text-xs font-mono font-bold text-stu-blue bg-blue-50 px-3 py-1 rounded-full mt-1">
                MSSV: {formData.studentCode}
              </p>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {formData.faculty} • Lớp {formData.studentClass}
              </p>

              <div className="w-full border-t border-slate-100 my-4 pt-4 text-left space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Trạng thái thẻ SV:</span>
                  <span className="font-bold text-emerald-600">Đang theo học (Chính quy)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tỷ lệ phản hồi tin:</span>
                  <span className="font-bold text-slate-800">98% (thường dưới 10 phút)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tham gia sàn STU:</span>
                  <span className="font-bold text-slate-800">Khóa tuyển sinh 2022</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Địa chỉ trường:</span>
                  <span className="font-bold text-stu-blue">180 Cao Lỗ, P.4, Q.8</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toast.success('Đã chọn cập nhật ảnh đại diện sinh viên')}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                <span>Thay đổi ảnh đại diện</span>
              </button>
            </div>

            {/* Right Card: Edit Form */}
            <div className="lg:col-span-2">
              <form
                onSubmit={handleSaveProfile}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4"
              >
                <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-stu-blue" />
                  <span>Cập nhật thông tin tài khoản sinh viên</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Họ và tên sinh viên *
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:border-stu-blue"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã số sinh viên (MSSV)
                    </label>
                    <input
                      type="text"
                      value={formData.studentCode}
                      disabled
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs sm:text-sm font-mono cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Khoa đào tạo tại STU
                    </label>
                    <select
                      value={formData.faculty}
                      onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-stu-blue"
                    >
                      <option value="Công nghệ Thông tin">Công nghệ Thông tin</option>
                      <option value="Quản trị Kinh doanh">Quản trị Kinh doanh</option>
                      <option value="Điện - Điện tử">Điện - Điện tử</option>
                      <option value="Công nghệ Thực phẩm">Công nghệ Thực phẩm</option>
                      <option value="Kỹ thuật Công trình">Kỹ thuật Công trình</option>
                      <option value="Design (Thiết kế)">Design (Thiết kế)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lớp sinh hoạt
                    </label>
                    <input
                      type="text"
                      value={formData.studentClass}
                      onChange={(e) => setFormData({ ...formData, studentClass: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-stu-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email sinh viên STU (@student.stu.edu.vn)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs sm:text-sm cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số điện thoại Zalo / Gọi
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-stu-blue"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giới thiệu ngắn về bạn
                  </label>
                  <textarea
                    rows="3"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-normal focus:outline-none focus:border-stu-blue"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl bg-stu-blue hover:bg-stu-darkBlue text-white font-bold text-xs sm:text-sm transition shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi hồ sơ'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PUBLIC SELLER PROFILE VIEW */}
      {activeTab === 'public_seller' && (
        <div className="space-y-6">
          {/* Header Cover Banner */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="h-32 bg-gradient-to-r from-stu-blue via-blue-600 to-sky-500 relative">
              <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-xs text-stu-blue text-xs font-mono font-bold px-3 py-1 rounded-xl">
                Trang người bán công khai
              </span>
            </div>

            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-md shrink-0">
                    <div className="w-full h-full rounded-xl bg-stu-blue text-white font-extrabold text-2xl flex items-center justify-center">
                      {formData.fullName.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">{formData.fullName}</h2>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Sinh viên STU xác thực</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {formData.faculty} • Trường ĐH Công Nghệ Sài Gòn (180 Cao Lỗ, Q.8)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link to="/messages">
                    <button className="px-4 py-2.5 rounded-xl bg-stu-blue hover:bg-stu-darkBlue text-white text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer">
                      <MessageSquare className="w-4 h-4" />
                      <span>Nhắn tin với người bán</span>
                    </button>
                  </Link>
                </div>
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100 text-center sm:text-left">
                <div>
                  <div className="text-xs text-slate-500">Đánh giá uy tín</div>
                  <div className="text-base font-bold text-amber-500 mt-0.5 flex items-center justify-center sm:justify-start gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>4.9 / 5.0</span>
                    <span className="text-xs font-normal text-slate-400">(28 lượt)</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Tỷ lệ phản hồi chat</div>
                  <div className="text-base font-bold text-slate-800 mt-0.5">98%</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Sản phẩm đang rao</div>
                  <div className="text-base font-bold text-stu-blue mt-0.5">
                    {myListings.length > 0 ? myListings.length : 2} tin đăng
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Tham gia sàn STU</div>
                  <div className="text-base font-bold text-slate-800 mt-0.5">Kỳ 1 - 2022</div>
                </div>
              </div>
            </div>
          </div>

          {/* Active items from this student */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-stu-blue" />
              <span>Đồ dùng đang đăng bán ({myListings.length})</span>
            </h3>

            {myListings.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-8 text-center space-y-3 shadow-xs">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">Chưa có bài đăng bán nào</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Bạn có thể đăng sách, giáo trình hoặc thiết bị học tập cũ để thanh lý cho các bạn sinh viên cùng trường STU.
                </p>
                <Link to="/listings/create">
                  <Button variant="accent" size="sm">Đăng tin thanh lý ngay</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {myListings.map((item) => (
                  <Link key={item.id} to={`/listings/${item.id}`} className="group block">
                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition group flex flex-col h-full">
                      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                        <img
                          src={
                            item.primaryImageUrl ||
                            'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'
                          }
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <span className="absolute bottom-2.5 left-2.5 bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                          {item.status === 'ACTIVE' ? 'Đang hiển thị' : item.status === 'PENDING_APPROVAL' ? 'Chờ duyệt' : item.status === 'TRADING' ? 'Đang hẹn gặp' : 'Đã bán'}
                        </span>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-stu-blue transition-colors">{item.title}</h4>
                          <div className="text-stu-orange font-black text-base mt-1">
                            {formatVND(item.price)}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.location_notes || 'Khuôn viên trường STU'}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">{formData.fullName || 'Sinh viên STU'}</span>
                          <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> 5.0
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Student Reviews */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>Đánh giá từ bạn học đã nhận đồ tại STU ({reviews.length} đánh giá)</span>
            </h3>

            {reviews.length === 0 ? (
              <div className="p-6 text-center text-slate-500 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="text-xs font-medium text-slate-600">Chưa có đánh giá nào từ bạn học</p>
                <p className="text-[11px] text-slate-400">
                  Sau khi hoàn tất trao đổi đồ dùng học tập tại trường STU, phản hồi của người mua sẽ được hiển thị công khai tại đây.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {rev.reviewerName || 'Sinh viên STU'} • {rev.reviewerStudentCode || 'STU'}
                      </span>
                      <span className="text-xs font-bold text-amber-500 flex items-center gap-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400" /> {Number(rev.rating || 5).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
