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
  // Extract the code portion: e.g. "OE.2.6.2.3" from "OE.2.6.2.3 Ensayos..." or "OE.2.6.2.3 - Ensayos..."
  const m = String(raw).trim().match(/^(OE\.[\d\.]+)/i);
  let code = m ? m[1] : String(raw).trim().split('-')[0].trim();

  let normalized = code.split('.').map(seg => {
    if (/^0\d+$/.test(seg)) {
      return String(parseInt(seg, 10));
    }
    return seg;
  }).join('.');
  return normalized;
}

async function testFullMatching() {
  let allPartidas = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from('catalogo_partidas').select('*').range(from, from + 999);
    if (error || !data || data.length === 0) break;
    allPartidas.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }

  const codeMap = new Map();
  allPartidas.forEach(p => {
    if (p.codigo_expediente) {
      codeMap.set(p.codigo_expediente.trim().toUpperCase(), p);
      const norm = normalizeCode(p.codigo_expediente);
      if (norm) codeMap.set(norm.toUpperCase(), p);
    }
  });

  // Build aliases
  const aliasMap = new Map();
  function setAlias(aliasCode, targetCode) {
    const target = codeMap.get(targetCode.toUpperCase());
    if (target) aliasMap.set(aliasCode.toUpperCase(), target);
  }

  setAlias('OE.5.6.26.2', 'OE.5.6.25.2');
  setAlias('OE.1.6.23', 'OE.1.6.17');
  setAlias('OE.1.6.20', 'OE.1.6.17');
  setAlias('OE.1.1.3.2.7', 'OE.1.1.3.2.6');
  setAlias('OE.2.3.9.10.8', 'OE.2.3.9.10.7');
  setAlias('OE.2.6.4.14', 'OE.2.6.4.7');
  setAlias('OE.2.6.4.13', 'OE.2.6.4.11'); // Acero veredas or pavimento
  setAlias('OE.2.6.4.12', 'OE.2.6.4.11');
  setAlias('OE.2.1.4.2.8', 'OE.2.1.4.2.6');
  setAlias('OE.2.1.4.2.9', 'OE.2.1.4.2.7');
  setAlias('OE.2.3.5.9', 'OE.2.3.5.8');
  setAlias('OE.2.3.9.8.5', 'OE.2.3.9.1.4');
  setAlias('OE.1.1.3.4.6', 'OE.1.2.8.4');

  const excelPath = path.resolve(__dirname, '../../liberado_junio.xlsx');
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

  let valid = 0;
  let matched = 0;
  let unmatchedList = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0 || r.every(c => c === undefined || c === null || c === '')) continue;

    const rawPartida = r[6] ? String(r[6]).trim() : '';
    if (!rawPartida || rawPartida.toUpperCase().startsWith('METRADO CORRESPONDIENTE') || rawPartida.toUpperCase() === 'PARTIDA') continue;

    valid++;
    let normCode = normalizeCode(rawPartida);
    let match = codeMap.get(normCode.toUpperCase()) || aliasMap.get(normCode.toUpperCase());

    if (!match) {
      // Check if description has "PAVIMENTOS" and "CONCRETO"
      if (rawPartida.toUpperCase().includes('PAVIMENTOS') && rawPartida.toUpperCase().includes('CONCRETO')) {
        match = codeMap.get('OE.2.6.4.7');
      }
    }

    if (match) {
      matched++;
    } else {
      unmatchedList.push({ row: i, rawPartida });
    }
  }

  console.log(`Matching results: ${matched} / ${valid} (${(matched/valid*100).toFixed(2)}%)`);
  if (unmatchedList.length > 0) {
    console.log(`Unmatched items (${unmatchedList.length}):`, unmatchedList.slice(0, 10));
  }
}

testFullMatching().catch(console.error);
