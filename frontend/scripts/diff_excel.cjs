const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cdzjhmukuxklwrxvynau.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkempobXVrdXhrbHdyeHZ5bmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MTY0MDQsImV4cCI6MjA5ODM5MjQwNH0.gZaXs2Xuapc1Wmk8xQdxId2snzGWbXuIiRQRJhRLf8s';
const supabase = createClient(supabaseUrl, supabaseKey);

const filePath = 'C:\\\\Users\\\\Legion\\\\Downloads\\\\Valorizaciones - Acum. Junio 2026 - Jorge sin deductivos.xlsx';

async function main() {
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
  // Start from row 5 because 0-4 are headers
  for (let r = 5; r < jsonData.length; r++) {
    const row = jsonData[r];
    if (!row) continue;
    const item = row[0]; // ITEM
    const desc = row[1]; // DESCRIPCIÓN
    const und = row[2];  // UNID.
    const mod = row[59]; // Modificación (BH)
    const qty = row[21]; // Expediente Tecnico Cantidad (Col V / 21) based on previous headers, let's just grab the basic ones
    
    if (item && typeof item === 'string' && item.trim() !== '') {
      excelPartidas.set(item.trim(), { item: item.trim(), desc, und, mod });
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
      .select('id, codigo_expediente, descripcion, modificacion')
      .range(page * size, (page + 1) * size - 1);
    
    if (error) {
      console.error(error);
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

  // 3. Compare
  const toDelete = [];
  const toKeep = [];
  
  for (const dbP of dbPartidas) {
    if (!excelPartidas.has(dbP.codigo_expediente)) {
      toDelete.push(dbP);
    } else {
      toKeep.push(dbP);
    }
  }

  const toAdd = [];
  const dbCodes = new Set(dbPartidas.map(p => p.codigo_expediente));
  for (const [code, val] of excelPartidas.entries()) {
    if (!dbCodes.has(code)) {
      toAdd.push(val);
    }
  }

  console.log(`--- SUMMARY ---`);
  console.log(`To Delete (in DB, not in Excel): ${toDelete.length}`);
  console.log(`To Add (in Excel, not in DB): ${toAdd.length}`);
  
  // 4. Check if toDelete have metrados
  let deletableWithoutMetrados = 0;
  let notDeletableHasMetrados = 0;
  
  // Chunking the checks to avoid large queries if possible, or just querying one by one for report
  for (const p of toDelete) {
      const { count } = await supabase.from('registro_metrados').select('*', { count: 'exact', head: true }).eq('partida_id', p.id);
      if (count === 0) {
          deletableWithoutMetrados++;
      } else {
          notDeletableHasMetrados++;
      }
  }
  
  console.log(`Out of ${toDelete.length} to delete:`);
  console.log(`- ${deletableWithoutMetrados} have NO metrados (Safe to delete)`);
  console.log(`- ${notDeletableHasMetrados} HAVE metrados (Cannot be deleted)`);
  
  if (toAdd.length > 0) {
      console.log(`Sample to Add:`, toAdd.slice(0, 5));
  }
}

main();
