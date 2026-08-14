import React from 'react';
import { X, Check } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function AssignMemberModal({ isOpen, onClose, selectedProject, selectedTeamName }) {
  const { teams, updateTeamMember } = useStore();

  if (!isOpen) return null;

  // Find the selected team object
  const team = teams.find(t => (t.teamName || t.team_name) === selectedTeamName);
  
  if (!team) return null;

  const members = team.members || [];

  const handleToggleProject = (member, isAssigned) => {
    const updatedMember = { ...member, project: isAssigned ? selectedProject : '' };
    updateTeamMember(team.id, member.id, updatedMember);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between shrink-0">
          <h3 className="text-white font-extrabold text-sm uppercase tracking-wide">
            Phân Bổ Nhân Viên
          </h3>
          <button onClick={onClose} className="text-indigo-200 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] bg-slate-50 space-y-4">
          <div className="text-sm text-slate-600">
            Chọn các thành viên của tổ đội <strong className="text-indigo-700">{selectedTeamName}</strong> để phân bổ vào dự án <strong>{selectedProject}</strong>:
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {members.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm italic">
                Chưa có thành viên nào trong tổ đội này.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="py-3 px-4 text-xs font-extrabold text-gray-500 w-12 text-center uppercase">
                        Chọn
                      </th>
                      <th className="py-3 px-4 text-xs font-extrabold text-gray-500 uppercase">Thành viên</th>
                      <th className="py-3 px-4 text-xs font-extrabold text-gray-500 uppercase text-center">Hạn thẻ AT</th>
                      <th className="py-3 px-4 text-xs font-extrabold text-gray-500 uppercase text-center">Hạn bảo hiểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(member => {
                      const isAssigned = member.project === selectedProject;
                      return (
                        <tr 
                          key={member.id} 
                          className="border-b border-gray-50 hover:bg-indigo-50/30 cursor-pointer transition-colors" 
                          onClick={() => handleToggleProject(member, !isAssigned)}
                        >
                          <td className="py-3 px-4 text-center">
                            <div className={`w-5 h-5 rounded border mx-auto flex items-center justify-center transition-colors ${isAssigned ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`}>
                              {isAssigned && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-sm text-gray-900">{member.name}</div>
                            <div className="text-xs text-gray-500 font-semibold mt-0.5">CCCD: {member.cccd}</div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] border ${getExpiryStatus(member.safetyCardExpiry) === 'danger' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                              {member.safetyCardExpiry || 'Chưa có'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] border ${getExpiryStatus(member.insuranceExpiry) === 'danger' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-sky-50 text-sky-600 border-sky-200'}`}>
                              {member.insuranceExpiry || 'Chưa có'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white px-6 py-4 border-t border-gray-100 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.3)] transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
