'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { X, Users, Edit2 } from 'lucide-react';

export default function AddTeamModal({ isOpen, onClose, teamToEdit = null }) {
  const { projects, addTeam, updateTeam } = useStore();
  const [formData, setFormData] = useState({
    teamName: '',
    leaderName: '',
    phone: '',
    tradeType: 'Bả & Sơn Nước Nội/Ngoại thất',
    projects: projects.map(p => p.name),
    workerCount: 10,
    contractValue: ''
  });

  useEffect(() => {
    if (teamToEdit) {
      setFormData({
        teamName: teamToEdit.teamName || '',
        leaderName: teamToEdit.leaderName || '',
        phone: teamToEdit.phone || '',
        tradeType: teamToEdit.tradeType || '',
        projects: Array.isArray(teamToEdit.projects) && teamToEdit.projects.length > 0 
          ? teamToEdit.projects 
          : [teamToEdit.projectName || projects[0]?.name].filter(Boolean),
        workerCount: teamToEdit.workerCount || 10,
        contractValue: teamToEdit.contractValue || ''
      });
    } else {
      setFormData({
        teamName: '',
        leaderName: '',
        phone: '',
        tradeType: 'Bả & Sơn Nước Nội/Ngoại thất',
        projects: projects.map(p => p.name),
        workerCount: 10,
        contractValue: ''
      });
    }
  }, [teamToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.teamName || !formData.leaderName) return;

    const selectedProjs = (formData.projects && formData.projects.length > 0) 
      ? formData.projects 
      : [projects[0]?.name || 'SUNHOME'];

    if (teamToEdit) {
      updateTeam(teamToEdit.id, {
        ...formData,
        projects: selectedProjs,
        projectName: selectedProjs[0]
      });
    } else {
      addTeam({
        ...formData,
        projects: selectedProjs,
        projectName: selectedProjs[0],
        contractValue: Number(formData.contractValue) || 0,
        paidAmount: 0,
        remainingAmount: Number(formData.contractValue) || 0,
        status: 'Đang thi công'
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {teamToEdit ? <Edit2 className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            <h3 className="font-bold text-base">{teamToEdit ? 'Chỉnh Sửa Thông Tin Tổ Đội' : 'Thêm Tổ Đội / Thầu Phụ Mới'}</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Tên Tổ Đội / Đội Thi Công <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              placeholder="VD: Tổ Sơn Nước Minh Phát"
              value={formData.teamName}
              onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Đội trưởng / Đại diện <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="VD: Trần Minh Phát"
                value={formData.leaderName}
                onChange={(e) => setFormData({ ...formData, leaderName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                placeholder="VD: 0912 345 678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Dự Án Áp Dụng (Có thể chọn nhiều dự án) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2.5 bg-gray-50 rounded-xl border border-gray-200">
              {projects.map(p => {
                const isChecked = (formData.projects || []).includes(p.name);
                return (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800 p-1 hover:bg-white rounded-lg transition">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const currentProjs = formData.projects || [];
                        if (e.target.checked) {
                          setFormData({ ...formData, projects: [...currentProjs, p.name] });
                        } else {
                          setFormData({ ...formData, projects: currentProjs.filter(name => name !== p.name) });
                        }
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>{p.name}</span>
                  </label>
                );
              })}
            </div>
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-500/20"
            >
              {teamToEdit ? 'Lưu Thay Đổi' : 'Tạo Tổ Đội'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
