'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useStore } from '@/store/useStore';
import PaymentMatrix from '@/components/PaymentMatrix';
import { ShieldCheck, CheckCircle2, Clock, FileSpreadsheet, Search, Building2 } from 'lucide-react';

export default function AcceptancePage() {
  const { projects } = useStore();
  const [selectedProject, setSelectedProject] = useState(projects[0]?.name || 'SUNHOME');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="pb-12">
      <Navbar onSearchChange={setSearchTerm} searchSearch={searchTerm} />

      <div className="p-8 space-y-8 w-full">
        {/* Header Project Selector */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-600" /> Hồ Sơ Nghiệm Thu & Ma Trận Đợt Thanh Toán
            </h1>
            <p className="text-xs text-gray-500 mt-1">Theo dõi tiến độ nghiệm thu hoàn thành từng tầng và từng hạng mục thi công.</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-700">Chọn dự án:</span>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {projects.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Acceptance Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase">Đã Nghiệm Thu</span>
              <h3 className="text-xl font-black text-emerald-600">8 Tầng (PK_1, PK_2)</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase">Đang Đề Nghị</span>
              <h3 className="text-xl font-black text-amber-600">4 Tầng</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase">Gói Thầu Thi Công</span>
              <h3 className="text-xl font-black text-indigo-700">10 Hạng Mục</h3>
            </div>
          </div>
        </div>

        {/* Payment Matrix Render */}
        <PaymentMatrix projectName={selectedProject} />
      </div>
    </div>
  );
}
