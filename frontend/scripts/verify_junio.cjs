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

async function verifyJunio() {
  const { count, error } = await supabase
    .from('registro_metrados')
    .select('*', { count: 'exact', head: true })
    .eq('firma_ingeniero', 'liberado_junio');

  console.log(`Verified total count for liberado_junio: ${count}`);

  const { data: sample } = await supabase
    .from('registro_metrados')
    .select('id, fecha_ejecucion, especialidad, snapshot_codigo, snapshot_descripcion, partida_id, elemento_desc, resultado_total, unidad, obs_detalle, observacion, firma_ingeniero, user_id')
    .eq('firma_ingeniero', 'liberado_junio')
    .limit(3);

  console.log('Sample uploaded records for liberado_junio:', sample);
}

verifyJunio().catch(console.error);
