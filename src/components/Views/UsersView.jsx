'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import AddUserModal from '@/components/Modals/AddUserModal';
import { 
  UserPlus, 
  Search, 
  Clock, 
  Edit3, 
  Lock, 
  Unlock, 
  Key, 
  Trash2, 
  PenTool, 
  CheckCircle2, 
  XCircle,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';

export default function UsersPage() {
  const { users, deleteUser, toggleUserLock, updateUser } = useStore();
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'history'
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUserForSig, setSelectedUserForSig] = useState(null);

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-black text-white font-black';
      case 'QS':
        return 'bg-purple-100 text-purple-700 font-bold border border-purple-300';
      case 'CHT':
        return 'bg-sky-100 text-sky-800 font-bold border border-sky-300';
      case 'GSHT':
        return 'bg-amber-100 text-amber-800 font-bold border border-amber-300';
      case 'QSA':
        return 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300';
      default:
        return 'bg-gray-100 text-gray-700 font-semibold';
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.phone && u.phone.includes(searchTerm)) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pb-12">

      <div className="p-8 space-y-6 w-full">
        {/* Top Control Bar with Tabs matching Screenshot 1 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-xs">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'list'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Danh sách nhân viên
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Lịch sử hoạt động
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-500/20 transition active:scale-95 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" /> Thêm nhân viên
          </button>
        </div>

        {/* User Search Bar matching Screenshot 1 */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nhân viên (tên, tài khoản, số điện thoại, chức vụ)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
        </div>

        {/* Users Table */}
        {activeTab === 'list' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left qss-table">
                <thead>
                  <tr>
                    <th>Tên nhân viên</th>
                    <th>Tài khoản</th>
                    <th>Số ĐT</th>
                    <th>Chức vụ (Role)</th>
                    <th>Trạng thái</th>
                    <th>IP Đăng nhập</th>
                    <th>Lịch sử IP (Gần đây)</th>
                    <th>Chữ ký</th>
                    <th className="text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition">
                      <td className="font-bold text-gray-900">{user.name}</td>
                      <td className="text-xs text-indigo-600 font-medium">{user.username}</td>
                      <td className="text-xs text-gray-500 font-medium">{user.phone || '---'}</td>
                      <td>
                        <span className={`inline-block px-2.5 py-0.5 text-[10px] rounded-md tracking-wider uppercase ${getRoleBadgeStyle(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Đang hoạt động
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {user.lastLogin}
                          </span>
                        </div>
                      </td>
                      <td className="text-xs text-gray-500 font-mono">{user.ipLogin}</td>
                      <td>
                        {user.ipHistory && user.ipHistory.length > 0 ? (
                          <div className="space-y-0.5 max-w-[140px]">
                            {user.ipHistory.slice(0, 2).map((ip, i) => (
                              <div key={i} className="text-[10px] bg-gray-100 text-gray-600 font-mono px-1.5 py-0.2 rounded border border-gray-200">
                                {ip}
                              </div>
                            ))}
                            {user.ipHistory.length > 2 && (
                              <span className="text-[9px] text-gray-400 italic font-medium">...và {user.ipHistory.length - 2} IP khác</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Chưa có</span>
                        )}
                      </td>
                      <td>
                        {user.signature ? (
                          <div className="p-1 border border-gray-200 rounded-lg bg-gray-50 inline-block">
                            <img src={user.signature} alt="Chữ ký" className="h-6 object-contain" />
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Chưa có</span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5 text-gray-400">
                          <button title="Lịch sử" className="p-1.5 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                          <button title="Sửa" className="p-1.5 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            title={user.status === 'Active' ? 'Khóa tài khoản' : 'Mở khóa'} 
                            onClick={() => toggleUserLock(user.id)}
                            className="p-1.5 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          >
                            {user.status === 'Active' ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <Unlock className="w-3.5 h-3.5 text-emerald-600" />}
                          </button>
                          <button title="Đổi mật khẩu" className="p-1.5 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition">
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            title="Xóa" 
                            onClick={() => deleteUser(user.id)}
                            className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-xs text-gray-600 space-y-3">
            <h3 className="font-bold text-sm text-gray-900">Nhật Ký Đăng Nhập & Thao Tác Hệ Thống</h3>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                <div>
                  <strong className="text-gray-900">@admin</strong> vừa tạo đợt IPC A-B Đợt 02 cho công trình SUNHOME
                  <div className="text-[10px] text-gray-400">IP: 1.54.25.78 &bull; 10:34:02 10/8/2026</div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Thành công</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                <div>
                  <strong className="text-gray-900">@huynhvantrung</strong> vừa cập nhật đợt thanh toán PK_1 tại tháp B tầng 8
                  <div className="text-[10px] text-gray-400">IP: 14.227.188.204 &bull; 14:20:34 7/8/2026</div>
                </div>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">Ghi nhận</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
