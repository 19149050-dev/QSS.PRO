import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden transform animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2">
                {title || 'Xác nhận xóa'}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {message || 'Bạn có chắc chắn muốn thực hiện hành động này?'}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-gray-700 font-semibold rounded-xl border border-gray-300 hover:bg-gray-50 transition shadow-sm"
          >
            Hủy
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition shadow-md shadow-red-500/20"
          >
            Xác nhận Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
