const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://smnhkhceihcbagecqlth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbmhraGNlaWhjYmFnZWNxbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTMyODIsImV4cCI6MjA5MTcyOTI4Mn0.a9dTHFVjBDPF9nBn3uECGQgSsNHgwaRYFSL_la9Y85Y'
);

async function check() {
  const { data, error } = await supabase
    .from('catalogo_partidas')
    .select('id, codigo_expediente, descripcion, origen')
    .ilike('codigo_expediente', 'PC%')
    .limit(10);
  
  if (error) console.error("ERROR:", error);
  console.log("DATA (starts with PC):", data);

  const { data: data2 } = await supabase
    .from('catalogo_partidas')
    .select('id, codigo_expediente, descripcion, origen')
    .ilike('codigo_expediente', '%PC%')
    .limit(10);
  console.log("DATA (contains PC):", data2);
}

check();
