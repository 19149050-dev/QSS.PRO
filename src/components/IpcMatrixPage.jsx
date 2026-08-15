'use client';

import { Fragment, useMemo } from 'react';
import { ClipboardList, FileClock, Layers3, Boxes, Plus, RotateCcw } from 'lucide-react';
import { useStore, useAllowedProjects } from '@/store/useStore';
import PaymentMatrix from '@/components/PaymentMatrix';

const TAB_ITEMS = {
  planned: { label: 'IPC Dự kiến', icon: FileClock, type: 'team', hint: 'Kế hoạch thanh toán thầu phụ' },
  actual: { label: 'IPC Thực', icon: ClipboardList, type: 'ipc', hint: 'Hồ sơ thanh toán đã triển khai' },
  materials: { label: 'Nhận Vật Tư', icon: Boxes, type: 'materials', hint: 'Theo dõi vật tư theo từng công trình' },
  export_materials: { label: 'Xuất Vật Tư', icon: Boxes, type: 'materials', hint: 'Theo dõi xuất vật tư theo từng công trình' },
};

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return 0;
  const normalized = String(value).replace(/,/g, '').trim();
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
};

const formatCell = (value) => (value === '' || value === null || value === undefined ? '' : value);

export default function IpcMatrixPage({ mode = 'planned' }) {
  const { activeProject, setActiveProject, materialSheets, setMaterialSheet, openGlobalPrompt } = useStore();
  const projects = useAllowedProjects();

  const selectedProject = (activeProject && projects.some((p) => p.name === activeProject))
    ? activeProject
    : projects[0]?.name || '';

  const activeTab = useMemo(() => TAB_ITEMS[mode] || TAB_ITEMS.planned, [mode]);
  const Icon = activeTab.icon;

  // Material Logic
  const isExport = mode === 'export_materials';
  const sheetKey = isExport ? `${selectedProject}_export` : selectedProject;
  const currentSheet = materialSheets[sheetKey] || { items: [], rows: [] };
  
  const materialItems = useMemo(() => {
    let items = currentSheet.items || [];
    if (items.length !== 8) {
      items = Array.from({ length: 8 }, (_, i) => {
        return items[i] || { id: `col_${i}`, name: '' };
      });
    }
    return items;
  }, [currentSheet.items]);

  const materialRows = currentSheet.rows || [];

  const handleUpdateName = (colId, newName) => {
    const nextItems = materialItems.map(item => item.id === colId ? { ...item, name: newName } : item);
    setMaterialSheet(sheetKey, { items: nextItems, rows: materialRows });
  };

  const handleUpdateRowDate = (rowId, date) => {
    const nextRows = materialRows.map(row => row.id === rowId ? { ...row, date } : row);
    setMaterialSheet(sheetKey, { items: materialItems, rows: nextRows });
  };

  const handleUpdateCell = (rowId, colId, field, value) => {
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
    setMaterialSheet(sheetKey, { items: materialItems, rows: nextRows });
  };

  const handleEditName = (item) => {
    openGlobalPrompt(`Nhập tên vật tư:`, (newName) => {
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
             const y = parts[0].slice(-2);
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
    }, toISO(row.date), 'Chọn Ngày', 'date');
  };

  const handleEditValue = (row, item, field, currentValue) => {
    const fieldName = field === 'order' ? 'ORDER' : (isExport ? 'XUẤT' : 'NHẬN');
    openGlobalPrompt(`Nhập số lượng ${fieldName} cho ${item.name || 'vật tư này'}:`, (newVal) => {
      if (newVal !== null) {
        handleUpdateCell(row.id, item.id, field, newVal);
      }
    }, currentValue || '');
  };

  const addRow = () => {
    const newRow = { id: `row-${Date.now()}`, date: '', values: {} };
    setMaterialSheet(sheetKey, { items: materialItems, rows: [...materialRows, newRow] });
  };

  const addColumn = () => {
    const newItem = { id: `mat-${Date.now()}`, name: '' };
    setMaterialSheet(sheetKey, { items: [...materialItems, newItem], rows: materialRows });
  };

  const resetData = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu vật tư của công trình này?")) {
      setMaterialSheet(sheetKey, { items: [], rows: [] });
    }
  };

  const totals = useMemo(() => materialItems.reduce((acc, item) => {
    acc[item.id] = materialRows.reduce((sum, row) => {
      const value = row.values?.[item.id] || {};
      return sum + parseNumber(value.received);
    }, 0);
    return acc;
  }, {}), [materialItems, materialRows]);

  const orderTotals = useMemo(() => materialItems.reduce((acc, item) => {
    acc[item.id] = materialRows.reduce((sum, row) => {
      const value = row.values?.[item.id] || {};
      return sum + parseNumber(value.order);
    }, 0);
    return acc;
  }, {}), [materialItems, materialRows]);

  const remainingByMaterial = (itemId) => parseNumber(orderTotals[itemId]) - parseNumber(totals[itemId]);

  return (
    <div className="pb-12">
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
                    <button
                      type="button"
                      onClick={addColumn}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      <Plus className="h-4 w-4" />
                      Thêm cột
                    </button>
                    <button
                      type="button"
                      onClick={resetData}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Clear dữ liệu
                    </button>
                  </div>
                  
                  <div className="overflow-hidden rounded-lg border border-slate-800 bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-slate-800 text-center text-sm">
                        <thead>
                          <tr>
                            <th rowSpan={2} className="border border-slate-800 bg-white px-4 py-3 font-bold text-slate-900 w-[160px] whitespace-nowrap">{isExport ? 'TẦNG' : 'NGÀY (DD/MM/YY)'}</th>
                            {materialItems.map((item) => (
                              <th key={item.id} colSpan={2} className="border border-slate-800 bg-white p-0">
                                <div
                                  onClick={() => handleEditName(item)}
                                  className="w-full h-full min-w-[120px] p-2 text-center font-bold text-slate-900 cursor-pointer hover:bg-slate-50 uppercase min-h-[40px] flex items-center justify-center"
                                >
                                  {item.name || <span className="text-gray-400 font-normal italic">Tên vật tư</span>}
                                </div>
                              </th>
                            ))}
                          </tr>
                          <tr>
                            {materialItems.map((item) => (
                              <Fragment key={`${item.id}-pair`}>
                                <th className="border border-slate-800 bg-[#fff3e0] px-2 py-1 font-medium text-amber-900 min-w-[80px]">ORDER</th>
                                <th className="border border-slate-800 bg-[#e8f5e9] px-2 py-1 font-medium text-emerald-900 min-w-[80px]">{isExport ? 'XUẤT' : 'NHẬN'}</th>
                              </Fragment>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {materialRows.map((row) => (
                            <tr key={row.id}>
                              <td className="border border-slate-800 p-0">
                                <div
                                  onClick={() => handleEditDate(row)}
                                  className="w-full h-full p-2 text-center cursor-pointer hover:bg-slate-50 min-h-[36px] flex items-center justify-center"
                                >
                                  {row.date || ''}
                                </div>
                              </td>
                              {materialItems.map((item) => (
                                <Fragment key={`${row.id}-${item.id}`}>
                                  <td className="border border-slate-800 p-0">
                                    <div
                                      onClick={() => handleEditValue(row, item, 'order', row.values?.[item.id]?.order)}
                                      className="w-full h-full p-2 text-center cursor-pointer hover:bg-[#ffe0b2] bg-[#fff3e0] text-amber-900 min-h-[36px] flex items-center justify-center font-medium"
                                    >
                                      {row.values?.[item.id]?.order ?? ''}
                                    </div>
                                  </td>
                                  <td className="border border-slate-800 p-0">
                                    <div
                                      onClick={() => handleEditValue(row, item, 'received', row.values?.[item.id]?.received)}
                                      className="w-full h-full p-2 text-center cursor-pointer hover:bg-[#c8e6c9] bg-[#e8f5e9] text-emerald-900 min-h-[36px] flex items-center justify-center font-medium"
                                    >
                                      {row.values?.[item.id]?.received ?? ''}
                                    </div>
                                  </td>
                                </Fragment>
                              ))}
                            </tr>
                          ))}
                          {materialRows.length === 0 && (
                            <tr>
                              <td colSpan={17} className="border border-slate-800 py-6 text-slate-400">
                                Chưa có dữ liệu. Bấm "Thêm dòng" để bắt đầu.
                              </td>
                            </tr>
                          )}
                          <tr className="bg-slate-100 font-bold">
                            <td className="border border-slate-800 p-2 text-slate-900">TỔNG</td>
                            {materialItems.map((item) => (
                              <Fragment key={`${item.id}-totals`}>
                                <td className="border border-slate-800 p-2 text-amber-900 bg-[#ffe0b2]">{formatCell(orderTotals[item.id] || 0)}</td>
                                <td className="border border-slate-800 p-2 text-emerald-900 bg-[#c8e6c9]">{formatCell(totals[item.id] || 0)}</td>
                              </Fragment>
                            ))}
                          </tr>
                          <tr className="font-bold">
                            <td className="border border-slate-800 p-2 text-slate-900 bg-white">CÒN LẠI</td>
                            {materialItems.map((item) => {
                              const remaining = remainingByMaterial(item.id);
                              // Excel has red if positive (still need to receive), green if 0 or negative
                              const isShort = remaining > 0;
                              return (
                                <td
                                  key={`${item.id}-remaining`}
                                  colSpan={2}
                                  className={`border border-slate-800 p-2 ${isShort ? 'bg-[red] text-white' : 'bg-[#92d050] text-black'}`}
                                >
                                  {remaining}
                                </td>
                              );
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-700">
                    <strong>Hướng dẫn:</strong> Bảng dưới đây dùng để quản lý {activeTab.label.toLowerCase()}. {activeTab.type === 'team' ? 'Các ô có dữ liệu sẽ tự động được đồng bộ vào IPC Dự kiến.' : ''}
                  </div>
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
    </div>
  );
}
