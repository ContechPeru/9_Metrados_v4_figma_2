const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

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
  // If code has leading zeros in segments like OE.6.02.60 -> OE.6.2.60
  // But preserve OE.
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

async function analyze() {
  console.log('--- Loading Catalogo Partidas ---');
  let allPartidas = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from('catalogo_partidas').select('*').range(from, from + 999);
    if (error || !data || data.length === 0) break;
    allPartidas.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log(`Loaded ${allPartidas.length} catalogo_partidas`);

  const codeMap = new Map();
  allPartidas.forEach(p => {
    if (p.codigo_expediente) {
      codeMap.set(p.codigo_expediente.trim().toUpperCase(), p);
      const norm = normalizeCode(p.codigo_expediente);
      if (norm) codeMap.set(norm.toUpperCase(), p);
    }
  });

  const excelPath = path.resolve(__dirname, '../../liberado_marz.xlsx');
  const wb = XLSX.readFile(excelPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  console.log(`Total Excel rows: ${rows.length}`);
  const header = rows[6];

  let skippedHeaderOrEmpty = 0;
  let validDataRows = [];
  let unmatchedPartidas = new Map();

  for (let i = 7; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0 || r.every(c => c === undefined || c === null || c === '')) {
      skippedHeaderOrEmpty++;
      continue;
    }

    const rawPartida = r[12] ? String(r[12]).trim() : '';
    if (!rawPartida || rawPartida.startsWith('METRADO CORRESPONDIENTE')) {
      skippedHeaderOrEmpty++;
      continue;
    }

    // Extract code and description
    let rawCode = rawPartida.split('-')[0].trim();
    let normCode = normalizeCode(rawCode);
    let descPartidaFromExcel = rawPartida.includes('-') ? rawPartida.split('-').slice(1).join('-').trim() : '';

    let match = codeMap.get(rawCode.toUpperCase()) || codeMap.get(normCode.toUpperCase());

    if (!match) {
      // Try search by partial match or description
      const descToSearch = descPartidaFromExcel.toLowerCase();
      if (descToSearch) {
        const found = allPartidas.find(p => p.descripcion && p.descripcion.toLowerCase() === descToSearch);
        if (found) match = found;
      }
    }

    if (!match) {
      unmatchedPartidas.set(rawPartida, (unmatchedPartidas.get(rawPartida) || 0) + 1);
    }

    const fecha = parseExcelDate(r[2]);
    const grado = r[1] !== undefined && r[1] !== null ? String(r[1]).trim() : null;
    const especialidad = r[3] ? String(r[3]).trim() : (match?.especialidad || null);
    const frente = r[4] ? String(r[4]).trim() : null;
    const bloque = r[5] ? String(r[5]).trim() : null;
    const nivel = r[6] ? String(r[6]).trim() : null;
    const cuadrilla = r[7] ? String(r[7]).trim() : null;
    const elemento = r[13] ? String(r[13]).trim() : null;
    const cantidad = typeof r[14] === 'number' ? r[14] : (parseFloat(r[14]) || 0);
    const largo = typeof r[15] === 'number' ? r[15] : (parseFloat(r[15]) || 0);
    const ancho = typeof r[16] === 'number' ? r[16] : (parseFloat(r[16]) || 0);
    const alto = typeof r[17] === 'number' ? r[17] : (parseFloat(r[17]) || 0);
    const parcial = typeof r[18] === 'number' ? r[18] : (parseFloat(r[18]) || 0);
    const veces = typeof r[19] === 'number' ? r[19] : (parseFloat(r[19]) || 1);
    const acero = r[20] ? String(r[20]).trim() : null;
    const total = typeof r[21] === 'number' ? r[21] : (parseFloat(r[21]) || 0);
    const unidad = r[23] ? String(r[23]).trim() : (match?.unidad_medida || null);
    const modif = r[24] ? String(r[24]).trim() : null;

    validDataRows.push({
      rowIndex: i,
      partida_id: match ? match.id : null,
      snapshot_codigo: match ? match.codigo_expediente : (normCode || rawCode),
      snapshot_descripcion: match ? match.descripcion : (descPartidaFromExcel || rawPartida),
      unidad: unidad,
      fecha_ejecucion: fecha,
      frente_trabajo: frente,
      bloque_sector: bloque,
      nivel_piso: nivel,
      cuadrilla: cuadrilla,
      elemento_desc: elemento,
      detalle_desc: null,
      acero_diametro: acero || null,
      cantidad_elementos: cantidad,
      medida_largo_area: largo,
      medida_ancho_empalme: ancho,
      medida_alto_gancho: alto,
      nro_repeticiones: veces,
      resultado_parcial: parcial,
      resultado_total: total,
      especialidad: especialidad,
      grado: grado,
      plano_sist: null,
      plano_num: null,
      sin_plano: false,
      obs_motivo: null,
      obs_detalle: modif, // or ubicacion/observacion
      is_liberado: true,
      tipo_calculo: match?.tipo_calculo || (acero ? 'ACERO' : 'ESTANDAR')
    });
  }

  console.log(`\nValid data rows: ${validDataRows.length}`);
  console.log(`Skipped / empty rows: ${skippedHeaderOrEmpty}`);
  console.log(`Unmatched partida varieties: ${unmatchedPartidas.size}`);
  if (unmatchedPartidas.size > 0) {
    console.log('Unmatched items and occurrences:');
    for (const [p, count] of unmatchedPartidas.entries()) {
      console.log(`  - [${count} rows] "${p}"`);
    }
  }

  const rowsWithPartidaId = validDataRows.filter(r => r.partida_id !== null).length;
  const rowsWithoutPartidaId = validDataRows.filter(r => r.partida_id === null).length;
  console.log(`\nRows with partida_id: ${rowsWithPartidaId} / ${validDataRows.length} (${(rowsWithPartidaId/validDataRows.length*100).toFixed(2)}%)`);
  console.log(`Rows without partida_id: ${rowsWithoutPartidaId}`);

  // Sample valid data row
  console.log('\nSample parsed record (Row 0):', validDataRows[0]);
  console.log('Sample parsed record (Row 50):', validDataRows[50]);
}

analyze().catch(console.error);
