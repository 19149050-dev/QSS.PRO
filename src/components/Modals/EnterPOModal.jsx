'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Hash, FileText, CheckCircle2 } from 'lucide-react';

export default function EnterPOModal({ isOpen, onClose, materialItems, onSubmit }) {
  const [poName, setPoName] = useState('');
  const [date, setDate] = useState('');
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    if (isOpen) {
      setPoName('');
      setDate(new Date().toISOString().split('T')[0]);
      setQuantities({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!poName.trim()) {
      alert('Vui lòng nhập tên PO');
      return;
    }
    onSubmit(poName.trim(), quantities, date);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 bg-rose-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl">NHẬP PO MỚI</h3>
              <p className="text-sm text-rose-100">Phân bổ số lượng PO cho các vật tư</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tên PO</label>
              <div className="relative">
                <FileText className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={poName}
                  onChange={(e) => setPoName(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none font-bold text-slate-700 transition-all"
                  placeholder="VD: PO001"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ngày nhập</label>
              <div className="relative">
                <Calendar className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none font-bold text-slate-700 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <BoxesIcon className="w-5 h-5 text-rose-500" />
              Chi tiết số lượng vật tư
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {materialItems.map((item) => (
                <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-rose-300 transition-colors">
                  <label className="block text-xs font-bold text-slate-600 mb-2 truncate" title={item.name}>
                    {item.name || 'Vật tư chưa có tên'}
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="number"
                      value={quantities[item.id] || ''}
                      onChange={(e) => setQuantities({...quantities, [item.id]: e.target.value})}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none font-bold transition-all"
                      placeholder="Số lượng..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-lg shadow-rose-500/30 flex items-center gap-2 transition"
          >
            <CheckCircle2 className="w-5 h-5" />
            Xác nhận phân bổ
          </button>
        </div>
      </div>
    </div>
  );
}

function BoxesIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z" />
      <path d="m7 16.5-4.74-2.85" />
      <path d="m7 16.5 5-3" />
      <path d="M7 16.5v5.17" />
      <path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z" />
      <path d="m17 16.5-5-3" />
      <path d="m17 16.5 4.74-2.85" />
      <path d="M17 16.5v5.17" />
      <path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z" />
      <path d="M12 8 7.26 5.15" />
      <path d="m12 8 4.74-2.85" />
      <path d="M12 13.5V8" />
    </svg>
  );
}
