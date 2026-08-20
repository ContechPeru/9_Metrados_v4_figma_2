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

const items = [
  "OE.1.1.3.2.7 - Traslado de materiales con camion volquete de 3 m3 de almacén huancaro a belempampa (d=1800m)",
  "OE.1.6.20 - Raspado de gigantón para obtención de goma o resina",
  "OE.2.3.9.10.8 - Escaleras - Concreto f'c=210 kg/cm2",
  "OE.2.6.2.3 Ensayos de compactacion de Suelos",
  "OE.2.6.2.4 Rotura de Briquetas",
  "OE.2.6.4.14 - PAVIMENTOS - CONCRETO F'C=210 KG/CM2",
  "OE.2.1.4.2.8 - Reacomodo y recolocación de material pétreo existente",
  "OE.2.1.4.2.9 - Reconformacion, reacomodo y compactacion de material seleccionado existente",
  "OE.2.6.4.13 ACERO DE REFUERZO F'Y=4200 KG/CM2 EN VEREDAS",
  "OE.2.3.5.9 - Sobrecimientos reforzados - Concreto f'c=210 kg/cm2",
  "OE.2.6.4.12 ACERO DE REFUERZO F'Y=4200 KG/CM2 EN VEREDAS",
  "OE.2.3.9.8.5 - Falso piso armado - encofrado y desencofrado con fenólico",
  "OE.2.6.2.5 Pruebas de Soldadura",
  "OE.2.6.4.13 - PAVIMENTOS - CONCRETO F'C=210 KG/CM2",
  "OE.2.6.2.2 Diseño de Mezclas",
  "OE.1.1.3.4.6 - Abastecimiento de agua para ejecución de obras",
  "OE.2.6.2.7 Control de calidad y seguimiento en obra"
];

async function findMatches() {
  let allPartidas = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from('catalogo_partidas').select('id, codigo_expediente, descripcion, especialidad, unidad_medida').range(from, from + 999);
    if (error || !data || data.length === 0) break;
    allPartidas.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log(`Loaded ${allPartidas.length} catalogo_partidas`);

  for (const item of items) {
    let rawCode = item.split('-')[0].trim().split(' ')[0].trim();
    let desc = item.includes('-') ? item.split('-').slice(1).join('-').trim() : item.replace(rawCode, '').trim();

    const byCode = allPartidas.filter(p => p.codigo_expediente.startsWith(rawCode.slice(0, 8)));
    const byDesc = allPartidas.filter(p => desc && p.descripcion && p.descripcion.toLowerCase().includes(desc.slice(0, 15).toLowerCase()));

    console.log(`\n================================`);
    console.log(`Searching for: "${item}"`);
    console.log(`Code prefix "${rawCode.slice(0, 8)}":`, byCode.map(p => `${p.codigo_expediente} | ${p.descripcion}`));
    console.log(`Desc matches "${desc.slice(0, 15)}":`, byDesc.map(p => `${p.codigo_expediente} | ${p.descripcion}`));
  }
}

findMatches().catch(console.error);
