import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { 
  PlusCircle, Trash2, Edit2, Check, X, Calendar, Search, 
  CheckSquare, FolderGit2, ArrowUpDown, Building2, DoorOpen, 
  Layers, LayoutGrid 
} from 'lucide-react';

const NotePopover = ({ value, onChange, disabled, done }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value || '');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        if (isOpen) {
          onChange(tempValue);
          setIsOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, tempValue, onChange]);

  useEffect(() => {
    setTempValue(value || '');
  }, [value]);

  const handleSave = () => {
    onChange(tempValue);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full z-10">
      {!isOpen ? (
        <div 
          onClick={() => !disabled && setIsOpen(true)}
          className={`w-full truncate cursor-pointer p-1.5 rounded-lg transition-colors text-sm font-medium ${done ? 'text-zinc-500 line-through' : 'text-slate-700 hover:bg-zinc-100'}`}
        >
          {value || <span className="text-zinc-400 italic font-normal">Thêm ghi chú...</span>}
        </div>
      ) : (
        <div className="absolute top-0 left-0 w-64 bg-white border border-zinc-300 rounded-lg shadow-xl z-20 flex flex-col overflow-hidden">
          <textarea
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            disabled={disabled}
            placeholder="Nhập ghi chú..."
            className="w-full h-24 px-3 py-2 text-sm font-medium focus:outline-none resize-none bg-zinc-50"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2 px-3 py-2 bg-zinc-100 border-t border-zinc-200">
            <button 
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-200 rounded-md transition-colors"
            >
              Hủy
            </button>
            <button 
              type="button"
              onClick={handleSave}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Lưu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const stringToColor = (str) => {
  if (!str) return 'text-slate-700';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'text-red-600', 'text-blue-600', 'text-green-600', 'text-orange-600',
    'text-purple-600', 'text-pink-600', 'text-teal-600', 'text-cyan-600',
    'text-indigo-600', 'text-rose-600'
  ];
  return colors[Math.abs(hash) % colors.length];
};

export const getDrawingType = (item) => {
  if (item?.drawing_type) return item.drawing_type;
  const name = (item?.drawing_name || '').toUpperCase();
  if (name.includes('CH+HL') || name.includes('HL+CH') || name.includes('CH + HL') || name.includes('HL + CH')) {
    return 'CH+HL';
  }
  if (name.includes('HÀNH LANG') || /\bHL\b/.test(name) || name.includes(' HL ') || name.endsWith(' HL') || name.startsWith('HL ')) {
    return 'Hành lang';
  }
  if (name.includes('CĂN HỘ') || /\bCH\b/.test(name) || name.includes(' CH ') || name.endsWith(' CH') || name.startsWith('CH ')) {
    return 'Căn hộ';
  }
  return 'Khác';
};

const typeBadgeStyles = {
  'Hành lang': 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/80',
  'Căn hộ': 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/80',
  'CH+HL': 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100/80',
  'Khác': 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200/80',
};

import AddShopDrawingModal from '@/components/Modals/AddShopDrawingModal';

export default function ShopView() {
  const { 
    projects,
    shopDrawings,
    addShopDrawing,
    updateShopDrawing,
    deleteShopDrawing,
    openGlobalConfirm
  } = useStore();

  const [filterProject, setFilterProject] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [sortBy, setSortBy] = useState('AREA_CH_FIRST');
  const [searchTerm, setSearchTerm] = useState('');

  const [isAdding, setIsAdding] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editDrawingName, setEditDrawingName] = useState('');

  const naturalCompare = (a, b) => {
    return String(a || '').localeCompare(String(b || ''), undefined, { numeric: true, sensitivity: 'base' });
  };

  const filteredDrawings = useMemo(() => {
    let result = [...(shopDrawings || [])];
    if (filterProject !== 'ALL') {
      result = result.filter(s => s.project_name === filterProject);
    }
    if (filterType !== 'ALL') {
      result = result.filter(s => getDrawingType(s) === filterType);
    }
    if (searchTerm.trim() !== '') {
      const lower = searchTerm.toLowerCase();
      result = result.filter(s => 
        (s.drawing_name || '').toLowerCase().includes(lower) || 
        (s.code || '').toLowerCase().includes(lower) ||
        (s.note || '').toLowerCase().includes(lower) ||
        getDrawingType(s).toLowerCase().includes(lower)
      );
    }
    
    // Sort logic
    return result.sort((a, b) => {
      // If showing all projects, keep projects grouped together first
      if (filterProject === 'ALL') {
        const projA = a.project_name || '';
        const projB = b.project_name || '';
        const cmpProj = projA.localeCompare(projB);
        if (cmpProj !== 0) return cmpProj;
      }

      if (sortBy === 'AREA_CH_FIRST' || sortBy === 'AREA_HL_FIRST') {
        const orderCH = { 'Căn hộ': 1, 'Hành lang': 2, 'CH+HL': 3, 'Khác': 4 };
        const orderHL = { 'Hành lang': 1, 'Căn hộ': 2, 'CH+HL': 3, 'Khác': 4 };
        const orderMap = sortBy === 'AREA_CH_FIRST' ? orderCH : orderHL;
        
        const rankA = orderMap[getDrawingType(a)] || 99;
        const rankB = orderMap[getDrawingType(b)] || 99;
        if (rankA !== rankB) return rankA - rankB;

        // In same area, sort naturally by code, then by drawing name
        const codeCmp = naturalCompare(a.code, b.code);
        if (codeCmp !== 0) return codeCmp;
        return naturalCompare(a.drawing_name, b.drawing_name);
      }

      if (sortBy === 'CODE_ASC') {
        const codeCmp = naturalCompare(a.code, b.code);
        if (codeCmp !== 0) return codeCmp;
        return naturalCompare(a.drawing_name, b.drawing_name);
      }

      if (sortBy === 'DATE_DESC') {
        const dateA = new Date(a.approval_date || 0);
        const dateB = new Date(b.approval_date || 0);
        if (dateB - dateA !== 0) return dateB - dateA;
      }

      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [shopDrawings, filterProject, filterType, searchTerm, sortBy]);

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditDrawingName(item.drawing_name);
  };

  const handleSaveEdit = (id) => {
    if (!editDrawingName.trim()) return;
    updateShopDrawing(id, { drawing_name: editDrawingName.trim() });
    setEditingId(null);
  };

  const handleDelete = (id) => {
    openGlobalConfirm('Bạn có chắc chắn muốn xóa bản vẽ shop này không?', () => {
      deleteShopDrawing(id);
    });
  };

  const isCompleted = (status) => {
    return status === 'Đã hủy' || status === 'Không duyệt';
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa]">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-8 py-6 flex-shrink-0 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-md">
            <FolderGit2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Bản vẽ Shop</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Quản lý danh sách các bản vẽ shop công trình đã duyệt</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all shadow-sm"
          >
            <option value="ALL">Tất cả công trình</option>
            {projects?.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all shadow-sm"
          >
            <option value="ALL">Tất cả khu vực</option>
            <option value="Hành lang">Hành lang</option>
            <option value="Căn hộ">Căn hộ</option>
            <option value="CH+HL">CH+HL</option>
            <option value="Khác">Khác</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all shadow-sm"
          >
            <option value="AREA_CH_FIRST">Sắp xếp: Căn hộ 1 khu, HL 1 khu</option>
            <option value="AREA_HL_FIRST">Sắp xếp: HL 1 khu, Căn hộ 1 khu</option>
            <option value="DEFAULT">Sắp xếp: Mặc định (Thời gian)</option>
            <option value="CODE_ASC">Sắp xếp: Mã bản vẽ (A-Z)</option>
            <option value="DATE_DESC">Sắp xếp: Ngày duyệt (Mới nhất)</option>
          </select>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black w-64 shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 ${
              isAdding 
                ? 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300' 
                : 'bg-black text-white hover:bg-zinc-800 hover:shadow-md'
            }`}
          >
            {isAdding ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            {isAdding ? 'Hủy' : 'Thêm bản vẽ'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80">
                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-[14%]">Ngày duyệt</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-[9%]">Code</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-[22%]">Tên bản vẽ</th>
                <th 
                  onClick={() => {
                    setSortBy(prev => prev === 'AREA_CH_FIRST' ? 'AREA_HL_FIRST' : 'AREA_CH_FIRST');
                  }}
                  className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-[12%] cursor-pointer hover:text-blue-600 transition-colors select-none group/th"
                  title="Bấm để sắp xếp theo khu vực (Căn hộ / Hành lang)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Khu vực</span>
                    <ArrowUpDown className={`w-3.5 h-3.5 transition-colors ${
                      sortBy === 'AREA_CH_FIRST' || sortBy === 'AREA_HL_FIRST' 
                        ? 'text-blue-600' 
                        : 'text-zinc-300 group-hover/th:text-zinc-500'
                    }`} />
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-[14%]">Tên công trình</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-[11%]">Trạng thái</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-[11%]">Ghi chú</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center w-[7%]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredDrawings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-400">
                      <FolderGit2 className="w-12 h-12 mb-3 text-zinc-300" />
                      <p className="text-sm font-medium text-zinc-500">Chưa có dữ liệu bản vẽ shop</p>
                      <p className="text-xs text-zinc-400 mt-1">Hãy nhấn "Thêm bản vẽ" để bắt đầu</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDrawings.map((item, index) => {
                  const currentType = getDrawingType(item);
                  const prevType = index > 0 ? getDrawingType(filteredDrawings[index - 1]) : null;
                  const isNewGroup = (sortBy === 'AREA_CH_FIRST' || sortBy === 'AREA_HL_FIRST') && (index === 0 || currentType !== prevType);
                  const done = isCompleted(item.status);
                  
                  return (
                    <React.Fragment key={item.id}>
                      {isNewGroup && (
                        <tr className="bg-slate-100/70 border-y border-zinc-200 select-none">
                          <td colSpan="8" className="px-6 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border shadow-xs ${typeBadgeStyles[currentType] || typeBadgeStyles['Khác']}`}>
                                {currentType === 'Căn hộ' && <Building2 className="w-3.5 h-3.5" />}
                                {currentType === 'Hành lang' && <DoorOpen className="w-3.5 h-3.5" />}
                                {currentType === 'CH+HL' && <Layers className="w-3.5 h-3.5" />}
                                {currentType === 'Khác' && <LayoutGrid className="w-3.5 h-3.5" />}
                                KHU: {currentType.toUpperCase()}
                              </span>
                              <span className="text-xs font-bold text-zinc-500">
                                • {filteredDrawings.filter(x => getDrawingType(x) === currentType).length} bản vẽ
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr 
                        className={`group transition-colors ${done ? 'bg-zinc-100 text-zinc-500' : 'hover:bg-zinc-50'}`}
                      >
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${done ? 'bg-zinc-100 border-zinc-300' : 'bg-white border-zinc-200 shadow-sm'}`}>
                          <Calendar className={`w-4 h-4 ${done ? 'text-zinc-500' : 'text-blue-500'}`} />
                          <input
                            type="date"
                            value={item.approval_date ? item.approval_date.split('T')[0] : ''}
                            onChange={(e) => updateShopDrawing(item.id, { approval_date: e.target.value })}
                            className={`bg-transparent border-none p-0 focus:ring-0 text-sm font-medium ${done ? 'text-zinc-500' : 'text-slate-700'}`}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={item.code || ''}
                          onChange={(e) => updateShopDrawing(item.id, { code: e.target.value })}
                          placeholder="Mã BV"
                          className={`w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium ${done ? 'text-zinc-500' : 'text-slate-700'}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        {editingId === item.id ? (
                          <div className="w-full">
                            <input
                              type="text"
                              value={editDrawingName}
                              onChange={(e) => setEditDrawingName(e.target.value)}
                              className="w-full px-3 py-1.5 border border-blue-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(item.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                          </div>
                        ) : (
                          <div 
                            className={`font-medium ${done ? 'line-through text-zinc-500' : 'text-slate-900'} cursor-pointer hover:text-blue-600`}
                            onClick={() => !done && handleStartEdit(item)}
                            title="Nhấp đúp hoặc nhấn nút sửa để đổi tên"
                          >
                            {item.drawing_name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const currentType = getDrawingType(item);
                          return (
                            <div className="relative inline-block w-full min-w-[105px]">
                              <select
                                value={currentType}
                                disabled={done}
                                onChange={(e) => updateShopDrawing(item.id, { drawing_type: e.target.value })}
                                className={`w-full appearance-none px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/10 text-center ${
                                  done 
                                    ? 'bg-zinc-100 text-zinc-400 border-zinc-200 line-through' 
                                    : (typeBadgeStyles[currentType] || typeBadgeStyles['Khác'])
                                }`}
                              >
                                <option value="Hành lang" className="bg-white text-amber-700 font-bold">Hành lang</option>
                                <option value="Căn hộ" className="bg-white text-blue-700 font-bold">Căn hộ</option>
                                <option value="CH+HL" className="bg-white text-purple-700 font-bold">CH+HL</option>
                                <option value="Khác" className="bg-white text-zinc-600 font-bold">Khác</option>
                              </select>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={item.project_name || ''}
                          onChange={(e) => updateShopDrawing(item.id, { project_name: e.target.value })}
                          className={`w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold ${done ? 'text-zinc-500 line-through' : stringToColor(item.project_name)}`}
                        >
                          <option value="">(Không chọn)</option>
                          {projects?.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={item.status || 'Đã duyệt'}
                          onChange={(e) => updateShopDrawing(item.id, { status: e.target.value })}
                          className={`w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold cursor-pointer ${
                            done ? 'text-zinc-500 line-through' : 
                            (item.status === 'Chưa trình duyệt' ? 'text-orange-600' : 
                            (item.status === 'Đang trình duyệt' ? 'text-blue-600' : 'text-green-600'))
                          }`}
                        >
                          <option value="Đã duyệt" className="text-green-600">Đã duyệt</option>
                          <option value="Đang trình duyệt" className="text-blue-600">Đang trình duyệt</option>
                          <option value="Chưa trình duyệt" className="text-orange-600">Chưa trình duyệt</option>
                          <option value="Không duyệt" className="text-red-600">Không duyệt</option>
                          <option value="Đã hủy" className="text-zinc-500">Đã hủy</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <NotePopover 
                          value={item.note || ''} 
                          onChange={(newVal) => updateShopDrawing(item.id, { note: newVal })} 
                          done={done}
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 transition-opacity">
                          {editingId === item.id ? (
                            <>
                              <button onClick={() => handleSaveEdit(item.id)} className="p-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm" title="Lưu">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg shadow-sm" title="Hủy">
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleStartEdit(item)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Sửa tên bản vẽ"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa bản vẽ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddShopDrawingModal 
        isOpen={isAdding} 
        onClose={() => setIsAdding(false)} 
        defaultProject={filterProject} 
      />
    </div>
  );
}
