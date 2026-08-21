const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rfsxcdwwbztspetlfauz.supabase.co', 'sb_publishable_keIdSa76flAZC1eLeMmrhg_7dsNSoDz');

async function testUpdate() {
  const id = '70dd26a6-55dd-4434-952b-1742a310b9a8';
  const { data, error } = await supabase
    .from('teams')
    .update({ project_name: 'THE ASPIRA, PICITY SKY PARK, BCONS TĐH' })
    .eq('id', id)
    .select();

  console.log('Error:', error);
  console.log('Updated Data:', data);
}

testUpdate();
