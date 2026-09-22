'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useStore, useAllowedProjects } from '@/store/useStore';
import { 
  UserCheck, 
  Plus, 
  Trash2, 
  FileDown, 
  Printer, 
  RotateCcw, 
  Users,
  Edit2,
  BarChart3
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return 0;
  const normalized = String(value).replace(/,/g, '').trim();
  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : 0;
};

export default function TeamAttendanceView() {
  const { 
    teams, 
    activeProject, 
    setActiveProject, 
    attendanceSheets, 
    addAttendanceRow,
    updateAttendanceCell,
    updateAttendanceRow,
    deleteAttendanceRow,
    setAttendanceSheet,
    openGlobalConfirm,
    openGlobalPrompt,
    openGlobalAlert
  } = useStore();

  const projects = useAllowedProjects();

  // Set selected project
  const selectedProject = (activeProject && projects.some(p => p.name === activeProject)) 
    ? activeProject 
    : projects[0]?.name || '';

  // Filter teams assigned to selected project (handles both array and comma-separated string)
  const projectTeams = useMemo(() => {
    return teams.filter(t => {
      let projs = [];
      if (Array.isArray(t.projects) && t.projects.length > 0) {
        projs = t.projects.flatMap(p => typeof p === 'string' ? p.split(',') : p).map(s => s.trim()).filter(Boolean);
      } else {
        const nameStr = t.projectName || t.project_name || '';
        projs = nameStr.split(',').map(s => s.trim()).filter(Boolean);
      }
      return projs.includes(selectedProject);
    });
  }, [teams, selectedProject]);

  // Current sheet for selected project
  const currentSheet = attendanceSheets[selectedProject] || { rows: [], customTeams: [] };

  // Determine active team columns (teams queried from project + any custom added teams)
  const teamItems = useMemo(() => {
    let items = projectTeams.map(t => ({
      id: t.id || `team_${t.teamName || t.team_name}`,
      name: (t.teamName || t.team_name || 'Tổ Đội').toUpperCase(),
      isInactive: (currentSheet.inactiveTeams || []).includes(t.id || `team_${t.teamName || t.team_name}`)
    }));

    // If no teams set for project, provide default fallback team columns
    if (items.length === 0) {
      items = [
        { id: 'team_a', name: 'ĐỘI A', isInactive: (currentSheet.inactiveTeams || []).includes('team_a') },
        { id: 'team_b', name: 'ĐỘI B', isInactive: (currentSheet.inactiveTeams || []).includes('team_b') }
      ];
    }

    // Include custom added team columns if any
    if (currentSheet.customTeams && currentSheet.customTeams.length > 0) {
      currentSheet.customTeams.forEach(ct => {
        if (!items.some(c => c.id === ct.id)) {
          items.push({ id: ct.id, name: ct.name.toUpperCase(), isInactive: (currentSheet.inactiveTeams || []).includes(ct.id) });
        }
      });
    }

    // Sort items: active first, inactive last
    return items.sort((a, b) => {
      if (a.isInactive === b.isInactive) return 0;
      return a.isInactive ? 1 : -1;
    });
  }, [projectTeams, currentSheet.customTeams, currentSheet.inactiveTeams]);

  // Default initial rows seed
  useEffect(() => {
    if (!attendanceSheets[selectedProject] || !attendanceSheets[selectedProject].rows || attendanceSheets[selectedProject].rows.length === 0) {
      const defaultRows = [
        {
          id: 'att_row_1',
          date: '26/02/2026',
          values: { [teamItems[0]?.id || 'team_a']: 5, [teamItems[1]?.id || 'team_b']: 19 }
        },
        {
          id: 'att_row_2',
          date: '07/04/2026',
          values: { [teamItems[0]?.id || 'team_a']: 10, [teamItems[1]?.id || 'team_b']: 1 }
        },
        {
          id: 'att_row_3',
          date: '22/04/2026',
          values: { [teamItems[0]?.id || 'team_a']: 0, [teamItems[1]?.id || 'team_b']: 0 }
        }
      ];

      setAttendanceSheet(selectedProject, {
        ...currentSheet,
        rows: defaultRows
      });
    }
  }, [selectedProject]);

  const rows = currentSheet.rows || [];

  const today = new Date();
  const todayFormatted = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(todayFormatted);
  const [showChart, setShowChart] = useState(false);

  const toISO = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      let y = parts[2];
      if (y.length === 2) y = '20' + y;
      return `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateStr;
  };

  const formatToDDMMYYYY = (isoDate) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
       const y = parts[0];
       const m = parts[1];
       const d = parts[2];
       return `${d}/${m}/${y}`;
    }
    return isoDate;
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      let y = parseInt(parts[2], 10);
      let m = parseInt(parts[1], 10) - 1;
      let d = parseInt(parts[0], 10);
      if (y < 100) y += 2000;
      return new Date(y, m, d);
    }
    return null;
  };

  const filteredRows = useMemo(() => {
    const result = rows.filter(row => {
      const rowDate = parseDate(row.date);
      if (!rowDate) return true;
      
      let from = null;
      let to = null;
      
      if (fromDate) {
        from = parseDate(fromDate);
        if (from) from.setHours(0,0,0,0);
      }
      if (toDate) {
        to = parseDate(toDate);
        if (to) to.setHours(23,59,59,999);
      }
      
      if (from && rowDate < from) return false;
      if (to && rowDate > to) return false;
      return true;
    });

    return result.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateB.getTime() - dateA.getTime();
    });
  }, [rows, fromDate, toDate]);

  // Header Color Palettes matching Materials Matrix exact style
  const headerColors = [
    'bg-[#2563eb] text-white', // Blue
    'bg-[#059669] text-white', // Emerald Green
    'bg-[#9333ea] text-white', // Purple
    'bg-[#d97706] text-white', // Amber / Orange
    'bg-[#e11d48] text-white', // Rose / Red
    'bg-[#0891b2] text-white', // Cyan
    'bg-[#4f46e5] text-white', // Indigo
    'bg-[#ea580c] text-white'  // Bright Orange
  ];
  
  const baseChartColors = [
    '#2563eb', '#059669', '#9333ea', '#d97706', 
    '#e11d48', '#0891b2', '#4f46e5', '#ea580c'
  ];

  // Calculate totals per team column
  const columnTotals = useMemo(() => {
    const totals = {};
    teamItems.forEach(col => {
      totals[col.id] = filteredRows.reduce((sum, row) => {
        const val = row.values?.[col.id];
        return sum + parseNumber(val);
      }, 0);
    });
    return totals;
  }, [teamItems, filteredRows]);

  // Chart Data grouped by Month
  const chartDataByMonth = useMemo(() => {
    const grouped = {};
    
    filteredRows.forEach(row => {
      const d = parseDate(row.date);
      if (!d) return;
      
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          monthKey,
          name: monthLabel,
        };
        // Initialize all teams to 0 for this month
        teamItems.forEach(team => {
          grouped[monthKey][team.id] = 0;
        });
      }
      
      teamItems.forEach(team => {
        grouped[monthKey][team.id] += parseNumber(row.values?.[team.id]);
      });
    });

    // Sort by month ascending
    const sortedKeys = Object.keys(grouped).sort();
    return sortedKeys.map(key => grouped[key]);
  }, [filteredRows, teamItems]);

  // Actions
  const handleTeamHeaderClick = (item) => {
    const isInactive = item.isInactive;
    const msg = isInactive 
      ? `Đội "${item.name}" đang được đánh dấu nghỉ làm.\nBạn có muốn chuyển lại thành ĐANG LÀM VIỆC?`
      : `Đội "${item.name}" ĐÃ NGHỈ LÀM?\n(Đội sẽ được chuyển xuống cuối và đổi màu xám)`;

    openGlobalConfirm(msg, () => {
      const currentInactive = currentSheet.inactiveTeams || [];
      const nextInactive = isInactive 
        ? currentInactive.filter(id => id !== item.id)
        : [...currentInactive, item.id];
        
      setAttendanceSheet(selectedProject, {
        ...currentSheet,
        inactiveTeams: nextInactive
      });
    }, 'Trạng thái đội');
  };

  const handleAddRow = () => {
    const today = new Date();
    const isoToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    openGlobalPrompt('Chọn ngày điểm danh để thêm:', (newDate) => {
      if (!newDate) return;
      
      let formattedDate = newDate;
      if (newDate.includes('-')) {
        const parts = newDate.split('-');
        if (parts.length === 3) {
          formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }
      
      if (rows.some(r => r.date === formattedDate)) {
        openGlobalAlert(`Ngày ${formattedDate} đã tồn tại trong bảng điểm danh!`);
        return;
      }
      
      addAttendanceRow(selectedProject, formattedDate);
    }, isoToday, 'Thêm Ngày Điểm Danh', 'date');
  };

  const handleAddCustomTeam = () => {
    openGlobalPrompt('Nhập tên tổ đội cần thêm:', (teamName) => {
      if (!teamName || !teamName.trim()) return;
      const newCol = {
        id: `custom_team_${Date.now()}`,
        name: teamName.trim().toUpperCase()
      };
      const nextCustom = [...(currentSheet.customTeams || []), newCol];
      setAttendanceSheet(selectedProject, {
        ...currentSheet,
        customTeams: nextCustom
      });
    }, '', 'Thêm Đội Mới');
  };

  const handleRemoveColumn = (colId) => {
    openGlobalConfirm('Bạn có chắc chắn muốn xóa cột đội này?', () => {
      const nextCustom = (currentSheet.customTeams || []).filter(c => c.id !== colId);
      setAttendanceSheet(selectedProject, {
        ...currentSheet,
        customTeams: nextCustom
      });
    }, 'Xác nhận xóa');
  };

  const handleEditTeamName = (item) => {
    openGlobalPrompt('Nhập tên tổ đội:', (newName) => {
      if (newName && newName.trim()) {
        const updatedCustom = (currentSheet.customTeams || []).map(c => c.id === item.id ? { ...c, name: newName.trim().toUpperCase() } : c);
        setAttendanceSheet(selectedProject, {
          ...currentSheet,
          customTeams: updatedCustom
        });
      }
    }, item.name, 'Chỉnh sửa tên đội');
  };

  const handleEditDate = (row) => {
    const toISO = (dateStr) => {
      if (!dateStr) return '';
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        let y = parts[2];
        if (y.length === 2) y = '20' + y;
        return `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      return dateStr;
    };

    openGlobalPrompt('Chọn ngày điểm danh:', (newDate) => {
      if (newDate !== null) {
        if (newDate) {
          let formattedDate = newDate;
          const parts = newDate.split('-');
          if (parts.length === 3) {
             const y = parts[0];
             const m = parts[1];
             const d = parts[2];
             formattedDate = `${d}/${m}/${y}`;
          }
          
          if (formattedDate !== row.date && rows.some(r => r.date === formattedDate)) {
             openGlobalAlert(`Ngày ${formattedDate} đã tồn tại trong bảng điểm danh!`);
             return;
          }
          
          updateAttendanceRow(selectedProject, row.id, 'date', formattedDate);
        } else {
          updateAttendanceRow(selectedProject, row.id, 'date', '');
        }
      }
    }, toISO(row.date), 'Chọn Ngày', 'date', false, null, () => {
      openGlobalConfirm('Bạn có chắc chắn muốn xóa dòng này?', () => {
        deleteAttendanceRow(selectedProject, row.id);
      }, 'Xác nhận xóa dòng');
    });
  };

  const handleResetData = () => {
    openGlobalConfirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu điểm danh của công trình này?', () => {
      setAttendanceSheet(selectedProject, { rows: [], customTeams: [] });
    }, 'Cảnh báo xóa dữ liệu');
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const exportData = [];

      // Data Rows
      rows.forEach(r => {
        const rowData = { 'NGÀY': r.date || '' };
        teamItems.forEach(item => {
          rowData[item.name] = r.values?.[item.id] ?? 0;
        });
        exportData.push(rowData);
      });

      // Total Row
      const totalRow = { 'NGÀY': 'TỔNG' };
      teamItems.forEach(item => {
        totalRow[item.name] = columnTotals[item.id] || 0;
      });
      exportData.push(totalRow);

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Điểm Danh Đội');
      XLSX.writeFile(workbook, `Diem_Danh_Doi_${selectedProject}.xlsx`);
    } catch (err) {
      console.error('Lỗi khi xuất Excel:', err);
      alert('Không thể xuất file Excel!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pb-12 bg-white min-h-screen">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-attendance, #print-attendance * {
            visibility: visible;
          }
          #print-attendance {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .overflow-x-auto {
            overflow: visible !important;
          }
        }
      `}</style>

      <div className="p-4 sm:p-8 space-y-4 sm:space-y-6 w-full">
        {/* Top Header Card */}
        <div className="flex flex-col gap-4 rounded-3xl border border-indigo-100 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                Điểm Danh Đội
                <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-2.5 py-0.5 rounded-full">
                  {selectedProject}
                </span>
              </h1>
              <p className="text-sm text-slate-500">Theo dõi điểm danh tổ đội thi công theo từng công trình</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedProject}
              onChange={(e) => setActiveProject(e.target.value)}
              className="min-w-[180px] rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {projects.map((project) => (
                <option key={project.id || project.name} value={project.name}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content Container (Matching Receive Materials Table & Toolbar Format 100%) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" id="print-attendance">
          <div className="space-y-4">
            {/* Action Toolbar (Exact format matching Receive Materials) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide flex-nowrap md:flex-wrap w-full">
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition active:scale-95 shadow-xs shrink-0 whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                Thêm dòng
              </button>

              <button
                type="button"
                onClick={handleResetData}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition shadow-xs shrink-0 whitespace-nowrap"
              >
                <RotateCcw className="h-4 w-4" />
                Clear dữ liệu
              </button>

              <button
                type="button"
                onClick={() => setShowChart(!showChart)}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition shadow-xs shrink-0 whitespace-nowrap"
              >
                <BarChart3 className="h-4 w-4" />
                {showChart ? 'Ẩn biểu đồ' : 'Xem biểu đồ'}
              </button>

              <div className="flex-1"></div>

              <div className="flex items-center gap-2 mr-2 shrink-0 whitespace-nowrap">
                <span className="text-sm font-semibold text-slate-700">Từ:</span>
                <input 
                  type="date"
                  value={toISO(fromDate)}
                  onChange={(e) => setFromDate(formatToDDMMYYYY(e.target.value))}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-w-[130px] cursor-pointer"
                />
                <span className="text-sm text-slate-500">-</span>
                <span className="text-sm font-semibold text-slate-700">Đến:</span>
                <input 
                  type="date"
                  value={toISO(toDate)}
                  onChange={(e) => setToDate(formatToDDMMYYYY(e.target.value))}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-w-[130px] cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 rounded-xl bg-[#107c41] px-4 py-2 text-sm font-semibold text-white hover:bg-[#185c37] transition print:hidden shadow-xs shrink-0 whitespace-nowrap"
              >
                <FileDown className="h-4 w-4" />
                Xuất Excel
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition print:hidden shadow-xs shrink-0 whitespace-nowrap"
              >
                <Printer className="h-4 w-4" />
                In
              </button>
            </div>

            {/* Chart Section */}
            {showChart && chartDataByMonth.length > 0 && (
              <div className="mb-6 p-5 border border-slate-200 rounded-2xl bg-slate-50/50 print:hidden">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Biểu Đồ Tổng Số Công Nhân Theo Tháng</h3>
                </div>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataByMonth} margin={{ top: 10, right: 30, left: -20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 500 }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      {teamItems.map((team, index) => {
                        const color = team.isInactive ? '#94a3b8' : baseChartColors[index % baseChartColors.length];
                        return (
                          <Bar 
                            key={team.id} 
                            dataKey={team.id} 
                            name={team.name} 
                            fill={color} 
                            radius={[4, 4, 0, 0]} 
                            maxBarSize={40} 
                            animationDuration={1000} 
                          />
                        );
                      })}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Attendance Table (Exact Border-slate-800 Grid Format, Single Team Column, No Yêu cầu/Nhận split, Only TỔNG row) */}
            <div id="print-section" className="overflow-hidden rounded-lg border border-slate-800 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table id="attendance-table" className="w-full border-collapse border border-slate-800 text-center text-sm">
                  <thead>
                    {/* Header Row: NGÀY (DD/MM/YYYY) & Colored Team Name Headers */}
                    <tr>
                      <th className="border border-slate-800 bg-white px-2 py-2 font-bold text-slate-900 w-[120px] max-w-[120px] text-center leading-tight">
                        NGÀY<br/>
                        <span className="text-[10px] opacity-80 font-medium">(DD/MM/YYYY)</span>
                      </th>

                      {teamItems.map((item, index) => {
                        const isInactive = item.isInactive;
                        const colorClass = isInactive 
                          ? 'bg-slate-500 text-white' 
                          : headerColors[index % headerColors.length];
                          
                        return (
                          <th key={item.id} className={`border border-slate-800 p-0 ${colorClass.split(' ')[0]}`}>
                            <div 
                              onClick={() => handleTeamHeaderClick(item)}
                              className={`w-full h-full min-w-[140px] p-2.5 text-center font-bold uppercase text-xs tracking-wide min-h-[42px] flex flex-col items-center justify-center relative group ${colorClass.split(' ')[1]} cursor-pointer hover:brightness-95`}
                              title="Click để đổi trạng thái nghỉ làm / đang làm"
                            >
                              <span>{item.name}</span>
                              {isInactive && <span className="text-[10px] font-normal opacity-90 mt-0.5">(Đã nghỉ)</span>}
                              
                              {item.id.startsWith('custom_team_') && (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditTeamName(item);
                                    }}
                                    className="absolute left-1 top-1 text-slate-200 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Sửa tên đội"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveColumn(item.id);
                                    }}
                                    className="absolute right-1 top-1 text-slate-200 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Xóa cột này"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={teamItems.length + 1} className="py-12 text-slate-400 font-semibold text-xs text-center">
                          Chưa có dữ liệu điểm danh (hoặc không có dữ liệu trong khoảng ngày lọc). Bấm <strong className="text-emerald-600">"+ Thêm dòng"</strong> để bắt đầu.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row, rIdx) => {
                        const d = parseDate(row.date);
                        const isSunday = d && d.getDay() === 0;

                        return (
                          <tr key={row.id || rIdx} className="hover:bg-slate-50 transition">
                            {/* Left Column: Date (Click to edit date or delete row) */}
                            <td 
                              onClick={() => handleEditDate(row)}
                              className="border border-slate-800 bg-white px-2 py-2 text-center font-bold text-xs cursor-pointer hover:bg-indigo-50/50 transition select-none"
                              title="Click để chọn/sửa ngày"
                            >
                              {row.date ? (
                                <span className={`font-extrabold text-xs ${isSunday ? 'text-red-600' : 'text-slate-900'}`}>
                                  {row.date}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Chọn ngày</span>
                              )}
                            </td>

                            {/* Team Attendance Headcount Cells */}
                            {teamItems.map((item) => {
                              const rawVal = row.values?.[item.id];
                              const val = rawVal ?? '';
                              const isZero = parseNumber(rawVal) === 0;
                              const isInactive = item.isInactive;
                              
                              return (
                                <td 
                                  key={item.id} 
                                  className={`border border-slate-800 p-1 text-center transition ${
                                    isInactive 
                                      ? 'bg-slate-200 cursor-not-allowed opacity-90' 
                                      : 'bg-white cursor-pointer hover:bg-amber-50'
                                  }`}
                                  onClick={() => {
                                    if (isInactive) return; // Prevent updating inactive team
                                    
                                    openGlobalPrompt(
                                      `Nhập quân số của đội ${item.name}:`,
                                      (newVal) => {
                                        if (newVal !== null) {
                                          updateAttendanceCell(selectedProject, row.id, item.id, newVal);
                                        }
                                      },
                                      val || '',
                                      'Nhập Quân Số',
                                      'number'
                                    );
                                  }}
                                  title={isInactive ? 'Đội đã nghỉ làm, không thể cập nhật' : 'Click để nhập số lượng'}
                                >
                                  <div className={`w-full text-center bg-transparent font-extrabold text-sm py-1 select-none ${
                                    isInactive ? 'text-slate-500' : (isZero ? 'text-slate-300' : 'text-slate-900')
                                  }`}>
                                    {val || 0}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                    )}

                    {/* Single Summary Row: TỔNG (Yellow bg-[#fffaf0] matching Materials Matrix total style) */}
                    <tr className="bg-[#fffaf0] font-black text-slate-900 border-t-2 border-slate-800">
                      <td className="border border-slate-800 p-2.5 font-extrabold text-xs text-amber-900 text-center uppercase tracking-wider">
                        TỔNG
                      </td>
                      {teamItems.map((item) => (
                        <td key={item.id} className="border border-slate-800 p-2.5 text-center text-indigo-700 font-black text-sm">
                          {columnTotals[item.id] || 0}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
