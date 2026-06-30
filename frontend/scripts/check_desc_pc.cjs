const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://smnhkhceihcbagecqlth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbmhraGNlaWhjYmFnZWNxbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTMyODIsImV4cCI6MjA5MTcyOTI4Mn0.a9dTHFVjBDPF9nBn3uECGQgSsNHgwaRYFSL_la9Y85Y'
);

async function checkDescPC() {
  const { data, error } = await supabase
    .from('catalogo_partidas')
    .select('id, codigo_expediente, descripcion, especialidad')
    .ilike('descripcion', '%PC%');
  
  if (error) {
    console.error(error);
    return;
  }
  
  console.log(`Encontradas ${data.length} partidas con 'PC' en la descripcion.`);
  
  // Print some examples
  data.slice(0, 5).forEach(m => {
    console.log(`[${m.especialidad || 'NULL'}] ${m.codigo_expediente} -> ${m.descripcion}`);
  });
}

checkDescPC();
