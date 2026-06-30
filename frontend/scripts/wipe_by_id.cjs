const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://smnhkhceihcbagecqlth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbmhraGNlaWhjYmFnZWNxbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTMyODIsImV4cCI6MjA5MTcyOTI4Mn0.a9dTHFVjBDPF9nBn3uECGQgSsNHgwaRYFSL_la9Y85Y'
);

async function wipeAndClean() {
  console.log("Obteniendo todas las partidas a borrar...");
  let idsToDelete = [];
  let page = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('catalogo_partidas')
      .select('id, codigo_expediente')
      .range(page * 1000, (page + 1) * 1000 - 1);
      
    if (error) {
      console.error(error);
      break;
    }
    if (data.length === 0) break;
    
    // Filtramos localmente para evitar problemas de timeout y sintaxis en la BD
    const toDelete = data.filter(d => {
      const cod = d.codigo_expediente.toUpperCase();
      return !cod.startsWith('PC-') && !cod.startsWith('ACT.');
    });
    
    idsToDelete.push(...toDelete.map(d => d.id));
    page++;
  }
  
  console.log(`Borrando ${idsToDelete.length} partidas oficiales (incluyendo las recién insertadas y las antiguas)...`);
  
  const batchSize = 100;
  for (let i = 0; i < idsToDelete.length; i += batchSize) {
    const batch = idsToDelete.slice(i, i + batchSize);
    const { error } = await supabase
      .from('catalogo_partidas')
      .delete()
      .in('id', batch);
      
    if (error) {
      console.error(`Error borrando lote ${i}:`, error.message);
    }
    process.stdout.write(`\rBorrados ${Math.min(i + batchSize, idsToDelete.length)} / ${idsToDelete.length}`);
  }
  
  console.log("\n¡Base de datos limpia de duplicados!");
}

wipeAndClean();
