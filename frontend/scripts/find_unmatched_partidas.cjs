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

async function findPartidas() {
  const { data: p1 } = await supabase.from('catalogo_partidas').select('id, codigo_expediente, descripcion, especialidad').ilike('descripcion', '%acarreo%');
  console.log('Partidas with "acarreo":', p1);

  const { data: p2 } = await supabase.from('catalogo_partidas').select('id, codigo_expediente, descripcion, especialidad').ilike('descripcion', '%arqueol%');
  console.log('Partidas with "arqueol":', p2);

  const { data: p3 } = await supabase.from('catalogo_partidas').select('id, codigo_expediente, descripcion, especialidad').ilike('codigo_expediente', 'OE.5.6.26%');
  console.log('Partidas with "OE.5.6.26%":', p3);

  const { data: p4 } = await supabase.from('catalogo_partidas').select('id, codigo_expediente, descripcion, especialidad').ilike('codigo_expediente', 'OE.1.6.23%');
  console.log('Partidas with "OE.1.6.23%":', p4);

  const { data: p5 } = await supabase.from('catalogo_partidas').select('id, codigo_expediente, descripcion, especialidad').ilike('codigo_expediente', 'OE.5.6.2%');
  console.log('Partidas with "OE.5.6.2%":', p5);
}

findPartidas().catch(console.error);
