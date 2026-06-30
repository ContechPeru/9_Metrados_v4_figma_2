const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://smnhkhceihcbagecqlth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbmhraGNlaWhjYmFnZWNxbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTMyODIsImV4cCI6MjA5MTcyOTI4Mn0.a9dTHFVjBDPF9nBn3uECGQgSsNHgwaRYFSL_la9Y85Y'
);

async function wipeClean() {
  console.log("Rompiendo dependencias jerárquicas (parent_id) para poder borrar...");
  
  let idsToDelete = [];
  let page = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('catalogo_partidas')
      .select('id, codigo_expediente')
      .range(page * 1000, (page + 1) * 1000 - 1);
      
    if (error) break;
    if (data.length === 0) break;
    
    const toDelete = data.filter(d => {
      const cod = d.codigo_expediente.toUpperCase();
      return !cod.startsWith('PC-') && !cod.startsWith('ACT.');
    });
    
    idsToDelete.push(...toDelete.map(d => d.id));
    page++;
  }

  const batchSize = 100;
  
  // Paso 1: Nullify parent_id
  for (let i = 0; i < idsToDelete.length; i += batchSize) {
    const batch = idsToDelete.slice(i, i + batchSize);
    await supabase.from('catalogo_partidas').update({ parent_id: null }).in('id', batch);
  }
  
  console.log("Dependencias rotas. Procediendo a borrar...");
  
  // Paso 2: Delete
  for (let i = 0; i < idsToDelete.length; i += batchSize) {
    const batch = idsToDelete.slice(i, i + batchSize);
    await supabase.from('catalogo_partidas').delete().in('id', batch);
    process.stdout.write(`\rBorrados ${Math.min(i + batchSize, idsToDelete.length)} / ${idsToDelete.length}`);
  }
  
  console.log("\n¡Base de datos 100% limpia!");
}

wipeClean();
