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

async function checkMarzTotal() {
  const { count: totalMarz } = await supabase
    .from('registro_metrados')
    .select('*', { count: 'exact', head: true })
    .eq('firma_ingeniero', 'liberado_marz');
  console.log(`Total liberado_marz in DB: ${totalMarz}`);

  const { count: arqMarz } = await supabase
    .from('registro_metrados')
    .select('*', { count: 'exact', head: true })
    .eq('firma_ingeniero', 'liberado_marz')
    .eq('especialidad', 'ARQUITECTURA');
  console.log(`Total liberado_marz con especialidad ARQUITECTURA: ${arqMarz}`);

  const { count: arqOE3Marz } = await supabase
    .from('registro_metrados')
    .select('*', { count: 'exact', head: true })
    .eq('firma_ingeniero', 'liberado_marz')
    .ilike('snapshot_codigo', 'OE.3%');
  console.log(`Total liberado_marz con snapshot_codigo OE.3%: ${arqOE3Marz}`);

  const { data: nullEsp } = await supabase
    .from('registro_metrados')
    .select('snapshot_codigo, especialidad')
    .eq('firma_ingeniero', 'liberado_marz')
    .is('especialidad', null)
    .limit(10);
  console.log('Sample liberado_marz with null especialidad:', nullEsp);
}

checkMarzTotal().catch(console.error);
