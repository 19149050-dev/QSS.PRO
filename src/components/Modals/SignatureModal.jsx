'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { X, Upload, Edit3, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

export default function SignatureModal() {
  const { isSignatureModalOpen, setIsSignatureModalOpen, updateUserSignature, currentUser } = useStore();
  const [activeTab, setActiveTab] = useState('draw'); // 'draw' or 'upload'
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);

  useEffect(() => {
    if (isSignatureModalOpen && activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      // Set background to white (or transparent if preferred, we'll keep transparent)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [isSignatureModalOpen, activeTab]);

  if (!isSignatureModalOpen) return null;

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Support both mouse and touch
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000'; // Black signature
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    let signatureData = null;
    
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (canvas) {
        // Check if canvas is empty (simplified check)
        const ctx = canvas.getContext('2d');
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let isBlank = true;
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i+3] !== 0) { // check alpha
            isBlank = false;
            break;
          }
        }
        
        if (!isBlank) {
          signatureData = canvas.toDataURL('image/png');
        }
      }
    } else {
      signatureData = uploadedImage;
    }
    
    if (signatureData) {
      updateUserSignature(signatureData);
      setIsSignatureModalOpen(false);
    } else {
      useStore.getState().openGlobalAlert('Vui lòng tạo hoặc tải lên chữ ký trước khi lưu!', 'Thông báo');
    }
  };

  const onClose = () => {
    setIsSignatureModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-lg">Cập nhật chữ ký điện tử</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('draw')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'draw' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Edit3 className="w-4 h-4" />
            Vẽ trực tiếp
          </button>
          <button 
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'upload' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Upload className="w-4 h-4" />
            Tải ảnh lên
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-slate-50 flex gap-6 min-h-[300px]">
          {/* Left panel (Action) */}
          <div className="flex-1">
            {activeTab === 'draw' ? (
              <div className="flex flex-col h-full">
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Khu vực ký</p>
                <div className="flex-1 bg-white border-2 border-dashed border-slate-300 rounded-xl overflow-hidden relative cursor-crosshair">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={200}
                    className="w-full h-full touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <button 
                  onClick={clearCanvas}
                  className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-bold self-end"
                >
                  Xóa vẽ lại
                </button>
              </div>
            ) : (
              <div className="flex flex-col h-full justify-center">
                <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 rounded-xl cursor-pointer transition-colors group">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-500 mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-slate-700 text-sm">Bấm để chọn ảnh</span>
                  <span className="text-xs text-slate-500 mt-1">hoặc chụp trực tiếp từ điện thoại</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            )}
          </div>

          {/* Right panel (Preview) */}
          <div className="flex-1 flex flex-col">
            <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Bản xem trước (PNG)</p>
            <div className="flex-1 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden relative" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 0)', backgroundSize: '10px 10px' }}>
              {(activeTab === 'upload' && uploadedImage) ? (
                <img src={uploadedImage} alt="Signature Preview" className="max-w-full max-h-full object-contain" />
              ) : (activeTab === 'draw' || (activeTab === 'upload' && !uploadedImage)) ? (
                <div className="text-slate-400 flex flex-col items-center gap-2 opacity-50">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-sm font-semibold">Chưa có ảnh</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={handleSave}
            className="px-5 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Lưu chữ ký
          </button>
        </div>
      </div>
    </div>
  );
}
