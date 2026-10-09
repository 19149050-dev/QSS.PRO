'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Hash, Package, Layers } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function ExportEntriesModal({ isOpen, onClose, project, row, item, isExport }) {
  const { materialSheets, setMaterialSheet, matrixBlocks } = useStore();
  const currentSheet = materialSheets[project] || { items: [], rows: [], exportRows: [] };
  const blocks = matrixBlocks[project] || [];
  const displayBlocks = blocks.length > 0 ? blocks : [{ blockName: 'DEFAULT' }];
  
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/60 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header - Gradient Glass */}
        <div className="relative p-6 sm:p-8 overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 opacity-90" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-white tracking-tight drop-shadow-sm">Quản lý xuất vật tư</h3>
                <div className="flex items-center gap-2 mt-1.5 text-indigo-50 font-medium text-sm">
                  <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                    <Layers className="w-3.5 h-3.5" />
                    {row?.date || 'Không tên'}
                  </span>
                  <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                    {item?.name || 'Vật tư'}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/10 text-white hover:bg-black/20 hover:scale-105 transition-all duration-200 backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 overflow-auto flex-1 bg-slate-50/50">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              Lịch sử các lần xuất
              <span className="bg-indigo-100 text-indigo-700 text-xs py-0.5 px-2 rounded-full font-bold">
                {entries.length}
              </span>
            </h4>
            <button 
              onClick={() => setEntries([...entries, { quantity: '', date: '' }])}
              className="group flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 active:scale-95"
            >
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" /> Thêm lần xuất
            </button>
          </div>
          
          <div className="space-y-4 pr-2">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-3xl bg-white/50 text-center">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-200 rounded-full flex items-center justify-center mb-4">
                  <Package className="w-8 h-8" />
                </div>
                <h5 className="font-bold text-slate-700 mb-1">Chưa có dữ liệu xuất</h5>
                <p className="text-sm text-slate-500 max-w-[250px]">Bạn chưa thêm lần xuất nào cho vật tư này tại khu vực này.</p>
              </div>
            ) : (
              entries.map((entry, idx) => (
                <div 
                  key={idx} 
                  className="flex flex-wrap items-end gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300"
                >
                  <div className="flex-1 min-w-[200px] grid grid-cols-2 gap-3">
                    {!isExport || displayBlocks.length <= 1 ? (
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Số lượng</label>
                        <div className="relative group/input">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Hash className="w-4 h-4 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors" />
                          </div>
                          <input 
                            type="number"
                            value={entry.quantity || ''}
                            onChange={(e) => {
                              const newEntries = [...entries];
                              newEntries[idx].quantity = e.target.value;
                              setEntries(newEntries);
                            }}
                            className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    ) : (
                      displayBlocks.map((block, bIdx) => (
                        <div key={bIdx} className="col-span-1">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 truncate" title={`SL ${block.blockName}`}>
                            SL {block.blockName}
                          </label>
                          <div className="relative group/input">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                              <Hash className="w-4 h-4 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors" />
                            </div>
                            <input 
                              type="number"
                              value={entry.quantities?.[block.blockName] ?? (bIdx === 0 && entry.quantity ? entry.quantity : '')}
                              onChange={(e) => {
                                const newEntries = [...entries];
                                if (!newEntries[idx].quantities) {
                                  newEntries[idx].quantities = {};
                                }
                                newEntries[idx].quantities[block.blockName] = e.target.value;
                                if (bIdx === 0) newEntries[idx].quantity = '';
                                setEntries(newEntries);
                              }}
                              className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="w-[170px] shrink-0">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ngày xuất</label>
                    <div className="relative group/input">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Calendar className="w-4 h-4 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors" />
                      </div>
                      <input 
                        type="date"
                        value={toISO(entry.date)}
                        onChange={(e) => {
                          const newEntries = [...entries];
                          newEntries[idx].date = toVN(e.target.value);
                          setEntries(newEntries);
                        }}
                        className="block w-full pl-10 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      const newEntries = [...entries];
                      newEntries.splice(idx, 1);
                      setEntries(newEntries);
                    }}
                    className="w-11 h-[46px] shrink-0 flex items-center justify-center bg-red-50 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-xl transition-all duration-200"
                    title="Xóa"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 sm:p-8 bg-white/80 backdrop-blur-md border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
