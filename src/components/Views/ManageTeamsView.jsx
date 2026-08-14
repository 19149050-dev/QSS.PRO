'use client';

import React, { useState } from 'react';
import { useStore, useAllowedProjects } from '@/store/useStore';
import AddTeamModal from '@/components/Modals/AddTeamModal';
import AddMemberModal from '@/components/Modals/AddMemberModal';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import { exportToExcel } from '@/utils/exportUtils';

export default function ManageTeamsPage() {
  const { teams, deleteTeam, activeProject, addTeamMember } = useStore();
  const projects = useAllowedProjects();
  const selectedProject = activeProject || projects[0]?.name || 'SUNHOME';
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState(null);
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  
  // Member Modal State
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [activeTeamIdForMember, setActiveTeamIdForMember] = useState(null);
  const [memberToEdit, setMemberToEdit] = useState(null);

  const handleOpenAddMember = (teamId) => {
    setActiveTeamIdForMember(teamId);
    setMemberToEdit(null);
    setIsAddMemberModalOpen(true);
  };

  const handleOpenEditMember = (teamId, member) => {
    setActiveTeamIdForMember(teamId);
    setMemberToEdit(member);
    setIsAddMemberModalOpen(true);
  };

  const getExpiryStatus = (dateStr) => {
    if (!dateStr || dateStr.toLowerCase() === 'chưa có') return 'danger';
    let parts = [];
    if (dateStr.includes('-')) parts = dateStr.split('-');
    else if (dateStr.includes('/')) parts = dateStr.split('/');
    
    if (parts.length === 3) {
      let year, month, day;
      if (parts[0].length === 4) [year, month, day] = parts;
      else [day, month, year] = parts;
      const expiry = new Date(year, month - 1, day);
      const today = new Date();
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) return 'danger';
      return 'safe';
    }
    return 'safe'; 
  };

  const filteredTeams = teams.filter(t => 
    (t.teamName && t.teamName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.leaderName && t.leaderName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.projects && t.projects.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))) ||
    (t.projectName && t.projectName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenEdit = (team) => {
    setTeamToEdit(team);
    setIsAddModalOpen(true);
  };

  const handleOpenAdd = () => {
    setTeamToEdit(null);
    setIsAddModalOpen(true);
  };

  const handleExportExcel = () => {
    const exportData = [];
    filteredTeams.forEach(team => {
      exportData.push({
        'Tên Tổ Đội': team.teamName,
        'Đội Trưởng': `${team.leaderName} (${team.phone || 'N/A'})`,
        'Dự Án': Array.isArray(team.projects) ? team.projects.join(', ') : (team.projectName || 'Tất cả'),
        'STT': '',
        'Họ và Tên': '',
        'CCCD': '',
        'Năm Sinh': '',
        'Hạn Thẻ AT': ''
      });

      if (team.members && team.members.length > 0) {
        team.members.forEach((member, idx) => {
          exportData.push({
            'Tên Tổ Đội': '',
            'Đội Trưởng': '',
            'Dự Án': '',
            'STT': idx + 1,
            'Họ và Tên': member.name,
            'CCCD': member.cccd,
            'Năm Sinh': member.birthYear,
            'Hạn Thẻ AT': member.safetyCardExpiry
          });
        });
      } else {
         exportData.push({
            'Tên Tổ Đội': '',
            'Đội Trưởng': '',
            'Dự Án': '',
            'STT': '-',
            'Họ và Tên': 'Chưa có thành viên',
            'CCCD': '',
            'Năm Sinh': '',
            'Hạn Thẻ AT': ''
          });
      }
      exportData.push({});
    });

    exportToExcel(exportData, 'Danh_Sach_To_Doi', 'QL_To_Doi');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pb-12">
      <div className="p-8 space-y-6 w-full">
        {/* Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-2xl font-bold shadow-sm border border-indigo-100">
              <Users className="w-5 h-5" />
              <span>Quản Lý Tổ Đội</span>
            </div>
            <span className="text-gray-500 text-sm font-medium">Tổng số: {teams.length} đội</span>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-500/20 transition active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Thêm Tổ Đội
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm tổ đội, đội trưởng, dự án..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 font-bold rounded-xl border border-gray-200 shadow-sm transition-colors text-xs"
              >
                <Printer className="w-4 h-4" /> In Bảng
              </button>
              <button 
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl border border-emerald-200 shadow-sm transition-colors text-xs"
              >
                <FileSpreadsheet className="w-4 h-4" /> Xuất Excel
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left qss-table">
              <thead>
                <tr>
                  <th className="py-3 px-4 text-xs font-extrabold uppercase">TỔ ĐỘI & ĐỘI TRƯỞNG</th>
                  <th className="py-3 px-4 text-xs font-extrabold uppercase">DỰ ÁN ÁP DỤNG</th>
                  <th className="py-3 px-4 text-xs font-extrabold uppercase text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.map((team) => (
                  <React.Fragment key={team.id}>
                    <tr 
                      className={`transition border-b border-gray-100 cursor-pointer ${expandedTeamId === team.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                      onClick={() => setExpandedTeamId(expandedTeamId === team.id ? null : team.id)}
                    >
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        {expandedTeamId === team.id ? <ChevronUp className="w-5 h-5 text-indigo-500 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                        <div>
                          <div className="font-extrabold text-gray-900 text-sm">{team.teamName}</div>
                          <div className="text-xs text-indigo-600 font-semibold flex items-center gap-1 mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-indigo-400" /> {team.leaderName} ({team.phone || 'N/A'})
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {Array.isArray(team.projects) && team.projects.length > 0 ? (
                            team.projects.map((proj, i) => (
                              <span key={i} className="inline-block bg-indigo-50 text-indigo-700 text-xs font-extrabold px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs">
                                {proj}
                              </span>
                            ))
                          ) : (
                            <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-extrabold px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs">
                              {team.projectName || 'Tất cả dự án'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            title="Sửa thông tin" 
                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(team); }}
                            className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-xl transition border border-indigo-100 bg-white"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            title="Xóa" 
                            onClick={(e) => { e.stopPropagation(); deleteTeam(team.id); }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition border border-red-100 bg-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expandable Member List */}
                    {expandedTeamId === team.id && (
                      <tr className="bg-slate-50 border-b border-gray-200">
                        <td colSpan={3} className="p-0">
                          <div className="p-4 px-6 md:px-12 animate-in slide-in-from-top-2 fade-in duration-200">
                            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden">
                              <div className="bg-indigo-50/50 px-4 py-2 border-b border-indigo-100 flex items-center justify-between">
                                <h4 className="text-xs font-extrabold text-indigo-900 uppercase">Danh sách thành viên tổ đội ({team.members?.length || 0})</h4>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                  <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                      <th className="py-2.5 px-4 text-[11px] font-extrabold text-gray-500 uppercase w-12 text-center">STT</th>
                                      <th className="py-2.5 px-4 text-[11px] font-extrabold text-gray-500 uppercase min-w-[150px]">Họ và Tên</th>
                                      <th className="py-2.5 px-4 text-[11px] font-extrabold text-gray-500 uppercase">CCCD</th>
                                      <th className="py-2.5 px-4 text-[11px] font-extrabold text-gray-500 uppercase text-center">Năm sinh</th>
                                      <th className="py-2.5 px-4 text-[11px] font-extrabold text-gray-500 uppercase text-center">Hạn thẻ AT</th>
                                      <th className="py-2.5 px-4 text-[11px] font-extrabold text-gray-500 uppercase text-center">Hạn BH</th>
                                      <th className="py-2.5 px-4 text-[11px] font-extrabold text-gray-500 uppercase text-center">Ảnh 3x4</th>
                                      <th className="py-2.5 px-4 text-[11px] font-extrabold text-gray-500 uppercase text-center">Thao tác</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(!team.members || team.members.length === 0) ? (
                                      <tr>
                                        <td colSpan={8} className="py-6 text-center text-xs text-gray-400 font-medium italic">
                                          Chưa có dữ liệu thành viên. Vui lòng thêm thành viên vào tổ đội này.
                                        </td>
                                      </tr>
                                    ) : (
                                      team.members.map((member, idx) => (
                                        <tr key={member.id} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors last:border-0">
                                          <td className="py-2 px-4 text-xs font-bold text-gray-400 text-center">{idx + 1}</td>
                                          <td className="py-2 px-4 text-xs font-bold text-gray-900 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 overflow-hidden">
                                              {member.photo ? <img src={member.photo} alt={member.name} className="w-full h-full object-cover" /> : <User className="w-3.5 h-3.5" />}
                                            </div>
                                            {member.name}
                                          </td>
                                          <td className="py-2 px-4 text-xs font-semibold text-gray-600">{member.cccd}</td>
                                          <td className="py-2 px-4 text-xs font-semibold text-gray-600 text-center">{member.birthYear}</td>
                                          <td className="py-2 px-4 text-xs font-semibold text-center">
                                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${getExpiryStatus(member.safetyCardExpiry) === 'danger' ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                                              {member.safetyCardExpiry || 'Chưa có'}
                                            </span>
                                          </td>
                                          <td className="py-2 px-4 text-xs font-semibold text-center">
                                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${getExpiryStatus(member.insuranceExpiry) === 'danger' ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-sky-50 text-sky-600 border-sky-200'}`}>
                                              {member.insuranceExpiry || 'Chưa có'}
                                            </span>
                                          </td>
                                          <td className="py-2 px-4 text-center">
                                            {member.photo ? (
                                              <img src={member.photo} alt="3x4" className="w-8 h-10 object-cover mx-auto rounded shadow-sm border border-gray-200" />
                                            ) : '-'}
                                          </td>
                                          <td className="py-2 px-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                              <button 
                                                onClick={() => handleOpenEditMember(team.id, member)}
                                                className="p-1.5 text-indigo-500 hover:bg-indigo-100 rounded-md transition-colors"
                                                title="Sửa"
                                              >
                                                <Edit2 className="w-3.5 h-3.5" />
                                              </button>
                                              <button 
                                                onClick={() => {
                                                  useStore.getState().openGlobalConfirm('Bạn có chắc chắn muốn xóa thành viên này?', () => {
                                                    useStore.getState().deleteTeamMember(team.id, member.id);
                                                  });
                                                }}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                title="Xóa"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))
                                    )}
                                    {/* Add Member Row */}
                                    <tr>
                                      <td colSpan={8} className="py-0">
                                        <button 
                                          onClick={() => handleOpenAddMember(team.id)}
                                          className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-600 transition-colors font-bold text-xs uppercase tracking-wider"
                                        >
                                          <Plus className="w-4 h-4" /> Thêm thành viên mới
                                        </button>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AddTeamModal 
        isOpen={isAddModalOpen} 
        onClose={() => { setIsAddModalOpen(false); setTeamToEdit(null); }} 
        teamToEdit={teamToEdit}
      />

      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        teamId={activeTeamIdForMember}
        memberToEdit={memberToEdit}
      />
    </div>
  );
}
