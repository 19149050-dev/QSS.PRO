const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rfsxcdwwbztspetlfauz.supabase.co';
const supabaseKey = 'sb_publishable_keIdSa76flAZC1eLeMmrhg_7dsNSoDz';

const supabase = createClient(supabaseUrl, supabaseKey);

async function patch() {
  const { data: projects, error } = await supabase.from('projects').select('id, name, matrix_data');
  if (error) {
    console.error(error);
    return;
  }
  
  let updatedCount = 0;

  for (const project of projects) {
    if (!project.matrix_data) continue;
    
    let modified = false;
    
    // helper to recursively replace IPC -> ĐỢT
    function processMatrix(matrixArray) {
      if (!Array.isArray(matrixArray)) return;
      for (const row of matrixArray) {
        if (!row.items) continue;
        for (const key in row.items) {
          const val = row.items[key];
          if (typeof val === 'string' && val.toUpperCase().includes('IPC')) {
             // Replace IPC 01, IPC01, IPC etc with ĐỢT
             // Be careful to not replace just any letters, but word "IPC"
             // e.g. IPC 03 -> ĐỢT 03
             // IPC03 -> ĐỢT 03
             const newVal = val.replace(/IPC\s*(\d+)/gi, 'ĐỢT $1').replace(/IPC/gi, 'ĐỢT');
             if (newVal !== val) {
               row.items[key] = newVal;
               modified = true;
             }
          }
        }
      }
    }
    
    processMatrix(project.matrix_data.base);
    processMatrix(project.matrix_data.team);
    processMatrix(project.matrix_data.ipc);
    
    if (modified) {
      const { error: updateError } = await supabase.from('projects').update({ matrix_data: project.matrix_data }).eq('id', project.id);
      if (updateError) {
        console.error(`Error updating project ${project.name}:`, updateError);
      } else {
        console.log(`Updated project ${project.name}`);
        updatedCount++;
      }
    }
  }
  
  console.log(`Finished processing. Updated ${updatedCount} projects.`);
}

patch();
