'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { Search, Sparkles, Database } from 'lucide-react';

export default function Navbar({ onOpenAddModal, searchSearch, onSearchChange }) {
  const { activeTab } = useStore();

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Trang Chu Tong Quan', subtitle: 'Bao cao tong quan tien do thu tien CDT va thanh toan To Doi.' };
      case 'users':
        return { title: 'Quan ly Nhan vien', subtitle: 'Them hoac xoa tai khoan truy cap he thong.' };
      case 'projects':
      case 'project-detail':
        return { title: 'Quan ly Cong Trinh', subtitle: 'Quan ly danh sach du an va thong tin hop dong co ban.' };
      case 'teams':
      case 'manage-teams':
        return { title: 'Quan ly To Doi & Thau Phu', subtitle: 'Theo doi hop dong, ung truoc va tien do thanh toan tung to doi.' };
      case 'ipc':
      case 'ipc-thuc':
      case 'ipc-du-kien':
      case 'ipc-vat-tu':
        return { title: 'Quan ly Ho So Thanh Toan (IPC)', subtitle: 'Lap & theo doi tien do nghiem thu A-B va dot chi tra B-C.' };
      case 'materials':
        return { title: 'Quan ly Vat Tu Du An', subtitle: 'Theo doi khoi luong ke hoach, nhap thuc te va dinh muc vat tu.' };
      case 'trash':
        return { title: 'Thung rac', subtitle: 'Khoi phuc hoac xoa vinh vien cac du lieu da bi xoa.' };
      default:
        return { title: 'He thong Quan ly QS PRO', subtitle: 'Phan mem chuyen sau cho Ky su Khoi luong & Quan ly Du an.' };
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
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tim kiem cong trinh, nhan vien, IPC..."
            value={searchSearch || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        {onOpenAddModal && (
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 transition active:scale-95"
          >
            <Sparkles className="w-4 h-4" /> Them Moi
          </button>
        )}
      </div>
    </header>
  );
}
