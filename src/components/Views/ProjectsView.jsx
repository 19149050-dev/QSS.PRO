'use client';

import React, { useState } from 'react';
import { useStore, useAllowedProjects } from '@/store/useStore';
import AddProjectModal from '@/components/Modals/AddProjectModal';
import EditProjectModal from '@/components/Modals/EditProjectModal';
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
  const { viewMode, setViewMode, deleteProject, updateProject, setActiveTab, users, currentUser, openGlobalPrompt, openGlobalAlert } = useStore();
  const projects = useAllowedProjects();
  const [searchTerm, setSearchTerm] = useState('');
  
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'GIÁM ĐỐC';
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const handleDeleteProject = (id) => {
    openGlobalPrompt(
      "Nhập mật khẩu Admin để xóa công trình:",
      (pwd) => {
        if (pwd === '0000') {
          deleteProject(id);
        } else if (pwd !== null && pwd !== '') {
          openGlobalAlert("Mật khẩu không đúng!", "Lỗi xác thực");
        }
      },
      '',
      'Xác thực quyền Admin',
      'password'
    );
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

            {isAdmin && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-500/20 transition active:scale-95"
              >
                <Plus className="w-4 h-4" /> Thêm công trình
              </button>
            )}
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
                    <th>CHỈ HUY TRƯỞNG</th>
                    <th>GS (GIÁM SÁT)</th>
                    <th className="text-center">TRẠNG THÁI</th>
                    {isAdmin && <th className="text-right">THAO TÁC</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((proj) => {
                    const projectUsers = proj.cht?.map(c => {
                      const u = users.find(user => user.name === c);
                      return { name: c, role: u ? u.role : 'UNKNOWN' };
                    }) || [];
                    const chts = projectUsers.filter(u => u.role !== 'GSHT').map(u => u.name);
                    const gss = projectUsers.filter(u => u.role === 'GSHT').map(u => u.name);

                    return (
                    <tr key={proj.id} className="hover:bg-slate-50 transition">
                      <td>
                        <button onClick={() => setActiveTab('project-detail', { id: proj.id })} className="font-extrabold text-gray-900 hover:text-indigo-600 transition flex items-center gap-1.5 text-left">
                          {proj.name} <ExternalLink className="w-3 h-3 text-gray-400" />
                        </button>
                        <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mt-0.5">{proj.projectType}</div>
                      </td>
                      <td>
                        <div className="space-y-0.5">
                          {chts.length > 0 ? chts.map((c, i) => (
                            <div key={i} className="text-xs font-bold text-gray-800">
                              {c}
                            </div>
                          )) : <div className="text-xs text-gray-400">---</div>}
                        </div>
                      </td>
                      <td>
                        <div className="space-y-0.5">
                          {gss.length > 0 ? gss.map((g, i) => (
                            <div key={i} className="text-xs font-extrabold text-indigo-900">
                              {g}
                            </div>
                          )) : (
                            <div className="text-xs font-extrabold text-indigo-900">
                              {proj.gs || proj.supervisor || '---'}
                            </div>
                          )}
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
                      {isAdmin && (
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setActiveTab('project-detail', { id: proj.id })}
                              title="Xem Ma Trận Thanh Toán"
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            >
                              <TableProperties className="w-4 h-4" />
                            </button>
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
                      )}
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((proj) => {
              const projectUsers = proj.cht?.map(c => {
                const u = users.find(user => user.name === c);
                return { name: c, role: u ? u.role : 'UNKNOWN' };
              }) || [];
              
              const chts = projectUsers.filter(u => u.role !== 'GSHT').map(u => u.name);
              const gss = projectUsers.filter(u => u.role === 'GSHT').map(u => u.name);

              return (
              <div key={proj.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <button onClick={() => setActiveTab('project-detail', { id: proj.id })} className="font-extrabold text-base text-gray-900 hover:text-indigo-600 transition flex items-center gap-2 text-left w-full">
                      <Building2 className="w-5 h-5 text-indigo-500 shrink-0" />
                      <span className="truncate">{proj.name}</span>
                    </button>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md">
                        {proj.projectType}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => updateProject(proj.id, { status: proj.status === 'Finish' ? 'Doing' : 'Finish' })}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold border shadow-2xs transition-all active:scale-95 cursor-pointer ${
                      proj.status === 'Finish'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${proj.status === 'Finish' ? 'bg-indigo-600' : 'bg-emerald-500'}`}></span>
                    {proj.status === 'Finish' ? 'Finish' : 'Doing'}
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  {proj.subContractorInfo && (
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[10px] font-semibold text-gray-400">CĐT / TỔNG THẦU</div>
                        <div className="text-xs font-medium text-gray-700">{proj.subContractorInfo}</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2">
                    <UserCheck className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-[10px] font-semibold text-gray-400 mb-1">CHỈ HUY TRƯỞNG</div>
                      <div className="space-y-0.5">
                        {chts.length > 0 ? chts.map((c, i) => (
                          <div key={i} className="text-xs font-bold text-gray-800">
                            {c}
                          </div>
                        )) : <div className="text-xs text-gray-400">---</div>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <UserCheck className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-[10px] font-semibold text-gray-400 mb-1">GIÁM SÁT (GS)</div>
                      <div className="space-y-0.5">
                        {gss.length > 0 ? gss.map((g, i) => (
                          <div key={i} className="text-xs font-extrabold text-indigo-900">
                            {g}
                          </div>
                        )) : <div className="text-xs text-gray-400 font-extrabold">---</div>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('project-detail', { id: proj.id })}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
                    >
                      Chi tiết <ChevronRight className="w-3 h-3" />
                    </button>
                    {isAdmin && (
                      <button onClick={() => setEditingProject(proj)} title="Sửa công trình" className="text-gray-400 hover:text-indigo-600 p-1">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleDeleteProject(proj.id)} className="text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      <AddProjectModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <EditProjectModal project={editingProject} isOpen={!!editingProject} onClose={() => setEditingProject(null)} />
    </div>
  );
}
