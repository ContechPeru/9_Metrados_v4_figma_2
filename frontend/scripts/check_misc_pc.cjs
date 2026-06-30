const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://smnhkhceihcbagecqlth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbmhraGNlaWhjYmFnZWNxbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTMyODIsImV4cCI6MjA5MTcyOTI4Mn0.a9dTHFVjBDPF9nBn3uECGQgSsNHgwaRYFSL_la9Y85Y'
);

async function checkMiscPC() {
  const { data, error } = await supabase
    .from('catalogo_partidas')
    .select('id, codigo_expediente, descripcion, especialidad')
    .ilike('codigo_expediente', '%PC%');
  
  if (error) {
    console.error(error);
    return;
  }
  
  const misc = data.filter(d => !d.codigo_expediente.startsWith('PC-'));
  console.log(`Encontradas ${misc.length} partidas con 'PC' pero sin la nomenclatura estándar.`);
  
  // Imprimimos hasta 20 ejemplos
  misc.slice(0, 20).forEach(m => {
    console.log(`[${m.especialidad || 'NULL'}] ${m.codigo_expediente} -> ${m.descripcion}`);
  });
}

checkMiscPC();
