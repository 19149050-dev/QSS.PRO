'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { X, FolderGit2 } from 'lucide-react';

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AddShopDrawingModal({ isOpen, onClose, defaultProject = 'ALL' }) {
  const { projects, shopDrawings, addShopDrawing } = useStore();
  
  const [newProjectName, setNewProjectName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDrawingName, setNewDrawingName] = useState('');
  const [newApprovalDate, setNewApprovalDate] = useState(getTodayString());
  const [newStatus, setNewStatus] = useState('Đã duyệt');
  const [newNote, setNewNote] = useState('');

  const calculateNextCode = (project) => {
    let relevantDrawings = shopDrawings || [];
    if (project && project !== 'ALL') {
      relevantDrawings = relevantDrawings.filter(s => s.project_name === project);
    }
    const codes = relevantDrawings.map(s => s.code).filter(Boolean);
    if (codes.length === 0) return 'BV-01';
    
    let maxPrefix = 'BV-';
    let maxNum = 0;
    
    for (const code of codes) {
      const match = code.match(/^(.*?)(\d+)$/);
      if (match) {
        const num = parseInt(match[2], 10);
        if (num > maxNum) {
          maxNum = num;
          maxPrefix = match[1];
        }
      }
    }
    
    if (maxNum === 0) return 'BV-01';
    
    const nextNum = maxNum + 1;
    const padding = String(maxNum).length > 2 ? String(maxNum).length : 2;
    return `${maxPrefix}${String(nextNum).padStart(padding, '0')}`;
  };

  useEffect(() => {
    if (isOpen) {
      const p = defaultProject !== 'ALL' ? defaultProject : (projects?.[0]?.name || '');
      setNewProjectName(p);
      setNewCode(calculateNextCode(p));
      setNewDrawingName('');
      setNewApprovalDate(getTodayString());
      setNewStatus('Đã duyệt');
      setNewNote('');
    }
  }, [isOpen, defaultProject, projects, shopDrawings]);

  useEffect(() => {
    if (isOpen && newProjectName) {
      setNewCode(calculateNextCode(newProjectName));
    }
  }, [newProjectName]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newDrawingName.trim()) return;
    
    addShopDrawing({
      drawingName: newDrawingName.trim(),
      projectName: newProjectName,
      code: newCode.trim(),
      approvalDate: newApprovalDate || null,
      status: newStatus,
      note: newNote.trim()
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
        <div className="p-6 rounded-t-2xl bg-[#0a0a0a] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FolderGit2 className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">Thêm Bản vẽ Shop mới</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-sm">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">Mã bản vẽ (Code)</label>
              <input
                type="text"
                placeholder="VD: BV-01"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">Tên công trình <span className="text-red-500">*</span></label>
              <select
                required
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-700"
              >
                <option value="">(Không chọn)</option>
                {projects?.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1.5">Tên bản vẽ <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              placeholder="Nhập tên bản vẽ..."
              value={newDrawingName}
              onChange={(e) => setNewDrawingName(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">Ngày duyệt</label>
              <input
                type="date"
                value={newApprovalDate}
                onChange={(e) => setNewApprovalDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">Trạng thái</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-700"
              >
                <option value="Đã duyệt">Đã duyệt</option>
                <option value="Đang trình duyệt">Đang trình duyệt</option>
                <option value="Chưa trình duyệt">Chưa trình duyệt</option>
                <option value="Không duyệt">Không duyệt</option>
                <option value="Đã hủy">Đã hủy</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1.5">Ghi chú</label>
            <textarea
              placeholder="Ghi chú thêm về bản vẽ..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
            >
              Tạo mới
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
