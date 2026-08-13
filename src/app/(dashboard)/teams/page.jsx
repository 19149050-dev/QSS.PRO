'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import PaymentMatrix from '@/components/PaymentMatrix';
import AddTeamModal from '@/components/Modals/AddTeamModal';
import { Plus } from 'lucide-react';

export default function TeamsPage() {
  const { projects, teams, activeProject, setActiveProject } = useStore();
  const selectedProject = activeProject || projects[0]?.name || 'SUNHOME';
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filter teams that are assigned to the selected project
  const projectTeams = teams.filter(t => {
    if (Array.isArray(t.projects) && t.projects.length > 0) {
      return t.projects.includes(selectedProject);
    }
    return t.projectName === selectedProject || t.project_name === selectedProject;
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
          </div>

        </div>

        {/* Content */}
        <PaymentMatrix projectName={selectedProject} selectedTeamFilter={selectedTeamFilter} type="team" />
      </div>

      <AddTeamModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
