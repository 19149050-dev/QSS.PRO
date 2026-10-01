import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { ShieldCheck, CheckCircle2, XCircle, Clock, FileText, ShoppingCart, Printer, Edit3, Trash2 } from 'lucide-react';
import ConfirmModal from '@/components/Modals/ConfirmModal';
import OrderMaterialModal from '@/components/Modals/OrderMaterialModal';

export default function ApprovalView() {
  const { materialOrders, updateMaterialOrderStatus, updateMaterialOrder, deleteMaterialOrder, setOrderAsPlaced, currentUser, users, materialSheets, projects, openGlobalAlert, openGlobalConfirm } = useStore();
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'GIÁM ĐỐC';
  const isAdminOrQS = isAdmin || currentUser?.role === 'QS';
  const isAdminOrKeToan = isAdmin || currentUser?.role === 'KẾ TOÁN' || currentUser?.role === 'KẾ TOÁN VẬT TƯ';

  const orders = materialOrders || [];
  const [activeTab, setActiveTab] = useState('pending'); // pending, approved, ordered, rejected
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [editingOrder, setEditingOrder] = useState(null);

  const filteredOrders = orders.filter(o => o.status === activeTab);

  const handleApprove = (id) => {
    updateMaterialOrderStatus(id, 'approved');
  };

  const handleReject = (id) => {
    updateMaterialOrderStatus(id, 'rejected');
  };

  const handleDelete = (id) => {
    openGlobalConfirm('Bạn có chắc chắn muốn xóa phiếu vật tư này không? Hành động này không thể hoàn tác.', () => {
      deleteMaterialOrder(id);
    });
  };

  const handleUndo = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const handlePlaceOrder = (id) => {
    setOrderAsPlaced(id, currentUser);
    openGlobalAlert('Đã chuyển phiếu thành trạng thái "Đã đặt". Vật tư đã được thêm vào bảng Nhận Vật Tư cho CHT.', 'Thành công');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5"/> Đã duyệt</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-700"><XCircle className="w-3.5 h-3.5"/> Từ chối</span>;
      case 'ordered':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-700"><ShoppingCart className="w-3.5 h-3.5"/> Đã đặt</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700"><Clock className="w-3.5 h-3.5"/> Đang xử lý</span>;
    }
  };

  const renderMaterialDetails = (quantities, projectName) => {
    const sheetKey = projectName;
    const currentSheet = materialSheets[sheetKey] || { items: [] };
    const items = currentSheet.items || [];
    
    return Object.entries(quantities).map(([itemId, qty]) => {
      const item = items.find(i => i.id === itemId);
      if (!qty) return null;
      return (
        <div key={itemId} className="flex justify-between items-center text-[14px] py-2.5 border-b border-slate-100 last:border-0">
          <span className="text-slate-700 font-medium">{item ? item.name : 'Vật tư'}</span>
          <span className="font-extrabold text-slate-900">{qty}</span>
        </div>
      );
    }).filter(Boolean);
  };

  const handlePrintOrder = (order) => {
    const currentSheet = materialSheets[order.projectName] || { items: [] };
    const items = currentSheet.items || [];
    const dateParts = order.date ? order.date.split('-') : ['', '', ''];
    const printWindow = window.open('', '_blank');
    const relatedProject = projects.find(p => p.name === order.projectName) || {};
    printWindow.document.write(`
      <html>
        <head>
          <title>In Phiếu Đặt Vật Tư - ${order.name}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { 
              font-family: 'Times New Roman', Times, serif; 
              padding: 0; 
              color: #000; 
              font-size: 13pt;
              line-height: 1.5;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px; 
              margin-bottom: 20px;
            }
            th, td { 
              border: 1px solid #000; 
              padding: 8px 10px; 
              text-align: left; 
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .header-cell { padding: 5px 10px; }
            
            .footer-section {
              display: flex;
              justify-content: flex-end;
              margin-top: 20px;
            }
            .signature-box {
              text-align: center;
              width: 50%;
            }
            .header-info {
              padding: 4px 0;
            }
          </style>
        </head>
        <body>
          <div class="text-center font-bold uppercase" style="font-size: 16pt; margin-bottom: 20px; margin-top: 10px;">
            ĐƠN ĐẶT HÀNG VẬT TƯ ${order.name !== 'auto' && !order.name.includes('PO') ? order.name : '- ' + order.name}
          </div>
          <div class="header-info uppercase">DỰ ÁN : ${order.projectName}</div>
          <div class="header-info uppercase">ĐỊA CHỈ : ${relatedProject.address || ''}</div>
          <div class="header-info uppercase">HẠNG MỤC : THI CÔNG ${relatedProject.projectType || ''}</div>
          <div class="header-info uppercase">CÔNG TY : ${relatedProject.investor || ''}</div>
          <div class="header-info uppercase" style="margin-bottom: 20px;">NGƯỜI NHẬN HÀNG : ${order.receiver || ''}</div>
          
          <table>
            <thead>
              <tr class="font-bold text-center">
                <th style="width: 8%; text-align: center;">STT</th>
                <th style="width: 52%; text-align: center;">Chủng loại vật tư</th>
                <th style="width: 20%; text-align: center;">ĐVT</th>
                <th style="width: 20%; text-align: center;">Số lượng</th>
              </tr>
            </thead>
            <tbody>
              ${(() => {
                const interiorItems = [];
                const exteriorItems = [];
                Object.entries(order.quantities).forEach(([itemId, qty]) => {
                  if (!qty) return;
                  const item = items.find(i => i.id === itemId);
                  const name = item ? item.name.toLowerCase() : '';
                  const isExterior = name.includes('ngoại') || name.includes('exterior') || name.includes('ngoài trời');
                  if (isExterior) {
                    exteriorItems.push({ item, qty });
                  } else {
                    interiorItems.push({ item, qty });
                  }
                });

                let html = '';
                
                if (interiorItems.length > 0) {
                  html += `
                    <tr>
                      <td colspan="4" class="font-bold text-center">Hệ nội thất</td>
                    </tr>
                    ${interiorItems.map((data, idx) => `
                      <tr>
                        <td class="text-center">${idx + 1}</td>
                        <td>${data.item ? data.item.name : 'Vật tư'}</td>
                        <td class="text-center">${data.item ? (currentSheet.unitMap?.[data.item.id] || data.item.unit || '') : ''}</td>
                        <td class="text-right">${Number(data.qty).toLocaleString('vi-VN')}</td>
                      </tr>
                    `).join('')}
                  `;
                }

                if (exteriorItems.length > 0) {
                  html += `
                    <tr>
                      <td colspan="4" class="font-bold text-center">Hệ ngoại thất</td>
                    </tr>
                    ${exteriorItems.map((data, idx) => `
                      <tr>
                        <td class="text-center">${idx + 1}</td>
                        <td>${data.item ? data.item.name : 'Vật tư'}</td>
                        <td class="text-center">${data.item ? (currentSheet.unitMap?.[data.item.id] || data.item.unit || '') : ''}</td>
                        <td class="text-right">${Number(data.qty).toLocaleString('vi-VN')}</td>
                      </tr>
                    `).join('')}
                  `;
                }

                return html;
              })()}
            </tbody>
          </table>
          
          <div class="footer-section">
            <div class="signature-box">
              <div style="margin-bottom: 5px;">NGÀY ${dateParts[2] || '...'} THÁNG ${dateParts[1] || '...'} NĂM ${dateParts[0] || '202...'}</div>
              <div class="font-bold uppercase">NGƯỜI LẬP</div>
              ${(() => {
                const creator = (users || []).find(u => u.id === order.createdById);
                if (creator) {
                  return `
                    ${creator.signature ? `<div style="margin-top: 10px; margin-bottom: 10px;"><img src="${creator.signature}" alt="Chữ ký" style="height: 60px; max-width: 150px; object-fit: contain; margin: 0 auto;" /></div>` : '<div style="height: 80px;"></div>'}
                    <div class="font-bold uppercase" style="margin-top: 5px;">${creator.name}</div>
                  `;
                }
                return '<div style="height: 80px;"></div><div class="font-bold uppercase" style="margin-top: 5px;">...</div>';
              })()}
            </div>
          </div>
          
          <script>
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 500);
            }, 300);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const TABS = [
    { id: 'pending', label: 'Đang xử lý', count: orders.filter(o => o.status === 'pending').length },
    { id: 'approved', label: 'Đã duyệt', count: orders.filter(o => o.status === 'approved').length, badgeColor: 'bg-orange-400' },
    { id: 'ordered', label: 'Đã đặt', count: orders.filter(o => o.status === 'ordered').length, hideBadge: true },
    { id: 'rejected', label: 'Bị từ chối', count: orders.filter(o => o.status === 'rejected').length, hideBadge: true }
  ];

  return (
    <div className="p-8 w-full">
      <div className="flex items-center gap-4 mb-8 border-b border-slate-200 pb-5">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          if (isActive) {
            return (
              <button
                key={tab.id}
                className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-blue-600 font-bold text-[17px] shadow-sm"
              >
                {tab.label} ({tab.count})
              </button>
            );
          }
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-6 py-3 text-slate-500 hover:text-slate-700 font-bold text-[17px] flex items-center gap-2 transition"
            >
              {tab.hideBadge ? (
                `${tab.label} (${tab.count})`
              ) : (
                <>
                  {tab.label}
                  {tab.count > 0 ? (
                    <span className={`px-2.5 py-0.5 rounded-full text-sm text-white ${tab.badgeColor || 'bg-slate-400'}`}>
                      {tab.count}
                    </span>
                  ) : null}
                </>
              )}
            </button>
          );
        })}
      </div>
      
      {filteredOrders.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <ShieldCheck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-700 mb-2">Chưa có phiếu nào</h2>
            <p className="text-slate-500 text-sm">Không có dữ liệu cho trạng thái này.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-indigo-300 transition-colors">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-indigo-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    {order.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Dự án: <span className="text-slate-700">{order.projectName}</span></p>
                  <p className="text-xs font-semibold text-slate-500">Ngày YC: <span className="text-slate-700">{order.date}</span></p>
                </div>
                {getStatusBadge(order.status)}
              </div>
              
              <div className="p-4 flex-1">
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">Chi tiết vật tư</h4>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  {renderMaterialDetails(order.quantities, order.projectName)}
                </div>
                
                {order.note && (
                  <div className="mt-4">
                    <h4 className="text-xs font-bold uppercase text-slate-400 mb-1 tracking-wider">Ghi chú</h4>
                    <p className="text-sm text-slate-600 bg-orange-50 p-3 rounded-xl border border-orange-100 italic">
                      "{order.note}"
                    </p>
                  </div>
                )}
              </div>

              {isAdminOrQS && order.status === 'pending' && (
                <div className="p-4 bg-white flex gap-3 border-t border-slate-100">
                  <button
                    onClick={() => handleReject(order.id)}
                    className="flex-1 py-2.5 bg-white border border-rose-500 text-rose-500 rounded-lg font-bold text-sm hover:bg-rose-50 transition"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => setEditingOrder(order)}
                    className="flex-1 py-2.5 bg-white border border-amber-500 text-amber-500 rounded-lg font-bold text-sm hover:bg-amber-50 transition flex items-center justify-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Sửa
                  </button>
                  <button
                    onClick={() => handleApprove(order.id)}
                    className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg font-bold text-sm hover:bg-emerald-600 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Phê duyệt
                  </button>
                </div>
              )}
              
              {order.status !== 'pending' && (
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 flex-wrap">
                  {isAdminOrKeToan && order.status === 'approved' && (
                    <button
                      onClick={() => handlePlaceOrder(order.id)}
                      className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-sm transition flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Xác nhận đã đặt
                    </button>
                  )}
                  {(order.status === 'approved' || order.status === 'ordered') && (
                    <button
                      onClick={() => handlePrintOrder(order)}
                      className="flex-1 py-2 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 shadow-sm transition flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      In phiếu
                    </button>
                  )}
                  {order.status === 'rejected' && (
                    <button
                      onClick={() => setEditingOrder(order)}
                      className="flex-1 py-2 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 shadow-sm transition flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Chỉnh sửa
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleUndo(order.id)}
                      className="flex-1 py-2 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 shadow-sm transition flex items-center justify-center gap-2"
                    >
                      Hoàn tác
                    </button>
                  )}
                  {isAdmin && order.status === 'rejected' && (
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 shadow-sm transition flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Xóa
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={() => {
          if (confirmModal.id) {
            updateMaterialOrderStatus(confirmModal.id, 'pending');
          }
          setConfirmModal({ isOpen: false, id: null });
        }}
        title="Xác nhận hoàn tác"
        message='Bạn có chắc chắn muốn hoàn tác phiếu này về trạng thái "Đang xử lý"?'
      />

      {editingOrder && (
        <OrderMaterialModal
          isOpen={!!editingOrder}
          onClose={() => setEditingOrder(null)}
          materialItems={materialSheets[editingOrder.projectName]?.items || []}
          projectName={editingOrder.projectName}
          initialOrder={editingOrder}
          onSubmit={(updatedData) => {
            updateMaterialOrder(editingOrder.id, updatedData);
            updateMaterialOrderStatus(editingOrder.id, 'pending');
            setEditingOrder(null);
            openGlobalAlert('Đã cập nhật phiếu và chuyển về trạng thái chờ duyệt.', 'Thành công');
          }}
        />
      )}
    </div>
  );
}
