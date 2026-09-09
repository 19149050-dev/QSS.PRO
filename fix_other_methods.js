const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'store', 'useStore.js');
let content = fs.readFileSync(filePath, 'utf8');

// Fix addCategoryItem
const addItemRegex = /const matrix = state\.paymentMatrix\[projectName\] \|\| \[\];\s*const newMatrix = matrix\.map\(row => \(\{\s*\.\.\.row,\s*items: \{ \.\.\.row\.items, \[newKey\]: '' \}\s*\}\)\);\s*return \{ \s*matrixBlocks: \{ \.\.\.state\.matrixBlocks, \[projectName\]: newBlocks \}, \s*paymentMatrix: \{ \.\.\.state\.paymentMatrix, \[projectName\]: newMatrix \} \s*\};/g;
const addItemReplacement = `const updateMatrix = (matrixKey) => {
          const matrix = state.paymentMatrix[matrixKey] || [];
          return matrix.map(row => ({
            ...row,
            items: { ...row.items, [newKey]: '' }
          }));
        };

        return { 
          matrixBlocks: { ...state.matrixBlocks, [projectName]: newBlocks }, 
          paymentMatrix: { 
            ...state.paymentMatrix, 
            [projectName]: updateMatrix(projectName),
            [\`\${projectName}_team\`]: updateMatrix(\`\${projectName}_team\`),
            [\`\${projectName}_ipc\`]: updateMatrix(\`\${projectName}_ipc\`)
          } 
        };`;
content = content.replace(addItemRegex, addItemReplacement);

// Fix deleteCategoryName
const deleteItemRegex = /const matrix = state\.paymentMatrix\[projectName\] \|\| \[\];\s*const newMatrix = matrix\.map\(row => \{\s*const newItems = \{ \.\.\.row\.items \};\s*delete newItems\[keyToDelete\];\s*return \{ \.\.\.row, items: newItems \};\s*\}\);\s*return \{ \s*matrixBlocks: \{ \.\.\.state\.matrixBlocks, \[projectName\]: newBlocks \}, \s*paymentMatrix: \{ \.\.\.state\.paymentMatrix, \[projectName\]: newMatrix \} \s*\};/g;
const deleteItemReplacement = `const updateMatrix = (matrixKey) => {
          const matrix = state.paymentMatrix[matrixKey] || [];
          return matrix.map(row => {
            const newItems = { ...row.items };
            delete newItems[keyToDelete];
            return { ...row, items: newItems };
          });
        };

        return { 
          matrixBlocks: { ...state.matrixBlocks, [projectName]: newBlocks }, 
          paymentMatrix: { 
            ...state.paymentMatrix, 
            [projectName]: updateMatrix(projectName),
            [\`\${projectName}_team\`]: updateMatrix(\`\${projectName}_team\`),
            [\`\${projectName}_ipc\`]: updateMatrix(\`\${projectName}_ipc\`)
          } 
        };`;
content = content.replace(deleteItemRegex, deleteItemReplacement);

// Fix deleteGroupName
const deleteGroupRegex = /const matrix = state\.paymentMatrix\[projectName\] \|\| \[\];\s*const newMatrix = matrix\.map\(row => \{\s*const newItems = \{ \.\.\.row\.items \};\s*keysToDelete\.forEach\(key => delete newItems\[key\]\);\s*return \{ \.\.\.row, items: newItems \};\s*\}\);\s*return \{ \s*matrixBlocks: \{ \.\.\.state\.matrixBlocks, \[projectName\]: newBlocks \},\s*paymentMatrix: \{ \.\.\.state\.paymentMatrix, \[projectName\]: newMatrix \}\s*\};/g;
const deleteGroupReplacement = `const updateMatrix = (matrixKey) => {
          const matrix = state.paymentMatrix[matrixKey] || [];
          return matrix.map(row => {
            const newItems = { ...row.items };
            keysToDelete.forEach(key => delete newItems[key]);
            return { ...row, items: newItems };
          });
        };

        return { 
          matrixBlocks: { ...state.matrixBlocks, [projectName]: newBlocks },
          paymentMatrix: { 
            ...state.paymentMatrix, 
            [projectName]: updateMatrix(projectName),
            [\`\${projectName}_team\`]: updateMatrix(\`\${projectName}_team\`),
            [\`\${projectName}_ipc\`]: updateMatrix(\`\${projectName}_ipc\`)
          }
        };`;
content = content.replace(deleteGroupRegex, deleteGroupReplacement);

// Fix deleteBlockName
const deleteBlockRegex = /const matrix = state\.paymentMatrix\[projectName\] \|\| \[\];\s*const newMatrix = matrix\.map\(row => \{\s*const newItems = \{ \.\.\.row\.items \};\s*keysToDelete\.forEach\(key => delete newItems\[key\]\);\s*return \{ \.\.\.row, items: newItems \};\s*\}\);\s*return \{ \s*matrixBlocks: \{ \.\.\.state\.matrixBlocks, \[projectName\]: newBlocks \},\s*paymentMatrix: \{ \.\.\.state\.paymentMatrix, \[projectName\]: newMatrix \}\s*\};/g;
const deleteBlockReplacement = `const updateMatrix = (matrixKey) => {
          const matrix = state.paymentMatrix[matrixKey] || [];
          return matrix.map(row => {
            const newItems = { ...row.items };
            keysToDelete.forEach(key => delete newItems[key]);
            return { ...row, items: newItems };
          });
        };

        return { 
          matrixBlocks: { ...state.matrixBlocks, [projectName]: newBlocks },
          paymentMatrix: { 
            ...state.paymentMatrix, 
            [projectName]: updateMatrix(projectName),
            [\`\${projectName}_team\`]: updateMatrix(\`\${projectName}_team\`),
            [\`\${projectName}_ipc\`]: updateMatrix(\`\${projectName}_ipc\`)
          }
        };`;
content = content.replace(deleteBlockRegex, deleteBlockReplacement);


fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed other methods in useStore.js');
