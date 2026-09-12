import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { PlusCircle, Trash2, Edit2, Check, X, Calendar, Search, CheckSquare, ChevronDown } from 'lucide-react';

const StatusCombobox = ({ value, onChange, disabled, done }) => {
  const [isOpen, setIsOpen] = useState(false);
  const options = ['0%', '25%', '50%', '75%', '100%', 'FINISH'];
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {isOpen && !disabled && (
        <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]" />
      )}
      <div ref={wrapperRef} className="relative w-full z-50">
        {!isOpen ? (
          <div 
            onClick={() => !disabled && setIsOpen(true)}
            className={`w-full truncate cursor-pointer p-1.5 rounded-lg transition-colors text-sm font-medium ${done ? 'text-zinc-500 line-through' : 'text-slate-700 hover:bg-zinc-100'}`}
          >
            {value || <span className="text-zinc-400 italic font-normal">Trạng thái...</span>}
          </div>
        ) : (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-white border-2 border-black rounded-xl shadow-2xl z-[60] flex flex-col overflow-hidden">
            <div className="relative flex items-center border-b border-zinc-200">
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder="Trạng thái"
                className="w-full px-4 py-3 text-sm font-medium focus:outline-none bg-transparent text-slate-800"
                autoFocus
              />
              {!disabled && (
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="absolute right-3 text-zinc-400 hover:text-black"
                >
                  <ChevronDown className="w-4 h-4 transform rotate-180" />
                </button>
              )}
            </div>
            <div className="bg-[#1a1a1a] w-full max-h-64 overflow-auto py-1">
              {options.map(opt => (
                <div
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className="px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer font-medium transition-colors"
                >
                  {opt}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

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
    <>
      {isOpen && !disabled && (
        <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]" />
      )}
      <div ref={wrapperRef} className="relative w-full z-50">
        {!isOpen ? (
          <div 
            onClick={() => !disabled && setIsOpen(true)}
            className={`w-full cursor-pointer p-1.5 rounded-lg transition-colors text-sm font-medium line-clamp-2 ${done ? 'text-zinc-500 line-through' : 'text-slate-700 hover:bg-zinc-100'}`}
          >
            {value || <span className="text-zinc-400 italic font-normal">Thêm ghi chú...</span>}
          </div>
        ) : (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-black p-4 z-[60]">
            <textarea
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="w-full px-2 py-2 text-sm border-none focus:ring-0 outline-none resize-none h-32 bg-transparent text-slate-800"
              placeholder="Nhập ghi chú..."
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-zinc-100">
              <button onClick={() => { setIsOpen(false); setTempValue(value || ''); }} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">Hủy</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm font-bold text-white bg-black hover:bg-zinc-800 rounded-lg transition-colors">Lưu ghi chú</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default function ChecklistView() {
  const { checklists, projects, addChecklistItem, updateChecklistItem, deleteChecklistItem, openGlobalConfirm, currentUser } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newPriority, setNewPriority] = useState('Bình thường');
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [newDeadline, setNewDeadline] = useState(getTodayString());
  const [newNote, setNewNote] = useState('');
  
  const [editingId, setEditingId] = useState(null);
  const [editTaskName, setEditTaskName] = useState('');
  
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'GIÁM ĐỐC';

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  const isCompleted = (status) => {
    if (!status) return false;
    const s = String(status).trim().toLowerCase();
    return s === 'đã hoàn thành' || s === '100%' || s === 'finish';
  };

  const sortedChecklists = useMemo(() => {
    let list = [...(checklists || [])];
    
    if (projectFilter) {
      list = list.filter(item => item.project_name === projectFilter);
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      list = list.filter(item => 
        (item.task_name || '').toLowerCase().includes(lowerTerm) ||
        (item.status || '').toLowerCase().includes(lowerTerm) ||
        (item.assignee || '').toLowerCase().includes(lowerTerm)
      );
    }
    
    return list.sort((a, b) => {
      const aDone = isCompleted(a.status);
      const bDone = isCompleted(b.status);
      
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;
      
      // If both are same completion state, sort by creation time (descending)
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return bTime - aTime;
    });
  }, [checklists, searchTerm]);

  const handleAdd = () => {
    if (!newTaskName.trim()) return;
    addChecklistItem({
      taskName: newTaskName.trim(),
      projectName: newProjectName,
      assignee: newAssignee.trim(),
      priority: newPriority,
      deadline: newDeadline || null,
      status: '0%',
      note: newNote.trim()
    });
    setNewTaskName('');
    setNewProjectName('');
    setNewAssignee('');
    setNewPriority('Bình thường');
    setNewDeadline(getTodayString());
    setNewNote('');
    setIsAdding(false);
  };

  const handleDelete = (id) => {
    openGlobalConfirm('Bạn có chắc chắn muốn xóa công việc này?', () => {
      deleteChecklistItem(id);
    });
  };

  const handleStatusChange = (id, newStatus) => {
    updateChecklistItem(id, { status: newStatus });
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditTaskName(item.task_name);
  };

  const handleSaveEdit = (id) => {
    if (editTaskName.trim()) {
      updateChecklistItem(id, { task_name: editTaskName.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50">
      <div className="p-4 md:p-6 bg-white border-b border-zinc-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Check list</h1>
            <p className="text-sm text-zinc-500 font-medium mt-1">Quản lý các đầu việc chung của hệ thống</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-zinc-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none bg-white font-medium text-slate-700 min-w-[150px]"
              >
                <option value="">Tất cả công trình</option>
                {projects?.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="pl-9 pr-4 py-2 text-sm border border-zinc-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all w-48"
                />
              </div>
            </div>
            
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 bg-black hover:bg-zinc-800 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Thêm việc
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 pb-32">
        <datalist id="priority-options">
          <option value="Gấp" />
          <option value="Bình thường" />
          <option value="Thấp" />
        </datalist>
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4 w-[20%] min-w-[200px]">Tên công việc</th>
                <th className="px-6 py-4 w-[15%] min-w-[150px]">Tên công trình</th>
                <th className="px-6 py-4 w-[12%] min-w-[130px]">Người phụ trách</th>
                <th className="px-6 py-4 w-[10%] min-w-[120px]">Mức độ</th>
                <th className="px-6 py-4 w-[10%] min-w-[130px]">Deadline</th>
                <th className="px-6 py-4 w-[10%] min-w-[130px]">Trạng thái</th>
                <th className="px-6 py-4 w-[15%] min-w-[150px]">Ghi chú</th>
                <th className="px-6 py-4 w-[8%] min-w-[100px] text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isAdding && (
                <tr className="bg-blue-50/50">
                  <td className="px-6 py-3">
                    <input
                      type="text"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      placeholder="Nhập tên công việc..."
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdd();
                        if (e.key === 'Escape') setIsAdding(false);
                      }}
                    />
                  </td>
                  <td className="px-6 py-3">
                    <select
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">(Không chọn)</option>
                      {projects?.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="text"
                      value={newAssignee}
                      onChange={(e) => setNewAssignee(e.target.value)}
                      placeholder="Người PT"
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="Gấp">Gấp</option>
                      <option value="Bình thường">Bình thường</option>
                      <option value="Thấp">Thấp</option>
                    </select>
                  </td>
                  <td className="px-6 py-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 rounded-lg shadow-sm">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <input
                        type="date"
                        value={newDeadline}
                        onChange={(e) => setNewDeadline(e.target.value)}
                        className="bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-slate-700"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAdd();
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-zinc-400 italic">Mới</span>
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Ghi chú..."
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdd();
                      }}
                    />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={handleAdd} className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setIsAdding(false)} className="p-1.5 bg-zinc-200 text-zinc-600 rounded-md hover:bg-zinc-300">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              
              {sortedChecklists.length === 0 && !isAdding ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center">
                      <CheckSquare className="w-12 h-12 text-zinc-300 mb-3" />
                      <p className="font-medium">Chưa có công việc nào</p>
                      <p className="text-xs text-zinc-400 mt-1">Hãy nhấn "Thêm việc" để bắt đầu checklist</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedChecklists.map((item) => {
                  const done = isCompleted(item.status);
                  
                  return (
                    <tr 
                      key={item.id} 
                      className={`group transition-colors ${done ? 'bg-zinc-200 text-zinc-500' : 'hover:bg-zinc-50'}`}
                    >
                      <td className="px-6 py-4">
                        {editingId === item.id ? (
                          <div className="w-full">
                            <input
                              type="text"
                              value={editTaskName}
                              onChange={(e) => setEditTaskName(e.target.value)}
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
                            {item.task_name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={item.project_name || ''}
                          onChange={(e) => updateChecklistItem(item.id, { project_name: e.target.value })}
                          className={`w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium ${done ? 'text-zinc-500 line-through' : 'text-slate-700'}`}
                        >
                          <option value="">(Không chọn)</option>
                          {projects?.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={item.assignee || ''}
                          onChange={(e) => updateChecklistItem(item.id, { assignee: e.target.value })}
                          placeholder="Người PT"
                          className={`w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium ${done ? 'text-zinc-500 line-through' : 'text-slate-700'}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={item.priority || 'Bình thường'}
                          onChange={(e) => updateChecklistItem(item.id, { priority: e.target.value })}
                          className={`w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold cursor-pointer ${
                            done ? 'text-zinc-500 line-through' : (item.priority === 'Gấp' ? 'text-red-600' : 'text-blue-600')
                          }`}
                        >
                          <option value="Bình thường" className="text-blue-600">Bình thường</option>
                          <option value="Gấp" className="text-red-600">Gấp</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${done ? 'bg-zinc-100 border-zinc-300' : 'bg-white border-zinc-200 shadow-sm'}`}>
                          <Calendar className={`w-4 h-4 ${done ? 'text-zinc-500' : 'text-blue-500'}`} />
                          <input
                            type="date"
                            value={item.deadline ? item.deadline.split('T')[0] : ''}
                            onChange={(e) => updateChecklistItem(item.id, { deadline: e.target.value })}
                            className={`bg-transparent border-none p-0 focus:ring-0 text-sm font-medium ${done ? 'text-zinc-500' : 'text-slate-700'}`}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusCombobox 
                          value={item.status || ''} 
                          onChange={(newVal) => handleStatusChange(item.id, newVal)} 
                          done={done}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <NotePopover 
                          value={item.note || ''} 
                          onChange={(newVal) => updateChecklistItem(item.id, { note: newVal })} 
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
                                title="Sửa tên công việc"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa công việc"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
