const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://smnhkhceihcbagecqlth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbmhraGNlaWhjYmFnZWNxbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTMyODIsImV4cCI6MjA5MTcyOTI4Mn0.a9dTHFVjBDPF9nBn3uECGQgSsNHgwaRYFSL_la9Y85Y'
);

async function checkEspecialidades() {
  console.log("Evaluando especialidades reales en la base de datos...");
  
  const { count: total } = await supabase.from('catalogo_partidas').select('*', { count: 'exact', head: true });
  
  let allItems = [];
  let page = 0;
  while(true) {
    const { data } = await supabase.from('catalogo_partidas').select('especialidad').range(page*1000, (page+1)*1000-1);
    if (!data || data.length === 0) break;
    allItems.push(...data);
    page++;
  }
  
  let conteo = {};
  allItems.forEach(item => {
    let esp = item.especialidad || 'NULL (Vacío)';
    conteo[esp] = (conteo[esp] || 0) + 1;
  });
  
  console.log(`\n--- REPORTE EXACTO DE ESPECIALIDADES ---`);
  console.log(`Total de partidas auditadas: ${allItems.length} de ${total}`);
  
  console.log(`\nDesglose por especialidad (De mayor a menor):`);
  let nulls = 0;
  let general = 0;
  
  Object.keys(conteo).sort((a,b) => conteo[b] - conteo[a]).forEach(k => {
    console.log(`- ${k}: ${conteo[k]} partidas`);
    if (k === 'NULL (Vacío)') nulls = conteo[k];
    if (k === 'GENERAL') general = conteo[k];
  });
  
  console.log(`\nResumen Crítico:`);
  console.log(`* Partidas sin especialidad (NULL): ${nulls}`);
  console.log(`* Partidas con etiqueta 'GENERAL': ${general}`);
}

checkEspecialidades();
