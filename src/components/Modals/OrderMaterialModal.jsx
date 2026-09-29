'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Hash, FileText, CheckCircle2, Send } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function OrderMaterialModal({ isOpen, onClose, materialItems, onSubmit, projectName, initialOrder = null }) {
  const { materialOrders, materialSheets, projects, users } = useStore();
  const currentProject = projects?.find(p => p.name === projectName);
  
  const defaultReceivers = useMemo(() => {
    if (!currentProject) return [];
    let list = [];
    if (currentProject.receiver) list.push(currentProject.receiver);
    
    const addToList = (names) => {
      if (!names) return;
      const nameArr = Array.isArray(names) ? names : [names];
      nameArr.forEach(name => {
        const u = users?.find(user => user.name === name);
        if (u && u.phone) {
          list.push(`${name} (${u.phone})`);
        } else {
          list.push(name);
        }
      });
    };

    addToList(currentProject.cht);
    addToList(currentProject.gs);
    addToList(currentProject.gsht);

    return [...new Set(list)].filter(Boolean);
  }, [currentProject, users]);

  const [orderNameType, setOrderNameType] = useState('auto');
  const [customOrderName, setCustomOrderName] = useState('');
  const [date, setDate] = useState('');
  const [quantities, setQuantities] = useState({});
  const [note, setNote] = useState('');
  const [receiverType, setReceiverType] = useState('default');
  const [customReceiver, setCustomReceiver] = useState('');

  const existingPOs = useMemo(() => {
    const pos = new Set();
    
    (materialOrders || []).forEach(o => {
      if (o.projectName === projectName && o.name) {
        if (initialOrder && o.id === initialOrder.id) return;
        pos.add(o.name.toUpperCase());
      }
    });

    const currentSheet = materialSheets?.[projectName];
    if (currentSheet?.rows) {
      currentSheet.rows.forEach(r => {
        materialItems.forEach(item => {
          const val = r.values?.[item.id];
          if (val) {
            const match1 = String(val.order || '').match(/\((PO.*?)\)/i);
            if (match1 && (!initialOrder || match1[1].toUpperCase() !== initialOrder.name)) pos.add(match1[1].toUpperCase());
            const match2 = String(val.received || '').match(/\((PO.*?)\)/i);
            if (match2 && (!initialOrder || match2[1].toUpperCase() !== initialOrder.name)) pos.add(match2[1].toUpperCase());
          }
        });
      });
    }
    
    return Array.from(pos).sort();
  }, [materialOrders, materialSheets, projectName, materialItems, initialOrder]);

  const autoNextPO = useMemo(() => {
    let maxPO = 0;
    existingPOs.forEach(po => {
      const match = po.match(/^PO(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxPO) maxPO = num;
      }
    });
    return `PO${String(maxPO + 1).padStart(2, '0')}`;
  }, [existingPOs]);

  useEffect(() => {
    if (isOpen) {
      if (initialOrder) {
        setOrderNameType('custom');
        setCustomOrderName(initialOrder.name || '');
        setDate(initialOrder.date || new Date().toISOString().split('T')[0]);
        setQuantities(initialOrder.quantities || {});
        setNote(initialOrder.note || '');
        if (initialOrder.receiver && defaultReceivers.includes(initialOrder.receiver)) {
          setReceiverType(initialOrder.receiver);
          setCustomReceiver('');
        } else {
          setReceiverType('custom');
          setCustomReceiver(initialOrder.receiver || '');
        }
      } else {
        setOrderNameType('auto');
        setCustomOrderName('');
        setDate(new Date().toISOString().split('T')[0]);
        setQuantities({});
        setNote('');
        if (defaultReceivers.length > 0) {
          setReceiverType(defaultReceivers[0]);
          setCustomReceiver('');
        } else {
          setReceiverType('custom');
          setCustomReceiver('');
        }
      }
    }
  }, [isOpen, initialOrder, defaultReceivers]);

  if (!isOpen) return null;

  const handleSave = () => {
    const finalOrderName = orderNameType === 'auto' ? autoNextPO : customOrderName.trim();
    if (!finalOrderName) {
      alert('Vui lòng nhập tên/mã phiếu đặt vật tư');
      return;
    }
    if (existingPOs.includes(finalOrderName.toUpperCase())) {
      alert(`Mã phiếu ${finalOrderName} đã tồn tại! Vui lòng chọn mã khác.`);
      return;
    }
    onSubmit({
      name: finalOrderName.toUpperCase(),
      date,
      quantities,
      note,
      receiver: receiverType !== 'custom' ? receiverType : customReceiver.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 bg-orange-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl">{initialOrder ? 'CHỈNH SỬA PHIẾU ĐẶT VẬT TƯ' : 'ĐẶT VẬT TƯ MỚI'}</h3>
              <p className="text-sm text-orange-100">{initialOrder ? 'Cập nhật lại thông tin phiếu yêu cầu' : 'Lập phiếu yêu cầu cung cấp vật tư'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tên/Mã Phiếu</label>
              <div className="flex gap-2">
                <select
                  value={orderNameType}
                  onChange={(e) => setOrderNameType(e.target.value)}
                  className={`px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-700 transition-all cursor-pointer ${orderNameType === 'auto' ? 'w-full' : 'w-2/5'}`}
                >
                  <option value="auto">{autoNextPO}</option>
                  <option value="custom">Khác</option>
                </select>
                {orderNameType === 'custom' && (
                  <div className="relative w-3/5">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      value={customOrderName}
                      onChange={(e) => setCustomOrderName(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-700 transition-all text-sm"
                      placeholder="Nhập mã phiếu..."
                    />
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ngày yêu cầu</label>
              <div className="relative">
                <Calendar className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-700 transition-all"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Người nhận hàng</label>
            <div className="flex gap-2">
              {defaultReceivers.length > 0 && (
                <select
                  value={receiverType}
                  onChange={(e) => setReceiverType(e.target.value)}
                  className={`px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-700 transition-all cursor-pointer ${receiverType !== 'custom' ? 'w-full' : 'w-2/5'}`}
                >
                  {defaultReceivers.map((rec) => (
                    <option key={rec} value={rec}>{rec}</option>
                  ))}
                  <option value="custom">Khác</option>
                </select>
              )}
              {(defaultReceivers.length === 0 || receiverType === 'custom') && (
                <div className={`relative ${defaultReceivers.length > 0 ? 'w-3/5' : 'w-full'}`}>
                  <input 
                    type="text"
                    value={customReceiver}
                    onChange={(e) => setCustomReceiver(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-700 transition-all"
                    placeholder="VD: Trần Văn A (098...)"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <BoxesIcon className="w-5 h-5 text-orange-500" />
              Chi tiết số lượng vật tư cần đặt
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {materialItems.map((item, index) => {
                const headerColors = [
                  'bg-blue-500 text-white border-blue-600 shadow-blue-500/20',
                  'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20',
                  'bg-purple-500 text-white border-purple-600 shadow-purple-500/20',
                  'bg-amber-500 text-white border-amber-600 shadow-amber-500/20',
                  'bg-rose-500 text-white border-rose-600 shadow-rose-500/20',
                  'bg-cyan-500 text-white border-cyan-600 shadow-cyan-500/20',
                  'bg-indigo-500 text-white border-indigo-600 shadow-indigo-500/20',
                  'bg-orange-500 text-white border-orange-600 shadow-orange-500/20'
                ];
                const colorClass = headerColors[index % headerColors.length];
                const currentSheet = materialSheets?.[projectName];
                const unit = currentSheet?.unitMap?.[item.id];
                const placeholder = unit ? `Số lượng (${unit})...` : 'Số lượng...';

                return (
                <div key={item.id} className={`p-3 rounded-xl border shadow-sm hover:brightness-105 transition-all ${colorClass}`}>
                  <label className="block text-xs font-bold mb-2 truncate text-white" title={item.name}>
                    {item.name || 'Vật tư chưa có tên'}
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="number"
                      value={quantities[item.id] || ''}
                      onChange={(e) => setQuantities({...quantities, [item.id]: e.target.value})}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-transparent rounded-lg focus:ring-2 focus:ring-white/50 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-400"
                      placeholder={placeholder}
                    />
                  </div>
                </div>
              )})}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ghi chú (Tùy chọn)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none font-medium text-slate-700 transition-all min-h-[60px]"
              placeholder="Nhập ghi chú cho QS duyệt..."
            />
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
            className="px-6 py-2.5 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-lg shadow-orange-500/30 flex items-center gap-2 transition"
          >
            <Send className="w-5 h-5" />
            Gửi phê duyệt
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
