import React, { useState, useEffect } from 'react';
import { X, Calendar, Hash, Building2, Blocks, Package } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function AddExportEntryModal({ isOpen, onClose, project, materialItems = [], blocks = [] }) {
  const { materialSheets, setMaterialSheet } = useStore();
  const currentSheet = materialSheets[project] || { items: [], rows: [], exportRows: [] };
  
  const existingFloors = currentSheet.exportRows ? currentSheet.exportRows.map(r => r.date).filter(Boolean) : [];

  const [floor, setFloor] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [blockName, setBlockName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      setFloor('');
      setMaterialId(materialItems[0]?.id || '');
      setBlockName(blocks[0]?.blockName || 'DEFAULT');
      setQuantity('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, materialItems, blocks]);

  if (!isOpen) return null;

  const toVN = (isoStr) => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
    }
    return isoStr;
  };

  const handleSave = () => {
    if (!floor.trim() || !materialId || !quantity) {
      alert('Vui lòng nhập đủ thông tin tầng, vật tư và số lượng!');
      return;
    }

    const vnDate = toVN(date);
    let nextRows = [...(currentSheet.exportRows || [])];
    
    // Tìm xem tầng này đã có chưa (row.date đóng vai trò là Tên tầng trong bảng vật tư)
    let rowIndex = nextRows.findIndex(r => r.date?.trim().toLowerCase() === floor.trim().toLowerCase());
    
    if (rowIndex === -1) {
      // Tạo tầng mới
      const newRow = {
        id: crypto.randomUUID(),
        date: floor.trim(),
        values: {}
      };
      nextRows.push(newRow);
      rowIndex = nextRows.length - 1;
    }
    
    const row = { ...nextRows[rowIndex] };
    const values = { ...(row.values || {}) };
    const entries = [...(values[materialId] || [])];
    
    // Tìm xem đã có dòng nào trùng ngày chưa
    let entryIndex = entries.findIndex(e => e.date === vnDate);
    
    if (entryIndex === -1) {
      // Nếu khác ngày, tạo dòng mới (entry mới)
      const newEntry = { date: vnDate };
      if (blocks.length > 1) {
        newEntry.quantities = { [blockName]: quantity };
      } else {
        newEntry.quantity = quantity;
      }
      entries.push(newEntry);
    } else {
      // Nếu trùng ngày, cộng dồn
      const entry = { ...entries[entryIndex] };
      if (blocks.length > 1) {
        entry.quantities = {
          ...(entry.quantities || {}),
          [blockName]: (parseFloat(entry.quantities?.[blockName] || 0) + parseFloat(quantity)).toString()
        };
      } else {
        entry.quantity = (parseFloat(entry.quantity || 0) + parseFloat(quantity)).toString();
      }
      entries[entryIndex] = entry;
    }
    
    values[materialId] = entries;
    row.values = values;
    nextRows[rowIndex] = row;
    
    // Sắp xếp lại danh sách tầng theo tên
    nextRows.sort((a, b) => {
       const numA = parseInt(a.date?.replace(/\D/g, '') || '0');
       const numB = parseInt(b.date?.replace(/\D/g, '') || '0');
       return numA - numB;
    });

    setMaterialSheet(project, { 
      ...currentSheet, 
      exportRows: nextRows 
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 bg-emerald-600 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Nhập xuất vật tư</h3>
            <p className="text-sm opacity-90">Thêm dữ liệu xuất kho</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tầng / Khu vực</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                list="existing-floors-list"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-900"
                placeholder="VD: Tầng 03"
              />
              <datalist id="existing-floors-list">
                {existingFloors.map((f, idx) => (
                  <option key={idx} value={f} />
                ))}
              </datalist>
            </div>
          </div>
          
          {blocks.length > 1 && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tháp / Block</label>
              <div className="relative">
                <Blocks className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select 
                  value={blockName}
                  onChange={(e) => setBlockName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-900 appearance-none bg-white"
                >
                  {blocks.map(b => (
                    <option key={b.blockName} value={b.blockName}>{b.blockName}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Loại vật tư</label>
            <div className="relative">
              <Package className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select 
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-900 appearance-none bg-white"
              >
                {materialItems.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Số lượng xuất</label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-900"
                placeholder="VD: 100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày xuất</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-900"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
