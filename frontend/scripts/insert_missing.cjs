const { createClient } = require('@supabase/supabase-js');
const xlsx = require('xlsx');

const supabaseUrl = 'https://cdzjhmukuxklwrxvynau.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkempobXVrdXhrbHdyeHZ5bmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MTY0MDQsImV4cCI6MjA5ODM5MjQwNH0.gZaXs2Xuapc1Wmk8xQdxId2snzGWbXuIiRQRJhRLf8s';
const supabase = createClient(supabaseUrl, supabaseKey);

const filePath = 'C:\\\\Users\\\\Legion\\\\Downloads\\\\Valorizaciones - Acum. Junio 2026 - Jorge sin deductivos.xlsx';

async function main() {
  const workbook = xlsx.readFile(filePath);
  const sheetName = 'Compilado de modificaciones';
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  const excelPartidas = new Map();
  for (let r = 5; r < jsonData.length; r++) {
    const row = jsonData[r];
    if (!row) continue;
    const item = row[0];
    const desc = row[1];
    let und = row[2];
    let mod = row[59];
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

  const { data: espData } = await supabase.from('especialidades').select('nombre').limit(1);
  const validEspecialidad = espData[0].nombre;

  const toAddCodes = ['OE.1.1', 'OE.1.1.1'];
  
  const { data: proys } = await supabase.from('proyectos').select('id').limit(1);
  const defaultProyectoId = proys[0].id;

  for (const code of toAddCodes) {
    const p = excelPartidas.get(code);
    if (!p) continue;
    
    const parts = p.codigo_expediente.split('.');
    let parentId = null;
    if (parts.length > 1) {
        const parentCode = parts.slice(0, -1).join('.');
        const { data: pData } = await supabase.from('catalogo_partidas').select('id').eq('codigo_expediente', parentCode).limit(1);
        if (pData && pData.length > 0) parentId = pData[0].id;
    }
    
    const newPartida = {
        codigo_expediente: p.codigo_expediente,
        descripcion: p.descripcion,
        unidad_medida: p.unidad_medida,
        es_agrupador: p.unidad_medida ? false : true,
        nivel_arbol: parts.length,
        parent_id: parentId,
        ruta_jerarquica: [], 
        modificacion: p.modificacion,
        proyecto_id: defaultProyectoId,
        especialidad: validEspecialidad,
        se_valoriza: true,
        es_adicional: false,
        precio_unitario_base: 0
    };
    
    console.log("Inserting:", newPartida.codigo_expediente);
    const { error } = await supabase.from('catalogo_partidas').insert([newPartida]);
    if (error) {
       console.error("Error inserting:", error);
    } else {
       console.log("Success");
    }
  }
}
main();
