import React, { useState, useMemo } from 'react';
import { X, Copy, CheckCircle2, Calendar, Printer } from 'lucide-react';

export default function AttendanceReportModal({ isOpen, onClose, rows = [], materialItems = [] }) {
  const [copied, setCopied] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState('');

  const selectedRow = useMemo(() => {
    return rows.find(r => r.id === selectedRowId) || rows[0] || null;
  }, [rows, selectedRowId]);

  // Set initial selected row to the latest one
  React.useEffect(() => {
    if (isOpen && rows.length > 0 && !selectedRowId) {
      setSelectedRowId(rows[0].id);
    }
  }, [isOpen, rows, selectedRowId]);

  const handlePrint = () => {
    if (!selectedRow) return;
    
    let html = `
      <html>
        <head>
          <title>Báo Cáo Điểm Danh</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
            th { background-color: #f3f4f6; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <h2 style="text-align: center; margin-bottom: 20px;">Báo cáo điểm danh - Ngày ${selectedRow.date}</h2>
          <table>
            <thead>
              <tr>
                <th>Tên Đội</th>
                <th class="center" style="width: 100px;">Số CN</th>
                <th>Vị trí thi công</th>
              </tr>
            </thead>
            <tbody>
    `;

    materialItems.forEach(team => {
      const headcount = selectedRow.values?.[team.id] || '0';
      const actual = selectedRow.notes?.[team.id] || '';
      
      if (team.isInactive && headcount === '0' && !actual) return;
      
      html += `
        <tr>
          <td class="bold">${team.name}</td>
          <td class="center bold" style="color: #4f46e5;">${headcount}</td>
          <td style="white-space: pre-wrap;">${actual.replace(/\n/g, '<br>') || '<i style="color: #9ca3af;">Chưa có vị trí</i>'}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    const printWin = window.open('', '', 'width=800,height=600');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(html);
      printWin.document.close();
    }
  };

  const handleCopy = async () => {
    if (!selectedRow) return;
    try {
      // Plain text format (tab-separated for excel pasting, readable for Zalo)
      let text = `Quân số ngày ${selectedRow.date}\n\n`;
      text += `Tên Đội\tSố CN\tVị trí thi công\n`;
      text += `----------------------------------------\n`;
      
      let html = `<table style="border-collapse: collapse; width: 100%; font-family: sans-serif; font-size: 14px;">`;
      html += `<tr><th colspan="3" style="border: 1px solid #d1d5db; padding: 10px; background: #f3f4f6; text-align: center; font-size: 16px;">Báo cáo điểm danh - Ngày ${selectedRow.date}</th></tr>`;
      html += `<tr><th style="border: 1px solid #d1d5db; padding: 10px; background: #f9fafb; text-align: left;">Tên Đội</th><th style="border: 1px solid #d1d5db; padding: 10px; background: #f9fafb; text-align: center;">Số CN</th><th style="border: 1px solid #d1d5db; padding: 10px; background: #f9fafb; text-align: left;">Vị trí thi công</th></tr>`;

      let hasValidTeams = false;
      materialItems.forEach(team => {
        const headcount = selectedRow.values?.[team.id] || '0';
        const actual = selectedRow.notes?.[team.id] || '';
        
        if (team.isInactive && headcount === '0' && !actual) return;
        hasValidTeams = true;
        
        text += `${team.name}\t${headcount}\t${actual.replace(/\n/g, ' | ')}\n`;
        
        html += `<tr>`;
        html += `<td style="border: 1px solid #d1d5db; padding: 10px;"><strong>${team.name}</strong></td>`;
        html += `<td style="border: 1px solid #d1d5db; padding: 10px; text-align: center; font-weight: bold; color: #4f46e5;">${headcount}</td>`;
        html += `<td style="border: 1px solid #d1d5db; padding: 10px; white-space: pre-wrap;">${actual.replace(/\n/g, '<br>')}</td>`;
        html += `</tr>`;
      });
      html += `</table>`;

      if (!hasValidTeams) return;

      const blobText = new Blob([text], { type: 'text/plain' });
      const blobHtml = new Blob([html], { type: 'text/html' });
      const data = [new ClipboardItem({ 'text/plain': blobText, 'text/html': blobHtml })];

      await navigator.clipboard.write(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy html, falling back to basic text: ', err);
      try {
        let fallbackText = `Quân số ngày ${selectedRow.date}\n`;
        materialItems.forEach(team => {
          const headcount = selectedRow.values?.[team.id] || '0';
          const actual = selectedRow.notes?.[team.id] || '';
          if (team.isInactive && headcount === '0' && !actual) return;
          fallbackText += `\n⭕ ${team.name}: ${headcount}N\n`;
          if (actual) fallbackText += `   📍 Vị trí: ${actual.replace(/\n/g, ' - ')}\n`;
        });
        await navigator.clipboard.writeText(fallbackText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err2) {
        console.error('Fallback copy failed', err2);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
        <div className="p-6 sm:p-8 bg-indigo-600 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-white">Báo cáo điểm danh dạng Bảng</h3>
              <p className="text-indigo-100 text-sm mt-1">Hỗ trợ dán trực tiếp vào Excel hoặc Zalo siêu nét</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 flex-1 overflow-auto bg-slate-50">
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">Chọn ngày báo cáo:</label>
            <select
              value={selectedRow?.id || ''}
              onChange={(e) => setSelectedRowId(e.target.value)}
              className="w-full sm:w-1/3 p-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm cursor-pointer"
            >
              {rows.map(row => (
                <option key={row.id} value={row.id}>{row.date || 'Chưa có ngày'}</option>
              ))}
            </select>
          </div>

          <div className="relative flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-slate-700">Bản xem trước báo cáo:</label>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 font-bold rounded-lg hover:bg-indigo-200 transition shadow-sm"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Đã copy!' : 'Copy bảng'}
              </button>
            </div>
            
            <div id="printable-report-table" className="w-full max-h-[400px] overflow-auto border border-slate-200 rounded-xl bg-white shadow-sm ring-1 ring-slate-100 print:max-h-none print:border-none print:shadow-none print:ring-0">
              
              <table className="w-full text-sm text-left border-collapse print:text-black">
                <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-200 shadow-sm print:bg-gray-100">
                  <tr>
                    <th colSpan={3} className="hidden print:table-cell p-3.5 font-bold text-center text-lg border border-gray-300">
                      Báo cáo điểm danh - Ngày {selectedRow?.date}
                    </th>
                  </tr>
                  <tr>
                    <th className="p-3.5 font-extrabold text-slate-800 w-1/4 border border-slate-200 uppercase tracking-wide text-xs print:border-gray-300">Tên Đội</th>
                    <th className="p-3.5 font-extrabold text-slate-800 text-center w-24 border border-slate-200 uppercase tracking-wide text-xs print:border-gray-300">Số CN</th>
                    <th className="p-3.5 font-extrabold text-slate-800 uppercase tracking-wide text-xs border border-slate-200 print:border-gray-300">Vị trí thi công</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materialItems.map(team => {
                    const headcount = selectedRow?.values?.[team.id] || '0';
                    const actual = selectedRow?.notes?.[team.id] || '';
                    if (team.isInactive && headcount === '0' && !actual) return null;
                    return (
                      <tr key={team.id} className="hover:bg-slate-50 transition print:break-inside-avoid">
                        <td className="p-3 font-bold text-slate-700 border border-slate-200 print:border-gray-300 print:text-black">{team.name}</td>
                        <td className="p-3 font-black text-indigo-600 text-center border border-slate-200 bg-indigo-50/20 print:bg-transparent print:border-gray-300 print:text-black">{headcount}</td>
                        <td className="p-3 text-slate-600 font-medium whitespace-pre-wrap border border-slate-200 print:border-gray-300 print:text-black">{actual || <span className="text-slate-300 italic text-xs print:text-gray-400">Chưa có vị trí</span>}</td>
                      </tr>
                    );
                  })}
                  {!materialItems.some(t => {
                    const h = selectedRow?.values?.[t.id] || '0';
                    const a = selectedRow?.notes?.[t.id] || '';
                    return !(t.isInactive && h === '0' && !a);
                  }) && (
                    <tr>
                      <td colSpan="3" className="p-8 text-center text-slate-400 font-medium italic">Không có dữ liệu điểm danh trong ngày này</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500 mt-3 font-medium flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Bảng báo cáo đã được tối ưu để giữ nguyên khung lưới khi dán vào Zalo PC hoặc Excel.</p>
          </div>
        </div>

        <div className="p-5 sm:p-6 bg-white border-t border-slate-100 flex justify-end shrink-0 gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            <Printer className="w-5 h-5" />
            In bảng
          </button>
          <button
            onClick={handleCopy}
            className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xl shadow-indigo-600/30 active:scale-95"
          >
            {copied ? <CheckCircle2 className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5" />}
            Copy bảng để dán Zalo
          </button>
        </div>
      </div>
    </div>
  );
}
