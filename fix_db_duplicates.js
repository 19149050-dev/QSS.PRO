require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDb() {
  const { data: projects, error } = await supabase.from('projects').select('*');
  if (error) {
    console.error(error);
    return;
  }
  
  for (const p of projects) {
    if (!p.matrix_blocks || !Array.isArray(p.matrix_blocks)) continue;
    
    let changed = false;
    const newBlocks = p.matrix_blocks.map(block => {
      const uniqueGroupsMap = new Map();
      let originalLength = (block.groups || []).length;
      
      (block.groups || []).forEach(g => {
        const name = g.groupName?.trim() || 'UNNAMED';
        if (uniqueGroupsMap.has(name)) {
          const existing = uniqueGroupsMap.get(name);
          existing.items = [...new Set([...existing.items, ...(g.items || [])])];
        } else {
          uniqueGroupsMap.set(name, { groupName: name, items: [...(g.items || [])] });
        }
      });
      
      const newGroups = Array.from(uniqueGroupsMap.values());
      if (newGroups.length !== originalLength) {
        changed = true;
      }
      return { ...block, groups: newGroups };
    });
    
    if (changed) {
      console.log(`Fixing project ${p.name}...`);
      const { error: updateError } = await supabase
        .from('projects')
        .update({ matrix_blocks: newBlocks })
        .eq('id', p.id);
        
      if (updateError) {
        console.error(`Failed to update ${p.name}:`, updateError);
      } else {
        console.log(`Successfully fixed ${p.name}`);
      }
    } else {
      console.log(`Project ${p.name} is fine.`);
    }
  }
}
fixDb();
