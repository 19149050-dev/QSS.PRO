import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuickEntryModal({ isOpen, onClose, projectName, matrixKey, rawBlocks }) {
  const store = useStore();
  const paymentMatrix = store.paymentMatrix[matrixKey] || [];
  const isTeamMode = matrixKey?.endsWith('_team');
  const project = store.projects?.find(p => p.name?.trim() === projectName?.trim());

  // Aggregate project teams from store.teams and project.teams
  const projectTeams = useMemo(() => {
    const allTeams = store.teams || [];
    const matched = allTeams.filter(t => {
      if (!projectName) return true;
      if (t.projectName?.trim() === projectName.trim() || t.project?.trim() === projectName.trim()) return true;
      if (Array.isArray(t.projects) && t.projects.includes(projectName)) return true;
      if (project?.id && t.projectId === project.id) return true;
      return false;
    });

    if (matched.length > 0) return matched;
    if (project?.teams && project.teams.length > 0) return project.teams;
    return allTeams;
  }, [store.teams, projectName, project]);

  const [selectedFloors, setSelectedFloors] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [inputValue, setInputValue] = useState(''); // Used for Team Mode
  const [selectedTeam, setSelectedTeam] = useState(''); // Team selection in standard mode
  const [customTeamName, setCustomTeamName] = useState(''); // Custom team name if custom selected
  const [batchName, setBatchName] = useState('');
  const [batchUnits, setBatchUnits] = useState('');
  const [batchNote, setBatchNote] = useState('');
  const [activeGroupKey, setActiveGroupKey] = useState(null);

  // Initialize active group to null (don't auto-select)
  useEffect(() => {
    if (isOpen) {
      setActiveGroupKey(null);
    }
  }, [isOpen, rawBlocks]);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedFloors([]);
      setSelectedItems([]);
      setSelectedTeam('');
      setCustomTeamName('');
      const defaultTeam = projectTeams.length > 0
        ? (typeof projectTeams[0] === 'string' ? projectTeams[0] : (projectTeams[0].teamName || projectTeams[0].team_name || projectTeams[0].name || ''))
        : '';
      setInputValue(isTeamMode ? defaultTeam : '');
      setBatchName('');
      setBatchUnits('');
      setBatchNote('');
    }
  }, [isOpen, isTeamMode, projectTeams]);

  useEffect(() => {
    if (isTeamMode && projectTeams.length > 0 && !inputValue) {
      const defaultTeam = typeof projectTeams[0] === 'string' ? projectTeams[0] : (projectTeams[0].teamName || projectTeams[0].team_name || projectTeams[0].name || '');
      setInputValue(defaultTeam);
    }
  }, [isTeamMode, projectTeams, inputValue]);

  const activeBlockObj = rawBlocks.find(b => activeGroupKey?.startsWith(`${b.blockName}___`));
  const activeGroupObj = activeBlockObj?.groups.find(g => activeGroupKey === `${activeBlockObj.blockName}___${g.groupName}`);

  const isApartmentGroup = activeGroupObj?.groupName?.toUpperCase().includes('CĂN HỘ');
  const activeBlockName = activeBlockObj?.blockName;
  const totalApts = activeBlockName ? paymentMatrix.reduce((sum, row) => sum + (parseInt(row.items?.[`${activeBlockName}_numApts`] || row.numApts) || 0), 0) : 0;
  const selectedApts = activeBlockName ? selectedFloors.reduce((sum, floor) => {
    const row = paymentMatrix.find(f => f.floor === floor);
    return sum + (parseInt(row?.items?.[`${activeBlockName}_numApts`] || row?.numApts) || 0);
  }, 0) : 0;

  useEffect(() => {
    if (!isTeamMode && isOpen) {
      setBatchUnits('');
    }
  }, [activeGroupKey, isApartmentGroup, isTeamMode, isOpen]);

  if (!isOpen) return null;

  // Flatten items for selection
  const allItems = [];
  rawBlocks.forEach(block => {
    block.groups.forEach(group => {
      group.items.forEach(item => {
        allItems.push({
          key: `${block.blockName}___${group.groupName}___${item}`,
          label: `${block.blockName} - ${group.groupName} - ${item}`,
          block: block.blockName,
          group: group.groupName,
          item: item
        });
      });
    });
  });

  const handleSelectAllFloors = () => {
    if (selectedFloors.length === paymentMatrix.length) {
      setSelectedFloors([]);
    } else {
      setSelectedFloors(paymentMatrix.map(f => f.floor));
    }
  };

  const toggleFloor = (floor) => {
    setSelectedFloors(prev => 
      prev.includes(floor) ? prev.filter(f => f !== floor) : [...prev, floor]
    );
  };

  const toggleItem = (itemKey) => {
    setSelectedItems(prev => 
      prev.includes(itemKey) ? prev.filter(k => k !== itemKey) : [...prev, itemKey]
    );
  };

  const finalTeamName = isTeamMode 
    ? (inputValue === '__CUSTOM__' ? customTeamName.trim() : inputValue.trim())
    : (selectedTeam === '__CUSTOM__' ? customTeamName.trim() : selectedTeam.trim());

  const handleSubmit = () => {
    if (selectedFloors.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 tầng');
      return;
    }
    if (selectedItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 hạng mục');
      return;
    }

    if (!finalTeamName) {
      toast.error('Vui lòng chọn hoặc nhập Tổ đội');
      return;
    }
    
    if (!isTeamMode) {
      if (!batchName.trim()) {
        toast.error('Vui lòng nhập Mã Đợt / IPC');
        return;
      }
      if (!batchUnits.trim() && !isApartmentGroup) {
        toast.error('Vui lòng nhập Số căn / Khối lượng');
        return;
      }
    }

    // Call updateMatrixCell for each selected floor and item
    selectedFloors.forEach(floor => {
      const floorData = paymentMatrix.find(f => f.floor === floor);

      selectedItems.forEach(selectedKey => {
        const [blockName, groupName, itemName] = selectedKey.split('___');
        const blockNumApts = floorData?.items?.[`${blockName}_numApts`];
        const floorApts = blockNumApts ? String(blockNumApts) : (floorData?.numApts ? String(floorData.numApts) : '');
        const matrixItemKey = `${blockName}_${groupName}_${itemName}`;
        
        const existingVal = floorData?.items?.[matrixItemKey] || '';
        let valToSave = '';

        if (isTeamMode) {
          const teamName = finalTeamName;
          if (teamName) {
            if (existingVal) {
              const batches = existingVal.split('+').map(p => p.trim()).filter(Boolean);
              valToSave = batches.map(b => {
                if (b.includes(`(${teamName})`)) return b;
                return `${b} (${teamName})`;
              }).join(' + ');
            } else {
              valToSave = '';
            }
          }
        } else {
          let finalUnits = batchUnits.trim();
          if (!finalUnits && isApartmentGroup) {
            finalUnits = floorApts;
          }
          
          let newBatch = batchName.trim();
          if (finalUnits) newBatch += ` (${finalUnits})`;
          if (batchNote.trim()) newBatch += ` - ${batchNote.trim()}`;
          if (finalTeamName) newBatch += ` (${finalTeamName})`;
          
          if (existingVal && !existingVal.includes(newBatch)) {
            valToSave = existingVal + ' + ' + newBatch;
          } else {
            valToSave = existingVal ? existingVal : newBatch;
          }
        }

        store.updateMatrixCell(matrixKey, floor, matrixItemKey, valToSave, '');
      });
    });

    toast.success(`Đã cập nhật ${selectedFloors.length * selectedItems.length} ô thành công!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-[1400px] max-h-[95vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              Nhập Nhanh (Hàng Loạt)
            </h2>
            <p className="text-base text-gray-500 font-medium mt-1">
              Dự án: <span className="font-bold text-indigo-600">{projectName}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col lg:flex-row gap-6">
          
          {/* Left Column: Floors */}
          <div className="flex-1 flex flex-col border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm h-[500px]">
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
              <span className="font-bold text-base text-gray-800">1. Chọn Tầng ({selectedFloors.length}/{paymentMatrix.length})</span>
              <button onClick={handleSelectAllFloors} className="text-sm font-bold text-indigo-600 hover:text-indigo-800">
                {selectedFloors.length === paymentMatrix.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {paymentMatrix.map((row, idx) => (
                <label key={row.floor || idx} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${selectedFloors.includes(row.floor) ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50 border border-transparent'}`}>
                  <input 
                    type="checkbox"
                    checked={selectedFloors.includes(row.floor)}
                    onChange={() => toggleFloor(row.floor)}
                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className={`text-base font-bold ${selectedFloors.includes(row.floor) ? 'text-indigo-900' : 'text-gray-700'}`}>{row.floor}</span>
                </label>
              ))}
              {paymentMatrix.length === 0 && (
                <div className="p-4 text-center text-base text-gray-500">Chưa có tầng nào trong dự án này.</div>
              )}
            </div>
          </div>

          {/* Column 2: Groups */}
          <div className="flex-1 flex flex-col border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm h-[500px]">
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
              <span className="font-bold text-base text-gray-800">2. Chọn Nhóm</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {rawBlocks.map(block => (
                <div key={block.blockName} className="mb-4">
                  <div className="px-3.5 py-3 bg-slate-800 rounded-xl text-base tracking-wide font-black text-white uppercase mb-3 shadow-md border-b-4 border-slate-900 flex items-center gap-2">
                    <span className="text-slate-400">🏢</span> <span>{block.blockName}</span>
                  </div>
                  {block.groups.map(group => {
                    const groupKey = `${block.blockName}___${group.groupName}`;
                    const isActive = activeGroupKey === groupKey;
                    const keys = group.items.map(i => `${block.blockName}___${group.groupName}___${i}`);
                    const selectedCount = keys.filter(k => selectedItems.includes(k)).length;
                    const isAllGroupSelected = keys.length > 0 && selectedCount === keys.length;
                    
                    return (
                      <div 
                        key={group.groupName} 
                        onClick={() => setActiveGroupKey(groupKey)}
                        className={`flex justify-between items-center px-3 py-2.5 mb-1 rounded-xl cursor-pointer transition-colors ${isActive ? 'bg-indigo-100 border border-indigo-200' : 'hover:bg-gray-50 border border-transparent'}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input 
                            type="checkbox"
                            checked={isAllGroupSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (isAllGroupSelected) {
                                setSelectedItems(prev => prev.filter(k => !keys.includes(k)));
                              } else {
                                setSelectedItems(prev => Array.from(new Set([...prev, ...keys])));
                              }
                            }}
                            className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <span className={`text-sm font-bold ${isActive ? 'text-indigo-900' : 'text-gray-700'}`}>{group.groupName}</span>
                        </div>
                        {selectedCount > 0 && (
                          <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full font-bold">{selectedCount}/{keys.length}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              {rawBlocks.length === 0 && (
                <div className="p-4 text-center text-base text-gray-500">Chưa có hạng mục nào.</div>
              )}
            </div>
          </div>

          {/* Column 3: Items */}
          <div className="flex-1 flex flex-col border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm h-[500px]">
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
              <span className="font-bold text-base text-gray-800">3. Chọn Đầu Mục</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50/30">
              {activeGroupObj ? (
                <>
                  <div className="px-2 pb-2 mb-2 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-500 uppercase">{activeGroupObj.groupName}</span>
                    <button 
                      onClick={() => {
                        const keys = activeGroupObj.items.map(i => `${activeBlockObj.blockName}___${activeGroupObj.groupName}___${i}`);
                        const isAllSelected = keys.length > 0 && keys.every(k => selectedItems.includes(k));
                        if (isAllSelected) {
                          setSelectedItems(prev => prev.filter(k => !keys.includes(k)));
                        } else {
                          setSelectedItems(prev => Array.from(new Set([...prev, ...keys])));
                        }
                      }} 
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      Chọn tất cả
                    </button>
                  </div>
                  {activeGroupObj.items.map(item => {
                    const itemKey = `${activeBlockObj.blockName}___${activeGroupObj.groupName}___${item}`;
                    return (
                      <label key={itemKey} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors shadow-xs ${selectedItems.includes(itemKey) ? 'bg-indigo-50 border border-indigo-100' : 'bg-white hover:bg-gray-50 border border-gray-200'}`}>
                        <input 
                          type="checkbox"
                          checked={selectedItems.includes(itemKey)}
                          onChange={() => toggleItem(itemKey)}
                          className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className={`text-base font-bold ${selectedItems.includes(itemKey) ? 'text-indigo-900' : 'text-gray-700'}`}>{item}</span>
                      </label>
                    );
                  })}
                </>
              ) : (
                <div className="p-4 text-center text-base text-gray-400 mt-14">
                  Vui lòng chọn một nhóm ở cột bên trái
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Value input */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm flex-1">
              <span className="font-bold text-base text-gray-800 mb-2 block">4. Giá trị nhập</span>
              <p className="text-xs text-gray-500 mb-4">
                Giá trị này sẽ được rải đồng loạt vào các ô giao giữa (Tầng) và (Đầu mục) bạn đã tích chọn.
              </p>
              
              {isTeamMode ? (
                <div>
                  <span className="text-xs font-bold text-gray-700 block mb-1 uppercase">
                    CHỌN TỔ ĐỘI <span className="text-rose-500 font-bold">*</span>
                  </span>
                  <select 
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all cursor-pointer bg-white text-base"
                  >
                    <option value="">-- Chọn Tổ Đội --</option>
                    {projectTeams.map((t, idx) => {
                      const name = typeof t === 'string' ? t : (t.teamName || t.team_name || t.name);
                      return <option key={idx} value={name}>{name}</option>;
                    })}
                    <option value="__CUSTOM__">+ Nhập tổ đội khác...</option>
                  </select>
                  {inputValue === '__CUSTOM__' && (
                    <input 
                      type="text"
                      value={customTeamName}
                      onChange={e => setCustomTeamName(e.target.value)}
                      placeholder="Nhập tên tổ đội..."
                      className="mt-2 w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-base"
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-gray-700 block mb-1 uppercase">
                      CHỌN TỔ ĐỘI <span className="text-rose-500 font-bold">*</span>
                    </span>
                    <select 
                      value={selectedTeam}
                      onChange={e => setSelectedTeam(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all cursor-pointer bg-white text-base"
                    >
                      <option value="">-- Chọn Tổ Đội --</option>
                      {projectTeams.map((t, idx) => {
                        const name = typeof t === 'string' ? t : (t.teamName || t.team_name || t.name);
                        return <option key={idx} value={name}>{name}</option>;
                      })}
                      <option value="__CUSTOM__">+ Nhập tổ đội khác...</option>
                    </select>
                    {selectedTeam === '__CUSTOM__' && (
                      <input 
                        type="text"
                        value={customTeamName}
                        onChange={e => setCustomTeamName(e.target.value)}
                        placeholder="Nhập tên tổ đội mới..."
                        className="mt-2 w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-base"
                      />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-500 block mb-1">MÃ ĐỢT / IPC</span>
                    <input 
                      type="text"
                      value={batchName}
                      onChange={e => setBatchName(e.target.value)}
                      placeholder="VD: Đợt 1, IPC 01"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-base"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-500 block mb-1">SỐ CĂN / KHỐI LƯỢNG</span>
                    <input 
                      type="text"
                      value={batchUnits}
                      onChange={e => setBatchUnits(e.target.value)}
                      placeholder="VD: 5 căn, 50%"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-base"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-500 block mb-1">GHI CHÚ (Tùy chọn)</span>
                    <input 
                      type="text"
                      value={batchNote}
                      onChange={e => setBatchNote(e.target.value)}
                      placeholder="VD: Tường nứt, thiếu vật tư..."
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-base"
                    />
                  </div>
                  {isApartmentGroup && (
                    <div className="text-sm font-medium text-emerald-700 bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 flex items-start gap-2 shadow-sm">
                      <div className="mt-0.5 text-emerald-500">💡</div>
                      <div>
                        Vì đây là hạng mục <b>Căn hộ</b>, hệ thống sẽ tự động điền <b>số lượng căn hộ tương ứng của từng tầng</b> vào các ô dữ liệu nếu bạn <b>để trống ô Số căn / Khối lượng</b>. <br/>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          <span className="bg-white px-2.5 py-1 rounded-md border border-emerald-100 shadow-sm text-xs">Tổng dự án: <b className="text-emerald-800">{totalApts} căn</b></span>
                          <span className="bg-white px-2.5 py-1 rounded-md border border-emerald-100 shadow-sm text-xs">Các tầng đang chọn: <b className="text-emerald-800">{selectedApts} căn</b></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <button 
              onClick={handleSubmit}
              disabled={
                selectedFloors.length === 0 || 
                selectedItems.length === 0 || 
                !finalTeamName ||
                (!isTeamMode && (!batchName.trim() || (!isApartmentGroup && !batchUnits.trim())))
              }
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/20 text-lg"
            >
              <Check className="w-6 h-6" /> Thực Thi Nhập Nhanh
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

