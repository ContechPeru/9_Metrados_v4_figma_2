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

async function inspect() {
  console.log('=== STEP 1: CHECK USER liberado_marzo ===');
  const { data: users, error: errUser } = await supabase
    .from('usuarios_sistema')
    .select('*')
    .or('dni_username.eq.liberado_marzo,dni_username.eq.liberado_marz');
  console.log('Users found:', users);

  console.log('\n=== STEP 2: CHECK EXCEL FILE liberado_marz_arq.xlsx ===');
  const excelPath = path.resolve(__dirname, '../../liberado_marz_arq.xlsx');
  if (!fs.existsSync(excelPath)) {
    console.error('File NOT FOUND at:', excelPath);
    return;
  }
  console.log('File size:', fs.statSync(excelPath).size, 'bytes');

  const wb = XLSX.readFile(excelPath);
  console.log('Sheet names:', wb.SheetNames);

  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
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
    console.log(`Sheet "${name}" rows: ${rows.length}, maxRow=${maxR}, maxCol=${maxC}`);
    console.log('First 5 rows:');
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      console.log(`Row ${i}:`, JSON.stringify(rows[i]));
    }
  }
}

inspect().catch(console.error);
