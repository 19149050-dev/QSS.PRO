import React, { useState, useRef } from 'react';
import { X, Upload, Scan, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import Tesseract from 'tesseract.js';

export default function AddMemberModal({ isOpen, onClose, teamId }) {
  const { addTeamMember } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    cccd: '',
    birthYear: '',
    safetyCardExpiry: ''
  });
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    setScanSuccess(false);

    try {
      const result = await Tesseract.recognize(
        file,
        'vie',
        { logger: m => console.log(m) }
      );
      
      const text = result.data.text;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      // 1. Extract CCCD Number
      const cccdMatch = text.match(/\d{12}/);
      const cccd = cccdMatch ? cccdMatch[0] : '';
      
      // 2. Extract Birth Year
      let birthYear = '';
      
      // MẸO: Trích xuất năm sinh trực tiếp từ mã số CCCD (độ chính xác 100%)
      // CCCD gồm 12 số: 3 số đầu mã tỉnh, 1 số giới tính/thế kỷ, 2 số đuôi năm sinh, 6 số ngẫu nhiên
      if (cccd && cccd.length === 12) {
        const centuryGenderCode = parseInt(cccd.charAt(3), 10);
        const yearSuffix = cccd.substring(4, 6);
        
        // 0, 1: Thế kỷ 20 (19xx)
        if (centuryGenderCode === 0 || centuryGenderCode === 1) {
           birthYear = '19' + yearSuffix;
        } 
        // 2, 3: Thế kỷ 21 (20xx)
        else if (centuryGenderCode === 2 || centuryGenderCode === 3) {
           birthYear = '20' + yearSuffix;
        }
      }
      
      // Nếu không trích được từ CCCD (do đọc sai mã), thì thử quét trên văn bản
      if (!birthYear) {
        const dobMatch = text.match(/\d{1,2}\s*[\/\-\.]\s*\d{1,2}\s*[\/\-\.]\s*(\d{4})/);
        if (dobMatch) {
           birthYear = dobMatch[1];
        } else {
           const yearMatch = text.match(/(19|20)\d{2}/);
           if (yearMatch) birthYear = yearMatch[0];
        }
      }
      
      // 3. Extract Name
      let extractedName = '';
      let cccdLineIndex = -1;
      
      // Find the index of the line containing the CCCD
      if (cccd) {
         cccdLineIndex = lines.findIndex(line => line.includes(cccd));
      }
      
      // Search for name after CCCD number line (usually 1-3 lines after)
      // Name is always ALL CAPS and has multiple words
      const searchStartIndex = cccdLineIndex !== -1 ? cccdLineIndex + 1 : 0;
      
      for (let i = searchStartIndex; i < lines.length; i++) {
         const line = lines[i];
         // Clean noise characters from the line
         let cleanLine = line.replace(/[:\-0-9,.]/g, '').trim();
         // Remove stray single letter at the beginning of the name (e.g., "L PHAN VĂN HON" -> "PHAN VĂN HON")
         cleanLine = cleanLine.replace(/^[A-Z]\s/, '').trim();
         
         const upperLine = cleanLine.toUpperCase();
         
         if (
           cleanLine.length > 5 && 
           cleanLine === upperLine && 
           cleanLine.split(' ').length >= 2
         ) {
            // Exclude common static text
            if (
              !cleanLine.includes('CỘNG HÒA') && 
              !cleanLine.includes('ĐỘC LẬP') && 
              !cleanLine.includes('CĂN CƯỚC') && 
              !cleanLine.includes('VIỆT NAM') && 
              !cleanLine.includes('GIÁM ĐỐC') && 
              !cleanLine.includes('HỌ VÀ TÊN') && 
              !cleanLine.includes('CITIZEN') &&
              !cleanLine.includes('DATE OF') &&
              !cleanLine.includes('IDENTITY')
            ) {
               extractedName = cleanLine;
               break; // Found the name
            }
         }
      }

      setFormData(prev => ({
        ...prev,
        name: extractedName || '',
        cccd: cccd || '',
        birthYear: birthYear || ''
      }));

      setScanSuccess(true);
    } catch (error) {
      console.error("Lỗi scan CCCD:", error);
      alert("Không thể đọc ảnh, vui lòng thử lại hoặc nhập tay.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.cccd) {
      alert("Vui lòng điền đủ Họ và tên và số CCCD");
      return;
    }
    
    addTeamMember(teamId, {
      name: formData.name,
      cccd: formData.cccd,
      birthYear: formData.birthYear,
      safetyCardExpiry: formData.safetyCardExpiry || 'Chưa có',
      photo: '', // could add photo preview
      pdf: ''
    });

    // Reset and close
    setFormData({ name: '', cccd: '', birthYear: '', safetyCardExpiry: '' });
    setScanSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
          <h3 className="text-white font-extrabold text-sm uppercase tracking-wide">
            Thêm Thành Viên Mới
          </h3>
          <button 
            onClick={onClose}
            className="text-indigo-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* CCCD Scanner Box */}
          <div className="bg-slate-50 border-2 border-dashed border-indigo-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
            />
            
            {isScanning ? (
              <div className="flex flex-col items-center text-indigo-600 animate-pulse">
                <Scan className="w-10 h-10 mb-3 animate-spin-slow" />
                <p className="text-xs font-bold uppercase tracking-wider">Đang quét CCCD...</p>
              </div>
            ) : scanSuccess ? (
              <div className="flex flex-col items-center text-emerald-600">
                <CheckCircle2 className="w-10 h-10 mb-2" />
                <p className="text-xs font-bold uppercase">Trích xuất thành công</p>
                <button onClick={handleUploadClick} className="text-xs text-indigo-500 hover:underline mt-1">Quét lại</button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-extrabold text-gray-800 mb-1">Tải ảnh CCCD lên</h4>
                <p className="text-xs text-gray-500 max-w-[200px] mb-4">
                  Hệ thống sẽ tự động quét và điền thông tin (Họ tên, CCCD, Năm sinh)
                </p>
                <button 
                  onClick={handleUploadClick}
                  type="button"
                  className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg text-xs font-bold border border-indigo-200 transition-colors"
                >
                  Chọn ảnh / Chụp CCCD
                </button>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase mb-1">Họ và Tên *</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                placeholder="Nguyễn Văn A"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase mb-1">Số CCCD *</label>
                <input 
                  type="text" 
                  value={formData.cccd}
                  onChange={e => setFormData({...formData, cccd: e.target.value})}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  placeholder="079..."
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase mb-1">Năm sinh</label>
                <input 
                  type="text" 
                  value={formData.birthYear}
                  onChange={e => setFormData({...formData, birthYear: e.target.value})}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  placeholder="VD: 1990"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase mb-1 flex items-center justify-between">
                <span>Hạn Thẻ An Toàn</span>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, safetyCardExpiry: 'Chưa có'})}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded border border-slate-200"
                >
                  Chưa có thẻ
                </button>
              </label>
              <input 
                type="text" 
                value={formData.safetyCardExpiry}
                onChange={e => setFormData({...formData, safetyCardExpiry: e.target.value})}
                className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                placeholder="VD: 15/08/2026 hoặc Chưa có"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!formData.name || !formData.cccd}
            className="px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-colors"
          >
            Lưu Thành Viên
          </button>
        </div>
      </div>
    </div>
  );
}
