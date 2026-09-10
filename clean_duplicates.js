// Hướng dẫn chạy code này:
// 1. Mở DevTools (F12) trên trình duyệt
// 2. Dán đoạn code sau vào tab Console và ấn Enter

(async function() {
  try {
    const store = useStore.getState();
    const projectName = 'THE ASPIRA';
    let rawBlocks = store.matrixBlocks[projectName];
    if (!rawBlocks) {
      console.log('Không tìm thấy blocks cho THE ASPIRA');
      return;
    }
    
    let newBlocks = JSON.parse(JSON.stringify(rawBlocks));
    let changed = false;
    
    newBlocks.forEach(block => {
      let uniqueGroups = [];
      block.groups.forEach(group => {
        const existing = uniqueGroups.find(g => g.groupName.trim() === group.groupName.trim());
        if (existing) {
          existing.items = [...new Set([...existing.items, ...group.items])];
          changed = true;
        } else {
          uniqueGroups.push(group);
        }
      });
      block.groups = uniqueGroups;
    });
    
    if (changed) {
      store.matrixBlocks[projectName] = newBlocks;
      await store.syncMatrixDataToSupabase(projectName);
      console.log('✅ Đã dọn dẹp các nhóm bị trùng lặp! Hãy F5 lại trang.');
    } else {
      console.log('Không có nhóm nào bị trùng lặp.');
    }
  } catch (e) {
    console.error('Lỗi:', e);
  }
})();
