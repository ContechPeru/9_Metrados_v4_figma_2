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

async function inspectMetrados() {
  const { data: firmas } = await supabase.from('registro_metrados').select('firma_ingeniero').limit(100);
  const uniqueFirmas = new Set(firmas?.map(f => f.firma_ingeniero));
  console.log('Sample unique firmas in DB:', Array.from(uniqueFirmas));

  const { data: origenes } = await supabase.from('registro_metrados').select('origen_archivo').limit(100);
  const uniqueOrigenes = new Set(origenes?.map(f => f.origen_archivo));
  console.log('Sample unique origenes in DB:', Array.from(uniqueOrigenes));

  const { count: totalMetrados } = await supabase.from('registro_metrados').select('*', { count: 'exact', head: true });
  console.log('Total registro_metrados in DB:', totalMetrados);

  const { data: liberadosCount } = await supabase.from('registro_metrados').select('*', { count: 'exact', head: true }).eq('is_liberado', true);
  console.log('Total is_liberado=true in DB:', liberadosCount);

  // Check usuarios_sistema for liberado_marz
  const { data: userMarz } = await supabase.from('usuarios_sistema').select('*').ilike('dni_username', '%liberado%');
  console.log('Users matching "liberado":', userMarz);
}

inspectMetrados().catch(console.error);
