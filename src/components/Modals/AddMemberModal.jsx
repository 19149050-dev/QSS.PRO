import React, { useState, useEffect } from 'react';
import { X, UserCircle2, Upload, FileText } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function AddMemberModal({ isOpen, onClose, teamId, memberToEdit }) {
  const { addTeamMember, updateTeamMember, teams } = useStore();
  
  const team = teams.find(t => t.id === teamId);
  const leaderName = team?.leaderName || '';
  
  // Find all projects that this leader is involved in
  const leaderProjects = [...new Set(
    teams.filter(t => t.leaderName === leaderName).map(t => t.projectName).filter(Boolean)
  )];

  const [member, setMember] = useState({
    name: '',
    cccd: '',
    birthYear: '',
    safetyCardExpiry: '',
    insuranceExpiry: '',
    photo: '',
    pdf: [],
    project: ''
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (memberToEdit) {
        setMember(memberToEdit);
      } else {
        setMember({
          name: '',
          cccd: '',
          birthYear: '',
          safetyCardExpiry: '',
          insuranceExpiry: '',
          photo: '',
          pdf: [],
          project: ''
        });
      }
    }
  }, [isOpen, memberToEdit]);

  if (!isOpen) return null;

  const updateMember = (field, value) => {
    setMember(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateMember('photo', event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      Promise.all(files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve({ name: file.name, data: event.target.result });
          };
          reader.readAsDataURL(file);
        });
      })).then(results => {
        const currentPdfs = member.pdf || [];
        updateMember('pdf', [...currentPdfs, ...results]);
      });
    }
  };

  const removePdf = (index) => {
    const newPdfs = [...member.pdf];
    newPdfs.splice(index, 1);
    updateMember('pdf', newPdfs);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!member.name || !member.cccd) {
      alert("Vui lòng điền đủ Họ tên và số CCCD.");
      return;
    }
    
    const memberData = {
      name: member.name,
      cccd: member.cccd,
      birthYear: member.birthYear,
      safetyCardExpiry: member.safetyCardExpiry || 'Chưa có',
      insuranceExpiry: member.insuranceExpiry || 'Chưa có',
      photo: member.photo || '',
      pdf: member.pdf || [],
      project: member.project || ''
    };

    if (memberToEdit) {
      updateTeamMember(teamId, memberToEdit.id, memberData);
    } else {
      addTeamMember(teamId, memberData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between shrink-0">
          <h3 className="text-white font-extrabold text-sm uppercase tracking-wide">
            Thêm Thành Viên Mới
          </h3>
          <button onClick={onClose} className="text-indigo-200 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-32 bg-gray-50 rounded-lg overflow-hidden shrink-0 border-2 border-dashed border-gray-300 flex items-center justify-center relative group/avatar cursor-pointer hover:border-indigo-400 transition-colors">
                  {member.photo ? (
                    <img src={member.photo} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle2 className="w-10 h-10 text-gray-300" />
                  )}
                  <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                      <Upload className="w-5 h-5 text-white mb-1" />
                      <span className="text-[10px] text-white font-bold uppercase">Tải Ảnh</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
              </div>
              
              {/* Fields */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Họ và tên *</label>
                    <input 
                      type="text" 
                      value={member.name}
                      onChange={e => updateMember('name', e.target.value)}
                      className="w-full text-sm px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-bold text-gray-800 transition-all placeholder:font-normal"
                      placeholder="Nhập họ tên"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Số CCCD *</label>
                    <input 
                      type="text" 
                      value={member.cccd}
                      onChange={e => updateMember('cccd', e.target.value)}
                      className="w-full text-sm px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-bold text-gray-700 transition-all placeholder:font-normal"
                      placeholder="Nhập CCCD"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Công trình</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={member.project}
                    onChange={(e) => setMember({...member, project: e.target.value})}
                  >
                    <option value="">-- Chọn công trình --</option>
                    {leaderProjects.map((p, idx) => (
                      <option key={idx} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Năm sinh</label>
                    <input 
                      type="text" 
                      value={member.birthYear}
                      onChange={e => updateMember('birthYear', e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-medium text-gray-700 transition-all"
                      placeholder="Ví dụ: 1990"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Hạn thẻ an toàn</label>
                    <input 
                      type="text" 
                      value={member.safetyCardExpiry}
                      onChange={e => updateMember('safetyCardExpiry', e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-medium text-gray-700 transition-all"
                      placeholder="dd/mm/yyyy"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Hạn bảo hiểm</label>
                    <input 
                      type="text" 
                      value={member.insuranceExpiry}
                      onChange={e => updateMember('insuranceExpiry', e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-medium text-gray-700 transition-all"
                      placeholder="dd/mm/yyyy"
                    />
                  </div>
                </div>
                
                {/* PDF Upload Area */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-[11px] font-extrabold text-gray-600 uppercase">Hồ sơ đính kèm (PDF)</h5>
                      <label className="cursor-pointer flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                        <Upload className="w-3.5 h-3.5" /> Tải lên
                        <input type="file" accept="application/pdf" multiple className="hidden" onChange={handlePdfUpload} />
                      </label>
                    </div>
                    {(!member.pdf || member.pdf.length === 0) ? (
                      <p className="text-[11px] text-gray-400 italic">Chưa có file nào.</p>
                    ) : (
                      <div className="space-y-1.5">
                          {member.pdf.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 px-2.5 py-1.5 rounded-md">
                              <div className="flex items-center gap-2 overflow-hidden">
                                  <FileText className="w-4 h-4 text-red-500 shrink-0" />
                                  <span className="text-xs text-gray-700 truncate font-medium">{p.name}</span>
                              </div>
                              <button onClick={() => removePdf(idx)} className="text-gray-400 hover:text-red-500 p-1" title="Xóa file">
                                  <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit}
            className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_16px_rgba(79,70,229,0.4)] transition-all"
          >
            Lưu Thành Viên
          </button>
        </div>
      </div>
    </div>
  );
}
