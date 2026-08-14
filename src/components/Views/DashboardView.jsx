'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useStore, useAllowedProjects } from '@/store/useStore';
import { ChevronRight, Zap, ArrowUpRight, TrendingUp, Users, DollarSign, Building2, Clock, FileCheck } from 'lucide-react';

export default function DashboardView() {
  const { ipcs, teams, materials, setActiveTab } = useStore();
  const projects = useAllowedProjects();
  const [searchTerm, setSearchTerm] = useState('');

  // Calculations
  const totalContractVal = projects.reduce((acc, p) => acc + (p.contractValue || 0) + (p.addendumValue || 0), 0);
  const totalABCollected = ipcs.filter(i => i.type === 'A-B' && i.status === 'Đã giải ngân').reduce((acc, i) => acc + (i.approvedAmount || 0), 0);
  const totalBCCostPaid = ipcs.filter(i => i.type === 'B-C' && i.status === 'Đã thanh toán').reduce((acc, i) => acc + (i.approvedAmount || 0), 0);
  const remainingReceivable = totalContractVal - totalABCollected;

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.address && p.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="pb-12 text-slate-900 bg-white min-h-screen">
      <Navbar onSearchChange={setSearchTerm} searchSearch={searchTerm} />

      <div className="p-8 space-y-8 w-full max-w-[1600px] mx-auto">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-black text-white p-8 shadow-xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute left-0 bottom-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-20 -mb-20"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-[10px] uppercase font-bold tracking-widest border border-white/20 mb-4">
                <Zap className="w-3.5 h-3.5 text-white" /> Hệ thống Quản Lý Tiến Độ QSS PRO
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Tổng Quan Tiến Độ Thu Tiền & Thanh Toán
              </h1>
              <p className="text-sm text-slate-300 mt-2 max-w-2xl font-medium">
                Theo dõi chính xác 100% dòng tiền IPC nghiệm thu A-B từ Chủ Đầu Tư, phân bổ tiến độ thanh toán B-C cho các Tổ Đội thầu phụ & quản lý vật tư dự án.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('projects')}
                className="px-6 py-3 bg-white text-black font-bold rounded-xl text-xs shadow-lg hover:bg-slate-100 transition-all active:scale-95 flex items-center gap-2"
              >
                Quản lý công trình <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Financial Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-black hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tổng Giá Trị Hợp Đồng</span>
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center ring-1 ring-slate-200 group-hover:bg-slate-100 transition-colors">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-5">
              <h3 className="text-2xl font-black text-slate-900">{formatVND(totalContractVal)}</h3>
              <p className="text-[11px] text-slate-500 mt-1.5 font-medium flex items-center gap-1.5">
                <span className="text-slate-900 font-bold flex items-center bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200"><ArrowUpRight className="w-3 h-3 mr-0.5" /> {projects.length}</span> Dự án đang thi công
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-black hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Đã Thu CĐT (IPC A-B)</span>
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center ring-1 ring-slate-200 group-hover:bg-slate-100 transition-colors">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-5">
              <h3 className="text-2xl font-black text-slate-900">{formatVND(totalABCollected)}</h3>
              <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                Đạt <span className="font-bold text-slate-900 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">{Math.round((totalABCollected / (totalContractVal || 1)) * 100)}%</span> tổng hợp đồng
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-black hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Đã Chi Tổ Đội (IPC B-C)</span>
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center ring-1 ring-slate-200 group-hover:bg-slate-100 transition-colors">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-5">
              <h3 className="text-2xl font-black text-slate-900">{formatVND(totalBCCostPaid)}</h3>
              <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                Cho <span className="font-bold text-slate-900 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">{teams.length} Tổ Đội</span> thầu phụ
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-black hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Còn Phải Thu CĐT</span>
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center ring-1 ring-slate-200 group-hover:bg-slate-100 transition-colors">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-5">
              <h3 className="text-2xl font-black text-slate-900">{formatVND(remainingReceivable)}</h3>
              <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                Bao gồm cả tạm ứng & bảo hành
              </p>
            </div>
          </div>
        </div>

        {/* Section Grid: Project List & Recent IPC Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Projects Summary Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Danh Sách Công Trình Đang Thi Công</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-1">Giá trị hợp đồng và chỉ huy trưởng phụ trách</p>
              </div>
              <button onClick={() => setActiveTab('projects')} className="text-[11px] font-bold text-slate-900 hover:text-black flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors">
                Xem tất cả ({projects.length}) <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="pb-3 px-2">Công trình</th>
                    <th className="pb-3 px-2">Số hợp đồng</th>
                    <th className="pb-3 px-2">Chỉ Huy Trưởng</th>
                    <th className="pb-3 px-2 text-right">Giá trị HĐ (VNĐ)</th>
                    <th className="pb-3 px-2 text-center">Tiến độ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProjects.slice(0, 6).map((proj) => (
                    <tr key={proj.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-4 px-2 font-bold text-slate-900">
                        <button onClick={() => setActiveTab('project-detail', { id: proj.id })} className="hover:text-black transition-colors">
                          {proj.name}
                        </button>
                        <div className="text-[10px] text-slate-500 font-medium mt-1">{proj.address}</div>
                      </td>
                      <td className="py-4 px-2 text-[11px] font-medium text-slate-500">{proj.contractNo || 'N/A'}</td>
                      <td className="py-4 px-2">
                        <span className="inline-block bg-slate-50 text-slate-700 text-[10px] font-semibold px-2 py-1 rounded-md border border-slate-200">
                          {proj.cht?.join(', ') || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right font-extrabold text-slate-900">
                        {formatVND(proj.contractValue)}
                      </td>
                      <td className="py-4 px-2 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden ring-1 ring-slate-200 inset-shadow">
                            <div className="bg-slate-900 h-1.5 rounded-full" style={{ width: `${proj.progress}%` }}></div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 w-6 text-right">{proj.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent IPC Transactions Feed */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Hồ Sơ IPC Gần Đây</h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">Tiến độ phê duyệt nghiệm thu</p>
                </div>
                <button onClick={() => setActiveTab('ipc')} className="text-[11px] font-bold text-slate-900 hover:text-black flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors">
                  Chi tiết
                </button>
              </div>

              <div className="space-y-3">
                {ipcs.slice(0, 5).map((ipc) => (
                  <div key={ipc.id} className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:border-black hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className={`font-bold text-[9px] uppercase tracking-wider px-2 py-1 rounded border ${
                        ipc.type === 'A-B' ? 'bg-slate-50 text-slate-900 border-slate-200' : 'bg-slate-100 text-slate-900 border-slate-300'
                      }`}>
                        IPC {ipc.type} - {ipc.period}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                        ipc.status === 'Đã giải ngân' || ipc.status === 'Đã thanh toán' 
                          ? 'bg-black text-white' 
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {ipc.status}
                      </span>
                    </div>

                    <div className="font-bold text-xs text-slate-900 mt-2 group-hover:text-black transition-colors">{ipc.projectName}</div>
                    <div className="flex items-center justify-between text-xs mt-3">
                      <span className="text-slate-400 text-[10px] font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> {ipc.submitDate}</span>
                      <span className="font-extrabold text-slate-800">{formatVND(ipc.approvedAmount || ipc.proposedAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <button
                onClick={() => setActiveTab('ipc')}
                className="w-full py-3 bg-black hover:bg-slate-900 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <FileCheck className="w-4 h-4" /> TẠO HỒ SƠ IPC MỚI
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
