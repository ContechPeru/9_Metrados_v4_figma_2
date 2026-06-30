const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://smnhkhceihcbagecqlth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbmhraGNlaWhjYmFnZWNxbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTMyODIsImV4cCI6MjA5MTcyOTI4Mn0.a9dTHFVjBDPF9nBn3uECGQgSsNHgwaRYFSL_la9Y85Y'
);

async function check() {
  console.log("Extrayendo todas las partidas PC...");
  let allPCs = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from('catalogo_partidas')
      .select('codigo_expediente, descripcion, especialidad')
      .ilike('codigo_expediente', 'PC-%')
      .range(page * 1000, (page + 1) * 1000 - 1);
    
    if (error) {
      console.error(error);
      break;
    }
    if (data.length === 0) break;
    allPCs.push(...data);
    page++;
  }
  
  console.log("Total PC items:", allPCs.length);
  
  // Get unique prefixes
  const prefixes = {};
  allPCs.forEach(p => {
    // Assuming format PC-XXX-1234
    const parts = p.codigo_expediente.split('-');
    if (parts.length >= 2) {
      const prefix = parts[0] + '-' + parts[1];
      if (!prefixes[prefix]) prefixes[prefix] = [];
      prefixes[prefix].push(p);
    }
  });

  for (const [prefix, items] of Object.entries(prefixes)) {
    console.log(`\nPrefix: ${prefix} (${items.length} items)`);
    console.log(`Example 1: ${items[0].codigo_expediente} - ${items[0].descripcion}`);
    if (items.length > 1) {
      console.log(`Example 2: ${items[1].codigo_expediente} - ${items[1].descripcion}`);
    }
  }
}

check();
