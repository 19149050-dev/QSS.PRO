'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Hash } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function ExportEntriesModal({ isOpen, onClose, project, row, item, isExport }) {
  const { materialSheets, setMaterialSheet } = useStore();
  const currentSheet = materialSheets[project] || { items: [], rows: [], exportRows: [] };
  
  const [entries, setEntries] = useState([]);
  
  useEffect(() => {
    if (isOpen && row && item) {
      const cellData = row.values?.[item.id];
      if (Array.isArray(cellData)) {
        setEntries(cellData);
      } else {
        // Handle migration from old format or empty
        setEntries([]);
      }
    }
  }, [isOpen, row, item]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Save entries to store
    const nextRows = (isExport ? currentSheet.exportRows : currentSheet.rows).map(r => {
      if (r.id === row.id) {
        return {
          ...r,
          values: {
            ...(r.values || {}),
            [item.id]: entries
          }
        };
      }
      return r;
    });

    setMaterialSheet(project, { 
      ...currentSheet, 
      [isExport ? 'exportRows' : 'rows']: nextRows 
    });
    
    onClose();
  };

  const toISO = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      let y = parts[2];
      if (y.length === 2) y = '20' + y;
      return `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateStr;
  };

  const toVN = (isoStr) => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
    }
    return isoStr;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Quản lý xuất vật tư</h3>
            <p className="text-sm opacity-90">Tầng: {row?.date} - Vật tư: {item?.name}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-slate-800">Danh sách các lần xuất:</h4>
            <button 
              onClick={() => setEntries([...entries, { quantity: '', date: '' }])}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 text-emerald-700 px-3 py-1.5 text-xs font-bold hover:bg-emerald-200 transition"
            >
              <Plus className="w-4 h-4" /> Thêm lần xuất
            </button>
          </div>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {entries.length === 0 ? (
              <p className="text-sm text-center text-slate-500 py-6 border-2 border-dashed border-slate-200 rounded-xl">
                Chưa có dữ liệu xuất. Bấm "Thêm lần xuất" để tạo mới.
              </p>
            ) : (
              entries.map((entry, idx) => (
                <div key={idx} className="flex gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Số lượng</label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="number"
                        value={entry.quantity}
                        onChange={(e) => {
                          const newEntries = [...entries];
                          newEntries[idx].quantity = e.target.value;
                          setEntries(newEntries);
                        }}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                        placeholder="VD: 100"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ngày (DD/MM/YY)</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="date"
                        value={toISO(entry.date)}
                        onChange={(e) => {
                          const newEntries = [...entries];
                          newEntries[idx].date = toVN(e.target.value);
                          setEntries(newEntries);
                        }}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const newEntries = [...entries];
                      newEntries.splice(idx, 1);
                      setEntries(newEntries);
                    }}
                    className="mt-5 p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Xóa"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition"
            >
              Lưu dữ liệu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
