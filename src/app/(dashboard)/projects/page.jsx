'use client';

import React, { useState } from 'react';

import { useStore } from '@/store/useStore';
import AddProjectModal from '@/components/Modals/AddProjectModal';
import EditProjectModal from '@/components/Modals/EditProjectModal';
import Link from 'next/link';
import { 
  Building2, 
  Plus, 
  Search, 
  LayoutGrid, 
  List, 
  Edit3, 
  Trash2, 
  MapPin, 
  FileText, 
  UserCheck, 
  DollarSign, 
  ChevronRight,
  ExternalLink,
  TableProperties
} from 'lucide-react';

export default function ProjectsPage() {
  const { projects, viewMode, setViewMode, deleteProject, updateProject } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const handleDeleteProject = (id) => {
    const pwd = window.prompt("Nhập mật khẩu Admin để xóa công trình:");
    if (pwd === '0000') {
      deleteProject(id);
    } else if (pwd !== null) {
      alert("Mật khẩu không đúng!");
    }
  };

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.address && p.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.contractNo && p.contractNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.cht && p.cht.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="pb-12">


      <div className="p-8 space-y-6 w-full">
        {/* Top Control Bar matching Screenshot 2 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên công trình, địa chỉ, chỉ huy trưởng, số hợp đồng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle Button */}
            <div className="flex items-center bg-white p-1 rounded-2xl border border-gray-200 shadow-xs">
              <button
                onClick={() => setViewMode('card')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  viewMode === 'card'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Dạng Thẻ
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-3.5 h-3.5" /> Dạng Bảng
              </button>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" /> Thêm công trình
            </button>
          </div>
        </div>

        {/* Content View */}
        {viewMode === 'table' ? (
          /* Table View Matching Screenshot 2 */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left qss-table">
                <thead>
                  <tr>
                    <th>CÔNG TRÌNH</th>
                    <th>ĐỊA CHỈ</th>
                    <th>SỐ HĐ</th>
                    <th>CHỈ HUY TRƯỞNG</th>
                    <th>GS (GIÁM SÁT)</th>
                    <th className="text-center">TRẠNG THÁI</th>
                    <th className="text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((proj) => (
                    <tr key={proj.id} className="hover:bg-slate-50 transition">
                      <td>
                        <Link href={`/projects/${proj.id}`} className="font-extrabold text-gray-900 hover:text-indigo-600 transition flex items-center gap-1.5">
                          {proj.name} <ExternalLink className="w-3 h-3 text-gray-400" />
                        </Link>
                        <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mt-0.5">{proj.orderType}</div>
                        <div className="text-[10px] text-gray-400 font-medium">{proj.subContractorInfo || 'Tổng thầu: N/A'}</div>
                      </td>
                      <td className="text-xs text-gray-600 font-medium max-w-[160px] truncate">{proj.address || '---'}</td>
                      <td className="text-xs text-gray-700 font-medium max-w-[180px]">
                        <div>{proj.contractNo || '---'}</div>
                        {proj.contractDate && <div className="text-[10px] text-gray-400">Ký ngày: {proj.contractDate}</div>}
                      </td>
                      <td>
                        <div className="space-y-0.5">
                          {proj.cht?.map((c, i) => (
                            <div key={i} className="text-xs font-bold text-gray-800">
                              {c}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="text-xs font-extrabold text-indigo-900">
                          {proj.gs || proj.supervisor || '---'}
                        </div>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={() => updateProject(proj.id, { status: proj.status === 'Finish' ? 'Doing' : 'Finish' })}
                          title="Click để đổi trạng thái Doing <-> Finish"
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold border shadow-2xs transition-all active:scale-95 cursor-pointer ${
                            proj.status === 'Finish'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-300 hover:bg-emerald-100'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${proj.status === 'Finish' ? 'bg-indigo-600' : 'bg-emerald-500'}`}></span>
                          {proj.status === 'Finish' ? 'Finish' : 'Doing'}
                        </button>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/projects/${proj.id}`}
                            title="Xem Ma Trận Thanh Toán"
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          >
                            <TableProperties className="w-4 h-4" />
                          </Link>
                          <button 
                            title="Sửa" 
                            onClick={() => setEditingProject(proj)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            title="Xóa"
                            onClick={() => handleDeleteProject(proj.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((proj) => (
              <div key={proj.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-100 uppercase">
                      {proj.orderType}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                      {proj.status}
                    </span>
                  </div>

                  <Link href={`/projects/${proj.id}`} className="font-extrabold text-base text-gray-900 hover:text-indigo-600 transition block mb-1">
                    {proj.name}
                  </Link>

                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" /> {proj.address}
                  </p>

                  <div className="space-y-2 text-xs pt-3 border-t border-gray-100">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Số hợp đồng:</span>
                      <span className="font-bold text-gray-800">{proj.contractNo || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Chỉ Huy Trưởng:</span>
                      <span className="font-bold text-indigo-900">{proj.cht?.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Giá trị HĐ:</span>
                      <span className="font-extrabold text-indigo-700">{formatVND(proj.contractValue)}</span>
                    </div>
                      <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Phụ lục & Tạm ứng:</span>
                      <span className="font-bold text-emerald-700">
                        {formatVND((proj.addendumValue || 0) + (proj.advancePayment || 0))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/projects/${proj.id}`}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      Ma trận thanh toán <ChevronRight className="w-4 h-4" />
                    </Link>
                    <button onClick={() => setEditingProject(proj)} title="Sửa công trình" className="text-gray-400 hover:text-indigo-600 p-1">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button onClick={() => handleDeleteProject(proj.id)} className="text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddProjectModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <EditProjectModal project={editingProject} isOpen={!!editingProject} onClose={() => setEditingProject(null)} />
    </div>
  );
}
