import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { resolve } from 'path';

const envContent = fs.readFileSync(resolve(process.cwd(), '.env'), 'utf-8');
const envVars = Object.fromEntries(envContent.split('\n').map(line => line.split('=')));

const supabaseUrl = envVars.VITE_SUPABASE_URL?.trim() || '';
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY?.trim() || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('catalogo_partidas')
    .select('codigo_expediente');
  
  if (data) {
    const counts = {};
    data.forEach(d => {
      counts[d.codigo_expediente] = (counts[d.codigo_expediente] || 0) + 1;
    });
    const duplicates = Object.entries(counts).filter(([k, v]) => v > 1);
    console.log("Duplicates:", duplicates.slice(0, 5));
  }

  if (error) {
    console.error("Error fetching data:", error);
    return;
  }
}

main();
