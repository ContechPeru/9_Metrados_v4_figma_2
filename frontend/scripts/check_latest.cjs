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

async function checkLatest() {
  const { data, error } = await supabase
    .from('registro_metrados')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching latest:', error);
    return;
  }

  console.log('Latest 10 records in registro_metrados:');
  data.forEach((r, idx) => {
    console.log(`[${idx}] ID: ${r.id} | Created: ${r.created_at} | Fecha: ${r.fecha_ejecucion} | Partida: ${r.snapshot_codigo} | Elemento: "${r.elemento_desc}" | Detalle: "${r.detalle_desc}" | Obs: "${r.observacion}" | UBI: "${r.ubicacion}" | ObsDetalle: "${r.obs_detalle}"`);
  });
}

checkLatest().catch(console.error);
