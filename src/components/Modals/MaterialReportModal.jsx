'use client';

import React, { useState, useMemo } from 'react';
import { AlertTriangle, Printer, FileSpreadsheet } from 'lucide-react';
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
  priceMap = {},
  dinhMucMap = {},
  unitMap = {}
}) {
  const { activeProject, materialSheets } = useStore();
  const currentProject = (projectName || activeProject || '').trim();
  const finalPriceMap = { ...(materialSheets?.[currentProject]?.priceMap || {}), ...(priceMap || {}) };
  const finalDinhMucMap = { ...(materialSheets?.[currentProject]?.dinhMucMap || {}), ...(dinhMucMap || {}) };
  const finalUnitMap = { ...(materialSheets?.[currentProject]?.unitMap || {}), ...(unitMap || {}) };
  const [activeTab, setActiveTab] = useState('shortage'); // 'shortage' | 'total' | 'dm'

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
    let sumRemainingAmount = 0;

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
        const remainingAmount = shortage * price;

        sumOrdered += ordered;
        sumReceived += received;
        sumShortage += shortage;
        sumAmount += amount;
        sumRemainingAmount += remainingAmount;

        allList.push({
          id: item.id,
          materialName: item.name || 'Chưa đặt tên',
          ordered,
          received,
          shortage,
          price,
          amount,
          remainingAmount
        });
      }
    });

    return {
      totalList: allList,
      grandTotals: {
        ordered: sumOrdered,
        received: sumReceived,
        shortage: sumShortage,
        amount: sumAmount,
        remainingAmount: sumRemainingAmount
      }
    };
  }, [materialItems, materialRows, finalPriceMap]);

  // 3. Data for "Tổng và ĐM" – giống totalList nhưng thêm Định mức và KL
  const { dmList, dmGrandTotals } = useMemo(() => {
    const allList = [];
    let sumOrdered = 0, sumReceived = 0, sumShortage = 0, sumKL = 0;

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
        const dm = parseNumber(finalDinhMucMap[item.id] || 0);
        const kl = dm * ordered;

        sumOrdered += ordered;
        sumReceived += received;
        sumShortage += shortage;
        sumKL += kl;

        allList.push({
          id: item.id,
          materialName: item.name || 'Chưa đặt tên',
          unit: finalUnitMap[item.id] || '',
          ordered,
          received,
          shortage,
          dm,
          kl
        });
      }
    });

    return {
      dmList: allList,
      dmGrandTotals: { ordered: sumOrdered, received: sumReceived, shortage: sumShortage, kl: sumKL }
    };
  }, [materialItems, materialRows, finalDinhMucMap, finalUnitMap]);

  if (!isOpen) return null;

  const titles = {
    shortage: `Danh sách vật tư chưa về đủ${currentProject ? ` - ${currentProject}` : ''}`,
    total: `Danh sách vật tư${currentProject ? ` - ${currentProject}` : ''}`,
    dm: `Tổng và ĐM${currentProject ? ` - ${currentProject}` : ''}`
  };

  const printTitle = activeTab === 'shortage'
    ? `DANH SÁCH VẬT TƯ CHƯA VỀ ĐỦ${currentProject ? ` - ${currentProject.toUpperCase()}` : ''}`
    : activeTab === 'dm'
      ? `TỔNG VÀ ĐỊNH MỨC${currentProject ? ` - ${currentProject.toUpperCase()}` : ''}`
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
    } else if (activeTab === 'total') {
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th style="width: 25%">Tên vật tư</th>
              <th class="text-right" style="width: 10%">Yêu cầu</th>
              <th class="text-right" style="width: 10%">Đã nhận</th>
              <th class="text-right" style="width: 10%">Thiếu</th>
              <th class="text-right" style="width: 15%">Đơn giá</th>
              <th class="text-right" style="width: 15%">Thành tiền</th>
              <th class="text-right" style="width: 15%">Tiền còn lại</th>
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
                <td class="text-right text-red"><strong>${item.remainingAmount > 0 ? item.remainingAmount.toLocaleString('vi-VN') + ' đ' : '-'}</strong></td>
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
              <td class="text-right text-red" style="font-size: 15px;"><strong>${grandTotals.remainingAmount.toLocaleString('vi-VN')} đ</strong></td>
            </tr>
          </tfoot>
        </table>
      `;
    } else {
      // dm tab
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th style="width: 26%">Tên vật tư</th>
              <th style="width: 10%">DV</th>
              <th class="text-right" style="width: 10%">Yêu cầu</th>
              <th class="text-right" style="width: 10%">Đã nhận</th>
              <th class="text-right" style="width: 10%">Thiếu</th>
              <th class="text-right" style="width: 12%">Định mức</th>
              <th class="text-right" style="width: 12%">KL</th>
            </tr>
          </thead>
          <tbody>
            ${dmList.map(item => `
              <tr>
                <td><strong>${item.materialName}</strong></td>
                <td class="text-center">${item.unit || '-'}</td>
                <td class="text-right">${item.ordered.toLocaleString('vi-VN')}</td>
                <td class="text-right text-green">${item.received.toLocaleString('vi-VN')}</td>
                <td class="text-right ${item.shortage > 0 ? 'text-red' : ''}">${item.shortage.toLocaleString('vi-VN')}</td>
                <td class="text-right text-blue">${item.dm > 0 ? item.dm.toLocaleString('vi-VN') : '-'}</td>
                <td class="text-right text-blue"><strong>${item.kl > 0 ? item.kl.toLocaleString('vi-VN') : '-'}</strong></td>
              </tr>
            `).join('')}
          </tbody>
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

  // ── Excel export ──────────────────────────────────────────────────────────
  const handleExcelExport = async () => {
    const XLSXStyle = (await import('xlsx-js-style')).default;

    // ── Style helpers ──
    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
      fill: { fgColor: { rgb: '4338CA' } }, // indigo-700
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: 'C7D2FE' } },
        bottom: { style: 'thin', color: { rgb: 'C7D2FE' } },
        left: { style: 'thin', color: { rgb: 'C7D2FE' } },
        right: { style: 'thin', color: { rgb: 'C7D2FE' } }
      }
    };

    const cellBorder = {
      top: { style: 'thin', color: { rgb: 'E2E8F0' } },
      bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
      left: { style: 'thin', color: { rgb: 'E2E8F0' } },
      right: { style: 'thin', color: { rgb: 'E2E8F0' } }
    };

    const baseCell = (v, extra = {}) => ({
      v,
      t: typeof v === 'number' ? 'n' : 's',
      s: { border: cellBorder, alignment: { vertical: 'center' }, ...extra }
    });

    const numCell = (v, extra = {}) => ({
      v,
      t: 'n',
      s: { border: cellBorder, alignment: { horizontal: 'right', vertical: 'center' }, ...extra }
    });

    const poStyle = {
      font: { bold: true, color: { rgb: '3730A3' } },
      fill: { fgColor: { rgb: 'EEF2FF' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: cellBorder
    };

    const redStyle = { font: { bold: true, color: { rgb: 'DC2626' } } };
    const greenStyle = { font: { color: { rgb: '16A34A' } } };
    const amberFill = { fill: { fgColor: { rgb: 'FEF3C7' } } };
    const footerStyle = {
      font: { bold: true, color: { rgb: '1E1B4B' } },
      fill: { fgColor: { rgb: 'E0E7FF' } },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: {
        top: { style: 'medium', color: { rgb: '6366F1' } },
        bottom: { style: 'thin', color: { rgb: 'C7D2FE' } },
        left: { style: 'thin', color: { rgb: 'C7D2FE' } },
        right: { style: 'thin', color: { rgb: 'C7D2FE' } }
      }
    };

    const wb = XLSXStyle.utils.book_new();
    const merges = [];
    const aoa = []; // array of arrays

    const titleText = activeTab === 'shortage'
      ? `DANH SÁCH VẬT TƯ CHƯA VỀ ĐỦ${currentProject ? ` - ${currentProject.toUpperCase()}` : ''}`
      : activeTab === 'dm'
        ? `TỔNG VÀ ĐỊNH MỨC${currentProject ? ` - ${currentProject.toUpperCase()}` : ''}`
        : `DANH SÁCH VẬT TƯ${currentProject ? ` - ${currentProject.toUpperCase()}` : ''}`;

    const subtitleText = `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`;

    if (activeTab === 'shortage') {
      // ── Title (merged A1:E1) ──
      aoa.push([
        { v: titleText, t: 's', s: { font: { bold: true, sz: 14, color: { rgb: '0F172A' } }, alignment: { horizontal: 'center', vertical: 'center' } } },
        { v: '', t: 's', s: {} }, { v: '', t: 's', s: {} }, { v: '', t: 's', s: {} }, { v: '', t: 's', s: {} }
      ]);
      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } });

      // ── Subtitle (merged A2:E2) ──
      aoa.push([
        { v: subtitleText, t: 's', s: { font: { italic: true, color: { rgb: '64748B' } }, alignment: { horizontal: 'center' } } },
        { v: '', t: 's', s: {} }, { v: '', t: 's', s: {} }, { v: '', t: 's', s: {} }, { v: '', t: 's', s: {} }
      ]);
      merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 4 } });

      // ── Header row ──
      aoa.push([
        { v: 'MÃ PO', t: 's', s: headerStyle },
        { v: 'TÊN VẬT TƯ', t: 's', s: headerStyle },
        { v: 'YÊU CẦU', t: 's', s: { ...headerStyle, alignment: { horizontal: 'right', vertical: 'center' } } },
        { v: 'ĐÃ NHẬN', t: 's', s: { ...headerStyle, alignment: { horizontal: 'right', vertical: 'center' } } },
        { v: 'THIẾU', t: 's', s: { ...headerStyle, alignment: { horizontal: 'right', vertical: 'center' } } }
      ]);

      // ── Data rows ──
      let rowIdx = 3; // 0-based (row 4 in sheet)
      poKeys.forEach(po => {
        const items = shortages[po];
        items.forEach((s, idx) => {
          const rowAmber = s.isOffset ? amberFill : {};
          const row = [];
          if (idx === 0) {
            row.push({ v: po, t: 's', s: poStyle });
            if (items.length > 1) {
              merges.push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx + items.length - 1, c: 0 } });
            }
          } else {
            row.push({ v: '', t: 's', s: { border: cellBorder } });
          }
          row.push(baseCell(s.materialName, { font: { bold: false }, ...rowAmber }));
          row.push(numCell(s.ordered, { ...rowAmber }));
          row.push(numCell(s.received, { font: { color: { rgb: '16A34A' } }, ...rowAmber }));
          row.push(numCell(s.shortage, { ...redStyle, ...rowAmber, border: cellBorder }));
          aoa.push(row);
          rowIdx++;
        });
      });

    } else if (activeTab === 'total') {
      // ── "Danh sách tổng" tab ──
      const COLS = 7;
      // Title
      aoa.push([
        { v: titleText, t: 's', s: { font: { bold: true, sz: 14, color: { rgb: '0F172A' } }, alignment: { horizontal: 'center', vertical: 'center' } } },
        ...Array(COLS - 1).fill({ v: '', t: 's', s: {} })
      ]);
      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: COLS - 1 } });

      // Subtitle
      aoa.push([
        { v: subtitleText, t: 's', s: { font: { italic: true, color: { rgb: '64748B' } }, alignment: { horizontal: 'center' } } },
        ...Array(COLS - 1).fill({ v: '', t: 's', s: {} })
      ]);
      merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: COLS - 1 } });

      // Header
      aoa.push([
        { v: 'TÊN VẬT TƯ', t: 's', s: headerStyle },
        { v: 'YÊU CẦU', t: 's', s: { ...headerStyle, alignment: { horizontal: 'right', vertical: 'center' } } },
        { v: 'ĐÃ NHẬN', t: 's', s: { ...headerStyle, alignment: { horizontal: 'right', vertical: 'center' } } },
        { v: 'THIẾU', t: 's', s: { ...headerStyle, alignment: { horizontal: 'right', vertical: 'center' } } },
        { v: 'ĐƠN GIÁ (đ)', t: 's', s: { ...headerStyle, alignment: { horizontal: 'right', vertical: 'center' } } },
        { v: 'THÀNH TIỀN (đ)', t: 's', s: { ...headerStyle, alignment: { horizontal: 'right', vertical: 'center' } } },
        { v: 'TIỀN CÒN LẠI (đ)', t: 's', s: { ...headerStyle, alignment: { horizontal: 'right', vertical: 'center' } } }
      ]);

      // Data rows
      totalList.forEach(item => {
        aoa.push([
          baseCell(item.materialName, { font: { bold: true } }),
          numCell(item.ordered),
          numCell(item.received, { ...greenStyle }),
          numCell(item.shortage, item.shortage > 0 ? { ...redStyle, border: cellBorder } : {}),
          numCell(item.price > 0 ? item.price : 0, { ...greenStyle }),
          numCell(item.amount > 0 ? item.amount : 0, { font: { bold: true, color: { rgb: '4338CA' } } }),
          numCell(item.remainingAmount > 0 ? item.remainingAmount : 0, { font: { bold: true, color: { rgb: 'DC2626' } } })
        ]);
      });

      // Footer / totals
      aoa.push([
        { v: 'TỔNG CỘNG', t: 's', s: { ...footerStyle, alignment: { horizontal: 'left', vertical: 'center' }, font: { bold: true, color: { rgb: '1E1B4B' } } } },
        { v: grandTotals.ordered, t: 'n', s: footerStyle },
        { v: grandTotals.received, t: 'n', s: { ...footerStyle, font: { bold: true, color: { rgb: '16A34A' } } } },
        { v: grandTotals.shortage, t: 'n', s: { ...footerStyle, font: { bold: true, color: { rgb: 'DC2626' } } } },
        { v: '', t: 's', s: footerStyle },
        { v: grandTotals.amount, t: 'n', s: { ...footerStyle, font: { bold: true, color: { rgb: '4338CA' } } } },
        { v: grandTotals.remainingAmount, t: 'n', s: { ...footerStyle, font: { bold: true, color: { rgb: 'DC2626' } } } }
      ]);

    } else {
      // ── "Tổng và ĐM" tab ──
      const COLS = 6;
      // Title
      aoa.push([
        { v: titleText, t: 's', s: { font: { bold: true, sz: 14, color: { rgb: '0F172A' } }, alignment: { horizontal: 'center', vertical: 'center' } } },
        ...Array(COLS - 1).fill({ v: '', t: 's', s: {} })
      ]);
      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: COLS - 1 } });

      // Subtitle
      aoa.push([
        { v: subtitleText, t: 's', s: { font: { italic: true, color: { rgb: '64748B' } }, alignment: { horizontal: 'center' } } },
        ...Array(COLS - 1).fill({ v: '', t: 's', s: {} })
      ]);
      merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: COLS - 1 } });

      // Header
      aoa.push([
        { v: 'TÊN VẬT TƯ', t: 's', s: headerStyle },
        { v: 'DV', t: 's', s: { ...headerStyle, alignment: { horizontal: 'center', vertical: 'center' } } },
        { v: 'YÊU CẦU', t: 's', s: { ...headerStyle, alignment: { horizontal: 'right', vertical: 'center' } } },
        { v: 'ĐÃ NHẬN', t: 's', s: { ...headerStyle, alignment: { horizontal: 'right', vertical: 'center' } } },
        { v: 'THIẾU', t: 's', s: { ...headerStyle, alignment: { horizontal: 'right', vertical: 'center' } } },
        { v: 'ĐỊNH MỨC', t: 's', s: { ...headerStyle, alignment: { horizontal: 'right', vertical: 'center' } } },
        { v: 'KL', t: 's', s: { ...headerStyle, alignment: { horizontal: 'right', vertical: 'center' } } }
      ]);

      // Data rows
      dmList.forEach(item => {
        aoa.push([
          baseCell(item.materialName, { font: { bold: true } }),
          baseCell(item.unit || '', { alignment: { horizontal: 'center', vertical: 'center' } }),
          numCell(item.ordered),
          numCell(item.received, { ...greenStyle }),
          numCell(item.shortage, item.shortage > 0 ? { ...redStyle, border: cellBorder } : {}),
          numCell(item.dm > 0 ? item.dm : 0, { font: { color: { rgb: '4338CA' } } }),
          numCell(item.kl > 0 ? item.kl : 0, { font: { bold: true, color: { rgb: '4338CA' } } })
        ]);
      });

      // No footer row per user request
    }

    // Build sheet from aoa
    const ws = XLSXStyle.utils.aoa_to_sheet(aoa);
    ws['!merges'] = merges;

    // Column widths
    if (activeTab === 'shortage') {
      ws['!cols'] = [{ wch: 18 }, { wch: 38 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
    } else if (activeTab === 'dm') {
      ws['!cols'] = [{ wch: 34 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 16 }];
    } else {
      ws['!cols'] = [{ wch: 34 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 18 }];
    }

    // Row heights
    ws['!rows'] = [{ hpt: 28 }, { hpt: 20 }, { hpt: 26 }]; // title, subtitle, header

    // Number format for numeric cells
    const range = XLSXStyle.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSXStyle.utils.encode_cell({ r: R, c: C });
        if (ws[addr] && ws[addr].t === 'n') {
          ws[addr].z = '#,##0';
        }
      }
    }

    const sheetName = activeTab === 'shortage' ? 'Vật tư chưa về đủ' : activeTab === 'dm' ? 'Tổng và ĐM' : 'Danh sách tổng';
    XLSXStyle.utils.book_append_sheet(wb, ws, sheetName);

    const fileName = `${titleText.replace(/[^a-zA-Z0-9À-ỹ \-]/g, '')}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
    XLSXStyle.writeFile(wb, fileName);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Box */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[94%] sm:max-w-6xl mx-auto overflow-hidden animate-in fade-in zoom-in duration-200 p-6">
        
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

          <div className="flex items-center gap-2">
            <button
              onClick={handleExcelExport}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Xuất Excel
            </button>
            <button 
              onClick={handlePrint}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              In báo cáo
            </button>
          </div>
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

          <button
            type="button"
            onClick={() => setActiveTab('dm')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition ${
              activeTab === 'dm'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tổng và ĐM
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
              ) : activeTab === 'total' ? (
                <tr>
                  <th className="px-4 py-2.5 border-r border-slate-200">Tên vật tư</th>
                  <th className="px-4 py-2.5 text-right border-r border-slate-200">Yêu cầu</th>
                  <th className="px-4 py-2.5 text-right border-r border-slate-200">Đã nhận</th>
                  <th className="px-4 py-2.5 text-right border-r border-slate-200 text-red-600">Thiếu</th>
                  <th className="px-4 py-2.5 text-right border-r border-slate-200">Đơn giá</th>
                  <th className="px-4 py-2.5 text-right border-r border-slate-200 text-indigo-700">Thành tiền</th>
                  <th className="px-4 py-2.5 text-right text-rose-700">Thành tiền còn lại</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-4 py-2.5 border-r border-slate-200">Tên vật tư</th>
                  <th className="px-4 py-2.5 border-r border-slate-200">DV</th>
                  <th className="px-4 py-2.5 text-right border-r border-slate-200">Yêu cầu</th>
                  <th className="px-4 py-2.5 text-right border-r border-slate-200">Đã nhận</th>
                  <th className="px-4 py-2.5 text-right border-r border-slate-200 text-red-600">Thiếu</th>
                  <th className="px-4 py-2.5 text-right border-r border-slate-200 text-indigo-600">Định mức</th>
                  <th className="px-4 py-2.5 text-right text-indigo-700">KL</th>
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
              ) : activeTab === 'total' ? (
                totalList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
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
                      <td className="px-4 py-3 text-right font-bold text-indigo-700 bg-indigo-50/20 border-r border-slate-100">
                        {item.amount > 0 ? `${item.amount.toLocaleString('vi-VN')} đ` : '-'}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${item.remainingAmount > 0 ? 'text-rose-600 bg-rose-50/30' : 'text-slate-400'}`}>
                        {item.remainingAmount > 0 ? `${item.remainingAmount.toLocaleString('vi-VN')} đ` : '-'}
                      </td>
                    </tr>
                  ))
                )
              ) : (
                /* dm tab */
                dmList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Chưa có dữ liệu vật tư nào.
                    </td>
                  </tr>
                ) : (
                  dmList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-700 border-r border-slate-100">{item.materialName}</td>
                      <td className="px-4 py-3 text-center text-xs font-semibold text-slate-500 border-r border-slate-100">{item.unit || <span className="text-slate-300">-</span>}</td>
                      <td className="px-4 py-3 text-right font-medium border-r border-slate-100">{item.ordered.toLocaleString('vi-VN')}</td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-600 border-r border-slate-100">{item.received.toLocaleString('vi-VN')}</td>
                      <td className={`px-4 py-3 text-right font-bold border-r border-slate-100 ${item.shortage > 0 ? 'text-red-600 bg-red-50/30' : 'text-slate-400'}`}>
                        {item.shortage.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-indigo-600 border-r border-slate-100">
                        {item.dm > 0 ? item.dm.toLocaleString('vi-VN') : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-indigo-700 bg-indigo-50/20">
                        {item.kl > 0 ? item.kl.toLocaleString('vi-VN') : <span className="text-slate-300">-</span>}
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
                  <td className="px-4 py-3 text-right font-black text-indigo-700 bg-indigo-100/60 border-r border-slate-200">
                    {grandTotals.amount.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="px-4 py-3 text-right font-black text-rose-600 bg-rose-100/60">
                    {grandTotals.remainingAmount.toLocaleString('vi-VN')} đ
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
