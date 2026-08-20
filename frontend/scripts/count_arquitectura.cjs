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

async function countArquitectura() {
  console.log('--- Verificando conteo total en registro_metrados ---');

  // Total de la tabla
  const { count: totalGeneral } = await supabase
    .from('registro_metrados')
    .select('*', { count: 'exact', head: true });
  console.log(`Total general de registros en la base de datos: ${totalGeneral}`);

  // Total con especialidad = 'ARQUITECTURA'
  const { count: countEspArq } = await supabase
    .from('registro_metrados')
    .select('*', { count: 'exact', head: true })
    .eq('especialidad', 'ARQUITECTURA');
  console.log(`Total con especialidad = 'ARQUITECTURA': ${countEspArq}`);

  // Total con código que inicia con 'OE.3%' (partidas de Arquitectura)
  const { count: countCodeOE3 } = await supabase
    .from('registro_metrados')
    .select('*', { count: 'exact', head: true })
    .ilike('snapshot_codigo', 'OE.3%');
  console.log(`Total con snapshot_codigo OE.3.*: ${countCodeOE3}`);

  // Desglose por firma_ingeniero (autor / usuario) para ARQUITECTURA
  let allArq = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('registro_metrados')
      .select('firma_ingeniero, origen_archivo, fecha_ejecucion, is_liberado')
      .eq('especialidad', 'ARQUITECTURA')
      .range(from, from + 999);
    
    if (error || !data || data.length === 0) break;
    allArq.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }

  console.log(`\nRegistros recuperados para análisis detallado: ${allArq.length}`);

  const byFirma = {};
  const byOrigen = {};
  const byMes = {};

  allArq.forEach(r => {
    const f = r.firma_ingeniero || 'SIN_FIRMA';
    byFirma[f] = (byFirma[f] || 0) + 1;

    const o = r.origen_archivo || 'NATIVO / APP';
    byOrigen[o] = (byOrigen[o] || 0) + 1;

    if (r.fecha_ejecucion) {
      const ym = r.fecha_ejecucion.slice(0, 7); // YYYY-MM
      byMes[ym] = (byMes[ym] || 0) + 1;
    } else {
      byMes['SIN_FECHA'] = (byMes['SIN_FECHA'] || 0) + 1;
    }
  });

  console.log('\n--- Desglose por Autor / Firma ---');
  console.log(byFirma);

  console.log('\n--- Desglose por Origen de Archivo ---');
  console.log(byOrigen);

  console.log('\n--- Desglose por Mes (YYYY-MM) ---');
  console.log(byMes);
}

countArquitectura().catch(console.error);
