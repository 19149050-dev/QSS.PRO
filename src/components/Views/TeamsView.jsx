'use client';

import React, { useState } from 'react';
import { useStore, useAllowedProjects } from '@/store/useStore';
import PaymentMatrix from '@/components/PaymentMatrix';
import AddTeamModal from '@/components/Modals/AddTeamModal';
import AssignMemberModal from '@/components/Modals/AssignMemberModal';
import { Plus, Users } from 'lucide-react';

export default function TeamsPage() {
  const { teams, activeProject, setActiveProject } = useStore();
  const projects = useAllowedProjects();
  const selectedProject = (activeProject && projects.some(p => p.name === activeProject)) 
    ? activeProject 
    : projects[0]?.name || 'SUNHOME';
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Filter teams that are assigned to the selected project
  const projectTeams = teams.filter(t => {
    let projs = [];
    if (Array.isArray(t.projects) && t.projects.length > 0) {
      projs = t.projects.flatMap(p => typeof p === 'string' ? p.split(',') : p).map(s => s.trim()).filter(Boolean);
    } else {
      const nameStr = t.projectName || t.project_name || '';
      projs = nameStr.split(',').map(s => s.trim()).filter(Boolean);
    }
    return projs.includes(selectedProject);
  });

  return (
    <div className="pb-12">
      <div className="p-8 space-y-6 w-full">
        {/* Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedProject}
              onChange={(e) => {
                setActiveProject(e.target.value);
                setSelectedTeamFilter('ALL');
              }}
              className="px-4 py-2 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            >
              {projects.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>

            <select
              value={selectedTeamFilter}
              onChange={(e) => setSelectedTeamFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            >
              <option value="ALL">TỔNG (Tất cả Tổ Đội)</option>
              {projectTeams.map((t, idx) => {
                const name = t.teamName || t.team_name;
                return (
                  <option key={t.id || idx} value={name}>{name}</option>
                );
              })}
            </select>

            <button
              onClick={() => {
                if (selectedTeamFilter === 'ALL') {
                  alert('Vui lòng chọn 1 tổ đội cụ thể để phân bổ nhân viên.');
                  return;
                }
                setIsAssignModalOpen(true);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold shadow-xs transition-colors border ${
                selectedTeamFilter === 'ALL'
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Phân bổ nhân viên
            </button>
          </div>

        </div>

        {/* Content */}
        <PaymentMatrix projectName={selectedProject} selectedTeamFilter={selectedTeamFilter} type="team" />
      </div>

      <AddTeamModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      
      <AssignMemberModal 
        isOpen={isAssignModalOpen} 
        onClose={() => setIsAssignModalOpen(false)} 
        selectedProject={selectedProject}
        selectedTeamName={selectedTeamFilter}
      />
    </div>
  );
}
