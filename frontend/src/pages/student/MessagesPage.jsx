import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Send,
  ArrowLeft,
  Handshake,
  Search,
  MapPin,
  MessageSquare,
  RefreshCw,
  ShoppingBag,
  Store,
  UserCheck,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { formatVND } from '@/lib/utils';
import { apiClient } from '@/api/client';

export function MessagesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetListingId = searchParams.get('listingId');

  const { user } = useAuth();
  const { toast } = useToast();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const messagesEndRef = useRef(null);

  // Auto scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 1. Fetch conversations or initialize targeted listing chat
  const loadConversations = async () => {
    setIsLoadingConvs(true);
    try {
      let initialConvId = null;

      // If user came from a listing page with ?listingId=...
      if (targetListingId) {
        try {
          const createRes = await apiClient.post('/api/v1/conversations', {
            listingId: Number(targetListingId),
          });
          if (createRes?.data?.data) {
            initialConvId = createRes.data.data.id;
          }
        } catch (createErr) {
          console.warn('Could not auto-create conversation for listing:', createErr);
        }
      }

      const res = await apiClient.get('/api/v1/conversations');
      const convList = res?.data?.data || [];
      setConversations(convList);

      if (convList.length > 0) {
        if (initialConvId && convList.some((c) => c.id === initialConvId)) {
          setActiveConvId(initialConvId);
        } else if (!activeConvId || !convList.some((c) => c.id === activeConvId)) {
          setActiveConvId(convList[0].id);
        }
      } else {
        setActiveConvId(null);
        setMessages([]);
      }
    } catch (err) {
      console.warn('Load conversations error:', err);
      toast.error('Lỗi tải danh sách hội thoại: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLoadingConvs(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [targetListingId]);

  // 2. Fetch messages for active conversation
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setIsLoadingMsgs(true);
      try {
        const res = await apiClient.get(`/api/v1/conversations/${activeConvId}/messages`);
        setMessages(res?.data?.data || []);
      } catch (err) {
        console.warn('Load messages error:', err);
      } finally {
        setIsLoadingMsgs(false);
      }
    };

    loadMessages();
  }, [activeConvId]);

  const activeConv = conversations.find((c) => c.id === activeConvId) || null;

  // 3. Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId || isSending) return;

    const messageText = inputText.trim();
    setIsSending(true);
    try {
      const res = await apiClient.post(`/api/v1/conversations/${activeConvId}/messages`, {
        content: messageText,
      });

      if (res?.data?.data) {
        const newMsg = res.data.data;
        setMessages((prev) => [...prev, newMsg]);

        // Update last message in conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId
              ? {
                  ...c,
                  lastMessage: messageText,
                  time: 'Vừa xong',
                }
              : c
          )
        );
      }
      setInputText('');
    } catch (err) {
      toast.error('Không thể gửi tin nhắn: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateMeetupProposal = () => {
    if (activeConv?.listingId) {
      navigate(`/transactions?listingId=${activeConv.listingId}`);
    } else {
      navigate('/transactions');
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.partnerName?.toLowerCase().includes(term) ||
      c.listingTitle?.toLowerCase().includes(term) ||
      c.lastMessage?.toLowerCase().includes(term)
    );
  });

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
          <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-stu-blue" />
            <span>Tin nhắn trao đổi & Thương lượng đồ dùng STU</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadConversations}
            disabled={isLoadingConvs}
            className="text-slate-600 hover:text-slate-900"
            title="Làm mới tin nhắn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingConvs ? 'animate-spin' : ''}`} />
          </Button>

          <Link to="/transactions">
            <Button variant="secondary" size="sm" leftIcon={<Handshake className="w-4 h-4 text-stu-blue" />}>
              Lịch hẹn tại STU
            </Button>
          </Link>
        </div>
      </div>

      {/* 3-Column Workspace */}
      <div className="flex-1 bg-white border-x border-b border-slate-200/90 rounded-b-3xl grid grid-cols-1 md:grid-cols-12 overflow-hidden shadow-xs">
        {/* Column 1: Conversations List (4 cols) */}
        <div className="md:col-span-4 border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
          <div className="p-3 border-b border-slate-200/80 bg-white">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm bạn học, món đồ STU..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-stu-blue"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white">
            {isLoadingConvs ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-stu-blue" />
                <span>Đang tải danh sách tin nhắn...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-600">Bạn chưa có cuộc trò chuyện nào</p>
                <p className="text-[11px] text-slate-400">
                  Khi bạn nhắn tin cho người bán hoặc có sinh viên nhắn hỏi mua đồ của bạn, hội thoại sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = activeConvId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveConvId(c.id)}
                    className={`w-full p-4 text-left flex items-start gap-3 transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 border-l-4 border-l-stu-blue'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-stu-blue text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {c.initial || 'SV'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {c.partnerName}
                        </span>
                        <span className="text-[10px] text-slate-400">{c.time}</span>
                      </div>
                      <div className="text-[11px] font-bold text-stu-blue truncate mt-0.5">
                        {c.listingTitle}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {c.lastMessage || 'Chưa có tin nhắn nào...'}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Chat Thread (5 cols) */}
        <div className="md:col-span-5 flex flex-col h-full bg-white border-r border-slate-200">
          {activeConv ? (
            <>
              {/* Partner header & Role Identification */}
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-stu-blue text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                    {activeConv.initial || 'SV'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-xs text-slate-900">
                        {activeConv.rawPartnerName || activeConv.partnerName}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
                          activeConv.isBuyer
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-stu-blue border-blue-200'
                        }`}
                      >
                        {activeConv.isBuyer ? 'Người bán' : 'Người mua'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Vai trò của bạn: <strong className="text-slate-700">{activeConv.isBuyer ? 'Người mua' : 'Người bán'}</strong>
                    </p>
                  </div>
                </div>

                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Trực tuyến tại STU
                </span>
              </div>

              {/* Messages scroll */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8FAFC]">
                {isLoadingMsgs ? (
                  <div className="p-8 text-center text-slate-400 text-xs">Đang tải cuộc trò chuyện...</div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400">
                    <MessageSquare className="w-10 h-10 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">
                      Bắt đầu cuộc trò chuyện với {activeConv.rawPartnerName || activeConv.partnerName}
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                      Hãy gửi tin nhắn đầu tiên để chào bạn học, hỏi thăm tình trạng đồ dùng và thống nhất giá cả!
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMyMessage = m.sender === 'me' || m.senderId === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] font-semibold text-slate-400 mb-0.5 px-1">
                          {isMyMessage
                            ? `Bạn (${activeConv.isBuyer ? 'Người mua' : 'Người bán'})`
                            : `${activeConv.rawPartnerName || activeConv.partnerName}`}
                        </span>

                        <div
                          className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isMyMessage
                              ? 'bg-stu-blue text-white rounded-br-xs shadow-xs'
                              : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs shadow-xs'
                          }`}
                        >
                          {m.text}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 px-1 font-mono">{m.time}</span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 flex items-center gap-2 bg-white">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Gửi tin nhắn cho ${activeConv.rawPartnerName || 'đối tác'}...`}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-stu-blue transition"
                />
                <Button
                  type="submit"
                  variant="accent"
                  size="sm"
                  disabled={!inputText.trim() || isSending}
                  className="rounded-xl px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-400">
              <MessageSquare className="w-12 h-12 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Chọn một hội thoại để nhắn tin</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Hoặc truy cập trang chi tiết sản phẩm và chọn <strong>"Nhắn tin thương lượng với người bán"</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Column 3: Item Context & Meetup Action (3 cols) */}
        <div className="hidden md:flex md:col-span-3 p-4 flex-col justify-between bg-slate-50/40">
          {activeConv ? (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-stu-blue" />
                <span>Sản phẩm đang trao đổi</span>
              </span>

              <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-3 shadow-2xs">
                <img
                  src={
                    activeConv.listingImage ||
                    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80'
                  }
                  alt={activeConv.listingTitle}
                  className="w-full h-32 object-cover rounded-xl bg-slate-100"
                />
                <div>
                  <h4 className="font-bold text-xs text-slate-900 leading-snug">
                    {activeConv.listingTitle}
                  </h4>
                  <div className="text-stu-orange font-black text-base mt-1">
                    {formatVND(activeConv.listingPrice || 0)}
                  </div>
                </div>
              </div>

              {/* Role Context Helper Card */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200 text-xs space-y-1.5">
                <p className="font-bold text-slate-700 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-stu-blue" />
                  <span>Xác định vai trò giao dịch:</span>
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {activeConv.isBuyer
                    ? 'Bạn là Người mua đang tìm hiểu sản phẩm. Sau khi thương lượng giá hợp lý, hãy bấm nút tạo lịch hẹn gặp bên dưới.'
                    : 'Bạn là Người bán sản phẩm này. Hãy giải đáp thắc mắc và sẵn sàng hẹn gặp bạn học tại khuôn viên trường.'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs space-y-2">
                <div className="font-bold text-stu-blue flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>Quy định an toàn STU</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Chỉ giao dịch trực tiếp ban ngày tại Sảnh A, Căn tin hoặc Thư viện STU (180 Cao Lỗ) để xem đồ trước khi thanh toán.
                </p>
              </div>
            </div>
          ) : (
            <div className="m-auto text-center text-slate-400 text-xs">
              <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <span>Chưa có thông tin sản phẩm</span>
            </div>
          )}

          {activeConv && (
            <Button
              type="button"
              variant="accent"
              size="sm"
              onClick={handleCreateMeetupProposal}
              leftIcon={<Handshake className="w-4 h-4" />}
              className="w-full mt-4"
            >
              Tạo lịch hẹn gặp STU
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
