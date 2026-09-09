const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'store', 'useStore.js');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /const blocks = state\.matrixBlocks\[projectName\] \|\| \[\];/g;
const replacement = `const isTC = state.projects?.find(p => p.name?.trim() === projectName?.trim())?.projectType?.trim() === 'Thạch cao';
        const fallback = isTC ? thachCaoBlocksTemplate : standardBlocksTemplate;
        const blocks = (state.matrixBlocks[projectName] && state.matrixBlocks[projectName].length > 0) ? state.matrixBlocks[projectName] : fallback;`;

content = content.replace(regex, replacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed useStore.js');
