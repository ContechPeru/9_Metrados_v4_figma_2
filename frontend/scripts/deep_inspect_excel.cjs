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

async function deepInspect() {
  const excelPath = path.resolve(__dirname, '../../liberado_marz.xlsx');
  const wb = XLSX.readFile(excelPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  console.log('Total rows:', rows.length);
  const headerRow = rows[6];
  console.log('Header (row 6):', headerRow);

  // Let's print rows 7 to 20
  for (let i = 7; i <= 25; i++) {
    if (rows[i] && rows[i].length > 0) {
      console.log(`\nRow ${i}:`);
      headerRow.forEach((h, colIdx) => {
        if (h || rows[i][colIdx] !== undefined) {
          console.log(`  [${colIdx}] ${h || 'COL_' + colIdx}: ${JSON.stringify(rows[i][colIdx])}`);
        }
      });
    }
  }

  // Check how many non-empty data rows exist
  let validRowsCount = 0;
  const partidasFoundInExcel = new Set();
  for (let i = 7; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;
    // Check if there is a partida or some key column
    const partidaVal = r[12] || r[11] || r[10];
    if (partidaVal) {
      validRowsCount++;
      partidasFoundInExcel.add(String(partidaVal).trim());
    }
  }
  console.log(`\nTotal valid data rows: ${validRowsCount}`);
  console.log(`Unique partidas in Excel: ${partidasFoundInExcel.size}`);
  console.log('Sample unique partidas in Excel (first 10):', Array.from(partidasFoundInExcel).slice(0, 10));

  // Let's fetch all catalogo_partidas from Supabase to test matching
  console.log('\nFetching catalogo_partidas from Supabase...');
  let allPartidas = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from('catalogo_partidas').select('id, codigo_expediente, descripcion, especialidad, unidad_medida, tipo_calculo').range(from, from + 999);
    if (error) { console.error('Error fetching catalogo_partidas:', error); break; }
    if (!data || data.length === 0) break;
    allPartidas.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log(`Loaded ${allPartidas.length} catalogo_partidas`);

  const mapByCodigo = new Map();
  allPartidas.forEach(p => {
    if (p.codigo_expediente) {
      mapByCodigo.set(p.codigo_expediente.trim(), p);
    }
  });

  // Test parsing snapshot_codigo and finding partida_id
  let matched = 0;
  let unmatched = 0;
  const unmatchedSamples = new Set();

  for (const rawPartida of partidasFoundInExcel) {
    // How to parse codigo from rawPartida?
    // rawPartida might be "OE.1.1.1.6-Servicios higienicos" or "OE.1.1.1.6" or similar
    let codigo = rawPartida.split('-')[0].trim();
    if (mapByCodigo.has(codigo)) {
      matched++;
    } else {
      unmatched++;
      if (unmatchedSamples.size < 20) unmatchedSamples.add(rawPartida);
    }
  }
  console.log(`\nPartidas Matching: ${matched} matched, ${unmatched} unmatched`);
  if (unmatchedSamples.size > 0) {
    console.log('Unmatched samples:', Array.from(unmatchedSamples));
  }
}

deepInspect().catch(console.error);
