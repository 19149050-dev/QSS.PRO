const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rfsxcdwwbztspetlfauz.supabase.co', 'sb_publishable_keIdSa76flAZC1eLeMmrhg_7dsNSoDz');

async function check() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  console.log('Error:', error);
  console.log('Data:', data);
}

check();
