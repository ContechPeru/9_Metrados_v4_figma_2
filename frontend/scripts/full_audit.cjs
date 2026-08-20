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

async function fullAudit() {
  console.log('=== AUDITORIA COMPLETA DE REGISTRO_METRADOS ===\n');

  // 1. Total general
  const { count: totalRows } = await supabase.from('registro_metrados').select('*', { count: 'exact', head: true });
  console.log(`1. Total general de metrados en BD: ${totalRows}`);

  // 2. Desglose por origen_archivo
  const { data: filesData } = await supabase.rpc('get_origen_breakdown').catch(() => ({ data: null }));

  // Fallback direct query in batches
  let allRows = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('registro_metrados')
      .select('id, origen_archivo, firma_ingeniero, especialidad, is_liberado, partida_id, snapshot_codigo, resultado_total, ubicacion, fecha_ejecucion')
      .range(from, from + 999);
    if (error || !data || data.length === 0) break;
    allRows.push(...data);
    from += 1000;
    if (allRows.length % 10000 === 0) process.stdout.write(`Loaded ${allRows.length} rows...\r`);
  }
  console.log(`\nCargados ${allRows.length} registros para auditoría detallada.`);

  const byFile = {};
  const byUser = {};
  const byEsp = {};
  let sinPartida = 0;
  let sinTotal = 0;
  let sinFecha = 0;
  let liberadosCount = 0;
  let conUbicacion = 0;

  allRows.forEach(r => {
    const file = r.origen_archivo || 'NATIVO / APP WEB';
    byFile[file] = (byFile[file] || 0) + 1;

    const user = r.firma_ingeniero || 'SIN FIRMA';
    byUser[user] = (byUser[user] || 0) + 1;

    const esp = r.especialidad || 'SIN ESPECIALIDAD';
    byEsp[esp] = (byEsp[esp] || 0) + 1;

    if (!r.partida_id) sinPartida++;
    if (r.resultado_total === null || r.resultado_total === undefined) sinTotal++;
    if (!r.fecha_ejecucion) sinFecha++;
    if (r.is_liberado) liberadosCount++;
    if (r.ubicacion) conUbicacion++;
  });

  console.log('\n--- 2. DESGLOSE POR ARCHIVO DE ORIGEN ---');
  console.table(byFile);

  console.log('\n--- 3. DESGLOSE POR USUARIO / FIRMA ---');
  console.table(byUser);

  console.log('\n--- 4. DESGLOSE POR ESPECIALIDAD ---');
  console.table(byEsp);

  console.log('\n--- 5. INTEGRIDAD Y CALIDAD DE DATOS ---');
  console.log(`- Registros con Partida vinculada (partida_id no nulo): ${allRows.length - sinPartida} / ${allRows.length} (${((allRows.length - sinPartida) / allRows.length * 100).toFixed(2)}%)`);
  console.log(`- Registros sin Partida (huérfanos): ${sinPartida}`);
  console.log(`- Registros sin Resultado Total: ${sinTotal}`);
  console.log(`- Registros sin Fecha de Ejecución: ${sinFecha}`);
  console.log(`- Registros marcados como Liberados (is_liberado = true): ${liberadosCount}`);
  console.log(`- Registros con Ubicación (UBI): ${conUbicacion}`);

  // Verificar las últimas subidas
  console.log('\n--- 6. VERIFICACIÓN ESPECÍFICA DE SUBIDAS ---');
  const marzArq = allRows.filter(r => r.origen_archivo === 'liberado_marz_arq.xlsx');
  console.log(`liberado_marz_arq.xlsx: ${marzArq.length} registros | 100% ARQUITECTURA: ${marzArq.every(r => r.especialidad === 'ARQUITECTURA')} | 100% vinculados: ${marzArq.every(r => r.partida_id !== null)}`);

  const junio = allRows.filter(r => r.origen_archivo === 'liberado_junio.xlsx');
  console.log(`liberado_junio.xlsx: ${junio.length} registros | 100% liberado_junio: ${junio.every(r => r.firma_ingeniero === 'liberado_junio')} | 100% vinculados: ${junio.every(r => r.partida_id !== null)}`);

  const marz = allRows.filter(r => r.origen_archivo === 'liberado_marz.xlsx');
  console.log(`liberado_marz.xlsx: ${marz.length} registros | 100% liberado_marz: ${marz.every(r => r.firma_ingeniero === 'liberado_marz')} | 100% vinculados: ${marz.every(r => r.partida_id !== null)}`);
}

fullAudit().catch(console.error);
