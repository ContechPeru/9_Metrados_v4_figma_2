const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

const supabase = createClient(
  'https://smnhkhceihcbagecqlth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbmhraGNlaWhjYmFnZWNxbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTMyODIsImV4cCI6MjA5MTcyOTI4Mn0.a9dTHFVjBDPF9nBn3uECGQgSsNHgwaRYFSL_la9Y85Y'
);

function getEspecialidad(codigo) {
  if (!codigo) return 'GENERAL';
  if (codigo.startsWith('OE.1.1')) return 'OBRAS PROVISIONALES';
  if (codigo.startsWith('OE.1.2')) return 'SEGURIDAD';
  if (codigo.startsWith('OE.1.3') || codigo.startsWith('OE.1.4') || codigo.startsWith('OE.1.5') || codigo.startsWith('OE.1.6')) return 'ARQUEOLOGÍA';
  if (codigo.startsWith('OE.2')) return 'ESTRUCTURAS';
  if (codigo.startsWith('OE.3')) return 'ARQUITECTURA';
  if (codigo.startsWith('OE.4')) return 'INSTALACIONES SANITARIAS';
  if (codigo.startsWith('OE.5.1') || codigo.startsWith('OE.5.2') || codigo.startsWith('OE.5.3') || codigo.startsWith('OE.5.4') || codigo.startsWith('OE.5.5')) return 'ELÉCTRICAS';
  if (codigo.startsWith('OE.5.6') || codigo.startsWith('OE.5.7') || codigo.startsWith('OE.7')) return 'ELECTROMECÁNICAS';
  if (codigo.startsWith('OE.6')) return 'COMUNICACIONES';
  if (codigo.startsWith('OE.8')) return 'PLAN DE MANEJO AMBIENTAL';
  if (codigo.startsWith('OE.9')) return 'EQUIPAMIENTO BIOMÉDICO';
  return 'GENERAL';
}

async function runMigration() {
  console.log("Iniciando inyección (fase 2)...");

  // 1. Obtener proyecto_id
  const { data: proys } = await supabase.from('proyectos').select('id').limit(1);
  const proyectoId = proys[0].id;

  // 2. Leer Excel
  const filePath = 'C:\\Users\\Legion\\Downloads\\CORREGIDO_HOSPI.xlsx';
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  let newPartidas = [];
  
  for (let i = 4; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0 || !row[0]) continue;
    
    const codigo = String(row[0]).trim();
    if (!codigo.startsWith('OE.')) continue;
    
    const descripcion = row[1] ? String(row[1]).trim() : '';
    const unidad = row[2] ? String(row[2]).trim() : '';
    const metradoPresupuestado = parseFloat(row[3]) || 0;
    const precioUnitario = parseFloat(row[4]) || 0;
    const metradoProgramado = parseFloat(row[5]) || 0;
    const modificacion = row[6] ? String(row[6]).trim() : null;
    const metradoEjecutado = parseFloat(row[7]) || 0;
    
    const esAgrupador = (!unidad || unidad === '-' || unidad === '');
    const especialidad = getEspecialidad(codigo);

    newPartidas.push({
      proyecto_id: proyectoId,
      codigo_expediente: codigo,
      descripcion: descripcion,
      unidad_medida: esAgrupador ? null : unidad,
      es_agrupador: esAgrupador,
      especialidad: especialidad,
      tipo_calculo: 'ESTANDAR',
      precio_unitario_base: precioUnitario,
      cantidad_presupuestada: metradoPresupuestado,
      metrado_programado: metradoProgramado,
      modificacion: modificacion,
      metrado_anterior_acumulado: metradoEjecutado,
      origen: 'OFICIAL',
      estado_activo: true,
      se_valoriza: true,
      es_adicional: false
    });
  }

  console.log(`Excel procesado. ${newPartidas.length} partidas listas para insertar.`);

  // La eliminación ya se hizo en el otro script.

  // 5. Insertar nuevas
  console.log("Insertando nuevas partidas por lotes...");
  const batchSize = 500;
  for (let i = 0; i < newPartidas.length; i += batchSize) {
    const batch = newPartidas.slice(i, i + batchSize);
    const { error: errInsert } = await supabase.from('catalogo_partidas').insert(batch);
    if (errInsert) {
      console.error(`Error en lote ${i}:`, errInsert.message || errInsert);
    }
    process.stdout.write(`\rInsertadas ${Math.min(i + batchSize, newPartidas.length)} / ${newPartidas.length}`);
  }

  console.log("\n¡Migración Completada Exitosamente!");
}

runMigration();
