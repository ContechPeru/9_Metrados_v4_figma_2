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

async function runClean() {
  console.log('Fetching catalog...');
  const { data: partidas, error: errPartidas } = await supabase
    .from('catalogo_partidas')
    .select('id, tipo_calculo');

  if (errPartidas) {
    console.error('Error fetching catalog:', errPartidas);
    return;
  }

  const idsNoAcero = partidas
    .filter(p => !p.tipo_calculo || p.tipo_calculo.toUpperCase() !== 'ACERO')
    .map(p => p.id);

  console.log(`Found ${idsNoAcero.length} partidas that are NOT 'Acero'.`);

  // We fetch metrados that need to be cleaned
  let allAffected = [];
  let from = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('registro_metrados')
      .select('id, partida_id')
      .not('acero_diametro', 'is', null)
      .range(from, from + pageSize - 1);
      
    if (error) {
      console.error('Error fetching metrados:', error);
      return;
    }
    
    if (data.length === 0) break;
    
    // filter those whose partida_id is in idsNoAcero
    const chunk = data.filter(m => idsNoAcero.includes(m.partida_id)).map(m => m.id);
    allAffected.push(...chunk);
    
    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(`Total metrados to clean: ${allAffected.length}`);

  if (allAffected.length === 0) {
    console.log('Nothing to clean.');
    return;
  }

  // Update in batches of 100
  for (let i = 0; i < allAffected.length; i += 100) {
    const batchIds = allAffected.slice(i, i + 100);
    const { error: updError } = await supabase
      .from('registro_metrados')
      .update({ acero_diametro: null })
      .in('id', batchIds);

    if (updError) {
      console.error('Error updating batch:', updError);
    } else {
      console.log(`Cleaned batch ${i / 100 + 1} (${batchIds.length} records)`);
    }
  }
  
  console.log('Cleanup complete.');
}

runClean();
