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

async function checkMissingMarz() {
  const { data: user } = await supabase.from('usuarios_sistema').select('*').eq('dni_username', 'liberado_marz').single();
  const { count } = await supabase.from('registro_metrados').select('*', { count: 'exact', head: true }).eq('firma_ingeniero', 'liberado_marz');
  console.log(`Current liberado_marz count: ${count}`);
}

checkMissingMarz().catch(console.error);
