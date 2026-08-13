'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { X, Building2, Plus } from 'lucide-react';

export default function AddProjectModal({ isOpen, onClose }) {
  const { addProject } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    orderType: 'TRỰC TIẾP ORDER',
    subContractorInfo: '',
    address: '',
    contractNo: '',
    contractDate: new Date().toISOString().split('T')[0],
    cht: '',
    gs: '',
    numBlocks: '1',
    contractValue: '',
    addendumValue: '',
    advancePayment: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    addProject({
      ...formData,
      cht: formData.cht ? formData.cht.split(',').map(c => c.trim()).filter(Boolean) : [],
      contractValue: Number(formData.contractValue) || 0,
      addendumValue: Number(formData.addendumValue) || 0,
      advancePayment: Number(formData.advancePayment) || 0,
      status: 'Doing'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5" />
            <h3 className="font-bold text-base">Thêm Công Trình Mới</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Tên công trình <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="VD: SUNSET TOWN (NÚI ÔNG QUÁN)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Số Block</label>
              <input
                type="text"
                placeholder="VD: 1, 2, 3, 4..."
                value={formData.numBlocks}
                onChange={(e) => setFormData({ ...formData, numBlocks: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Địa chỉ / Khu vực</label>
              <input
                type="text"
                placeholder="VD: PHÚ QUỐC, CẦN THƠ, BÌNH DƯƠNG..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Loại Order</label>
              <select
                value={formData.orderType}
                onChange={(e) => setFormData({ ...formData, orderType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="TRỰC TIẾP ORDER">TRỰC TIẾP ORDER</option>
                <option value="TỔNG THẦU MUA HỘ">TỔNG THẦU MUA HỘ</option>
                <option value="CHỦ ĐẦU TƯ GIAO">CHỦ ĐẦU TƯ GIAO</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Số Hợp đồng</label>
              <input
                type="text"
                placeholder="VD: 232/2025/HĐ/PCC-QTPK"
                value={formData.contractNo}
                onChange={(e) => setFormData({ ...formData, contractNo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">CHT, GS</label>
              <input
                type="text"
                placeholder="VD: Huỳnh Văn Trung"
                value={formData.cht}
                onChange={(e) => setFormData({ ...formData, cht: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Giá trị HĐ (VNĐ)</label>
              <input
                type="number"
                placeholder="2500000000"
                value={formData.contractValue}
                onChange={(e) => setFormData({ ...formData, contractValue: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-indigo-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Phụ lục HĐ (VNĐ)</label>
              <input
                type="number"
                placeholder="0"
                value={formData.addendumValue}
                onChange={(e) => setFormData({ ...formData, addendumValue: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Tạm ứng (VNĐ)</label>
              <input
                type="number"
                placeholder="0"
                value={formData.advancePayment}
                onChange={(e) => setFormData({ ...formData, advancePayment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
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
              Tạo Công Trình
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
