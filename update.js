const fs = require('fs');
let code = fs.readFileSync('src/components/PaymentMatrix.jsx', 'utf8');

// 1. Update useStore destructing to use alias
code = code.replace(
  '  const { paymentMatrix, matrixBlocks, updateMatrixCell, updateCategoryName, updateGroupName, addCategoryGroup, addCategoryItem, addFloor, updateFloorName, updateFloorNumApts, deleteFloor, updateBlockName, addBOQNode } = useStore();',
  `  const store = useStore();
  const paymentMatrix = store.paymentMatrix[projectName] || [];
  const matrixBlocks = store.matrixBlocks[projectName] || [];
  
  const updateMatrixCell = (...args) => store.updateMatrixCell(projectName, ...args);
  const updateCategoryName = (...args) => store.updateCategoryName(projectName, ...args);
  const updateGroupName = (...args) => store.updateGroupName(projectName, ...args);
  const addCategoryGroup = (...args) => store.addCategoryGroup(projectName, ...args);
  const addCategoryItem = (...args) => store.addCategoryItem(projectName, ...args);
  const addFloor = (...args) => store.addFloor(projectName, ...args);
  const updateFloorName = (...args) => store.updateFloorName(projectName, ...args);
  const updateFloorNumApts = (...args) => store.updateFloorNumApts(projectName, ...args);
  const deleteFloor = (...args) => store.deleteFloor(projectName, ...args);
  const updateBlockName = (...args) => store.updateBlockName(projectName, ...args);
  const addBOQNode = (...args) => store.addBOQNode(projectName, ...args);`
);

// 2. Add onDelete to promptConfig state
code = code.replace(
  'const [promptConfig, setPromptConfig] = useState({ isOpen: false, title: \'\', isConfirm: false, onConfirm: null });',
  'const [promptConfig, setPromptConfig] = useState({ isOpen: false, title: \'\', isConfirm: false, onConfirm: null, onDelete: null });'
);

// 3. Update openPrompt to accept onDelete
code = code.replace(
  '  const openPrompt = (title, defaultValue, onConfirm) => {\n    setPromptConfig({ isOpen: true, title, isConfirm: false, onConfirm });',
  '  const openPrompt = (title, defaultValue, onConfirm, onDelete = null) => {\n    setPromptConfig({ isOpen: true, title, isConfirm: false, onConfirm, onDelete });'
);

// 4. Update handleDeleteFloor inside handleEditFloor
code = code.replace(
  /const handleEditFloor = \(oldName\) => \{[\s\S]*?updateFloorName\(oldName, newName\.trim\(\)\);\n      \}\n    \}\);\n  \};/,
  `const handleEditFloor = (oldName) => {
    openPrompt("Nhập tên TẦNG mới (VD: Tầng 16 (50%)):", oldName, (newName) => {
      if (newName && newName.trim() !== '' && newName !== oldName) {
        updateFloorName(oldName, newName.trim());
      }
    }, () => {
      openConfirm(\`Bạn có chắc chắn muốn xóa Tầng \${oldName} không? Toàn bộ dữ liệu của tầng này sẽ bị mất.\`, () => {
        deleteFloor(oldName);
      });
    });
  };`
);

// 5. Update cell rendering logic for compound keys
code = code.replace(
  '                      const rawVal = row.items[cat];\n                      const displayVal = displayCellValue(rawVal, selectedTeamFilter);\n                      const bgColor = getCellColor(displayVal || rawVal);\n                      return (\n                        <td\n                          key={`${bIdx}-${gIdx}-${cIdx}`}\n                          onClick={() => handleCellClick(row.floor, cat, rawVal)}',
  `                      const itemKey = \`\${block.blockName}_\${group.groupName}_\${cat}\`;
                      const rawVal = row.items[itemKey];
                      const displayVal = displayCellValue(rawVal, selectedTeamFilter);
                      const bgColor = getCellColor(displayVal || rawVal);
                      return (
                        <td
                          key={\`\${bIdx}-\${gIdx}-\${cIdx}\`}
                          onClick={() => handleCellClick(row.floor, itemKey, rawVal)}`
);

// 6. Update CustomPromptModal to render Delete button
code = code.replace(
  '              <div className="pt-4 flex justify-end gap-3">\n                <button',
  `              <div className="pt-4 flex justify-end gap-3">
                {!promptConfig.isConfirm && promptConfig.onDelete && (
                  <button
                    onClick={() => { promptConfig.onDelete(); setPromptConfig({ ...promptConfig, isOpen: false }); }}
                    className="mr-auto px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs border border-red-100"
                  >
                    Xóa
                  </button>
                )}
                <button`
);

fs.writeFileSync('src/components/PaymentMatrix.jsx', code);
console.log('PaymentMatrix.jsx updated successfully');
