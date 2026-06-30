const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://smnhkhceihcbagecqlth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbmhraGNlaWhjYmFnZWNxbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTMyODIsImV4cCI6MjA5MTcyOTI4Mn0.a9dTHFVjBDPF9nBn3uECGQgSsNHgwaRYFSL_la9Y85Y'
);

async function check() {
  const { count, error } = await supabase
    .from('catalogo_partidas')
    .select('*', { count: 'exact', head: true });
    
  if (error) console.error(error);
  console.log("Total partidas en BD:", count);
  
  const { data } = await supabase
    .from('catalogo_partidas')
    .select('codigo_expediente, descripcion, especialidad')
    .not('codigo_expediente', 'ilike', 'PC-%')
    .not('codigo_expediente', 'ilike', 'ACT.%')
    .limit(5);
    
  console.log("Muestra de 5 partidas oficiales:");
  console.log(data);
}

check();
