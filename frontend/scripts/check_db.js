import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('catalogo_partidas')
    .select('codigo_expediente, descripcion, especialidad')
    .eq('codigo_expediente', 'ACT.01.07');
    
  console.log("ACT.01.07 in DB:", data);
}

check();
