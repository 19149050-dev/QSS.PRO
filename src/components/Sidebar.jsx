'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { 
  Home, 
  Building2, 
  Users, 
  FileSpreadsheet, 
  Package, 
  Receipt, 
  CreditCard, 
  DollarSign, 
  History, 
  PlusCircle, 
  ShieldCheck, 
  Trash2, 
  Lock, 
  Bell, 
  PenTool, 
  LogOut,
  FolderGit2,
  ClipboardList,
  UserCheck,
  X
} from 'lucide-react';

export default function Sidebar({ onCloseMobile }) {
  const { activeTab, setActiveTab, currentUser, logoutUser } = useStore();

  const handleLogout = () => {
    document.cookie = 'isAuthenticated=; path=/; max-age=0; samesite=lax';
    logoutUser();
    window.location.assign('/login');
  };

  const handleTabClick = (id) => {
    setActiveTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  const mainNavItems = [
    { label: 'Trang Chủ', id: 'dashboard', icon: Home },
    { label: 'Tổ Đội', id: 'teams', icon: Users },
    { label: 'IPC Dự Kiến', id: 'ipc-du-kien', icon: FileSpreadsheet },
    { label: 'IPC Thực', id: 'ipc-thuc', icon: ClipboardList, requiresPermission: 'allowViewIpcThuc' },
    { label: 'Nhận Vật Tư', id: 'ipc-vat-tu', icon: Package },
    { label: 'Xuất Vật Tư', id: 'export-materials', icon: Package },
    { label: 'Điểm danh đội', id: 'team-attendance', icon: UserCheck },
    { label: 'Ghi chú', id: 'project-notes', icon: PenTool },
  ];

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'GIÁM ĐỐC';

  const systemNavItems = [
    { label: 'QL Công trình', id: 'projects', icon: Building2 },
    ...(isAdmin ? [{ label: 'QL Nhân viên', id: 'users', icon: Users }] : []),
    { label: 'QL Tổ đội', id: 'manage-teams', icon: Users },
    { label: 'Thùng rác', id: 'trash', icon: Trash2 },
  ];

  const isActive = (id) => activeTab === id;

  return (
    <aside className="w-52 bg-[#0a0a0a] text-zinc-400 min-h-screen flex flex-col justify-between flex-shrink-0 border-r border-zinc-900 shadow-xl relative z-20">
      <div className="relative z-10">
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-zinc-900 bg-[#0a0a0a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black font-black text-xl shadow-md shadow-white/10">
              Q
            </div>
            <div>
              <h1 className="font-black text-lg tracking-wider text-white flex items-center gap-1">
                QSS
                <span className="text-zinc-500">PRO</span>
              </h1>
              <p className="text-[10px] text-zinc-500 font-bold tracking-widest mt-0.5 uppercase">MANAGEMENT SYSTEM</p>
            </div>
          </div>
          {onCloseMobile && (
            <button 
              onClick={onCloseMobile}
              className="md:hidden p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Card Box */}
        <div className="mx-3 my-4 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-xs flex flex-col gap-2 transition-colors hover:border-zinc-700 hover:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div>
                <p className="font-bold text-white leading-tight">{currentUser?.name || 'Quản trị hệ thống'}</p>
                <span className="inline-block text-[9px] bg-black border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-black tracking-widest uppercase mt-1">
                  {currentUser?.role || 'ADMIN'}
                </span>
              </div>
            </div>
            <button type="button" onClick={handleLogout} title="Đăng xuất" className="text-zinc-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-zinc-800">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Navigation Menu */}
        <div className="px-3 space-y-1">
          <div className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 mt-4">Chức năng chính</div>
          {mainNavItems.map((item, idx) => {
            if (item.requiresPermission && !isAdmin && !currentUser?.[item.requiresPermission]) {
              return null;
            }
            const Icon = item.icon;
            const active = isActive(item.id);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${active ? 'bg-white text-black shadow-md shadow-white/10' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    item.badge === '17' ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* System Navigation Menu */}
        <div className="px-3 pt-6 space-y-1">
          <div className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Hệ thống</div>
          {systemNavItems.map((item, idx) => {
            const Icon = item.icon;
            const active = isActive(item.id);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${active ? 'bg-white text-black shadow-md shadow-white/10' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-zinc-900 bg-[#0a0a0a] text-[10px] text-zinc-600 text-center uppercase tracking-widest font-bold relative z-10">
        QSS PRO Engine v1.0.4 &copy; 2026
      </div>
    </aside>
  );
}
