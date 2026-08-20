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
    if (/^0\d+$/.test(seg)) return String(parseInt(seg, 10));
    return seg;
  }).join('.');
  return normalized;
}

async function analyze() {
  const excelPath = path.resolve(__dirname, '../../liberado_marz_arq.xlsx');
  const wb = XLSX.readFile(excelPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];

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

  console.log(`Total rows in sheet: ${rows.length}`);
  console.log('Header row:', rows[0]);

  // Load all catalogo_partidas
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

  const uniquePartidas = new Set();
  const unmatched = [];
  let validDataRows = 0;

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0 || r.every(c => c === undefined || c === null || c === '')) continue;
    
    const rawPartida = r[7] ? String(r[7]).trim() : '';
    if (!rawPartida) {
      console.log(`Row ${i} missing partida:`, r);
      continue;
    }
    validDataRows++;
    uniquePartidas.add(rawPartida);

    let rawCode = rawPartida.split('-')[0].trim();
    let normCode = normalizeCode(rawCode);
    let descFromExcel = rawPartida.includes('-') ? rawPartida.split('-').slice(1).join('-').trim() : '';

    let match = codeMap.get(rawCode.toUpperCase()) || 
                codeMap.get(normCode.toUpperCase());

    if (!match && descFromExcel) {
      const found = allPartidas.find(p => p.descripcion && p.descripcion.toLowerCase() === descFromExcel.toLowerCase());
      if (found) match = found;
    }

    if (!match) {
      unmatched.push({ row: i, rawPartida, rawCode, normCode, descFromExcel });
    }
  }

  console.log(`\nValid data rows: ${validDataRows}`);
  console.log(`Unique raw partidas in Excel: ${uniquePartidas.size}`);
  console.log(`Unmatched rows count: ${unmatched.length}`);

  if (unmatched.length > 0) {
    console.log('Sample unmatched rows:', unmatched.slice(0, 10));
    const uniqueUnmatched = [...new Set(unmatched.map(u => u.rawPartida))];
    console.log('Unique unmatched partidas:', uniqueUnmatched);
  } else {
    console.log('🎉 100.00% MATCHING WITH CATALOGO_PARTIDAS!');
  }
}

analyze().catch(console.error);
