'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { Search, Bell, ShieldCheck, Sparkles, Database } from 'lucide-react';

export default function Navbar({ onOpenAddModal, searchSearch, onSearchChange }) {
  const { activeTab } = useStore();

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Trang Chủ Tổng Quan', subtitle: 'Báo cáo tổng quan tiến độ thu tiền CĐT và thanh toán Tổ đội.' };
      case 'users':
        return { title: 'Quản lý Nhân viên', subtitle: 'Thêm hoặc xóa tài khoản truy cập hệ thống.' };
      case 'projects':
      case 'project-detail':
        return { title: 'Quản lý Công Trình', subtitle: 'Quản lý danh sách dự án và thông tin hợp đồng cơ bản.' };
      case 'teams':
      case 'manage-teams':
        return { title: 'Quản lý Tổ Đội & Thầu Phụ', subtitle: 'Theo dõi hợp đồng, ứng trước và tiến độ thanh toán từng tổ đội.' };
      case 'ipc':
      case 'ipc-thuc':
      case 'ipc-du-kien':
        return { title: 'Quản lý Hồ Sơ Thanh Toán (IPC)', subtitle: 'Lập & theo dõi tiến độ nghiệm thu A-B và đợt chi trả B-C.' };
      case 'materials':
        return { title: 'Quản lý Vật Tư Dự Án', subtitle: 'Theo dõi khối lượng kế hoạch, nhập thực tế và định mức vật tư.' };
      case 'trash':
        return { title: 'Thùng rác', subtitle: 'Khôi phục hoặc xóa vĩnh viễn các dữ liệu đã bị xóa.' };
      default:
        return { title: 'Hệ thống Quản lý QS PRO', subtitle: 'Phần mềm chuyên sâu cho Kỹ sư Khối lượng & Quản lý Dự án.' };
    }
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-0 z-10 shadow-sm">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
          <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
            <Database className="w-3 h-3 text-emerald-600" /> Supabase Live
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 font-medium">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm công trình, nhân viên, IPC..."
            value={searchSearch || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>


        {/* Action Button */}
        {onOpenAddModal && (
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 transition active:scale-95"
          >
            <Sparkles className="w-4 h-4" /> Thêm Mới
          </button>
        )}
      </div>
    </header>
  );
}
