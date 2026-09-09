const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rfsxcdwwbztspetlfauz.supabase.co', 'sb_publishable_keIdSa76flAZC1eLeMmrhg_7dsNSoDz');

async function testProjects() {
  const { data, error } = await supabase.from('projects').select('id, name, matrix_blocks, matrix_data').ilike('name', '%eaton%');
  console.log('Error:', error);
  console.log('Projects count:', data?.length);
  if (data && data.length > 0) {
      console.log('Project:', data[0].name);
      console.log('Matrix Blocks:', JSON.stringify(data[0].matrix_blocks).substring(0, 200));
      console.log('Matrix Data:', JSON.stringify(data[0].matrix_data).substring(0, 200));
  }
}

testProjects();
