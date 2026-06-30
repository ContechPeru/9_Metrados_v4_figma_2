const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://smnhkhceihcbagecqlth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbmhraGNlaWhjYmFnZWNxbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTMyODIsImV4cCI6MjA5MTcyOTI4Mn0.a9dTHFVjBDPF9nBn3uECGQgSsNHgwaRYFSL_la9Y85Y'
);

async function cleanGhosts() {
  console.log("Nullifying ALL parent_ids in the entire table to break ALL links...");
  // Solo nullificar parent_id no hace daño a los datos base
  let page = 0;
  while(true) {
    const { data } = await supabase.from('catalogo_partidas').select('id').range(page*1000, (page+1)*1000-1);
    if (!data || data.length === 0) break;
    const batch = data.map(d => d.id);
    await supabase.from('catalogo_partidas').update({ parent_id: null }).in('id', batch);
    page++;
  }
  
  console.log("Buscando fantasmas viejos...");
  const { data: ghosts } = await supabase
    .from('catalogo_partidas')
    .select('id')
    .not('codigo_expediente', 'ilike', 'PC-%')
    .not('codigo_expediente', 'ilike', 'ACT.%')
    .is('modificacion', null); // The new ones HAVE modificacion explicitly set to a string or null... wait! The old ones also had null if they didn't have one.

  // The new ones were just inserted 5 minutes ago.
  // The old ones have no created_at.
  // How to identify them?
  // The new ones have 'ESTANDAR' and 'OFICIAL'.
  // We can group by codigo_expediente, and if there are duplicates, delete the one with lower ID or something?
  // UUIDs are random, so no "lower" ID.
  
  // Let's just wipe ALL OF THEM AGAIN except PC and ACT, and then RE-INSERT ONLY ONCE.
  console.log("Wiping EVERYTHING again except PC/ACT...");
  page = 0;
  let allToDelete = [];
  while(true) {
    const { data } = await supabase.from('catalogo_partidas').select('id, codigo_expediente').range(page*1000, (page+1)*1000-1);
    if (!data || data.length === 0) break;
    const toDelete = data.filter(d => !d.codigo_expediente.startsWith('PC-') && !d.codigo_expediente.startsWith('ACT.'));
    allToDelete.push(...toDelete.map(d => d.id));
    page++;
  }
  
  for(let i=0; i<allToDelete.length; i+=500) {
    const batch = allToDelete.slice(i, i+500);
    await supabase.from('catalogo_partidas').delete().in('id', batch);
  }
  
  console.log("Wiped. Total left in DB (should be ~160 PC/ACT):");
  const { count } = await supabase.from('catalogo_partidas').select('*', { count: 'exact', head: true });
  console.log(count);
}

cleanGhosts();
