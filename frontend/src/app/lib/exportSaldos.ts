import * as ExcelJS from 'exceljs';
import { useMetradosStore } from '../store/useMetradosStore';
import type { FiltrosExport } from './export1';

const C = {
  HDR_BG: 'FF1E3A5F',
  HDR_FG: 'FFFFFFFF',
  ROW_EVEN: 'FFF8FAFC',
  ROW_ODD: 'FFFFFFFF',
  MAYOR_METRADO_BG: 'FFFFEBEB',
  MAYOR_METRADO_FG: 'FF990000',
  BORDER_CLR: 'FFCBD5E1',
};

const fill = (argb: string): ExcelJS.Fill =>
  ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

const fnt = (argb: string, sz: number, bold = false): Partial<ExcelJS.Font> =>
  ({ name: 'Segoe UI', size: sz, bold, color: { argb } });

const brd = (): Partial<ExcelJS.Borders> => {
  const side = { style: 'thin' as ExcelJS.BorderStyle, color: { argb: C.BORDER_CLR } };
  return { top: side, bottom: side, left: side, right: side };
};

const aln = (h: ExcelJS.Alignment['horizontal'], wrap = false): Partial<ExcelJS.Alignment> => 
  ({ horizontal: h, vertical: 'middle', wrapText: wrap });

async function downloadBlob(wb: ExcelJS.Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function exportarSaldosExcel(filtros: FiltrosExport = {}, metradosFiltrados: any[]): Promise<void> {
  const store = useMetradosStore.getState();
  
  // 1. Filtrar partidas maestras según especialidad si aplica
  let partidas = store.partidas.filter(p => !p.es_agrupador); // Solo ítems reales
  if (filtros.especialidad) {
    partidas = partidas.filter(p => p.especialidad === filtros.especialidad);
  }

  if (partidas.length === 0) {
    alert("No hay partidas presupuestales para la especialidad seleccionada.");
    return;
  }

  // 2. Sumarizar metrados del mes actual (según filtros UI)
  const sumaMesPorPartida = new Map<string, number>();
  metradosFiltrados.forEach(m => {
    if (m.partida_id) {
      const current = sumaMesPorPartida.get(m.partida_id) || 0;
      sumaMesPorPartida.set(m.partida_id, current + (m.resultado_total || 0));
    }
  });

  // 3. Crear el libro y la hoja Excel
  const wb = new ExcelJS.Workbook();
  wb.creator = 'App Metrados';
  wb.created = new Date();

  const ws = wb.addWorksheet('Saldos de Presupuesto', { views: [{ showGridLines: false }] });

  // 4. Configurar Columnas
  const columns = [
    { header: 'ITEM', width: 15 },
    { header: 'DESCRIPCIÓN', width: 50 },
    { header: 'UND', width: 8 },
    { header: 'P.U. (S/)', width: 12 },
    { header: 'MET. TOTAL EXP.', width: 16 },
    { header: 'MET. ACUM. ANT.', width: 16 },
    { header: 'MET. MES ACTUAL', width: 16 },
    { header: 'MET. EJEC. TOTAL', width: 16 },
    { header: '% AVANCE', width: 12 },
    { header: 'MET. SALDO', width: 16 },
    { header: 'S/. TOTAL EXP.', width: 18 },
    { header: 'S/. EJEC. TOTAL', width: 18 },
    { header: 'S/. SALDO', width: 18 }
  ];

  columns.forEach((c, idx) => {
    const col = ws.getColumn(idx + 1);
    col.width = c.width;
    const cell = ws.getCell(1, idx + 1);
    cell.value = c.header;
    cell.fill = fill(C.HDR_BG);
    cell.font = fnt(C.HDR_FG, 10, true);
    cell.alignment = aln('center', true);
    cell.border = brd();
  });

  // 5. Llenar los datos
  let rIdx = 2;
  
  partidas.forEach(p => {
    const row = ws.getRow(rIdx);
    
    // Variables Matemáticas
    const pu = p.precio_unitario_base || p.pu_actual || 0;
    const cantExp = p.cantidad_presupuestada || 0;
    const cantAnt = p.metrado_acumulado_anterior || 0;
    const cantMes = sumaMesPorPartida.get(p.id) || 0;
    const cantTotal = cantAnt + cantMes;
    const cantSaldo = cantExp - cantTotal;
    const isMayorMetrado = cantSaldo < 0;
    const pctAvance = cantExp > 0 ? (cantTotal / cantExp) : 0;

    const montoExp = cantExp * pu;
    const montoEjecutado = cantTotal * pu;
    const montoSaldo = cantSaldo * pu;

    // Asignar Valores
    row.getCell(1).value = p.codigo_expediente;
    row.getCell(2).value = p.descripcion;
    row.getCell(3).value = p.unidad_medida;
    row.getCell(4).value = pu;
    row.getCell(5).value = cantExp;
    row.getCell(6).value = cantAnt;
    row.getCell(7).value = cantMes;
    row.getCell(8).value = cantTotal;
    row.getCell(9).value = pctAvance;
    row.getCell(10).value = cantSaldo;
    row.getCell(11).value = montoExp;
    row.getCell(12).value = montoEjecutado;
    row.getCell(13).value = montoSaldo;

    // Formatos
    row.getCell(1).alignment = aln('center');
    row.getCell(2).alignment = aln('left', true);
    row.getCell(3).alignment = aln('center');
    
    // Formato de moneda
    const moneyFmt = '"S/" #,##0.00';
    const numFmt = '#,##0.00';
    const pctFmt = '0.00%';

    row.getCell(4).numFmt = moneyFmt;
    row.getCell(5).numFmt = numFmt;
    row.getCell(6).numFmt = numFmt;
    row.getCell(7).numFmt = numFmt;
    row.getCell(8).numFmt = numFmt;
    row.getCell(9).numFmt = pctFmt;
    row.getCell(10).numFmt = numFmt;
    row.getCell(11).numFmt = moneyFmt;
    row.getCell(12).numFmt = moneyFmt;
    row.getCell(13).numFmt = moneyFmt;

    // Colores y Bordes
    const rowColor = isMayorMetrado ? C.MAYOR_METRADO_BG : (rIdx % 2 === 0 ? C.ROW_EVEN : C.ROW_ODD);
    const fontColor = isMayorMetrado ? C.MAYOR_METRADO_FG : 'FF333333';

    for (let i = 1; i <= columns.length; i++) {
      const cell = row.getCell(i);
      cell.fill = fill(rowColor);
      cell.font = fnt(fontColor, 9, isMayorMetrado); // Bold y rojo si hay exceso
      cell.border = brd();
    }

    rIdx++;
  });

  // Filtros Automáticos en la Cabecera
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: rIdx - 1, column: columns.length }
  };

  // 6. Descargar Archivo
  const especialidadName = filtros.especialidad ? filtros.especialidad.replace(/[^a-zA-Z0-9]/g, '_') : 'GENERAL';
  const fileName = `Saldos_Presupuesto_${especialidadName}.xlsx`;
  await downloadBlob(wb, fileName);
}
