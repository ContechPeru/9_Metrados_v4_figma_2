const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://smnhkhceihcbagecqlth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbmhraGNlaWhjYmFnZWNxbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTMyODIsImV4cCI6MjA5MTcyOTI4Mn0.a9dTHFVjBDPF9nBn3uECGQgSsNHgwaRYFSL_la9Y85Y'
);

async function checkStats() {
  const { count: proyectosCount } = await supabase.from('proyectos').select('*', { count: 'exact', head: true });
  const { count: personalCount } = await supabase.from('personal').select('*', { count: 'exact', head: true });
  
  console.log(`Proyectos: ${proyectosCount}`);
  console.log(`Personal: ${personalCount}`);
}

checkStats();
