import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuickEntryModal({ isOpen, onClose, projectName, matrixKey, rawBlocks }) {
  const store = useStore();
  const paymentMatrix = store.paymentMatrix[matrixKey] || [];
  const isTeamMode = matrixKey?.endsWith('_team');
  const project = store.projects?.find(p => p.name === projectName);
  const projectTeams = project?.teams || [];
  
  const [selectedFloors, setSelectedFloors] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [activeGroupKey, setActiveGroupKey] = useState(null);

  // Initialize active group
  useEffect(() => {
    if (isOpen && rawBlocks.length > 0 && rawBlocks[0].groups.length > 0) {
      setActiveGroupKey(`${rawBlocks[0].blockName}___${rawBlocks[0].groups[0].groupName}`);
    }
  }, [isOpen, rawBlocks]);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedFloors([]);
      setSelectedItems([]);
      setInputValue(isTeamMode && projectTeams.length > 0 ? (projectTeams[0].teamName || projectTeams[0].team_name) : '');
    }
  }, [isOpen, isTeamMode]);

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

  const handleSelectAllItems = () => {
    if (selectedItems.length === allItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(allItems.map(i => i.key));
    }
  };

  const toggleItem = (itemKey) => {
    setSelectedItems(prev => 
      prev.includes(itemKey) ? prev.filter(k => k !== itemKey) : [...prev, itemKey]
    );
  };

  const handleSubmit = () => {
    if (selectedFloors.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 tầng');
      return;
    }
    if (selectedItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 hạng mục');
      return;
    }
    if (!inputValue.trim()) {
      toast.error('Vui lòng nhập giá trị');
      return;
    }

    // Call updateMatrixCell for each selected floor and item
    selectedFloors.forEach(floor => {
      selectedItems.forEach(itemKey => {
        store.updateMatrixCell(matrixKey, floor, itemKey, inputValue.trim(), '');
      });
    });

    toast.success(`Đã cập nhật ${selectedFloors.length * selectedItems.length} ô thành công!`);
    onClose();
  };

  const activeBlockObj = rawBlocks.find(b => activeGroupKey?.startsWith(`${b.blockName}___`));
  const activeGroupObj = activeBlockObj?.groups.find(g => activeGroupKey === `${activeBlockObj.blockName}___${g.groupName}`);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              Nhập Nhanh (Hàng Loạt)
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Dự án: <span className="font-bold text-indigo-600">{projectName}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
          
          {/* Left Column: Floors */}
          <div className="flex-1 flex flex-col border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm h-[400px]">
            <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
              <span className="font-bold text-sm text-gray-800">1. Chọn Tầng ({selectedFloors.length}/{paymentMatrix.length})</span>
              <button onClick={handleSelectAllFloors} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                {selectedFloors.length === paymentMatrix.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {paymentMatrix.map((row, idx) => (
                <label key={row.floor || idx} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${selectedFloors.includes(row.floor) ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50 border border-transparent'}`}>
                  <input 
                    type="checkbox"
                    checked={selectedFloors.includes(row.floor)}
                    onChange={() => toggleFloor(row.floor)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className={`text-sm font-bold ${selectedFloors.includes(row.floor) ? 'text-indigo-900' : 'text-gray-700'}`}>{row.floor}</span>
                </label>
              ))}
              {paymentMatrix.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">Chưa có tầng nào trong dự án này.</div>
              )}
            </div>
          </div>

          {/* Column 2: Groups */}
          <div className="flex-1 flex flex-col border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm h-[400px]">
            <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
              <span className="font-bold text-sm text-gray-800">2. Chọn Nhóm</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {rawBlocks.map(block => (
                <div key={block.blockName} className="mb-4">
                  <div className="px-2 py-1 bg-gray-100/80 rounded-md text-[10px] tracking-wider font-black text-gray-500 uppercase mb-2">
                    {block.blockName}
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
                        className={`flex justify-between items-center px-2 py-2 mb-1 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-indigo-100 border border-indigo-200' : 'hover:bg-gray-50 border border-transparent'}`}
                      >
                        <div className="flex items-center gap-2">
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
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <span className={`text-xs font-bold ${isActive ? 'text-indigo-900' : 'text-gray-700'}`}>{group.groupName}</span>
                        </div>
                        {selectedCount > 0 && (
                          <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full font-bold">{selectedCount}/{keys.length}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              {rawBlocks.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">Chưa có hạng mục nào.</div>
              )}
            </div>
          </div>

          {/* Column 3: Items */}
          <div className="flex-1 flex flex-col border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm h-[400px]">
            <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
              <span className="font-bold text-sm text-gray-800">3. Chọn Đầu Mục</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50/30">
              {activeGroupObj ? (
                <>
                  <div className="px-2 pb-2 mb-2 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase">{activeGroupObj.groupName}</span>
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
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
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
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className={`text-sm font-bold ${selectedItems.includes(itemKey) ? 'text-indigo-900' : 'text-gray-700'}`}>{item}</span>
                      </label>
                    );
                  })}
                </>
              ) : (
                <div className="p-4 text-center text-sm text-gray-400 mt-10">
                  Vui lòng chọn một nhóm ở cột bên trái
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Value input */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="border border-gray-200 rounded-2xl p-4 bg-white shadow-sm flex-1">
              <span className="font-bold text-sm text-gray-800 mb-3 block">4. Giá trị nhập</span>
              <p className="text-xs text-gray-500 mb-4">
                Giá trị này sẽ được rải đồng loạt vào các ô giao giữa (Tầng) và (Đầu mục) bạn đã tích chọn.
              </p>
              
              {isTeamMode ? (
                <select 
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all cursor-pointer"
                >
                  {projectTeams.length === 0 && <option value="">Chưa có tổ đội nào</option>}
                  {projectTeams.map((t, idx) => {
                    const name = t.teamName || t.team_name;
                    return <option key={idx} value={name}>{name}</option>;
                  })}
                </select>
              ) : (
                <input 
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="VD: đợt 1, 100%, ..."
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                />
              )}
            </div>
            
            <button 
              onClick={handleSubmit}
              disabled={selectedFloors.length === 0 || selectedItems.length === 0 || !inputValue.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
            >
              <Check className="w-5 h-5" /> Thực Thi Nhập Nhanh
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
