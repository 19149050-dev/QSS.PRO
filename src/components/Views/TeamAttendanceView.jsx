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
  BarChart3,
  Copy,
  ClipboardPaste,
  Sparkles,
  ArrowDown,
  Eraser,
  MapPin,
  X
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
  const isTeamInactive = (id, name, rawName) => {
    const list = currentSheet.inactiveTeams || [];
    if (!list || list.length === 0) return false;
    return list.includes(id) || 
           (name && list.includes(name)) || 
           (rawName && list.includes(rawName)) ||
           (name && list.includes(name.toUpperCase()));
  };

  const teamItems = useMemo(() => {
    let items = projectTeams.map(t => {
      const id = t.id || `team_${t.teamName || t.team_name}`;
      const name = (t.teamName || t.team_name || 'Tổ Đội').toUpperCase();
      const rawName = t.teamName || t.team_name || '';
      return {
        id,
        name,
        rawName,
        isInactive: isTeamInactive(id, name, rawName)
      };
    });

    // If no teams set for project, provide default fallback team columns
    if (items.length === 0) {
      items = [
        { id: 'team_a', name: 'ĐỘI A', rawName: 'Đội A', isInactive: isTeamInactive('team_a', 'ĐỘI A', 'Đội A') },
        { id: 'team_b', name: 'ĐỘI B', rawName: 'Đội B', isInactive: isTeamInactive('team_b', 'ĐỘI B', 'Đội B') }
      ];
    }

    // Include custom added team columns if any
    if (currentSheet.customTeams && currentSheet.customTeams.length > 0) {
      currentSheet.customTeams.forEach(ct => {
        if (!items.some(c => c.id === ct.id)) {
          const name = ct.name.toUpperCase();
          items.push({
            id: ct.id,
            name,
            rawName: ct.name,
            isInactive: isTeamInactive(ct.id, name, ct.name)
          });
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
  const [chartViewMode, setChartViewMode] = useState('month'); // 'day' | 'week' | 'month'
  
  // Right-click Context Menu & Copy/Paste States
  const [contextMenu, setContextMenu] = useState(null);
  const [copiedAttendanceData, setCopiedAttendanceData] = useState(null);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleCellContextMenu = (e, row, item, field = 'count') => {
    e.preventDefault();
    if (item.isInactive) return;
    const count = row.values?.[item.id] ?? '';
    const note = row.notes?.[item.id] || '';
    const val = field === 'count' ? (count !== undefined ? String(count) : '') : (note || '');
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      rowId: row.id,
      teamId: item.id,
      teamName: item.name,
      dateStr: row.date,
      field,
      val
    });
  };

  const handleCellClick = (row, item, field = 'count') => {
    if (item.isInactive) return;
    if (copiedAttendanceData !== null) {
      const targetCount = copiedAttendanceData.field === 'count' ? copiedAttendanceData.val : undefined;
      const targetNote = copiedAttendanceData.field === 'note' ? copiedAttendanceData.val : undefined;
      updateAttendanceCell(
        selectedProject,
        row.id,
        item.id,
        targetCount,
        targetNote
      );
      return;
    }
    setAttendanceModal({
      isOpen: true,
      rowId: row.id,
      teamId: item.id,
      teamName: item.name,
      dateStr: row.date,
      count: row.values?.[item.id] ?? '',
      note: row.notes?.[item.id] || ''
    });
  };

  const [attendanceModal, setAttendanceModal] = useState({
    isOpen: false,
    rowId: null,
    teamId: null,
    teamName: '',
    dateStr: '',
    count: '',
    note: ''
  });

  const handleSaveAttendanceModal = () => {
    if (!attendanceModal.rowId || !attendanceModal.teamId) return;
    updateAttendanceCell(
      selectedProject,
      attendanceModal.rowId,
      attendanceModal.teamId,
      attendanceModal.count,
      attendanceModal.note
    );
    setAttendanceModal(prev => ({ ...prev, isOpen: false }));
  };

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

  // Chart Data grouped dynamically by Day / Week / Month
  const chartData = useMemo(() => {
    const grouped = {};
    
    // Sort chronological ascending for chart display
    const chronologicalRows = [...filteredRows].sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      if (!dateA && !dateB) return 0;
      if (!dateA) return -1;
      if (!dateB) return 1;
      return dateA.getTime() - dateB.getTime();
    });

    chronologicalRows.forEach(row => {
      const d = parseDate(row.date);
      if (!d) return;
      
      let key = '';
      let label = '';
      
      if (chartViewMode === 'day') {
        const timeVal = d.getTime();
        key = String(timeVal);
        label = row.date;
      } else if (chartViewMode === 'week') {
        const tempD = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const dayNum = tempD.getUTCDay() || 7;
        tempD.setUTCDate(tempD.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(tempD.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((tempD - yearStart) / 86400000) + 1) / 7);
        const year = tempD.getUTCFullYear();
        
        key = `${year}-W${String(weekNo).padStart(2, '0')}`;
        label = `Tuần ${weekNo}/${year}`;
      } else {
        // month
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        key = monthKey;
        label = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
      }

      if (!grouped[key]) {
        grouped[key] = {
          sortKey: key,
          name: label,
        };
        teamItems.forEach(team => {
          grouped[key][team.id] = 0;
        });
      }
      
      teamItems.forEach(team => {
        grouped[key][team.id] += parseNumber(row.values?.[team.id]);
      });
    });

    const sortedKeys = Object.keys(grouped).sort();
    return sortedKeys.map(k => grouped[k]);
  }, [filteredRows, teamItems, chartViewMode]);

  // Actions
  const handleTeamHeaderClick = (item) => {
    const isInactive = item.isInactive;
    const msg = isInactive 
      ? `Đội "${item.name}" đang được đánh dấu nghỉ làm.\nBạn có muốn chuyển lại thành ĐANG LÀM VIỆC?`
      : `Đội "${item.name}" ĐÃ NGHỈ LÀM?\n(Đội sẽ được chuyển xuống cuối và đổi màu xám)`;

    openGlobalConfirm(msg, () => {
      const currentInactive = currentSheet.inactiveTeams || [];
      const identifiers = [item.id, item.name, item.rawName].filter(Boolean);
      
      let nextInactive;
      if (isInactive) {
        nextInactive = currentInactive.filter(id => !identifiers.includes(id) && !identifiers.includes(String(id).toUpperCase()));
      } else {
        nextInactive = Array.from(new Set([...currentInactive, ...identifiers]));
      }
        
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

  // Export to Excel (2 columns per team: Số CN | Vị trí thi công)
  const handleExportExcel = () => {
    try {
      const headerRow1 = ['NGÀY'];
      const headerRow2 = [''];
      const merges = [{ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }]; // Merge NGÀY vertically

      let colIdx = 1;
      teamItems.forEach(item => {
        headerRow1.push(item.name, '');
        headerRow2.push('Số CN', 'Vị trí thi công');
        merges.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: colIdx + 1 } });
        colIdx += 2;
      });

      const dataRows = [headerRow1, headerRow2];

      filteredRows.forEach(r => {
        const rowArr = [r.date || ''];
        teamItems.forEach(item => {
          const count = parseNumber(r.values?.[item.id]);
          const note = r.notes?.[item.id] || '';
          rowArr.push(count, note);
        });
        dataRows.push(rowArr);
      });

      const totalArr = ['TỔNG'];
      teamItems.forEach(item => {
        totalArr.push(columnTotals[item.id] || 0, '');
      });
      dataRows.push(totalArr);

      const worksheet = XLSX.utils.aoa_to_sheet(dataRows);
      worksheet['!merges'] = merges;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Điểm Danh Đội');
      XLSX.writeFile(workbook, `Diem_Danh_Doi_${selectedProject}.xlsx`);
    } catch (err) {
      console.error('Lỗi khi xuất Excel:', err);
      openGlobalAlert('Không thể xuất file Excel!');
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

        {/* Main Content Container */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" id="print-attendance">
          <div className="space-y-4">
            {/* Action Toolbar */}
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
            {showChart && chartData.length > 0 && (
              <div className="mb-6 p-5 border border-slate-200 rounded-2xl bg-slate-50/50 print:hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                      Biểu Đồ Tổng Số Công Nhân {chartViewMode === 'day' ? 'Theo Ngày' : (chartViewMode === 'week' ? 'Theo Tuần' : 'Theo Tháng')}
                    </h3>
                  </div>

                  {/* Chart View Mode Selector Buttons */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setChartViewMode('day')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        chartViewMode === 'day' 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Theo Ngày
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartViewMode('week')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        chartViewMode === 'week' 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Theo Tuần
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartViewMode('month')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        chartViewMode === 'month' 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Theo Tháng
                    </button>
                  </div>
                </div>

                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 10 }}>
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

            {/* Attendance Table with 2 sub-columns per team: Số CN | Vị trí thi công */}
            <div id="print-section" className="overflow-hidden rounded-lg border border-slate-800 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table id="attendance-table" className="w-full border-collapse border border-slate-800 text-center text-sm">
                  <thead>
                    {/* Row 1: NGÀY (rowSpan=2) & Colored Team Name Headers (colSpan=2) */}
                    <tr>
                      <th rowSpan={2} className="border border-slate-800 bg-white px-2 py-2 font-bold text-slate-900 w-[110px] min-w-[110px] text-center leading-tight">
                        NGÀY<br/>
                        <span className="text-[10px] opacity-80 font-medium">(DD/MM/YYYY)</span>
                      </th>

                      {teamItems.map((item, index) => {
                        const isInactive = item.isInactive;
                        const colorClass = isInactive 
                          ? 'bg-slate-500 text-white' 
                          : headerColors[index % headerColors.length];
                          
                        return (
                          <th key={item.id} colSpan={2} className={`border border-slate-800 p-0 ${colorClass.split(' ')[0]}`}>
                            <div 
                              onClick={() => handleTeamHeaderClick(item)}
                              className={`w-full h-full min-w-[180px] p-2 text-center font-bold uppercase text-xs tracking-wide min-h-[38px] flex flex-col items-center justify-center relative group ${colorClass.split(' ')[1]} cursor-pointer hover:brightness-95`}
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

                    {/* Row 2: Sub-headers (Số CN | Vị trí thi công) - Equal Width (120px each) */}
                    <tr className="bg-slate-100 text-slate-800 text-[11px] font-bold uppercase tracking-wider">
                      {teamItems.map((item) => (
                        <React.Fragment key={`sub-${item.id}`}>
                          <th className="border border-slate-800 py-1.5 px-2 w-[120px] min-w-[120px] max-w-[120px] bg-slate-100 text-slate-800 text-center">
                            Số CN
                          </th>
                          <th className="border border-slate-800 py-1.5 px-2 w-[120px] min-w-[120px] max-w-[120px] bg-indigo-50/50 text-indigo-900 font-bold text-center">
                            Vị trí thi công
                          </th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={teamItems.length * 2 + 1} className="py-12 text-slate-400 font-semibold text-xs text-center">
                          Chưa có dữ liệu điểm danh (hoặc không có dữ liệu trong khoảng ngày lọc). Bấm <strong className="text-emerald-600">"+ Thêm dòng"</strong> để bắt đầu.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row, rIdx) => {
                        const d = parseDate(row.date);
                        const isSunday = d && d.getDay() === 0;

                        return (
                          <tr key={row.id || rIdx} className="hover:bg-slate-50 transition">
                            {/* Left Column: Date */}
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

                            {/* Team Attendance Headcount & Location Note Cells (Equal 120px width each) */}
                            {teamItems.map((item) => {
                              const rawVal = row.values?.[item.id];
                              const val = rawVal ?? '';
                              const note = row.notes?.[item.id] || '';
                              const isZero = parseNumber(rawVal) === 0;
                              const isInactive = item.isInactive;

                              return (
                                <React.Fragment key={`cell-${item.id}`}>
                                  {/* Cell 1: Worker Count (120px) */}
                                  <td 
                                    onContextMenu={(e) => handleCellContextMenu(e, row, item, 'count')}
                                    onClick={() => handleCellClick(row, item, 'count')}
                                    className={`border border-slate-800 p-1.5 text-center transition w-[120px] min-w-[120px] max-w-[120px] ${
                                      isInactive 
                                        ? 'bg-slate-200 cursor-not-allowed opacity-90' 
                                        : (copiedAttendanceData !== null ? 'bg-indigo-50/50 hover:ring-2 hover:ring-indigo-500 cursor-crosshair' : 'bg-white cursor-pointer hover:bg-amber-50')
                                    }`}
                                    title={isInactive ? 'Đội đã nghỉ làm' : (copiedAttendanceData !== null ? 'Click để dán Số CN' : 'Click để sửa / Chuột phải để Copy Số CN')}
                                  >
                                    <div className={`w-full text-center bg-transparent font-extrabold text-sm py-0.5 select-none ${
                                      isInactive ? 'text-slate-500' : (isZero ? 'text-slate-300' : 'text-slate-900')
                                    }`}>
                                      {val || 0}
                                    </div>
                                  </td>

                                  {/* Cell 2: Work Location Note (120px) */}
                                  <td 
                                    onContextMenu={(e) => handleCellContextMenu(e, row, item, 'note')}
                                    onClick={() => handleCellClick(row, item, 'note')}
                                    className={`border border-slate-800 p-1.5 text-center transition w-[120px] min-w-[120px] max-w-[120px] ${
                                      isInactive 
                                        ? 'bg-slate-200 cursor-not-allowed opacity-90' 
                                        : (copiedAttendanceData !== null ? 'bg-indigo-50/50 hover:ring-2 hover:ring-indigo-500 cursor-crosshair' : 'bg-indigo-50/20 cursor-pointer hover:bg-amber-50')
                                    }`}
                                    title={isInactive ? 'Đội đã nghỉ làm' : (copiedAttendanceData !== null ? 'Click để dán Vị trí' : (note ? `Vị trí: ${note}` : 'Click để nhập vị trí / Chuột phải để Copy Vị trí'))}
                                  >
                                    {note ? (
                                      <span className="text-xs font-bold text-indigo-700 select-none break-words whitespace-normal block text-left">
                                        📍 {note}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300 italic text-[11px] select-none">-</span>
                                    )}
                                  </td>
                                </React.Fragment>
                              );
                            })}
                          </tr>
                        );
                      })
                    )}

                    {/* Single Summary Row: TỔNG */}
                    <tr className="bg-[#fffaf0] font-black text-slate-900 border-t-2 border-slate-800">
                      <td className="border border-slate-800 p-2.5 font-extrabold text-xs text-amber-900 text-center uppercase tracking-wider">
                        TỔNG
                      </td>
                      {teamItems.map((item) => (
                        <React.Fragment key={`tot-${item.id}`}>
                          <td className="border border-slate-800 p-2 text-center text-indigo-700 font-black text-sm w-[120px] min-w-[120px] max-w-[120px]">
                            {columnTotals[item.id] || 0}
                          </td>
                          <td className="border border-slate-800 p-2 text-center text-slate-400 font-bold text-xs w-[120px] min-w-[120px] max-w-[120px]">
                            -
                          </td>
                        </React.Fragment>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Nhập Quân Số & Vị Trí Thi Công */}
      {attendanceModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 w-full max-w-md animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Điểm Danh & Vị Trí Thi Công</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đội: <strong className="text-indigo-700">{attendanceModal.teamName}</strong> &bull; Ngày: <strong className="text-slate-700">{attendanceModal.dateStr}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Quân số (Số người) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={attendanceModal.count}
                  onChange={(e) => setAttendanceModal(prev => ({ ...prev, count: e.target.value }))}
                  placeholder="Nhập số lượng công nhân (VD: 8)..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Vị trí thi công / Ghi chú
                </label>
                <input
                  type="text"
                  value={attendanceModal.note}
                  onChange={(e) => setAttendanceModal(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Nhập vị trí thi công (VD: Tầng 3 Block A)..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveAttendanceModal();
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAttendanceModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveAttendanceModal}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition active:scale-95"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Context Menu Popup on Right-Click */}
      {contextMenu && (
        <div 
          className="fixed z-50 bg-white border border-slate-200 shadow-2xl rounded-2xl py-1.5 w-60 text-xs overflow-hidden animate-in fade-in zoom-in duration-100"
          style={{ 
            top: Math.min(contextMenu.y, window.innerHeight - 200), 
            left: Math.min(contextMenu.x, window.innerWidth - 250) 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 font-extrabold text-slate-800 flex items-center justify-between">
            <span className="truncate max-w-[120px]">{contextMenu.teamName}</span>
            <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
              {contextMenu.field === 'count' ? 'Số CN' : 'Vị trí thi công'}
            </span>
          </div>

          <button 
            type="button"
            className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 text-indigo-700 font-bold flex items-center gap-2 transition"
            onClick={() => {
              setCopiedAttendanceData({ field: contextMenu.field, val: contextMenu.val });
              setContextMenu(null);
            }}
          >
            <Copy className="w-4 h-4 text-indigo-600" />
            <span>Sao chép ô này ({contextMenu.field === 'count' ? (contextMenu.val || 0) : (contextMenu.val ? `📍 ${contextMenu.val}` : 'Trống')})</span>
          </button>

          {copiedAttendanceData && (
            <button 
              type="button"
              className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-emerald-700 font-bold flex items-center gap-2 border-t border-slate-100 transition"
              onClick={() => {
                const targetCount = copiedAttendanceData.field === 'count' ? copiedAttendanceData.val : undefined;
                const targetNote = copiedAttendanceData.field === 'note' ? copiedAttendanceData.val : undefined;
                updateAttendanceCell(selectedProject, contextMenu.rowId, contextMenu.teamId, targetCount, targetNote);
                setContextMenu(null);
              }}
            >
              <ClipboardPaste className="w-4 h-4 text-emerald-600" />
              <span>Dán vào ô này</span>
            </button>
          )}

          <button 
            type="button"
            className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 text-indigo-700 font-semibold flex items-center gap-2 border-t border-slate-100 transition"
            onClick={() => {
              const targetIdx = filteredRows.findIndex(r => r.id === contextMenu.rowId);
              if (targetIdx !== -1) {
                const targetCount = contextMenu.field === 'count' ? contextMenu.val : undefined;
                const targetNote = contextMenu.field === 'note' ? contextMenu.val : undefined;
                for (let i = targetIdx; i < filteredRows.length; i++) {
                  updateAttendanceCell(selectedProject, filteredRows[i].id, contextMenu.teamId, targetCount, targetNote);
                }
              }
              setContextMenu(null);
            }}
          >
            <ArrowDown className="w-4 h-4 text-indigo-600" />
            <span>Sao chép xuống tất cả dòng dưới</span>
          </button>

          <button 
            type="button"
            className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-600 font-medium flex items-center gap-2 border-t border-slate-100 transition"
            onClick={() => {
              const targetCount = contextMenu.field === 'count' ? '' : undefined;
              const targetNote = contextMenu.field === 'note' ? '' : undefined;
              updateAttendanceCell(selectedProject, contextMenu.rowId, contextMenu.teamId, targetCount, targetNote);
              setContextMenu(null);
            }}
          >
            <Eraser className="w-3.5 h-3.5 text-red-500" />
            <span>Xóa dữ liệu ô này</span>
          </button>
        </div>
      )}

      {/* Floating Banner for Quick-Paste Mode */}
      {copiedAttendanceData !== null && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 border border-slate-700">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Đang bật dán nhanh:</span>
            <span className="bg-slate-800 text-indigo-300 px-2.5 py-0.5 rounded border border-slate-700 font-extrabold">
              {copiedAttendanceData.field === 'count' 
                ? `${copiedAttendanceData.val || 0} CN (Số CN)` 
                : `📍 ${copiedAttendanceData.val || 'Trống'} (Vị trí)`
              }
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">&bull; Click ô tương ứng để dán</span>
          <button 
            onClick={() => setCopiedAttendanceData(null)}
            className="ml-2 bg-slate-800 hover:bg-slate-700 text-slate-300 p-1 rounded-full transition"
            title="Tắt chế độ dán nhanh"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
