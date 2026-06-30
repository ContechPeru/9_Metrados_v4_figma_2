const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://smnhkhceihcbagecqlth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbmhraGNlaWhjYmFnZWNxbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTMyODIsImV4cCI6MjA5MTcyOTI4Mn0.a9dTHFVjBDPF9nBn3uECGQgSsNHgwaRYFSL_la9Y85Y'
);

async function main() {
  console.log("Iniciando actualización de especialidades...");

  // 1. Delete the wrong specialty if it exists
  const wrongName = "INSTALACIONES ELÉCTRICAS Y MECÁNICAS";
  console.log(`Buscando especialidad a eliminar: ${wrongName}`);
  const { data: delData, error: delError } = await supabase
    .from('especialidades')
    .delete()
    .eq('nombre', wrongName);
  
  if (delError) {
    console.log(`No se pudo eliminar o no existe: ${wrongName}`);
  } else {
    console.log(`Especialidad ${wrongName} procesada para eliminación.`);
  }

  // 2. Fetch all especialidades
  const { data: especialidades, error: espError } = await supabase
    .from('especialidades')
    .select('nombre, codigo_prefijos');

  if (espError) {
    console.error("Error al obtener especialidades:", espError);
    return;
  }

  // Filter out general ones or ones without prefixes
  const validEspecialidades = especialidades.filter(e => 
    e.nombre !== 'GENERAL' && e.nombre !== 'TODAS' && e.codigo_prefijos && e.codigo_prefijos.length > 0
  );

  // We want to sort them so more specific prefixes match first (e.g. OE.1.1 before OE.1)
  // Actually, wait, ARQUEOLOGIA has OE.1.3, OE.1.4, OE.1.5, OE.1.6
  // OBRAS PROVISIONALES has OE.1.1
  // SEGURIDAD has OE.1.2
  // But wait, there is no OE.1 in the list, just the specific ones!
  // Wait, ESTRUCTURAS is OE.2
  // ARQUITECTURA is OE.3
  
  // 3. Fetch all partidas
  console.log("Obteniendo partidas...");
  
  let allPartidas = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('catalogo_partidas')
      .select('id, codigo_expediente')
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (error) {
      console.error("Error fetching partidas:", error);
      break;
    }
    
    if (data.length === 0) break;
    
    allPartidas.push(...data);
    page++;
  }
  
  console.log(`Total partidas a evaluar: ${allPartidas.length}`);

  // 4. Match and update
  let updates = [];

  for (const partida of allPartidas) {
    if (!partida.codigo_expediente) continue;
    
    let matchedNombre = null;
    let maxPrefixLength = -1; // To ensure we match the most specific prefix
    
    for (const esp of validEspecialidades) {
      for (const prefix of esp.codigo_prefijos) {
        // Safe check: matches exactly OR starts with prefix + '.'
        if (partida.codigo_expediente === prefix || partida.codigo_expediente.startsWith(prefix + '.')) {
          if (prefix.length > maxPrefixLength) {
            maxPrefixLength = prefix.length;
            matchedNombre = esp.nombre;
          }
        }
      }
    }

    if (matchedNombre) {
      updates.push({
        id: partida.id,
        especialidad: matchedNombre
      });
    }
  }

  console.log(`Partidas que encontraron coincidencia: ${updates.length}`);
  
  // 5. Perform batched updates
  // Supabase 'update' only updates one by one or using 'upsert'.
  // Since we have an array of objects with id, we can use upsert if we select only id and especialidad.
  // But upsert requires all NOT NULL columns.
  // Instead, we can execute an RPC or just update in batches of promises.
  
  console.log("Aplicando actualizaciones en la BD...");
  
  const batchSize = 100;
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
  
  console.log("\n¡Proceso finalizado con éxito!");
}

main();
