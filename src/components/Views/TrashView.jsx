'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import { Trash2, RotateCcw, AlertCircle } from 'lucide-react';

export default function TrashPage() {
  return (
    <div className="pb-12">
      <Navbar />

      <div className="p-8 space-y-6 w-full">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto">
            <Trash2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Thùng Rác Hệ Thống</h2>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Các mục dữ liệu công trình, nhân viên, tổ đội hoặc hồ sơ IPC đã xóa sẽ nằm tại đây trước khi bị xóa vĩnh viễn.
          </p>
          <div className="pt-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
              <AlertCircle className="w-4 h-4 text-gray-400" /> Thùng rác hiện tại trống.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
