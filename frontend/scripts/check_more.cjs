const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://smnhkhceihcbagecqlth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbmhraGNlaWhjYmFnZWNxbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTMyODIsImV4cCI6MjA5MTcyOTI4Mn0.a9dTHFVjBDPF9nBn3uECGQgSsNHgwaRYFSL_la9Y85Y'
);

async function checkMore() {
  const { data: u } = await supabase.from('usuarios').select('*');
  console.log(`Usuarios: ${u?.length}`);
  
  const { data: p } = await supabase.from('personal').select('*');
  console.log(`Personal (obreros): ${p?.length}`);
  
  const { data: m } = await supabase.from('registro_metrados').select('id');
  console.log(`Metrados registros: ${m?.length}`);
  
  const { data: cat } = await supabase.from('catalogo_partidas').select('id');
  console.log(`Catálogo: ${cat?.length}`);
}

checkMore();
