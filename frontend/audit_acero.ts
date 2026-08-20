import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const p = path.resolve('.env');
  if (fs.existsSync(p)) {
    const lines = fs.readFileSync(p, 'utf8').split('\n');
    for (const line of lines) {
      const [key, ...vals] = line.split('=');
      if (key && vals.length > 0) {
        process.env[key.trim()] = vals.join('=').trim();
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAcero() {
  let allRows: any[] = [];
  let from = 0;
  const pageSize = 1000;

  console.log('Buscando registros con acero_diametro...');

  while (true) {
    const { data, error } = await supabase
      .from('registro_metrados')
      .select(`
        id,
        acero_diametro,
        catalogo_partidas (
          id,
          tipo_calculo,
          codigo_expediente,
          descripcion
        )
      `)
      .not('acero_diametro', 'is', null)
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error fetching data:', error);
      return;
    }

    if (!data || data.length === 0) break;
    allRows.push(...data);

    if (data.length < pageSize) break;
    from += pageSize;
  }

  const affected = allRows.filter((row: any) => {
    const tipo = row.catalogo_partidas?.tipo_calculo;
    // Si no es ACERO, entonces no debería tener acero_diametro
    return !tipo || tipo.toUpperCase() !== 'ACERO';
  });

  console.log(`Total metrados con acero_diametro: ${allRows.length}`);
  console.log(`Total metrados con acero_diametro pero tipo_calculo NO es ACERO: ${affected.length}`);
  
  if (affected.length > 0) {
    console.log('Ejemplo de afectados (primeros 5):', JSON.stringify(affected.slice(0, 5), null, 2));
  } else {
    console.log('¡Todo en orden! No hay registros con acero_diametro en partidas que no sean de tipo ACERO.');
  }
}

checkAcero();
