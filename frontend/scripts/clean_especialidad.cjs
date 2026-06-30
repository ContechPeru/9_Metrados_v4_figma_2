const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://smnhkhceihcbagecqlth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbmhraGNlaWhjYmFnZWNxbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTMyODIsImV4cCI6MjA5MTcyOTI4Mn0.a9dTHFVjBDPF9nBn3uECGQgSsNHgwaRYFSL_la9Y85Y'
);

async function cleanDuplicate() {
  // Vamos a eliminar "INSTALACIONES DE COMUNICACIONES" para quedarnos solo con "COMUNICACIONES"
  const { data, error } = await supabase
    .from('especialidades')
    .delete()
    .eq('nombre', 'INSTALACIONES DE COMUNICACIONES');
    
  if (error) {
    console.error("Error al eliminar:", error);
  } else {
    console.log("¡Eliminado correctamente INSTALACIONES DE COMUNICACIONES!");
  }
}

cleanDuplicate();
