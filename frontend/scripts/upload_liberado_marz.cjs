const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// 1. Load credentials from .env
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length > 0) env[k.trim()] = v.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

function normalizeCode(raw) {
  if (!raw) return '';
  let code = String(raw).trim().split('-')[0].trim();
  // Strip leading zeros from numeric dot segments (e.g. OE.6.02.60 -> OE.6.2.60)
  let normalized = code.split('.').map(seg => {
    if (/^0\d+$/.test(seg)) {
      return String(parseInt(seg, 10));
    }
    return seg;
  }).join('.');
  return normalized;
}

function parseExcelDate(excelDate) {
  if (!excelDate) return null;
  if (typeof excelDate === 'number') {
    const parsed = XLSX.SSF.parse_date_code(excelDate);
    if (parsed) {
      const yyyy = parsed.y;
      const mm = String(parsed.m).padStart(2, '0');
      const dd = String(parsed.d).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  const str = String(excelDate).trim();
  if (str.includes('/')) {
    const [d, m, y] = str.split('/');
    if (y && m && d) return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  return str || null;
}

async function uploadLiberadoMarz() {
  console.log('=== STEP 1: VERIFY / GET USER liberado_marz ===');
  const { data: user, error: errUser } = await supabase
    .from('usuarios_sistema')
    .select('*')
    .eq('dni_username', 'liberado_marz')
    .single();

  if (errUser || !user) {
    console.error('User liberado_marz not found in usuarios_sistema:', errUser);
    process.exit(1);
  }
  console.log(`User liberado_marz ID: ${user.id}`);

  console.log('\n=== STEP 2: LOAD CATALOGO_PARTIDAS ===');
  let allPartidas = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from('catalogo_partidas').select('*').range(from, from + 999);
    if (error || !data || data.length === 0) break;
    allPartidas.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log(`Loaded ${allPartidas.length} catalogo_partidas from Supabase.`);

  const codeMap = new Map();
  allPartidas.forEach(p => {
    if (p.codigo_expediente) {
      codeMap.set(p.codigo_expediente.trim().toUpperCase(), p);
      const norm = normalizeCode(p.codigo_expediente);
      if (norm) codeMap.set(norm.toUpperCase(), p);
    }
  });

  // Specific alias mappings for known exceptions in liberado_marz.xlsx
  const aliasMap = new Map();
  // OE.5.6.26.2 -> OE.5.6.25.2
  const pAcarreo = codeMap.get('OE.5.6.25.2');
  if (pAcarreo) {
    aliasMap.set('OE.5.6.26.2', pAcarreo);
  }
  // OE.1.6.23 -> OE.1.6.17
  const pArqueo = codeMap.get('OE.1.6.17');
  if (pArqueo) {
    aliasMap.set('OE.1.6.23', pArqueo);
  }

  console.log('\n=== STEP 3: PARSE EXCEL FILE ===');
  const excelPath = path.resolve(__dirname, '../../liberado_marz.xlsx');
  console.log('Reading:', excelPath);
  const wb = XLSX.readFile(excelPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`Total raw rows in Excel: ${rows.length}`);

  const metradosToInsert = [];
  let skippedCount = 0;

  for (let i = 7; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0 || r.every(c => c === undefined || c === null || c === '')) {
      skippedCount++;
      continue;
    }

    const rawPartida = r[12] ? String(r[12]).trim() : '';
    if (!rawPartida || rawPartida.startsWith('METRADO CORRESPONDIENTE')) {
      skippedCount++;
      continue;
    }

    // Extract code and description
    let rawCode = rawPartida.split('-')[0].trim();
    let normCode = normalizeCode(rawCode);
    let descFromExcel = rawPartida.includes('-') ? rawPartida.split('-').slice(1).join('-').trim() : '';

    let match = codeMap.get(rawCode.toUpperCase()) || 
                codeMap.get(normCode.toUpperCase()) || 
                aliasMap.get(rawCode.toUpperCase()) || 
                aliasMap.get(normCode.toUpperCase());

    if (!match && descFromExcel) {
      const found = allPartidas.find(p => p.descripcion && p.descripcion.toLowerCase() === descFromExcel.toLowerCase());
      if (found) match = found;
    }

    function getEspecialidadFromCode(codigo) {
      if (!codigo) return 'ESTRUCTURAS';
      if (codigo.startsWith('OE.1.1')) return 'OBRAS PROVISIONALES';
      if (codigo.startsWith('OE.1.2')) return 'SEGURIDAD';
      if (codigo.startsWith('OE.1.3') || codigo.startsWith('OE.1.4') || codigo.startsWith('OE.1.5') || codigo.startsWith('OE.1.6')) return 'ARQUEOLOGÍA';
      if (codigo.startsWith('OE.2')) return 'ESTRUCTURAS';
      if (codigo.startsWith('OE.3')) return 'ARQUITECTURA';
      if (codigo.startsWith('OE.4')) return 'INSTALACIONES SANITARIAS';
      if (codigo.startsWith('OE.5.1') || codigo.startsWith('OE.5.2') || codigo.startsWith('OE.5.3') || codigo.startsWith('OE.5.4') || codigo.startsWith('OE.5.5')) return 'ELÉCTRICAS';
      if (codigo.startsWith('OE.5.6') || codigo.startsWith('OE.5.7') || codigo.startsWith('OE.7')) return 'ELECTROMECÁNICAS';
      if (codigo.startsWith('OE.6')) return 'COMUNICACIONES';
      if (codigo.startsWith('OE.8')) return 'PLAN DE MANEJO AMBIENTAL';
      if (codigo.startsWith('OE.9')) return 'EQUIPAMIENTO BIOMÉDICO';
      return 'GENERAL';
    }

    const snapshotCodigo = match ? match.codigo_expediente : (normCode || rawCode);
    const snapshotDescripcion = match ? match.descripcion : (descFromExcel || rawPartida);
    const especialidad = match?.especialidad || getEspecialidadFromCode(snapshotCodigo);

    const fecha = parseExcelDate(r[2]);
    const grado = r[1] !== undefined && r[1] !== null ? String(r[1]).trim() : null;
    const frente = r[4] ? String(r[4]).trim() : null;
    const bloque = r[5] ? String(r[5]).trim() : null;
    const nivel = r[6] ? String(r[6]).trim() : null;
    const cuadrilla = r[7] ? String(r[7]).trim() : null;
    const elemento = r[13] ? String(r[13]).trim() : '';
    const cantidad = typeof r[14] === 'number' ? r[14] : (parseFloat(r[14]) || 0);
    const largo = typeof r[15] === 'number' ? r[15] : (parseFloat(r[15]) || 0);
    const ancho = typeof r[16] === 'number' ? r[16] : (parseFloat(r[16]) || 0);
    const alto = typeof r[17] === 'number' ? r[17] : (parseFloat(r[17]) || 0);
    const parcial = typeof r[18] === 'number' ? r[18] : (parseFloat(r[18]) || 0);
    const veces = typeof r[19] === 'number' ? r[19] : (parseFloat(r[19]) || 1);
    const acero = r[20] ? String(r[20]).trim() : null;
    const total = typeof r[21] === 'number' ? r[21] : (parseFloat(r[21]) || 0);
    const unidad = r[23] ? String(r[23]).trim() : (match?.unidad_medida || 'und');
    const modif = r[24] ? String(r[24]).trim() : null;

    metradosToInsert.push({
      user_id: user.id,
      firma_ingeniero: 'liberado_marz',
      origen_archivo: 'liberado_marz.xlsx',
      is_liberado: true,
      proyecto: 'Proyecto Hospital',
      fecha_ejecucion: fecha,
      grado: grado,
      especialidad: especialidad,
      frente_trabajo: frente,
      bloque_sector: bloque,
      nivel_piso: nivel,
      cuadrilla: cuadrilla,
      partida_id: match ? match.id : null,
      snapshot_codigo: snapshotCodigo,
      snapshot_descripcion: snapshotDescripcion,
      elemento_desc: elemento,
      detalle_desc: null,
      cantidad_elementos: cantidad,
      medida_largo_area: largo,
      medida_ancho_empalme: ancho,
      medida_alto_gancho: alto,
      resultado_parcial: parcial,
      nro_repeticiones: veces,
      acero_diametro: acero || null,
      resultado_total: total,
      unidad: unidad,
      obs_motivo: null,
      obs_detalle: modif,
      plano_sist: null,
      plano_num: null,
      sin_plano: false,
      tipo_calculo: match?.tipo_calculo || (acero ? 'ACERO' : 'ESTANDAR')
    });
  }

  console.log(`\nProcessed ${metradosToInsert.length} metrados to insert (skipped ${skippedCount} empty/header rows).`);
  const withPartidaId = metradosToInsert.filter(m => m.partida_id !== null).length;
  console.log(`With partida_id mapped: ${withPartidaId} / ${metradosToInsert.length} (${(withPartidaId / metradosToInsert.length * 100).toFixed(2)}%)`);

  console.log('\n=== STEP 4: BATCH INSERT INTO registro_metrados ===');
  const batchSize = 500;
  let totalInserted = 0;

  for (let i = 0; i < metradosToInsert.length; i += batchSize) {
    const batch = metradosToInsert.slice(i, i + batchSize);
    const { error: insertError } = await supabase
      .from('registro_metrados')
      .insert(batch);

    if (insertError) {
      console.error(`\nError inserting batch ${i} - ${i + batch.length}:`, insertError);
      process.exit(1);
    }
    totalInserted += batch.length;
    process.stdout.write(`\rInserted: ${totalInserted} / ${metradosToInsert.length}`);
  }

  console.log(`\n\n=== STEP 5: VERIFY UPLOAD IN SUPABASE ===`);
  const { count: countUserRecords, error: errCount } = await supabase
    .from('registro_metrados')
    .select('*', { count: 'exact', head: true })
    .eq('firma_ingeniero', 'liberado_marz');

  console.log(`Total records in registro_metrados for firma_ingeniero='liberado_marz': ${countUserRecords}`);
  if (errCount) console.error('Verification error:', errCount);

  console.log('\n SUCCESS: All metrados from liberado_marz.xlsx were successfully uploaded to Supabase!');
}

uploadLiberadoMarz().catch(err => {
  console.error('Fatal error during upload:', err);
  process.exit(1);
});
