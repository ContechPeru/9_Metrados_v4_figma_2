const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://cdzjhmukuxklwrxvynau.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkempobXVrdXhrbHdyeHZ5bmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MTY0MDQsImV4cCI6MjA5ODM5MjQwNH0.gZaXs2Xuapc1Wmk8xQdxId2snzGWbXuIiRQRJhRLf8s';
const supabase = createClient(supabaseUrl, supabaseKey);

const filePath = 'C:\\\\Users\\\\Legion\\\\Downloads\\\\Valorizaciones - Acum. Junio 2026 - Jorge sin deductivos.xlsx';

async function main() {
  console.log("Reading Excel file...");
  const workbook = xlsx.readFile(filePath);
  const sheetName = 'Compilado de modificaciones';
  if (!workbook.Sheets[sheetName]) {
    console.error(`Sheet "${sheetName}" not found.`);
    process.exit(1);
  }

  const worksheet = workbook.Sheets[sheetName];
  const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  // 1. Parse Excel Partidas
  const excelPartidas = new Map();
  for (let r = 5; r < jsonData.length; r++) {
    const row = jsonData[r];
    if (!row) continue;
    const item = row[0]; // ITEM
    const desc = row[1]; // DESCRIPCIÓN
    let und = row[2];  // UNID.
    let mod = row[59]; // Modificación (BH)
    
    if (item && typeof item === 'string' && item.trim() !== '') {
      const code = item.trim();
      excelPartidas.set(code, { 
        codigo_expediente: code, 
        descripcion: desc ? String(desc).trim() : '', 
        unidad_medida: (und && String(und).trim() !== '') ? String(und).trim() : null, 
        modificacion: (mod && String(mod).trim() !== '') ? String(mod).trim() : null
      });
    }
  }
  console.log(`Parsed ${excelPartidas.size} partidas from Excel.`);

  // 2. Fetch DB Partidas
  let dbPartidas = [];
  let page = 0;
  const size = 1000;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase
      .from('catalogo_partidas')
      .select('*')
      .range(page * size, (page + 1) * size - 1);
    
    if (error) {
      console.error("Error fetching DB:", error);
      return;
    }
    
    if (data && data.length > 0) {
      dbPartidas.push(...data);
      page++;
      if (data.length < size) hasMore = false;
    } else {
      hasMore = false;
    }
  }
  console.log(`Fetched ${dbPartidas.length} partidas from DB.`);

  // 3. Delete logic
  const toDelete = dbPartidas.filter(dbP => !excelPartidas.has(dbP.codigo_expediente));
  console.log(`Identified ${toDelete.length} partidas to potentially delete.`);
  
  let deletedCount = 0;
  let skippedCount = 0;

  for (const p of toDelete) {
      // check metrados
      const { count, error } = await supabase.from('registro_metrados').select('*', { count: 'exact', head: true }).eq('partida_id', p.id);
      if (error) {
          console.error(`Error checking metrados for ${p.codigo_expediente}:`, error);
          continue;
      }
      if (count === 0) {
          // safe to delete
          const { error: delError } = await supabase.from('catalogo_partidas').delete().eq('id', p.id);
          if (delError) {
              console.error(`Failed to delete ${p.codigo_expediente}:`, delError);
          } else {
              deletedCount++;
          }
      } else {
          skippedCount++;
      }
  }
  console.log(`DELETIONS: Deleted ${deletedCount} successfully. Skipped ${skippedCount} because they have metrados.`);

  // 4. Update Modificacion for existing
  const toUpdate = [];
  const dbPartidasMap = new Map();
  dbPartidas.forEach(p => dbPartidasMap.set(p.codigo_expediente, p));

  for (const [code, excelData] of excelPartidas.entries()) {
    const dbP = dbPartidasMap.get(code);
    if (dbP) {
      // Check if modificacion differs
      const excelMod = excelData.modificacion;
      const dbMod = dbP.modificacion;
      if (excelMod !== dbMod) {
         toUpdate.push({ id: dbP.id, modificacion: excelMod });
      }
    }
  }

  console.log(`Identified ${toUpdate.length} partidas to UPDATE their 'modificacion' field.`);
  let updatedCount = 0;
  // Batch update 1 by 1 for safety
  for (const updateObj of toUpdate) {
      const { error } = await supabase.from('catalogo_partidas').update({ modificacion: updateObj.modificacion }).eq('id', updateObj.id);
      if (!error) updatedCount++;
  }
  console.log(`UPDATES: Successfully updated ${updatedCount} partidas.`);

  // 5. Insert Missing Partidas
  const toAdd = [];
  for (const [code, val] of excelPartidas.entries()) {
    if (!dbPartidasMap.has(code)) {
      toAdd.push(val);
    }
  }
  
  console.log(`Identified ${toAdd.length} missing partidas to INSERT.`);
  
  // We need a proyecto_id. Let's fetch the first one.
  const { data: proys } = await supabase.from('proyectos').select('id, nombre').limit(1);
  const defaultProyectoId = proys && proys.length > 0 ? proys[0].id : null;

  if (toAdd.length > 0 && defaultProyectoId) {
      let insertedCount = 0;
      for (const p of toAdd) {
          // Infer hierarchical info
          const parts = p.codigo_expediente.split('.');
          const nivelArbol = parts.length;
          const isAgrupador = p.unidad_medida ? false : true;
          
          let parentId = null;
          if (parts.length > 1) {
              const parentCode = parts.slice(0, -1).join('.');
              // Find parent in DB
              const { data: pData } = await supabase.from('catalogo_partidas').select('id').eq('codigo_expediente', parentCode).limit(1);
              if (pData && pData.length > 0) {
                  parentId = pData[0].id;
              }
          }
          
          // Especialidad inference
          let especialidad = 'Generales';
          if (p.codigo_expediente.startsWith('OE.4')) especialidad = 'Instalaciones Sanitarias';
          if (p.codigo_expediente.startsWith('OE.2')) especialidad = 'Arquitectura';
          if (p.codigo_expediente.startsWith('OE.3')) especialidad = 'Estructuras';
          if (p.codigo_expediente.startsWith('OE.5')) especialidad = 'Instalaciones Eléctricas';
          if (p.codigo_expediente.startsWith('OE.6')) especialidad = 'Instalaciones Electromecánicas';

          const newPartida = {
              codigo_expediente: p.codigo_expediente,
              descripcion: p.descripcion,
              unidad_medida: p.unidad_medida,
              es_agrupador: isAgrupador,
              nivel_arbol: nivelArbol,
              parent_id: parentId,
              ruta_jerarquica: [], // Ideally we fetch parent's ruta + id, but empty array is ok fallback
              modificacion: p.modificacion,
              proyecto_id: defaultProyectoId,
              especialidad: especialidad,
              se_valoriza: true,
              es_adicional: false,
              precio_unitario_base: 0
          };
          
          const { error: insErr } = await supabase.from('catalogo_partidas').insert([newPartida]);
          if (!insErr) {
              insertedCount++;
          } else {
              console.error(`Failed to insert ${p.codigo_expediente}:`, insErr);
          }
      }
      console.log(`INSERTS: Successfully inserted ${insertedCount} missing partidas.`);
  }

  console.log("Process complete.");
  fs.writeFileSync('sync_report.txt', `Sincronización completada.
Eliminadas: ${deletedCount}
Omitidas por tener metrados: ${skippedCount}
Actualizadas (Modificaciones): ${updatedCount}
Nuevas Insertadas: ${toAdd.length}`);
}

main();
