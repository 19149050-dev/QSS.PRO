'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useStore, useAllowedProjects, canUserManageTeamMembers } from '@/store/useStore';
import AddTeamModal from '@/components/Modals/AddTeamModal';
import AddMemberModal from '@/components/Modals/AddMemberModal';
import toast from 'react-hot-toast';
import { 
  Users, 
  UserCheck,
  Plus, 
  Search, 
  Phone, 
  Trash2, 
  Edit2, 
  ChevronRight, 
  User, 
  Printer, 
  FileSpreadsheet,
  HardHat,
  ShieldAlert,
  CheckCircle2,
  Lock,
  X
} from 'lucide-react';
import { exportToExcel, exportWorkersToExcel } from '@/utils/exportUtils';

// Helper định dạng chức vụ (mặc định hoặc 'Công nhân' -> 'CN')
export const formatPosition = (pos) => {
  if (!pos || pos === '-') return 'CN';
  const trimmed = String(pos).trim();
  if (trimmed.toLowerCase() === 'công nhân' || trimmed.toLowerCase() === 'cn') return 'CN';
  return trimmed;
};

export default function ManageTeamsPage() {
  const { teams, deleteTeam, activeProject, deleteTeamMember } = useStore();
  const currentUser = useStore(state => state.currentUser);
  const allProjects = useStore(state => state.projects);
  const projects = useAllowedProjects();
  const selectedProject = activeProject || projects[0]?.name || 'SUNHOME';
  const isGsht = currentUser?.role?.toUpperCase() === 'GSHT';

  // Navigation tab: 'teams' (Quản lý tổ đội) | 'team-workers' (Công nhân các đội) | 'all-workers' (Toàn thể công nhân)
  const [activeTab, setActiveTab] = useState('teams');

  // Tab 1 (Quản lý tổ đội) states
  const [teamSearchTerm, setTeamSearchTerm] = useState('');
  const [teamTypeFilter, setTeamTypeFilter] = useState('ALL');
  const [teamProjectFilter, setTeamProjectFilter] = useState('ALL');

  // Tab 2 (Công nhân các đội) states
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [teamWorkerSearchTerm, setTeamWorkerSearchTerm] = useState('');

  // Tab 3 (Toàn thể công nhân) states
  const [allWorkerSearchTerm, setAllWorkerSearchTerm] = useState('');
  const [allWorkerProjectFilter, setAllWorkerProjectFilter] = useState('ALL');
  const [allWorkerTeamFilter, setAllWorkerTeamFilter] = useState('ALL');
  const [allWorkerExpiryFilter, setAllWorkerExpiryFilter] = useState('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [activeTeamIdForMember, setActiveTeamIdForMember] = useState(null);
  const [memberToEdit, setMemberToEdit] = useState(null);

  // For GSHT, restrict visible teams strictly to those assigned to the GSHT's projects.
  // Other roles (Admin, Giám đốc, QS, CHT) see all teams.
  const visibleTeams = useMemo(() => {
    if (!isGsht) return teams;
    return teams.filter(t => canUserManageTeamMembers(currentUser, t, allProjects));
  }, [teams, isGsht, currentUser, allProjects]);

  // Set default selectedTeamId
  useEffect(() => {
    if (visibleTeams.length > 0) {
      if (!selectedTeamId || !visibleTeams.some(t => t.id === selectedTeamId)) {
        // Prefer a team with members, else the first team
        const teamWithMembers = visibleTeams.find(t => t.members && t.members.length > 0);
        setSelectedTeamId(teamWithMembers ? teamWithMembers.id : visibleTeams[0].id);
      }
    } else {
      setSelectedTeamId(null);
    }
  }, [visibleTeams, selectedTeamId]);

  // Expiry date checker
  const getExpiryStatus = (dateStr) => {
    if (!dateStr || dateStr.toLowerCase() === 'chưa có' || dateStr === '-') return 'safe';
    let parts = [];
    if (dateStr.includes('-')) parts = dateStr.split('-');
    else if (dateStr.includes('/')) parts = dateStr.split('/');
    
    if (parts.length === 3) {
      let year, month, day;
      if (parts[0].length === 4) [year, month, day] = parts;
      else [day, month, year] = parts;
      const expiry = new Date(year, month - 1, day);
      const today = new Date();
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) return 'danger';
      return 'safe';
    }
    return 'safe'; 
  };

  const checkMemberHasWarning = (m) => {
    return (
      getExpiryStatus(m.insuranceExpiry) === 'danger' ||
      getExpiryStatus(m.safetyCardExpiry) === 'danger' ||
      getExpiryStatus(m.healthCertificate) === 'danger' ||
      getExpiryStatus(m.contract) === 'danger'
    );
  };

  // Filtered teams for Tab 1 (Quản lý tổ đội)
  const filteredTeams = useMemo(() => {
    return visibleTeams.filter(t => {
      const matchSearch = 
        !teamSearchTerm ||
        (t.teamName && t.teamName.toLowerCase().includes(teamSearchTerm.toLowerCase())) ||
        (t.leaderName && t.leaderName.toLowerCase().includes(teamSearchTerm.toLowerCase())) ||
        (t.phone && t.phone.includes(teamSearchTerm)) ||
        (t.projects && t.projects.some(p => p.toLowerCase().includes(teamSearchTerm.toLowerCase()))) ||
        (t.projectName && t.projectName.toLowerCase().includes(teamSearchTerm.toLowerCase()));

      const matchType = 
        teamTypeFilter === 'ALL' || 
        (t.teamType && t.teamType.toLowerCase() === teamTypeFilter.toLowerCase());

      const teamProjs = Array.isArray(t.projects) && t.projects.length > 0 
        ? t.projects 
        : (t.projectName ? t.projectName.split(',').map(s => s.trim()).filter(Boolean) : []);

      const matchProject = 
        teamProjectFilter === 'ALL' ||
        teamProjs.some(p => {
          if (!p) return false;
          const pLower = p.trim().toLowerCase();
          const fLower = teamProjectFilter.trim().toLowerCase();
          return pLower === fLower || pLower.includes(fLower) || fLower.includes(pLower);
        });

      return matchSearch && matchType && matchProject;
    });
  }, [visibleTeams, teamSearchTerm, teamTypeFilter, teamProjectFilter]);

  // Selected team for Tab 2
  const selectedTeam = useMemo(() => {
    return visibleTeams.find(t => t.id === selectedTeamId) || visibleTeams[0] || null;
  }, [visibleTeams, selectedTeamId]);

  // Filtered members of selected team in Tab 2
  const filteredSelectedTeamMembers = useMemo(() => {
    if (!selectedTeam || !selectedTeam.members) return [];
    if (!teamWorkerSearchTerm.trim()) return selectedTeam.members;
    const term = teamWorkerSearchTerm.toLowerCase();
    return selectedTeam.members.filter(m => 
      (m.name && m.name.toLowerCase().includes(term)) ||
      (m.cccd && m.cccd.toLowerCase().includes(term)) ||
      (m.position && m.position.toLowerCase().includes(term)) ||
      formatPosition(m.position).toLowerCase().includes(term) ||
      (m.address && m.address.toLowerCase().includes(term)) ||
      (m.notes && m.notes.toLowerCase().includes(term))
    );
  }, [selectedTeam, teamWorkerSearchTerm]);

  // Flattened all workers list for Tab 3 & Stats
  const allWorkers = useMemo(() => {
    return visibleTeams.flatMap(t => {
      const teamProjs = Array.isArray(t.projects) && t.projects.length > 0 
        ? t.projects 
        : (t.projectName ? t.projectName.split(',').map(s => s.trim()).filter(Boolean) : []);

      return (t.members || []).map(m => ({
        ...m,
        teamId: t.id,
        teamName: t.teamName || t.name,
        leaderName: t.leaderName,
        leaderPhone: t.phone,
        teamType: t.teamType || 'Thầu phụ',
        teamProjects: teamProjs
      }));
    });
  }, [visibleTeams]);

  // Danh sách toàn bộ các Công trình / Dự án thực tế (kết hợp từ danh mục dự án, tổ đội và công nhân)
  const allAvailableProjects = useMemo(() => {
    const projSet = new Set();
    // 1. Từ danh sách projects trong store
    (projects || []).forEach(p => {
      if (p && p.name) projSet.add(p.name.trim());
    });
    // 2. Từ các tổ đội và thành viên
    (visibleTeams || []).forEach(t => {
      const projs = Array.isArray(t.projects) && t.projects.length > 0 
        ? t.projects 
        : (t.projectName ? t.projectName.split(',').map(s => s.trim()).filter(Boolean) : []);
      projs.forEach(p => {
        if (p && typeof p === 'string') projSet.add(p.trim());
      });
      (t.members || []).forEach(m => {
        if (m.project && typeof m.project === 'string') projSet.add(m.project.trim());
      });
    });
    return Array.from(projSet).filter(Boolean).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [projects, visibleTeams]);

  // Đếm số lượng công nhân theo từng công trình
  const countWorkersInProject = useMemo(() => {
    const map = {};
    allWorkers.forEach(w => {
      const set = new Set();
      (w.teamProjects || []).forEach(p => {
        if (p) set.add(p.trim());
      });
      if (w.project) set.add(w.project.trim());
      set.forEach(p => {
        map[p] = (map[p] || 0) + 1;
      });
    });
    return map;
  }, [allWorkers]);

  // Filtered workers for Tab 3 (Toàn thể công nhân)
  const filteredAllWorkers = useMemo(() => {
    return allWorkers.filter(w => {
      const term = allWorkerSearchTerm.trim().toLowerCase();
      const matchSearch = !term || (
        (w.name && w.name.toLowerCase().includes(term)) ||
        (w.cccd && w.cccd.toLowerCase().includes(term)) ||
        (w.teamName && w.teamName.toLowerCase().includes(term)) ||
        (w.leaderName && w.leaderName.toLowerCase().includes(term)) ||
        (w.address && w.address.toLowerCase().includes(term)) ||
        (w.position && w.position.toLowerCase().includes(term)) ||
        formatPosition(w.position).toLowerCase().includes(term) ||
        (w.notes && w.notes.toLowerCase().includes(term)) ||
        (w.teamProjects && w.teamProjects.some(p => p && p.toLowerCase().includes(term))) ||
        (w.project && w.project.toLowerCase().includes(term))
      );

      const filterP = allWorkerProjectFilter.trim().toLowerCase();
      const matchProject = allWorkerProjectFilter === 'ALL' || (
        (w.teamProjects && w.teamProjects.some(p => {
          if (!p) return false;
          const pLower = p.trim().toLowerCase();
          return pLower === filterP || pLower.includes(filterP) || filterP.includes(pLower);
        })) ||
        (w.project && (() => {
          const mLower = w.project.trim().toLowerCase();
          return mLower === filterP || mLower.includes(filterP) || filterP.includes(mLower);
        })())
      );

      const matchTeam = allWorkerTeamFilter === 'ALL' || w.teamId === allWorkerTeamFilter;

      let matchExpiry = true;
      if (allWorkerExpiryFilter === 'WARNING') {
        matchExpiry = checkMemberHasWarning(w);
      } else if (allWorkerExpiryFilter === 'SAFE') {
        matchExpiry = !checkMemberHasWarning(w);
      }

      return matchSearch && matchProject && matchTeam && matchExpiry;
    });
  }, [allWorkers, allWorkerSearchTerm, allWorkerProjectFilter, allWorkerTeamFilter, allWorkerExpiryFilter]);

  // Counts
  const thauPhuCount = useMemo(() => visibleTeams.filter(t => t.teamType !== 'Cơ hữu').length, [visibleTeams]);
  const coHuuCount = useMemo(() => visibleTeams.filter(t => t.teamType === 'Cơ hữu').length, [visibleTeams]);
  const totalWarningWorkers = useMemo(() => allWorkers.filter(checkMemberHasWarning).length, [allWorkers]);
  const selectedTeamWarningCount = useMemo(() => {
    if (!selectedTeam || !selectedTeam.members) return 0;
    return selectedTeam.members.filter(checkMemberHasWarning).length;
  }, [selectedTeam]);

  // Handlers for Add/Edit
  const handleOpenAdd = () => {
    setTeamToEdit(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (team) => {
    setTeamToEdit(team);
    setIsAddModalOpen(true);
  };

  const handleDeleteTeam = (team) => {
    useStore.getState().openGlobalConfirm(
      `Bạn có chắc chắn muốn xóa tổ đội "${team.teamName}"? Toàn bộ danh sách thành viên của tổ đội này cũng sẽ bị xóa.`,
      () => {
        deleteTeam(team.id);
        if (selectedTeamId === team.id) {
          const remaining = visibleTeams.filter(t => t.id !== team.id);
          setSelectedTeamId(remaining[0]?.id || null);
        }
      }
    );
  };

  const handleOpenAddMember = (teamId) => {
    const targetTeam = teams.find(t => t.id === teamId);
    if (!canUserManageTeamMembers(currentUser, targetTeam, allProjects)) {
      toast.error('Bạn là GSHT không phụ trách công trình của tổ đội này nên không có quyền tạo/thêm thành viên.');
      return;
    }
    setActiveTeamIdForMember(teamId);
    setMemberToEdit(null);
    setIsAddMemberModalOpen(true);
  };

  const handleOpenEditMember = (teamId, member) => {
    const targetTeam = teams.find(t => t.id === teamId);
    if (!canUserManageTeamMembers(currentUser, targetTeam, allProjects)) {
      toast.error('Bạn là GSHT không phụ trách công trình của tổ đội này nên không có quyền sửa thành viên.');
      return;
    }
    setActiveTeamIdForMember(teamId);
    setMemberToEdit(member);
    setIsAddMemberModalOpen(true);
  };

  const handleDeleteMember = (teamId, member) => {
    const targetTeam = teams.find(t => t.id === teamId);
    if (!canUserManageTeamMembers(currentUser, targetTeam, allProjects)) {
      toast.error('Bạn là GSHT không phụ trách công trình của tổ đội này nên không có quyền xóa thành viên.');
      return;
    }
    useStore.getState().openGlobalConfirm(
      `Bạn có chắc chắn muốn xóa thành viên "${member.name}" khỏi tổ đội?`,
      () => {
        deleteTeamMember(teamId, member.id);
      }
    );
  };

  // Export & Print for Tab 1 (Danh sách các tổ đội)
  const handlePrintTeamsTable = () => {
    if (filteredTeams.length === 0) {
      alert("Không có dữ liệu tổ đội để in.");
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const rowsHtml = filteredTeams.map((team, idx) => {
      const projectsStr = Array.isArray(team.projects) ? team.projects.join(', ') : (team.projectName || '-');
      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="text-align: left; font-weight: bold;">${team.teamName || ''}</td>
          <td style="text-align: left;">${team.leaderName || '-'}</td>
          <td style="text-align: center; font-family: monospace;">${team.phone || '-'}</td>
          <td style="text-align: center;">${team.teamType || 'Thầu phụ'}</td>
          <td style="text-align: left;">${projectsStr}</td>
          <td style="text-align: center; font-weight: bold;">${team.members?.length || 0}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Danh Sách Tổ Đội Thi Công</title>
          <style>
            @media print {
              @page { size: landscape; margin: 10mm 8mm; }
            }
            * { box-sizing: border-box; }
            body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 10px; color: #111; }
            .header-box { text-align: center; margin-bottom: 12px; border-bottom: 1.5px solid #333; padding-bottom: 6px; }
            .comp-name { font-size: 10pt; font-weight: bold; color: #333; text-transform: uppercase; margin-bottom: 3px; }
            h2 { margin: 0 0 4px 0; font-size: 14pt; font-weight: 800; text-transform: uppercase; }
            .sub-title { font-size: 8.5pt; color: #555; }
            table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
            th, td { padding: 5px 6px; border: 1px solid #94a3b8; vertical-align: middle; word-wrap: break-word; }
            th { background-color: #f1f5f9 !important; font-weight: bold; text-transform: uppercase; text-align: center; font-size: 8pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            tr:nth-child(even) td { background-color: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            tr { page-break-inside: avoid; }
          </style>
        </head>
        <body>
          <div class="header-box">
            <div class="comp-name">CÔNG TY CỔ PHẦN CƠ ĐIỆN VÀ PCCC QSS</div>
            <h2>DANH SÁCH TỔ ĐỘI THI CÔNG</h2>
            <div class="sub-title">Tổng số: ${filteredTeams.length} tổ đội | Ngày in: ${new Date().toLocaleDateString('vi-VN')}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 40px;">STT</th>
                <th>Tên Tổ Đội</th>
                <th>Đội Trưởng</th>
                <th style="width: 110px;">Số Điện Thoại</th>
                <th style="width: 100px;">Phân Loại</th>
                <th>Dự Án Áp Dụng</th>
                <th style="width: 90px;">Số Lượng CN</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div style="margin-top: 30px; display: flex; justify-content: space-between; page-break-inside: avoid; font-size: 9pt; padding: 0 40px;">
            <div style="text-align: center;">
              <strong>NGƯỜI LẬP BẢNG</strong><br><br><br><br>
              <span style="font-size: 8pt; color: #666;">(Ký, họ tên)</span>
            </div>
            <div style="text-align: center;">
              <strong>CHỈ HUY TRƯỞNG</strong><br><br><br><br>
              <span style="font-size: 8pt; color: #666;">(Ký, đóng dấu)</span>
            </div>
          </div>
        </body>
      </html>
    `;

    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(htmlContent);
    iframe.contentWindow.document.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 1000);
    }, 300);
  };

  const handleExportTeamsExcel = () => {
    if (filteredTeams.length === 0) {
      alert("Không có dữ liệu tổ đội để xuất Excel.");
      return;
    }

    const exportData = filteredTeams.map((team, idx) => ({
      "STT": idx + 1,
      "Tên Tổ Đội": team.teamName || '',
      "Đội Trưởng": team.leaderName || '',
      "Số Điện Thoại": team.phone || '',
      "Phân Loại": team.teamType || 'Thầu phụ',
      "Dự Án Áp Dụng": Array.isArray(team.projects) ? team.projects.join(', ') : (team.projectName || ''),
      "Số Lượng Công Nhân": team.members?.length || 0
    }));

    exportToExcel(exportData, `DanhSachToDoi_${new Date().toISOString().slice(0, 10)}`, 'Tổ Đội');
  };

  // Export & Print for Tab 2 (Thành viên tổ đội cụ thể)
  const handleExportTeamExcel = async (team) => {
    if (!team || !team.members || team.members.length === 0) {
      alert("Tổ đội này chưa có thành viên để xuất Excel.");
      return;
    }
    
    await exportWorkersToExcel({
      workers: team.members,
      fileName: `DanhSachThanhVien_${team.teamName || team.name || 'ToDoi'}`,
      sheetName: `Thành viên`,
      isAllWorkers: false
    });
  };

  const handlePrintTeam = (team) => {
    if (!team || !team.members || team.members.length === 0) {
      alert("Tổ đội này chưa có thành viên để in.");
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const rowsHtml = team.members.map((m, idx) => {
      const photoHtml = m.photo
        ? `<img src="${m.photo}" style="width: 22px; height: 28px; object-fit: cover; border-radius: 2px; border: 1px solid #cbd5e1; vertical-align: middle; margin-right: 5px; display: inline-block;" />`
        : '';

      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="text-align: left; font-weight: bold; white-space: nowrap;">
            ${photoHtml}<span>${m.name || ''}</span>
          </td>
          <td style="text-align: center; font-weight: bold;">${formatPosition(m.position)}</td>
          <td style="text-align: center;">${m.age || '-'}</td>
          <td style="text-align: center; font-family: monospace;">${m.cccd || '-'}</td>
          <td style="text-align: center;">${m.birthYear || '-'}</td>
          <td style="text-align: center;">${m.issueDate || '-'}</td>
          <td style="text-align: left;">${m.address || '-'}</td>
          <td style="text-align: center;">${m.vocationalCertificate || '-'}</td>
          <td style="text-align: center;">${m.insuranceExpiry || '-'}</td>
          <td style="text-align: center;">${m.safetyCardExpiry || '-'}</td>
          <td style="text-align: center;">${m.healthCertificate || '-'}</td>
          <td style="text-align: center;">${m.contract || '-'}</td>
          <td style="text-align: left;">${m.notes || '-'}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Danh Sách Thành Viên - ${team.teamName || team.name || ''}</title>
          <style>
            @media print {
              @page { size: landscape; margin: 8mm 6mm; }
            }
            * { box-sizing: border-box; }
            body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 10px; color: #111; }
            .header-box { text-align: center; margin-bottom: 12px; border-bottom: 1.5px solid #333; padding-bottom: 6px; }
            .comp-name { font-size: 10pt; font-weight: bold; color: #333; text-transform: uppercase; margin-bottom: 3px; }
            h2 { margin: 0 0 4px 0; font-size: 14pt; font-weight: 800; text-transform: uppercase; }
            .sub-title { font-size: 8.5pt; color: #555; }
            table { width: 100%; border-collapse: collapse; font-size: 8pt; }
            th, td { padding: 4px 5px; border: 1px solid #94a3b8; vertical-align: middle; word-wrap: break-word; }
            th { background-color: #f1f5f9 !important; font-weight: bold; text-transform: uppercase; text-align: center; font-size: 7.5pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            tr:nth-child(even) td { background-color: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            tr { page-break-inside: avoid; }
          </style>
        </head>
        <body>
          <div class="header-box">
            <div class="comp-name">CÔNG TY CỔ PHẦN CƠ ĐIỆN VÀ PCCC QSS</div>
            <h2>DANH SÁCH THÀNH VIÊN TỔ ĐỘI: ${team.teamName || team.name || ''}</h2>
            <div class="sub-title">Đội trưởng: ${team.leaderName || 'N/A'} - SĐT: ${team.phone || 'N/A'} | Phân loại: ${team.teamType || 'Thầu phụ'} | Tổng số: ${team.members?.length || 0} thành viên | Ngày in: ${new Date().toLocaleDateString('vi-VN')}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 32px;">STT</th>
                <th>Họ và Tên</th>
                <th style="width: 50px;">Chức vụ</th>
                <th style="width: 60px;">Tuổi</th>
                <th style="width: 95px;">CCCD</th>
                <th style="width: 65px;">Năm sinh</th>
                <th style="width: 65px;">Ngày cấp</th>
                <th>Địa chỉ</th>
                <th style="width: 75px;">Bằng nghề</th>
                <th style="width: 75px;">Bảo hiểm TN</th>
                <th style="width: 75px;">Chứng chỉ AT</th>
                <th style="width: 75px;">Giấy khám SK</th>
                <th style="width: 65px;">HĐLĐ</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div style="margin-top: 25px; display: flex; justify-content: space-between; page-break-inside: avoid; font-size: 8.5pt; padding: 0 40px;">
            <div style="text-align: center;">
              <strong>ĐỘI TRƯỞNG</strong><br><br><br><br>
              <span style="font-size: 8pt; color: #666;">(Ký, họ tên)</span>
            </div>
            <div style="text-align: center;">
              <strong>CÁN BỘ AN TOÀN</strong><br><br><br><br>
              <span style="font-size: 8pt; color: #666;">(Ký, họ tên)</span>
            </div>
            <div style="text-align: center;">
              <strong>CHỈ HUY TRƯỞNG</strong><br><br><br><br>
              <span style="font-size: 8pt; color: #666;">(Ký, đóng dấu)</span>
            </div>
          </div>
        </body>
      </html>
    `;

    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(htmlContent);
    iframe.contentWindow.document.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 1000);
    }, 300);
  };

  // Export & Print for Tab 3 (Toàn thể công nhân)
  const handleExportAllWorkersExcel = async () => {
    if (filteredAllWorkers.length === 0) {
      alert("Không có dữ liệu công nhân để xuất Excel.");
      return;
    }

    await exportWorkersToExcel({
      workers: filteredAllWorkers,
      fileName: `DanhSachToanTheCongNhan_${new Date().toISOString().slice(0, 10)}`,
      sheetName: 'Toàn thể công nhân',
      isAllWorkers: true
    });
  };

  const handlePrintAllWorkers = () => {
    if (filteredAllWorkers.length === 0) {
      alert("Không có dữ liệu công nhân để in.");
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const rowsHtml = filteredAllWorkers.map((w, idx) => {
      const photoHtml = w.photo
        ? `<img src="${w.photo}" style="width: 22px; height: 28px; object-fit: cover; border-radius: 2px; border: 1px solid #cbd5e1; vertical-align: middle; margin-right: 5px; display: inline-block;" />`
        : '';
      const projectsStr = Array.isArray(w.teamProjects) && w.teamProjects.length > 0
        ? w.teamProjects.join(', ')
        : (w.project || '-');

      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="text-align: left; font-weight: bold; white-space: nowrap;">
            ${photoHtml}<span>${w.name || ''}</span>
          </td>
          <td style="text-align: left;">
            <strong>${w.teamName || ''}</strong>
            ${w.leaderName ? `<div style="font-size: 7.5pt; color: #555;">${w.leaderName} (${w.leaderPhone || 'N/A'})</div>` : ''}
          </td>
          <td style="text-align: left;">${projectsStr}</td>
          <td style="text-align: center; font-weight: bold;">${formatPosition(w.position)}</td>
          <td style="text-align: center;">${w.age || '-'}</td>
          <td style="text-align: center; font-family: monospace;">${w.cccd || '-'}</td>
          <td style="text-align: center;">${w.birthYear || '-'}</td>
          <td style="text-align: center;">${w.issueDate || '-'}</td>
          <td style="text-align: left;">${w.address || '-'}</td>
          <td style="text-align: center;">${w.vocationalCertificate || '-'}</td>
          <td style="text-align: center;">${w.insuranceExpiry || '-'}</td>
          <td style="text-align: center;">${w.safetyCardExpiry || '-'}</td>
          <td style="text-align: center;">${w.healthCertificate || '-'}</td>
          <td style="text-align: center;">${w.contract || '-'}</td>
          <td style="text-align: left;">${w.notes || '-'}</td>
        </tr>
      `;
    }).join('');

    const filterInfo = [
      allWorkerProjectFilter !== 'ALL' && `Dự án: ${allWorkerProjectFilter}`,
      allWorkerTeamFilter !== 'ALL' && `Tổ đội: ${visibleTeams.find(t => t.id === allWorkerTeamFilter)?.teamName || ''}`,
      allWorkerSearchTerm && `Tìm kiếm: "${allWorkerSearchTerm}"`
    ].filter(Boolean).join(' | ');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Danh Sách Toàn Thể Công Nhân</title>
          <style>
            @media print {
              @page { size: landscape; margin: 8mm 6mm; }
            }
            * { box-sizing: border-box; }
            body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 10px; color: #111; }
            .header-box { text-align: center; margin-bottom: 12px; border-bottom: 1.5px solid #333; padding-bottom: 6px; }
            .comp-name { font-size: 10pt; font-weight: bold; color: #333; text-transform: uppercase; margin-bottom: 3px; }
            h2 { margin: 0 0 4px 0; font-size: 14pt; font-weight: 800; text-transform: uppercase; }
            .sub-title { font-size: 8.5pt; color: #555; }
            table { width: 100%; border-collapse: collapse; font-size: 8pt; }
            th, td { padding: 4px 5px; border: 1px solid #94a3b8; vertical-align: middle; word-wrap: break-word; }
            th { background-color: #f1f5f9 !important; font-weight: bold; text-transform: uppercase; text-align: center; font-size: 7.5pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            tr:nth-child(even) td { background-color: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            tr { page-break-inside: avoid; }
          </style>
        </head>
        <body>
          <div class="header-box">
            <div class="comp-name">CÔNG TY CỔ PHẦN CƠ ĐIỆN VÀ PCCC QSS</div>
            <h2>DANH SÁCH TOÀN THỂ CÔNG NHÂN</h2>
            <div class="sub-title">${filterInfo ? `${filterInfo} | ` : ''}Tổng số: ${filteredAllWorkers.length} công nhân | Ngày in: ${new Date().toLocaleDateString('vi-VN')}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 32px;">STT</th>
                <th>Họ và Tên</th>
                <th>Tổ Đội</th>
                <th>Công Trình</th>
                <th style="width: 48px;">Chức vụ</th>
                <th style="width: 60px;">Tuổi</th>
                <th style="width: 95px;">CCCD</th>
                <th style="width: 65px;">Năm sinh</th>
                <th style="width: 65px;">Ngày cấp</th>
                <th>Địa chỉ</th>
                <th style="width: 75px;">Bằng nghề</th>
                <th style="width: 75px;">Bảo hiểm TN</th>
                <th style="width: 75px;">Chứng chỉ AT</th>
                <th style="width: 75px;">Giấy khám SK</th>
                <th style="width: 60px;">HĐLĐ</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div style="margin-top: 25px; display: flex; justify-content: space-between; page-break-inside: avoid; font-size: 8.5pt; padding: 0 40px;">
            <div style="text-align: center;">
              <strong>NGƯỜI LẬP BẢNG</strong><br><br><br><br>
              <span style="font-size: 8pt; color: #666;">(Ký, họ tên)</span>
            </div>
            <div style="text-align: center;">
              <strong>CÁN BỘ AN TOÀN / GSHT</strong><br><br><br><br>
              <span style="font-size: 8pt; color: #666;">(Ký, họ tên)</span>
            </div>
            <div style="text-align: center;">
              <strong>CHỈ HUY TRƯỞNG</strong><br><br><br><br>
              <span style="font-size: 8pt; color: #666;">(Ký, đóng dấu)</span>
            </div>
          </div>
        </body>
      </html>
    `;

    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(htmlContent);
    iframe.contentWindow.document.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 1000);
    }, 300);
  };

  // Helper render for document expiry badge
  const renderExpiryBadge = (dateStr, defaultColor = 'emerald') => {
    if (!dateStr || dateStr === '-' || dateStr.toLowerCase() === 'chưa có') {
      return <span className="text-gray-400 text-xs">-</span>;
    }
    const status = getExpiryStatus(dateStr);
    const isDanger = status === 'danger';

    let colorClasses = '';
    if (defaultColor === 'sky') colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
    else if (defaultColor === 'emerald') colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    else if (defaultColor === 'amber') colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    else if (defaultColor === 'purple') colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';

    return (
      <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] border whitespace-nowrap ${
        isDanger ? 'bg-red-100 text-red-700 border-red-300 animate-pulse font-black' : colorClasses
      }`}>
        {dateStr}
      </span>
    );
  };

  // Reusable Member Table Component
  const renderMemberTable = (members, teamId) => {
    const targetTeam = teams.find(t => t.id === teamId);
    const canManageThisTeam = canUserManageTeamMembers(currentUser, targetTeam, allProjects);

    return (
      <table className="w-full text-left qss-table">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase w-10 text-center">STT</th>
            <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase min-w-[150px]">Họ và Tên</th>
            <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase">Chức vụ</th>
            <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase text-center">Tuổi</th>
            <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase">CCCD</th>
            <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase text-center">Năm sinh</th>
            <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase text-center">Ngày cấp</th>
            <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase min-w-[140px]">Địa chỉ</th>
            <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase">Bằng cấp nghề</th>
            <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase text-center">Bảo hiểm tai nạn</th>
            <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase text-center">Chứng chỉ AT</th>
            <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase text-center">Giấy khám SK</th>
            <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase text-center">HĐLĐ</th>
            <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase">Ghi chú</th>
            <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase text-center sticky right-0 bg-gray-50 z-10 shadow-[-4px_0_10px_rgba(0,0,0,0.02)]">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {(!members || members.length === 0) ? (
            <tr>
              <td colSpan={15} className="py-10 text-center text-xs text-gray-400 font-medium italic">
                <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                Tổ đội này chưa có dữ liệu thành viên.
                {canManageThisTeam ? (
                  <div className="mt-3">
                    <button
                      onClick={() => handleOpenAddMember(teamId)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-bold text-xs transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm thành viên ngay
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 text-[11px] text-amber-600 font-semibold flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3 text-amber-500" />
                    <span>Bạn là GSHT không phụ trách công trình của tổ đội này nên không thể thêm thành viên.</span>
                  </div>
                )}
              </td>
            </tr>
          ) : (
            members.map((member, idx) => (
              <tr key={member.id} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors last:border-0 group">
                <td className="py-2 px-3 text-xs font-bold text-gray-400 text-center">{idx + 1}</td>
                <td className="py-2 px-3 text-xs font-bold text-gray-900 flex items-center gap-2 whitespace-nowrap">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 overflow-hidden shrink-0">
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span>{member.name}</span>
                </td>
                <td className="py-2 px-3 text-xs font-semibold text-gray-600 whitespace-nowrap">{formatPosition(member.position)}</td>
                <td className="py-2 px-3 text-xs font-semibold text-gray-600 text-center">{member.age || '-'}</td>
                <td className="py-2 px-3 text-xs font-semibold text-gray-600 whitespace-nowrap">{member.cccd || '-'}</td>
                <td className="py-2 px-3 text-xs font-semibold text-gray-600 text-center">{member.birthYear || '-'}</td>
                <td className="py-2 px-3 text-xs font-semibold text-gray-600 text-center whitespace-nowrap">{member.issueDate || '-'}</td>
                <td className="py-2 px-3 text-xs font-semibold text-gray-600 whitespace-nowrap max-w-[180px] truncate" title={member.address}>
                  {member.address || '-'}
                </td>
                <td className="py-2 px-3 text-xs font-semibold text-gray-600 whitespace-nowrap">{member.vocationalCertificate || '-'}</td>
                <td className="py-2 px-3 text-xs font-semibold text-center whitespace-nowrap">
                  {renderExpiryBadge(member.insuranceExpiry, 'sky')}
                </td>
                <td className="py-2 px-3 text-xs font-semibold text-center whitespace-nowrap">
                  {renderExpiryBadge(member.safetyCardExpiry, 'emerald')}
                </td>
                <td className="py-2 px-3 text-xs font-semibold text-center whitespace-nowrap">
                  {renderExpiryBadge(member.healthCertificate, 'amber')}
                </td>
                <td className="py-2 px-3 text-xs font-semibold text-center whitespace-nowrap">
                  {renderExpiryBadge(member.contract, 'purple')}
                </td>
                <td className="py-2 px-3 text-xs font-semibold text-gray-600 whitespace-nowrap max-w-[150px] truncate" title={member.notes}>
                  {member.notes || '-'}
                </td>
                <td className="py-2 px-3 text-center sticky right-0 bg-white group-hover:bg-indigo-50/30 transition-colors shadow-[-4px_0_10px_rgba(0,0,0,0.02)] border-l border-gray-50 z-10">
                  {canManageThisTeam ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => handleOpenEditMember(teamId, member)}
                        className="p-1.5 text-indigo-500 hover:bg-indigo-100 rounded-md transition-colors"
                        title="Sửa thành viên"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteMember(teamId, member)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Xóa thành viên"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-semibold italic select-none">Chỉ xem</span>
                  )}
                </td>
              </tr>
            ))
          )}
          {members && members.length > 0 && (
            <tr>
              <td colSpan={15} className="py-0">
                {canManageThisTeam ? (
                  <button 
                    onClick={() => handleOpenAddMember(teamId)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-50/40 hover:bg-indigo-100/70 text-indigo-700 transition-colors font-bold text-xs uppercase tracking-wider"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm thành viên mới vào tổ đội này
                  </button>
                ) : (
                  <div className="py-2 bg-gray-50/80 text-center text-[11px] text-gray-400 font-semibold flex items-center justify-center gap-1.5 border-t border-gray-100">
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                    <span>GSHT chỉ được thêm thành viên cho tổ đội làm công trình mình được phân công phụ trách</span>
                  </div>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  };

  return (
    <div className="pb-12">
      <div className="p-8 space-y-6 w-full">
        {/* Top Control Bar with 3 Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-2xs overflow-x-auto">
            {/* TAB 1: Quản Lý Tổ Đội */}
            <button
              onClick={() => setActiveTab('teams')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'teams'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Quản Lý Tổ Đội</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'teams' ? 'bg-indigo-700/80 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {visibleTeams.length}
              </span>
            </button>

            {/* TAB 2: Công Nhân Các Đội (Thành viên tổ đội) */}
            <button
              onClick={() => setActiveTab('team-workers')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'team-workers'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Công Nhân Các Đội</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'team-workers' ? 'bg-indigo-700/80 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {allWorkers.length}
              </span>
            </button>

            {/* TAB 3: Toàn Thể Công Nhân */}
            <button
              onClick={() => setActiveTab('all-workers')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'all-workers'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <HardHat className="w-4 h-4" />
              <span>Toàn Thể Công Nhân</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'all-workers' ? 'bg-indigo-700/80 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {allWorkers.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'teams' && (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-500/20 transition active:scale-95"
              >
                <Plus className="w-4 h-4" /> Thêm Tổ Đội
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: QUẢN LÝ TỔ ĐỘI (BẢNG QUẢN LÝ CÁC TỔ ĐỘI) */}
        {activeTab === 'teams' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden space-y-4 p-5">
            {/* Toolbar Tab 1 */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 no-print">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {/* Ô tìm kiếm tổ đội */}
                <div className="relative flex-1 min-w-[240px] max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên tổ đội, đội trưởng, dự án..."
                    value={teamSearchTerm}
                    onChange={(e) => setTeamSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>

                {/* Bộ lọc Công trình */}
                <select
                  value={teamProjectFilter}
                  onChange={(e) => setTeamProjectFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">🏗️ Tất cả Công trình ({allAvailableProjects.length})</option>
                  {allAvailableProjects.map(projName => (
                    <option key={projName} value={projName}>{projName}</option>
                  ))}
                </select>

                {/* Bộ lọc Phân loại */}
                <select
                  value={teamTypeFilter}
                  onChange={(e) => setTeamTypeFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Tất cả Phân loại ({visibleTeams.length})</option>
                  <option value="Thầu phụ">Thầu phụ ({thauPhuCount})</option>
                  <option value="Cơ hữu">Cơ hữu ({coHuuCount})</option>
                </select>
              </div>

              {/* Nút In & Xuất Excel */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintTeamsTable}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 font-bold rounded-xl border border-gray-200 shadow-2xs transition-colors text-xs"
                >
                  <Printer className="w-4 h-4" /> In Bảng
                </button>
                <button
                  onClick={handleExportTeamsExcel}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl border border-emerald-200 shadow-2xs transition-colors text-xs"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Xuất Excel
                </button>
              </div>
            </div>

            {/* Bảng danh sách các tổ đội */}
            <div id="print-teams-table" className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left qss-table">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="py-3 px-4 text-xs font-extrabold uppercase w-12 text-center">STT</th>
                    <th className="py-3 px-4 text-xs font-extrabold uppercase min-w-[220px]">TỔ ĐỘI & ĐỘI TRƯỞNG</th>
                    <th className="py-3 px-4 text-xs font-extrabold uppercase text-center w-32">PHÂN LOẠI</th>
                    <th className="py-3 px-4 text-xs font-extrabold uppercase min-w-[200px]">DỰ ÁN ÁP DỤNG</th>
                    <th className="py-3 px-4 text-xs font-extrabold uppercase text-center w-40">SỐ THÀNH VIÊN</th>
                    <th className="py-3 px-4 text-xs font-extrabold uppercase text-right w-36">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-gray-400 font-medium italic">
                        <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                        Không tìm thấy tổ đội nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredTeams.map((team, idx) => {
                      const memberCount = team.members?.length || 0;
                      return (
                        <tr key={team.id} className="transition border-b border-gray-100 hover:bg-indigo-50/30">
                          <td className="py-3 px-4 text-xs font-bold text-gray-400 text-center">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-gray-900 text-sm">{team.teamName}</div>
                            <div className="text-xs text-indigo-600 font-semibold flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3.5 h-3.5 text-indigo-400" /> 
                              <span>{team.leaderName} ({team.phone || 'N/A'})</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {team.teamType ? (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                team.teamType === 'Cơ hữu' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {team.teamType}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1.5">
                              {Array.isArray(team.projects) && team.projects.length > 0 ? (
                                team.projects.map((proj, i) => (
                                  <span key={i} className="inline-block bg-indigo-50 text-indigo-700 text-xs font-extrabold px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs">
                                    {proj}
                                  </span>
                                ))
                              ) : (
                                <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-extrabold px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs">
                                  {team.projectName || 'Tất cả dự án'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedTeamId(team.id);
                                setActiveTab('team-workers');
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition ${
                                memberCount > 0 
                                  ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200' 
                                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-200'
                              }`}
                              title="Bấm để xem danh sách thành viên đội này"
                            >
                              <User className="w-3.5 h-3.5" />
                              <span>{memberCount} thành viên</span>
                              <ChevronRight className="w-3 h-3 ml-0.5" />
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                title="Xem danh sách thành viên đội này"
                                onClick={() => {
                                  setSelectedTeamId(team.id);
                                  setActiveTab('team-workers');
                                }}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition border border-indigo-100 bg-white"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                              <button 
                                title="Sửa thông tin tổ đội" 
                                onClick={() => handleOpenEdit(team)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition border border-indigo-100 bg-white"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                title="Xóa tổ đội" 
                                onClick={() => handleDeleteTeam(team)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition border border-red-100 bg-white"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
        )}

        {/* TAB 2: CÔNG NHÂN CÁC ĐỘI (DANH SÁCH THÀNH VIÊN TRONG TỔ ĐỘI ĐÓ) */}
        {activeTab === 'team-workers' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden space-y-4 p-5">
            {/* Toolbar: Chọn tổ đội, Tìm kiếm & Thao tác */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 no-print">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Chọn tổ đội */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-gray-700 tracking-wider whitespace-nowrap">Chọn Tổ Đội:</span>
                  <select
                    value={selectedTeam?.id || ''}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer min-w-[240px]"
                  >
                    {visibleTeams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.teamName} — ({t.members?.length || 0} thành viên)
                      </option>
                    ))}
                    {visibleTeams.length === 0 && (
                      <option value="">(Không có tổ đội nào thuộc công trình của bạn)</option>
                    )}
                  </select>
                </div>

                {/* Tìm kiếm thành viên trong đội */}
                <div className="relative flex-1 min-w-[240px] max-w-sm">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo họ tên, CCCD, chức vụ, địa chỉ..."
                    value={teamWorkerSearchTerm}
                    onChange={(e) => setTeamWorkerSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Nút hành động */}
              {selectedTeam && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handlePrintTeam(selectedTeam)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 font-bold rounded-xl border border-gray-200 shadow-2xs transition-colors text-xs"
                  >
                    <Printer className="w-4 h-4" /> In Bảng
                  </button>
                  <button
                    onClick={() => handleExportTeamExcel(selectedTeam)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl border border-emerald-200 shadow-2xs transition-colors text-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Xuất Excel
                  </button>
                  {canUserManageTeamMembers(currentUser, selectedTeam, allProjects) ? (
                    <button
                      onClick={() => handleOpenAddMember(selectedTeam.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95"
                    >
                      <Plus className="w-4 h-4" /> Thêm Thành Viên
                    </button>
                  ) : (
                    <div 
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 text-gray-400 text-xs font-bold rounded-xl border border-gray-200 cursor-not-allowed select-none" 
                      title="GSHT chỉ được tạo thành viên cho tổ đội làm công trình mà GSHT được phân công."
                    >
                      <Lock className="w-3.5 h-3.5 text-gray-400" />
                      <span>Không có quyền thêm TV</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bảng chi tiết thành viên của tổ đội đang chọn */}
            {selectedTeam ? (
              <div id={`print-team-${selectedTeam.id}`} className="overflow-x-auto rounded-xl border border-gray-200">
                {renderMemberTable(filteredSelectedTeamMembers, selectedTeam.id)}
              </div>
            ) : (
              <div className="p-16 text-center text-gray-400">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="font-semibold text-sm">Vui lòng chọn một tổ đội để xem danh sách thành viên.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TOÀN THỂ CÔNG NHÂN (BẢNG TỔNG HỢP CÔNG NHÂN TẤT CẢ CÁC ĐỘI) */}
        {activeTab === 'all-workers' && (
          <div className="space-y-4">
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3">
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                  <HardHat className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Toàn Thể Công Nhân</div>
                  <div className="text-xl font-black text-gray-900">{allWorkers.length} người</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Tổng Số Tổ Đội</div>
                  <div className="text-xl font-black text-gray-900">{visibleTeams.length} đội</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3">
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Hồ Sơ Hợp Lệ</div>
                  <div className="text-xl font-black text-emerald-600">
                    {Math.max(0, allWorkers.length - totalWarningWorkers)} người
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3">
                <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Cảnh Báo / Sắp Hết Hạn</div>
                  <div className="text-xl font-black text-amber-600">{totalWarningWorkers} hồ sơ</div>
                </div>
              </div>
            </div>

            {/* Content Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden space-y-4 p-5">
              {/* Toolbar */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 no-print">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[240px] max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên, CCCD, công trình, tổ đội..."
                      value={allWorkerSearchTerm}
                      onChange={(e) => setAllWorkerSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                  </div>

                  {/* Filter Công trình */}
                  <select
                    value={allWorkerProjectFilter}
                    onChange={(e) => setAllWorkerProjectFilter(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="ALL">🏗️ Tất cả Công trình ({allAvailableProjects.length})</option>
                    {allAvailableProjects.map(projName => (
                      <option key={projName} value={projName}>
                        {projName} {countWorkersInProject[projName] ? `(${countWorkersInProject[projName]} người)` : ''}
                      </option>
                    ))}
                  </select>

                  {allWorkerProjectFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setAllWorkerProjectFilter('ALL')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 shadow-2xs transition-all active:scale-95"
                      title="Bỏ lọc công trình này"
                    >
                      <span>{allWorkerProjectFilter}</span>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Filter Team */}
                  <select
                    value={allWorkerTeamFilter}
                    onChange={(e) => setAllWorkerTeamFilter(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">Tất cả Tổ Đội ({visibleTeams.length})</option>
                    {visibleTeams.map(t => (
                      <option key={t.id} value={t.id}>{t.teamName}</option>
                    ))}
                  </select>

                  {/* Filter Expiry */}
                  <select
                    value={allWorkerExpiryFilter}
                    onChange={(e) => setAllWorkerExpiryFilter(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">Tất cả Hồ sơ</option>
                    <option value="WARNING">⚠️ Cảnh báo / Sắp hết hạn ({totalWarningWorkers})</option>
                    <option value="SAFE">✅ Hồ sơ hợp lệ</option>
                  </select>
                </div>

                {/* Print and Export Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintAllWorkers}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 font-bold rounded-xl border border-gray-200 shadow-2xs transition-colors text-xs"
                  >
                    <Printer className="w-4 h-4" /> In Bảng
                  </button>
                  <button
                    onClick={handleExportAllWorkersExcel}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl border border-emerald-200 shadow-2xs transition-colors text-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Xuất Excel
                  </button>
                </div>
              </div>

              {/* Table of all workers */}
              <div id="print-all-workers-table" className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left qss-table">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase w-10 text-center">STT</th>
                      <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase min-w-[150px]">Họ và Tên</th>
                      <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase min-w-[160px]">Tổ Đội</th>
                      <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase">Công Trình</th>
                      <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase">Chức vụ</th>
                      <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase text-center">Tuổi</th>
                      <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase">CCCD</th>
                      <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase text-center">Năm sinh</th>
                      <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase text-center">Ngày cấp</th>
                      <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase min-w-[140px]">Địa chỉ</th>
                      <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase">Bằng cấp nghề</th>
                      <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase text-center">Bảo hiểm tai nạn</th>
                      <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase text-center">Chứng chỉ AT</th>
                      <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase text-center">Giấy khám SK</th>
                      <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase text-center">HĐLĐ</th>
                      <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase">Ghi chú</th>
                      <th className="py-2.5 px-3 text-[11px] font-extrabold text-gray-500 uppercase text-center sticky right-0 bg-gray-50 z-10 shadow-[-4px_0_10px_rgba(0,0,0,0.02)]">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAllWorkers.length === 0 ? (
                      <tr>
                        <td colSpan={17} className="py-12 text-center text-xs text-gray-400 font-medium italic">
                          <HardHat className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                          Không tìm thấy công nhân nào phù hợp với bộ lọc hiện tại.
                        </td>
                      </tr>
                    ) : (
                      filteredAllWorkers.map((worker, idx) => (
                        <tr key={`${worker.teamId}-${worker.id}`} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors last:border-0 group">
                          <td className="py-2 px-3 text-xs font-bold text-gray-400 text-center">{idx + 1}</td>
                          <td className="py-2 px-3 text-xs font-bold text-gray-900 flex items-center gap-2 whitespace-nowrap">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 overflow-hidden shrink-0">
                              {worker.photo ? (
                                <img src={worker.photo} alt={worker.name} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <span>{worker.name}</span>
                          </td>
                          <td className="py-2 px-3 text-xs whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedTeamId(worker.teamId);
                                setActiveTab('team-workers');
                              }}
                              className="font-extrabold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                              title="Bấm để chuyển sang tab Công nhân của đội này"
                            >
                              <span>{worker.teamName}</span>
                              <ChevronRight className="w-3 h-3 text-indigo-400" />
                            </button>
                            <div className="text-[11px] text-gray-400">
                              {worker.leaderName} ({worker.leaderPhone || 'N/A'})
                            </div>
                          </td>
                          <td className="py-2 px-3 text-xs">
                            <div className="flex flex-wrap gap-1 max-w-[170px]">
                              {Array.isArray(worker.teamProjects) && worker.teamProjects.length > 0 ? (
                                worker.teamProjects.map((p, i) => {
                                  const isSelected = allWorkerProjectFilter === p;
                                  return (
                                    <button
                                      type="button"
                                      key={i}
                                      onClick={() => setAllWorkerProjectFilter(isSelected ? 'ALL' : p)}
                                      className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors whitespace-nowrap cursor-pointer ${
                                        isSelected 
                                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs' 
                                          : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-600 hover:text-white'
                                      }`}
                                      title={`Bấm để ${isSelected ? 'bỏ lọc' : 'lọc theo'} công trình ${p}`}
                                    >
                                      {p}
                                    </button>
                                  );
                                })
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-xs font-semibold text-gray-600 whitespace-nowrap">{formatPosition(worker.position)}</td>
                          <td className="py-2 px-3 text-xs font-semibold text-gray-600 text-center">{worker.age || '-'}</td>
                          <td className="py-2 px-3 text-xs font-semibold text-gray-600 whitespace-nowrap">{worker.cccd || '-'}</td>
                          <td className="py-2 px-3 text-xs font-semibold text-gray-600 text-center">{worker.birthYear || '-'}</td>
                          <td className="py-2 px-3 text-xs font-semibold text-gray-600 text-center whitespace-nowrap">{worker.issueDate || '-'}</td>
                          <td className="py-2 px-3 text-xs font-semibold text-gray-600 whitespace-nowrap max-w-[180px] truncate" title={worker.address}>
                            {worker.address || '-'}
                          </td>
                          <td className="py-2 px-3 text-xs font-semibold text-gray-600 whitespace-nowrap">{worker.vocationalCertificate || '-'}</td>
                          <td className="py-2 px-3 text-xs font-semibold text-center whitespace-nowrap">
                            {renderExpiryBadge(worker.insuranceExpiry, 'sky')}
                          </td>
                          <td className="py-2 px-3 text-xs font-semibold text-center whitespace-nowrap">
                            {renderExpiryBadge(worker.safetyCardExpiry, 'emerald')}
                          </td>
                          <td className="py-2 px-3 text-xs font-semibold text-center whitespace-nowrap">
                            {renderExpiryBadge(worker.healthCertificate, 'amber')}
                          </td>
                          <td className="py-2 px-3 text-xs font-semibold text-center whitespace-nowrap">
                            {renderExpiryBadge(worker.contract, 'purple')}
                          </td>
                          <td className="py-2 px-3 text-xs font-semibold text-gray-600 whitespace-nowrap max-w-[150px] truncate" title={worker.notes}>
                            {worker.notes || '-'}
                          </td>
                          <td className="py-2 px-3 text-center sticky right-0 bg-white group-hover:bg-indigo-50/30 transition-colors shadow-[-4px_0_10px_rgba(0,0,0,0.02)] border-l border-gray-50 z-10">
                            {(() => {
                              const workerTeam = teams.find(t => t.id === worker.teamId);
                              const canManageWorkerTeam = canUserManageTeamMembers(currentUser, workerTeam, allProjects);
                              return canManageWorkerTeam ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button 
                                    onClick={() => handleOpenEditMember(worker.teamId, worker)}
                                    className="p-1.5 text-indigo-500 hover:bg-indigo-100 rounded-md transition-colors"
                                    title="Sửa công nhân"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteMember(worker.teamId, worker)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    title="Xóa công nhân"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-400 font-semibold italic select-none">Chỉ xem</span>
                              );
                            })()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <AddTeamModal 
        isOpen={isAddModalOpen} 
        onClose={() => { setIsAddModalOpen(false); setTeamToEdit(null); }} 
        teamToEdit={teamToEdit}
      />

      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        teamId={activeTeamIdForMember}
        memberToEdit={memberToEdit}
      />
    </div>
  );
}
