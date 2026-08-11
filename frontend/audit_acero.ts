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
  const { data, error } = await supabase
    .from('registro_metrados')
    .select(`
      id,
      acero_diametro,
      catalogo_partidas (
        id,
        tipo_calculo,
        codigo_expediente
      )
    `)
    .not('acero_diametro', 'is', null);

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  const affected = data.filter((row: any) => {
    const tipo = row.catalogo_partidas?.tipo_calculo;
    // Si no es Acero, entonces está mal que tenga acero_diametro
    return tipo !== 'Acero';
  });

  console.log(`Total metrados con acero_diametro: ${data.length}`);
  console.log(`Total metrados con acero_diametro pero tipo_calculo NO es Acero: ${affected.length}`);
  
  if (affected.length > 0) {
    console.log('Ejemplo de afectados:', affected.slice(0, 5));
  }
}

checkAcero();
