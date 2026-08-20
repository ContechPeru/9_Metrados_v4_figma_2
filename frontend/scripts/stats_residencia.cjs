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

async function getStats() {
  let allRows = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('registro_metrados')
      .select('especialidad, frente_trabajo, bloque_sector, fecha_ejecucion, tipo_calculo, resultado_total')
      .eq('firma_ingeniero', 'liberado_marz')
      .range(from, from + 999);
    
    if (error || !data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }

  console.log(`Total fetched: ${allRows.length}`);

  const byEsp = {};
  const byFrente = {};
  const byTipo = {};
  let minDate = '9999-99-99';
  let maxDate = '0000-00-00';

  allRows.forEach(r => {
    byEsp[r.especialidad] = (byEsp[r.especialidad] || 0) + 1;
    byFrente[r.frente_trabajo || 'SIN_FRENTE'] = (byFrente[r.frente_trabajo || 'SIN_FRENTE'] || 0) + 1;
    byTipo[r.tipo_calculo || 'ESTANDAR'] = (byTipo[r.tipo_calculo || 'ESTANDAR'] || 0) + 1;
    if (r.fecha_ejecucion) {
      if (r.fecha_ejecucion < minDate) minDate = r.fecha_ejecucion;
      if (r.fecha_ejecucion > maxDate) maxDate = r.fecha_ejecucion;
    }
  });

  console.log('--- Por Especialidad ---');
  console.log(byEsp);
  console.log('--- Por Frente ---');
  console.log(byFrente);
  console.log('--- Por Tipo de Cálculo ---');
  console.log(byTipo);
  console.log('--- Rango de Fechas ---');
  console.log(`Min: ${minDate} | Max: ${maxDate}`);
}

getStats().catch(console.error);
