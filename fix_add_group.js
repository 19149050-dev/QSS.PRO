const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'store', 'useStore.js');
let content = fs.readFileSync(filePath, 'utf8');

// Fix addCategoryGroup
const addGroupRegex = /const matrix = state\.paymentMatrix\[projectName\] \|\| state\.paymentMatrix\[\`\$\{projectName\}_team\`\] \|\| standardFloorsTemplate;\s*const newMatrix = matrix\.map\(row => \{\s*const newItems = \{ \.\.\.row\.items \};\s*initialItems\.forEach\(step => \{\s*const key = \`\$\{blockName\}_\$\{groupName\}_\$\{step\}\`;\s*if \(newItems\[key\] === undefined\) newItems\[key\] = '';\s*\}\);\s*return \{ \.\.\.row, items: newItems \};\s*\}\);\s*return \{ \s*matrixBlocks: \{ \.\.\.state\.matrixBlocks, \[projectName\]: newBlocks \},\s*paymentMatrix: \{ \s*\.\.\.state\.paymentMatrix, \s*\[projectName\]: newMatrix,\s*\[\`\$\{projectName\}_team\`\]: newMatrix\s*\} \s*\};\s*\}\);/g;

const addGroupReplacement = `const updateMatrix = (matrixKey) => {
          const matrix = state.paymentMatrix[matrixKey] || (matrixKey === projectName ? standardFloorsTemplate : []);
          return matrix.map(row => {
            const newItems = { ...row.items };
            initialItems.forEach(step => {
              const key = \`\${blockName}_\${groupName}_\${step}\`;
              if (newItems[key] === undefined) newItems[key] = '';
            });
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
        };
      });`;

content = content.replace(addGroupRegex, addGroupReplacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed addCategoryGroup in useStore.js');
