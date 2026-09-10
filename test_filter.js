const rawBlocks = [
  {
    blockName: 'BLOCK A',
    groups: [
      { groupName: 'TƯỜNG CĂN HỘ' }
    ]
  },
  {
    blockName: 'BLOCK B',
    groups: [
      { groupName: 'LOGIA (TƯỜNG VÀ TRẦN)' },
      { groupName: 'TRẦN BTCT' },
      { groupName: 'TƯỜNG VÀ TRẦN PKT' }
    ]
  }
];

const filterBlock = 'ALL';
const filterGroup = 'TƯỜNG CĂN HỘ,HÀNH LANG';

const matrixBlocks = rawBlocks.map(block => {
  if (filterBlock !== 'ALL' && block.blockName !== filterBlock) return null;
  
  const filteredGroups = block.groups.map(group => {
    if (filterGroup !== 'ALL') {
      const selectedGroups = filterGroup.split(',');
      if (!selectedGroups.includes(group.groupName)) return null;
    }
    return group;
  }).filter(Boolean);
  
  if (filteredGroups.length === 0) return null;
  
  return {
    ...block,
    groups: filteredGroups
  };
}).filter(Boolean);

console.log(JSON.stringify(matrixBlocks, null, 2));
