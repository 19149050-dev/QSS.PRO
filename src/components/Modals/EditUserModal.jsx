'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { X, Edit3 } from 'lucide-react';

export default function EditUserModal({ isOpen, onClose, userToEdit }) {
  const { updateUser } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    phone: '',
    role: 'QS',
    status: 'Active'
  });

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        name: userToEdit.name || '',
        username: userToEdit.username ? userToEdit.username.replace('@', '') : '',
        password: userToEdit.password || '',
        phone: userToEdit.phone || '',
        role: userToEdit.role || 'QS',
        status: userToEdit.status || 'Active'
      });
    }
  }, [userToEdit]);

  if (!isOpen) return null;

  const roles = [
    'ADMIN',
    'QS',
    'CHT',
    'GSHT',
    'QSA'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username) return;
    const formattedUsername = formData.username.startsWith('@') ? formData.username : `@${formData.username}`;
    updateUser(userToEdit.id, { ...formData, username: formattedUsername });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Edit3 className="w-5 h-5" />
            <h3 className="font-bold text-base">Cập Nhật Thông Tin Nhân Viên</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Tên nhân viên <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              placeholder="VD: Nguyễn Văn A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Tài khoản (@username) <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="VD: nguyenvana"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Mật khẩu mới (Để trống nếu không đổi)</label>
              <input
                type="text"
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                placeholder="VD: 0912 345 678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Chức vụ (Role)</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold text-gray-800"
              >
                {roles.map((r, idx) => (
                  <option key={idx} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Trạng thái</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="Active">Đang hoạt động</option>
              <option value="Locked">Tạm khóa</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold shadow-md shadow-amber-500/20"
            >
              Lưu Thay Đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
