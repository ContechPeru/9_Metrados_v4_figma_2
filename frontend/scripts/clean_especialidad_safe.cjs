const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://smnhkhceihcbagecqlth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbmhraGNlaWhjYmFnZWNxbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTMyODIsImV4cCI6MjA5MTcyOTI4Mn0.a9dTHFVjBDPF9nBn3uECGQgSsNHgwaRYFSL_la9Y85Y'
);

async function cleanDuplicateSafe() {
  console.log("1. Reasignando usuarios a COMUNICACIONES...");
  const { error: err1 } = await supabase
    .from('usuarios_sistema')
    .update({ especialidad: 'COMUNICACIONES' })
    .eq('especialidad', 'INSTALACIONES DE COMUNICACIONES');
    
  if (err1) {
    console.error("Error al reasignar:", err1);
    return;
  }
  
  console.log("2. Eliminando especialidad duplicada...");
  const { error: err2 } = await supabase
    .from('especialidades')
    .delete()
    .eq('nombre', 'INSTALACIONES DE COMUNICACIONES');
    
  if (err2) {
    console.error("Error al eliminar:", err2);
  } else {
    console.log("¡ÉXITO! Especialidad duplicada eliminada para siempre.");
  }
}

cleanDuplicateSafe();
