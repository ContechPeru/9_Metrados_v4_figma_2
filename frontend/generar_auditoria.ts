import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';

const supabaseUrl = 'https://ltmxbfdlnaelharzkuyd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bXhiZmRsbmFlbGhhcnprdXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNTQ4MzAsImV4cCI6MjA5OTYzMDgzMH0.D32wHC7DK4aSPtu-c-9zpSyBTIQvPezXPH0okPh13wQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Fetching data...');
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('registro_metrados')
      .select(`
        id, fecha_ejecucion, especialidad, frente_trabajo, ambiente, bloque_sector,
        nivel_piso, cuadrilla, elemento_desc, detalle_desc,
        snapshot_codigo, snapshot_descripcion,
        cantidad_elementos, medida_largo_area, medida_ancho_empalme, medida_alto_gancho,
        resultado_parcial, nro_repeticiones, acero_diametro, resultado_total,
        unidad, plano_sist, plano_num, sin_plano, obs_motivo, obs_detalle, firma_ingeniero,
        catalogo_partidas ( modificacion )
      `)
      .range(page * 1000, (page + 1) * 1000 - 1);

    if (error) {
      console.error('Error fetching:', error);
      process.exit(1);
    }

    if (data && data.length > 0) {
      allData = allData.concat(data);
      page++;
      console.log(`Fetched page ${page}, total records so far: ${allData.length}`);
    } else {
      hasMore = false;
    }
  }

  console.log(`Finished fetching. Total records: ${allData.length}. Filtering for May-Nov...`);
  
  const filtered = allData.filter(r => {
    if (!r.fecha_ejecucion) return false;
    const [, monthStr] = r.fecha_ejecucion.split('-');
    const month = parseInt(monthStr, 10);
    return month >= 5 && month <= 11;
  });

  console.log(`Filtered down to ${filtered.length} records.`);

  filtered.sort((a, b) => {
    const d = new Date(b.fecha_ejecucion).getTime() - new Date(a.fecha_ejecucion).getTime();
    if (d !== 0) return d;
    return (a.firma_ingeniero || '').localeCompare(b.firma_ingeniero || '');
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Auditoria_Metrados');

  ws.columns = [
    { header: 'Fecha', key: 'fecha_ejecucion', width: 12 },
    { header: 'Autor', key: 'firma_ingeniero', width: 25 },
    { header: 'Especialidad', key: 'especialidad', width: 20 },
    { header: 'Frente', key: 'frente_trabajo', width: 20 },
    { header: 'Bloque', key: 'bloque_sector', width: 15 },
    { header: 'Nivel', key: 'nivel_piso', width: 15 },
    { header: 'Cuadrilla', key: 'cuadrilla', width: 25 },
    { header: 'Código', key: 'snapshot_codigo', width: 15 },
    { header: 'Descripción Partida', key: 'snapshot_descripcion', width: 40 },
    { header: 'Elemento', key: 'elemento_desc', width: 25 },
    { header: 'Detalle', key: 'detalle_desc', width: 25 },
    { header: 'Unidad', key: 'unidad', width: 10 },
    { header: 'Cant.', key: 'cantidad_elementos', width: 10 },
    { header: 'Largo', key: 'medida_largo_area', width: 10 },
    { header: 'Ancho', key: 'medida_ancho_empalme', width: 10 },
    { header: 'Alto', key: 'medida_alto_gancho', width: 10 },
    { header: 'Parcial', key: 'resultado_parcial', width: 12 },
    { header: 'Veces', key: 'nro_repeticiones', width: 10 },
    { header: 'Total', key: 'resultado_total', width: 12 },
    { header: 'Mod.', key: 'modificacion', width: 10 }
  ];

  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };

  filtered.forEach(r => {
    ws.addRow({
      fecha_ejecucion: r.fecha_ejecucion,
      firma_ingeniero: r.firma_ingeniero,
      especialidad: r.especialidad,
      frente_trabajo: r.frente_trabajo,
      bloque_sector: r.bloque_sector,
      nivel_piso: r.nivel_piso,
      cuadrilla: r.cuadrilla,
      snapshot_codigo: r.snapshot_codigo,
      snapshot_descripcion: r.snapshot_descripcion,
      elemento_desc: r.elemento_desc,
      detalle_desc: r.detalle_desc,
      unidad: r.unidad,
      cantidad_elementos: r.cantidad_elementos,
      medida_largo_area: r.medida_largo_area,
      medida_ancho_empalme: r.medida_ancho_empalme,
      medida_alto_gancho: r.medida_alto_gancho,
      resultado_parcial: r.resultado_parcial,
      nro_repeticiones: r.nro_repeticiones,
      resultado_total: r.resultado_total,
      modificacion: r.catalogo_partidas?.modificacion || ''
    });
  });

  const path = 'C:\\Users\\Legion\\Desktop\\Auditoria_Metrados_Mayo_Noviembre_Completo.xlsx';
  await wb.xlsx.writeFile(path);
  console.log(`Saved to ${path}`);
  process.exit(0);
}

main();
