const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBlocks() {
  const { data, error } = await supabase.from('projects').select('matrix_blocks').eq('name', 'THE ASPIRA');
  if (error) {
    console.error(error);
  } else {
    fs.writeFileSync('THE_ASPIRA_blocks.json', JSON.stringify(data[0].matrix_blocks, null, 2));
    console.log("Saved blocks to THE_ASPIRA_blocks.json");
  }
}
checkBlocks();
