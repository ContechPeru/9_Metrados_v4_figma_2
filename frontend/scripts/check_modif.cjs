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

async function checkModif() {
  const { data, error } = await supabase.from('catalogo_partidas').select('id, codigo_expediente, descripcion, modificacion').not('modificacion', 'is', null).limit(20);
  console.log('Sample partidas with modificacion:');
  console.table(data);

  // Group by distinct modificacion
  const { data: allPartidas } = await supabase.from('catalogo_partidas').select('modificacion');
  const modifCounts = {};
  allPartidas.forEach(p => {
    const m = p.modificacion || 'NULL';
    modifCounts[m] = (modifCounts[m] || 0) + 1;
  });
  console.log('\nDistinct modificacion in catalogo_partidas:');
  console.table(modifCounts);
}

checkModif().catch(console.error);
