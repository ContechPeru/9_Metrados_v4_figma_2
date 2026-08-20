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

async function checkMarzEsp() {
  const { data } = await supabase
    .from('registro_metrados')
    .select('especialidad, snapshot_codigo')
    .eq('firma_ingeniero', 'liberado_marz')
    .limit(20);
  
  console.log('Sample liberado_marz especialidades:', data);

  // Group by especialidad for liberado_marz
  let allMarz = [];
  let from = 0;
  while (true) {
    const { data: d } = await supabase
      .from('registro_metrados')
      .select('especialidad, snapshot_codigo')
      .eq('firma_ingeniero', 'liberado_marz')
      .range(from, from + 999);
    if (!d || d.length === 0) break;
    allMarz.push(...d);
    if (d.length < 1000) break;
    from += 1000;
  }

  const counts = {};
  allMarz.forEach(m => {
    counts[m.especialidad] = (counts[m.especialidad] || 0) + 1;
  });
  console.log('Especialidades for liberado_marz in DB:', counts);
}

checkMarzEsp().catch(console.error);
