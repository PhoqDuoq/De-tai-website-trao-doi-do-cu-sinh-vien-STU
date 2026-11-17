import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Send,
  Image as ImageIcon,
  ArrowLeft,
  Handshake,
  Search,
  CheckCheck,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { formatVND } from '@/lib/utils';
import { apiClient } from '@/api/client';

export function MessagesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [conversations, setConversations] = useState([
    {
      id: 1,
      partnerName: 'Lê Thảo Vy (DH52201456)',
      initial: 'TV',
      listingTitle: 'Laptop Dell Latitude E5470 (Core i5, RAM 8GB)',
      listingPrice: 3350000,
      listingImage: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=300&q=80',
      lastMessage: 'Bạn có bớt thêm chút xăng xe cho sinh viên STU không? Mình qua cổng 180 Cao Lỗ xem máy luôn.',
      time: '14:20',
      messages: [
        { id: 1, sender: 'them', text: 'Chào bạn, chiếc laptop Dell Latitude này còn dùng tốt không bạn ơi?', time: '14:15' },
        { id: 2, sender: 'me', text: 'Chào Thảo Vy! Máy mình dùng làm bài tập lập trình và đồ án STU, pin còn hơn 3 tiếng, bàn phím gõ êm lắm.', time: '14:18' },
        { id: 3, sender: 'them', text: 'Bạn có bớt thêm chút xăng xe cho sinh viên STU không? Mình qua cổng 180 Cao Lỗ xem máy luôn.', time: '14:20' },
      ],
    },
    {
      id: 2,
      partnerName: 'Trần Hoài Phong (DH52100889)',
      initial: 'HP',
      listingTitle: 'Tai nghe Gaming Havit H2002d',
      listingPrice: 320000,
      listingImage: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=300&q=80',
      lastMessage: 'Còn đầy đủ mic rời với hộp luôn bạn ơi, mai 9h sáng mình có tiết ở khu C STU nè.',
      time: 'Hôm qua',
      messages: [
        { id: 1, sender: 'them', text: 'Còn đầy đủ mic rời với hộp luôn bạn ơi, mai 9h sáng mình có tiết ở khu C STU nè.', time: '09:30' },
        { id: 2, sender: 'me', text: 'Oke Phong, mai tầm 9h30 ra căn tin STU mình test âm thanh luôn nhé!', time: '09:45' },
      ],
    },
    {
      id: 3,
      partnerName: 'Phạm Gia Bảo (DH52003312)',
      initial: 'GB',
      listingTitle: 'Giáo trình Lập trình Web & Ứng dụng STU',
      listingPrice: 35000,
      listingImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80',
      lastMessage: 'Mình lấy trọn bộ sách nhé, chiều nay 4h30 gặp ở thư viện STU nha!',
      time: '10:05',
      messages: [
        { id: 1, sender: 'them', text: 'Mình lấy trọn bộ sách nhé, chiều nay 4h30 gặp ở thư viện STU nha!', time: '10:05' },
      ],
    },
  ]);

  const [activeConvId, setActiveConvId] = useState(1);
  const [inputText, setInputText] = useState('');

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'me',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? {
              ...c,
              messages: [...c.messages, newMsg],
              lastMessage: newMsg.text,
              time: 'Vừa xong',
            }
          : c
      )
    );

    setInputText('');
  };

  const handleCreateMeetupProposal = () => {
    navigate('/transactions');
    toast.success('Đã chuyển đến trang quản lý lịch hẹn gặp giao dịch tại STU!');
  };

  return (
    <div className="h-[calc(100vh-130px)] max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white rounded-t-3xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Về trang chủ
            </Button>
          </Link>
          <span className="text-sm font-bold text-slate-800">
            Tin nhắn & Thương lượng đồ dùng STU
          </span>
        </div>

        <Link to="/transactions">
          <Button variant="secondary" size="sm" leftIcon={<Handshake className="w-4 h-4 text-stu-blue" />}>
            Quản lý giao dịch
          </Button>
        </Link>
      </div>

      {/* 3-Column Workspace */}
      <div className="flex-1 bg-white border-x border-b border-slate-200/90 rounded-b-3xl grid grid-cols-1 md:grid-cols-12 overflow-hidden shadow-xs">
        {/* Column 1: Conversations List (4 cols) */}
        <div className="md:col-span-4 border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
          <div className="p-3 border-b border-slate-200/80 bg-white">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm bạn học, sản phẩm..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-stu-blue"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                className={`w-full p-4 text-left flex items-start gap-3 transition cursor-pointer ${
                  activeConvId === c.id
                    ? 'bg-blue-50/70 border-l-4 border-l-stu-blue'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-stu-blue text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {c.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 truncate">{c.partnerName}</span>
                    <span className="text-[10px] text-slate-400">{c.time}</span>
                  </div>
                  <div className="text-[11px] font-bold text-stu-blue truncate mt-0.5">
                    {c.listingTitle}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">{c.lastMessage}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Column 2: Chat Thread (5 cols) */}
        <div className="md:col-span-5 flex flex-col h-full bg-white border-r border-slate-200">
          {/* Partner header */}
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div>
              <h3 className="font-bold text-xs text-slate-900">{activeConv.partnerName}</h3>
              <p className="text-[11px] text-emerald-600 font-medium">● Đang trực tuyến tại trường STU</p>
            </div>
          </div>

          {/* Messages scroll */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8FAFC]">
            {activeConv.messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'me' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    m.sender === 'me'
                      ? 'bg-stu-blue text-white rounded-br-xs shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-xs'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{m.time}</span>
              </div>
            ))}
          </div>

          {/* Message input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 flex items-center gap-2 bg-white">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập tin nhắn thương lượng..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-stu-blue transition"
            />
            <Button type="submit" variant="accent" size="sm" className="rounded-xl px-4">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>

        {/* Column 3: Item Context & Meetup Action (3 cols) */}
        <div className="hidden md:flex md:col-span-3 p-4 flex-col justify-between bg-slate-50/40">
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Sản phẩm đang trao đổi
            </span>

            <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-3 shadow-2xs">
              <img
                src={activeConv.listingImage}
                alt={activeConv.listingTitle}
                className="w-full h-32 object-cover rounded-xl bg-slate-100"
              />
              <div>
                <h4 className="font-bold text-xs text-slate-900 leading-snug">
                  {activeConv.listingTitle}
                </h4>
                <div className="text-stu-orange font-black text-base mt-1">
                  {formatVND(activeConv.listingPrice)}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs space-y-2">
              <div className="font-bold text-stu-blue flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>Quy định an toàn STU</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Hẹn gặp tại Sảnh A, Căn tin hoặc Thư viện STU để xem đồ trước khi thanh toán.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="accent"
            size="sm"
            onClick={handleCreateMeetupProposal}
            leftIcon={<Handshake className="w-4 h-4" />}
            className="w-full"
          >
            Tạo lịch hẹn gặp STU
          </Button>
        </div>
      </div>
    </div>
  );
}
