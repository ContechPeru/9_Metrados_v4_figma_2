const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://smnhkhceihcbagecqlth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbmhraGNlaWhjYmFnZWNxbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTMyODIsImV4cCI6MjA5MTcyOTI4Mn0.a9dTHFVjBDPF9nBn3uECGQgSsNHgwaRYFSL_la9Y85Y'
);

async function checkMisc() {
  const { data, error } = await supabase
    .from('catalogo_partidas')
    .select('id, codigo_expediente, descripcion, especialidad, origen')
    .ilike('codigo_expediente', 'ACT%');
  
  console.log(`Partidas ACT: ${data ? data.length : 0}`);
  if (data && data.length > 0) {
    data.slice(0, 10).forEach(d => console.log(d));
  }

  const { data: data2 } = await supabase
    .from('catalogo_partidas')
    .select('id, codigo_expediente, descripcion, especialidad, origen')
    .ilike('descripcion', '% PC %');
    
  console.log(`Partidas con palabra 'PC' en descripcion: ${data2 ? data2.length : 0}`);
  if (data2 && data2.length > 0) {
    data2.slice(0, 10).forEach(d => console.log(d));
  }
}

checkMisc();
