require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data, error } = await supabase.from('projects').select('*').eq('name', 'THE ASPIRA');
  if (error) {
    console.error(error);
  } else {
    // console.log(JSON.stringify(data, null, 2));
    if (data && data.length > 0) {
      console.log("Project Found:", data[0].name);
      console.log("matrix_data keys:", Object.keys(data[0].matrix_data || {}));
      
      const teamData = data[0].matrix_data?.team;
      if (teamData) {
        console.log(`Team matrix has ${teamData.length} floors.`);
        // Check if there are any team strings
        let hasTeamData = false;
        teamData.forEach(floor => {
          Object.values(floor.items).forEach(val => {
            if (val && val.includes('(')) hasTeamData = true;
          });
        });
        console.log("Has team allocation data in DB?", hasTeamData);
      }
    }
  }
}
checkData();
