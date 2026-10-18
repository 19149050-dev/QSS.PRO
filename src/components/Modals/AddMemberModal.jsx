'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserCircle2, 
  Upload, 
  FileText, 
  ScanLine, 
  Camera, 
  FileSpreadsheet, 
  Download, 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  Sparkles, 
  Users,
  AlertCircle,
  Clipboard
} from 'lucide-react';
import { useStore, canUserManageTeamMembers } from '@/store/useStore';
import { scanCccdImage } from '@/utils/cccdScanner';
import { exportToExcel } from '@/utils/exportUtils';
import { cropImageTo3x4, extractImageFromClipboard, readImageFromClipboardAsync } from '@/utils/imageUtils';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export default function AddMemberModal({ isOpen, onClose, teamId, memberToEdit }) {
  const { addTeamMember, addTeamMembersBatch, updateTeamMember, teams } = useStore();
  const currentUser = useStore(state => state.currentUser);
  const allProjects = useStore(state => state.projects);
  
  const team = teams.find(t => t.id === teamId);
  const leaderName = team?.leaderName || '';
  const canManageTeam = canUserManageTeamMembers(currentUser, team, allProjects);

  // Mode: 'single' (Thêm 1 thành viên) | 'batch' (Thêm nhiều thành viên hàng loạt)
  const [modalMode, setModalMode] = useState('single');

  // Single Member Form State
  const defaultMember = {
    name: '',
    position: 'CN',
    age: '',
    cccd: '',
    birthYear: '',
    issueDate: '',
    address: '',
    vocationalCertificate: '',
    safetyCardExpiry: '',
    insuranceExpiry: '',
    healthCertificate: '',
    contract: '',
    notes: '',
    photo: '',
    pdf: [],
    project: ''
  };

  const [member, setMember] = useState(defaultMember);
  const [error, setError] = useState('');
  const [isScanningSingle, setIsScanningSingle] = useState(false);

  // Batch Members State
  const [batchMembers, setBatchMembers] = useState([]);
  const [isScanningBatch, setIsScanningBatch] = useState(false);
  const [scanProgress, setScanProgress] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setIsScanningSingle(false);
      setIsScanningBatch(false);
      setScanProgress(null);
      if (memberToEdit) {
        setModalMode('single');
        setMember({ ...defaultMember, ...memberToEdit, position: (!memberToEdit.position || memberToEdit.position.trim().toLowerCase() === 'công nhân') ? 'CN' : memberToEdit.position });
      } else {
        setMember(defaultMember);
        // Start with 1 empty row in batch mode if empty
        setBatchMembers([
          {
            id: `m-temp-0`,
            name: '',
            position: 'CN',
            cccd: '',
            birthYear: '',
            age: '',
            issueDate: '',
            address: '',
            vocationalCertificate: 'Công nhân',
            safetyCardExpiry: 'Chưa có',
            insuranceExpiry: 'Chưa có',
            healthCertificate: '',
            contract: '',
            notes: '',
            photo: ''
          }
        ]);
      }
    }
  }, [isOpen, memberToEdit]);

  // Single Member Handlers
  const updateMember = (field, value) => {
    setMember(prev => ({ ...prev, [field]: value }));
  };

  const handleBirthDateChange = (dateStr) => {
    let ageStr = '';
    let formattedDate = dateStr;
    if (dateStr) {
      const birthDate = new Date(dateStr);
      const today = new Date();
      let years = today.getFullYear() - birthDate.getFullYear();
      let months = today.getMonth() - birthDate.getMonth();
      
      if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
        years--;
        months += 12;
      }
      
      if (years > 0) {
        ageStr = months > 0 ? `${years} tuổi ${months} tháng` : `${years} tuổi`;
      } else if (months > 0) {
        ageStr = `${months} tháng tuổi`;
      }

      const [y, m, d] = dateStr.split('-');
      formattedDate = `${d}/${m}/${y}`;
    }
    setMember(prev => ({ ...prev, birthYear: formattedDate, age: ageStr }));
  };

  const processAndSetAvatar = async (fileOrBlobOrUrl) => {
    try {
      const cropped = await cropImageTo3x4(fileOrBlobOrUrl, 360, 480);
      if (cropped) {
        updateMember('photo', cropped);
        toast.success('Đã dán/tải ảnh đại diện 3x4 thành công!');
      }
    } catch (err) {
      console.error('Lỗi xử lý ảnh đại diện:', err);
      toast.error('Không thể xử lý ảnh đại diện.');
    }
  };

  // Lắng nghe sự kiện phím dán ảnh (Ctrl + V) toàn form khi ở mode thêm/sửa 1 thành viên
  useEffect(() => {
    if (!isOpen || modalMode !== 'single') return;

    const handleWindowPaste = async (e) => {
      const imgFile = extractImageFromClipboard(e);
      if (imgFile) {
        e.preventDefault();
        e.stopPropagation();
        await processAndSetAvatar(imgFile);
      }
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => {
      window.removeEventListener('paste', handleWindowPaste);
    };
  }, [isOpen, modalMode]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await processAndSetAvatar(file);
      e.target.value = '';
    }
  };

  const handlePasteAvatarClick = async () => {
    try {
      const blob = await readImageFromClipboardAsync();
      if (blob) {
        await processAndSetAvatar(blob);
        return;
      }
      toast.info('Hãy chụp màn hình (Win + Shift + S), sau đó nhấn phím Ctrl + V để dán ảnh.');
    } catch (err) {
      toast.info('Nhấn tổ hợp phím Ctrl + V để dán ảnh đã chụp.');
    }
  };

  // CCCD Scan for Single Member
  const handleSingleCccdUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanningSingle(true);
    const loadingToast = toast.loading('Đang đọc thông tin từ ảnh thẻ...');
    try {
      const dataUrl = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = ev => res(ev.target.result);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });

      const res = await scanCccdImage(dataUrl);
      toast.dismiss(loadingToast);

      if (res.success && res.data) {
        const d = res.data;
        let avatar = d.avatarPhoto || dataUrl;
        if (avatar) {
          try {
            avatar = await cropImageTo3x4(avatar, 360, 480);
          } catch (e) {
            console.warn('Lỗi crop 3x4 avatar từ CCCD:', e);
          }
        }
        const cleanBirthYear = d.birthYear ? d.birthYear.replace(/\s+/g, '') : '';
        const cleanIssueDate = d.issueDate ? (
          d.issueDate.includes('/') ? d.issueDate.split('/').reverse().join('-') : d.issueDate
        ) : '';
        setMember(prev => ({
          ...prev,
          name: d.name || prev.name,
          cccd: d.cccd || prev.cccd,
          birthYear: cleanBirthYear || prev.birthYear,
          age: d.age || prev.age,
          address: d.address || prev.address,
          issueDate: cleanIssueDate || prev.issueDate,
          photo: avatar || prev.photo,
          position: (!prev.position || prev.position.trim().toLowerCase() === 'công nhân') ? 'CN' : prev.position
        }));

        const extractedFields = [
          d.name && `Họ tên: ${d.name}`,
          d.cccd && `Số CCCD: ${d.cccd}`,
          d.birthYear && `Ngày sinh: ${d.birthYear}`
        ].filter(Boolean).join(' • ');

        toast.success(`Đã lấy thông tin từ ảnh thành công! (${extractedFields || 'Đã điền vào form'})`, { duration: 5000 });
      } else {
        setMember(prev => ({ ...prev, photo: dataUrl }));
        toast.error(res.error || 'Không nhận diện được rõ chữ trên ảnh thẻ. Đã lưu ảnh vào hồ sơ.', { duration: 6000 });
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error('Single scan error:', err);
      toast.error('Có lỗi xảy ra khi xử lý ảnh thẻ.');
    } finally {
      setIsScanningSingle(false);
      e.target.value = '';
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

  const handleSubmitSingle = (e) => {
    e.preventDefault();
    if (!canManageTeam) {
      toast.error('Bạn là GSHT không phụ trách công trình của tổ đội này nên không có quyền thêm hoặc sửa thành viên.');
      return;
    }
    if (!member.name.trim()) {
      setError("Vui lòng điền Họ và tên thành viên.");
      return;
    }
    setError('');
    
    const memberData = {
      ...member,
      position: (!member.position || member.position.trim().toLowerCase() === 'công nhân') ? 'CN' : member.position.trim(),
      safetyCardExpiry: member.safetyCardExpiry || 'Chưa có',
      insuranceExpiry: member.insuranceExpiry || 'Chưa có',
    };

    if (memberToEdit) {
      updateTeamMember(teamId, memberToEdit.id, memberData);
      toast.success("Đã cập nhật thông tin thành viên thành công!");
    } else {
      addTeamMember(teamId, memberData);
      toast.success("Đã thêm thành viên mới vào tổ đội!");
    }

    onClose();
  };

  // Batch Members Handlers
  const handleAddEmptyBatchRow = () => {
    setBatchMembers(prev => [
      ...prev,
      {
        id: `m-temp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: '',
        position: 'CN',
        cccd: '',
        birthYear: '',
        age: '',
        issueDate: '',
        address: '',
        vocationalCertificate: 'Công nhân',
        safetyCardExpiry: 'Chưa có',
        insuranceExpiry: 'Chưa có',
        healthCertificate: '',
        contract: '',
        notes: '',
        photo: ''
      }
    ]);
  };

  const updateBatchRow = (id, field, value) => {
    setBatchMembers(prev => prev.map(m => {
      if (m.id === id) {
        const updated = { ...m, [field]: value };
        // Auto compute age if birthYear changes
        if (field === 'birthYear' && value) {
          let yr = '';
          if (value.includes('/')) {
            const parts = value.split('/');
            yr = parts[parts.length - 1];
          } else if (value.includes('-')) {
            const parts = value.split('-');
            yr = parts[0];
          } else if (value.length === 4) {
            yr = value;
          }
          if (yr && yr.length === 4) {
            const ageNum = new Date().getFullYear() - parseInt(yr, 10);
            if (ageNum > 0 && ageNum < 100) {
              updated.age = `${ageNum} tuổi`;
            }
          }
        }
        return updated;
      }
      return m;
    }));
  };

  const removeBatchRow = (id) => {
    setBatchMembers(prev => prev.filter(m => m.id !== id));
  };

  // Batch Multiple CCCD Photos Upload
  const handleMultipleCccdUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsScanningBatch(true);
    setScanProgress({ current: 0, total: files.length, text: `Bắt đầu quét ${files.length} ảnh CCCD...` });

    const extractedList = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setScanProgress({ current: i + 1, total: files.length, text: `Đang quét ảnh ${i + 1}/${files.length} (${file.name})...` });

      try {
        const dataUrl = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = ev => res(ev.target.result);
          reader.onerror = rej;
          reader.readAsDataURL(file);
        });

        const scanResult = await scanCccdImage(dataUrl);
        if (scanResult.success && scanResult.data) {
          const d = scanResult.data;
          extractedList.push({
            id: `m-temp-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
            name: d.name || '',
            position: 'CN',
            cccd: d.cccd || '',
            birthYear: d.birthYear ? d.birthYear.replace(/\s+/g, '') : '',
            age: d.age || '',
            issueDate: d.issueDate || '',
            address: d.address || '',
            vocationalCertificate: 'Công nhân',
            safetyCardExpiry: 'Chưa có',
            insuranceExpiry: 'Chưa có',
            healthCertificate: '',
            contract: '',
            notes: `Quét từ CCCD (${scanResult.method})`,
            photo: d.avatarPhoto || dataUrl
          });
        } else {
          extractedList.push({
            id: `m-temp-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
            name: '',
            position: 'CN',
            cccd: '',
            birthYear: '',
            age: '',
            issueDate: '',
            address: '',
            vocationalCertificate: 'Công nhân',
            safetyCardExpiry: 'Chưa có',
            insuranceExpiry: 'Chưa có',
            healthCertificate: '',
            contract: '',
            notes: 'Không đọc được QR (kiểm tra ảnh)',
            photo: dataUrl
          });
        }
      } catch (err) {
        console.error('Error scanning file:', file.name, err);
      }
    }

    setIsScanningBatch(false);
    setScanProgress(null);

    if (extractedList.length > 0) {
      setBatchMembers(prev => {
        // filter out initial empty placeholder if any
        const filteredPrev = prev.filter(m => m.name.trim() !== '' || m.cccd.trim() !== '');
        return [...filteredPrev, ...extractedList];
      });
      const successCount = extractedList.filter(m => m.name).length;
      toast.success(`Đã quét xong ${files.length} ảnh (${successCount} thành công)!`);
    }
  };

  // Excel Template Download
  const handleDownloadExcelTemplate = () => {
    const templateData = [
      {
        "Họ và Tên": "Nguyễn Văn An",
        "Chức vụ": "CN",
        "Số CCCD": "001095012345",
        "Năm sinh": "15/08/1995",
        "Ngày cấp": "2021-04-20",
        "Địa chỉ": "Xã Hòa Bình, Huyện Thường Tín, TP Hà Nội",
        "Bằng cấp nghề": "Công nhân",
        "Ghi chú": ""
      },
      {
        "Họ và Tên": "Trần Thị Bình",
        "Chức vụ": "Thợ phụ",
        "Số CCCD": "001198054321",
        "Năm sinh": "02/11/1998",
        "Ngày cấp": "2022-06-15",
        "Địa chỉ": "Phường Bến Nghé, Quận 1, TP Hồ Chí Minh",
        "Bằng cấp nghề": "Công nhân",
        "Ghi chú": ""
      }
    ];
    exportToExcel(templateData, 'Mau_Nhap_Thanh_Vien_To_Doi', 'Mẫu Thành Viên');
  };

  // Import from Excel file
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const imported = json.map((row, idx) => ({
          id: `m-temp-xl-${Date.now()}-${idx}`,
          name: row['Họ và Tên'] || row['Họ và tên'] || row['Họ Tên'] || row['name'] || '',
          position: (() => {
            const p = (row['Chức vụ'] || row['chức vụ'] || '').trim();
            return (!p || p.toLowerCase() === 'công nhân') ? 'CN' : p;
          })(),
          cccd: String(row['Số CCCD'] || row['CCCD'] || row['cccd'] || ''),
          birthYear: String(row['Năm sinh'] || row['Ngày sinh'] || row['Năm Sinh'] || ''),
          age: row['Tuổi'] ? String(row['Tuổi']) : '',
          issueDate: String(row['Ngày cấp'] || row['Ngày cấp CCCD'] || ''),
          address: row['Địa chỉ'] || row['Nơi thường trú'] || '',
          vocationalCertificate: row['Bằng cấp nghề'] || 'Công nhân',
          safetyCardExpiry: row['Chứng chỉ AT'] || 'Chưa có',
          insuranceExpiry: row['Bảo hiểm tai nạn'] || 'Chưa có',
          healthCertificate: row['Giấy khám SK'] || '',
          contract: row['HĐLĐ'] || '',
          notes: row['Ghi chú'] || '',
          photo: ''
        })).filter(m => m.name.trim().length > 0);

        if (imported.length > 0) {
          setBatchMembers(prev => {
            const filteredPrev = prev.filter(m => m.name.trim() !== '' || m.cccd.trim() !== '');
            return [...filteredPrev, ...imported];
          });
          toast.success(`Đã nhập thành công ${imported.length} thành viên từ file Excel!`);
        } else {
          toast.error('File Excel không có dữ liệu hợp lệ.');
        }
      } catch (err) {
        console.error('Error reading excel:', err);
        toast.error('Lỗi khi đọc file Excel.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Submit Batch Members
  const handleSubmitBatch = () => {
    if (!canManageTeam) {
      toast.error('Bạn là GSHT không phụ trách công trình của tổ đội này nên không có quyền thêm thành viên.');
      return;
    }
    const validMembers = batchMembers.filter(m => m.name.trim().length > 0);
    if (validMembers.length === 0) {
      toast.error('Vui lòng điền ít nhất 1 thành viên có Họ và Tên hợp lệ.');
      return;
    }

    if (addTeamMembersBatch) {
      addTeamMembersBatch(teamId, validMembers);
    } else {
      validMembers.forEach(m => addTeamMember(teamId, m));
    }

    toast.success(`Đã thêm thành công ${validMembers.length} thành viên vào tổ đội!`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${modalMode === 'batch' ? 'max-w-6xl' : 'max-w-4xl'} max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
        {/* Modal Header */}
        <div className="bg-indigo-600 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-white font-black text-sm uppercase tracking-wide">
              {memberToEdit ? 'Chỉnh Sửa Thông Tin Thành Viên' : 'Thêm Thành Viên Vào Tổ Đội'}
            </h3>
            {team && (
              <span className="text-xs font-bold text-indigo-100 bg-indigo-700/80 px-2.5 py-0.5 rounded-full">
                {team.teamName}
              </span>
            )}
          </div>

          <button onClick={onClose} className="text-indigo-200 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Subheader with Mode Tabs (Only when adding new member) */}
        {!memberToEdit && (
          <div className="bg-slate-100 border-b border-gray-200 px-6 py-2.5 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setModalMode('single')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                  modalMode === 'single'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <UserCircle2 className="w-4 h-4" />
                <span>Thêm 1 Thành Viên</span>
              </button>

              <button
                type="button"
                onClick={() => setModalMode('batch')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                  modalMode === 'batch'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Thêm Nhiều Thành Viên (Hàng Loạt)</span>
                {batchMembers.filter(m => m.name.trim()).length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    modalMode === 'batch' ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {batchMembers.filter(m => m.name.trim()).length}
                  </span>
                )}
              </button>
            </div>

            <div className="text-[11px] text-gray-500 font-semibold hidden sm:block">
              {modalMode === 'single' ? 'Điền form hoặc quét trực tiếp ảnh thẻ CCCD' : 'Quét nhiều ảnh CCCD cùng lúc hoặc nhập từ Excel'}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-slate-50 space-y-4">
          {!canManageTeam && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-2.5 shadow-2xs">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
              <span>GSHT chỉ được tạo thành viên cho tổ đội làm công trình mình được phân công phụ trách. Bạn hiện không phụ trách công trình của tổ đội này ({team?.teamName}).</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ===================== MODE 1: SINGLE MEMBER FORM ===================== */}
          {modalMode === 'single' && (
            <div className="space-y-4">
              {/* CCCD Quick Scan Banner */}
              <div className="bg-gradient-to-r from-indigo-50/95 via-purple-50/95 to-blue-50/95 border-2 border-dashed border-indigo-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                    <ScanLine className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-gray-900 flex items-center gap-1.5 flex-wrap">
                      <span>Tự Động Đọc Thông Tin Từ Ảnh Thẻ CCCD / Căn Cước</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        ⚡ AI Nhận Diện Chữ & Ảnh Đại Diện
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-600 font-medium mt-1">
                      Tải ảnh thẻ lên — Hệ thống sẽ tự động đọc Họ tên, Số CCCD, Ngày sinh, Địa chỉ từ ảnh và điền ngay vào các ô bên dưới.
                    </div>
                  </div>
                </div>

                <label className={`cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-sm transition shrink-0 ${
                  isScanningSingle 
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                }`}>
                  {isScanningSingle ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang Đọc Thông Tin...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>Tải Ảnh Thẻ Lên (Tự Động Điền)</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    disabled={isScanningSingle} 
                    onChange={handleSingleCccdUpload} 
                  />
                </label>
              </div>

              {/* Form Input Container */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Avatar Upload with Paste (Ctrl+V) & 3x4 crop */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div 
                      tabIndex={0}
                      title="Bấm vào đây hoặc nhấn phím Ctrl+V để dán ảnh đã chụp màn hình"
                      onPaste={async (e) => {
                        const img = extractImageFromClipboard(e);
                        if (img) {
                          e.preventDefault();
                          await processAndSetAvatar(img);
                        }
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={async (e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file && file.type.startsWith('image/')) {
                          await processAndSetAvatar(file);
                        }
                      }}
                      className="w-28 h-36 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border-2 border-dashed border-indigo-200 hover:border-indigo-500 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 focus:outline-none flex flex-col items-center justify-center relative group/avatar cursor-pointer transition-all shadow-xs"
                    >
                      {member.photo ? (
                        <>
                          <img src={member.photo} alt="Avatar 3x4" className="w-full h-full object-cover" />
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600/90 text-white shadow-2xs backdrop-blur-xs">
                            3x4
                          </span>
                          <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer text-white gap-1 p-1">
                            <Upload className="w-5 h-5 mb-0.5" />
                            <span className="text-[10px] font-bold">Đổi ảnh</span>
                            <span className="text-[9px] text-indigo-200">hoặc dán Ctrl+V</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                          </label>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center p-2 text-center cursor-pointer">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mb-1.5 group-hover/avatar:scale-110 transition-transform">
                            <Camera className="w-5 h-5" />
                          </div>
                          <span className="text-[11px] text-gray-700 font-extrabold leading-tight">Tải Ảnh</span>
                          <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full mt-1.5 shadow-2xs">
                            Ctrl + V để dán
                          </span>
                          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                        </label>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 w-full justify-center">
                      <button
                        type="button"
                        onClick={handlePasteAvatarClick}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-extrabold transition-all border border-indigo-200 active:scale-95 shadow-2xs"
                        title="Dán ảnh chụp màn hình từ bộ nhớ tạm"
                      >
                        <Clipboard className="w-3 h-3" />
                        <span>Dán ảnh (Ctrl+V)</span>
                      </button>

                      {member.photo && (
                        <button
                          type="button"
                          onClick={() => updateMember('photo', '')}
                          className="p-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all border border-red-200 active:scale-95"
                          title="Xóa ảnh này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ảnh thẻ 3x4</span>
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
                          className="w-full text-sm px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800" 
                          placeholder="Nhập họ và tên..." 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Chức vụ</label>
                        <input 
                          type="text" 
                          value={member.position} 
                          onChange={e => updateMember('position', e.target.value)} 
                          className="w-full text-sm px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700" 
                          placeholder="Ví dụ: CN, Thợ chính..." 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="col-span-2">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Số CCCD</label>
                        <input 
                          type="text" 
                          value={member.cccd} 
                          onChange={e => updateMember('cccd', e.target.value)} 
                          className="w-full text-sm px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700" 
                          placeholder="12 chữ số CCCD..." 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Tuổi</label>
                        <input 
                          type="text" 
                          readOnly 
                          value={member.age} 
                          className="w-full text-sm px-3 py-2.5 rounded-xl bg-gray-100 border border-gray-200 font-bold text-gray-600" 
                          placeholder="Tự động tính" 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Năm sinh</label>
                        <input 
                          type="date" 
                          value={member.birthYear?.includes('/') ? member.birthYear.replace(/\s+/g, '').split('/').reverse().join('-') : (member.birthYear || '')} 
                          onChange={e => handleBirthDateChange(e.target.value)} 
                          className="w-full text-sm px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-700" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Ngày cấp CCCD</label>
                        <input 
                          type="date" 
                          value={member.issueDate} 
                          onChange={e => updateMember('issueDate', e.target.value)} 
                          className="w-full text-sm px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-700" 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Địa chỉ thường trú</label>
                        <input 
                          type="text" 
                          value={member.address} 
                          onChange={e => updateMember('address', e.target.value)} 
                          className="w-full text-sm px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-700" 
                          placeholder="Quê quán / Thường trú..." 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">Bằng cấp nghề</label>
                        <select
                          value={member.vocationalCertificate}
                          onChange={e => updateMember('vocationalCertificate', e.target.value)}
                          className="w-full text-sm px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-700"
                        >
                          <option value="">-- Chọn --</option>
                          <option value="Công nhân">Công nhân</option>
                          <option value="Nhóm 2">Nhóm 2</option>
                          <option value="Nhóm 3">Nhóm 3</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">Giấy khám sức khỏe</label>
                        <input 
                          type="date" 
                          value={member.healthCertificate} 
                          onChange={e => updateMember('healthCertificate', e.target.value)} 
                          className="w-full text-sm px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-700" 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">HĐLĐ</label>
                        <input 
                          type="date" 
                          value={member.contract} 
                          onChange={e => updateMember('contract', e.target.value)} 
                          className="w-full text-sm px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-700" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">Chứng chỉ AT (Hạn thẻ)</label>
                        {member.safetyCardExpiry === '00/00/00' || member.safetyCardExpiry === 'Chưa có' ? (
                          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600">
                            <span className="text-xs font-bold italic">Chưa có</span>
                            <button type="button" onClick={() => updateMember('safetyCardExpiry', '')} className="text-[11px] px-2 py-0.5 bg-red-100 hover:bg-red-200 rounded-md font-bold">Đặt lại</button>
                          </div>
                        ) : !member.safetyCardExpiry ? (
                          <button type="button" onClick={() => updateMember('safetyCardExpiry', new Date().toISOString().split('T')[0])} className="w-full px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition-colors">
                            + Set ngày
                          </button>
                        ) : (
                          <input 
                            type="date" 
                            value={member.safetyCardExpiry.includes('/') ? member.safetyCardExpiry.split('/').reverse().join('-') : member.safetyCardExpiry}
                            onChange={e => updateMember('safetyCardExpiry', e.target.value)}
                            className="w-full text-sm px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-700"
                          />
                        )}
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">BH Tai nạn (Ngày hết hạn)</label>
                        {member.insuranceExpiry === '00/00/00' || member.insuranceExpiry === 'Chưa có' ? (
                          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600">
                            <span className="text-xs font-bold italic">Chưa có</span>
                            <button type="button" onClick={() => updateMember('insuranceExpiry', '')} className="text-[11px] px-2 py-0.5 bg-red-100 hover:bg-red-200 rounded-md font-bold">Đặt lại</button>
                          </div>
                        ) : !member.insuranceExpiry ? (
                          <button type="button" onClick={() => updateMember('insuranceExpiry', new Date().toISOString().split('T')[0])} className="w-full px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition-colors">
                            + Set ngày
                          </button>
                        ) : (
                          <input 
                            type="date" 
                            value={member.insuranceExpiry.includes('/') ? member.insuranceExpiry.split('/').reverse().join('-') : member.insuranceExpiry}
                            onChange={e => updateMember('insuranceExpiry', e.target.value)}
                            className="w-full text-sm px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-700"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Ghi chú</label>
                      <textarea 
                        value={member.notes} 
                        onChange={e => updateMember('notes', e.target.value)} 
                        className="w-full text-sm px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-700" 
                        rows="2" 
                        placeholder="Ghi chú thêm về thành viên..."
                      />
                    </div>
                    
                    {/* PDF Upload Area */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-[11px] font-extrabold text-gray-600 uppercase">Hồ sơ đính kèm (PDF)</h5>
                        <label className="cursor-pointer flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                          <Upload className="w-3.5 h-3.5" /> Tải lên PDF
                          <input type="file" accept="application/pdf" multiple className="hidden" onChange={handlePdfUpload} />
                        </label>
                      </div>
                      {(!member.pdf || member.pdf.length === 0) ? (
                        <p className="text-[11px] text-gray-400 italic">Chưa có file nào đính kèm.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {member.pdf.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileText className="w-4 h-4 text-red-500 shrink-0" />
                                <span className="text-xs text-gray-700 truncate font-semibold">{p.name}</span>
                              </div>
                              <button type="button" onClick={() => removePdf(idx)} className="text-gray-400 hover:text-red-500 p-1" title="Xóa file">
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
          )}

          {/* ===================== MODE 2: BATCH / MULTIPLE MEMBERS ===================== */}
          {modalMode === 'batch' && (
            <div className="space-y-4">
              {/* Batch Action Toolbar */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Quét nhiều ảnh CCCD */}
                  <label className={`cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-sm transition ${
                    isScanningBatch 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                  }`}>
                    {isScanningBatch ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang Quét Hàng Loạt...</span>
                      </>
                    ) : (
                      <>
                        <ScanLine className="w-4 h-4" />
                        <span>Đọc Nhiều Ảnh Thẻ (Chọn nhiều ảnh cùng lúc)</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      disabled={isScanningBatch}
                      onChange={handleMultipleCccdUpload} 
                    />
                  </label>

                  {/* Nhập từ Excel */}
                  <label className="cursor-pointer flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Nhập Từ File Excel</span>
                    <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleExcelUpload} />
                  </label>

                  {/* Tải Mẫu Excel */}
                  <button
                    type="button"
                    onClick={handleDownloadExcelTemplate}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl border border-gray-200 shadow-2xs transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải Mẫu Excel</span>
                  </button>

                  {/* Thêm dòng mới */}
                  <button
                    type="button"
                    onClick={handleAddEmptyBatchRow}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 shadow-2xs transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Thêm Dòng</span>
                  </button>
                </div>

                <div className="text-xs text-gray-500 font-bold">
                  Sẵn sàng thêm: <strong className="text-indigo-600 text-sm">{batchMembers.filter(m => m.name.trim()).length}</strong> / {batchMembers.length} dòng
                </div>
              </div>

              {/* Progress Bar when Scanning Batch */}
              {isScanningBatch && scanProgress && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      {scanProgress.text}
                    </span>
                    <span>{Math.round((scanProgress.current / scanProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300" 
                      style={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Interactive Batch Members Grid Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-gray-50 z-10 border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-3 font-extrabold text-gray-500 uppercase w-10 text-center">STT</th>
                        <th className="py-2.5 px-3 font-extrabold text-gray-500 uppercase w-14 text-center">Ảnh</th>
                        <th className="py-2.5 px-3 font-extrabold text-gray-500 uppercase min-w-[180px]">Họ và Tên *</th>
                        <th className="py-2.5 px-3 font-extrabold text-gray-500 uppercase min-w-[140px]">Số CCCD</th>
                        <th className="py-2.5 px-3 font-extrabold text-gray-500 uppercase min-w-[110px]">Năm sinh</th>
                        <th className="py-2.5 px-3 font-extrabold text-gray-500 uppercase w-16 text-center">Tuổi</th>
                        <th className="py-2.5 px-3 font-extrabold text-gray-500 uppercase min-w-[120px]">Chức vụ</th>
                        <th className="py-2.5 px-3 font-extrabold text-gray-500 uppercase min-w-[130px]">Ngày cấp</th>
                        <th className="py-2.5 px-3 font-extrabold text-gray-500 uppercase min-w-[200px]">Địa chỉ thường trú</th>
                        <th className="py-2.5 px-3 font-extrabold text-gray-500 uppercase w-12 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {batchMembers.map((bm, idx) => (
                        <tr key={bm.id} className="hover:bg-indigo-50/20 transition-colors">
                          <td className="py-2 px-3 text-center font-bold text-gray-400">{idx + 1}</td>
                          <td className="py-2 px-3 text-center">
                            <div className="w-8 h-10 mx-auto rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                              {bm.photo ? (
                                <img src={bm.photo} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <UserCircle2 className="w-4 h-4 text-gray-300" />
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={bm.name}
                              onChange={e => updateBatchRow(bm.id, 'name', e.target.value)}
                              placeholder="Họ và tên..."
                              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={bm.cccd}
                              onChange={e => updateBatchRow(bm.id, 'cccd', e.target.value)}
                              placeholder="CCCD..."
                              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={bm.birthYear}
                              onChange={e => updateBatchRow(bm.id, 'birthYear', e.target.value)}
                              placeholder="DD/MM/YYYY"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-gray-500">
                            {bm.age || '-'}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={bm.position}
                              onChange={e => updateBatchRow(bm.id, 'position', e.target.value)}
                              placeholder="Chức vụ..."
                              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="date"
                              value={bm.issueDate}
                              onChange={e => updateBatchRow(bm.id, 'issueDate', e.target.value)}
                              className="w-full px-2 py-1 rounded-lg border border-gray-200 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={bm.address}
                              onChange={e => updateBatchRow(bm.id, 'address', e.target.value)}
                              placeholder="Địa chỉ..."
                              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeBatchRow(bm.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="Xóa dòng"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add new row button bar */}
                <div className="p-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleAddEmptyBatchRow}
                    className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-bold text-xs transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm một dòng trống khác</span>
                  </button>

                  {batchMembers.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setBatchMembers([])}
                      className="text-gray-400 hover:text-red-500 font-semibold text-xs transition"
                    >
                      Xóa toàn bộ bảng
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white px-6 py-3.5 border-t border-gray-100 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500">
            {modalMode === 'batch' && (
              <span>Đang có <strong className="text-indigo-600 font-black">{batchMembers.filter(m => m.name.trim()).length}</strong> thành viên hợp lệ để lưu</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 bg-gray-50 border border-gray-200 rounded-xl transition-colors"
            >
              Hủy
            </button>

            {modalMode === 'single' ? (
              <button 
                type="button"
                onClick={handleSubmitSingle}
                disabled={!canManageTeam}
                className={`px-6 py-2.5 text-xs font-extrabold rounded-xl shadow-md transition-all ${
                  canManageTeam 
                    ? 'text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-500/20' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                }`}
              >
                {memberToEdit ? 'Cập Nhật Thành Viên' : 'Lưu Thành Viên'}
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleSubmitBatch}
                disabled={!canManageTeam || batchMembers.filter(m => m.name.trim()).length === 0}
                className={`px-6 py-2.5 text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 ${
                  canManageTeam && batchMembers.filter(m => m.name.trim()).length > 0
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Lưu Tất Cả ({batchMembers.filter(m => m.name.trim()).length} Thành Viên)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
