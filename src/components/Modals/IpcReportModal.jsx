import React, { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { X, FileText, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { exportToExcel } from '@/utils/exportUtils';

function condenseFloors(floorsStr) {
  const floors = floorsStr.split(',').map(f => f.trim());
  const parsed = floors.map(f => {
    const match = f.match(/^(.*?)(\d+)$/);
    if (match) return { prefix: match[1].trim(), num: parseInt(match[2], 10), original: f };
    return { prefix: f, num: null, original: f };
  });
  const groups = {};
  parsed.forEach(p => {
    const key = p.prefix;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });
  const result = [];
  for (const key in groups) {
    const items = groups[key];
    const withNums = items.filter(i => i.num !== null).sort((a, b) => a.num - b.num);
    const withoutNums = items.filter(i => i.num === null).map(i => i.original);
    const ranges = [];
    if (withNums.length > 0) {
      let start = withNums[0].num;
      let end = start;
      for (let i = 1; i < withNums.length; i++) {
        if (withNums[i].num === end + 1) {
          end = withNums[i].num;
        } else {
          ranges.push(end > start ? `${key} ${start}~${end}` : `${key} ${start}`);
          start = withNums[i].num;
          end = start;
        }
      }
      ranges.push(end > start ? `${key} ${start}~${end}` : `${key} ${start}`);
    }
    result.push(...ranges, ...withoutNums);
  }
  return result.join(', ');
}

export default function IpcReportModal({ isOpen, onClose, projectName }) {
  const store = useStore();
  const [reportType, setReportType] = useState('UNCLAIMED'); // 'UNCLAIMED' or 'BY_IPC'
  const [selectedIpc, setSelectedIpc] = useState('ALL');
  const [selectedTeam, setSelectedTeam] = useState('ALL');

  const teamMatrix = store.paymentMatrix[`${projectName}_team`] || [];
  const ipcMatrix = store.paymentMatrix[`${projectName}_ipc`] || [];
  const matrixBlocks = store.matrixBlocks[projectName] || [];

  // Parse a cell string into total units
  const parseTotalUnits = (str, totalApts) => {
    if (!str) return 0;
    if (str.includes('Xong 100%')) return parseFloat(totalApts) || 0;
    let total = 0;
    str.split(' + ').forEach(p => {
      if (p.includes('Xong 100%')) {
        total += parseFloat(totalApts) || 0;
      } else {
        const m = p.match(/\((.*?)\)/);
        if (m) {
          const match = m[1].match(/(\d+(\.\d+)?)/);
          if (match) {
            if (m[1].includes('%')) {
              total += (parseFloat(match[1]) / 100) * (parseFloat(totalApts) || 0);
            } else {
              total += parseFloat(match[1]);
            }
          }
        } else {
          const match = p.match(/^(\d+(\.\d+)?)/) || p.match(/(\d+(\.\d+)?)\s*căn/i);
          if (match) {
            if (p.includes('%')) {
              total += (parseFloat(match[1]) / 100) * (parseFloat(totalApts) || 0);
            } else {
              total += parseFloat(match[1]);
            }
          }
        }
      }
    });
    return total;
  };

  // Extract all unique IPC batches
  const uniqueIpcs = useMemo(() => {
    const ipcs = new Set();
    ipcMatrix.forEach(row => {
      if (!row.items) return;
      Object.keys(row.items).forEach(key => {
        if (key.endsWith('_numApts')) return;
        const val = row.items[key] || '';
        if (val) {
          const parts = val.split(' + ').map(p => p.trim());
          parts.forEach(p => {
            const match = p.match(/^(.*?)\s*\(/) || [null, p];
            let batchName = match[1] ? match[1].trim() : p.trim();
            if (batchName) {
              batchName = batchName.replace(/(IPC|ĐỢT|DOT)[^\d]*(\d+)/gi, (m, p1, p2) => `IPC ${p2.padStart(2, '0')}`);
              if (batchName.replace(/\s/g, '').toUpperCase() === 'IPC05') batchName = 'IPC 05';
              if (batchName.replace(/\s/g, '').toUpperCase() === 'IPC04') batchName = 'IPC 04';
              if (batchName.replace(/\s/g, '').toUpperCase() === 'IPC06') batchName = 'IPC 06';
              ipcs.add(batchName);
            }
          });
        }
      });
    });
    return Array.from(ipcs).sort();
  }, [ipcMatrix]);

  // Extract all unique teams
  const uniqueTeams = useMemo(() => {
    const teams = new Set();
    teamMatrix.forEach(row => {
      if (!row.items) return;
      Object.keys(row.items).forEach(key => {
        if (key.endsWith('_numApts')) return;
        const val = row.items[key] || '';
        if (val) {
          const parts = val.split(' + ').map(p => p.trim());
          parts.forEach(p => {
             const matches = [...p.matchAll(/\((.*?)\)/g)];
             if (matches.length > 0) {
               const lastMatch = matches[matches.length - 1][1].trim();
               if (!/^[\d\.]+/.test(lastMatch) && !lastMatch.includes('%')) {
                 teams.add(lastMatch.toUpperCase());
               }
             }
          });
        }
      });
    });
    return Array.from(teams).sort();
  }, [teamMatrix]);

  // Removing the override that prevented 'ALL' from being selected in BY_IPC
  // Generate Report Data
  const reportData = useMemo(() => {
    const data = [];

    teamMatrix.forEach(teamRow => {
      const floor = teamRow.floor;
      const ipcRow = ipcMatrix.find(r => String(r.floor) === String(floor)) || { items: {} };

      matrixBlocks.forEach(block => {
        const blockNumAptsStr = teamRow.items[`${block.blockName}_numApts`] || teamRow.numApts || '';
        const blockNumApts = parseFloat(blockNumAptsStr) || 0;

        block.groups.forEach(group => {
          group.items.forEach(cat => {
            const itemKey = `${block.blockName}_${group.groupName}_${cat}`;
            const rawTeamVal = teamRow.items?.[itemKey] || '';
            const rawIpcVal = ipcRow.items?.[itemKey] || '';

            const teamVal = rawTeamVal.replace(/(IPC|ĐỢT|DOT)[^\d]*(\d+)/gi, (m, p1, p2) => `IPC ${p2.padStart(2, '0')}`);
            const ipcVal = rawIpcVal.replace(/(IPC|ĐỢT|DOT)[^\d]*(\d+)/gi, (m, p1, p2) => `IPC ${p2.padStart(2, '0')}`);

            if (reportType === 'UNCLAIMED') {
              if (!teamVal) return; // Team hasn't done anything
              const teamUnits = parseTotalUnits(teamVal, blockNumApts);
              const ipcUnits = parseTotalUnits(ipcVal, blockNumApts);
              
              if (teamUnits > ipcUnits + 0.01) {
                const diff = teamUnits - ipcUnits;
                data.push({
                  floor,
                  block: block.blockName,
                  group: group.groupName,
                  item: cat,
                  totalApts: blockNumApts,
                  teamVal,
                  ipcVal: ipcVal || '(Chưa có IPC)',
                  teamUnits,
                  ipcUnits,
                  diffUnits: diff
                });
              }
            } else if (reportType === 'BY_IPC') {
              if (!ipcVal) return;
              if (selectedIpc === 'ALL') {
                const ipcTotalUnits = parseTotalUnits(ipcVal, blockNumApts);
                const diffUnits = Math.max(0, blockNumApts - ipcTotalUnits);
                
                if (ipcTotalUnits > 0) {
                  data.push({
                    floor,
                    block: block.blockName,
                    group: group.groupName,
                    item: cat,
                    totalApts: blockNumApts,
                    ipcPartValue: ipcVal,
                    ipcUnits: ipcTotalUnits,
                    diffUnits
                  });
                }
              } else {
                const parts = ipcVal.split(' + ').map(p => p.trim());
                const ipcPart = parts.find(p => p.startsWith(selectedIpc));
                if (ipcPart) {
                  const ipcPartUnits = parseTotalUnits(ipcPart, blockNumApts);
                  const ipcTotalUnits = parseTotalUnits(ipcVal, blockNumApts);
                  const diffUnits = Math.max(0, blockNumApts - ipcTotalUnits);

                  if (ipcPartUnits > 0) {
                    data.push({
                      floor,
                      block: block.blockName,
                      group: group.groupName,
                      item: cat,
                      totalApts: blockNumApts,
                      ipcPartValue: ipcPart,
                      ipcUnits: ipcPartUnits,
                      diffUnits
                    });
                  }
                }
              }
            } else if (reportType === 'TEAM_CUMULATIVE') {
              if (!teamVal) return;
              
              let finalTeamVal = teamVal;
              if (selectedTeam !== 'ALL') {
                const parts = teamVal.split(' + ').map(p => p.trim());
                const matchingParts = parts.filter(p => p.toUpperCase().includes(selectedTeam));
                if (matchingParts.length === 0) return;
                
                // Remove the team name from the string since it's already selected
                const regex = new RegExp(`\\(\\s*${selectedTeam.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*\\)`, 'gi');
                finalTeamVal = matchingParts.map(p => p.replace(regex, '').trim()).join(' + ');
              }

              const teamUnits = parseTotalUnits(finalTeamVal, blockNumApts);
              const diffUnits = Math.max(0, blockNumApts - teamUnits);
              if (teamUnits > 0) {
                data.push({
                  floor,
                  block: block.blockName,
                  group: group.groupName,
                  item: cat,
                  totalApts: blockNumApts,
                  teamVal: finalTeamVal,
                  teamUnits,
                  diffUnits
                });
              }
            }
          });
        });
      });
    });

    // Gom các tầng lại nếu cùng hạng mục và cùng giá trị (chỉ áp dụng cho các nhóm KHÔNG phải Căn hộ)
    const finalData = [];
    data.forEach(row => {
      const isApt = String(row.group).toUpperCase().includes('CĂN HỘ') || 
                    String(row.group).toUpperCase().includes('CAN HO') ||
                    String(row.teamVal).toUpperCase().includes('CĂN') ||
                    String(row.ipcVal).toUpperCase().includes('CĂN') ||
                    (row.ipcPartValue && String(row.ipcPartValue).toUpperCase().includes('CĂN'));
      if (isApt) {
        finalData.push({ ...row, isApt: true });
      } else {
        const existing = finalData.find(g => 
          !g.isApt &&
          g.block === row.block &&
          g.group === row.group &&
          g.item === row.item &&
          g.teamVal === row.teamVal &&
          g.ipcVal === row.ipcVal &&
          g.ipcPartValue === row.ipcPartValue
        );
        if (existing) {
          existing.floor = `${existing.floor}, ${row.floor}`;
        } else {
          finalData.push({ ...row, isApt: false });
        }
      }
    });

    finalData.forEach(row => {
      if (!row.isApt && row.floor.includes(',')) {
        row.floor = condenseFloors(row.floor);
      }
    });

    return finalData;
  }, [teamMatrix, ipcMatrix, matrixBlocks, reportType, selectedIpc, selectedTeam]);

  const handleExport = () => {
    let headers = [];
    if (reportType === 'UNCLAIMED') headers = ['Tầng', 'Block', 'Nhóm', 'Hạng mục', 'Số căn', 'KL đã lên IPC', 'Khối lượng chênh lệch (Chưa lên IPC)'];
    else if (reportType === 'BY_IPC') headers = ['Tầng', 'Block', 'Nhóm', 'Hạng mục', 'Nội dung IPC', 'Số căn', 'Khối lượng đã lên IPC', 'Chưa lên KL'];
    else headers = ['Tầng', 'Block', 'Nhóm', 'Hạng mục', 'Nội dung ghi nhận (Tổ đội)', 'Số căn', 'Khối lượng tổ đội báo cáo', 'Chưa báo cáo (KL)'];
      
    const rows = reportData.map(row => {
      if (reportType === 'UNCLAIMED') {
        return [
          row.floor, row.block, row.group, row.item, row.totalApts,
          row.ipcUnits.toFixed(2).replace(/\.00$/, ''), row.diffUnits.toFixed(2).replace(/\.00$/, '')
        ];
      } else if (reportType === 'BY_IPC') {
        return [
          row.floor, row.block, row.group, row.item, 
          row.ipcPartValue, row.totalApts, row.ipcUnits.toFixed(2).replace(/\.00$/, ''), row.diffUnits.toFixed(2).replace(/\.00$/, '')
        ];
      } else {
        return [
          row.floor, row.block, row.group, row.item, 
          row.teamVal, row.totalApts, row.teamUnits.toFixed(2).replace(/\.00$/, ''), row.diffUnits.toFixed(2).replace(/\.00$/, '')
        ];
      }
    });
    
    exportToExcel(`Bao_Cao_IPC_${projectName}`, headers, rows);
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 10mm; }
          body * { visibility: hidden; }
          #ipc-report-modal, #ipc-report-modal * { visibility: visible; }
          #ipc-modal-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            width: 100% !important;
          }
          #ipc-report-modal {
            position: relative !important;
            display: block !important;
            transform: none !important;
            width: 100% !important;
            height: auto !important;
            max-width: none !important;
            max-height: none !important;
            overflow: visible !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print, .screen-only { display: none !important; }
          .print-only { display: table-cell !important; }
          
          /* Cho phép in nhiều trang không bị cắt */
          #ipc-report-modal .overflow-auto,
          #ipc-report-modal .overflow-hidden,
          #ipc-report-modal .flex-1 {
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
          }
          
          /* Bảng báo cáo chuẩn in ấn */
          #ipc-report-modal .bg-slate-50 { background: white !important; padding: 0 !important; }
          #ipc-report-modal .rounded-2xl { border-radius: 0 !important; border: none !important; }
          #ipc-report-modal table {
            border-collapse: collapse !important;
            width: 100% !important;
            margin-top: 20px;
          }
          #ipc-report-modal th, 
          #ipc-report-modal td {
            border: 1px solid #000 !important;
            padding: 8px 12px !important;
            color: #000 !important;
            font-size: 13px !important;
          }
          #ipc-report-modal th {
            background-color: #f3f4f6 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-weight: bold !important;
            border-bottom-width: 2px !important;
          }
          #ipc-report-modal td {
            vertical-align: top;
          }
        }
      `}</style>
      <div id="ipc-modal-wrapper" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
        <div id="ipc-report-modal" className="bg-white rounded-3xl w-full max-w-[1300px] max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">
                {reportType === 'BY_IPC' && selectedIpc !== 'ALL' ? `PHẠM VI HSTT ${selectedIpc}` : reportType === 'TEAM_CUMULATIVE' && selectedTeam !== 'ALL' ? `BÁO CÁO LŨY KẾ: ${selectedTeam}` : reportType === 'TEAM_CUMULATIVE' ? 'BÁO CÁO LŨY KẾ TỔ ĐỘI' : 'PHẠM VI HSTT IPC'}
              </h2>
              <p className="text-sm font-medium text-slate-500">Dự án: {projectName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 text-gray-500 rounded-full transition no-print"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white flex flex-wrap items-center gap-4 no-print">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setReportType('UNCLAIMED')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                reportType === 'UNCLAIMED' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <AlertCircle className="w-4 h-4 inline-block mr-1.5" />
              Chưa lên hồ sơ
            </button>
            <button
              onClick={() => setReportType('BY_IPC')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                reportType === 'BY_IPC' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 inline-block mr-1.5" />
              Tra cứu theo đợt
            </button>
            <button
              onClick={() => setReportType('TEAM_CUMULATIVE')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                reportType === 'TEAM_CUMULATIVE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 inline-block mr-1.5" />
              Lũy kế tổ đội
            </button>
          </div>

          {reportType === 'BY_IPC' && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-gray-700">Chọn Đợt IPC:</label>
              <select
                value={selectedIpc}
                onChange={(e) => setSelectedIpc(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Tất cả IPC (Lũy kế)</option>
                {uniqueIpcs.length === 0 && <option disabled>Chưa có IPC nào</option>}
                {uniqueIpcs.map(ipc => (
                  <option key={ipc} value={ipc}>{ipc}</option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'TEAM_CUMULATIVE' && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-gray-700">Chọn Tổ Đội:</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[300px]"
              >
                <option value="ALL">Tất cả tổ đội</option>
                {uniqueTeams.length === 0 && <option disabled>Chưa có tổ đội nào báo cáo</option>}
                {uniqueTeams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex-1"></div>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl flex items-center gap-2 text-sm transition-colors border border-blue-200 mr-2"
          >
            🖨️ In Báo cáo
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl flex items-center gap-2 text-sm transition-colors border border-emerald-200"
          >
            <FileSpreadsheet className="w-4 h-4" /> Xuất Excel
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          {reportData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <FileText className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-bold text-lg">Không có dữ liệu phù hợp</p>
              <p className="text-sm">Tất cả các hạng mục đều đã được lên hồ sơ hoặc chưa có dữ liệu báo cáo.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="px-4 py-3 w-[100px] border border-slate-200">Tầng</th>
                    <th className="px-4 py-3 w-[100px] border border-slate-200">Block</th>
                    <th className="px-4 py-3 w-[220px] border border-slate-200">Nhóm</th>
                    <th className="px-4 py-3 w-[180px] border border-slate-200">Hạng mục</th>
                    {reportType === 'UNCLAIMED' ? (
                      <>
                        <th className="px-4 py-3 text-right w-[100px] border border-slate-200">Tổng Căn</th>
                        <th className="px-4 py-3 border border-slate-200 w-[200px]">Đã Lên IPC</th>
                        <th className="px-4 py-3 text-right border border-slate-200 w-[120px]">Chưa Lên (KL)</th>
                      </>
                    ) : reportType === 'BY_IPC' ? (
                      <>
                        <th className="px-4 py-3 border border-slate-200 w-[250px]">Nội dung ghi nhận</th>
                        <th className="px-4 py-3 text-right w-[100px] border border-slate-200">Tổng Căn</th>
                        <th className="px-4 py-3 text-right border border-slate-200 w-[150px]">Khối lượng IPC</th>
                        <th className="px-4 py-3 text-right border border-slate-200 w-[120px]">Chưa lên KL</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 border border-slate-200 w-[250px]">Nội dung ghi nhận (Tổ đội)</th>
                        <th className="px-4 py-3 text-right w-[100px] border border-slate-200">Tổng Căn</th>
                        <th className="px-4 py-3 text-right border border-slate-200 w-[150px]">Khối lượng tổ đội</th>
                        <th className="px-4 py-3 text-right border border-slate-200 w-[120px]">Chưa báo cáo (KL)</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, idx) => {
                    const showFloor = idx === 0 || reportData[idx - 1].floor !== row.floor;
                    const showBlock = idx === 0 || reportData[idx - 1].block !== row.block || showFloor;
                    const showGroup = idx === 0 || reportData[idx - 1].group !== row.group || showBlock;
                    const isApt = row.isApt;

                    const formatUnit = (val) => {
                      if (isApt) return `${val.toFixed(2).replace(/\.00$/, '')} căn`;
                      if (row.totalApts > 0) return `${Math.round((val / row.totalApts) * 100)}%`;
                      return val.toFixed(2).replace(/\.00$/, '');
                    };

                    const getRowSpan = (currentIndex, field) => {
                      let span = 1;
                      for (let i = currentIndex + 1; i < reportData.length; i++) {
                        if (reportData[i][field] === row[field]) {
                          if (field === 'group' && (reportData[i].floor !== row.floor || reportData[i].block !== row.block)) break;
                          if (field === 'block' && reportData[i].floor !== row.floor) break;
                          span++;
                        } else {
                          break;
                        }
                      }
                      return span;
                    };

                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        {showFloor && (
                          <td rowSpan={getRowSpan(idx, 'floor')} className="px-4 py-3 font-bold break-words border border-slate-200 bg-white" style={{ verticalAlign: 'middle' }}>{row.floor}</td>
                        )}
                        
                        {showBlock && (
                          <td rowSpan={getRowSpan(idx, 'block')} className="px-4 py-3 text-gray-600 font-semibold border border-slate-200 bg-white" style={{ verticalAlign: 'middle' }}>{row.block}</td>
                        )}
                        
                        {showGroup && (
                          <td rowSpan={getRowSpan(idx, 'group')} className="px-4 py-3 text-gray-600 font-semibold border border-slate-200 bg-white" style={{ verticalAlign: 'middle' }}>{row.group}</td>
                        )}

                        <td className="px-4 py-3 font-medium text-gray-800 border border-slate-200" style={{ verticalAlign: 'middle' }}>{row.item}</td>
                        {reportType === 'UNCLAIMED' ? (
                          <>
                            <td className="px-4 py-3 text-right text-gray-700 font-black border border-slate-200" style={{ verticalAlign: 'middle' }}>{isApt && row.totalApts ? formatUnit(row.totalApts) : '100%'}</td>
                            <td className="px-4 py-3 text-gray-600 border border-slate-200" style={{ verticalAlign: 'middle' }}>
                              <div>{row.ipcVal}</div>
                              <div className="text-xs text-gray-400">({formatUnit(row.ipcUnits)})</div>
                            </td>
                            <td className="px-4 py-3 text-right font-black text-rose-500 border border-slate-200" style={{ verticalAlign: 'middle' }}>
                              {formatUnit(row.diffUnits)}
                            </td>
                          </>
                        ) : reportType === 'BY_IPC' ? (
                          <>
                            <td className="px-4 py-3 text-indigo-600 font-medium border border-slate-200" style={{ verticalAlign: 'middle' }}>{row.ipcPartValue}</td>
                            <td className="px-4 py-3 text-right text-gray-700 font-black border border-slate-200" style={{ verticalAlign: 'middle' }}>{isApt && row.totalApts ? formatUnit(row.totalApts) : '100%'}</td>
                            <td className="px-4 py-3 text-right font-black text-emerald-600 border border-slate-200" style={{ verticalAlign: 'middle' }}>{formatUnit(row.ipcUnits)}</td>
                            <td className="px-4 py-3 text-right font-black text-rose-500 border border-slate-200" style={{ verticalAlign: 'middle' }}>{formatUnit(row.diffUnits)}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-indigo-600 font-medium border border-slate-200" style={{ verticalAlign: 'middle' }}>{row.teamVal}</td>
                            <td className="px-4 py-3 text-right text-gray-700 font-black border border-slate-200" style={{ verticalAlign: 'middle' }}>{isApt && row.totalApts ? formatUnit(row.totalApts) : '100%'}</td>
                            <td className="px-4 py-3 text-right font-black text-emerald-600 border border-slate-200" style={{ verticalAlign: 'middle' }}>{formatUnit(row.teamUnits)}</td>
                            <td className="px-4 py-3 text-right font-black text-rose-500 border border-slate-200" style={{ verticalAlign: 'middle' }}>{formatUnit(row.diffUnits)}</td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
