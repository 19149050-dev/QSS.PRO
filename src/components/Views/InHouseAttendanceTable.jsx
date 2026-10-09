import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Calendar, Archive, Lock, RotateCcw } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

const formatCurrency = (val) => { if (!val) return ""; const num = parseInt(val.toString().replace(/[^\d]/g, ""), 10); return isNaN(num) ? "" : new Intl.NumberFormat("vi-VN").format(num); };

export default function InHouseAttendanceTable({ projectName }) {
  const inHouseSheets = useStore(state => state.inHouseSheets);
  const addInHouseRow = useStore(state => state.addInHouseRow);
  const updateInHouseRow = useStore(state => state.updateInHouseRow);
  const updateInHouseDay = useStore(state => state.updateInHouseDay);
  const deleteInHouseRow = useStore(state => state.deleteInHouseRow);

  const teams = useStore(state => state.teams);
  const sheet = inHouseSheets[projectName] || { rows: [] };
  const rows = sheet.rows || [];

  // Auto-sync in-house members from teams
  React.useEffect(() => {
    const inHouseTeams = teams.filter(t => {
      const type = t.teamType || t.team_type || '';
      if (type.toLowerCase() !== 'cơ hữu') return false;
      let projs = [];
      if (Array.isArray(t.projects) && t.projects.length > 0) {
        projs = t.projects.flatMap(p => typeof p === 'string' ? p.split(',') : p).map(s => s.trim()).filter(Boolean);
      } else {
        const nameStr = t.projectName || t.project_name || '';
        projs = nameStr.split(',').map(s => s.trim()).filter(Boolean);
      }
      return projs.includes(projectName);
    });
    
    const members = inHouseTeams.flatMap(t => t.members || []).map(m => m.name).filter(Boolean);
    const uniqueMembers = [...new Set(members)];
    
    // Cleanup any existing duplicates caused by previous bug
    const seen = new Set();
    const duplicatesToRemove = [];
    rows.forEach(r => {
      if (seen.has(r.workerName)) {
        duplicatesToRemove.push(r.id);
      } else {
        seen.add(r.workerName);
      }
    });
    
    if (duplicatesToRemove.length > 0) {
      duplicatesToRemove.forEach(id => {
        deleteInHouseRow(projectName, id);
      });
    }

    uniqueMembers.forEach(memberName => {
      if (!rows.find(r => r.workerName === memberName)) {
        addInHouseRow(projectName, memberName);
      }
    });
  }, [teams, projectName, rows, addInHouseRow]);

  // Default to this week's Monday
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  });
  const [duration, setDuration] = useState(4); // 4 weeks default

  const [archives, setArchives] = useState([]);
  const [selectedArchiveId, setSelectedArchiveId] = useState('');
  const [isSavingArchive, setIsSavingArchive] = useState(false);

  React.useEffect(() => {
    const fetchArchives = async () => {
      if (!projectName) return;
      const { data, error } = await supabase
        .from('in_house_archives')
        .select('*')
        .eq('project_name', projectName)
        .order('created_at', { ascending: false });
      if (data) setArchives(data);
    };
    fetchArchives();
  }, [projectName]);

  const selectedArchive = useMemo(() => archives.find(a => a.id === selectedArchiveId) || null, [archives, selectedArchiveId]);
  const isArchivedView = !!selectedArchive;
  const archivedDateStrs = useMemo(() => {
    const dates = new Set();
    archives.forEach(a => {
      if (a.rows_data && Array.isArray(a.rows_data)) {
        a.rows_data.forEach(r => {
          if (r.days) {
            Object.entries(r.days).forEach(([dateStr, val]) => {
              if (val === 'X' || val === 'X/2') {
                dates.add(dateStr);
              }
            });
          }
        });
      }
    });
    return dates;
  }, [archives]);
  const displayRows = isArchivedView ? selectedArchive.rows_data : rows;
  const effectiveStartDate = isArchivedView ? selectedArchive.start_date : startDate;
  const effectiveDuration = isArchivedView ? selectedArchive.duration_label : duration;

  const monthOptions = useMemo(() => {
    const opts = [];
    const d = new Date();
    for (let i = -1; i <= 4; i++) {
      const tempDate = new Date(d.getFullYear(), d.getMonth() + i, 1);
      const m = tempDate.getMonth() + 1;
      const y = tempDate.getFullYear();
      opts.push({
        label: `Tháng ${m}/${y}`,
        value: `month_${y}_${m}`
      });
    }
    return opts;
  }, []);

  const [editingPriceRowId, setEditingPriceRowId] = useState(null);
  const editingRow = rows.find(r => r.id === editingPriceRowId);
  const [tempPrice, setTempPrice] = useState('');
  const [tempBonus, setTempBonus] = useState('');

  const openPriceModal = (row) => {
    setEditingPriceRowId(row.id);
    setTempPrice(formatCurrency(row.unitPrice) || '');
    setTempBonus(formatCurrency(row.bonus) || '');
  };

  const closePriceModal = () => {
    setEditingPriceRowId(null);
    setTempPrice('');
    setTempBonus('');
  };

  const savePrice = () => {
    if (editingPriceRowId && !isArchivedView) {
      const rawPrice = tempPrice.replace(/[^\d]/g, '');
      const rawBonus = tempBonus.replace(/[^\d]/g, '');
      updateInHouseRow(projectName, editingPriceRowId, 'unitPrice', rawPrice);
      updateInHouseRow(projectName, editingPriceRowId, 'bonus', rawBonus);
    }
    closePriceModal();
  };

  const openGlobalConfirm = useStore(state => state.openGlobalConfirm);
  const openGlobalAlert = useStore(state => state.openGlobalAlert);

  const handleFinalize = () => {
    openGlobalConfirm('Bạn có chắc muốn chốt dữ liệu hiện tại vào lịch sử? (Sau khi chốt có thể xem lại ở mục Lịch sử)', async () => {
      setIsSavingArchive(true);
      try {
        const payload = {
          project_name: projectName,
          start_date: startDate,
          duration_label: String(duration),
          rows_data: rows
        };
        const { data, error } = await supabase
          .from('in_house_archives')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        setArchives([data, ...archives]);
        openGlobalAlert('Đã chốt và lưu vào lịch sử thành công!');
      } catch (error) {
        console.error(error);
        openGlobalAlert('Có lỗi xảy ra khi lưu lịch sử!');
      } finally {
        setIsSavingArchive(false);
      }
    });
  };

  const handleUndoArchive = () => {
    if (!selectedArchiveId) return;
    openGlobalConfirm('Bạn có chắc muốn hoàn tác và XÓA lịch sử chốt này? Dữ liệu sẽ trở về trạng thái có thể chỉnh sửa ở mục (Chưa chốt).', async () => {
      setIsSavingArchive(true);
      try {
        const { error } = await supabase
          .from('in_house_archives')
          .delete()
          .eq('id', selectedArchiveId);
        if (error) throw error;
        setArchives(archives.filter(a => a.id !== selectedArchiveId));
        setSelectedArchiveId('');
        openGlobalAlert('Đã hoàn tác chốt thành công!');
      } catch (error) {
        console.error(error);
        openGlobalAlert('Có lỗi xảy ra khi hoàn tác!');
      } finally {
        setIsSavingArchive(false);
      }
    });
  };

    // Generate date columns
  const dateColumns = [];
  const start = new Date(effectiveStartDate);
  const getDaysInMonth = (dateStr) => {
    const d = new Date(dateStr);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  };
  const totalDays = typeof effectiveDuration === 'string' && effectiveDuration.startsWith('month_') 
    ? new Date(effectiveDuration.split('_')[1], effectiveDuration.split('_')[2], 0).getDate() 
    : effectiveDuration === 'month' ? getDaysInMonth(effectiveStartDate) : effectiveDuration * 7;
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    dateColumns.push({
      dateStr,
      label: dayNames[dayOfWeek],
      shortDate: `${d.getDate()}/${d.getMonth() + 1}`
    });
  }

  const calculateTotal = (row) => {
    let daysCount = 0;
    dateColumns.forEach(col => {
      const val = row.days?.[col.dateStr] || '';
      if (val === 'X') daysCount += 1;
      else if (val === 'X/2') daysCount += 0.5;
    });
    const price = parseFloat(row.unitPrice) || 0;
    const bonus = parseFloat(row.bonus) || 0;
    return (daysCount * price) + bonus;
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
        <h2 className="text-base font-extrabold text-slate-800">Điểm danh cơ hữu</h2>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-600">Ngày BĐ:</span>
            <input 
              type="date"
              value={effectiveStartDate}
              disabled={isArchivedView}
              onChange={(e) => {
                let selectedDate = e.target.value;
                let nextDuration = duration;
                if (typeof duration === 'string' && duration.startsWith('month_')) {
                  nextDuration = 4;
                  setDuration(4);
                }
                if (typeof nextDuration === 'number') {
                  const d = new Date(selectedDate);
                  const day = d.getDay();
                  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                  const monday = new Date(d.setDate(diff));
                  selectedDate = monday.toISOString().split('T')[0];
                }
                setStartDate(selectedDate);
              }}
              className={`bg-transparent border-none outline-none text-sm font-bold cursor-pointer ${isArchivedView ? 'text-slate-400' : 'text-slate-800'}`}
            />
          </div>

          <div className="flex items-center bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-200">
            <select
              value={effectiveDuration}
              disabled={isArchivedView}
              onChange={(e) => {
                const val = e.target.value;
                if (val.startsWith('month_')) {
                  const [_, year, month] = val.split('_');
                  setStartDate(`${year}-${month.padStart(2, '0')}-01`);
                  setDuration(val);
                } else {
                  setDuration(parseInt(val, 10));
                  const d = new Date(effectiveStartDate);
                  const day = d.getDay();
                  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                  const monday = new Date(d.setDate(diff));
                  setStartDate(monday.toISOString().split('T')[0]);
                }
              }}
              className={`bg-transparent border-none outline-none text-sm font-bold cursor-pointer w-28 text-center ${isArchivedView ? 'text-slate-400' : 'text-indigo-700'}`}
            >
              <option value={1}>1 Tuần</option>
              <option value={2}>2 Tuần</option>
              <option value={4}>4 Tuần</option>
              <hr />
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center bg-amber-50 px-2 py-1.5 rounded-xl border border-amber-200">
            <Archive className="w-4 h-4 text-amber-600 mr-2" />
            <select
              value={selectedArchiveId}
              onChange={(e) => setSelectedArchiveId(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-bold text-amber-800 cursor-pointer max-w-[150px]"
            >
              <option value="">(Chưa chốt)</option>
              {archives.map(a => {
                const d = new Date(a.created_at);
                const ds = `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
                return <option key={a.id} value={a.id}>Chốt {ds}</option>;
              })}
            </select>
          </div>

          {!isArchivedView ? (
            <button
              onClick={handleFinalize}
              disabled={isSavingArchive}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {isSavingArchive ? 'Đang lưu...' : 'Chốt tuần'}
            </button>
          ) : (
            <button
              onClick={handleUndoArchive}
              disabled={isSavingArchive}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              {isSavingArchive ? 'Đang xóa...' : 'Hoàn tác'}
            </button>
          )}
        </div>
      </div>

            <div className="overflow-x-auto pb-4">
        <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-indigo-50 border-b-2 border-indigo-200 shadow-sm">
              <th className="px-3 py-1.5 font-bold text-indigo-900 border-r border-indigo-100 min-w-[250px] w-[250px] sticky left-0 bg-indigo-50 z-10 shadow-[1px_0_0_#c7d2fe]">Tên CN</th>
              {dateColumns.map(col => (
                <th key={col.dateStr} className={`px-1 py-1.5 font-bold text-indigo-900 border-r border-slate-200 text-center min-w-[40px] w-auto ${col.label === 'CN' ? 'bg-rose-50/50 text-rose-600' : ''}`}>
                  <div className="flex flex-col items-center leading-tight">
                    <span>{col.label}</span>
                    <span className="text-[10px] opacity-70 font-medium">{col.shortDate}</span>
                  </div>
                </th>
              ))}
              <th className="px-3 py-1.5 font-bold text-indigo-900 border-r border-indigo-100 text-right w-[120px] min-w-[120px]">Đơn giá</th>
              <th className="px-3 py-1.5 font-bold text-indigo-900 border-r border-indigo-100 text-right w-[110px] min-w-[110px]">Cộng thêm</th>
              <th className="px-3 py-1.5 font-bold text-indigo-900 border-r border-indigo-100 text-right w-[120px] min-w-[120px]">Thành tiền</th>
              <th className="px-2 py-1.5 font-bold text-indigo-900 text-center w-10">Xóa</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                <td className="px-3 py-1.5 border-r border-slate-100 sticky left-0 bg-white shadow-[1px_0_0_#f1f5f9] group-hover/tr:bg-slate-50">
                  <input
                    type="text"
                    value={row.workerName}
                    disabled={isArchivedView}
                    onChange={(e) => updateInHouseRow(projectName, row.id, 'workerName', e.target.value)}
                    className={`w-full bg-transparent outline-none font-medium ${isArchivedView ? 'text-slate-500 cursor-not-allowed' : 'text-slate-800'}`}
                    placeholder="Tên công nhân..."
                  />
                </td>
                {dateColumns.map(col => {
                  const val = row.days?.[col.dateStr] || '';
                  let displayVal = '-';
                  if (val === 'X') displayVal = 'X';
                  if (val === 'X/2') displayVal = 'X/2';
                  
                  const isColLocked = isArchivedView || archivedDateStrs.has(col.dateStr);

                  let bgClass = '';
                  let textClass = 'text-slate-300';
                  
                  if (val === 'X') {
                    bgClass = isColLocked ? 'bg-slate-200' : 'bg-indigo-100 hover:bg-indigo-200';
                    textClass = isColLocked ? 'text-slate-500' : 'text-indigo-800';
                  } else if (val === 'X/2') {
                    bgClass = isColLocked ? 'bg-slate-200' : 'bg-amber-100 hover:bg-amber-200';
                    textClass = isColLocked ? 'text-slate-500' : 'text-amber-700';
                  } else if (col.label === 'CN') {
                    bgClass = isColLocked ? 'bg-slate-100' : 'bg-rose-50/30 hover:bg-rose-100/50';
                  } else {
                    bgClass = isColLocked ? 'bg-transparent' : 'bg-transparent hover:bg-slate-50';
                  }
                  
                  return (
                    <td 
                      key={col.dateStr} 
                      className={`px-0.5 py-1.5 border-r border-slate-200 text-center transition select-none ${bgClass} ${isColLocked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                      onClick={() => {
                        if (isColLocked) return;
                        let nextVal = '';
                        if (val === '') nextVal = 'X';
                        else if (val === 'X') nextVal = 'X/2';
                        else nextVal = '';
                        updateInHouseDay(projectName, row.id, col.dateStr, nextVal);
                      }}
                    >
                      <div className={`w-full text-center font-black uppercase text-[11px] ${textClass}`}>
                        {displayVal}
                      </div>
                    </td>
                  );
                })}
                <td className={`px-3 py-1.5 border-r border-slate-100 text-right transition ${isArchivedView ? 'cursor-not-allowed text-slate-500' : 'cursor-pointer hover:bg-slate-100'}`} onClick={() => { if (!isArchivedView) openPriceModal(row); }}>
                  <div className="w-full text-right bg-transparent outline-none font-bold">
                    {row.unitPrice ? formatCurrency(row.unitPrice) : '0'}
                  </div>
                </td>
                <td className={`px-3 py-1.5 border-r border-slate-100 text-right transition ${isArchivedView ? 'cursor-not-allowed text-slate-500' : 'cursor-pointer hover:bg-slate-100'}`} onClick={() => { if (!isArchivedView) openPriceModal(row); }}>
                  <div className={`w-full text-right bg-transparent outline-none font-bold ${isArchivedView ? 'text-slate-500' : 'text-emerald-600'}`}>
                    {row.bonus ? formatCurrency(row.bonus) : '0'}
                  </div>
                </td>
                <td className={`px-3 py-1.5 border-r border-slate-100 text-right font-bold ${isArchivedView ? 'text-slate-600' : 'text-rose-600'}`}>
                  {calculateTotal(row).toLocaleString('vi-VN')}
                </td>
                <td className="px-2 py-1.5 text-center">
                  {!isArchivedView ? (
                    <button
                      onClick={() => deleteInHouseRow(projectName, row.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <Lock className="w-4 h-4 text-slate-300 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
            
            {displayRows.length === 0 && (
              <tr>
                <td colSpan={dateColumns.length + 4} className="px-4 py-8 text-center text-slate-400 text-sm">
                  {isArchivedView ? 'Không có dữ liệu trong lịch sử này.' : 'Chưa có dữ liệu điểm danh cơ hữu.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-xs text-slate-500">
        * Hướng dẫn: Click vào các ô ngày để chuyển đổi: <strong>X</strong> (1 công) ➜ <strong>X/2</strong> (nửa công) ➜ <strong>Trống</strong> (vắng).
      </div>
      {editingPriceRowId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800">Nhập lương & Cộng thêm</h3>
              <button onClick={closePriceModal} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Công nhân</label>
                <div className="font-bold text-slate-900">{editingRow?.workerName}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Đơn giá (VNĐ)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={tempPrice}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d]/g, '');
                      setTempPrice(formatCurrency(raw));
                    }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') savePrice();
                      if (e.key === 'Escape') closePriceModal();
                    }}
                    className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-bold text-lg"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 pointer-events-none">₫</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Cộng thêm (VNĐ)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={tempBonus}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d]/g, '');
                      setTempBonus(formatCurrency(raw));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') savePrice();
                      if (e.key === 'Escape') closePriceModal();
                    }}
                    className="w-full pl-3 pr-10 py-2.5 bg-white border border-emerald-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-emerald-700 font-bold text-lg"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-emerald-500 pointer-events-none">₫</span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
              <button onClick={closePriceModal} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition">Hủy</button>
              <button onClick={savePrice} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
