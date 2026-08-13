'use client';

import { useMemo, useState } from 'react';
import { ClipboardList, FileClock, Layers3 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import PaymentMatrix from '@/components/PaymentMatrix';

const TAB_ITEMS = {
  planned: { label: 'IPC Dự kiến', icon: FileClock, type: 'team', hint: 'Kế hoạch thanh toán thầu phụ' },
  actual: { label: 'IPC Thực', icon: ClipboardList, type: 'ipc', hint: 'Hồ sơ thanh toán đã triển khai' },
};

export default function IpcMatrixPage({ mode = 'planned' }) {
  const { projects, activeProject, setActiveProject } = useStore();
  const selectedProject = activeProject || projects.find((project) => project.name !== 'SUNHOME')?.name || projects[0]?.name || '';
  const [period, setPeriod] = useState('ĐỢT 1');

  const activeTab = useMemo(() => TAB_ITEMS[mode] || TAB_ITEMS.planned, [mode]);
  const Icon = activeTab.icon;

  return (
    <div className="pb-12">
      <div className="space-y-6 p-8 w-full">
        <div className="flex flex-col gap-4 rounded-3xl border border-indigo-100 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">{activeTab.label}</h1>
              <p className="text-sm text-slate-500">{activeTab.hint}</p>
            </div>
          </div>

          <select
            value={selectedProject}
            onChange={(e) => setActiveProject(e.target.value)}
            className="min-w-[180px] rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.name}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-black">{activeTab.label}</p>
                <p className="text-sm text-slate-500">{activeTab.hint}</p>
              </div>
            </div>

          </div>

          {!selectedProject ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
              Chưa có công trình nào để hiển thị IPC.
            </div>
          ) : (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium">
                <strong>Hướng dẫn:</strong> Bảng dưới đây tự động truy xuất dữ liệu khối lượng mà các Tổ Đội đã báo cáo. Các ô có dữ liệu sẽ tự động được đồng bộ vào <strong>{activeTab.label}</strong>. Tên của Tổ Đội sẽ được ẩn đi trong chế độ này. Nhấp vào các ô để phân bổ mã IPC.
              </div>
              <PaymentMatrix projectName={selectedProject} type={activeTab.type === 'team' ? 'ipc_select' : 'ipc'} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
