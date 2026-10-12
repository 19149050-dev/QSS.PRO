import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown, HardHat, Check, Edit2 } from 'lucide-react';

const SUGGESTED_ITEMS = [
  'Nón bảo hộ',
  'Giày bảo hộ',
  'Dây an toàn',
  'Áo phản quang',
  'Găng tay',
  'Kính bảo hộ'
];

export default function BhldConfigModal({
  isOpen,
  onClose,
  projectName,
  columns = [],
  onSave
}) {
  const [localCols, setLocalCols] = useState([]);
  const [newColName, setNewColName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocalCols(Array.isArray(columns) && columns.length > 0 ? [...columns] : [
        { id: 'aoGS', name: 'Áo GS' },
        { id: 'aoCN', name: 'Áo CN' },
        { id: 'khac', name: 'Khác' }
      ]);
      setNewColName('');
      setEditingId(null);
    }
  }, [isOpen, columns]);

  if (!isOpen) return null;

  const handleAdd = (nameToAdd) => {
    const val = (nameToAdd || newColName).trim();
    if (!val) return;

    if (localCols.some(c => c.name.toLowerCase() === val.toLowerCase())) {
      alert(`Loại BHLĐ "${val}" đã có trong danh sách!`);
      return;
    }

    const newCol = {
      id: `bhld_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: val
    };

    // Insert before 'khac' if exists, otherwise at the end
    const khacIdx = localCols.findIndex(c => c.id === 'khac');
    if (khacIdx !== -1) {
      const next = [...localCols];
      next.splice(khacIdx, 0, newCol);
      setLocalCols(next);
    } else {
      setLocalCols([...localCols, newCol]);
    }

    setNewColName('');
  };

  const handleRemove = (id, name) => {
    if (localCols.length <= 1) {
      alert('Phải giữ lại ít nhất 1 loại bảo hộ lao động!');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa cột "${name}" khỏi dự án này?`)) {
      setLocalCols(localCols.filter(c => c.id !== id));
    }
  };

  const handleMove = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= localCols.length) return;
    const next = [...localCols];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setLocalCols(next);
  };

  const startEdit = (col) => {
    setEditingId(col.id);
    setEditingName(col.name);
  };

  const saveEdit = () => {
    if (!editingName.trim()) return;
    setLocalCols(localCols.map(c => c.id === editingId ? { ...c, name: editingName.trim() } : c));
    setEditingId(null);
  };

  const handleSaveAndClose = () => {
    onSave(localCols);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-500 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold leading-tight">Cấu Hình Loại Bảo Hộ Lao Động</h2>
              <p className="text-xs text-amber-100 font-medium">
                Dự án: <span className="font-bold underline">{projectName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Add form */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Thêm loại bảo hộ lao động mới
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                placeholder="VD: Nón bảo hộ, Giày bảo hộ, Dây an toàn..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => handleAdd()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition shrink-0 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Thêm cột
              </button>
            </div>

            {/* Quick suggested chips */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500">Gợi ý nhanh:</span>
              {SUGGESTED_ITEMS.map((item) => {
                const alreadyExists = localCols.some(c => c.name.toLowerCase() === item.toLowerCase());
                if (alreadyExists) return null;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleAdd(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200 transition"
                  >
                    <Plus className="w-3 h-3 text-amber-600" />
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Columns list table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Danh sách cột BHLĐ hiện tại ({localCols.length})
              </label>
              <span className="text-[11px] text-slate-500 italic">
                * Có thể bấm đổi tên hoặc di chuyển thứ tự
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">STT</th>
                    <th className="py-2.5 px-3">Tên Loại BHLĐ</th>
                    <th className="py-2.5 px-3 w-24 text-center">Thứ tự</th>
                    <th className="py-2.5 px-3 w-20 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {localCols.map((col, idx) => (
                    <tr key={col.id} className="hover:bg-amber-50/40 transition">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        {editingId === col.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit();
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              className="px-2 py-1 rounded-lg border border-amber-500 font-bold text-slate-800 text-xs w-full focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={saveEdit}
                              className="p-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              title="Lưu"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                              title="Hủy"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between group">
                            <span className="font-extrabold text-slate-800 text-sm">
                              {col.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => startEdit(col)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-amber-600 transition"
                              title="Đổi tên"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMove(idx, -1)}
                            className="p-1 rounded-md hover:bg-slate-100 text-slate-600 disabled:opacity-20 transition"
                            title="Di chuyển lên"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === localCols.length - 1}
                            onClick={() => handleMove(idx, 1)}
                            className="p-1 rounded-md hover:bg-slate-100 text-slate-600 disabled:opacity-20 transition"
                            title="Di chuyển xuống"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemove(col.id, col.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Xóa cột này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-white transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSaveAndClose}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
