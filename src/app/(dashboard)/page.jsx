'use client';

import React from 'react';
import { useStore } from '@/store/useStore';

// View Components
import DashboardView from '@/components/Views/DashboardView';
import ProjectsView from '@/components/Views/ProjectsView';
import ProjectDetailView from '@/components/Views/ProjectDetailView';
import TeamsView from '@/components/Views/TeamsView';
import ManageTeamsView from '@/components/Views/ManageTeamsView';
import IpcDuKienView from '@/components/Views/IpcDuKienView';
import IpcThucView from '@/components/Views/IpcThucView';
import IpcVatTuView from '@/components/Views/IpcVatTuView';
import ExportMaterialsView from '@/components/Views/ExportMaterialsView';
import IpcView from '@/components/Views/IpcView';
import UsersView from '@/components/Views/UsersView';
import TrashView from '@/components/Views/TrashView';
import MaterialsView from '@/components/Views/MaterialsView';
import AcceptanceView from '@/components/Views/AcceptanceView';

export default function RootRouter() {
  const { activeTab } = useStore();

  switch (activeTab) {
    case 'dashboard':
      return <DashboardView />;
    case 'projects':
      return <ProjectsView />;
    case 'project-detail':
      return <ProjectDetailView />;
    case 'teams':
      return <TeamsView />;
    case 'manage-teams':
      return <ManageTeamsView />;
    case 'ipc-du-kien':
      return <IpcDuKienView />;
    case 'ipc-thuc':
      return <IpcThucView />;
    case 'ipc-vat-tu':
      return <IpcVatTuView />;
    case 'export-materials':
      return <ExportMaterialsView />;
    case 'ipc':
      return <IpcView />;
    case 'users':
      return <UsersView />;
    case 'trash':
      return <TrashView />;
    case 'materials':
      return <MaterialsView />;
    case 'acceptance':
      return <AcceptanceView />;
    default:
      return <DashboardView />;
  }
}
