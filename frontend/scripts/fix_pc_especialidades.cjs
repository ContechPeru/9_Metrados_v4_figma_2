const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://smnhkhceihcbagecqlth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbmhraGNlaWhjYmFnZWNxbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTMyODIsImV4cCI6MjA5MTcyOTI4Mn0.a9dTHFVjBDPF9nBn3uECGQgSsNHgwaRYFSL_la9Y85Y'
);

async function fixPC() {
  console.log("Obteniendo partidas PC para asignar especialidad...");
  
  let allPCs = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from('catalogo_partidas')
      .select('id, codigo_expediente, especialidad, descripcion')
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
  
  console.log(`Total partidas PC a actualizar: ${allPCs.length}`);
  
  const prefixMap = {
    'PC-INS': 'INSTALACIONES SANITARIAS',
    'PC-COM': 'COMUNICACIONES',
    'PC-OP': 'OBRAS PROVISIONALES',
    'PC-EST': 'ESTRUCTURAS',
    'PC-ARQ': 'ARQUITECTURA',
    'PC-GEN': 'ARQUEOLOGÍA' // They have "LIMPIEZA DE HALLAZGOS ARQUEOLOGICOS"
  };

  let updates = [];

  for (const p of allPCs) {
    const parts = p.codigo_expediente.split('-');
    if (parts.length >= 2) {
      const prefix = parts[0] + '-' + parts[1];
      const assigned = prefixMap[prefix];
      if (assigned) {
        updates.push({ id: p.id, especialidad: assigned, codigo: p.codigo_expediente });
      }
    }
  }

  console.log(`Asignaciones listas: ${updates.length}`);

  // Batch update
  const batchSize = 50;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    const promises = batch.map(u => 
      supabase
        .from('catalogo_partidas')
        .update({ especialidad: u.especialidad })
        .eq('id', u.id)
    );
    
    await Promise.all(promises);
    process.stdout.write(`\rActualizadas ${Math.min(i + batchSize, updates.length)} / ${updates.length}`);
  }
  
  console.log("\n¡Asignación de especialidades a PC finalizada con éxito!");
}

fixPC();
