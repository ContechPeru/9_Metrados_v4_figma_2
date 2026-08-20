const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length > 0) env[k.trim()] = v.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkCols() {
  const { data, error } = await supabase.from('registro_metrados').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Columns in registro_metrados:', Object.keys(data[0]));
    console.log('Sample record:', data[0]);
  } else {
    console.error('Error or empty table:', error);
  }
}

checkCols().catch(console.error);
