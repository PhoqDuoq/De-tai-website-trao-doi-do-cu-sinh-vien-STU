import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  Handshake,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Info,
  Calendar,
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';

export function NotificationsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/v1/notifications');
      if (res && res.data && res.data.data) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Could not fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id, linkUrl) => {
    try {
      await apiClient.patch(`/api/v1/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (linkUrl) {
        navigate(linkUrl);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/api/v1/notifications/mark-all-read');
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc!');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      toast.error('Không thể cập nhật thông báo');
    }
  };

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/api/v1/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Đã xóa thông báo');
    } catch (err) {
      toast.error('Không thể xóa thông báo');
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'TRANSACTION') return n.type === 'TRANSACTION';
    if (activeTab === 'MESSAGE') return n.type === 'MESSAGE';
    if (activeTab === 'SYSTEM') return n.type === 'SYSTEM' || n.type === 'VERIFICATION';
    return true;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'TRANSACTION':
        return (
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-stu-blue flex items-center justify-center shrink-0">
            <Handshake className="w-5 h-5" />
          </div>
        );
      case 'VERIFICATION':
        return (
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        );
      case 'MESSAGE':
        return (
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
        );
      case 'SYSTEM':
      default:
        return (
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        );
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'Vừa xong';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 5) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-stu-blue flex items-center gap-1">
              <Bell className="w-3.5 h-3.5" />
              <span>Trung tâm thông báo STU</span>
            </span>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                {unreadCount} chưa đọc
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Thông báo của bạn</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cập nhật diễn biến lịch hẹn gặp, xác thực sinh viên và tương tác trên sàn trao đổi STU
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <CheckCheck className="w-4 h-4 text-stu-blue" />
            <span>Đánh dấu tất cả đã đọc</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: 'ALL', label: 'Tất cả thông báo' },
          { id: 'TRANSACTION', label: 'Giao dịch & Hẹn gặp STU' },
          { id: 'MESSAGE', label: 'Tin nhắn' },
          { id: 'SYSTEM', label: 'Hệ thống & Thẻ SV' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === tab.id
                ? 'bg-stu-blue text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            Đang tải thông báo...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Không có thông báo mới</h3>
            <p className="text-xs text-slate-400">Bạn đã cập nhật đầy đủ mọi thông báo từ sàn STU.</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isUnread = notif.is_read === 0;
            return (
              <div
                key={notif.id}
                onClick={() => handleMarkAsRead(notif.id, notif.link_url)}
                className={`p-4 sm:p-5 rounded-3xl border transition cursor-pointer flex gap-4 items-start relative group ${
                  isUnread
                    ? 'bg-blue-50/50 border-blue-200/80 shadow-xs'
                    : 'bg-white border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Notification Icon */}
                {getNotificationIcon(notif.type)}

                {/* Content */}
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm ${isUnread ? 'font-black text-slate-900' : 'font-bold text-slate-800'}`}>
                      {notif.title}
                    </h3>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-stu-blue shrink-0 animate-pulse"></span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.content}</p>

                  <div className="mt-2.5 flex items-center gap-4 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatRelativeTime(notif.created_at)}</span>
                    </span>

                    {notif.link_url && (
                      <span className="text-stu-blue font-bold flex items-center gap-1 group-hover:underline">
                        <span>Xem chi tiết</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={(e) => handleDeleteNotification(e, notif.id)}
                  title="Xóa thông báo"
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
