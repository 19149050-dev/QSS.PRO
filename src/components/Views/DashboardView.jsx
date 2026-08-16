'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useStore, useAllowedProjects } from '@/store/useStore';
import { ChevronRight, Zap, ArrowUpRight, TrendingUp, Users, DollarSign, Building2, Clock, FileCheck, Search, Bell, BarChart3, PieChart } from 'lucide-react';

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
    <div className="pb-12 text-slate-800 bg-[#f4f7f9] min-h-screen font-sans">
      <Navbar onSearchChange={setSearchTerm} searchSearch={searchTerm} />

      <div className="p-4 sm:p-8 space-y-8 w-full max-w-[1600px] mx-auto">
        
        {/* Welcome Banner - Premium Dark Gradient */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-12 shadow-2xl shadow-indigo-900/20 group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] -mr-40 -mt-40 transition-transform duration-1000 group-hover:scale-110"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] -ml-20 -mb-20 transition-transform duration-1000 group-hover:scale-110"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-[0.2em] border border-white/10 mb-6 shadow-xl">
                <Zap className="w-4 h-4 text-yellow-400" fill="currentColor" /> QSS PRO MANAGEMENT
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-slate-300">
                Tổng Quan Tiến Độ<br />Thu Tiền & Thanh Toán
              </h1>
              <p className="text-sm md:text-base text-indigo-200/80 max-w-2xl font-medium leading-relaxed">
                Theo dõi dòng tiền IPC nghiệm thu A-B, phân bổ tiến độ thanh toán B-C cho Tổ Đội thầu phụ & quản lý chi phí vật tư dự án theo thời gian thực.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('projects')}
                className="px-6 py-4 bg-white text-indigo-950 font-extrabold rounded-2xl text-[13px] shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all active:scale-95 flex items-center gap-2 hover:-translate-y-1"
              >
                Quản lý công trình <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Financial Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white rounded-[2rem] p-7 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100/50 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 group-hover:bg-blue-100/50 transition-colors"></div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">Tổng Hợp Đồng</span>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">{formatVND(totalContractVal)}</h3>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                  <ArrowUpRight className="w-3 h-3" /> {projects.length}
                </div>
                <span className="text-[12px] text-slate-500 font-medium">Dự án đang thi công</span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-[2rem] p-7 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100/50 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 group-hover:bg-emerald-100/50 transition-colors"></div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">Đã Thu (A-B)</span>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">{formatVND(totalABCollected)}</h3>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                  <BarChart3 className="w-3 h-3" /> {Math.round((totalABCollected / (totalContractVal || 1)) * 100)}%
                </div>
                <span className="text-[12px] text-slate-500 font-medium">Đạt tỷ lệ</span>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-[2rem] p-7 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100/50 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-10 group-hover:bg-amber-100/50 transition-colors"></div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">Đã Chi (B-C)</span>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">{formatVND(totalBCCostPaid)}</h3>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                  <PieChart className="w-3 h-3" /> {teams.length}
                </div>
                <span className="text-[12px] text-slate-500 font-medium">Tổ Đội thầu phụ</span>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-[2rem] p-7 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100/50 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 group-hover:bg-indigo-100/50 transition-colors"></div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">Còn Phải Thu</span>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">{formatVND(remainingReceivable)}</h3>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[12px] text-slate-500 font-medium">Bao gồm cả tạm ứng & bảo hành</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Projects Table */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Công Trình Đang Thi Công</h3>
                <p className="text-[12px] text-slate-500 font-medium mt-1">Quản lý tổng quan các dự án và tiến độ hiện tại</p>
              </div>
              <button onClick={() => setActiveTab('projects')} className="text-[12px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 w-max">
                Xem tất cả ({projects.length}) <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.15em]">
                    <th className="pb-2 px-4 font-bold">Dự án</th>
                    <th className="pb-2 px-4 font-bold">Chỉ Huy Trưởng</th>
                    <th className="pb-2 px-4 font-bold text-right">Giá trị (VNĐ)</th>
                    <th className="pb-2 px-4 font-bold text-center">Tiến độ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.slice(0, 5).map((proj) => (
                    <tr key={proj.id} className="bg-slate-50/50 hover:bg-slate-50 transition-colors group rounded-2xl">
                      <td className="py-4 px-4 rounded-l-2xl">
                        <button onClick={() => setActiveTab('project-detail', { id: proj.id })} className="font-bold text-slate-800 hover:text-indigo-600 transition-colors text-sm text-left">
                          {proj.name}
                        </button>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-1">{proj.address || 'Không có địa chỉ'}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {proj.cht?.map((c, idx) => (
                            <span key={idx} className="inline-block bg-white text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                              {c}
                            </span>
                          )) || <span className="text-xs text-slate-400 italic">Trống</span>}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-black text-slate-800 text-sm">
                        {formatVND(proj.contractValue)}
                      </td>
                      <td className="py-4 px-4 rounded-r-2xl">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2 rounded-full" style={{ width: `${proj.progress}%` }}></div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 w-8 text-right">{proj.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent IPCs */}
          <div className="bg-white rounded-[2rem] p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Hồ Sơ IPC</h3>
                  <p className="text-[12px] text-slate-500 font-medium mt-1">Cập nhật gần đây nhất</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <FileCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-4">
                {ipcs.slice(0, 4).map((ipc) => (
                  <div key={ipc.id} className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:border-indigo-100 hover:shadow-[0_8px_30px_-10px_rgba(79,70,229,0.15)] transition-all group cursor-pointer" onClick={() => setActiveTab('ipc')}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-1.5 rounded-lg border ${
                        ipc.type === 'A-B' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {ipc.type} • {ipc.period}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                        ipc.status === 'Đã giải ngân' || ipc.status === 'Đã thanh toán' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {ipc.status}
                      </span>
                    </div>

                    <div className="font-extrabold text-sm text-slate-800 mb-4 line-clamp-1 group-hover:text-indigo-600 transition-colors">{ipc.projectName}</div>
                    
                    <div className="flex items-end justify-between">
                      <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {ipc.submitDate}
                      </div>
                      <div className="font-black text-[15px] text-slate-900 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        {formatVND(ipc.approvedAmount || ipc.proposedAmount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <button
                onClick={() => setActiveTab('ipc')}
                className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-[12px] font-bold flex items-center justify-center gap-2 transition-all shadow-[0_10px_20px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_30px_-10px_rgba(79,70,229,0.4)]"
              >
                TẠO HỒ SƠ MỚI
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
