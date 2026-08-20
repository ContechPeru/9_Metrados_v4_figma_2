const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

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

async function inspectJunio() {
  console.log('=== STEP 1: ENSURE USER liberado_junio ===');
  let { data: user } = await supabase.from('usuarios_sistema').select('*').eq('dni_username', 'liberado_junio').single();
  if (!user) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('liberado_junio', salt);
    const newUser = {
      dni_username: 'liberado_junio',
      nombre_completo: 'liberado_junio',
      password_hash: passwordHash,
      area: 'LIQUIDACION',
      cargo_rol: 'LIQUIDACIONES',
      correo_institucional: 'liberado_junio@contechperu.pe',
      is_active: true
    };
    const { data: created, error: errCreate } = await supabase.from('usuarios_sistema').insert(newUser).select().single();
    if (errCreate) {
      console.error('Error creating user liberado_junio:', errCreate);
      process.exit(1);
    }
    user = created;
    console.log('User liberado_junio created:', user.id);
  } else {
    console.log('User liberado_junio already exists:', user.id);
  }

  console.log('\n=== STEP 2: INSPECT EXCEL FILE liberado_junio.xlsx ===');
  const excelPath = path.resolve(__dirname, '../../liberado_junio.xlsx');
  if (!fs.existsSync(excelPath)) {
    console.error('File not found:', excelPath);
    process.exit(1);
  }

  const wb = XLSX.readFile(excelPath);
  console.log('Sheet names:', wb.SheetNames);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`Total rows in sheet "${wb.SheetNames[0]}": ${rows.length}`);

  for (let r = 0; r <= 8; r++) {
    console.log(`Row ${r}:`, JSON.stringify(rows[r]));
  }

  console.log('\n=== STEP 3: LOAD CATALOGO_PARTIDAS & TEST MATCHING ===');
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

  // Check alias mappings
  const aliasMap = new Map();
  const pAcarreo = codeMap.get('OE.5.6.25.2');
  if (pAcarreo) aliasMap.set('OE.5.6.26.2', pAcarreo);
  const pArqueo = codeMap.get('OE.1.6.17');
  if (pArqueo) aliasMap.set('OE.1.6.23', pArqueo);

  let validRowsCount = 0;
  let emptyOrHeaderCount = 0;
  const unmatched = new Map();

  for (let i = 7; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0 || r.every(c => c === undefined || c === null || c === '')) {
      emptyOrHeaderCount++;
      continue;
    }

    const rawPartida = r[12] ? String(r[12]).trim() : '';
    if (!rawPartida || rawPartida.toUpperCase().startsWith('METRADO CORRESPONDIENTE')) {
      emptyOrHeaderCount++;
      continue;
    }

    validRowsCount++;
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
  }

  console.log(`\nValid data rows: ${validRowsCount}`);
  console.log(`Skipped / empty rows: ${emptyOrHeaderCount}`);
  console.log(`Unmatched partida varieties: ${unmatched.size}`);
  if (unmatched.size > 0) {
    console.log('Unmatched items and counts:');
    for (const [p, c] of unmatched.entries()) {
      console.log(`  - [${c} rows] "${p}"`);
    }
  }
}

inspectJunio().catch(console.error);
