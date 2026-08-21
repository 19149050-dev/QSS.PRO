const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rfsxcdwwbztspetlfauz.supabase.co', 'sb_publishable_keIdSa76flAZC1eLeMmrhg_7dsNSoDz');

async function testTeams() {
  const { data, error } = await supabase.from('teams').select('*');
  console.log('Error:', error);
  console.log('Teams count:', data?.length);
  console.log('Teams:', JSON.stringify(data, null, 2));
}

testTeams();
