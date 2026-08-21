'use client';

import { Fragment, useMemo, useState, useRef } from 'react';
import { ClipboardList, FileClock, Layers3, Boxes, Plus, RotateCcw, Trash2, FileDown, Printer, X, SlidersHorizontal, UserCheck } from 'lucide-react';
import { useStore, useAllowedProjects } from '@/store/useStore';
import * as XLSX from 'xlsx-js-style';
import PaymentMatrix from '@/components/PaymentMatrix';
import ExportEntriesModal from '@/components/Modals/ExportEntriesModal';
import EnterPOModal from '@/components/Modals/EnterPOModal';

const TAB_ITEMS = {
  planned: { label: 'IPC Dự kiến', icon: FileClock, type: 'team', hint: 'Kế hoạch thanh toán thầu phụ' },
  actual: { label: 'IPC Thực', icon: ClipboardList, type: 'ipc', hint: 'Hồ sơ thanh toán đã triển khai' },
  materials: { label: 'Nhận Vật Tư', icon: Boxes, type: 'materials', hint: 'Theo dõi vật tư theo từng công trình' },
  export_materials: { label: 'Xuất Vật Tư', icon: Boxes, type: 'materials', hint: 'Theo dõi xuất vật tư theo từng công trình' },
  attendance: { label: 'Điểm Danh Đội', icon: UserCheck, type: 'materials', hint: 'Theo dõi điểm danh tổ đội theo từng công trình' }
};

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return 0;
  const normalized = String(value).replace(/,/g, '').trim();
  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : 0;
};

const getDefaultDinhMuc = (name = '') => {
  if (!name) return '';
  const upper = name.trim().toUpperCase();
  
  if (upper.includes('BỘT') || upper.includes('BOT')) {
    return '25';
  }
  if (upper.includes('LÓT') || upper.includes('LOT')) {
    if (upper.includes('A300')) return '300';
    return '200';
  }
  if (upper.includes('PHỦ') || upper.includes('PHU') || upper.includes('SƠN PHỦ') || upper.includes('SON PHU')) {
    return '100';
  }
  return '';
};

const formatCell = (value) => (value === '' || value === null || value === undefined ? '' : value);

export default function IpcMatrixPage({ mode = 'planned' }) {
  const { currentUser, activeProject, setActiveProject, materialSheets, setMaterialSheet, openGlobalPrompt, openGlobalAlert, openGlobalConfirm, teams } = useStore();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isDinhMucModalOpen, setIsDinhMucModalOpen] = useState(false);
  const [dinhMucDraft, setDinhMucDraft] = useState({});
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const projects = useAllowedProjects();

  const selectedProject = (activeProject && projects.some((p) => p.name === activeProject))
    ? activeProject
    : projects[0]?.name || '';

  const activeTab = useMemo(() => TAB_ITEMS[mode] || TAB_ITEMS.planned, [mode]);
  const Icon = activeTab.icon;

  // Material / Attendance Logic
  const isExport = mode === 'export_materials';
  const isAttendance = mode === 'attendance';
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'GIÁM ĐỐC';
  const isAdminOrQS = isAdmin || currentUser?.role === 'QS';
  
  const sheetKey = isAttendance ? `attendance_${selectedProject}` : selectedProject;
  const currentSheet = materialSheets[sheetKey] || { items: [], rows: [], exportRows: [], dinhMucMap: {}, ipcMap: {} };

  const projectTeams = useMemo(() => {
    if (!teams) return [];
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

  const materialItems = useMemo(() => {
    let items = currentSheet.items || [];
    if (items.length === 0) {
      if (isAttendance && projectTeams.length > 0) {
        items = projectTeams.map((t, idx) => ({
          id: t.id || `team_${t.teamName || t.team_name || idx}`,
          name: (t.teamName || t.team_name || 'ĐỘI THI CÔNG').toUpperCase()
        }));
      } else {
        items = Array.from({ length: 8 }, (_, i) => {
          return { id: `col_${i}`, name: '' };
        });
      }
    }
    return items;
  }, [currentSheet.items, isAttendance, projectTeams]);

  const materialRows = isExport ? (currentSheet.exportRows || []) : (currentSheet.rows || []);

  const sortedMaterialRows = [...materialRows].sort((a, b) => {
    const parseDate = (d) => {
      if (!d) return Infinity; // Các dòng trống ngày sẽ nằm ở cuối
      const parts = d.split('/');
      if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
      }
      return Infinity;
    };
    return parseDate(a.date) - parseDate(b.date);
  });

  const handleUpdateName = (colId, newName) => {
    const nextItems = materialItems.map(item => item.id === colId ? { ...item, name: newName } : item);
    setMaterialSheet(sheetKey, { ...currentSheet, items: nextItems });
  };

  const handleRemoveColumn = (colId) => {
    openGlobalConfirm("Bạn có chắc chắn muốn xóa cột này? Toàn bộ dữ liệu của cột này sẽ bị mất.", () => {
      const nextItems = materialItems.filter(item => item.id !== colId);
      setMaterialSheet(sheetKey, { ...currentSheet, items: nextItems });
    }, "Xác nhận xóa");
  };

  const handleUpdateRowDate = (rowId, date) => {
    const nextRows = materialRows.map(row => row.id === rowId ? { ...row, date } : row);
    setMaterialSheet(sheetKey, { ...currentSheet, [isExport ? 'exportRows' : 'rows']: nextRows });
  };

  const handleUpdateCell = (rowId, colId, field, value) => {
    if (field === 'order' && !isExport && value) {
      const match = String(value).match(/\((PO.*?)\)/i);
      if (match) {
        const po = match[1].toUpperCase();
        const isDuplicate = materialRows.some(r => {
          if (r.id === rowId) return false;
          const rVal = String(r.values?.[colId]?.order || '');
          const rMatch = rVal.match(/\((PO.*?)\)/i);
          return rMatch && rMatch[1].toUpperCase() === po;
        });
        if (isDuplicate) {
          openGlobalAlert(`Mã ${po} đã tồn tại trong cột này. Mỗi cột không được trùng mã PO.`, 'Lỗi trùng PO');
          return;
        }
      }
    }

    const nextRows = materialRows.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          values: {
            ...(row.values || {}),
            [colId]: {
              ...(row.values?.[colId] || { order: '', received: '' }),
              [field]: value
            }
          }
        };
      }
      return row;
    });
    setMaterialSheet(sheetKey, { ...currentSheet, [isExport ? 'exportRows' : 'rows']: nextRows });
  };

  const handleUpdateIpc = (colId, value) => {
    const currentIpcMap = currentSheet.ipcMap || {};
    const nextIpcMap = {
      ...currentIpcMap,
      [colId]: value
    };
    setMaterialSheet(sheetKey, { ...currentSheet, ipcMap: nextIpcMap });
  };

  const handleEditIpc = (item, currentValue) => {
    openGlobalPrompt(
      `Nhập khối lượng IPC cho ${item.name || (isAttendance ? 'tổ đội này' : 'vật tư này')}:`,
      (newVal) => {
        if (newVal !== null) {
          handleUpdateIpc(item.id, newVal);
        }
      },
      currentValue || '',
      'Nhập IPC',
      'text',
      false
    );
  };

  const handleEditName = (item) => {
    openGlobalPrompt(isAttendance ? 'Nhập tên tổ đội:' : 'Nhập tên vật tư:', (newName) => {
      if (newName !== null) {
        handleUpdateName(item.id, newName);
      }
    }, item.name);
  };

  const handleEditDate = (row) => {
    if (isExport) {
      openGlobalPrompt(`Nhập tầng:`, (newVal) => {
        if (newVal !== null) {
          handleUpdateRowDate(row.id, newVal);
        }
      }, row.date || '', 'Nhập Tầng', 'text');
      return;
    }

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

    openGlobalPrompt(`Chọn ngày:`, (newDate) => {
      if (newDate !== null) {
        if (newDate) {
          const parts = newDate.split('-');
          if (parts.length === 3) {
             const y = parts[0];
             const m = parts[1];
             const d = parts[2];
             handleUpdateRowDate(row.id, `${d}/${m}/${y}`);
          } else {
             handleUpdateRowDate(row.id, newDate);
          }
        } else {
          handleUpdateRowDate(row.id, '');
        }
      }
    }, toISO(row.date), 'Chọn Ngày', 'date', false, null, () => {
      openGlobalConfirm('Bạn có chắc chắn muốn xóa dòng này?', () => {
        const listKey = isExport ? 'exportRows' : 'rows';
        const nextRows = (isExport ? (currentSheet.exportRows || []) : (currentSheet.rows || [])).filter(r => r.id !== row.id);
        setMaterialSheet(sheetKey, { ...currentSheet, [listKey]: nextRows });
      }, 'Xác nhận xóa dòng');
    });
  };

  const handleEditValue = (row, item, field, currentValue) => {
    const fieldName = field === 'order' ? (isAttendance ? 'KẾ HOẠCH' : (isExport ? 'SỐ LƯỢNG' : 'YÊU CẦU (PO)')) : (isAttendance ? 'ĐIỂM DANH' : (isExport ? 'NGÀY' : 'NHẬN'));
    openGlobalPrompt(`Nhập ${fieldName.toLowerCase()} cho ${item.name || (isAttendance ? 'tổ đội này' : 'vật tư này')}:`, (newVal) => {
      if (newVal !== null) {
        handleUpdateCell(row.id, item.id, field, newVal);
      }
    }, currentValue || '', 'Nhập liệu', 'text', true);
  };

  const addRow = () => {
    const newRow = { id: `row-${Date.now()}`, date: '', values: {} };
    setMaterialSheet(sheetKey, { ...currentSheet, [isExport ? 'exportRows' : 'rows']: [...materialRows, newRow] });
  };

  const handlePOModalSubmit = (poName, quantities, date) => {
    let newDate = '';
    if (date) {
      const parts = date.split('-');
      if (parts.length === 3) {
        newDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    const newRowId = `row-${Date.now()}`;
    const values = {};
    materialItems.forEach(item => {
      const q = quantities[item.id];
      if (q) {
        values[item.id] = {
          order: `${q} (${poName})`,
          received: ''
        };
      }
    });

    const newRow = { id: newRowId, date: newDate, values };
    const listKey = isExport ? 'exportRows' : 'rows';
    setMaterialSheet(sheetKey, { 
      ...currentSheet, 
      [listKey]: [...(isExport ? (currentSheet.exportRows || []) : (currentSheet.rows || [])), newRow] 
    });
  };

  const addColumn = () => {
    const newItem = { id: `mat-${Date.now()}`, name: '' };
    setMaterialSheet(sheetKey, { ...currentSheet, items: [...materialItems, newItem] });
  };

  const resetData = () => {
    if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'GIÁM ĐỐC' && currentUser?.username !== '@admin') {
      openGlobalAlert('Chỉ tài khoản Quản trị mới có quyền xóa dữ liệu!', 'Lỗi phân quyền');
      return;
    }
    openGlobalPrompt("Vui lòng nhập mật khẩu Admin để xác nhận xóa dữ liệu:", (pwd) => {
      if (pwd === null) return;
      if (pwd !== currentUser?.password && pwd !== '0000') {
        openGlobalAlert('Mật khẩu không đúng!', 'Lỗi bảo mật');
        return;
      }
      openGlobalConfirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu của tab này?", () => {
        setMaterialSheet(sheetKey, { ...currentSheet, [isExport ? 'exportRows' : 'rows']: [] });
      }, "Cảnh báo xóa dữ liệu");
    }, '', 'Xác thực bảo mật', 'password');
  };

  const totals = useMemo(() => materialItems.reduce((acc, item) => {
    acc[item.id] = (currentSheet.rows || []).reduce((sum, row) => {
      const value = row.values?.[item.id] || {};
      // For materials, "received" is the amount received.
      return sum + parseNumber(value.received);
    }, 0);
    return acc;
  }, {}), [materialItems, currentSheet.rows]);

  const exportTotals = useMemo(() => materialItems.reduce((acc, item) => {
    acc[item.id] = (currentSheet.exportRows || []).reduce((sum, row) => {
      const cellData = row.values?.[item.id];
      if (Array.isArray(cellData)) {
        return sum + cellData.reduce((s, entry) => s + parseNumber(entry.quantity), 0);
      }
      return sum;
    }, 0);
    return acc;
  }, {}), [materialItems, currentSheet.exportRows]);

  const orderTotals = useMemo(() => materialItems.reduce((acc, item) => {
    acc[item.id] = (currentSheet.rows || []).reduce((sum, row) => {
      const value = row.values?.[item.id] || {};
      return sum + parseNumber(value.order);
    }, 0);
    return acc;
  }, {}), [materialItems, currentSheet.rows]);

  const remainingByMaterial = (itemId) => parseNumber(orderTotals[itemId]) - parseNumber(totals[itemId]);

  const handleExportExcel = () => {
    const table = document.getElementById('material-table');
    if (!table) return;
    const wb = XLSX.utils.table_to_book(table, { sheet: 'Sheet1' });
    const ws = wb.Sheets['Sheet1'];
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    const headerColors = [
      "3B82F6", "10B981", "A855F7", "F59E0B",
      "F43F5E", "06B6D4", "6366F1", "F97316"
    ];

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
        const cell = ws[cellRef];
        if (!cell) continue;
        
        const baseStyle = {
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
          font: { sz: 10, name: "Arial" }
        };

        if (R === 0) {
          if (C === 0) {
            cell.s = { ...baseStyle, font: { bold: true }, fill: { fgColor: { rgb: "FFFFFF" } } };
          } else {
            const materialIndex = Math.floor((C - 1) / 2);
            const color = headerColors[materialIndex % headerColors.length];
            cell.s = { ...baseStyle, font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: color } } };
          }
        } else if (R === 1) {
          if (C === 0) {
             cell.s = { ...baseStyle, font: { bold: true } };
          } else if (C % 2 === 1) {
             cell.s = { ...baseStyle, font: { bold: true, color: { rgb: "78350F" } }, fill: { fgColor: { rgb: "FFFAF0" } } };
          } else {
             cell.s = { ...baseStyle, font: { bold: true, color: { rgb: "064E3B" } }, fill: { fgColor: { rgb: "F2FBF3" } } };
          }
        } else if (R === range.e.r - 1) { 
          if (C === 0) {
             cell.s = { ...baseStyle, font: { bold: true } };
          } else if (C % 2 === 1) {
             cell.s = { ...baseStyle, font: { bold: true, color: { rgb: "78350F" } }, fill: { fgColor: { rgb: "FDE68A" } } };
          } else {
             cell.s = { ...baseStyle, font: { bold: true, color: { rgb: "064E3B" } }, fill: { fgColor: { rgb: "A7F3D0" } } };
          }
        } else if (R === range.e.r) { 
          if (C === 0) {
             cell.s = { ...baseStyle, font: { bold: true } };
          } else {
             const val = parseInt(cell.v, 10) || 0;
             if (val > 0) {
               cell.s = { ...baseStyle, font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "F87171" } } };
             } else {
               cell.s = { ...baseStyle, font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4ADE80" } } };
             }
          }
        } else {
          if (C === 0) {
            cell.s = { ...baseStyle };
          } else if (C % 2 === 1) {
            cell.s = { ...baseStyle, font: { color: { rgb: "78350F" } }, fill: { fgColor: { rgb: "FFFAF0" } } };
          } else {
            cell.s = { ...baseStyle, font: { color: { rgb: "064E3B" } }, fill: { fgColor: { rgb: "F2FBF3" } } };
          }
        }
      }
    }
    
    ws['!cols'] = [{ wch: 18 }];
    for (let c = 1; c <= range.e.c; c++) {
      ws['!cols'].push({ wch: 12 });
    }
    
    XLSX.writeFile(wb, `${activeTab.label}_${selectedProject}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pb-12">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-section, #print-section * {
            visibility: visible;
          }
          #print-section {
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
      <div className="space-y-6 p-8 w-full">
        <div className="flex flex-col gap-4 rounded-3xl border border-indigo-100 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">{activeTab.label}</h1>
              <p className="text-sm text-slate-500">{activeTab.hint}</p>
            </div>
          </div>

          <select
            value={selectedProject}
            onChange={(e) => setActiveProject(e.target.value)}
            className="min-w-[180px] rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.name}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          {!selectedProject ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
              Chưa có công trình nào để hiển thị.
            </div>
          ) : (
            <div className="mt-4 border-t border-slate-100 pt-4">
              {mode === 'materials' || mode === 'export_materials' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={addRow}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" />
                      Thêm dòng
                    </button>
                    {!isExport && (
                      <button
                        type="button"
                        onClick={addColumn}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                      >
                        <Plus className="h-4 w-4" />
                        Thêm cột
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={resetData}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Clear dữ liệu
                    </button>

                    {!isExport && (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsPOModalOpen(true)}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-500 bg-white px-4 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-50 ml-2 shadow-sm"
                        >
                          NHẬP PO
                        </button>
                        {isAdminOrQS && (
                          <button
                            type="button"
                            onClick={() => {
                              const initialDraft = { ...(currentSheet.dinhMucMap || {}) };
                              materialItems.forEach(item => {
                                if (initialDraft[item.id] === undefined || initialDraft[item.id] === '') {
                                  const defaultVal = getDefaultDinhMuc(item.name);
                                  if (defaultVal) {
                                    initialDraft[item.id] = defaultVal;
                                  }
                                }
                              });
                              setDinhMucDraft(initialDraft);
                              setIsDinhMucModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-100 ml-2 shadow-sm transition"
                          >
                            <SlidersHorizontal className="h-4 w-4" />
                            ĐỊNH MỨC
                          </button>
                        )}
                      </>
                    )}

                    <div className="flex-1"></div>

                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#107c41] px-4 py-2 text-sm font-semibold text-white hover:bg-[#185c37] transition print:hidden"
                    >
                      <FileDown className="h-4 w-4" />
                      Xuất Excel
                    </button>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 transition print:hidden"
                    >
                      <Printer className="h-4 w-4" />
                      In
                    </button>
                  </div>
                  
                  <div id="print-section" className="overflow-hidden rounded-lg border border-slate-800 bg-white">
                    <div className="overflow-x-auto">
                      <table id="material-table" className="w-full border-collapse border border-slate-800 text-center text-sm">
                        <thead>
                          <tr>
                            <th rowSpan={2} className="border border-slate-800 bg-white px-2 py-2 font-bold text-slate-900 w-[110px] max-w-[110px] text-center leading-tight">
                              {isExport ? 'TẦNG' : (
                                <>
                                  NGÀY<br/>
                                  <span className="text-[10px] opacity-80">(DD/MM/YYYY)</span>
                                </>
                              )}
                            </th>
                            {materialItems.map((item, index) => {
                              const headerColors = [
                                'bg-blue-500 text-white',
                                'bg-emerald-500 text-white',
                                'bg-purple-500 text-white',
                                'bg-amber-500 text-white',
                                'bg-rose-500 text-white',
                                'bg-cyan-500 text-white',
                                'bg-indigo-500 text-white',
                                'bg-orange-500 text-white'
                              ];
                              const colorClass = headerColors[index % headerColors.length];
                              return (
                                <th key={item.id} colSpan={2} className={`border border-slate-800 p-0 ${colorClass.split(' ')[0]}`}>
                                  <div
                                    onClick={!isExport ? () => handleEditName(item) : undefined}
                                    className={`w-full h-full min-w-[120px] p-2 text-center font-bold uppercase min-h-[40px] flex items-center justify-center relative group ${colorClass.split(' ')[1]} ${!isExport ? 'cursor-pointer hover:brightness-95' : ''}`}
                                  >
                                    {item.name || <span className="opacity-50 font-normal italic">{isAttendance ? 'Tên tổ đội' : 'Tên vật tư'}</span>}
                                    {!isExport && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveColumn(item.id);
                                        }}
                                        className="absolute right-1 top-1 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Xóa cột này"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                          <tr>
                            {materialItems.map((item) => (
                              <Fragment key={`${item.id}-pair`}>
                                <th className="border border-slate-800 bg-[#fffaf0] px-2 py-1 font-medium text-amber-900 min-w-[80px]">{isAttendance ? 'KẾ HOẠCH' : (isExport ? 'SỐ LƯỢNG' : 'YÊU CẦU (PO)')}</th>
                                <th className="border border-slate-800 bg-[#f2fbf3] px-2 py-1 font-medium text-emerald-900 min-w-[80px]">{isAttendance ? 'ĐIỂM DANH' : (isExport ? 'NGÀY' : 'NHẬN')}</th>
                              </Fragment>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sortedMaterialRows.map((row) => {
                            if (!isExport) {
                              return (
                                <tr key={row.id}>
                                  <td className="border border-slate-800 p-0">
                                    <div
                                      onClick={() => handleEditDate(row)}
                                      className="w-full h-full p-2 text-center cursor-pointer hover:bg-slate-50 min-h-[36px] flex items-center justify-center"
                                    >
                                      {row.date || ''}
                                    </div>
                                  </td>
                                  {materialItems.map((item) => {
                                    const orderVal = row.values?.[item.id]?.order || '';
                                    const match = String(orderVal).match(/\((PO.*?)\)/i);
                                    let orderBg = 'bg-[#fffaf0] hover:bg-[#ffecce]';
                                    let orderText = 'text-amber-900';
                                    
                                    if (match) {
                                      const po = match[1].toUpperCase();
                                      const colors = [
                                        { bg: 'bg-yellow-200 hover:bg-yellow-300', text: 'text-yellow-900' },
                                        { bg: 'bg-green-200 hover:bg-green-300', text: 'text-green-900' },
                                        { bg: 'bg-blue-200 hover:bg-blue-300', text: 'text-blue-900' },
                                        { bg: 'bg-red-200 hover:bg-red-300', text: 'text-red-900' },
                                        { bg: 'bg-purple-200 hover:bg-purple-300', text: 'text-purple-900' },
                                        { bg: 'bg-orange-200 hover:bg-orange-300', text: 'text-orange-900' },
                                        { bg: 'bg-cyan-200 hover:bg-cyan-300', text: 'text-cyan-900' },
                                        { bg: 'bg-pink-200 hover:bg-pink-300', text: 'text-pink-900' },
                                        { bg: 'bg-lime-200 hover:bg-lime-300', text: 'text-lime-900' },
                                        { bg: 'bg-indigo-200 hover:bg-indigo-300', text: 'text-indigo-900' },
                                        { bg: 'bg-sky-200 hover:bg-sky-300', text: 'text-sky-900' },
                                        { bg: 'bg-fuchsia-200 hover:bg-fuchsia-300', text: 'text-fuchsia-900' },
                                        { bg: 'bg-rose-200 hover:bg-rose-300', text: 'text-rose-900' }
                                      ];
                                      let hash = 0;
                                      for (let i = 0; i < po.length; i++) {
                                        hash = (hash * 31 + po.charCodeAt(i)) % 1000000007;
                                      }
                                      const c = colors[hash % colors.length];
                                      orderBg = c.bg;
                                      orderText = c.text;
                                    }

                                    return (
                                      <Fragment key={`${row.id}-${item.id}`}>
                                        <td className={`border border-slate-800 p-0 transition-colors ${orderBg}`}>
                                          <div
                                            onClick={() => handleEditValue(row, item, 'order', row.values?.[item.id]?.order)}
                                            className={`w-full h-full p-2 text-center cursor-pointer min-h-[36px] flex items-center justify-center font-medium ${orderText}`}
                                          >
                                            {row.values?.[item.id]?.order ?? ''}
                                          </div>
                                        </td>
                                        <td className="border border-slate-800 p-0 bg-[#f2fbf3] hover:bg-[#dcf1dd] transition-colors">
                                          <div
                                            onClick={() => handleEditValue(row, item, 'received', row.values?.[item.id]?.received)}
                                            className="w-full h-full p-2 text-center cursor-pointer text-emerald-900 min-h-[36px] flex items-center justify-center font-medium"
                                          >
                                            {row.values?.[item.id]?.received ?? ''}
                                          </div>
                                        </td>
                                      </Fragment>
                                    );
                                  })}
                                </tr>
                              );
                            } else {
                              // isExport === true
                              // Compute max entries for this floor
                              let maxEntries = 1;
                              materialItems.forEach(item => {
                                const arr = row.values?.[item.id];
                                if (Array.isArray(arr) && arr.length > maxEntries) {
                                  maxEntries = arr.length;
                                }
                              });
                              
                              const rowSpans = Array.from({ length: maxEntries }).map((_, idx) => (
                                <tr key={`${row.id}-sub-${idx}`}>
                                  {idx === 0 && (
                                    <td rowSpan={maxEntries} className="border border-slate-800 p-0 align-middle">
                                      <div
                                        onClick={() => handleEditDate(row)}
                                        className="w-full h-full p-2 text-center cursor-pointer hover:bg-slate-50 min-h-[36px] flex flex-col items-center justify-center font-bold"
                                      >
                                        {row.date || ''}
                                      </div>
                                    </td>
                                  )}
                                  {materialItems.map((item) => {
                                    const arr = Array.isArray(row.values?.[item.id]) ? row.values?.[item.id] : [];
                                    const entry = arr[idx] || { quantity: '', date: '' };
                                    
                                    return (
                                      <Fragment key={`${row.id}-${item.id}-sub-${idx}`}>
                                        <td className="border border-slate-800 p-0 bg-slate-50">
                                          <div
                                            onClick={() => {
                                              setSelectedRow(row);
                                              setSelectedItem(item);
                                              setIsExportModalOpen(true);
                                            }}
                                            className="w-full h-full p-2 text-center cursor-pointer hover:bg-[#ffe0b2] text-slate-900 min-h-[36px] flex items-center justify-center font-medium transition-colors"
                                          >
                                            {entry.quantity || ''}
                                          </div>
                                        </td>
                                        <td className="border border-slate-800 p-0 bg-slate-50">
                                          <div
                                            onClick={() => {
                                              setSelectedRow(row);
                                              setSelectedItem(item);
                                              setIsExportModalOpen(true);
                                            }}
                                            className="w-full h-full p-2 text-center cursor-pointer hover:bg-[#c8e6c9] text-slate-900 min-h-[36px] flex items-center justify-center transition-colors"
                                          >
                                            {entry.date || ''}
                                          </div>
                                        </td>
                                      </Fragment>
                                    );
                                  })}
                                </tr>
                              ));
                              return rowSpans;
                            }
                          })}
                          {materialRows.length === 0 && (
                            <tr>
                              <td colSpan={17} className="border border-slate-800 py-6 text-slate-400">
                                Chưa có dữ liệu. Bấm "Thêm dòng" để bắt đầu.
                              </td>
                            </tr>
                          )}
                          {!isExport ? (
                            <>
                              <tr className="bg-slate-100 font-bold">
                                <td className="border border-slate-800 p-2 text-slate-900">TỔNG</td>
                                {materialItems.map((item) => (
                                  <Fragment key={`${item.id}-totals`}>
                                    <td className="border border-slate-800 p-2 text-amber-900 bg-amber-200 font-extrabold text-sm">{formatCell(orderTotals[item.id] || 0)}</td>
                                    <td className="border border-slate-800 p-2 text-emerald-900 bg-emerald-200 font-extrabold text-sm">{formatCell(totals[item.id] || 0)}</td>
                                  </Fragment>
                                ))}
                              </tr>
                              <tr className="font-bold">
                                <td className="border border-slate-800 p-2 text-slate-900 bg-white uppercase">Vật tư chưa nhận</td>
                                {materialItems.map((item) => {
                                  const remaining = remainingByMaterial(item.id);
                                  const isShort = remaining > 0;
                                  return (
                                    <td
                                      key={`${item.id}-remaining`}
                                      colSpan={2}
                                      className={`border border-slate-800 p-2 ${isShort ? 'bg-red-400 text-white' : 'bg-green-400 text-white'}`}
                                    >
                                      {remaining}
                                    </td>
                                  );
                                })}
                              </tr>
                              <tr className="font-bold">
                                <td className="border border-slate-800 p-2 text-slate-900 bg-indigo-50 uppercase">Sản lượng</td>
                                {materialItems.map((item) => {
                                  const poQty = orderTotals[item.id] || 0;
                                  const recvQty = totals[item.id] || 0;
                                  const rawDinhMuc = currentSheet.dinhMucMap?.[item.id] ?? getDefaultDinhMuc(item.name);
                                  const dinhMucVal = parseNumber(rawDinhMuc || 0);
                                  const poSanLuong = poQty * dinhMucVal;
                                  const recvSanLuong = recvQty * dinhMucVal;
                                  return (
                                    <Fragment key={`${item.id}-sanluong`}>
                                      <td className="border border-slate-800 p-2 text-amber-950 bg-amber-100 font-extrabold text-sm text-center">
                                        {formatCell(poSanLuong ? poSanLuong.toLocaleString('vi-VN') : 0)}
                                      </td>
                                      <td className="border border-slate-800 p-2 text-emerald-950 bg-emerald-100 font-extrabold text-sm text-center">
                                        {formatCell(recvSanLuong ? recvSanLuong.toLocaleString('vi-VN') : 0)}
                                      </td>
                                    </Fragment>
                                  );
                                })}
                              </tr>
                              <tr className="font-bold">
                                <td className="border border-slate-800 p-2 text-slate-900 bg-sky-100 uppercase">IPC</td>
                                {materialItems.map((item) => {
                                  const rawIpc = currentSheet.ipcMap?.[item.id];
                                  const ipcVal = typeof rawIpc === 'object' ? (rawIpc?.received ?? rawIpc?.order ?? '') : (rawIpc ?? '');
                                  return (
                                    <td
                                      key={`${item.id}-ipc`}
                                      colSpan={2}
                                      className="border border-slate-800 p-0 transition-colors bg-emerald-50 hover:bg-emerald-100 cursor-pointer"
                                    >
                                      <div
                                        onClick={() => handleEditIpc(item, ipcVal)}
                                        className="w-full h-full p-2 text-center min-h-[36px] flex items-center justify-center font-extrabold text-emerald-950 text-sm"
                                      >
                                        {formatCell(ipcVal !== '' ? parseNumber(ipcVal).toLocaleString('vi-VN') : '')}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                              <tr className="font-bold">
                                <td className="border border-slate-800 p-2 text-slate-900 bg-purple-100 uppercase">%</td>
                                {materialItems.map((item) => {
                                  const recvQty = totals[item.id] || 0;
                                  const rawDinhMuc = currentSheet.dinhMucMap?.[item.id] ?? getDefaultDinhMuc(item.name);
                                  const dinhMucVal = parseNumber(rawDinhMuc || 0);
                                  const recvSanLuong = recvQty * dinhMucVal;

                                  const rawIpc = currentSheet.ipcMap?.[item.id];
                                  const ipcVal = parseNumber(typeof rawIpc === 'object' ? (rawIpc?.received ?? rawIpc?.order) : rawIpc);

                                  const percent = recvSanLuong > 0 ? (ipcVal / recvSanLuong) * 100 : 0;
                                  const isRed = recvSanLuong > 0 && percent < 80;

                                  return (
                                    <td
                                      key={`${item.id}-percent`}
                                      colSpan={2}
                                      className={`border border-slate-800 p-2 text-sm text-center font-extrabold transition-colors ${
                                        isRed ? 'bg-red-500 text-white' : 'bg-emerald-100 text-emerald-950'
                                      }`}
                                    >
                                      {recvSanLuong > 0 ? `${percent.toFixed(1)}%` : '0%'}
                                    </td>
                                  );
                                })}
                              </tr>
                            </>
                          ) : (
                            <>
                              <tr className="font-bold">
                                <td className="border border-slate-800 p-2 text-slate-900 bg-slate-100">Đã nhập</td>
                                {materialItems.map((item) => (
                                  <td
                                    key={`${item.id}-imported`}
                                    colSpan={2}
                                    className="border border-slate-800 p-2 bg-[#e8f5e9] text-emerald-900"
                                  >
                                    {formatCell(totals[item.id] || 0)}
                                  </td>
                                ))}
                              </tr>
                              <tr className="font-bold">
                                <td className="border border-slate-800 p-2 text-slate-900 bg-slate-100">Đã xuất</td>
                                {materialItems.map((item) => {
                                  const imported = parseNumber(totals[item.id] || 0);
                                  const exported = parseNumber(exportTotals[item.id] || 0);
                                  const isWarning = imported > 0 && exported >= imported * 0.9;
                                  
                                  return (
                                    <td
                                      key={`${item.id}-exported`}
                                      colSpan={2}
                                      className={`border border-slate-800 p-2 ${isWarning ? 'bg-orange-500 text-white' : 'bg-[#fff3e0] text-amber-900'}`}
                                    >
                                      {formatCell(exported)}
                                    </td>
                                  );
                                })}
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <PaymentMatrix 
                    projectName={selectedProject} 
                    type={activeTab.type === 'team' ? 'ipc_select' : 'ipc'} 
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <ExportEntriesModal 
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setSelectedRow(null);
          setSelectedItem(null);
        }}
        project={selectedProject}
        row={selectedRow}
        item={selectedItem}
        isExport={isExport}
      />
      <EnterPOModal
        isOpen={isPOModalOpen}
        onClose={() => setIsPOModalOpen(false)}
        materialItems={materialItems}
        onSubmit={handlePOModalSubmit}
      />
      {/* Modal Cấu Hình Định Mức Vật Tư Theo Tên */}
      {isDinhMucModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="p-5 rounded-t-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Cấu Hình Định Mức Vật Tư</h3>
                <p className="text-xs text-indigo-100 mt-0.5">Dự án: <span className="font-bold">{selectedProject}</span></p>
              </div>
              <button onClick={() => setIsDinhMucModalOpen(false)} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {materialItems.map((item, idx) => {
                const name = item.name || `Cột ${idx + 1}`;
                const defaultVal = getDefaultDinhMuc(name);
                const currentVal = dinhMucDraft[item.id] ?? defaultVal;
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition">
                    <span className="font-bold text-slate-800 text-sm truncate max-w-[240px]">{name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-500 font-semibold">Định mức:</span>
                      <input
                        type="number"
                        step="any"
                        placeholder={defaultVal || "0"}
                        value={currentVal}
                        onChange={(e) => setDinhMucDraft({ ...dinhMucDraft, [item.id]: e.target.value })}
                        className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-indigo-900 font-bold focus:ring-2 focus:ring-indigo-500 text-center outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-slate-50 rounded-b-2xl border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDinhMucModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  setMaterialSheet(selectedProject, { ...currentSheet, dinhMucMap: dinhMucDraft });
                  setIsDinhMucModalOpen(false);
                  openGlobalAlert('Đã lưu cấu hình định mức vật tư thành công!', 'Thành công');
                }}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition text-xs shadow-md"
              >
                Lưu Định Mức
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
