'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useStore } from '@/store/useStore';
import AddMaterialModal from '@/components/Modals/AddMaterialModal';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Truck, 
  Trash2, 
  Edit3,
  DollarSign
} from 'lucide-react';

export default function MaterialsPage() {
  const { materials, deleteMaterial } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.code && m.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (m.supplier && m.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (m.projectName && m.projectName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="pb-12">
      <Navbar onOpenAddModal={() => setIsAddModalOpen(true)} onSearchChange={setSearchTerm} searchSearch={searchTerm} />

      <div className="p-8 space-y-6 w-full">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm vật tư, mã vật tư, nhà cung cấp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-500/20 transition active:scale-95 self-start sm:self-auto"
          >
            <Package className="w-4 h-4" /> Thêm vật tư mới
          </button>
        </div>

        {/* Materials Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left qss-table">
              <thead>
                <tr>
                  <th>MÃ & TÊN VẬT TƯ</th>
                  <th>DỰ ÁN ÁP DỤNG</th>
                  <th>ĐƠN VỊ TÍNH</th>
                  <th className="text-right">ĐƠN GIÁ (VNĐ)</th>
                  <th className="text-center">KẾ HOẠCH</th>
                  <th className="text-center">THỰC TẾ NHẬP</th>
                  <th className="text-right">TỔNG THÀNH TIỀN</th>
                  <th>NHÀ CUNG CẤP</th>
                  <th className="text-center">TRẠNG THÁI</th>
                  <th className="text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((mat) => {
                  const totalCost = (mat.quantityActual || 0) * (mat.unitPrice || 0);
                  const isOver = (mat.quantityActual || 0) > (mat.quantityPlan || 0);

                  return (
                    <tr key={mat.id} className="hover:bg-slate-50 transition">
                      <td>
                        <div className="font-extrabold text-gray-900">{mat.name}</div>
                        <div className="text-xs text-indigo-600 font-mono font-semibold">{mat.code || 'VT-00'}</div>
                      </td>
                      <td className="font-bold text-gray-800 text-xs">{mat.projectName}</td>
                      <td className="text-xs text-gray-600 font-medium">{mat.unit}</td>
                      <td className="text-right font-bold text-indigo-900 text-xs">{formatVND(mat.unitPrice)}</td>
                      <td className="text-center font-bold text-gray-700">{mat.quantityPlan}</td>
                      <td className={`text-center font-extrabold ${isOver ? 'text-red-600' : 'text-emerald-700'}`}>
                        {mat.quantityActual}
                      </td>
                      <td className="text-right font-extrabold text-indigo-700 text-xs">{formatVND(totalCost)}</td>
                      <td className="text-xs text-gray-600 font-medium">{mat.supplier || 'N/A'}</td>
                      <td className="text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isOver ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}>
                          {isOver ? <AlertTriangle className="w-3 h-3 text-red-500" /> : <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                          {mat.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button title="Sửa" className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            title="Xóa"
                            onClick={() => deleteMaterial(mat.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AddMaterialModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
