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

async function checkCatalogOE3() {
  const { data } = await supabase
    .from('catalogo_partidas')
    .select('codigo_expediente, descripcion, especialidad')
    .ilike('codigo_expediente', 'OE.3%')
    .limit(20);
  console.log('Sample OE.3 in catalogo_partidas:', data);

  const { data: allOE3 } = await supabase
    .from('catalogo_partidas')
    .select('especialidad')
    .ilike('codigo_expediente', 'OE.3%');
  
  const counts = {};
  allOE3?.forEach(p => {
    counts[p.especialidad] = (counts[p.especialidad] || 0) + 1;
  });
  console.log('Especialidades for OE.3 in catalogo_partidas:', counts);
}

checkCatalogOE3().catch(console.error);
