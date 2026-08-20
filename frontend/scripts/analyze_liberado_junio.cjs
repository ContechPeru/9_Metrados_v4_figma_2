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

async function analyzeJunio() {
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

  const aliasMap = new Map();
  const pAcarreo = codeMap.get('OE.5.6.25.2');
  if (pAcarreo) aliasMap.set('OE.5.6.26.2', pAcarreo);
  const pArqueo = codeMap.get('OE.1.6.17');
  if (pArqueo) aliasMap.set('OE.1.6.23', pArqueo);

  const excelPath = path.resolve(__dirname, '../../liberado_junio.xlsx');
  const wb = XLSX.readFile(excelPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];

  // Set proper ref bounds
  const keys = Object.keys(sheet).filter(k => !k.startsWith('!'));
  let maxR = 0;
  let maxC = 0;
  for (const k of keys) {
    const decoded = XLSX.utils.decode_cell(k);
    if (decoded.r > maxR) maxR = decoded.r;
    if (decoded.c > maxC) maxC = decoded.c;
  }
  sheet['!ref'] = `A1:${XLSX.utils.encode_cell({ r: maxR, c: Math.min(maxC, 30) })}`;
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`Total rows parsed: ${rows.length}`);

  let validRows = [];
  let skipped = 0;
  let unmatched = new Map();

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0 || r.every(c => c === undefined || c === null || c === '')) {
      skipped++;
      continue;
    }

    const rawPartida = r[6] ? String(r[6]).trim() : '';
    if (!rawPartida || rawPartida.toUpperCase().startsWith('METRADO CORRESPONDIENTE') || rawPartida.toUpperCase() === 'PARTIDA') {
      skipped++;
      continue;
    }

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

    if (!match) {
      unmatched.set(rawPartida, (unmatched.get(rawPartida) || 0) + 1);
    }

    validRows.push({
      rowIndex: i,
      rawPartida,
      match: match ? match.codigo_expediente : null,
      fecha: parseExcelDate(r[0]),
      especialidad: r[1],
      frente: r[2],
      bloque: r[3],
      nivel: r[4],
      cuadrilla: r[5],
      elemento: r[7],
      cantidad: r[8],
      largo: r[9],
      ancho: r[10],
      alto: r[11],
      parcial: r[12],
      veces: r[13],
      acero: r[14],
      total: r[15],
      unidad: r[17],
      modif: r[18],
      plano: r[19],
      obreros: r[20],
      autor: r[21]
    });
  }

  console.log(`\nValid data rows: ${validRows.length}`);
  console.log(`Skipped / empty rows: ${skipped}`);
  console.log(`Unmatched partida varieties: ${unmatched.size}`);
  if (unmatched.size > 0) {
    console.log('Unmatched items:');
    for (const [p, c] of unmatched.entries()) {
      console.log(`  - [${c} rows] "${p}"`);
    }
  }

  console.log('\nSample parsed row 0:', validRows[0]);
  console.log('Sample parsed row 10:', validRows[10]);
}

analyzeJunio().catch(console.error);
