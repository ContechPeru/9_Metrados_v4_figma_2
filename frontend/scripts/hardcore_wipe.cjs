const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://smnhkhceihcbagecqlth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbmhraGNlaWhjYmFnZWNxbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTMyODIsImV4cCI6MjA5MTcyOTI4Mn0.a9dTHFVjBDPF9nBn3uECGQgSsNHgwaRYFSL_la9Y85Y'
);

async function hardcoreWipe() {
  console.log("Hardcore wipe...");
  let deletedCount = 0;
  
  while(true) {
    const { data } = await supabase
      .from('catalogo_partidas')
      .select('id, codigo_expediente')
      .limit(1000);
      
    if (!data || data.length === 0) break;
    
    const toDelete = data.filter(d => !d.codigo_expediente.toUpperCase().startsWith('PC-') && !d.codigo_expediente.toUpperCase().startsWith('ACT.'));
    
    if (toDelete.length === 0) {
      console.log("No more OE items to delete!");
      break;
    }
    
    // Delete one by one or in small batches of 50 to avoid timeout
    const batch = toDelete.map(d => d.id).slice(0, 50);
    const { error } = await supabase.from('catalogo_partidas').delete().in('id', batch);
    if (error) {
      console.error("Delete error:", error);
    } else {
      deletedCount += batch.length;
      process.stdout.write(`\rDeleted so far: ${deletedCount}`);
    }
  }
  
  const { count } = await supabase.from('catalogo_partidas').select('*', { count: 'exact', head: true });
  console.log(`\nWipe done. DB has ${count} items.`);
}

hardcoreWipe();
