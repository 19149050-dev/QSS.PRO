'use client';

import React, { useState, useEffect } from 'react';
import { useStore, useAllowedProjects } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { FileText, Save, CheckCircle2, Plus, Trash2, Upload, X, Loader2 } from 'lucide-react';

export default function ProjectNotesView() {
  const { projectNotes, updateProjectNote, activeProject, setActiveProject } = useStore();
  const projects = useAllowedProjects();
  
  const [selectedProject, setSelectedProject] = useState(
    (activeProject && projects.some(p => p.name === activeProject)) 
      ? activeProject 
      : projects[0]?.name || ''
  );

  const [currentNotes, setCurrentNotes] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [uploadingIds, setUploadingIds] = useState({});

  // Sync selectedProject with activeProject
  useEffect(() => {
    if (activeProject && activeProject !== selectedProject && projects.some(p => p.name === activeProject)) {
      setSelectedProject(activeProject);
    }
  }, [activeProject, projects, selectedProject]);

  // Load notes for selected project
  useEffect(() => {
    if (selectedProject) {
      const savedNotes = projectNotes[selectedProject];
      if (Array.isArray(savedNotes)) {
        setCurrentNotes(savedNotes);
      } else if (typeof savedNotes === 'string' && savedNotes.trim() !== '') {
        const todayYMD = new Date().toISOString().split('T')[0];
        setCurrentNotes([{ id: `note-${Date.now()}`, date: todayYMD, content: savedNotes }]);
      } else {
        setCurrentNotes([]);
      }
      setIsSaved(false);
    }
  }, [selectedProject, projectNotes]);

  const handleSave = () => {
    if (selectedProject) {
      updateProjectNote(selectedProject, currentNotes);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleProjectSelect = (projName) => {
    setSelectedProject(projName);
    setActiveProject(projName);
  };

  const addNoteRow = () => {
    const today = new Date().toISOString().split('T')[0];
    setCurrentNotes([...currentNotes, { id: `note-${Date.now()}`, date: today, content: '', files: [] }]);
  };

  const updateNoteDate = (id, newDate) => {
    setCurrentNotes(currentNotes.map(note => note.id === id ? { ...note, date: newDate } : note));
  };

  const updateNoteContent = (id, newContent) => {
    setCurrentNotes(currentNotes.map(note => note.id === id ? { ...note, content: newContent } : note));
  };

  const addNoteFile = (id, fileData) => {
    setCurrentNotes(currentNotes.map(note => {
      if (note.id === id) {
        const existingFiles = note.files || (note.file ? [note.file] : []);
        return { ...note, files: [...existingFiles, fileData] };
      }
      return note;
    }));
  };

  const removeNoteFile = (id, filePathToRemove) => {
    setCurrentNotes(currentNotes.map(note => {
      if (note.id === id) {
        const existingFiles = note.files || (note.file ? [note.file] : []);
        return { ...note, files: existingFiles.filter(f => f.path !== filePathToRemove) };
      }
      return note;
    }));
  };

  const handleFileUpload = async (id, files) => {
    if (!files || files.length === 0) return;
    
    setUploadingIds(prev => ({ ...prev, [id]: true }));
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${selectedProject}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-notes')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('project-notes').getPublicUrl(filePath);
        addNoteFile(id, { name: file.name, url: data.publicUrl, path: filePath });
      }
    } catch (error) {
      console.error('Lỗi upload file:', error);
      alert('Không thể tải file lên. Vui lòng kiểm tra lại cấu hình Supabase Storage.');
    } finally {
      setUploadingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleFileDelete = async (id, fileData) => {
    if (fileData?.path) {
      supabase.storage.from('project-notes').remove([fileData.path]).catch(console.error);
      removeNoteFile(id, fileData.path);
    } else {
      // Fallback for old single string files
      setCurrentNotes(currentNotes.map(note => note.id === id ? { ...note, file: null, files: [] } : note));
    }
  };

  const deleteNoteRow = (id) => {
    setCurrentNotes(currentNotes.filter(note => note.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative w-full">
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-10 shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                GHI CHÚ CÔNG TRÌNH
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-0.5">
                Ghi chép và lưu trữ thông tin cho từng dự án
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50 p-4 md:p-6 lg:p-8">
        <div className="flex flex-row gap-6 w-full h-full">
          {/* Cột danh sách dự án */}
          <div className="w-64 md:w-80 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Danh sách Dự án</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {projects.map((proj) => {
                const notes = projectNotes[proj.name];
                const hasNotes = Array.isArray(notes) ? notes.length > 0 : (typeof notes === 'string' && notes.trim() !== '');
                return (
                  <button
                    key={proj.id}
                    onClick={() => handleProjectSelect(proj.name)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      selectedProject === proj.name
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    } border`}
                  >
                    <div className="truncate">{proj.name}</div>
                    <div className="text-xs font-normal text-slate-400 mt-1 truncate">
                      {hasNotes ? 'Đã có ghi chú' : 'Chưa có ghi chú'}
                    </div>
                  </button>
                );
              })}
              {projects.length === 0 && (
                <div className="text-center p-4 text-sm text-slate-500">Chưa có dự án nào</div>
              )}
            </div>
          </div>

          {/* Cột khung nhập ghi chú */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">
                Ghi chú: {selectedProject}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={addNoteRow}
                  disabled={!selectedProject}
                  className="px-4 py-2 bg-white text-emerald-600 border border-emerald-200 font-bold text-sm rounded-xl hover:bg-emerald-50 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Thêm hàng
                </button>
                <button
                  onClick={handleSave}
                  disabled={!selectedProject}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-emerald-200"
                >
                  {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {isSaved ? 'Đã lưu' : 'Lưu ghi chú'}
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-0">
              {selectedProject ? (
                <div className="w-full min-w-[600px]">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="sticky top-0 bg-white z-10 shadow-sm border-b border-slate-200">
                      <tr>
                        <th className="p-3 font-bold text-slate-600 w-32 border-r border-slate-200">Ngày</th>
                        <th className="p-3 font-bold text-slate-600 border-r border-slate-200">Nội dung ghi chú</th>
                        <th className="p-3 font-bold text-slate-600 w-48 border-r border-slate-200">File đính kèm (PDF)</th>
                        <th className="p-3 font-bold text-slate-600 w-16 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentNotes.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400">
                            Chưa có ghi chú nào. Hãy bấm "Thêm hàng" để bắt đầu ghi chú.
                          </td>
                        </tr>
                      ) : (
                        currentNotes.map((note) => (
                          <tr key={note.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="p-0 border-r border-slate-100 align-top">
                              <input
                                type="date"
                                value={note.date && note.date.includes('/') ? note.date.split('/').reverse().join('-') : note.date}
                                onChange={(e) => updateNoteDate(note.id, e.target.value)}
                                className="w-full h-full p-3 bg-transparent outline-none focus:bg-emerald-50/30 text-slate-700 font-medium"
                              />
                            </td>
                            <td className="p-0 border-r border-slate-100 align-top">
                              <textarea
                                value={note.content}
                                onChange={(e) => updateNoteContent(note.id, e.target.value)}
                                className="w-full h-full min-h-[80px] p-3 bg-transparent outline-none focus:bg-emerald-50/30 text-slate-700 resize-y"
                                placeholder="Nhập nội dung..."
                              />
                            </td>
                            <td className="p-3 border-r border-slate-100 align-top">
                              <div className="flex flex-col gap-2">
                                {(note.files || (note.file ? [note.file] : [])).map((f, i) => (
                                  <div key={i} className="flex items-center justify-between bg-emerald-50 text-emerald-700 p-2 rounded-lg border border-emerald-200">
                                    <a href={typeof f === 'string' ? '#' : f.url} target="_blank" rel="noopener noreferrer" className="truncate text-xs font-semibold max-w-[120px] hover:underline" title={typeof f === 'string' ? f : f.name}>
                                      {typeof f === 'string' ? f : f.name}
                                    </a>
                                    <button 
                                      onClick={() => handleFileDelete(note.id, f)}
                                      className="text-emerald-600 hover:text-emerald-800 p-1"
                                      title="Xóa file"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}

                                {uploadingIds[note.id] ? (
                                  <div className="flex items-center justify-center gap-2 p-2 rounded-lg text-emerald-600 bg-emerald-50 text-xs font-medium h-[38px]">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang tải lên...
                                  </div>
                                ) : (
                                  <label className="cursor-pointer flex items-center justify-center gap-2 p-2 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-emerald-600 transition-colors text-xs font-medium h-[38px] w-full">
                                    <Upload className="w-4 h-4" />
                                    Tải file
                                    <input 
                                      type="file" 
                                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" 
                                      multiple
                                      className="hidden" 
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                          handleFileUpload(note.id, Array.from(e.target.files));
                                        }
                                      }} 
                                    />
                                  </label>
                                )}
                              </div>
                            </td>
                            <td className="p-3 align-top text-center">
                              <button
                                onClick={() => deleteNoteRow(note.id)}
                                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors mx-auto"
                                title="Xóa ghi chú này"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-8">
                  <FileText className="w-12 h-12 mb-3 text-slate-300" />
                  <p>Vui lòng chọn một dự án để xem hoặc thêm ghi chú.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
