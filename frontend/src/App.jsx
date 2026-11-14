import React, { useState } from 'react';
import { ShoppingBag, ShieldCheck, RefreshCw, MessageSquare, Tag, CreditCard, Layers, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');

  const services = [
    { name: 'API Gateway', port: 8080, route: '/api/v1/**', role: 'Routing, CORS, Reactive Netty' },
    { name: 'Identity Service', port: 8081, route: '/api/v1/auth/**', db: 'stu_identity_db', role: 'Authentication & Student Verification' },
    { name: 'Listing Service', port: 8082, route: '/api/v1/listings/**', db: 'stu_listing_db', role: 'Product Catalog & Categories' },
    { name: 'Interaction Service', port: 8083, route: '/api/v1/interactions/**', db: 'stu_interaction_db', role: 'Chat, Comments & Favorites' },
    { name: 'Transaction Service', port: 8084, route: '/api/v1/transactions/**', db: 'stu_transaction_db', role: 'Campus Meetups & Orders' },
    { name: 'Moderation Service', port: 8085, route: '/api/v1/moderation/**', db: 'stu_moderation_db', role: 'Scam Reports & Word Filter' },
    { name: 'Billing Service', port: 8086, route: '/api/v1/billing/**', db: 'stu_billing_db', role: 'Listing Fees Only (No Student Payments)' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow">
              STU
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Sàn Trao Đổi Đồ Dùng Cũ STU</h1>
              <p className="text-xs text-slate-500">Saigon Technology University • Graduation Thesis Foundation</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 mr-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Phase 1: Foundation Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-2xl text-white p-8 mb-8 shadow-lg">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-4">
              <Layers className="w-4 h-4" />
              <span>Microservices Monorepo Architecture</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-3">
              Nền tảng Trao đổi Đồ dùng Cũ Sinh viên STU
            </h2>
            <p className="text-blue-100 text-base leading-relaxed mb-6">
              Hệ thống xây dựng theo mô hình Microservices với Java 21, Spring Boot 3.3.5, Spring Cloud Gateway,
              và giao diện React 18 + Tailwind CSS. 6 cơ sở dữ liệu MySQL 8+ cách ly nghiêm ngặt trên WampServer.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur text-xs font-semibold">Java 21 LTS</span>
              <span className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur text-xs font-semibold">Spring Boot 3.3.5</span>
              <span className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur text-xs font-semibold">Spring Cloud Gateway</span>
              <span className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur text-xs font-semibold">React 18 + Vite 5</span>
              <span className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur text-xs font-semibold">Tailwind CSS 3</span>
              <span className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur text-xs font-semibold">MySQL 8+ (WampServer)</span>
            </div>
          </div>
        </div>

        {/* Microservices Matrix */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Danh Mục Dịch Vụ Microservices (Port Directory)</h3>
              <p className="text-sm text-slate-500">Các dịch vụ độc lập kết nối qua Spring Cloud Gateway tại port 8080</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((svc) => (
              <div key={svc.name} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{svc.name}</h4>
                    <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      Port {svc.port}
                    </span>
                  </div>
                  <span className="inline-flex items-center text-xs text-emerald-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500" />
                    Configured
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-3">{svc.role}</p>
                <div className="text-xs space-y-1 border-t border-slate-100 pt-3">
                  <div className="flex justify-between text-slate-500">
                    <span>Route:</span>
                    <span className="font-mono text-slate-700">{svc.route}</span>
                  </div>
                  {svc.db && (
                    <div className="flex justify-between text-slate-500">
                      <span>Database:</span>
                      <span className="font-mono text-purple-700 font-semibold">{svc.db}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Architectural Principles Callout */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2 text-blue-600" />
            Nguyên Tắc Thiết Kế Cốt Lõi (Architectural Invariants per R3)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-semibold text-slate-900 text-sm mb-1">Cách Ly Cơ Sở Dữ Liệu</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                6 schema độc lập trên WampServer MySQL (port 3306). Tuyệt đối không dùng foreign key liên cơ sở dữ liệu hay SQL JOIN chéo bảng.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-semibold text-slate-900 text-sm mb-1">Phạm Vi Billing Service</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Chỉ thu phí đăng tin &amp; gói đẩy bài cho người bán. Tuyệt đối không can thiệp hay trung gian thanh toán giữa sinh viên với nhau.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-semibold text-slate-900 text-sm mb-1">Giao Tiếp Tự Trị</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Định danh qua khóa scalar (ID số nguyên / UUID). Dữ liệu tổng hợp được xử lý tại Gateway hoặc REST call giữa các service.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
          <p>© 2026 Sàn Trao Đổi Đồ Dùng Cũ STU — Trường Đại Học Công Nghệ Sài Gòn (STU)</p>
          <p className="mt-1">Dự án Luận văn Tốt nghiệp • Kiến trúc Monorepo Microservices &amp; React SPA</p>
        </div>
      </footer>
    </div>
  );
}
