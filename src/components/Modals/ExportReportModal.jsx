'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, FileBarChart, Printer, Download, DollarSign, Package, Layers, Check, Edit3 } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

export default function ExportReportModal({
  isOpen,
  onClose,
  exportRows = [],
  materialItems = [],
  dinhMucMap = {},
  priceMap = {},
  unitMap = {},
  projectName = '',
  onSavePrices
}) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'floors'
  const [editingPrices, setEditingPrices] = useState({});
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditingPrices({ ...(priceMap || {}) });
      setIsSaved(false);
    }
  }, [isOpen, priceMap]);

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
        const cellData = row.values?.[item.id];
        if (Array.isArray(cellData)) {
          cellData.forEach(entry => {
            if (entry) {
              if (entry.quantities && typeof entry.quantities === 'object') {
                Object.values(entry.quantities).forEach(q => {
                  totalQty += parseFloat(q) || 0;
                });
              } else if (entry.quantity !== undefined && entry.quantity !== null) {
                totalQty += parseFloat(entry.quantity) || 0;
              }
            }
          });
        } else if (cellData && typeof cellData === 'object') {
          if (cellData.quantities && typeof cellData.quantities === 'object') {
            Object.values(cellData.quantities).forEach(q => {
              totalQty += parseFloat(q) || 0;
            });
          } else if (cellData.quantity !== undefined && cellData.quantity !== null) {
            totalQty += parseFloat(cellData.quantity) || 0;
          }
        } else if (typeof cellData === 'number') {
          totalQty += cellData;
        } else if (typeof cellData === 'string' && cellData.trim() !== '') {
          totalQty += parseFloat(cellData.replace(/,/g, '')) || 0;
        }
        
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

    // Summary list for all materials
    let totalAllQuantity = 0;
    let totalAllKL = 0;
    let totalAllAmount = 0;

    const summaryList = materialItems.map((item, idx) => {
      const qty = grandTotals[item.id]?.quantity || 0;
      const dm = parseFloat(dinhMucMap[item.id]) || 0;
      const kl = grandTotals[item.id]?.kl || 0;
      const price = parseFloat(editingPrices[item.id] ?? priceMap[item.id]) || 0;
      const amount = qty * price;
      const unit = unitMap[item.id] || '';

      totalAllQuantity += qty;
      totalAllKL += kl;
      totalAllAmount += amount;

      return {
        id: item.id,
        stt: idx + 1,
        name: item.name || `Vật tư ${idx + 1}`,
        unit,
        dinhMuc: dm,
        quantity: qty,
        kl,
        price,
        amount
      };
    });

    return { rows, grandTotals, summaryList, totalAllQuantity, totalAllKL, totalAllAmount };
  }, [exportRows, materialItems, dinhMucMap, editingPrices, priceMap, unitMap]);

  if (!isOpen) return null;

  const handlePriceChange = (id, rawValue) => {
    const cleanNum = rawValue.replace(/[^0-9]/g, '');
    setEditingPrices(prev => ({
      ...prev,
      [id]: cleanNum
    }));
    setIsSaved(false);
  };

  const handleSavePrices = () => {
    if (onSavePrices) {
      onSavePrices(editingPrices);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    }
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Bảng Tổng Hợp Chi Phí
    const summaryData = [
      [`BÁO CÁO TỔNG HỢP CHI PHÍ XUẤT VẬT TƯ - ${projectName.toUpperCase()}`],
      [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`],
      [],
      ['STT', 'Tên vật tư', 'Đơn vị tính', 'Định mức', 'Số lượng xuất', 'Khối lượng m2', 'Đơn giá (VNĐ)', 'Thành tiền (VNĐ)']
    ];

    reportData.summaryList.forEach((item, idx) => {
      summaryData.push([
        idx + 1,
        item.name,
        item.unit,
        item.dinhMuc > 0 ? item.dinhMuc : '',
        item.quantity,
        item.kl > 0 ? item.kl : '',
        item.price > 0 ? item.price : 0,
        item.amount > 0 ? item.amount : 0
      ]);
    });

    summaryData.push([
      'TỔNG CỘNG',
      '',
      '',
      '',
      reportData.totalAllQuantity,
      reportData.totalAllKL,
      '',
      reportData.totalAllAmount
    ]);

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [
      { wch: 8 },
      { wch: 35 },
      { wch: 15 },
      { wch: 12 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 22 }
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng Hợp Chi Phí');

    // Sheet 2: Chi Tiết Xuất Theo Tầng
    const floorTable = document.getElementById('export-report-table');
    if (floorTable) {
      const wsFloors = XLSX.utils.table_to_sheet(floorTable);
      XLSX.utils.book_append_sheet(wb, wsFloors, 'Chi Tiết Theo Tầng');
    }

    XLSX.writeFile(wb, `Bao_cao_xuat_vat_tu_${projectName || 'tong'}.xlsx`);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printTitle = `BÁO CÁO XUẤT VẬT TƯ${projectName ? ` - ${projectName.toUpperCase()}` : ''}`;

    let summaryRowsHtml = reportData.summaryList.map(item => `
      <tr>
        <td class="text-center">${item.stt}</td>
        <td><strong>${item.name}</strong></td>
        <td class="text-center">${item.unit || '-'}</td>
        <td class="text-center">${item.dinhMuc > 0 ? item.dinhMuc : '-'}</td>
        <td class="text-right"><strong>${item.quantity.toLocaleString('vi-VN')}</strong></td>
        <td class="text-right">${item.kl > 0 ? item.kl.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : '-'}</td>
        <td class="text-right text-emerald">${item.price > 0 ? item.price.toLocaleString('vi-VN') + ' đ' : '-'}</td>
        <td class="text-right text-blue"><strong>${item.amount > 0 ? item.amount.toLocaleString('vi-VN') + ' đ' : '-'}</strong></td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${printTitle}</title>
          <style>
            @page { size: A4 landscape; margin: 15mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 0; color: #111; font-size: 13px; }
            h2 { color: #1e1b4b; margin-bottom: 4px; font-size: 20px; text-align: center; text-transform: uppercase; }
            .subtitle { color: #64748b; font-size: 12px; margin-bottom: 20px; text-align: center; font-style: italic; }
            .kpi-row { display: flex; justify-content: space-around; margin-bottom: 20px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
            .kpi-box { text-align: center; }
            .kpi-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; }
            .kpi-val { font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 2px; }
            .kpi-val.highlight { color: #059669; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 12px; }
            th { background-color: #f1f5f9; color: #1e293b; text-transform: uppercase; font-size: 11px; font-weight: bold; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-emerald { color: #059669; }
            .text-blue { color: #2563eb; }
            tfoot tr td { font-weight: bold; background-color: #f8fafc; border-top: 2px solid #64748b; }
          </style>
        </head>
        <body>
          <h2>${printTitle}</h2>
          <div class="subtitle">Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}</div>
          
          <div class="kpi-row">
            <div class="kpi-box">
              <div class="kpi-label">Tổng số lượng xuất</div>
              <div class="kpi-val">${reportData.totalAllQuantity.toLocaleString('vi-VN')}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Tổng khối lượng m2</div>
              <div class="kpi-val">${reportData.totalAllKL.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} m²</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Tổng thành tiền xuất</div>
              <div class="kpi-val highlight">${reportData.totalAllAmount.toLocaleString('vi-VN')} VNĐ</div>
            </div>
          </div>

          <h3 style="font-size: 14px; margin-bottom: 8px; text-transform: uppercase; color: #334155;">1. Bảng Tổng Hợp Chi Phí Vật Tư</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 5%">STT</th>
                <th style="width: 30%">Tên vật tư</th>
                <th style="width: 10%">Đơn vị</th>
                <th style="width: 10%">Định mức</th>
                <th style="width: 12%" class="text-right">Số lượng xuất</th>
                <th style="width: 11%" class="text-right">Khối lượng m²</th>
                <th style="width: 11%" class="text-right">Đơn giá</th>
                <th style="width: 11%" class="text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${summaryRowsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" class="text-center">TỔNG CỘNG</td>
                <td class="text-right">${reportData.totalAllQuantity.toLocaleString('vi-VN')}</td>
                <td class="text-right">${reportData.totalAllKL.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}</td>
                <td></td>
                <td class="text-right text-blue">${reportData.totalAllAmount.toLocaleString('vi-VN')} đ</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 350);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[100] p-3 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-[96vw] xl:max-w-7xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-xs">
              <FileBarChart className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg leading-tight">Báo Cáo Xuất Vật Tư & Chi Phí</h3>
                {projectName && (
                  <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold">
                    {projectName}
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-100 mt-0.5">Truy xuất số lượng, định mức, đơn giá và tổng thành tiền vật tư đã xuất</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-auto flex-1 bg-slate-50 space-y-4">
          
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng số lượng xuất</span>
                <div className="text-xl sm:text-2xl font-black text-slate-800">
                  {reportData.totalAllQuantity.toLocaleString('vi-VN')}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Khối lượng hoàn thành</span>
                <div className="text-xl sm:text-2xl font-black text-indigo-700">
                  {reportData.totalAllKL.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} <span className="text-sm font-semibold text-slate-500">m²</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-xs">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Tổng thành tiền vật tư</span>
                <div className="text-xl sm:text-2xl font-black text-emerald-700">
                  {reportData.totalAllAmount.toLocaleString('vi-VN')} <span className="text-sm font-bold text-emerald-600">VNĐ</span>
                </div>
              </div>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('summary')}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'summary'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                Tổng Hợp Chi Phí
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('floors')}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'floors'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                Chi Tiết Theo Tầng
              </button>
            </div>

            {activeTab === 'summary' && onSavePrices && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSavePrices}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
                >
                  {isSaved ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                  {isSaved ? 'Đã lưu đơn giá!' : 'Lưu Đơn Giá'}
                </button>
              </div>
            )}
          </div>

          {/* Tab 1: BẢNG TỔNG HỢP CHI PHÍ */}
          {activeTab === 'summary' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-3 text-center w-12 border-r border-slate-200">STT</th>
                      <th className="px-4 py-3 border-r border-slate-200">Tên vật tư</th>
                      <th className="px-3 py-3 text-center border-r border-slate-200 w-24">Đơn vị</th>
                      <th className="px-3 py-3 text-center border-r border-slate-200 w-24">Định mức</th>
                      <th className="px-4 py-3 text-right border-r border-slate-200 w-32">Số lượng xuất</th>
                      <th className="px-4 py-3 text-right border-r border-slate-200 w-32">Khối lượng m²</th>
                      <th className="px-4 py-3 text-right border-r border-slate-200 w-44">Đơn giá (VNĐ)</th>
                      <th className="px-4 py-3 text-right text-indigo-900 w-44">Thành tiền (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.summaryList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500 font-medium">
                          Chưa có vật tư nào.
                        </td>
                      </tr>
                    ) : (
                      reportData.summaryList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-3 py-2.5 text-center font-semibold text-slate-500 border-r border-slate-200">
                            {item.stt}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-slate-800 border-r border-slate-200">
                            {item.name}
                          </td>
                          <td className="px-3 py-2.5 text-center text-slate-600 font-medium border-r border-slate-200">
                            {item.unit || '-'}
                          </td>
                          <td className="px-3 py-2.5 text-center text-slate-600 font-medium border-r border-slate-200">
                            {item.dinhMuc > 0 ? item.dinhMuc : '-'}
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-800 border-r border-slate-200">
                            {item.quantity > 0 ? item.quantity.toLocaleString('vi-VN') : '-'}
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium text-slate-700 border-r border-slate-200">
                            {item.kl > 0 ? item.kl.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : '-'}
                          </td>
                          <td className="px-3 py-2 border-r border-slate-200 text-right">
                            <input
                              type="text"
                              placeholder="0"
                              value={editingPrices[item.id] !== undefined && editingPrices[item.id] !== '' ? Number(String(editingPrices[item.id]).replace(/,/g, '')).toLocaleString('vi-VN') : ''}
                              onChange={(e) => handlePriceChange(item.id, e.target.value)}
                              className="w-full max-w-[130px] px-2.5 py-1 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-emerald-500 rounded-lg text-emerald-700 font-bold text-right outline-none text-xs transition"
                            />
                          </td>
                          <td className="px-4 py-2.5 text-right font-black text-indigo-700 bg-indigo-50/20">
                            {item.amount > 0 ? (
                              <span>{item.amount.toLocaleString('vi-VN')} đ</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {reportData.summaryList.length > 0 && (
                    <tfoot className="bg-indigo-50 border-t-2 border-indigo-200 font-bold text-indigo-900">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-center uppercase font-black border-r border-indigo-200">
                          TỔNG CỘNG
                        </td>
                        <td className="px-4 py-3 text-right font-black border-r border-indigo-200">
                          {reportData.totalAllQuantity.toLocaleString('vi-VN')}
                        </td>
                        <td className="px-4 py-3 text-right font-black border-r border-indigo-200">
                          {reportData.totalAllKL.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
                        </td>
                        <td className="px-4 py-3 border-r border-indigo-200"></td>
                        <td className="px-4 py-3 text-right font-black text-base text-emerald-700 bg-emerald-50/50">
                          {reportData.totalAllAmount.toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: MA TRẬN CHI TIẾT THEO TẦNG */}
          {activeTab === 'floors' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table id="export-report-table" className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-800 text-xs uppercase font-bold sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 border border-slate-200 bg-slate-100 min-w-[130px] sticky left-0 z-20">Tầng / Khu vực</th>
                      {materialItems.map(m => (
                        <th key={m.id} className="px-4 py-3 border border-slate-200 text-center min-w-[120px]">{m.name}</th>
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
                          TỔNG SỐ LƯỢNG
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
                          KHỐI LƯỢNG ĐỊNH MỨC (M²)
                        </td>
                        {materialItems.map(m => {
                          const kl = reportData.grandTotals[m.id].kl;
                          return (
                            <td key={m.id} className="px-4 py-3 text-center font-extrabold text-indigo-800 border border-slate-200 bg-indigo-100">
                              {kl > 0 ? (
                                <span>{kl.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}</span>
                              ) : (
                                <span className="text-indigo-400/50">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-extrabold text-slate-800 border border-slate-200 sticky left-0 bg-slate-100">
                          ĐƠN GIÁ (VNĐ)
                        </td>
                        {materialItems.map(m => {
                          const p = parseFloat(editingPrices[m.id] ?? priceMap[m.id]) || 0;
                          return (
                            <td key={m.id} className="px-4 py-3 text-right font-extrabold text-emerald-700 border border-slate-200 bg-slate-100">
                              {p > 0 ? (
                                <span>{p.toLocaleString('vi-VN')} đ</span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-extrabold text-emerald-900 border border-slate-200 sticky left-0 bg-emerald-100">
                          THÀNH TIỀN (VNĐ)
                        </td>
                        {materialItems.map(m => {
                          const qty = reportData.grandTotals[m.id].quantity || 0;
                          const p = parseFloat(editingPrices[m.id] ?? priceMap[m.id]) || 0;
                          const amount = qty * p;
                          return (
                            <td key={m.id} className="px-4 py-3 text-right font-black text-emerald-800 border border-slate-200 bg-emerald-50">
                              {amount > 0 ? (
                                <span>{amount.toLocaleString('vi-VN')} đ</span>
                              ) : (
                                <span className="text-emerald-300/60">-</span>
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
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="text-xs text-slate-500 italic">
            * Đơn giá có thể cấu hình tại nút <strong className="text-indigo-600">"CẤU HÌNH VẬT TƯ"</strong> hoặc nhập trực tiếp tại bảng trên.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={reportData.summaryList.length === 0}
              className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              In Báo Cáo
            </button>

            <button
              onClick={handleExportExcel}
              disabled={reportData.summaryList.length === 0}
              className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Xuất Excel
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
