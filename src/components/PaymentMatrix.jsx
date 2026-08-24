'use client';

import React, { useState } from 'react';
import { useStore, sortFloors } from '@/store/useStore';
import { Edit2, Sparkles, Trash2, X, Eye, EyeOff, CheckSquare, Square, FileSpreadsheet, Printer } from 'lucide-react';
import { exportToExcel } from '@/utils/exportUtils';
import { standardBlocksTemplate, thachCaoBlocksTemplate } from '@/lib/mockData';

export default function PaymentMatrix({ projectName = 'SUNHOME', type = 'team', selectedTeamFilter = 'ALL', period = '' }) {
  const store = useStore();
  const isAdmin = store.currentUser?.role === 'ADMIN' || store.currentUser?.role === 'GIÁM ĐỐC';
  const isAdminOrQS = isAdmin || store.currentUser?.role === 'QS';
  const matrixKey = `${projectName}_${type}`;
  const project = store.projects?.find(p => p.name?.trim() === projectName?.trim());
  const isThachCao = project?.projectType?.trim() === 'Thạch cao';
  const fallbackBlocks = JSON.parse(JSON.stringify(isThachCao ? thachCaoBlocksTemplate : standardBlocksTemplate));
  const fallbackFloors = [];

  // Master base floors for project
  const baseFloors = store.paymentMatrix[projectName] || store.paymentMatrix[`${projectName}_team`] || [];
  
  // Compute paymentMatrix strictly based on master baseFloors
  let paymentMatrix = [];
  if (type === 'ipc' || type === 'ipc_select') {
    const teamMatrix = store.paymentMatrix[`${projectName}_team`] || [];
    const fullMatrix = baseFloors.map(canonicalRow => {
      const teamRow = teamMatrix.find(r => String(r.floor).trim() === String(canonicalRow.floor).trim());
      return {
        floor: canonicalRow.floor,
        numApts: canonicalRow.numApts,
        items: teamRow ? (teamRow.items || {}) : {}
      };
    });
    
    // Only keep floors that have at least one cell with data (excluding numApts)
    paymentMatrix = fullMatrix.filter(row => {
      return Object.entries(row.items).some(([key, val]) => !key.endsWith('_numApts') && val && val.trim() !== '');
    });
  } else {
    const targetMatrix = store.paymentMatrix[matrixKey] || [];
    const sourceMatrix = targetMatrix.length > 0 ? targetMatrix : baseFloors;
    paymentMatrix = baseFloors.map(canonicalRow => {
      const rowData = sourceMatrix.find(r => String(r.floor).trim() === String(canonicalRow.floor).trim());
      return {
        floor: canonicalRow.floor,
        numApts: canonicalRow.numApts,
        items: rowData ? (rowData.items || {}) : {}
      };
    });
  }
  paymentMatrix = sortFloors(paymentMatrix);

  const rawBlocks = (store.matrixBlocks[projectName] && store.matrixBlocks[projectName].length > 0) 
    ? store.matrixBlocks[projectName] 
    : fallbackBlocks;
    
  const matrixBlocks = rawBlocks;
  
  const updateMatrixCell = (...args) => store.updateMatrixCell(matrixKey, ...args);
  const updateCategoryName = (...args) => store.updateCategoryName(projectName, ...args);
  const deleteCategoryName = (...args) => store.deleteCategoryName(projectName, ...args);
  const deleteGroupName = (...args) => store.deleteGroupName(projectName, ...args);
  const deleteBlockName = (...args) => store.deleteBlockName(projectName, ...args);
  const updateGroupName = (...args) => store.updateGroupName(projectName, ...args);
  const addCategoryGroup = (...args) => store.addCategoryGroup(projectName, ...args);
  const addCategoryItem = (...args) => store.addCategoryItem(projectName, ...args);
  const addFloor = (...args) => store.addFloor(projectName, ...args);
  const updateFloorName = (...args) => store.updateFloorName(projectName, ...args);
  const updateFloorNumApts = (...args) => store.updateFloorNumApts(projectName, ...args);
  const deleteFloor = (...args) => store.deleteFloor(projectName, ...args);
  const updateBlockName = (...args) => store.updateBlockName(projectName, ...args);
  const addBOQNode = (...args) => store.addBOQNode(projectName, ...args);
  const [selectedCell, setSelectedCell] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [batchList, setBatchList] = useState([]);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchUnits, setNewBatchUnits] = useState('');
  const [newBatchNote, setNewBatchNote] = useState('');
  const [unitError, setUnitError] = useState('');
  const [activeTeam, setActiveTeam] = useState('');
  
  const [isBOQModalOpen, setIsBOQModalOpen] = useState(false);
  const [boqData, setBoqData] = useState({ blockName: '', groupName: '', itemName: '' });

  const storageKey = `qss_hidden_cols_${projectName}_${type}_${selectedTeamFilter}`;
  const [hiddenColumns, setHiddenColumnsState] = useState([]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setHiddenColumnsState(JSON.parse(saved));
        } catch(e) {
          setHiddenColumnsState([]);
        }
      } else {
        setHiddenColumnsState([]);
      }
    }
  }, [storageKey]);

  const setHiddenColumns = (valOrUpdater) => {
    setHiddenColumnsState(prev => {
      const next = typeof valOrUpdater === 'function' ? valOrUpdater(prev) : valOrUpdater;
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(next));
      }
      return next;
    });
  };

  const toggleHideColumn = (itemKey) => {
    setHiddenColumns(prev => 
      prev.includes(itemKey) ? prev.filter(k => k !== itemKey) : [...prev, itemKey]
    );
  };

  const handleHideGroup = (blockName, groupName, items) => {
    setHiddenColumns(prev => {
       const next = [...new Set([...prev, ...items.map(cat => `${blockName}_${groupName}_${cat}`)])];
       return next;
    });
  };

  const isColumnVisible = (itemKey) => !hiddenColumns.includes(itemKey);

  const handleEditBlock = (bIdx, oldName) => {
    store.openGlobalPrompt(
      "Nhập tên BLOCK mới (VD: BLOCK B) - Hoặc bấm XÓA DÒNG để XÓA BLOCK:", 
      (newName) => {
        if (newName && newName.trim() !== '' && newName !== oldName) {
          updateBlockName(bIdx, newName.trim());
        } else if (!newName || newName.trim() === '') {
          store.openGlobalConfirm(`Bạn có chắc chắn muốn xóa BLOCK ${oldName} không? Toàn bộ các nhóm và hạng mục bên trong sẽ bị xóa sạch.`, () => {
            deleteBlockName(bIdx);
          });
        }
      }, 
      oldName,
      'Nhập liệu',
      'text',
      false,
      null,
      () => {
        store.openGlobalConfirm(`Bạn có chắc chắn muốn xóa BLOCK ${oldName} không? Toàn bộ các nhóm và hạng mục bên trong sẽ bị xóa sạch.`, () => {
          deleteBlockName(bIdx);
        });
      }
    );
  };

  const handleCreateBOQ = (e) => {
    e.preventDefault();
    if (!boqData.blockName || !boqData.groupName || !boqData.itemName) return;
    addBOQNode(boqData.blockName.trim(), boqData.groupName.trim(), boqData.itemName.trim());
    setBoqData({ blockName: '', groupName: '', itemName: '' });
    setIsBOQModalOpen(false);
  };

  const handleEditGroup = (bIdx, gIdx, oldName) => {
    store.openGlobalPrompt(
      "Nhập tên nhóm mới - Hoặc bấm XÓA DÒNG để XÓA NHÓM:", 
      (newName) => {
        if (newName && newName.trim() !== '' && newName !== oldName) {
          updateGroupName(bIdx, gIdx, newName.trim());
        } else if (!newName || newName.trim() === '') {
          store.openGlobalConfirm(`Bạn có chắc chắn muốn xóa NHÓM ${oldName} không? Toàn bộ các hạng mục bên trong sẽ bị xóa sạch.`, () => {
            deleteGroupName(bIdx, gIdx);
          });
        }
      }, 
      oldName,
      'Nhập liệu',
      'text',
      false,
      null,
      () => {
        store.openGlobalConfirm(`Bạn có chắc chắn muốn xóa NHÓM ${oldName} không? Toàn bộ các hạng mục bên trong sẽ bị xóa sạch.`, () => {
          deleteGroupName(bIdx, gIdx);
        });
      }
    );
  };

  const handleEditItem = (bIdx, gIdx, iIdx, oldName) => {
    store.openGlobalPrompt(
      "Nhập tên hạng mục mới - Hoặc bấm XÓA DÒNG để XÓA HẠNG MỤC:", 
      (newName) => {
        if (newName && newName.trim() !== '' && newName !== oldName) {
          updateCategoryName(bIdx, gIdx, iIdx, oldName, newName.trim());
        } else if (!newName || newName.trim() === '') {
          store.openGlobalConfirm(`Bạn có chắc chắn muốn xóa HẠNG MỤC ${oldName} không?`, () => {
            deleteCategoryName(bIdx, gIdx, iIdx, oldName);
          });
        }
      }, 
      oldName,
      'Nhập liệu',
      'text',
      false,
      null,
      () => {
        store.openGlobalConfirm(`Bạn có chắc chắn muốn xóa HẠNG MỤC ${oldName} không?`, () => {
          deleteCategoryName(bIdx, gIdx, iIdx, oldName);
        });
      }
    );
  };

  const handleAddGroup = (bIdx) => {
    store.openGlobalPrompt("Nhập tên NHÓM mới (VD: HÀNH LANG):", (newName) => {
      if (newName && newName.trim() !== '') {
        addCategoryGroup(bIdx, newName.trim());
      }
    });
  };

  const handleAddItem = (bIdx, gIdx) => {
    store.openGlobalPrompt("Nhập tên HẠNG MỤC mới (VD: Bả 1 lớp):", (newName) => {
      if (newName && newName.trim() !== '') {
        addCategoryItem(bIdx, gIdx, newName.trim());
      }
    });
  };

  const handleAddFloor = () => {
    let maxFloor = 0;
    paymentMatrix.forEach(row => {
      const match = String(row.floor).match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxFloor) maxFloor = num;
      }
    });
    const defaultApts = {};
    matrixBlocks.forEach(b => defaultApts[b.blockName] = '');
    setAddFloorData({
      numFloors: 1,
      blockApts: defaultApts,
      startNumber: maxFloor + 1
    });
    setIsAddFloorModalOpen(true);
  };

  const handleEditFloor = (oldName) => {
    store.openGlobalPrompt("Nhập tên TẦNG mới (VD: Tầng 16 (50%)) - Bỏ trống để XÓA TẦNG:", (newName) => {
      if (newName && newName.trim() !== '' && newName !== oldName) {
        updateFloorName(oldName, newName.trim());
      } else if (!newName || newName.trim() === '') {
        store.openGlobalConfirm(`Bạn có chắc chắn muốn xóa Tầng ${oldName} không? Toàn bộ dữ liệu của tầng này sẽ bị mất.`, () => {
          deleteFloor(oldName);
        });
      }
    }, oldName);
  };

  const handleEditNumApts = (floorName, blockName, currentVal) => {
    store.openGlobalPrompt(`Nhập số căn cho ${floorName} - ${blockName}:`, (newName) => {
      if (newName !== null && newName.trim() !== currentVal) {
        store.updateMatrixCell(matrixKey, floorName, `${blockName}_numApts`, newName.trim());
      }
    }, currentVal);
  };

  const handleDeleteFloor = (floorName) => {
    store.openGlobalConfirm(`Bạn có chắc chắn muốn xóa Tầng ${floorName} không? Toàn bộ dữ liệu của tầng này sẽ bị mất.`, () => {
      deleteFloor(floorName);
    });
  };

  const allCategories = matrixBlocks.flatMap(b => b.groups.flatMap(g => g.items));
  const typeLabel = type === 'ipc' ? 'IPC' : 'Đợt';

  const getCellColor = (val) => {
    if (!val) return '';
    if (val === 'Xong 100%') return '#6ee7b7'; // emerald-300
    if (val === 'Tạm dừng') return '#fca5a5'; // red-300

    // Extract core batch base name (e.g. "ĐỢT 2 (1)" -> "ĐỢT 2")
    const firstPart = val.split('+')[0].trim();
    const baseName = firstPart.replace(/\([^)]*\)/g, '').trim().toUpperCase() || firstPart.toUpperCase();
    
    // Nếu ở chế độ ipc_select và là "ĐỢT" thì hiển thị màu xám
    if (type === 'ipc_select' && baseName.includes('ĐỢT')) {
      return '#e2e8f0'; // slate-200
    }

    // Hash baseName string to HSL color
    let hash = 0;
    for (let i = 0; i < baseName.length; i++) {
      hash = baseName.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Multiply by golden angle 137.5 to ensure distinct colors for sequential names (ĐỢT 1, ĐỢT 2...)
    const h = Math.abs(hash * 137.5) % 360;
    return `hsl(${h}, 75%, 85%)`;
  };

  const displayCellValue = (rawVal, team) => {
    if (!rawVal) return '';
    if (type === 'ipc_select' || type === 'ipc') {
      let display = rawVal;
      store.teams.forEach(t => {
        // Escape special characters in team name for regex
        const escapedTeamName = t.teamName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        display = display.replace(new RegExp(`\\s*\\(${escapedTeamName}\\)`, 'g'), '');
      });
      
      if (type === 'ipc_select' || type === 'ipc') {
        const parts = display.split('+').map(p => p.trim());
        const extractedParts = parts.map(p => {
          if (p.toUpperCase().includes('ĐỢT')) {
            const match = p.match(/\(([^)]+)\)/);
            return match ? match[1] : p;
          }
          return p;
        });
        return extractedParts.join(' + ');
      }
      return display.trim();
    }
    
    if (team === 'ALL') return rawVal;
    const parts = rawVal.split(' + ');
    const teamParts = parts.filter(p => p.includes(`(${team})`));
    if (teamParts.length > 0) {
      return teamParts.map(p => p.replace(`(${team})`, '').trim()).join(', ');
    }
    return '';
  };

  const mergeCellValue = (rawVal, newVal, team) => {
    if (!team || team === 'ALL') return newVal;
    const parts = rawVal ? rawVal.split(' + ').map(p => p.trim()).filter(Boolean) : [];
    // Keep all other teams' batches 100% intact
    const otherTeamParts = parts.filter(p => !p.includes(`(${team})`));

    if (newVal && newVal.trim() !== '') {
      const teamBatches = newVal.split(' + ').map(p => p.trim()).filter(Boolean);
      const formattedTeamBatches = teamBatches.map(b => {
        if (b.includes(`(${team})`)) return b;
        return `${b} (${team})`;
      });
      return [...otherTeamParts, ...formattedTeamBatches].join(' + ');
    }

    return otherTeamParts.join(' + ');
  };

  const handleCellClick = (floor, cat, currentRawVal, numAptsStr, teamRawVal = '') => {
    if (type === 'team' && selectedTeamFilter === 'ALL') {
      if (!isAdmin) {
        store.openGlobalAlert("⚠️ Bảng TỔNG chỉ dùng để xem tổng hợp tất cả các đội. Vui lòng chọn 1 Tổ Đội cụ thể ở menu trên cùng để nhập hoặc chỉnh sửa đợt thi công! (Chỉ Admin mới có quyền sửa TỔNG)");
        return;
      }
    }

    const hasExistingData = currentRawVal && currentRawVal.trim() !== '';
    const totalApts = parseInt(numAptsStr, 10);
    const isNumAptsMissing = !numAptsStr || isNaN(totalApts) || totalApts <= 0;

    // Only block if trying to add new data to an empty cell on a floor with missing numApts
    if (!hasExistingData && isNumAptsMissing) {
      store.openGlobalAlert(`⚠️ ${floor} chưa khai báo Số Căn Tổng (hiện tại là '${numAptsStr || '-'}'). Vui lòng nhấp vào ô "Số căn" của ${floor} để nhập số căn tổng trước!`);
      return;
    }

    setSelectedCell({ floor, category: cat, rawValue: currentRawVal, numApts: numAptsStr || '', teamRawValue: teamRawVal });
    
    // Parse batches for the currently selected team
    let initialBatches = [];
    if (currentRawVal && currentRawVal.trim() !== '') {
      const parts = currentRawVal.split(' + ').map(p => p.trim()).filter(Boolean);
      if (selectedTeamFilter !== 'ALL') {
        initialBatches = parts
          .filter(p => p.includes(`(${selectedTeamFilter})`) || !p.match(/\([^)]*\)/g) || p.includes('ĐỢT') || p.includes('IPC'))
          .map(p => p.replace(`(${selectedTeamFilter})`, '').trim());
      } else {
        initialBatches = parts;
      }
    }

    setBatchList(initialBatches);
    setInputValue(initialBatches.join(' + '));
    setNewBatchName('');
    setNewBatchUnits('');
    setNewBatchNote('');
    setUnitError('');
    setActiveTeam(selectedTeamFilter !== 'ALL' ? selectedTeamFilter : '');
  };

  const handleSaveCell = (valueToSave) => {
    const finalVal = valueToSave !== undefined ? valueToSave : inputValue;
    if (selectedCell) {
      const mergedVal = mergeCellValue(selectedCell.rawValue, finalVal, selectedTeamFilter);
      updateMatrixCell(selectedCell.floor, selectedCell.category, mergedVal);
      setSelectedCell(null);
    }
  };

  const handleExportExcel = () => {
    const exportData = paymentMatrix.map(row => {
      const flatRow = {
        'Tầng': row.floor,
        'Số căn': row.numApts || '-'
      };
      
      matrixBlocks.forEach(block => {
        block.groups.forEach(group => {
          group.items.forEach(cat => {
            const itemKey = `${block.blockName}_${group.groupName}_${cat}`;
            if (isColumnVisible(itemKey)) {
              const colName = `${block.blockName} - ${group.groupName} - ${cat}`;
              
              let cellValue = row.items[itemKey] || '';
              if (type === 'ipc') {
                 const ipcMatrix = store.paymentMatrix[`${projectName}_ipc`] || [];
                 const ipcRow = ipcMatrix.find(r => String(r.floor).trim() === String(row.floor).trim());
                 cellValue = ipcRow?.items?.[itemKey] || '';
              } else {
                 cellValue = displayCellValue(cellValue, selectedTeamFilter) || '';
              }
              
              flatRow[colName] = cellValue;
            }
          });
        });
      });
      return flatRow;
    });

    const title = type === 'ipc' ? `IPC_${projectName}` : `Tien_Do_${projectName}`;
    exportToExcel(exportData, title, 'DuLieu');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      {/* Helper Toolbar */}
      <div className="flex flex-wrap items-center justify-end gap-3 mb-4 text-xs no-print">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 font-bold rounded-lg border border-gray-200 shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" /> In Bảng
        </button>
        <button 
          onClick={handleExportExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg border border-emerald-200 shadow-sm transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" /> Xuất Excel
        </button>
        <button 
          onClick={() => setIsColumnModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold rounded-lg border border-sky-200 shadow-sm transition-colors"
        >
          <Eye className="w-4 h-4" /> Quản lý Ẩn/Hiện
        </button>
        <button 
          onClick={() => setIsBOQModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg border border-indigo-200 shadow-sm transition-colors"
        >
          <span className="text-lg leading-none pb-0.5">+</span> Tạo BOQ Nhanh
        </button>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto overflow-y-auto max-h-[75vh] rounded-xl border border-gray-300 shadow-inner relative"
           onClick={() => setContextMenu(null)}
           onScroll={() => setContextMenu(null)}
      >
        <table className="matrix-table min-w-[1100px] w-full relative">
          <thead className="sticky top-0 z-20 shadow-md bg-white">
            {/* Block level */}
            <tr>
              <th rowSpan={2} colSpan={1} className="header-green text-[11px] uppercase font-bold py-2 px-1 whitespace-normal break-words w-[70px] max-w-[70px] border-r border-white/20 align-middle">
                {projectName}
              </th>
              {matrixBlocks.map((block, bIdx) => {
                const visibleCountInBlock = block.groups.reduce((acc, g) => {
                  const visG = g.items.filter(cat => isColumnVisible(`${block.blockName}_${g.groupName}_${cat}`));
                  return acc + Math.max(visG.length, visG.length === 0 ? 0 : 1);
                }, 0);

                if (visibleCountInBlock === 0) return null;

                return (
                  <th key={bIdx} colSpan={visibleCountInBlock + 1} className="bg-indigo-900 text-white text-sm uppercase font-extrabold py-2 border-b border-white/20 border-r border-white/20">
                    <div className="flex items-center justify-center gap-2 group">
                      <span className="cursor-pointer hover:text-indigo-200 transition-colors" onDoubleClick={() => handleEditBlock(bIdx, block.blockName)} title="Bấm đúp để đổi tên Block">
                        {block.blockName}
                      </span>
                      <button onClick={() => handleAddGroup(bIdx)} className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 hover:bg-white/40 text-white w-5 h-5 rounded-full flex items-center justify-center text-lg leading-none pb-0.5" title="Thêm Nhóm (VD: HÀNH LANG)">+</button>
                    </div>
                  </th>
                );
              })}
            </tr>
            {/* Group level */}
            <tr>
              {matrixBlocks.flatMap((block, bIdx) => {
                const numAptsHeader = (
                  <th key={`numapts-${bIdx}`} rowSpan={2} className="bg-slate-200 text-slate-800 text-[10px] font-bold uppercase border-b border-r border-gray-300 w-10 align-middle">
                    Số căn
                  </th>
                );
                
                const groupHeaders = block.groups.map((group, gIdx) => {
                  const visItems = group.items.filter(cat => isColumnVisible(`${block.blockName}_${group.groupName}_${cat}`));
                  if (visItems.length === 0 && group.items.length > 0) return null;
                  const visCount = Math.max(visItems.length, 1);
                  return (
                    <th 
                      key={gIdx} 
                      colSpan={visCount} 
                      onDoubleClick={() => handleEditGroup(bIdx, gIdx, group.groupName)}
                      className="header-orange text-[10px] uppercase font-bold py-1 px-2 whitespace-nowrap border-r border-orange-200/50 cursor-pointer hover:bg-orange-200/50 transition-colors relative group/col"
                      title="Bấm đúp để sửa tên nhóm"
                    >
                      <div className="flex justify-center items-center relative h-full">
                        <span>{group.groupName}</span>
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleHideGroup(block.blockName, group.groupName, group.items); }}
                          className="opacity-0 group-hover/col:opacity-100 p-0.5 text-gray-500 hover:text-orange-600 hover:bg-orange-100 rounded transition absolute -right-1 bg-white shadow-sm z-10"
                          title="Ẩn toàn bộ nhóm này"
                        >
                          <EyeOff className="w-3 h-3" />
                        </button>
                      </div>
                    </th>
                  );
                });
                return [numAptsHeader, ...groupHeaders];
              })}
            </tr>
            {/* Item level */}
            <tr className="bg-slate-100 text-slate-800 text-[10px]">
              <th className="bg-slate-200 border-r border-gray-300 py-2 text-xs w-[70px] max-w-[70px]">Tầng</th>
              {matrixBlocks.flatMap((block, bIdx) =>
                block.groups.flatMap((group, gIdx) => {
                  if (group.items.length === 0) {
                    return <th key={`empty-${bIdx}-${gIdx}`} className="py-2 px-1 border-r border-gray-200 text-gray-400 italic text-[10px] font-normal">(Chưa có)</th>;
                  }
                  return group.items.map((cat, iIdx) => {
                    const itemKey = `${block.blockName}_${group.groupName}_${cat}`;
                    if (!isColumnVisible(itemKey)) return null;
                    return (
                      <th 
                        key={`${bIdx}-${gIdx}-${iIdx}`} 
                        onDoubleClick={() => handleEditItem(bIdx, gIdx, iIdx, cat)}
                        className={`font-semibold leading-none py-1 border-r border-gray-200 cursor-pointer hover:bg-slate-300 transition-colors relative group/col align-middle ${isThachCao ? 'px-2' : ''}`}
                        title="Bấm đúp để sửa tên"
                      >
                        <div className={`flex justify-center items-center relative mx-auto ${isThachCao ? 'h-[40px] w-[90px] text-center whitespace-normal' : 'h-[90px] w-[20px]'}`}>
                          <span className={`${isThachCao ? 'text-[9px] leading-[1.2]' : '[writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-[9px]'} font-extrabold text-slate-700 tracking-tight`}>
                            {cat}
                          </span>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleHideColumn(itemKey); }}
                            className="opacity-0 group-hover/col:opacity-100 p-0.5 text-gray-500 hover:text-indigo-600 hover:bg-slate-200 rounded transition absolute -top-1 -right-1 bg-white shadow-sm z-10"
                            title="Ẩn cột này"
                          >
                            <EyeOff className="w-3 h-3" />
                          </button>
                        </div>
                      </th>
                    );
                  });
                })
              )}
            </tr>
          </thead>
          <tbody>
            {paymentMatrix.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition border-b border-gray-200 group">
                <td 
                  className="font-bold text-center bg-amber-50/70 border-r border-amber-200 text-slate-900 py-1.5 cursor-pointer hover:bg-amber-100 transition-colors"
                  onDoubleClick={() => handleEditFloor(row.floor)}
                  title="Bấm đúp để sửa hoặc xóa tầng"
                >
                  {row.floor}
                </td>
                {matrixBlocks.flatMap((block, bIdx) => {
                  const numAptsKey = `${block.blockName}_numApts`;
                  const blockNumApts = row.items[numAptsKey] || '';
                  
                  const numAptsCell = (
                    <td 
                      key={`numapts-td-${bIdx}`}
                      className="font-bold text-center bg-white border-r border-gray-200 text-slate-900 py-1.5 cursor-pointer hover:bg-gray-100 transition-colors text-xs"
                      onClick={() => handleEditNumApts(row.floor, block.blockName, blockNumApts)}
                      title="Nhấn để nhập số căn"
                    >
                      {blockNumApts || '-'}
                    </td>
                  );

                  const groupCells = block.groups.flatMap((group, gIdx) => {
                    if (group.items.length === 0) {
                      return <td key={`empty-td-${bIdx}-${gIdx}`} className="border-r border-gray-200 bg-gray-50/50"></td>;
                    }
                    return group.items.map((cat, cIdx) => {
                      const itemKey = `${block.blockName}_${group.groupName}_${cat}`;
                      if (!isColumnVisible(itemKey)) return null;
                      const rawVal = row.items[itemKey];
                      const displayVal = displayCellValue(rawVal, selectedTeamFilter);
                      let ipcRawVal = '';
                      if (type === 'ipc' || type === 'ipc_select') {
                        const ipcMatrix = store.paymentMatrix[`${projectName}_ipc`] || [];
                        const ipcRow = ipcMatrix.find(r => String(r.floor).trim() === String(row.floor).trim());
                        ipcRawVal = ipcRow?.items?.[itemKey] || '';
                      }

                      let bgColor = '';
                      if (type === 'ipc') {
                        if (ipcRawVal) {
                          bgColor = getCellColor(ipcRawVal);
                        } else if (rawVal) {
                          bgColor = '#e2e8f0'; // slate-200 (gray)
                        }
                      } else {
                        bgColor = getCellColor(displayVal || rawVal);
                      }
                      
                      return (
                        <td
                          key={`${bIdx}-${gIdx}-${cIdx}`}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            if (type === 'ipc') return; // maybe don't allow context menu in ipc mode if read-only, but let's allow it for copy
                            setContextMenu({
                              x: e.clientX,
                              y: e.clientY,
                              floor: row.floor,
                              itemKey,
                              rawVal,
                              blockNumApts: blockNumApts || row.numApts
                            });
                          }}
                          onClick={() => {
                            if (copiedValue !== null) {
                              // Paste Mode
                              if (type === 'ipc_select' || type === 'ipc') {
                                // Ignore paste for IPC if not supported or complex, but let's assume team/base mode for now
                                if (type === 'ipc' && !ipcRawVal && !rawVal) return;
                              }
                              if (type === 'team' && selectedTeamFilter === 'ALL' && !isAdmin) return;
                              
                              const mergedVal = mergeCellValue(rawVal, copiedValue, selectedTeamFilter);
                              updateMatrixCell(row.floor, itemKey, mergedVal);
                              return;
                            }
                            
                            if ((type === 'ipc_select' || type === 'ipc') && !rawVal && !ipcRawVal) {
                               // No action if empty
                            } else if (type === 'ipc') {
                               handleCellClick(row.floor, itemKey, ipcRawVal, blockNumApts || row.numApts, rawVal);
                            } else {
                              handleCellClick(row.floor, itemKey, rawVal, blockNumApts || row.numApts);
                            }
                          }}
                          className={`transition-all duration-150 text-center font-bold text-xs text-gray-900 select-none border-r border-gray-200 ${
                            (type === 'team' && selectedTeamFilter === 'ALL' && !isAdmin) 
                              ? 'cursor-not-allowed hover:opacity-100' 
                              : ((type === 'ipc_select' || type === 'ipc') && !rawVal && !ipcRawVal ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer hover:opacity-80')
                          } ${copiedValue !== null ? 'hover:ring-2 hover:ring-inset hover:ring-indigo-500 hover:bg-indigo-50 cursor-crosshair' : ''}`}
                          style={{ backgroundColor: (type === 'ipc_select' || type === 'ipc') && !rawVal && !ipcRawVal ? '#f8fafc' : bgColor }}
                          title={copiedValue !== null ? 'Bấm để dán giá trị' : ((type === 'ipc_select' || type === 'ipc') ? (rawVal || ipcRawVal ? "Nhấp để phân bổ IPC" : "Chưa có khối lượng") : (selectedTeamFilter === 'ALL' ? (isAdmin ? "Nhấp để chỉnh sửa/xóa (Quyền Admin)" : "Chế độ xem TỔNG (Chỉ xem)") : "Nhấp để chỉnh sửa ô"))}
                        >
                          <div className="flex flex-col items-center justify-center min-h-[26px] py-0.5">
                            {type === 'ipc' ? (
                              <>
                                <span className="text-[10px] opacity-70 leading-tight whitespace-normal break-words px-1 max-w-[120px]">{displayVal || ''}</span>
                                {ipcRawVal && (
                                  <span className="bg-blue-600 text-white border border-blue-700 px-1.5 py-0.5 rounded text-[10px] font-extrabold shadow-sm mt-0.5">
                                    {ipcRawVal}
                                  </span>
                                )}
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center">
                                <span className="whitespace-normal break-words leading-tight px-1 max-w-[120px]">{displayVal || ''}</span>
                                {(() => {
                                  if (type === 'ipc_select' && ipcRawVal) {
                                    const parseTotalUnits = (str, totalApts) => {
                                      if (!str) return 0;
                                      if (str.includes('Xong 100%')) return parseFloat(totalApts) || 0;
                                      let total = 0;
                                      str.split('+').forEach(p => {
                                        if (p.includes('Xong 100%')) {
                                          total += parseFloat(totalApts) || 0;
                                        } else {
                                          const m = p.match(/\((.*?)\)/);
                                          if (m) {
                                            const match = m[1].match(/(\d+(\.\d+)?)/);
                                            if (match) total += parseFloat(match[1]);
                                          }
                                        }
                                      });
                                      return total;
                                    };
                                    
                                    const teamMax = parseTotalUnits(rawVal, blockNumApts || row.numApts);
                                    const ipcTotal = parseTotalUnits(ipcRawVal, blockNumApts || row.numApts);
                                    let badgeText = "ĐÃ LÊN HS";
                                    let isPartial = false;
                                    
                                    if (ipcTotal > 0 && ipcTotal < teamMax) {
                                      badgeText = `ĐÃ LÊN ${ipcTotal}, CÒN ${teamMax - ipcTotal}`;
                                      isPartial = true;
                                    }
                                    
                                    return (
                                      <span className={`text-[9px] font-extrabold mt-1 px-1.5 py-0.5 rounded-sm border whitespace-nowrap text-center ${isPartial ? 'text-amber-700 bg-amber-100 border-amber-200' : 'text-green-700 bg-green-100 border-green-200'}`}>
                                        {badgeText}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    });
                  });
                  return [numAptsCell, ...groupCells];
                })}
              </tr>
            ))}
            {type === 'team' && (
              <tr>
                <td 
                  colSpan={matrixBlocks.reduce((acc, block) => acc + block.groups.reduce((gAcc, g) => gAcc + Math.max(g.items.length, 1), 0), 0) + 2} 
                  className="py-2 px-2 border-t border-gray-200 bg-gray-50/50 text-left"
                >
                  <button 
                    onClick={handleAddFloor}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-bold rounded-lg border border-indigo-200 transition-colors shadow-sm text-xs"
                  >
                    <span className="text-lg leading-none pb-0.5">+</span> Thêm Tầng Mới
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 shadow-xl rounded-xl py-1 w-48 text-sm overflow-hidden"
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 100), left: Math.min(contextMenu.x, window.innerWidth - 200) }}
        >
          <button 
            className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-indigo-700 font-medium flex items-center gap-2"
            onClick={() => {
              setCopiedValue(contextMenu.rawVal || '');
              setContextMenu(null);
            }}
          >
            <Sparkles className="w-4 h-4" /> Copy & Bật dán nhanh
          </button>
        </div>
      )}

      {/* Paste Mode Banner */}
      {copiedValue !== null && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="w-5 h-5 text-indigo-200" />
            <span>Chế độ dán nhanh:</span>
            <span className="bg-indigo-800 px-2 py-1 rounded text-xs truncate max-w-[200px]">{copiedValue}</span>
          </div>
          <div className="h-4 w-px bg-indigo-400"></div>
          <span className="text-sm text-indigo-200">Click vào ô trống để dán</span>
          <button 
            onClick={() => setCopiedValue(null)}
            className="ml-2 bg-white/20 hover:bg-white/30 p-1 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Edit Cell Modal */}
      {selectedCell && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-[24px] p-6 w-full max-w-[440px] shadow-2xl border border-gray-100 transform transition-all">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" /> Cập nhật đợt thi công / thanh toán
              </h3>
              <button 
                onClick={() => setSelectedCell(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
              >
                ✕
              </button>
            </div>
            
            <p className="text-[13px] text-gray-500 mb-4">
              Tầng <strong className="text-indigo-600 font-extrabold">{selectedCell.floor}</strong> &bull; <span className="font-medium">{selectedCell.category}</span>
            </p>

            {/* List of current batches */}
            {batchList.length > 0 && (
              <div className="mb-4 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                <label className="block text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-2">
                  Danh sách các đợt đã ghi nhận ({batchList.length}):
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
                  {batchList.map((batch, index) => (
                    <span key={index} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 shadow-sm group">
                      <span 
                        className="cursor-pointer group-hover:underline" 
                        title="Nhấn để sửa đợt này"
                        onClick={() => {
                          let name = batch;
                          let units = '';
                          let note = '';
                          
                          const noteIndex = batch.lastIndexOf(' - ');
                          if (noteIndex !== -1) {
                            note = batch.substring(noteIndex + 3).trim();
                            name = batch.substring(0, noteIndex).trim();
                          }
                          
                          const m = name.match(/^(.*?)\s*\((.*?)\)$/);
                          if (m) {
                            name = m[1].trim();
                            units = m[2].trim();
                          }
                          
                          setNewBatchName(name);
                          setNewBatchUnits(units);
                          setNewBatchNote(note);
                          setBatchList(batchList.filter((_, i) => i !== index));
                        }}
                      >
                        {batch}
                      </span>
                      <button 
                        type="button"
                        onClick={() => setBatchList(batchList.filter((_, i) => i !== index))}
                        className="text-indigo-300 hover:text-red-600 hover:bg-red-50 rounded p-0.5 transition"
                        title="Xóa đợt này"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Add batch form */}
            {!(type === 'team' && selectedTeamFilter === 'ALL') && (
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 mb-4 space-y-3">
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  Thêm đợt thi công mới:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 block mb-1">MÃ ĐỢT / IPC</span>
                    <input 
                      type="text" 
                      value={newBatchName}
                      onChange={(e) => setNewBatchName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      placeholder="VD: Đợt 01, IPC 01"
                      autoFocus
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 block mb-1">SỐ CĂN / KHỐI LƯỢNG</span>
                    <input 
                      type="text" 
                      value={newBatchUnits}
                      onChange={(e) => setNewBatchUnits(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      placeholder="VD: 5 căn, 50%"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 block mb-1">GHI CHÚ (NẾU CÓ)</span>
                  <input 
                    type="text" 
                    value={newBatchNote}
                    onChange={(e) => setNewBatchNote(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="VD: Đã thanh toán, Chờ duyệt..."
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    if (!newBatchName.trim()) return;
                    
                    const parseQuantity = (str, totalApts) => {
                      if (!str) return 0;
                      if (str.includes('Xong 100%')) return parseFloat(totalApts) || 0;
                      let total = 0;
                      str.split('+').forEach(p => {
                        if (p.includes('Xong 100%')) {
                          total += parseFloat(totalApts) || 0;
                        } else {
                          const m = p.match(/\((.*?)\)/);
                          if (m) {
                            const match = m[1].match(/(\d+(\.\d+)?)/);
                            if (match) total += parseFloat(match[1]);
                          }
                        }
                      });
                      return total;
                    };

                    if (type === 'ipc' && selectedCell.teamRawValue) {
                      const teamMax = parseQuantity(selectedCell.teamRawValue, selectedCell.numApts);
                      const currentIpcTotal = parseQuantity(batchList.join(' + '), selectedCell.numApts);
                      const newUnits = parseQuantity(`(${newBatchUnits})`, selectedCell.numApts);
                      
                      if (currentIpcTotal + newUnits > teamMax) {
                        store.openGlobalAlert(`⚠️ Tổng khối lượng IPC (${currentIpcTotal + newUnits}) không được vượt quá số lượng Tổ Đội đã báo cáo (${teamMax}). Vui lòng kiểm tra lại!`);
                        return;
                      }
                    }

                    let formatted = newBatchUnits.trim() 
                      ? `${newBatchName.trim()} (${newBatchUnits.trim()})` 
                      : newBatchName.trim();
                    if (newBatchNote.trim()) {
                      formatted += ` - ${newBatchNote.trim()}`;
                    }
                    setBatchList([...batchList, formatted]);
                    setNewBatchName('');
                    setNewBatchUnits('');
                    setNewBatchNote('');
                  }}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition flex items-center justify-center gap-1"
                >
                  + Thêm đợt này vào danh sách
                </button>
              </div>
            )}

            {/* Quick action buttons */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                <button 
                  onClick={() => {
                    setBatchList([]);
                    handleSaveCell('');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-xs font-bold rounded-xl transition"
                >
                  Xóa rỗng
                </button>
                <div className="flex gap-2">
                  {!(type === 'team' && selectedTeamFilter === 'ALL') && type !== 'ipc' && (
                      <button 
                        onClick={() => handleSaveCell('Xong 100%')} 
                        className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition"
                      >
                        Xong 100%
                      </button>
                    )}
                  <button 
                    onClick={() => {
                      const maxUnits = parseInt(selectedCell?.numApts, 10) || 0;
                      const addUnits = newBatchName.trim() ? (parseInt(newBatchUnits, 10) || 0) : 0;
                      const currentSum = batchList.reduce((sum, b) => {
                        const m = b.match(/\((\d+)[^)]*\)/) || b.match(/(\d+)\s*căn/i) || b.match(/^(\d+)/);
                        return sum + (m ? parseInt(m[1], 10) : 0);
                      }, 0);

                      const rawVal = selectedCell?.rawValue || '';
                      const allParts = rawVal ? rawVal.split(' + ').map(p => p.trim()).filter(Boolean) : [];
                      const otherTeamParts = activeTeam 
                        ? allParts.filter(p => !p.includes(`(${activeTeam})`))
                        : [];
                      const otherTeamUnits = otherTeamParts.reduce((sum, b) => {
                        const m = b.match(/\((\d+)[^)]*\)/) || b.match(/(\d+)\s*căn/i) || b.match(/^(\d+)/);
                        return sum + (m ? parseInt(m[1], 10) : 0);
                      }, 0);

                      const totalProjected = otherTeamUnits + currentSum + addUnits;

                      if (maxUnits > 0 && (totalProjected > maxUnits)) {
                        const remainingAllowed = Math.max(0, maxUnits - (otherTeamUnits + currentSum));
                        const errorMsg = `⚠️ KHÔNG THỂ LƯU (VƯỢT HẠN MỨC): Tổng số căn (${totalProjected} căn) vượt quá số căn tổng của Tầng ${selectedCell.floor} (${maxUnits} căn)! Bạn chỉ có thể nhập tối đa thêm ${remainingAllowed} căn nữa.`;
                        setUnitError(errorMsg);
                        store.openGlobalAlert(errorMsg);
                        return;
                      }

                      let finalVal = batchList.join(' + ');
                      if (newBatchName.trim()) {
                        let formatted = newBatchUnits.trim() 
                          ? `${newBatchName.trim()} (${newBatchUnits.trim()})` 
                          : newBatchName.trim();
                        if (type === 'team' && activeTeam) {
                          formatted = `${formatted} (${activeTeam})`;
                        }
                        finalVal = finalVal ? `${finalVal} + ${formatted}` : formatted;
                      }
                      handleSaveCell(finalVal);
                    }} 
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create BOQ Modal */}
      {isBOQModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl border border-gray-100 overflow-hidden transform transition-all">
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-300" /> Tạo cấu trúc BOQ mới
              </h3>
              <button onClick={() => setIsBOQModalOpen(false)} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBOQ} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Cấp 1: Block <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="VD: BLOCK B, THÁP C, KHU VILLA..."
                  value={boqData.blockName}
                  onChange={(e) => setBoqData({ ...boqData, blockName: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm font-semibold"
                  list="block-suggestions"
                />
                <datalist id="block-suggestions">
                  {matrixBlocks.map((b, i) => <option key={i} value={b.blockName} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Cấp 2: Nhóm <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="VD: CĂN HỘ, MẶT NGOÀI..."
                  value={boqData.groupName}
                  onChange={(e) => setBoqData({ ...boqData, groupName: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm font-semibold"
                  list="group-suggestions"
                />
                <datalist id="group-suggestions">
                  {Array.from(new Set(matrixBlocks.flatMap(b => b.groups.map(g => g.groupName)))).map((g, i) => <option key={i} value={g} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Cấp 3: Hạng mục <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="VD: Xây tường, Lát nền..."
                  value={boqData.itemName}
                  onChange={(e) => setBoqData({ ...boqData, itemName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm font-semibold"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsBOQModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20"
                >
                  Tạo cấu trúc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm Tầng Mới */}
      {isAddFloorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[420px] shadow-2xl border border-gray-100 transform transition-all">
            <h3 className="text-lg font-extrabold text-gray-900 mb-4">Thêm Tầng Mới</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Số lượng tầng cần thêm</label>
                <input
                  type="number"
                  min="1"
                  value={addFloorData.numFloors}
                  onChange={(e) => setAddFloorData({ ...addFloorData, numFloors: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Bắt đầu từ tầng số (tự động tăng)</label>
                <input
                  type="number"
                  value={addFloorData.startNumber}
                  onChange={(e) => setAddFloorData({ ...addFloorData, startNumber: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-700">Số căn mỗi tầng theo Block (Không bắt buộc)</label>
                {matrixBlocks.map((b, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-600 w-24 truncate">{b.blockName}</span>
                    <input
                      type="text"
                      value={addFloorData.blockApts[b.blockName] || ''}
                      onChange={(e) => setAddFloorData({ 
                        ...addFloorData, 
                        blockApts: { ...addFloorData.blockApts, [b.blockName]: e.target.value } 
                      })}
                      placeholder="VD: 10"
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsAddFloorModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  const numFloors = parseInt(addFloorData.numFloors, 10);
                  const startNum = parseInt(addFloorData.startNumber, 10);
                  
                  if (!isNaN(numFloors) && numFloors > 0 && !isNaN(startNum)) {
                    for (let i = 0; i < numFloors; i++) {
                      const floorName = `Tầng ${startNum + i}`;
                      addFloor(floorName);
                      
                      // Cập nhật số căn cho từng block
                      setTimeout(() => {
                        Object.entries(addFloorData.blockApts).forEach(([bName, apts]) => {
                          if (apts.trim() !== '') {
                            store.updateMatrixCell(matrixKey, floorName, `${bName}_numApts`, apts.trim());
                          }
                        });
                      }, 50);
                    }
                  }
                  setIsAddFloorModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl font-bold text-xs text-white shadow-md transition-all active:scale-95 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ẩn / Hiện Cột */}
      {isColumnModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] p-6 w-full max-w-lg shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-gray-900">Quản Lý Ẩn / Hiện Cột</h3>
              </div>
              <button onClick={() => setIsColumnModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold">✕</button>
            </div>

            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 text-xs">
              {matrixBlocks.map((block, bIdx) => (
                <div key={bIdx} className="bg-slate-50 p-3 rounded-xl border border-gray-200 space-y-2">
                  <div className="font-extrabold text-indigo-900 uppercase text-[11px] border-b border-gray-200 pb-1">
                    {block.blockName}
                  </div>
                  {block.groups.map((group, gIdx) => (
                    <div key={gIdx} className="pl-2 space-y-1.5">
                      <div className="font-bold text-orange-800 text-[10px] uppercase">{group.groupName}</div>
                      <div className="grid grid-cols-2 gap-2 pl-2">
                        {group.items.map((cat, iIdx) => {
                          const key = `${block.blockName}_${group.groupName}_${cat}`;
                          const visible = isColumnVisible(key);
                          return (
                            <label key={iIdx} className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-indigo-600 font-medium">
                              <input 
                                type="checkbox" 
                                checked={visible}
                                onChange={() => toggleHideColumn(key)}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className={visible ? 'font-bold text-gray-900' : 'line-through text-gray-400'}>{cat}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 mt-6 pt-3 border-t border-gray-100">
              <button 
                type="button" 
                onClick={() => setHiddenColumns([])} 
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition"
              >
                Hiện Tất Cả Cột
              </button>
              <button 
                type="button" 
                onClick={() => setIsColumnModalOpen(false)} 
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
