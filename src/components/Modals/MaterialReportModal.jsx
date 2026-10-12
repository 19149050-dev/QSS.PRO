'use client';

import React, { useState, useMemo } from 'react';
import { AlertTriangle, Printer } from 'lucide-react';
import { useStore } from '@/store/useStore';

const NO_PO_KEY = 'CHƯA GẮN MÃ PO';

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return 0;
  const normalized = String(value).replace(/,/g, '').trim();
  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : 0;
};

export default function MaterialReportModal({
  isOpen,
  onClose,
  materialItems = [],
  materialRows = [],
  uniquePOs = [],
  projectName = '',
  priceMap = {}
}) {
  const { activeProject, materialSheets } = useStore();
  const currentProject = (projectName || activeProject || '').trim();
  const finalPriceMap = { ...(materialSheets?.[currentProject]?.priceMap || {}), ...(priceMap || {}) };
  const [activeTab, setActiveTab] = useState('shortage'); // 'shortage' | 'total'

  // 1. Data for "Vật tư chưa về đủ" (PO shortages - giữ nguyên logic và mẫu cũ)
  const { shortages, poKeys } = useMemo(() => {
    const shorts = {};
    uniquePOs.forEach(po => shorts[po] = []);
    shorts[NO_PO_KEY] = [];

    materialItems.forEach(item => {
      let totalOrdered = 0;
      let totalReceived = 0;
      const poOrders = {};
      const poReceived = {};

      (materialRows || []).forEach(r => {
        const val = r.values?.[item.id];
        if (val) {
          const strOrder = String(val.order || '');
          const strReceived = String(val.received || '');

          const ordNum = parseNumber(strOrder);
          if (ordNum > 0) {
            const matchOrder = strOrder.match(/\((PO.*?)\)/i);
            if (matchOrder) {
              const po = matchOrder[1].toUpperCase();
              poOrders[po] = (poOrders[po] || 0) + ordNum;
            }
            totalOrdered += ordNum;
          }

          const recNum = parseNumber(strReceived);
          if (recNum > 0) {
            const matchReceived = strReceived.match(/\((PO.*?)\)/i);
            if (matchReceived) {
              const po = matchReceived[1].toUpperCase();
              poReceived[po] = (poReceived[po] || 0) + recNum;
            }
            totalReceived += recNum;
          }
        }
      });

      let sumPoShortages = 0;
      const materialPoShorts = [];
      uniquePOs.forEach(po => {
        const ord = poOrders[po] || 0;
        const rec = poReceived[po] || 0;
        const short = ord - rec;
        if (short > 0) {
          materialPoShorts.push({ po, ord, rec, short, isOffset: false });
          sumPoShortages += short;
        }
      });

      const totalShort = totalOrdered - totalReceived;

      if (totalShort < sumPoShortages) {
        let surplus = sumPoShortages - Math.max(0, totalShort);
        for (let i = 0; i < materialPoShorts.length; i++) {
          if (surplus <= 0) break;
          const s = materialPoShorts[i];
          if (s.short <= surplus) {
            surplus -= s.short;
            s.short = 0;
            s.isOffset = true;
          } else {
            s.short -= surplus;
            surplus = 0;
            s.isOffset = true;
          }
        }
        sumPoShortages = materialPoShorts.reduce((sum, s) => sum + s.short, 0);
      }

      materialPoShorts.forEach(s => {
        if (s.short > 0) {
          shorts[s.po].push({
            materialName: item.name || 'Chưa đặt tên',
            ordered: s.ord,
            received: s.ord - s.short,
            shortage: s.short,
            isOffset: s.isOffset
          });
        }
      });

      if (totalShort > sumPoShortages) {
        shorts[NO_PO_KEY].push({
          materialName: item.name || 'Chưa đặt tên',
          ordered: totalOrdered,
          received: totalReceived,
          shortage: totalShort - sumPoShortages
        });
      }
    });

    const keys = Object.keys(shorts).filter(k => shorts[k].length > 0).sort((a, b) => {
      if (a === NO_PO_KEY) return 1;
      if (b === NO_PO_KEY) return -1;
      return a.localeCompare(b);
    });

    return { shortages: shorts, poKeys: keys };
  }, [materialItems, materialRows, uniquePOs]);

  // 2. Data for "Danh sách tổng" (chỉ lọc theo tên vật tư kèm đơn giá & thành tiền = yêu cầu * đơn giá)
  const { totalList, grandTotals } = useMemo(() => {
    const allList = [];
    let sumOrdered = 0;
    let sumReceived = 0;
    let sumShortage = 0;
    let sumAmount = 0;

    materialItems.forEach(item => {
      let ordered = 0;
      let received = 0;

      (materialRows || []).forEach(r => {
        const val = r.values?.[item.id];
        if (val) {
          ordered += parseNumber(val.order);
          received += parseNumber(val.received);
        }
      });

      if (ordered > 0 || received > 0) {
        const shortage = Math.max(0, ordered - received);
        const price = parseNumber(finalPriceMap[item.id] || 0);
        const amount = ordered * price;

        sumOrdered += ordered;
        sumReceived += received;
        sumShortage += shortage;
        sumAmount += amount;

        allList.push({
          id: item.id,
          materialName: item.name || 'Chưa đặt tên',
          ordered,
          received,
          shortage,
          price,
          amount
        });
      }
    });

    return {
      totalList: allList,
      grandTotals: {
        ordered: sumOrdered,
        received: sumReceived,
        shortage: sumShortage,
        amount: sumAmount
      }
    };
  }, [materialItems, materialRows, finalPriceMap]);

  if (!isOpen) return null;

  const titles = {
    shortage: `Danh sách vật tư chưa về đủ${currentProject ? ` - ${currentProject}` : ''}`,
    total: `Danh sách vật tư${currentProject ? ` - ${currentProject}` : ''}`
  };

  const printTitle = activeTab === 'shortage'
    ? `DANH SÁCH VẬT TƯ CHƯA VỀ ĐỦ${currentProject ? ` - ${currentProject.toUpperCase()}` : ''}`
    : `DANH SÁCH VẬT TƯ${currentProject ? ` - ${currentProject.toUpperCase()}` : ''}`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let tableHtml = '';
    if (activeTab === 'shortage') {
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th style="width: 15%">Mã PO</th>
              <th style="width: 40%">Tên vật tư</th>
              <th class="text-right" style="width: 15%">Yêu cầu</th>
              <th class="text-right" style="width: 15%">Đã nhận</th>
              <th class="text-right" style="width: 15%">Thiếu</th>
            </tr>
          </thead>
          <tbody>
            ${poKeys.map(po => {
              return shortages[po].map((s, idx) => `
                <tr class="${s.isOffset ? 'bg-amber' : ''}">
                  ${idx === 0 ? `<td rowspan="${shortages[po].length}" class="align-middle bg-gray text-center">${po}</td>` : ''}
                  <td>${s.materialName}</td>
                  <td class="text-right">${s.ordered.toLocaleString('vi-VN')}</td>
                  <td class="text-right text-green">${s.received.toLocaleString('vi-VN')}</td>
                  <td class="text-right text-red">${s.shortage.toLocaleString('vi-VN')}</td>
                </tr>
              `).join('');
            }).join('')}
          </tbody>
        </table>
      `;
    } else {
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th style="width: 30%">Tên vật tư</th>
              <th class="text-right" style="width: 12%">Yêu cầu</th>
              <th class="text-right" style="width: 12%">Đã nhận</th>
              <th class="text-right" style="width: 12%">Thiếu</th>
              <th class="text-right" style="width: 16%">Đơn giá</th>
              <th class="text-right" style="width: 18%">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${totalList.map(item => `
              <tr>
                <td><strong>${item.materialName}</strong></td>
                <td class="text-right">${item.ordered.toLocaleString('vi-VN')}</td>
                <td class="text-right text-green">${item.received.toLocaleString('vi-VN')}</td>
                <td class="text-right ${item.shortage > 0 ? 'text-red' : ''}">${item.shortage.toLocaleString('vi-VN')}</td>
                <td class="text-right text-green">${item.price > 0 ? item.price.toLocaleString('vi-VN') + ' đ' : '-'}</td>
                <td class="text-right text-blue"><strong>${item.amount > 0 ? item.amount.toLocaleString('vi-VN') + ' đ' : '-'}</strong></td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="font-weight: bold; background-color: #f1f5f9; border-top: 2px solid #334155;">
              <td><strong>TỔNG CỘNG</strong></td>
              <td class="text-right">${grandTotals.ordered.toLocaleString('vi-VN')}</td>
              <td class="text-right text-green">${grandTotals.received.toLocaleString('vi-VN')}</td>
              <td class="text-right text-red">${grandTotals.shortage.toLocaleString('vi-VN')}</td>
              <td></td>
              <td class="text-right text-blue" style="font-size: 15px;"><strong>${grandTotals.amount.toLocaleString('vi-VN')} đ</strong></td>
            </tr>
          </tfoot>
        </table>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${printTitle}</title>
          <style>
            @page { size: A4 landscape; margin: 15mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 0; color: #111; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            th, td { border: 1px solid #94a3b8; padding: 10px 14px; text-align: left; }
            th { background-color: #f1f5f9; color: #334155; text-transform: uppercase; font-size: 12px; font-weight: bold; }
            .text-right { text-align: right; }
            .text-red { color: #dc2626; font-weight: bold; }
            .text-green { color: #16a34a; }
            .text-blue { color: #2563eb; }
            .align-middle { vertical-align: middle; }
            .bg-gray { background-color: #f8fafc; font-weight: bold; }
            .bg-amber { background-color: #fef3c7 !important; }
            h2 { color: #0f172a; margin-bottom: 8px; font-size: 22px; text-align: center; text-transform: uppercase; }
            .subtitle { color: #475569; font-size: 13px; margin-bottom: 25px; text-align: center; font-style: italic; }
          </style>
        </head>
        <body>
          <h2>${printTitle}</h2>
          <div class="subtitle">Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}</div>
          ${tableHtml}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Box */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[94%] sm:max-w-5xl mx-auto overflow-hidden animate-in fade-in zoom-in duration-200 p-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-full bg-amber-50 text-amber-500 shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              {titles[activeTab]}
            </h3>
          </div>

          <button 
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            In báo cáo
          </button>
        </div>

        {/* 3 Mục Lựa Chọn (Tabs) */}
        <div className="flex items-center gap-2 mb-3 mt-1 pb-1 border-b border-slate-100 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('shortage')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition ${
              activeTab === 'shortage'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Vật tư chưa về đủ
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('total')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition ${
              activeTab === 'total'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Danh sách tổng
          </button>
        </div>

        {/* Table Area (Mẫu chuẩn nguyên bản) */}
        <div className="max-h-[60vh] overflow-y-auto w-full custom-scrollbar border border-slate-200 rounded-xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider sticky top-0 z-10 shadow-sm">
              {activeTab === 'shortage' ? (
                <tr>
                  <th className="px-4 py-2.5 border-r border-slate-200">Mã PO</th>
                  <th className="px-4 py-2.5 border-r border-slate-200">Tên vật tư</th>
                  <th className="px-4 py-2.5 text-right border-r border-slate-200">Yêu cầu</th>
                  <th className="px-4 py-2.5 text-right border-r border-slate-200">Đã nhận</th>
                  <th className="px-4 py-2.5 text-right text-red-600">Thiếu</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-4 py-2.5 border-r border-slate-200">Tên vật tư</th>
                  <th className="px-4 py-2.5 text-right border-r border-slate-200">Yêu cầu</th>
                  <th className="px-4 py-2.5 text-right border-r border-slate-200">Đã nhận</th>
                  <th className="px-4 py-2.5 text-right border-r border-slate-200 text-red-600">Thiếu</th>
                  <th className="px-4 py-2.5 text-right border-r border-slate-200">Đơn giá</th>
                  <th className="px-4 py-2.5 text-right text-indigo-700">Thành tiền</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {activeTab === 'shortage' ? (
                poKeys.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Tuyệt vời! Tất cả các vật tư đều đã được nhận đủ.
                    </td>
                  </tr>
                ) : (
                  poKeys.map(po => {
                    return shortages[po].map((s, idx) => (
                      <tr 
                        key={`${po}-${idx}`} 
                        className={`transition-colors ${s.isOffset ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-slate-50/50'}`}
                      >
                        {idx === 0 && (
                          <td 
                            rowSpan={shortages[po].length} 
                            className="px-4 py-3 font-bold text-indigo-800 bg-indigo-50/30 border-r border-slate-200 align-middle text-center"
                          >
                            {po}
                          </td>
                        )}
                        <td className="px-4 py-3 font-medium text-slate-700 border-r border-slate-100">{s.materialName}</td>
                        <td className="px-4 py-3 text-right font-medium border-r border-slate-100">{s.ordered.toLocaleString('vi-VN')}</td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-600 border-r border-slate-100">{s.received.toLocaleString('vi-VN')}</td>
                        <td className="px-4 py-3 text-right font-bold text-red-600 bg-red-50/30">{s.shortage.toLocaleString('vi-VN')}</td>
                      </tr>
                    ));
                  })
                )
              ) : (
                totalList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Chưa có dữ liệu vật tư nào.
                    </td>
                  </tr>
                ) : (
                  totalList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-700 border-r border-slate-100">{item.materialName}</td>
                      <td className="px-4 py-3 text-right font-medium border-r border-slate-100">{item.ordered.toLocaleString('vi-VN')}</td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-600 border-r border-slate-100">{item.received.toLocaleString('vi-VN')}</td>
                      <td className={`px-4 py-3 text-right font-bold border-r border-slate-100 ${item.shortage > 0 ? 'text-red-600 bg-red-50/30' : 'text-slate-400'}`}>
                        {item.shortage.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-700 border-r border-slate-100">
                        {item.price > 0 ? `${item.price.toLocaleString('vi-VN')} đ` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-indigo-700 bg-indigo-50/20">
                        {item.amount > 0 ? `${item.amount.toLocaleString('vi-VN')} đ` : '-'}
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
            {activeTab === 'total' && totalList.length > 0 && (
              <tfoot className="bg-slate-100 border-t-2 border-slate-200 font-bold text-slate-800 text-xs sm:text-sm sticky bottom-0 z-10 shadow-xs">
                <tr>
                  <td className="px-4 py-3 uppercase font-black border-r border-slate-200">
                    TỔNG CỘNG
                  </td>
                  <td className="px-4 py-3 text-right font-black border-r border-slate-200">
                    {grandTotals.ordered.toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-emerald-600 border-r border-slate-200">
                    {grandTotals.received.toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-red-600 border-r border-slate-200">
                    {grandTotals.shortage.toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-3 border-r border-slate-200"></td>
                  <td className="px-4 py-3 text-right font-black text-indigo-700 bg-indigo-100/60">
                    {grandTotals.amount.toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Bottom Button */}
        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-xl text-sm transition shadow-sm"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
