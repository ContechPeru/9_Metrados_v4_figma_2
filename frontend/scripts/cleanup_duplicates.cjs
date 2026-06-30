const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://smnhkhceihcbagecqlth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbmhraGNlaWhjYmFnZWNxbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTMyODIsImV4cCI6MjA5MTcyOTI4Mn0.a9dTHFVjBDPF9nBn3uECGQgSsNHgwaRYFSL_la9Y85Y'
);

async function cleanupDuplicates() {
  console.log("Limpiando partidas antiguas debido al timeout previo...");
  
  // Get all old items (created before 10 minutes ago)
  // Let's just fetch all IDs to delete in batches
  let oldIds = [];
  let page = 0;
  
  // Set threshold to 5 minutes ago
  const threshold = new Date(Date.now() - 5 * 60000).toISOString();
  
  while (true) {
    const { data, error } = await supabase
      .from('catalogo_partidas')
      .select('id')
      .lt('created_at', threshold)
      .not('codigo_expediente', 'ilike', 'PC-%')
      .not('codigo_expediente', 'ilike', 'ACT.%')
      .range(page * 1000, (page + 1) * 1000 - 1);
      
    if (error) {
      console.error(error);
      break;
    }
    if (data.length === 0) break;
    oldIds.push(...data.map(d => d.id));
    page++;
  }
  
  console.log(`Se encontraron ${oldIds.length} partidas antiguas para borrar.`);
  
  // Delete in batches of 100 to avoid timeout
  const batchSize = 100;
  for (let i = 0; i < oldIds.length; i += batchSize) {
    const batch = oldIds.slice(i, i + batchSize);
    const { error } = await supabase
      .from('catalogo_partidas')
      .delete()
      .in('id', batch);
      
    if (error) {
      console.error(`Error borrando lote ${i}:`, error.message);
    }
    process.stdout.write(`\rBorrados ${Math.min(i + batchSize, oldIds.length)} / ${oldIds.length}`);
  }
  
  console.log("\n¡Limpieza de duplicados antigua terminada!");
}

cleanupDuplicates();
