'use client';

import React, { useState } from 'react';
import { useStore, useAllowedProjects } from '@/store/useStore';
import { X, FileSpreadsheet } from 'lucide-react';

export default function AddIPCModal({ isOpen, onClose }) {
  const { teams, addIPC } = useStore();
  const projects = useAllowedProjects();
  const [formData, setFormData] = useState({
    type: 'A-B',
    projectId: projects[0]?.id || '',
    period: 'Đợt 02',
    proposedAmount: '',
    approvedAmount: '',
    advanceDeduction: '',
    retentionRate: 5,
    notes: ''
  });

  if (!isOpen) return null;

  const selectedProj = projects.find(p => p.id === formData.projectId) || projects[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    const prop = Number(formData.proposedAmount) || 0;
    const appr = Number(formData.approvedAmount) || prop;
    const adv = Number(formData.advanceDeduction) || 0;
    const retRate = Number(formData.retentionRate) || 5;
    const retAmt = Math.round(appr * (retRate / 100));
    const net = appr - adv - retAmt;

    addIPC({
      ...formData,
      projectName: selectedProj?.name || 'SUNHOME',
      proposedAmount: prop,
      approvedAmount: appr,
      advanceDeduction: adv,
      retentionRate: retRate,
      retentionAmount: retAmt,
      netPayable: net
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5" />
            <h3 className="font-bold text-base">Tạo Hồ Sơ Thanh Toán (IPC) Mới</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Loại Đợt IPC</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
              >
                <option value="A-B">IPC A-B (Thu từ Chủ Đầu Tư)</option>
                <option value="B-C">IPC B-C (Chi trả cho Tổ Đội)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Dự án áp dụng</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Kỳ / Đợt nghiệm thu</label>
              <input
                type="text"
                placeholder="VD: Đợt 02"
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Tỷ lệ giữ lại BH (%)</label>
              <input
                type="number"
                value={formData.retentionRate}
                onChange={(e) => setFormData({ ...formData, retentionRate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Số tiền đề nghị (VNĐ)</label>
              <input
                type="number"
                required
                placeholder="1000000000"
                value={formData.proposedAmount}
                onChange={(e) => setFormData({ ...formData, proposedAmount: e.target.value, approvedAmount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Số tiền phê duyệt (VNĐ)</label>
              <input
                type="number"
                placeholder="950000000"
                value={formData.approvedAmount}
                onChange={(e) => setFormData({ ...formData, approvedAmount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Trừ tạm ứng đợt này (VNĐ)</label>
            <input
              type="number"
              placeholder="100000000"
              value={formData.advanceDeduction}
              onChange={(e) => setFormData({ ...formData, advanceDeduction: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Ghi chú / Nội dung công việc</label>
            <textarea
              rows={2}
              placeholder="VD: Nghiệm thu hoàn thành bả + sơn lót tháp B tầng 5-10"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
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
              Tạo Hồ Sơ IPC
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
