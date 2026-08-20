const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// 1. Read .env
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length > 0) env[k.trim()] = v.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function inspect() {
  console.log('=== INSPECTING EXCEL FILE ===');
  const excelPath = path.resolve(__dirname, '../../liberado_marz.xlsx');
  console.log('Excel path:', excelPath);
  
  if (!fs.existsSync(excelPath)) {
    console.error('File not found:', excelPath);
    return;
  }

  const wb = XLSX.readFile(excelPath);
  console.log('Sheet names:', wb.SheetNames);

  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`\n--- Sheet "${name}" --- Total rows: ${data.length}`);
    for (let r = 0; r < Math.min(10, data.length); r++) {
      console.log(`Row ${r}:`, JSON.stringify(data[r]));
    }
  }

  console.log('\n=== INSPECTING SUPABASE USERS ===');
  const { data: users, error: errUsers } = await supabase.from('usuarios_sistema').select('*');
  if (errUsers) console.error('Error fetching users:', errUsers);
  else {
    console.log('Users found:', users.map(u => ({ id: u.id, dni_username: u.dni_username, nombre_completo: u.nombre_completo, cargo_rol: u.cargo_rol })));
  }

  console.log('\n=== INSPECTING REGISTRO_METRADOS SAMPLE ===');
  const { data: sampleMet, error: errMet } = await supabase.from('registro_metrados').select('*').limit(3);
  if (errMet) console.error('Error fetching metrados sample:', errMet);
  else {
    console.log('Sample metrado columns:', sampleMet[0] ? Object.keys(sampleMet[0]) : 'No records');
    console.log('Sample metrado 0:', sampleMet[0]);
  }

  console.log('\n=== INSPECTING CATALOGO_PARTIDAS COUNT ===');
  const { count, error: errCount } = await supabase.from('catalogo_partidas').select('*', { count: 'exact', head: true });
  console.log('Catalogo partidas total count:', count, 'error:', errCount);
}

inspect().catch(console.error);
