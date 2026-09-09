const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'store', 'useStore.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Sanitize matrixBlocks on load
const loadRegex = /if \(p\.matrix_blocks\) blocks\[p\.name\] = p\.matrix_blocks;/g;
const loadReplacement = `if (p.matrix_blocks) {
                const sanitizeBlocks = (blks) => {
                  if (!Array.isArray(blks)) return blks;
                  return blks.map(block => {
                    const uniqueGroupsMap = new Map();
                    (block.groups || []).forEach(g => {
                      const name = g.groupName?.trim() || 'UNNAMED';
                      if (uniqueGroupsMap.has(name)) {
                        const existing = uniqueGroupsMap.get(name);
                        existing.items = [...new Set([...existing.items, ...(g.items || [])])];
                      } else {
                        uniqueGroupsMap.set(name, { groupName: name, items: [...(g.items || [])] });
                      }
                    });
                    return { ...block, groups: Array.from(uniqueGroupsMap.values()) };
                  });
                };
                blocks[p.name] = sanitizeBlocks(p.matrix_blocks);
              }`;
content = content.replace(loadRegex, loadReplacement);

// 2. Prevent duplication in addCategoryGroup
const addCatGroupRegex = /newBlocks\[blockIdx\]\.groups\.push\(\{\s*groupName,\s*items: initialItems\s*\}\);/g;
const addCatGroupReplacement = `const existingGroup = newBlocks[blockIdx].groups.find(g => g.groupName.trim() === groupName.trim());
        if (existingGroup) {
          // If exists, just merge items
          existingGroup.items = [...new Set([...existingGroup.items, ...initialItems])];
        } else {
          newBlocks[blockIdx].groups.push({
            groupName: groupName.trim(),
            items: initialItems
          });
        }`;
content = content.replace(addCatGroupRegex, addCatGroupReplacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed block duplicates');
