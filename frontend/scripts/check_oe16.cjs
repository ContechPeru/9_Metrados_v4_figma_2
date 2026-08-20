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

async function checkOE16() {
  const { data } = await supabase.from('catalogo_partidas').select('id, codigo_expediente, descripcion, especialidad').ilike('codigo_expediente', 'OE.1.6%');
  console.log('All OE.1.6.* partidas:');
  data.forEach(d => console.log(`  ${d.codigo_expediente}: ${d.descripcion}`));

  const { data: data14 } = await supabase.from('catalogo_partidas').select('id, codigo_expediente, descripcion, especialidad').ilike('codigo_expediente', 'OE.1.4%');
  console.log('\nAll OE.1.4.* partidas:');
  data14.forEach(d => console.log(`  ${d.codigo_expediente}: ${d.descripcion}`));
}

checkOE16().catch(console.error);
