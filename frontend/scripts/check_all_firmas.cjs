const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length > 0) env[k.trim()] = v.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkAllFirmas() {
  const { data: users } = await supabase.from('usuarios_sistema').select('dni_username, nombre_completo');
  console.log('Users in system:', users?.map(u => u.dni_username));

  const { count: countTotal } = await supabase.from('registro_metrados').select('*', { count: 'exact', head: true });
  console.log(`Total general en registro_metrados: ${countTotal}`);

  const firmas = [
    'liberado_marz',
    'liberado_junio',
    'ADMINISTRADOR 1',
    'SHAORI PILAR CONTRERAS RUPA',
    'GIANFRANCO SHAMIR DÍAZ QUISPE',
    'KEVIN F. SUTTA MELO',
    'GIAMPIERO OCON MAROCHO',
    'CARLOS EDGAR REAÑO PANTIGOZO',
    'MIRTHA YAHAIDA ZÁRATE GARAY',
    'KLEYSON MANUEL DIAZ ARAUJO',
    'KENYI CARDENAS ATAUCONCHA',
    'TEODORO WILDER MORA CARRILLO'
  ];

  for (const f of firmas) {
    const { count } = await supabase.from('registro_metrados').select('*', { count: 'exact', head: true }).eq('firma_ingeniero', f);
    const { count: countArq } = await supabase.from('registro_metrados').select('*', { count: 'exact', head: true }).eq('firma_ingeniero', f).eq('especialidad', 'ARQUITECTURA');
    console.log(`Firma "${f}": Total = ${count} | Arquitectura = ${countArq}`);
  }
}

checkAllFirmas().catch(console.error);
