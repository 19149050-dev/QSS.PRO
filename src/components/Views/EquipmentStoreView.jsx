'use client';

import React, { useState, useMemo } from 'react';
import { useStore, useAllowedProjects } from '@/store/useStore';
import { 
  Wrench, 
  Plus, 
  Search, 
  FileDown, 
  Printer, 
  Edit2, 
  Trash2, 
  Building2, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Boxes,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

const formatVND = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 VNĐ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
};

const projectBgColors = [
  'bg-blue-50/40', 'bg-emerald-50/40', 'bg-amber-50/40', 'bg-purple-50/40', 'bg-pink-50/40', 'bg-cyan-50/40', 'bg-orange-50/40'
];

const getProjectBgColor = (projectName) => {
  if (!projectName) return 'bg-white';
  let hash = 0;
  for (let i = 0; i < projectName.length; i++) {
    hash = projectName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % projectBgColors.length;
  return projectBgColors[index];
};

const calculateDuration = (importDateStr) => {
  if (!importDateStr) return '-';
  const parts = importDateStr.split('/');
  if (parts.length !== 3) return '-';
  const [day, month, year] = parts.map(Number);
  const importDate = new Date(year, month - 1, day);
  const today = new Date();
  const diffTime = today - importDate;
  if (diffTime < 0) return '0 ngày';
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) return `${diffDays} ngày`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng ${diffDays % 30} ngày`;
  return `${Math.floor(diffDays / 365)} năm ${Math.floor((diffDays % 365) / 30)} tháng`;
};

export default function EquipmentStoreView() {
  const { 
    equipments = [], 
    users = [],
    addEquipment, 
    updateEquipment, 
    deleteEquipment,
    activeProject, 
    setActiveProject,
    openGlobalConfirm,
    openGlobalAlert
  } = useStore();

  const projects = useAllowedProjects();

  const [selectedProject, setSelectedProject] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    importDate: '',
    price: '',
    repairCost: '',
    projectName: projects[0]?.name || 'BCONS TĐH',
    warrantyPeriod: '',
    status: 'Mới',
    buyer: '',
    notes: ''
  });

  // Filtered Equipment List
  const filteredEquipments = useMemo(() => {
    return equipments.filter(item => {
      const matchProject = selectedProject === 'ALL' || item.projectName === selectedProject;
      const matchStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
      const matchSearch = !searchTerm.trim() || 
        (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchProject && matchStatus && matchSearch;
    });
  }, [equipments, selectedProject, selectedStatus, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = filteredEquipments.length;
    const totalPrice = filteredEquipments.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    const inUseCount = filteredEquipments.filter(item => item.status === 'Đang sử dụng').length;
    const maintenanceCount = filteredEquipments.filter(item => item.status === 'Cần bảo trì' || item.status === 'Đã hỏng').length;

    return { totalCount, totalPrice, inUseCount, maintenanceCount };
  }, [filteredEquipments]);

  // Handle Modal Open
  const handleOpenAddModal = () => {
    setEditingItem(null);
    const today = new Date();
    const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    
    setFormData({
      name: '',
      importDate: todayStr,
      price: '',
      repairCost: '',
      projectName: selectedProject !== 'ALL' ? selectedProject : (projects[0]?.name || 'BCONS TĐH'),
      warrantyPeriod: '12 Tháng',
      status: 'Mới',
      buyer: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      importDate: item.importDate || '',
      price: item.price ? Number(item.price).toLocaleString('en-US') : '',
      repairCost: item.repairCost ? Number(item.repairCost).toLocaleString('en-US') : '',
      projectName: item.projectName || (projects[0]?.name || 'BCONS TĐH'),
      warrantyPeriod: item.warrantyPeriod || '',
      status: item.status || 'Mới',
      buyer: item.buyer || '',
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      openGlobalAlert('Vui lòng nhập tên thiết bị!');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      importDate: formData.importDate.trim(),
      price: parseFloat(String(formData.price).replace(/[^0-9]/g, '')) || 0,
      repairCost: parseFloat(String(formData.repairCost).replace(/[^0-9]/g, '')) || 0,
      projectName: formData.projectName,
      warrantyPeriod: formData.warrantyPeriod.trim(),
      status: formData.status,
      buyer: formData.buyer.trim(),
      notes: formData.notes.trim()
    };

    if (editingItem) {
      updateEquipment(editingItem.id, payload);
    } else {
      addEquipment(payload);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (item) => {
    openGlobalConfirm(
      `Bạn có chắc chắn muốn xóa thiết bị "${item.name}"?`,
      () => deleteEquipment(item.id),
      'Xác nhận xóa thiết bị'
    );
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const exportData = filteredEquipments.map((item, idx) => ({
        'STT': idx + 1,
        'Tên thiết bị': item.name || '',
        'Ngày nhập': item.importDate || '',
        'Thời gian SD': calculateDuration(item.importDate),
        'Giá mua (VNĐ)': item.price || 0,
        'Tiền sửa chữa (VNĐ)': item.repairCost || 0,
        'Công trình': item.projectName || '',
        'Thời hạn / Bảo hành': item.warrantyPeriod || '',
        'Tình trạng': item.status || '',
        'Người mua': item.buyer || '',
        'Ghi chú': item.notes || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Kho Thiết Bị');
      XLSX.writeFile(workbook, `Kho_Thiet_Bi_${selectedProject === 'ALL' ? 'TatCa' : selectedProject}.xlsx`);
    } catch (err) {
      console.error('Lỗi khi xuất Excel:', err);
      openGlobalAlert('Không thể xuất file Excel!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper for Status Badge Color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Mới':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Đang sử dụng':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cần bảo trì':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Đã hỏng':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Thanh lý':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="pb-12 bg-slate-50 min-h-screen">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-equipment-section, #print-equipment-section * {
            visibility: visible;
          }
          #print-equipment-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      <div className="p-4 sm:p-8 space-y-6 w-full">
        {/* Top Header Card */}
        <div className="flex flex-col gap-4 rounded-3xl border border-indigo-100 bg-white px-6 py-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                Kho Thiết Bị
                <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-3 py-0.5 rounded-full">
                  Quản lý máy móc
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Theo dõi chi tiết thiết bị & tài sản thi công từng công trình</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="min-w-[200px] rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">TẤT CẢ CÔNG TRÌNH</option>
              {projects.map((p) => (
                <option key={p.id || p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Tổng Số Thiết Bị</p>
              <h3 className="text-lg font-black text-slate-900">{stats.totalCount} <span className="text-xs font-normal text-slate-400">thiết bị</span></h3>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Tổng Giá Trị Tài Sản</p>
              <h3 className="text-lg font-black text-emerald-700">{formatVND(stats.totalPrice)}</h3>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Đang Sử Dụng</p>
              <h3 className="text-lg font-black text-indigo-700">{stats.inUseCount} <span className="text-xs font-normal text-slate-400">thiết bị</span></h3>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Cần Bảo Trì / Hỏng</p>
              <h3 className="text-lg font-black text-amber-700">{stats.maintenanceCount} <span className="text-xs font-normal text-slate-400">thiết bị</span></h3>
            </div>
          </div>
        </div>

        {/* Main Content Card & Toolbar */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4" id="print-equipment-section">
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 no-print print:hidden">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-2xs active:scale-95 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Thêm thiết bị
              </button>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">TẤT CẢ TÌNH TRẠNG</option>
                <option value="Mới">Mới</option>
                <option value="Đang sử dụng">Đang sử dụng</option>
                <option value="Cần bảo trì">Cần bảo trì</option>
                <option value="Đã hỏng">Đã hỏng</option>
                <option value="Thanh lý">Thanh lý</option>
              </select>

              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm tên thiết bị, ghi chú..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 rounded-xl bg-[#107c41] px-4 py-2 text-xs font-bold text-white hover:bg-[#185c37] transition shadow-2xs cursor-pointer"
              >
                <FileDown className="h-4 w-4" />
                Xuất Excel
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 transition shadow-2xs cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                In Bảng
              </button>
            </div>
          </div>

          {/* Equipment Table */}
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-800 text-left text-sm">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-xs uppercase tracking-wider">
                    <th className="border border-slate-800 p-2.5 w-[50px] text-center">STT</th>
                    <th className="border border-slate-800 p-2.5 min-w-[200px]">Tên thiết bị</th>
                    <th className="border border-slate-800 p-2.5 w-[100px] text-center whitespace-nowrap">Ngày nhập</th>
                    <th className="border border-slate-800 p-2.5 w-[110px] text-center whitespace-nowrap">Thời gian SD</th>
                    <th className="border border-slate-800 p-2.5 w-[150px] text-right whitespace-nowrap">Giá mua</th>
                    <th className="border border-slate-800 p-2.5 w-[150px] text-right whitespace-nowrap">Tiền sửa chữa</th>
                    <th className="border border-slate-800 p-2.5 min-w-[160px] whitespace-nowrap">Công trình</th>
                    <th className="border border-slate-800 p-2.5 w-[120px] text-center whitespace-nowrap">Thời hạn</th>
                    <th className="border border-slate-800 p-2.5 w-[120px] text-center whitespace-nowrap">Tình trạng</th>
                    <th className="border border-slate-800 p-2.5 w-[140px] whitespace-nowrap">Người mua</th>
                    <th className="border border-slate-800 p-2.5 min-w-[150px]">Ghi chú</th>
                    <th className="border border-slate-800 p-2.5 w-[90px] text-center whitespace-nowrap no-print print:hidden">Thao tác</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {filteredEquipments.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400 font-semibold">
                        Không tìm thấy thiết bị nào phù hợp. Bấm <strong className="text-emerald-600">"+ Thêm thiết bị"</strong> để bắt đầu.
                      </td>
                    </tr>
                  ) : (
                    filteredEquipments.map((item, idx) => (
                      <tr key={item.id || idx} className={`hover:brightness-95 transition ${getProjectBgColor(item.projectName)}`}>
                        <td className="border border-slate-800 p-2.5 text-center font-bold text-slate-500 bg-white/40">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-800 p-2.5 font-extrabold text-slate-900">
                          {item.name}
                        </td>
                        <td className="border border-slate-800 p-2.5 text-center font-medium text-slate-700 whitespace-nowrap">
                          {item.importDate || '-'}
                        </td>
                        <td className="border border-slate-800 p-2.5 text-center font-bold text-slate-700 bg-white/50 whitespace-nowrap">
                          {calculateDuration(item.importDate)}
                        </td>
                        <td className="border border-slate-800 p-2.5 text-right font-extrabold text-indigo-700 bg-white/40 whitespace-nowrap">
                          {formatVND(item.price)}
                        </td>
                        <td className="border border-slate-800 p-2.5 text-right font-extrabold text-red-600 bg-white/40 whitespace-nowrap">
                          {item.repairCost > 0 ? formatVND(item.repairCost) : '-'}
                        </td>
                        <td className="border border-slate-800 p-2.5 font-bold text-slate-800 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50/80 text-indigo-800 border border-indigo-200">
                            <Building2 className="w-3.5 h-3.5" />
                            {item.projectName}
                          </span>
                        </td>
                        <td className="border border-slate-800 p-2.5 text-center font-semibold text-slate-700 bg-white/30 whitespace-nowrap">
                          {item.warrantyPeriod || '-'}
                        </td>
                        <td className="border border-slate-800 p-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full border text-xs font-bold ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="border border-slate-800 p-2.5 text-slate-800 font-bold bg-white/40 whitespace-nowrap">
                          {item.buyer || '-'}
                        </td>
                        <td className="border border-slate-800 p-3 text-slate-600 font-medium bg-white/30">
                          {item.notes || '-'}
                        </td>
                        <td className="border border-slate-800 p-3 text-center no-print print:hidden">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Sửa thiết bị"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Xóa thiết bị"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Add / Edit Equipment */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 w-full max-w-lg animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {editingItem ? 'Chỉnh Sửa Thiết Bị' : 'Thêm Thiết Bị Mới'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Nhập đầy đủ thông tin thiết bị máy móc</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Tên thiết bị <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="VD: Máy trộn bê tông 350L..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                    Ngày nhập
                  </label>
                  <input
                    type="text"
                    value={formData.importDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, importDate: e.target.value }))}
                    placeholder="DD/MM/YYYY..."
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                    Giá mua (VNĐ)
                  </label>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData(prev => ({ ...prev, price: val ? Number(val).toLocaleString('en-US') : '' }));
                    }}
                    placeholder="VD: 18500000..."
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                    Công trình
                  </label>
                  <select
                    value={formData.projectName}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition cursor-pointer"
                  >
                    {projects.map((p) => (
                      <option key={p.id || p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                    Thời hạn / Bảo hành
                  </label>
                  <input
                    type="text"
                    value={formData.warrantyPeriod}
                    onChange={(e) => setFormData(prev => ({ ...prev, warrantyPeriod: e.target.value }))}
                    placeholder="VD: 12 Tháng, 24 Tháng..."
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition"
                  />
                </div>
              </div>

              {editingItem && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                    Tiền sửa chữa (VNĐ)
                  </label>
                  <input
                    type="text"
                    value={formData.repairCost}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData(prev => ({ ...prev, repairCost: val ? Number(val).toLocaleString('en-US') : '' }));
                    }}
                    placeholder="VD: 500000..."
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-bold text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-50 focus:bg-white transition"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Tình trạng
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition cursor-pointer"
                >
                  <option value="Mới">Mới</option>
                  <option value="Đang sử dụng">Đang sử dụng</option>
                  <option value="Cần bảo trì">Cần bảo trì</option>
                  <option value="Đã hỏng">Đã hỏng</option>
                  <option value="Thanh lý">Thanh lý</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Người mua
                </label>
                <input
                  type="text"
                  list="employee-list"
                  value={formData.buyer}
                  onChange={(e) => setFormData(prev => ({ ...prev, buyer: e.target.value }))}
                  placeholder="Chọn nhân viên hoặc tự nhập tên..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition"
                />
                <datalist id="employee-list">
                  {users.map((u) => (
                    <option key={u.id} value={u.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Ghi chú thêm
                </label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ghi chú thêm thông số, xuất xứ, đội bàn giao..."
                  className="w-full px-4 py-2 rounded-2xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition active:scale-95 cursor-pointer"
                >
                  {editingItem ? 'Lưu cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
