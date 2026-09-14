const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://rfsxcdwwbztspetlfauz.supabase.co';
const supabaseKey = 'sb_publishable_keIdSa76flAZC1eLeMmrhg_7dsNSoDz';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('Querying users...');
  const { data: users, error: err1 } = await supabase.from('users').select('*');
  console.log('Users:', err1 ? err1.message : users?.length);

  console.log('Querying material_sheets...');
  const { data, error } = await supabase.from('material_sheets').select('*');
  if (error) {
    console.error('Error fetching material_sheets:', error);
  } else {
    console.log('Material sheets count:', data?.length);
    let found = false;
    data.forEach(sheet => {
       const rows = sheet.receive_rows || [];
       rows.forEach(r => {
          if (r.date === '10/09/2026' || JSON.stringify(r).includes('PO39')) {
             console.log(`Found in project ${sheet.project_name}:`, r);
             found = true;
          }
       });
    });
    if (!found) {
       console.log('Not found in DB!');
    }
  }
}
checkData();
