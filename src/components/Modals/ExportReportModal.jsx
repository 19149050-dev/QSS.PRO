import React, { useMemo } from 'react';
import { X, FileBarChart } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

export default function ExportReportModal({ isOpen, onClose, exportRows = [], materialItems = [], dinhMucMap = {} }) {
  if (!isOpen) return null;

  // Calculate totals per floor and grand totals
  const reportData = useMemo(() => {
    let grandTotals = {};
    materialItems.forEach(m => {
      grandTotals[m.id] = { quantity: 0, kl: 0 };
    });

    const rows = exportRows.reduce((acc, row) => {
      const rowData = { floorName: row.date || 'Không tên', totals: {}, hasData: false };
      
      materialItems.forEach(item => {
        let totalQty = 0;
        const entries = row.values?.[item.id] || [];
        entries.forEach(entry => {
          if (entry.quantities) {
            Object.values(entry.quantities).forEach(q => {
              totalQty += parseFloat(q) || 0;
            });
          } else {
            totalQty += parseFloat(entry.quantity) || 0;
          }
        });
        
        const dm = parseFloat(dinhMucMap[item.id]) || 0;
        const kl = dm > 0 ? totalQty * dm : 0;
        
        rowData.totals[item.id] = { quantity: totalQty, kl: kl };
        
        if (totalQty > 0) {
          rowData.hasData = true;
        }

        grandTotals[item.id].quantity += totalQty;
        grandTotals[item.id].kl += kl;
      });
      
      if (rowData.hasData && rowData.floorName.trim() !== '') {
        acc.push(rowData);
      }
      return acc;
    }, []);

    return { rows, grandTotals };
  }, [exportRows, materialItems, dinhMucMap]);

  const handleExportExcel = () => {
    const table = document.getElementById('export-report-table');
    if (!table) return;
    const wb = XLSX.utils.table_to_book(table, { sheet: 'Báo cáo xuất vật tư' });
    const ws = wb.Sheets['Báo cáo xuất vật tư'];
    
    // Auto-size columns
    const cols = [{ wch: 15 }]; // Tầng
    materialItems.forEach(() => cols.push({ wch: 15 }));
    ws['!cols'] = cols;

    XLSX.writeFile(wb, `Bao_cao_tong_xuat_vat_tu.xlsx`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-[95vw] xl:max-w-7xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="p-4 sm:p-6 bg-indigo-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileBarChart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Báo cáo tổng xuất vật tư theo tầng</h3>
              <p className="text-sm opacity-90">Tổng hợp toàn bộ khối lượng vật tư đã xuất cho từng tầng</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-auto flex-1 bg-slate-50">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table id="export-report-table" className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-100 text-slate-800 text-xs uppercase font-bold sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 border border-slate-200 bg-slate-100 min-w-[120px] sticky left-0 z-20">Tầng / Khu vực</th>
                    {materialItems.map(m => (
                      <th key={m.id} className="px-4 py-3 border border-slate-200 text-center min-w-[100px]">{m.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.rows.length === 0 ? (
                    <tr>
                      <td colSpan={materialItems.length + 1} className="px-4 py-8 text-center text-slate-500 font-medium">
                        Chưa có dữ liệu xuất vật tư nào.
                      </td>
                    </tr>
                  ) : (
                    reportData.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-slate-700 border border-slate-200 sticky left-0 bg-white shadow-[1px_0_2px_-1px_rgba(0,0,0,0.1)]">
                          {row.floorName}
                        </td>
                        {materialItems.map(m => {
                          const hasQty = row.totals[m.id].quantity > 0;
                          return (
                            <td key={m.id} className="px-4 py-2.5 text-center font-medium border border-slate-200">
                              {hasQty ? (
                                <span className="text-emerald-600 font-bold">{row.totals[m.id].quantity.toLocaleString('vi-VN')}</span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
                {reportData.rows.length > 0 && (
                  <tfoot className="sticky bottom-0 z-10 bg-indigo-50 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">
                    <tr>
                      <td className="px-4 py-3 font-extrabold text-indigo-900 border border-slate-200 sticky left-0 bg-indigo-50">
                        TỔNG CỘNG
                      </td>
                      {materialItems.map(m => {
                        const hasQty = reportData.grandTotals[m.id].quantity > 0;
                        return (
                          <td key={m.id} className="px-4 py-3 text-center font-extrabold text-indigo-700 border border-slate-200 bg-indigo-50">
                            {hasQty ? (
                              <span>{reportData.grandTotals[m.id].quantity.toLocaleString('vi-VN')}</span>
                            ) : (
                              <span className="text-indigo-300/50">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-extrabold text-indigo-900 border border-slate-200 sticky left-0 bg-indigo-100">
                        KHỐI LƯỢNG THEO ĐỊNH MỨC
                      </td>
                      {materialItems.map(m => {
                        const kl = reportData.grandTotals[m.id].kl;
                        return (
                          <td key={m.id} className="px-4 py-3 text-center font-extrabold text-indigo-800 border border-slate-200 bg-indigo-100">
                            {kl > 0 ? (
                              <span>{kl.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</span>
                            ) : (
                              <span className="text-indigo-400/50">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Đóng
          </button>
          <button
            onClick={handleExportExcel}
            disabled={reportData.rows.length === 0}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Xuất Excel
          </button>
        </div>
      </div>
    </div>
  );
}
