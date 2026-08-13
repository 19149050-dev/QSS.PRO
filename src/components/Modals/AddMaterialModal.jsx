'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { X, Package, Plus } from 'lucide-react';

export default function AddMaterialModal({ isOpen, onClose }) {
  const { projects, addMaterial } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    unit: 'Thùng',
    unitPrice: '',
    quantityPlan: '',
    quantityActual: '',
    supplier: '',
    projectId: projects[0]?.id || ''
  });

  if (!isOpen) return null;

  const selectedProj = projects.find(p => p.id === formData.projectId) || projects[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    addMaterial({
      ...formData,
      projectName: selectedProj?.name || 'SUNHOME',
      unitPrice: Number(formData.unitPrice) || 0,
      quantityPlan: Number(formData.quantityPlan) || 0,
      quantityActual: Number(formData.quantityActual) || 0,
      status: Number(formData.quantityActual) > Number(formData.quantityPlan) ? 'Vượt định mức' : 'Bình thường'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5" />
            <h3 className="font-bold text-base">Thêm Vật Tư Mới</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Mã vật tư</label>
              <input
                type="text"
                placeholder="VD: VT-SN-05"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Tên vật tư <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="VD: Sơn Dulux Weathershield 18L"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Đơn vị tính (ĐVT)</label>
              <input
                type="text"
                placeholder="Thùng, Bao, Tấm, Tấn..."
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Đơn giá (VNĐ)</label>
              <input
                type="number"
                placeholder="1450000"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Số lượng kế hoạch</label>
              <input
                type="number"
                placeholder="500"
                value={formData.quantityPlan}
                onChange={(e) => setFormData({ ...formData, quantityPlan: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Số lượng thực tế nhập</label>
              <input
                type="number"
                placeholder="480"
                value={formData.quantityActual}
                onChange={(e) => setFormData({ ...formData, quantityActual: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Nhà cung cấp</label>
              <input
                type="text"
                placeholder="VD: Cty Sơn Dulux Thành Phát"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Dự án</label>
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
              Lưu Vật Tư
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
