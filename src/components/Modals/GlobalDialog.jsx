import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export default function GlobalDialog() {
  const { globalDialog, closeGlobalDialog } = useStore();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (globalDialog.isOpen) {
      setInputValue(globalDialog.defaultValue || '');
      if (globalDialog.type === 'prompt') {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  }, [globalDialog.isOpen, globalDialog.defaultValue, globalDialog.type]);

  if (!globalDialog.isOpen) return null;

  const handleConfirm = () => {
    if (globalDialog.onConfirm) {
      if (globalDialog.type === 'prompt') {
        globalDialog.onConfirm(inputValue);
      } else {
        globalDialog.onConfirm();
      }
    }
    closeGlobalDialog();
  };

  const handleCancel = () => {
    if (globalDialog.onCancel) {
      globalDialog.onCancel();
    }
    closeGlobalDialog();
  };

  const getIcon = () => {
    switch (globalDialog.type) {
      case 'alert':
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      case 'confirm':
        return <Info className="w-6 h-6 text-blue-500" />;
      case 'prompt':
        return <CheckCircle className="w-6 h-6 text-indigo-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={handleCancel}
      />
      
      {/* Dialog Box */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[90%] max-w-md mx-auto overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 p-2 bg-slate-50 rounded-full">
              {getIcon()}
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {globalDialog.title}
              </h3>
              <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                {globalDialog.message}
              </p>
              
              {globalDialog.type === 'prompt' && (
                <div className="mt-4">
                  <input
                    ref={inputRef}
                    type={globalDialog.inputType || 'text'}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirm();
                      if (e.key === 'Escape') handleCancel();
                    }}
                    placeholder={globalDialog.inputPlaceholder || 'Nhập giá trị...'}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-shadow"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100">
          {(globalDialog.type === 'confirm' || globalDialog.type === 'prompt') && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Hủy
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            {globalDialog.type === 'alert' ? 'Đóng' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}
