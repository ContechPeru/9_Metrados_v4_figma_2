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

async function checkDetails() {
  const excelPath = path.resolve(__dirname, '../../liberado_marz.xlsx');
  const wb = XLSX.readFile(excelPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const headerRow = rows[6];
  console.log('Max column index in any row:');
  let maxCols = 0;
  for (const r of rows) {
    if (r && r.length > maxCols) maxCols = r.length;
  }
  console.log('Max columns:', maxCols);

  // Check rows 0 to 6 to see if there are other headers
  for (let i = 0; i <= 6; i++) {
    console.log(`Header Row ${i}:`, JSON.stringify(rows[i]));
  }

  // Check date parsing
  console.log('\n--- Date Parsing Test ---');
  for (let i = 7; i <= 15; i++) {
    const rawDate = rows[i] ? rows[i][2] : null;
    if (rawDate) {
      if (typeof rawDate === 'number') {
        const parsed = XLSX.SSF.parse_date_code(rawDate);
        const yyyy = parsed.y;
        const mm = String(parsed.m).padStart(2, '0');
        const dd = String(parsed.d).padStart(2, '0');
        console.log(`Row ${i} date ${rawDate} -> ${yyyy}-${mm}-${dd}`);
      } else {
        console.log(`Row ${i} date ${rawDate} (string)`);
      }
    }
  }

  // Let's check catalog matching for the unmatched items
  console.log('\n--- Fetching all catalog partidas ---');
  let allPartidas = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from('catalogo_partidas').select('id, codigo_expediente, descripcion, especialidad, unidad_medida, tipo_calculo').range(from, from + 999);
    if (error || !data || data.length === 0) break;
    allPartidas.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }

  const codigosEnCatalogo = allPartidas.map(p => p.codigo_expediente.trim());
  console.log(`Loaded ${allPartidas.length} catalog items`);

  // Let's check the 14 unmatched items:
  const unmatched = [
    'METRADO CORRESPONDIENTE AL MES DE ENERO',
    'METRADO CORRESPONDIENTE AL MES DE FEBRERO',
    'OE.5.6.25.1.1-SOPORTE PARA TUBERÍAS EN TECHO',
    'OE.5.6.26.2-ACARREO DE MATERIALES ESPECIALIZADO ALMACÉN - OBRA',
    'OE.6.02.60-TUBERÍA CONDUIT EMT DE 20 MM',
    'OE.6.02.62-CURVA CONDUIT EMT DE 20 MM',
    'OE.6.02.64-UNIÓN CONDUIT EMT DE 20MM',
    'OE.6.02.66-CONECTOR CONDUIT EMT DE 20 MM',
    'OE.6.02.71-PROTECCION TEMPORAL DE TUBERIA CONDUIT CON FILM',
    'OE.6.02.74-SISTEMA DE FIJACION CON RIEL UNISTRUT h=2.1 cm',
    'OE.6.02.77-ABRAZADERA UNISTRUT DE 3/4"',
    'OE.3.2.6-Tarrajeo en vigas  C:A 1:5',
    'OE.3.2.3-Tarrajeo en muros exteriores mezcla C:A 1:5',
    'OE.1.6.23-PROTECCION PREVENTIVA DEL AREA ARQUEOLOGICA'
  ];

  for (const item of unmatched) {
    const code = item.split('-')[0].trim();
    // Search in codigosEnCatalogo
    const exact = codigosEnCatalogo.filter(c => c === code);
    const similar = codigosEnCatalogo.filter(c => c.startsWith(code.slice(0, 6)) || c.includes(code.replace('.0', '.')));
    const byDesc = allPartidas.filter(p => item.toLowerCase().includes(p.descripcion?.toLowerCase()?.slice(0, 15) || '___'));
    console.log(`\nUnmatched item: "${item}"`);
    console.log(`  Code: "${code}" | Exact: ${exact.length} | Similar codes:`, similar.slice(0, 5));
    if (byDesc.length > 0) {
      console.log(`  By Desc matches:`, byDesc.map(b => `${b.codigo_expediente} (${b.descripcion})`).slice(0, 3));
    }
  }

  // Let's check how many total rows in Excel are section titles like "METRADO CORRESPONDIENTE..."
  let sectionTitles = 0;
  let dataRows = 0;
  let emptyRows = 0;
  for (let i = 7; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0 || r.every(c => c === undefined || c === null || c === '')) {
      emptyRows++;
      continue;
    }
    const partida = r[12];
    if (typeof partida === 'string' && partida.startsWith('METRADO CORRESPONDIENTE')) {
      sectionTitles++;
    } else if (partida) {
      dataRows++;
    }
  }
  console.log(`\nStats: Data rows: ${dataRows}, Section titles: ${sectionTitles}, Empty rows: ${emptyRows}`);
}

checkDetails().catch(console.error);
