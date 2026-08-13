'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import { useStore } from '@/store/useStore';
import PaymentMatrix from '@/components/PaymentMatrix';
import { ArrowLeft, Building2, MapPin } from 'lucide-react';

export default function ProjectDetailView() {
  const { projects, activeViewParams, setActiveTab } = useStore();
  const proj = projects.find(p => p.id === activeViewParams?.id);

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  if (!proj) {
    return (
      <div className="pb-12">
        <Navbar />
        <div className="p-8 w-full">
          <button onClick={() => setActiveTab('projects')} className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition mb-6">
            <ArrowLeft className="w-4 h-4" /> Quay lại Danh sách Công trình
          </button>
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-800 mb-2">Không tìm thấy công trình</h2>
            <p className="text-sm text-gray-500">Công trình này không tồn tại hoặc đã bị xóa.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12">
      <Navbar />

      <div className="p-8 space-y-8 w-full">
        {/* Back Link */}
        <button onClick={() => setActiveTab('projects')} className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition">
          <ArrowLeft className="w-4 h-4" /> Quay lại Danh sách Công trình
        </button>

        {/* Project Header Info */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-md border border-indigo-100 uppercase">
                  {proj.orderType}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                  {proj.status}
                </span>
              </div>
              <h1 className="text-2xl font-black text-gray-900">{proj.name}</h1>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-gray-400" /> {proj.address} &bull; {proj.subContractorInfo}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-gray-400">Tổng Giá Trị Hợp Đồng</span>
                <h3 className="text-xl font-black text-indigo-700">{formatVND(proj.contractValue)}</h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 text-xs">
            <div>
              <span className="text-gray-400 font-medium block">Số hợp đồng:</span>
              <strong className="text-gray-900 font-bold block mt-0.5">{proj.contractNo || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-gray-400 font-medium block">Ngày ký kết:</span>
              <strong className="text-gray-900 font-bold block mt-0.5">{proj.contractDate || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-gray-400 font-medium block">Chỉ Huy Trưởng (CHT):</span>
              <strong className="text-indigo-900 font-bold block mt-0.5">{proj.cht?.join(', ') || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-gray-400 font-medium block">Phụ lục & Tạm ứng:</span>
              <strong className="text-emerald-700 font-bold block mt-0.5">
                {formatVND((proj.addendumValue || 0) + (proj.advancePayment || 0))}
              </strong>
            </div>
          </div>
        </div>

        {/* Interactive Payment Matrix Section */}
        <PaymentMatrix projectName={proj.name} />
      </div>
    </div>
  );
}
