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
    if (/^0\d+$/.test(seg)) return String(parseInt(seg, 10));
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

async function run() {
  console.log('=== STEP 1: ENSURE USER liberado_marzo ===');
  let { data: user, error: errUser } = await supabase
    .from('usuarios_sistema')
    .select('*')
    .eq('dni_username', 'liberado_marzo')
    .maybeSingle();

  if (!user) {
    console.log('User liberado_marzo not found. Creating in usuarios_sistema...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('liberado123', salt);

    const { data: newUser, error: errCreate } = await supabase
      .from('usuarios_sistema')
      .insert({
        dni_username: 'liberado_marzo',
        nombre_completo: 'liberado_marzo',
        correo_institucional: 'liberado_marzo@contechperu.pe',
        password_hash: passwordHash,
        area: 'LIQUIDACION',
        cargo_rol: 'LIQUIDACIONES',
        especialidad: 'ARQUITECTURA',
        especialidades: ['ARQUITECTURA'],
        es_administrador_presupuesto: false,
        es_gerencia: false,
        is_active: true
      })
      .select()
      .single();

    if (errCreate) {
      console.error('Error creating user liberado_marzo:', errCreate);
      process.exit(1);
    }
    user = newUser;
    console.log('Created user liberado_marzo with ID:', user.id);
  } else {
    console.log('Found user liberado_marzo with ID:', user.id);
  }

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

  console.log('\n=== STEP 3: PARSE EXCEL FILE liberado_marz_arq.xlsx ===');
  const excelPath = path.resolve(__dirname, '../../liberado_marz_arq.xlsx');
  console.log('Reading:', excelPath);
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
  console.log(`Total raw rows in Excel: ${rows.length}`);

  const metradosToInsert = [];
  let skippedCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0 || r.every(c => c === undefined || c === null || c === '')) {
      skippedCount++;
      continue;
    }

    const rawPartida = r[7] ? String(r[7]).trim() : '';
    if (!rawPartida) {
      skippedCount++;
      continue;
    }

    let rawCode = rawPartida.split('-')[0].trim();
    let normCode = normalizeCode(rawCode);
    let descFromExcel = rawPartida.includes('-') ? rawPartida.split('-').slice(1).join('-').trim() : '';

    let match = codeMap.get(rawCode.toUpperCase()) || 
                codeMap.get(normCode.toUpperCase());

    if (!match && descFromExcel) {
      const found = allPartidas.find(p => p.descripcion && p.descripcion.toLowerCase() === descFromExcel.toLowerCase());
      if (found) match = found;
    }

    const snapshotCodigo = match ? match.codigo_expediente : (normCode || rawCode);
    const snapshotDescripcion = match ? match.descripcion : (descFromExcel || rawPartida);

    const fecha = parseExcelDate(r[1]);
    const grado = r[0] !== undefined && r[0] !== null ? String(r[0]).trim() : null;
    const especialidad = 'ARQUITECTURA';
    const frente = r[3] ? String(r[3]).trim() : null;
    const bloque = r[4] ? String(r[4]).trim() : null;
    const nivel = r[5] ? String(r[5]).trim() : null;
    const cuadrilla = r[6] ? String(r[6]).trim() : null;
    const elemento = r[8] ? String(r[8]).trim() : '';
    const totalVal = typeof r[9] === 'number' ? r[9] : (parseFloat(r[9]) || 0);
    const unidad = r[11] ? String(r[11]).trim() : (match?.unidad_medida || 'm²');
    const modif = r[12] ? String(r[12]).trim() : null;

    metradosToInsert.push({
      user_id: user.id,
      firma_ingeniero: 'liberado_marzo',
      origen_archivo: 'liberado_marz_arq.xlsx',
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
      cantidad_elementos: 1,
      medida_largo_area: 0,
      medida_ancho_empalme: 0,
      medida_alto_gancho: 0,
      resultado_parcial: totalVal,
      nro_repeticiones: 1,
      acero_diametro: null,
      resultado_total: totalVal,
      unidad: unidad,
      obs_motivo: null,
      obs_detalle: modif,
      plano_sist: null,
      plano_num: null,
      sin_plano: false,
      tipo_calculo: match?.tipo_calculo || 'ESTANDAR'
    });
  }

  console.log(`\nProcessed ${metradosToInsert.length} metrados to insert (skipped ${skippedCount} rows).`);
  const mappedCount = metradosToInsert.filter(m => m.partida_id).length;
  console.log(`With partida_id mapped: ${mappedCount} / ${metradosToInsert.length} (${(mappedCount / metradosToInsert.length * 100).toFixed(2)}%)`);

  console.log('\n=== STEP 4: BATCH INSERT INTO registro_metrados ===');
  const batchSize = 500;
  let totalInserted = 0;

  for (let i = 0; i < metradosToInsert.length; i += batchSize) {
    const batch = metradosToInsert.slice(i, i + batchSize);
    const { error: errInsert } = await supabase
      .from('registro_metrados')
      .insert(batch);

    if (errInsert) {
      console.error(`\nError in batch ${i} - ${i + batch.length}:`, errInsert);
      process.exit(1);
    }
    totalInserted += batch.length;
    process.stdout.write(`\rInserted: ${totalInserted} / ${metradosToInsert.length}`);
  }

  console.log('\n\n=== STEP 5: VERIFY UPLOAD IN SUPABASE ===');
  const { count: countUploaded, error: errCount } = await supabase
    .from('registro_metrados')
    .select('*', { count: 'exact', head: true })
    .eq('firma_ingeniero', 'liberado_marzo');

  console.log(`Total records in registro_metrados for firma_ingeniero='liberado_marzo': ${countUploaded}`);

  const { count: countArq } = await supabase
    .from('registro_metrados')
    .select('*', { count: 'exact', head: true })
    .eq('firma_ingeniero', 'liberado_marzo')
    .eq('especialidad', 'ARQUITECTURA');

  console.log(`Total ARQUITECTURA records for firma_ingeniero='liberado_marzo': ${countArq}`);

  console.log('\n🎉 SUCCESS: All metrados from liberado_marz_arq.xlsx were successfully uploaded to Supabase!');
}

run().catch(console.error);
