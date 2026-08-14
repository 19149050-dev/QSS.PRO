'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { X, Building2, Save, ChevronDown } from 'lucide-react';

export default function EditProjectModal({ project, isOpen, onClose }) {
  const { updateProject, users } = useStore();
  const [isChtOpen, setIsChtOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    orderType: 'TRỰC TIẾP ORDER',
    subContractorInfo: '',
    address: '',
    contractNo: '',
    contractDate: '',
    cht: [],
    gs: '',
    numBlocks: '1',
    contractValue: '',
    addendumValue: '',
    advancePayment: '',
    status: 'Doing'
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        orderType: project.orderType || 'TRỰC TIẾP ORDER',
        subContractorInfo: project.subContractorInfo || '',
        address: project.address || '',
        contractNo: project.contractNo || '',
        contractDate: project.contractDate || '',
        cht: project.cht || [],
        gs: project.gs || '',
        numBlocks: project.numBlocks || project.floors || '1',
        contractValue: project.contractValue || 0,
        addendumValue: project.addendumValue || 0,
        advancePayment: project.advancePayment || 0,
        status: project.status || 'Doing'
      });
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProject(project.id, {
      ...formData,
      cht: formData.cht || [],
      contractValue: Number(formData.contractValue) || 0,
      addendumValue: Number(formData.addendumValue) || 0,
      advancePayment: Number(formData.advancePayment) || 0
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5" />
            <h3 className="font-bold text-base">Sửa Thông Tin Công Trình</h3>
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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Số Block</label>
              <input
                type="text"
                placeholder="VD: 1, 2, 3, 4..."
                value={formData.numBlocks || '1'}
                onChange={(e) => setFormData({ ...formData, numBlocks: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Loại Order</label>
              <select
                value={formData.orderType}
                onChange={(e) => setFormData({ ...formData, orderType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TRỰC TIẾP ORDER">TRỰC TIẾP ORDER</option>
                <option value="TỔNG THẦU MUA HỘ">TỔNG THẦU MUA HỘ</option>
                <option value="CHỦ ĐẦU TƯ GIAO">CHỦ ĐẦU TƯ GIAO</option>
              </select>
            </div>
            
            <div className="relative">
              <label className="block font-semibold text-gray-700 mb-1">CHT, GS</label>
              <div 
                onClick={() => setIsChtOpen(!isChtOpen)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white cursor-pointer flex justify-between items-center hover:border-indigo-400 transition"
              >
                <span className="truncate text-gray-700">
                  {formData.cht.length > 0 ? formData.cht.join(', ') : 'Chọn CHT, GS...'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
              
              {isChtOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsChtOpen(false)}></div>
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-y-auto p-2">
                    {users.filter(u => u.role !== 'ADMIN').map((u) => (
                      <label key={u.id} className="flex items-center gap-2 mb-1 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded transition">
                        <input
                          type="checkbox"
                          checked={formData.cht.includes(u.name)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              cht: checked 
                                ? [...prev.cht, u.name]
                                : prev.cht.filter(n => n !== u.name)
                            }));
                          }}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-gray-700">{u.name} ({u.role})</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Cập Nhật
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
