'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import { Trash2, RotateCcw, AlertCircle, Trash, Clock, User, Building } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function TrashPage() {
  const { trashMatrix, restoreFromTrash, permanentlyDeleteFromTrash, activeProject, openGlobalConfirm } = useStore();

  // Flatten all trash items from all projects into a single array
  const allTrashItems = Object.entries(trashMatrix || {}).flatMap(([projectName, items]) => {
    return (items || []).map(item => ({ ...item, _projectName: projectName }));
  }).sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

  const handleRestore = (projectName, id) => {
    openGlobalConfirm(
      `Bạn có chắc chắn muốn khôi phục dữ liệu này về dự án ${projectName}?`,
      () => restoreFromTrash(projectName, id),
      'Xác nhận Khôi phục'
    );
  };

  const handlePermanentDelete = (projectName, id) => {
    openGlobalConfirm(
      'Dữ liệu này sẽ bị xoá vĩnh viễn và không thể khôi phục. Bạn có chắc chắn?',
      () => permanentlyDeleteFromTrash(projectName, id),
      'Xác nhận Xóa vĩnh viễn'
    );
  };

  return (
    <div className="pb-12">
      <Navbar />

      <div className="p-8 space-y-6 w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thùng Rác Hệ Thống</h1>
            <p className="text-sm text-gray-500">Các dữ liệu bị xoá sẽ được lưu tại đây trước khi xoá vĩnh viễn.</p>
          </div>
        </div>

        {allTrashItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-200 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-gray-50 text-gray-300 flex items-center justify-center mx-auto">
              <Trash2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Thùng rác trống</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Chưa có dữ liệu nào bị xoá. Các mục xoá nhầm (như Tầng, Hạng mục) sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {allTrashItems.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-100 uppercase">
                      {item.type.replace('_', ' ')}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-gray-400" />
                      Dự án: <span className="font-medium text-gray-700">{item._projectName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-gray-400" />
                      Người xoá: <span className="font-medium text-gray-700">{item.deletedBy}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400" />
                      Thời gian: <span className="font-medium text-gray-700">{new Date(item.deletedAt).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleRestore(item._projectName, item.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium rounded-xl transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Khôi phục
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(item._projectName, item.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 font-medium rounded-xl transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                    Xoá vĩnh viễn
                  </button>
                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
