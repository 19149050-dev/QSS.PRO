import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { initialUsers, initialProjects, initialTeams, initialIPCs, initialMaterials, initialPaymentMatrix, defaultMatrixBlocks, standardBlocksTemplate } from '@/lib/mockData';
import { supabase } from '@/lib/supabase';

const sortFloors = (matrix) => {
  return [...matrix].sort((a, b) => {
    const parseFloor = (name) => {
      const str = name.toString().toUpperCase().trim();
      if (str.startsWith('B')) {
        const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
        return { type: 1, val: isNaN(num) ? 0 : num, text: str };
      }
      const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
      return { type: 0, val: isNaN(num) ? 999 : num, text: str };
    };

    const parsedA = parseFloor(a.floor);
    const parsedB = parseFloor(b.floor);

    if (parsedA.type !== parsedB.type) {
      return parsedA.type - parsedB.type;
    }

    if (parsedA.type === 0) {
      if (parsedA.val !== 999 && parsedB.val !== 999) {
        return parsedB.val - parsedA.val;
      }
      if (parsedA.val === 999 && parsedB.val !== 999) return -1;
      if (parsedB.val === 999 && parsedA.val !== 999) return 1;
      return parsedA.text.localeCompare(parsedB.text);
    }

    if (parsedA.type === 1) {
      return parsedA.val - parsedB.val;
    }
    return 0;
  });
};

const standardBlocksTemplateLocal = standardBlocksTemplate;
const standardFloorsTemplate = [];

const defaultMatrixBlocksLocal = defaultMatrixBlocks;

export const useStore = create(
  persist(
    (set, get) => ({
      users: initialUsers,
      projects: initialProjects,
      teams: initialTeams,
      ipcs: initialIPCs,
      materials: initialMaterials,
      materialSheets: {},
      paymentMatrix: initialPaymentMatrix,
      matrixBlocks: defaultMatrixBlocksLocal,
      globalDialog: { isOpen: false, type: 'alert', title: '', message: '', onConfirm: null, onCancel: null, defaultValue: '', inputPlaceholder: '', inputType: 'text', allowNote: false },
      openGlobalAlert: (message, title = 'Thông báo') => set({ globalDialog: { isOpen: true, type: 'alert', title, message } }),
      openGlobalConfirm: (message, onConfirm, title = 'Xác nhận') => set({ globalDialog: { isOpen: true, type: 'confirm', title, message, onConfirm } }),
      openGlobalPrompt: (message, onConfirm, defaultValue = '', title = 'Nhập liệu', inputType = 'text', allowNote = false, onCancel = null, onDelete = null) => set({ globalDialog: { isOpen: true, type: 'prompt', title, message, onConfirm, onCancel, onDelete, defaultValue, inputType, allowNote } }),
      closeGlobalDialog: () => set((state) => ({ globalDialog: { ...state.globalDialog, isOpen: false } })),
      
      isLoading: false,
      error: null,
      activeProject: null,
      activeTab: 'dashboard',
      activeViewParams: null,
      viewMode: 'table', // 'table' | 'card'
      ipcSelections: {}, // stores selected cells for IPC: { "projectName_period": { "floor_category": true/false } }
      currentUser: null,

      loginUser: (user) => set({ currentUser: user }),
      logoutUser: () => set({ currentUser: null }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setActiveProject: (project) => set({ activeProject: project }),
      setActiveTab: (tab, params = null) => set({ activeTab: tab, activeViewParams: params }),
      toggleIpcSelection: (projectName, period, floor, category) => set((state) => {
        const key = `${projectName}_${period}`;
        const currentSelections = state.ipcSelections[key] || {};
        const cellKey = `${floor}___${category}`;
        return {
          ipcSelections: {
            ...state.ipcSelections,
            [key]: {
              ...currentSelections,
              [cellKey]: !currentSelections[cellKey]
            }
          }
        };
      }),
      clearIpcSelections: (projectName, period) => set((state) => {
        const key = `${projectName}_${period}`;
        const newSelections = { ...state.ipcSelections };
        delete newSelections[key];
        return { ipcSelections: newSelections };
      }),

      // User Actions
      addUser: async (user) => {
        const newUser = { id: `u-${Date.now()}`, status: 'Active', ipHistory: ['1.54.25.78'], ...user };
        set((state) => ({ users: [newUser, ...state.users] }));

        const dbUser = {
          name: user.name,
          username: user.username,
          phone: user.phone,
          role: user.role,
          status: 'Active',
          last_login: user.lastLogin,
          ip_login: user.ipLogin,
          signature_url: user.signature,
          allow_view_financials: user.allowViewFinancials,
          allow_view_ipc_thuc: user.allowViewIpcThuc || false,
          password: user.password
        };
        try {
          await supabase.from('users').insert([dbUser]);
        } catch (error) {
          console.error("Failed to add user to Supabase:", error);
        }
      },
      updateUser: async (id, updatedData) => {
        const oldUser = get().users.find(u => u.id === id);
        const oldUsername = oldUser ? oldUser.username : null;

        set((state) => ({
          users: state.users.map(u => u.id === id ? { ...u, ...updatedData } : u)
        }));

        try {
          if (oldUsername) {
             const dbData = {};
             if (updatedData.name !== undefined) dbData.name = updatedData.name;
             if (updatedData.username !== undefined) dbData.username = updatedData.username;
             if (updatedData.phone !== undefined) dbData.phone = updatedData.phone;
             if (updatedData.role !== undefined) dbData.role = updatedData.role;
             if (updatedData.status !== undefined) dbData.status = updatedData.status;
             if (updatedData.signature !== undefined) dbData.signature_url = updatedData.signature;
             if (updatedData.allowViewIpcThuc !== undefined) dbData.allow_view_ipc_thuc = updatedData.allowViewIpcThuc;
             if (updatedData.password !== undefined && updatedData.password.trim() !== '') {
               dbData.password = updatedData.password;
             }
             
             if (id && !String(id).startsWith('u-')) {
               await supabase.from('users').update(dbData).eq('id', id);
             } else {
               await supabase.from('users').update(dbData).eq('username', oldUsername);
             }
          }
        } catch (error) {
          console.error("Failed to update user in Supabase:", error);
        }
      },
      deleteUser: async (id) => {
        const userState = get().users.find(u => u.id === id);
        set((state) => ({
          users: state.users.filter(u => u.id !== id)
        }));

        if (userState && userState.username) {
          try {
            await supabase.from('users').delete().eq('username', userState.username);
          } catch (error) {
            console.error("Failed to delete user in Supabase:", error);
          }
        }
      },
      toggleUserLock: (id) => set((state) => ({
        users: state.users.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Locked' : 'Active' } : u)
      })),

      // Project Actions
      addProject: async (project) => {
        const state = get();
        if (state.projects.some(p => p.name.trim().toLowerCase() === project.name.trim().toLowerCase())) {
          state.openGlobalAlert(`Dự án có tên "${project.name}" đã tồn tại! Vui lòng chọn một tên khác để tránh trùng lặp.`);
          return false;
        }
        
        const count = Math.max(1, parseInt(project.numBlocks || project.floors || '1', 10) || 1);
        const blockLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
        const generatedBlocks = [];
        
        for (let i = 0; i < count; i++) {
          const letter = blockLetters[i] || (i + 1);
          generatedBlocks.push({
            blockName: `BLOCK ${letter}`,
            groups: JSON.parse(JSON.stringify(standardBlocksTemplate[0]?.groups || []))
          });
        }

        const projectData = {
          name: project.name,
          order_type: project.orderType || 'TRỰC TIẾP ORDER',
          sub_contractor_count: 1,
          sub_contractor_info: project.subContractorInfo || '',
          address: project.address || '',
          contract_no: project.contractNo || '',
          contract_date: project.contractDate || null,
          cht: project.cht || [],
          contract_value: project.contractValue || 0,
          addendum_value: project.addendumValue || 0,
          advance_payment: project.advancePayment || 0,
          status: 'Doing',
          progress: 0,
          matrix_blocks: generatedBlocks,
          matrix_data: { base: standardFloorsTemplate, ipc: [], team: [] }
        };

        const { data, error } = await supabase.from('projects').insert([projectData]).select('*').single();

        if (error || !data) {
          console.error("Failed to insert project to Supabase:", error);
          const newProjId = `p-${Date.now()}`;
          set((state) => ({
            projects: [{ id: newProjId, status: 'Doing', progress: 0, addendumValue: 0, advancePayment: 0, ...project, numBlocks: count.toString() }, ...state.projects],
            matrixBlocks: { ...state.matrixBlocks, [project.name]: generatedBlocks },
            paymentMatrix: { ...state.paymentMatrix, [project.name]: standardFloorsTemplate }
          }));
          return;
        }

        const newProj = {
          ...project,
          id: data.id,
          orderType: data.order_type,
          subContractorInfo: data.sub_contractor_info,
          contractNo: data.contract_no,
          contractDate: data.contract_date,
          contractValue: data.contract_value,
          addendumValue: data.addendum_value,
          advancePayment: data.advance_payment,
          numBlocks: count.toString(),
          status: data.status,
          progress: data.progress
        };

        set((state) => ({
          projects: [newProj, ...state.projects],
          matrixBlocks: { ...state.matrixBlocks, [project.name]: generatedBlocks },
          paymentMatrix: { ...state.paymentMatrix, [project.name]: standardFloorsTemplate }
        }));
      },
      updateProject: (id, updatedData) => {
        set((state) => {
          const proj = state.projects.find(p => p.id === id);
          if (!proj) return state;

          const oldName = proj.name;
          const newName = updatedData.name || oldName;

          let newMatrixBlocks = { ...state.matrixBlocks };
          let newPaymentMatrix = { ...state.paymentMatrix };

          if (oldName !== newName) {
            if (newMatrixBlocks[oldName]) {
              newMatrixBlocks[newName] = newMatrixBlocks[oldName];
              delete newMatrixBlocks[oldName];
            }
            if (newPaymentMatrix[oldName]) {
              newPaymentMatrix[newName] = newPaymentMatrix[oldName];
              delete newPaymentMatrix[oldName];
            }
            if (newPaymentMatrix[`${oldName}_team`]) {
              newPaymentMatrix[`${newName}_team`] = newPaymentMatrix[`${oldName}_team`];
              delete newPaymentMatrix[`${oldName}_team`];
            }
            if (newPaymentMatrix[`${oldName}_ipc`]) {
              newPaymentMatrix[`${newName}_ipc`] = newPaymentMatrix[`${oldName}_ipc`];
              delete newPaymentMatrix[`${oldName}_ipc`];
            }
          }

          if (updatedData.numBlocks !== undefined && String(updatedData.numBlocks) !== String(proj.numBlocks)) {
            const count = Math.max(1, parseInt(updatedData.numBlocks, 10) || 1);
            const currentBlocks = newMatrixBlocks[newName] || [];
            const blockLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
            
            let updatedBlocks = [...currentBlocks];
            if (count > currentBlocks.length) {
              for (let i = currentBlocks.length; i < count; i++) {
                const letter = blockLetters[i] || (i + 1);
                updatedBlocks.push({
                  blockName: `BLOCK ${letter}`,
                  groups: JSON.parse(JSON.stringify(standardBlocksTemplate[0]?.groups || []))
                });
              }
            } else if (count < currentBlocks.length) {
              updatedBlocks = updatedBlocks.slice(0, count);
            }
            newMatrixBlocks[newName] = updatedBlocks;
          }

          return {
            projects: state.projects.map(p => p.id === id ? { ...p, ...updatedData } : p),
            matrixBlocks: newMatrixBlocks,
            paymentMatrix: newPaymentMatrix
          };
        });
        const updatedProj = get().projects.find(p => p.id === id);
        if (updatedProj) {
          get().syncMatrixDataToSupabase(updatedProj.name);
          const dbData = {
            name: updatedProj.name,
            order_type: updatedProj.orderType,
            sub_contractor_info: updatedProj.subContractorInfo,
            address: updatedProj.address,
            contract_no: updatedProj.contractNo,
            cht: updatedProj.cht
          };
          if (String(id).startsWith('p-')) {
            supabase.from('projects').update(dbData).eq('name', updatedProj.name).then();
          } else {
            supabase.from('projects').update(dbData).eq('id', id).then();
          }
        }
      },
      updateProjectBlocks: (projectName, newBlocks) => { set((state) => ({
        matrixBlocks: { ...state.matrixBlocks, [projectName]: newBlocks }
      }));
        get().syncMatrixDataToSupabase(projectName);
      },
      deleteProject: async (id) => {
        const project = get().projects.find((item) => item.id === id);
        if (!project) return false;

        try {
          // Nhờ ON DELETE CASCADE trong Supabase, ta chỉ cần xóa project, 
          // các bảng liên quan (teams, ipcs, materials, payment_matrix) sẽ tự động bị xóa theo.
          if (String(id).startsWith('p-')) {
            const { error } = await supabase.from('projects').delete().eq('name', project.name);
            if (error) throw error;
          } else {
            const { error } = await supabase.from('projects').delete().eq('id', id);
            if (error) throw error;
          }

          set((state) => {
            const paymentMatrix = { ...state.paymentMatrix };
            const matrixBlocks = { ...state.matrixBlocks };
            delete paymentMatrix[project.name];
            delete paymentMatrix[`${project.name}_ipc`];
            delete paymentMatrix[`${project.name}_team`];
            delete matrixBlocks[project.name];

            return {
              projects: state.projects.filter((item) => item.id !== id),
              teams: state.teams.map((team) => {
                const updatedTeam = { ...team };
                if (Array.isArray(updatedTeam.projects)) {
                  updatedTeam.projects = updatedTeam.projects.filter(p => p !== project.name);
                }
                if (updatedTeam.projectName === project.name) {
                  updatedTeam.projectName = (updatedTeam.projects && updatedTeam.projects.length > 0) ? updatedTeam.projects[0] : '';
                }
                return updatedTeam;
              }).filter(team => team.projectName || (team.projects && team.projects.length > 0)),
              ipcs: state.ipcs.filter((ipc) => ipc.projectId !== id && ipc.projectName !== project.name),
              materials: state.materials.filter((material) => material.projectId !== id && material.projectName !== project.name),
              paymentMatrix,
              matrixBlocks,
              activeProject: (state.activeProject === project.name || state.activeProject?.id === id) ? null : state.activeProject
            };
          });

          return true;
        } catch (error) {
          console.error('Failed to delete project from Supabase:', error);
          return false;
        }
      },

      // Team Actions
      addTeam: async (team) => {
        const teamData = {
          project_id: team.projectId,
          project_name: team.projectName,
          team_name: team.teamName,
          leader_name: team.leaderName,
          phone: team.phone,
          trade_type: team.tradeType,
          worker_count: team.workerCount,
          contract_value: team.contractValue || 0,
          paid_amount: 0,
          retention_amount: team.retentionAmount || 0,
          remaining_amount: team.contractValue || 0,
          status: 'Đang thi công'
        };
        const { data, error } = await supabase.from('teams').insert([teamData]).select('*').single();
        if (error || !data) {
          console.error("Failed to insert team:", error);
          set((state) => ({
            teams: [{ id: `t-${Date.now()}`, paidAmount: 0, remainingAmount: team.contractValue || 0, status: 'Đang thi công', ...team }, ...state.teams]
          }));
          return;
        }
        const newTeam = {
          id: data.id,
          projectId: data.project_id,
          projectName: data.project_name,
          teamName: data.team_name,
          leaderName: data.leader_name,
          phone: data.phone,
          tradeType: data.trade_type,
          workerCount: data.worker_count,
          contractValue: data.contract_value,
          paidAmount: data.paid_amount,
          retentionAmount: data.retention_amount,
          remainingAmount: data.remaining_amount,
          status: data.status
        };
        set((state) => ({ teams: [newTeam, ...state.teams] }));
      },
      updateTeam: async (id, updatedData) => {
        set((state) => ({
          teams: state.teams.map(t => t.id === id ? { ...t, ...updatedData } : t)
        }));
        if (id && !String(id).startsWith('t-')) {
          const dbData = {};
          if (updatedData.teamName !== undefined) dbData.team_name = updatedData.teamName;
          if (updatedData.leaderName !== undefined) dbData.leader_name = updatedData.leaderName;
          if (updatedData.phone !== undefined) dbData.phone = updatedData.phone;
          if (updatedData.tradeType !== undefined) dbData.trade_type = updatedData.tradeType;
          if (updatedData.workerCount !== undefined) dbData.worker_count = updatedData.workerCount;
          if (updatedData.contractValue !== undefined) dbData.contract_value = updatedData.contractValue;
          if (updatedData.paidAmount !== undefined) dbData.paid_amount = updatedData.paidAmount;
          if (updatedData.retentionAmount !== undefined) dbData.retention_amount = updatedData.retentionAmount;
          if (updatedData.remainingAmount !== undefined) dbData.remaining_amount = updatedData.remainingAmount;
          if (updatedData.status !== undefined) dbData.status = updatedData.status;
          await supabase.from('teams').update(dbData).eq('id', id);
        }
      },
      deleteTeam: async (id) => {
        set((state) => ({
          teams: state.teams.filter(t => t.id !== id)
        }));
        if (id && !String(id).startsWith('t-')) {
          await supabase.from('teams').delete().eq('id', id);
        }
      },
      addTeamMember: (teamId, member) => {
        set((state) => ({
          teams: state.teams.map(t => {
            if (t.id === teamId) {
              const newMember = { ...member, id: `m-${Date.now()}` };
              return { ...t, members: [...(t.members || []), newMember] };
            }
            return t;
          })
        }));
      },
      updateTeamMember: (teamId, memberId, updatedData) => {
        set((state) => ({
          teams: state.teams.map(t => {
            if (t.id === teamId && t.members) {
              return {
                ...t,
                members: t.members.map(m => m.id === memberId ? { ...m, ...updatedData } : m)
              };
            }
            return t;
          })
        }));
      },
      deleteTeamMember: (teamId, memberId) => {
        set((state) => ({
          teams: state.teams.map(t => {
            if (t.id === teamId && t.members) {
              return {
                ...t,
                members: t.members.filter(m => m.id !== memberId)
              };
            }
            return t;
          })
        }));
      },

      // IPC Actions
      addIPC: async (ipc) => {
        const ipcData = {
          type: ipc.type,
          project_id: ipc.projectId,
          project_name: ipc.projectName,
          team_id: ipc.teamId,
          team_name: ipc.teamName,
          period: ipc.period,
          submit_date: new Date().toISOString().split('T')[0],
          approval_date: ipc.approvalDate,
          proposed_amount: ipc.proposedAmount,
          approved_amount: ipc.approvedAmount,
          advance_deduction: ipc.advanceDeduction,
          retention_rate: ipc.retentionRate,
          retention_amount: ipc.retentionAmount,
          net_payable: ipc.netPayable,
          status: 'Đang chờ duyệt',
          notes: ipc.notes
        };
        const { data, error } = await supabase.from('ipcs').insert([ipcData]).select('*').single();
        if (error || !data) {
          console.error("Failed to insert ipc:", error);
          const newIpc = {
            id: `ipc-${ipc.type.toLowerCase()}-${Date.now()}`,
            submitDate: new Date().toISOString().split('T')[0],
            status: 'Đang chờ duyệt',
            ...ipc
          };
          set((state) => ({ ipcs: [newIpc, ...state.ipcs] }));
          return;
        }
        const newDbIpc = {
          id: data.id,
          type: data.type,
          projectId: data.project_id,
          projectName: data.project_name,
          teamId: data.team_id,
          teamName: data.team_name,
          period: data.period,
          submitDate: data.submit_date,
          approvalDate: data.approval_date,
          proposedAmount: data.proposed_amount,
          approvedAmount: data.approved_amount,
          advanceDeduction: data.advance_deduction,
          retentionRate: data.retention_rate,
          retentionAmount: data.retention_amount,
          netPayable: data.net_payable,
          status: data.status,
          notes: data.notes
        };
        set((state) => ({ ipcs: [newDbIpc, ...state.ipcs] }));
      },
      updateIPCStatus: async (id, status) => {
        set((state) => ({
          ipcs: state.ipcs.map(ipc => ipc.id === id ? { ...ipc, status } : ipc)
        }));
        if (id && !String(id).startsWith('ipc-')) {
          await supabase.from('ipcs').update({ status }).eq('id', id);
        }
      },

      // Material Actions
      addMaterial: async (mat) => {
        const matData = {
          project_id: mat.projectId,
          project_name: mat.projectName,
          code: mat.code,
          name: mat.name,
          unit: mat.unit,
          unit_price: mat.unitPrice,
          quantity_plan: mat.quantityPlan,
          quantity_actual: mat.quantityActual,
          supplier: mat.supplier,
          status: 'Bình thường'
        };
        const { data, error } = await supabase.from('materials').insert([matData]).select('*').single();
        if (error || !data) {
          console.error("Failed to insert material:", error);
          set((state) => ({
            materials: [{ id: `m-${Date.now()}`, status: 'Bình thường', ...mat }, ...state.materials]
          }));
          return;
        }
        const newMat = {
          id: data.id,
          projectId: data.project_id,
          projectName: data.project_name,
          code: data.code,
          name: data.name,
          unit: data.unit,
          unitPrice: data.unit_price,
          quantityPlan: data.quantity_plan,
          quantityActual: data.quantity_actual,
          supplier: data.supplier,
          status: data.status
        };
        set((state) => ({ materials: [newMat, ...state.materials] }));
      },
      getMaterialSheet: (projectName) => {
        const state = get();
        return state.materialSheets[projectName] || { items: [], rows: [], exportRows: [] };
      },
      setMaterialSheet: (projectName, sheetData) => {
        set((state) => ({
          materialSheets: {
            ...state.materialSheets,
            [projectName]: sheetData
          }
        }));
        get().syncMaterialSheetToSupabase(projectName);
      },
      resetMaterialSheet: (projectName) => set((state) => {
        const current = state.materialSheets[projectName] || {};
        return {
          materialSheets: {
            ...state.materialSheets,
            [projectName]: { ...current, items: [], rows: [], exportRows: [] }
          }
        };
      }),
      addMaterialColumn: (projectName, name) => set((state) => {
        if (!name) return state;
        const current = state.materialSheets[projectName] || { items: [], rows: [], exportRows: [] };
        const exists = current.items.some((item) => item.name.trim().toLowerCase() === name.trim().toLowerCase());
        if (exists) return state;
        const newItem = { id: `mat-${Date.now()}`, name: name.trim() };
        return {
          materialSheets: {
            ...state.materialSheets,
            [projectName]: {
              ...current,
              items: [...current.items, newItem],
              rows: (current.rows || []).map((row) => ({
                ...row,
                values: {
                  ...(row.values || {}),
                  [newItem.id]: { order: '', received: '' }
                }
              })),
              exportRows: (current.exportRows || []).map((row) => ({
                ...row,
                values: {
                  ...(row.values || {}),
                  [newItem.id]: { order: '', received: '' }
                }
              }))
            }
          }
        };
      }),
      updateMaterialColumn: (projectName, columnId, name) => set((state) => {
        const current = state.materialSheets[projectName];
        if (!current) return state;
        return {
          materialSheets: {
            ...state.materialSheets,
            [projectName]: {
              ...current,
              items: current.items.map((item) => (item.id === columnId ? { ...item, name } : item))
            }
          }
        };
      }),
      deleteMaterialColumn: (projectName, columnId) => set((state) => {
        const current = state.materialSheets[projectName];
        if (!current) return state;
        
        const deleteValue = (rows) => (rows || []).map((row) => {
          const nextValues = { ...(row.values || {}) };
          delete nextValues[columnId];
          return { ...row, values: nextValues };
        });

        return {
          materialSheets: {
            ...state.materialSheets,
            [projectName]: {
              ...current,
              items: current.items.filter((item) => item.id !== columnId),
              rows: deleteValue(current.rows),
              exportRows: deleteValue(current.exportRows)
            }
          }
        };
      }),
      addMaterialRow: (projectName, row = {}, isExport = false) => set((state) => {
        const current = state.materialSheets[projectName] || { items: [], rows: [], exportRows: [] };
        const values = {};
        current.items.forEach((item) => {
          values[item.id] = { order: '', received: '' };
        });
        
        if (isExport) {
          return {
            materialSheets: {
              ...state.materialSheets,
              [projectName]: {
                ...current,
                exportRows: [...(current.exportRows || []), { id: `export-row-${Date.now()}`, floor: '', values, ...row }]
              }
            }
          };
        }

        return {
          materialSheets: {
            ...state.materialSheets,
            [projectName]: {
              ...current,
              rows: [...(current.rows || []), { id: `row-${Date.now()}`, date: '', values, ...row }]
            }
          }
        };
      }),
      updateMaterialRow: (projectName, rowId, field, value, isExport = false) => set((state) => {
        const current = state.materialSheets[projectName];
        if (!current) return state;
        
        if (isExport) {
          return {
            materialSheets: {
              ...state.materialSheets,
              [projectName]: {
                ...current,
                exportRows: (current.exportRows || []).map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
              }
            }
          };
        }

        return {
          materialSheets: {
            ...state.materialSheets,
            [projectName]: {
              ...current,
              rows: (current.rows || []).map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
            }
          }
        };
      }),
      updateMaterialCell: (projectName, rowId, columnId, field, value, isExport = false) => set((state) => {
        const current = state.materialSheets[projectName];
        if (!current) return state;
        
        const updateRows = (rows) => (rows || []).map((row) => {
          if (row.id !== rowId) return row;
          return {
            ...row,
            values: {
              ...(row.values || {}),
              [columnId]: {
                ...(row.values?.[columnId] || {}),
                [field]: value
              }
            }
          };
        });

        if (isExport) {
          return {
            materialSheets: {
              ...state.materialSheets,
              [projectName]: {
                ...current,
                exportRows: updateRows(current.exportRows)
              }
            }
          };
        }

        return {
          materialSheets: {
            ...state.materialSheets,
            [projectName]: {
              ...current,
              rows: updateRows(current.rows)
            }
          }
        };
      }),
      updateMaterial: async (id, updatedData) => {
        set((state) => ({
          materials: state.materials.map(m => m.id === id ? { ...m, ...updatedData } : m)
        }));
        if (id && !String(id).startsWith('m-')) {
          const dbData = {};
          if (updatedData.code !== undefined) dbData.code = updatedData.code;
          if (updatedData.name !== undefined) dbData.name = updatedData.name;
          if (updatedData.unit !== undefined) dbData.unit = updatedData.unit;
          if (updatedData.unitPrice !== undefined) dbData.unit_price = updatedData.unitPrice;
          if (updatedData.quantityPlan !== undefined) dbData.quantity_plan = updatedData.quantityPlan;
          if (updatedData.quantityActual !== undefined) dbData.quantity_actual = updatedData.quantityActual;
          if (updatedData.supplier !== undefined) dbData.supplier = updatedData.supplier;
          if (updatedData.status !== undefined) dbData.status = updatedData.status;
          await supabase.from('materials').update(dbData).eq('id', id);
        }
      },
      deleteMaterial: async (id) => {
        set((state) => ({
          materials: state.materials.filter(m => m.id !== id)
        }));
        if (id && !String(id).startsWith('m-')) {
          await supabase.from('materials').delete().eq('id', id);
        }
      },

      // Payment Matrix Actions
      updateMatrixCell: (key, floor, itemKey, value) => { set((state) => {
        const projectName = key.includes('_') ? key.split('_')[0] : key;
        const baseMatrix = state.paymentMatrix[projectName] || [];
        const currentMatrix = (state.paymentMatrix[key] && state.paymentMatrix[key].length > 0)
          ? state.paymentMatrix[key]
          : JSON.parse(JSON.stringify(baseMatrix));

        const newMatrix = currentMatrix.map(row => {
          if (row.floor === floor) {
            return {
              ...row,
              items: { ...row.items, [itemKey]: value }
            };
          }
          return row;
        });

        let newState = {
          paymentMatrix: {
            ...state.paymentMatrix,
            [key]: newMatrix
          }
        };

        // Auto append "Đã lên HS" to ipc_select when ipc is updated
        if (key.endsWith('_ipc') && value && value.trim() !== '') {
          const selectKey = `${projectName}_ipc_select`;
          const selectMatrix = (state.paymentMatrix[selectKey] && state.paymentMatrix[selectKey].length > 0)
            ? state.paymentMatrix[selectKey]
            : JSON.parse(JSON.stringify(baseMatrix));
            
          const newSelectMatrix = selectMatrix.map(row => {
            if (row.floor === floor) {
              let existingVal = row.items[itemKey] || '';
              if (existingVal && !existingVal.includes('Đã lên HS')) {
                 const parts = existingVal.split(' + ');
                 parts[parts.length - 1] = `${parts[parts.length - 1]} - Đã lên HS`;
                 existingVal = parts.join(' + ');
                 return {
                   ...row,
                   items: { ...row.items, [itemKey]: existingVal }
                 };
              }
            }
            return row;
          });
          newState.paymentMatrix[selectKey] = newSelectMatrix;
        }

        return newState;
      });
        const projName = key.includes('_') ? key.split('_')[0] : key;
        get().syncMatrixDataToSupabase(projName);
      },
      
      addFloor: (projectName, floorName) => { set((state) => {
        const matrix = state.paymentMatrix[projectName] || state.paymentMatrix[`${projectName}_team`] || standardFloorsTemplate;
        const blocks = state.matrixBlocks[projectName] || [];
        if (!floorName || matrix.some(r => r.floor === floorName)) return state;
        
        const emptyItems = {};
        blocks.forEach(b => {
          b.groups.forEach(g => {
            g.items.forEach(item => {
              emptyItems[`${b.blockName}_${g.groupName}_${item}`] = '';
            });
          });
        });

        const newRow = { floor: floorName, numApts: '', items: emptyItems };
        const newMatrix = [newRow, ...matrix];
        return {
          paymentMatrix: { ...state.paymentMatrix, [projectName]: sortFloors(newMatrix) }
        };
      });
        get().syncMatrixDataToSupabase(projectName);
      },

      updateFloorName: (projectName, oldFloorName, newFloorName) => { set((state) => {
        const matrix = state.paymentMatrix[projectName] || [];
        if (!newFloorName || oldFloorName === newFloorName || matrix.some(r => r.floor === newFloorName)) return state;
        
        const newMatrix = matrix.map(row => {
          if (row.floor === oldFloorName) {
            return { ...row, floor: newFloorName };
          }
          return row;
        });
        
        return {
          paymentMatrix: { ...state.paymentMatrix, [projectName]: sortFloors(newMatrix) }
        };
      });
        get().syncMatrixDataToSupabase(projectName);
      },
      
      updateFloorNumApts: (projectName, floor, numApts) => { set((state) => {
        const targetFloor = String(floor).trim();
        const baseMatrix = state.paymentMatrix[projectName] || state.paymentMatrix[`${projectName}_team`] || standardFloorsTemplate;
        const newBaseMatrix = baseMatrix.map(row => {
          if (String(row.floor).trim() === targetFloor) {
            return { ...row, numApts };
          }
          return row;
        });

        const teamMatrix = state.paymentMatrix[`${projectName}_team`] || newBaseMatrix;
        const newTeamMatrix = teamMatrix.map(row => {
          if (String(row.floor).trim() === targetFloor) {
            return { ...row, numApts };
          }
          return row;
        });

        return {
          paymentMatrix: { 
            ...state.paymentMatrix, 
            [projectName]: newBaseMatrix,
            [`${projectName}_team`]: newTeamMatrix
          }
        };
      });
        get().syncMatrixDataToSupabase(projectName);
      },

      deleteFloor: (projectName, floorName) => { set((state) => {
        const targetFloor = String(floorName).trim();
        const currentBase = state.paymentMatrix[projectName] || state.paymentMatrix[`${projectName}_team`] || standardFloorsTemplate;
        const newBaseMatrix = currentBase.filter(row => String(row.floor).trim() !== targetFloor);

        const newPaymentMatrix = { ...state.paymentMatrix };

        // Clean from all keys for this project
        Object.keys(newPaymentMatrix).forEach(key => {
          if (key === projectName || key.startsWith(`${projectName}_`)) {
            if (Array.isArray(newPaymentMatrix[key])) {
              newPaymentMatrix[key] = newPaymentMatrix[key].filter(row => String(row.floor).trim() !== targetFloor);
            }
          }
        });

        newPaymentMatrix[projectName] = newBaseMatrix;
        newPaymentMatrix[`${projectName}_team`] = newBaseMatrix;
        if (!newPaymentMatrix[`${projectName}_ipc`]) {
          newPaymentMatrix[`${projectName}_ipc`] = newBaseMatrix.map(r => ({ floor: r.floor, numApts: r.numApts, items: {} }));
        }

        return { paymentMatrix: newPaymentMatrix };
      });
        get().syncMatrixDataToSupabase(projectName);
      },
      
      
      deleteCategoryName: (projectName, blockIdx, groupIdx, itemIdx) => { set((state) => {
        const blocks = state.matrixBlocks[projectName] || [];
        const newBlocks = JSON.parse(JSON.stringify(blocks));
        
        const blockName = newBlocks[blockIdx].blockName;
        const groupName = newBlocks[blockIdx].groups[groupIdx].groupName;
        const itemName = newBlocks[blockIdx].groups[groupIdx].items[itemIdx];
        const keyToDelete = `${blockName}_${groupName}_${itemName}`;
        
        newBlocks[blockIdx].groups[groupIdx].items.splice(itemIdx, 1);
        
        const matrix = state.paymentMatrix[projectName] || [];
        const newMatrix = matrix.map(row => {
          const newItems = { ...row.items };
          delete newItems[keyToDelete];
          return { ...row, items: newItems };
        });

        return { 
          matrixBlocks: { ...state.matrixBlocks, [projectName]: newBlocks }, 
          paymentMatrix: { ...state.paymentMatrix, [projectName]: newMatrix } 
        };
      });
        get().syncMatrixDataToSupabase(projectName);
      },

      deleteGroupName: (projectName, blockIdx, groupIdx) => { set((state) => {
        const blocks = state.matrixBlocks[projectName] || [];
        const newBlocks = JSON.parse(JSON.stringify(blocks));
        
        const blockName = newBlocks[blockIdx].blockName;
        const groupName = newBlocks[blockIdx].groups[groupIdx].groupName;
        const items = newBlocks[blockIdx].groups[groupIdx].items;
        
        const keysToDelete = items.map(item => `${blockName}_${groupName}_${item}`);
        newBlocks[blockIdx].groups.splice(groupIdx, 1);
        
        const matrix = state.paymentMatrix[projectName] || [];
        const newMatrix = matrix.map(row => {
          const newItems = { ...row.items };
          keysToDelete.forEach(key => delete newItems[key]);
          return { ...row, items: newItems };
        });

        return { 
          matrixBlocks: { ...state.matrixBlocks, [projectName]: newBlocks },
          paymentMatrix: { ...state.paymentMatrix, [projectName]: newMatrix }
        };
      });
        get().syncMatrixDataToSupabase(projectName);
      },

      deleteBlockName: (projectName, blockIdx) => { set((state) => {
        const blocks = state.matrixBlocks[projectName] || [];
        const newBlocks = JSON.parse(JSON.stringify(blocks));
        
        const blockName = newBlocks[blockIdx].blockName;
        const groups = newBlocks[blockIdx].groups;
        
        const keysToDelete = [];
        groups.forEach(group => {
          group.items.forEach(item => {
            keysToDelete.push(`${blockName}_${group.groupName}_${item}`);
          });
        });
        
        newBlocks.splice(blockIdx, 1);
        
        const matrix = state.paymentMatrix[projectName] || [];
        const newMatrix = matrix.map(row => {
          const newItems = { ...row.items };
          keysToDelete.forEach(key => delete newItems[key]);
          return { ...row, items: newItems };
        });

        return { 
          matrixBlocks: { ...state.matrixBlocks, [projectName]: newBlocks },
          paymentMatrix: { ...state.paymentMatrix, [projectName]: newMatrix }
        };
      });
        get().syncMatrixDataToSupabase(projectName);
      },

      updateCategoryName: (projectName, blockIdx, groupIdx, itemIdx, oldName, newName) => { set((state) => {
        if (!newName || oldName === newName) return state;
        const blocks = state.matrixBlocks[projectName] || [];
        const newBlocks = JSON.parse(JSON.stringify(blocks));
        
        const blockName = newBlocks[blockIdx].blockName;
        const groupName = newBlocks[blockIdx].groups[groupIdx].groupName;
        
        const oldKey = `${blockName}_${groupName}_${oldName}`;
        const newKey = `${blockName}_${groupName}_${newName}`;
        
        newBlocks[blockIdx].groups[groupIdx].items[itemIdx] = newName;
        
        const matrix = state.paymentMatrix[projectName] || [];
        const newMatrix = matrix.map(row => {
          const newItems = { ...row.items };
          if (newItems[oldKey] !== undefined) {
            newItems[newKey] = newItems[oldKey];
            delete newItems[oldKey];
          }
          return { ...row, items: newItems };
        });

        return { 
          matrixBlocks: { ...state.matrixBlocks, [projectName]: newBlocks }, 
          paymentMatrix: { ...state.paymentMatrix, [projectName]: newMatrix } 
        };
      });
        get().syncMatrixDataToSupabase(projectName);
      },

      updateGroupName: (projectName, blockIdx, groupIdx, newName) => { set((state) => {
        if (!newName) return state;
        const blocks = state.matrixBlocks[projectName] || [];
        const newBlocks = JSON.parse(JSON.stringify(blocks));
        
        const blockName = newBlocks[blockIdx].blockName;
        const oldGroupName = newBlocks[blockIdx].groups[groupIdx].groupName;
        newBlocks[blockIdx].groups[groupIdx].groupName = newName;
        
        const matrix = state.paymentMatrix[projectName] || [];
        const newMatrix = matrix.map(row => {
          const newItems = { ...row.items };
          newBlocks[blockIdx].groups[groupIdx].items.forEach(item => {
             const oldKey = `${blockName}_${oldGroupName}_${item}`;
             const newKey = `${blockName}_${newName}_${item}`;
             if (newItems[oldKey] !== undefined) {
               newItems[newKey] = newItems[oldKey];
               delete newItems[oldKey];
             }
          });
          return { ...row, items: newItems };
        });

        return { 
          matrixBlocks: { ...state.matrixBlocks, [projectName]: newBlocks },
          paymentMatrix: { ...state.paymentMatrix, [projectName]: newMatrix }
        };
      });
        get().syncMatrixDataToSupabase(projectName);
      },

      updateBlockName: (projectName, blockIdx, newName) => { set((state) => {
        if (!newName) return state;
        const blocks = state.matrixBlocks[projectName] || [];
        const newBlocks = JSON.parse(JSON.stringify(blocks));
        
        const oldBlockName = newBlocks[blockIdx].blockName;
        newBlocks[blockIdx].blockName = newName;
        
        const matrix = state.paymentMatrix[projectName] || [];
        const newMatrix = matrix.map(row => {
          const newItems = { ...row.items };
          newBlocks[blockIdx].groups.forEach(group => {
            group.items.forEach(item => {
               const oldKey = `${oldBlockName}_${group.groupName}_${item}`;
               const newKey = `${newName}_${group.groupName}_${item}`;
               if (newItems[oldKey] !== undefined) {
                 newItems[newKey] = newItems[oldKey];
                 delete newItems[oldKey];
               }
            });
          });
          return { ...row, items: newItems };
        });

        return { 
          matrixBlocks: { ...state.matrixBlocks, [projectName]: newBlocks },
          paymentMatrix: { ...state.paymentMatrix, [projectName]: newMatrix }
        };
      });
        get().syncMatrixDataToSupabase(projectName);
      },

      addBOQNode: (projectName, blockName, groupName, itemName) => { set((state) => {
        if (!blockName || !groupName || !itemName) return state;
        const blocks = state.matrixBlocks[projectName] || [];
        const newBlocks = JSON.parse(JSON.stringify(blocks));
        let block = newBlocks.find(b => b.blockName === blockName);
        if (!block) {
          block = { blockName, groups: [] };
          newBlocks.push(block);
        }
        let group = block.groups.find(g => g.groupName === groupName);
        if (!group) {
          group = { groupName, items: [] };
          block.groups.push(group);
        }
        if (!group.items.includes(itemName)) {
          group.items.push(itemName);
        }

        const newKey = `${blockName}_${groupName}_${itemName}`;
        const matrix = state.paymentMatrix[projectName] || [];
        const newMatrix = matrix.map(row => ({
          ...row,
          items: { ...row.items, [newKey]: row.items[newKey] !== undefined ? row.items[newKey] : '' }
        }));

        return { 
          matrixBlocks: { ...state.matrixBlocks, [projectName]: newBlocks }, 
          paymentMatrix: { ...state.paymentMatrix, [projectName]: newMatrix } 
        };
      });
        get().syncMatrixDataToSupabase(projectName);
      },

      addCategoryGroup: (projectName, blockIdx, groupName) => { set((state) => {
        if (!groupName) return state;
        const blocks = state.matrixBlocks[projectName] || state.matrixBlocks['BCONS TĐH'] || standardBlocksTemplateLocal;
        const newBlocks = JSON.parse(JSON.stringify(blocks));
        
        const default6Steps = ['BẢ LỚP 1', 'BẢ LỚP 2', 'XẢ NHÁM', 'SƠN LÓT', 'SƠN PHỦ 1', 'SƠN PHỦ 2'];

        newBlocks[blockIdx].groups.push({
          groupName,
          items: default6Steps
        });

        const blockName = newBlocks[blockIdx].blockName;
        const matrix = state.paymentMatrix[projectName] || state.paymentMatrix[`${projectName}_team`] || standardFloorsTemplate;
        const newMatrix = matrix.map(row => {
          const newItems = { ...row.items };
          default6Steps.forEach(step => {
            const key = `${blockName}_${groupName}_${step}`;
            if (newItems[key] === undefined) newItems[key] = '';
          });
          return { ...row, items: newItems };
        });

        return { 
          matrixBlocks: { ...state.matrixBlocks, [projectName]: newBlocks },
          paymentMatrix: { 
            ...state.paymentMatrix, 
            [projectName]: newMatrix,
            [`${projectName}_team`]: newMatrix
          } 
        };
      });
        get().syncMatrixDataToSupabase(projectName);
      },

      addCategoryItem: (projectName, blockIdx, groupIdx, itemName) => { set((state) => {
        if (!itemName) return state;
        const blocks = state.matrixBlocks[projectName] || [];
        const newBlocks = JSON.parse(JSON.stringify(blocks));
        if (newBlocks[blockIdx].groups[groupIdx].items.includes(itemName)) return state;
        
        newBlocks[blockIdx].groups[groupIdx].items.push(itemName);
        
        const blockName = newBlocks[blockIdx].blockName;
        const groupName = newBlocks[blockIdx].groups[groupIdx].groupName;
        const newKey = `${blockName}_${groupName}_${itemName}`;
        
        const matrix = state.paymentMatrix[projectName] || [];
        const newMatrix = matrix.map(row => ({
          ...row,
          items: { ...row.items, [newKey]: '' }
        }));

        return { 
          matrixBlocks: { ...state.matrixBlocks, [projectName]: newBlocks }, 
          paymentMatrix: { ...state.paymentMatrix, [projectName]: newMatrix } 
        };
      });
        get().syncMatrixDataToSupabase(projectName);
      },

      // Reset to default mock data
      // Reset to default mock data
      resetToDefault: () => set({
        users: initialUsers,
        projects: initialProjects,
        teams: initialTeams,
        ipcs: initialIPCs,
        materials: initialMaterials,
        materialSheets: {},
        paymentMatrix: initialPaymentMatrix,
        matrixBlocks: defaultMatrixBlocksLocal
      }),

      // Supabase sync simulation / loader
      fetchSupabaseData: async () => {
        set({ isLoading: true });
        try {
          // Fetch Users
          const { data: usersData, error: usersError } = await supabase.from('users').select('*');
          if (!usersError && usersData && usersData.length > 0) {
            const currentUsers = get().users;
            const mappedUsers = usersData.map(u => {
              const localUser = currentUsers.find(cu => cu.username === u.username);
              return {
                id: u.id,
              name: u.name,
              username: u.username,
              phone: u.phone,
              role: u.role,
              status: u.status,
              lastLogin: u.last_login,
              ipLogin: u.ip_login,
                ipHistory: u.ip_login ? [u.ip_login] : [],
                signature: u.signature_url,
                allowViewFinancials: u.allow_view_financials,
                password: u.password || (localUser ? localUser.password : undefined)
              };
            });
            
            // Ensure @admin is always available if missing from DB
            const mergedUsers = [...mappedUsers];
            const adminUser = initialUsers.find(u => u.username === '@admin');
            if (adminUser && !mergedUsers.find(mu => mu.username === '@admin')) {
              mergedUsers.push(adminUser);
            }
            set({ users: mergedUsers });
          } else if (!usersError && usersData && usersData.length === 0) {
            // Table is empty, auto-seed with initialUsers!
            const usersToInsert = initialUsers.map(u => ({
              name: u.name,
              username: u.username,
              phone: u.phone,
              role: u.role,
              status: u.status,
              last_login: u.lastLogin,
              ip_login: u.ipLogin,
              signature_url: u.signature,
              allow_view_financials: u.allowViewFinancials
            }));
            supabase.from('users').insert(usersToInsert).then(({ error }) => {
              if (error) console.error("Failed to auto-seed users:", error);
              else console.log("Auto-seeded initial users to Supabase");
            });
          }

          // Fetch Projects
          const { data: projectsData, error: projectsError } = await supabase.from('projects').select('*');
          if (!projectsError && projectsData) {
            const mappedProjects = projectsData.map(p => ({
              id: p.id,
              name: p.name,
              orderType: p.order_type,
              subContractorCount: p.sub_contractor_count,
              subContractorInfo: p.sub_contractor_info,
              address: p.address,
              contractNo: p.contract_no,
              contractDate: p.contract_date,
              cht: p.cht || [],
              contractValue: p.contract_value,
              addendumValue: p.addendum_value,
              advancePayment: p.advance_payment,
              status: p.status,
              progress: p.progress,
              numBlocks: (p.matrix_blocks?.length || 1).toString()
            }));
            set({ projects: mappedProjects });
            
            const blocks = {};
            const matrix = {};
            projectsData.forEach(p => {
              if (p.matrix_blocks) blocks[p.name] = p.matrix_blocks;
              if (p.matrix_data) {
                if (Array.isArray(p.matrix_data)) {
                  matrix[p.name] = p.matrix_data;
                } else if (typeof p.matrix_data === 'object') {
                  if (p.matrix_data.base) matrix[p.name] = p.matrix_data.base;
                  if (p.matrix_data.ipc) matrix[`${p.name}_ipc`] = p.matrix_data.ipc;
                  if (p.matrix_data.team) matrix[`${p.name}_team`] = p.matrix_data.team;
                }
              }
            });
            set((state) => ({ 
              matrixBlocks: { ...state.matrixBlocks, ...blocks },
              paymentMatrix: { ...state.paymentMatrix, ...matrix }
            }));
          }

          // Fetch Teams
          const { data: teamsData, error: teamsError } = await supabase.from('teams').select('*');
          if (!teamsError && teamsData) {
            const mappedTeams = teamsData.map(t => ({
              id: t.id,
              projectId: t.project_id,
              projectName: t.project_name,
              projects: t.projects,
              members: t.members,
              teamName: t.team_name,
              leaderName: t.leader_name,
              phone: t.phone,
              tradeType: t.trade_type,
              workerCount: t.worker_count,
              contractValue: t.contract_value,
              paidAmount: t.paid_amount,
              retentionAmount: t.retention_amount,
              remainingAmount: t.remaining_amount,
              status: t.status
            }));
            set({ teams: mappedTeams });
          }

          // Fetch IPCs
          const { data: ipcsData, error: ipcsError } = await supabase.from('ipcs').select('*');
          if (!ipcsError && ipcsData) {
            const mappedIpcs = ipcsData.map(ipc => ({
              id: ipc.id,
              type: ipc.type,
              projectId: ipc.project_id,
              projectName: ipc.project_name,
              teamId: ipc.team_id,
              teamName: ipc.team_name,
              period: ipc.period,
              submitDate: ipc.submit_date,
              approvalDate: ipc.approval_date,
              proposedAmount: ipc.proposed_amount,
              approvedAmount: ipc.approved_amount,
              advanceDeduction: ipc.advance_deduction,
              retentionRate: ipc.retention_rate,
              retentionAmount: ipc.retention_amount,
              netPayable: ipc.net_payable,
              status: ipc.status,
              notes: ipc.notes
            }));
            set({ ipcs: mappedIpcs });
          }

          // Fetch Materials
          const { data: matData, error: matError } = await supabase.from('materials').select('*');
          if (!matError && matData) {
            const mappedMat = matData.map(m => ({
              id: m.id,
              projectId: m.project_id,
              projectName: m.project_name,
              code: m.code,
              name: m.name,
              unit: m.unit,
              unitPrice: m.unit_price,
              quantityPlan: m.quantity_plan,
              quantityActual: m.quantity_actual,
              supplier: m.supplier,
              status: m.status
            }));
            set({ materials: mappedMat });
          }

          // Fetch Material Sheets
          const { data: sheetsData, error: sheetsError } = await supabase.from('material_sheets').select('*');
          if (!sheetsError && sheetsData) {
            const mats = {};
            sheetsData.forEach(s => {
              mats[s.project_name] = {
                items: s.items || [],
                rows: s.receive_rows || [],
                exportRows: s.export_rows || []
              };
            });
            set((state) => ({
              materialSheets: { ...state.materialSheets, ...mats }
            }));
          }

        } catch (err) {
          console.log('Using local mock state (Supabase fallback active):', err);
        } finally {
          set({ isLoading: false });
        }
      },

      syncMatrixDataToSupabase: async (projectName) => {
        const state = get();
        const project = state.projects.find(p => p.name === projectName);
        if (!project) return;
        
        const blocks = state.matrixBlocks[projectName] || [];
        const matrixDataObj = {
          base: state.paymentMatrix[projectName] || [],
          ipc: state.paymentMatrix[`${projectName}_ipc`] || [],
          team: state.paymentMatrix[`${projectName}_team`] || []
        };
        
        try {
          // Đối với các project mock (có id bắt đầu bằng 'p-'), ta phải update theo name vì id trong DB không khớp
          if (String(project.id).startsWith('p-')) {
            const { error } = await supabase
              .from('projects')
              .update({ 
                matrix_blocks: blocks, 
                matrix_data: matrixDataObj 
              })
              .eq('name', project.name);
            if (error) console.error('Failed to sync matrix to Supabase (by name):', error);
          } else {
            const { error } = await supabase
              .from('projects')
              .update({ 
                matrix_blocks: blocks, 
                matrix_data: matrixDataObj 
              })
              .eq('id', project.id);
            if (error) console.error('Failed to sync matrix to Supabase (by id):', error);
          }
        } catch (err) {
          console.error('Supabase sync error:', err);
        }
      },

      syncMaterialSheetToSupabase: async (projectName) => {
        const state = get();
        const sheet = state.materialSheets[projectName] || { items: [], rows: [], exportRows: [] };
        
        try {
          const { error } = await supabase
            .from('material_sheets')
            .upsert(
              { 
                project_name: projectName,
                items: sheet.items,
                receive_rows: sheet.rows,
                export_rows: sheet.exportRows,
                updated_at: new Date().toISOString()
              },
              { onConflict: 'project_name' }
            );
          
          if (error) {
            console.error('Failed to sync material sheet to Supabase:', error);
          }
        } catch (err) {
          console.error('Supabase material sheet sync error:', err);
        }
      }
    }),
    {
      name: 'qss-pro-storage-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const { currentUser, ...rest } = state;
        return rest;
      },
      // An empty project list is valid. Do not re-add mock projects after users
      // intentionally delete every project and refresh the browser.
      onRehydrateStorage: () => () => {}
    }
  )
);

export const useAllowedProjects = () => {
  const projects = useStore((state) => state.projects);
  const currentUser = useStore((state) => state.currentUser);
  
  if (!currentUser) return projects;
  
  const role = currentUser.role || '';
  if (['ADMIN', 'GIÁM ĐỐC', 'QS', 'QSA'].includes(role.toUpperCase())) {
    return projects;
  }
  
  return projects.filter(p => p.cht && p.cht.includes(currentUser.name));
};
