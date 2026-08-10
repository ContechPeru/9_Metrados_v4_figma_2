/**
 * exportLiquid.ts
 * Ubicación: src/app/lib/exportLiquid.ts
 *
 * Requiere: npm install exceljs --legacy-peer-deps
 */

import ExcelJS from 'exceljs';
import { supabase } from './supabase';
import { useMetradosStore } from '../store/useMetradosStore';

// ─── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  HDR_COL_BG:  'FF2F5597',  // Azul corporativo oscuro - encabezados
  HDR_COL_FG:  'FFFFFFFF',
  PARTIDA_BG:  'FFFFFFFF',  // Fondo blanco para fila partida
  PARTIDA_FG:  'FF000000',
  DETAIL_BG:   'FFFFFFFF',  // Blanco para detalle
  DETAIL_FG:   'FF404040',
  GREEN_BG:    'FFC6E0B4',  // Verde claro para encabezados como Altura y Totales
  GREEN_FG:    'FF000000',
  BORDER_CLR:  'FF000000',  // Borde negro clásico
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fill = (argb: string): ExcelJS.Fill =>
  ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

const fnt = (argb: string, sz: number, bold = false, italic = false): Partial<ExcelJS.Font> =>
  ({ name: 'Arial', size: sz, bold, italic, color: { argb } });

const brd = (): Partial<ExcelJS.Borders> => {
  const side = { style: 'thin' as ExcelJS.BorderStyle, color: { argb: C.BORDER_CLR } };
  return { top: side, bottom: side, left: side, right: side };
};

const brdDotted = (): Partial<ExcelJS.Borders> => {
  const side = { style: 'dotted' as ExcelJS.BorderStyle, color: { argb: 'FF808080' } };
  return { top: side, bottom: side, left: { style: 'thin', color: { argb: C.BORDER_CLR } }, right: { style: 'thin', color: { argb: C.BORDER_CLR } } };
};

const aln = (
  h: ExcelJS.Alignment['horizontal'],
  wrap = false,
): Partial<ExcelJS.Alignment> => ({ horizontal: h, vertical: 'middle', wrapText: wrap });

const getInitials = (name: string): string => {
  if (!name || typeof name !== 'string') return '';
  return name.trim().split(/\s+/).map(word => word[0]).filter(Boolean).join('').toUpperCase();
};

// ─── Columnas ─────────────────────────────────────────────────────────────────
interface ColDef { key: string; label: string; width: number; h: ExcelJS.Alignment['horizontal']; bg?: string; }

const COLS: ColDef[] = [
  { key: 'item',         label: 'ITEM',        width: 15, h: 'left' },
  { key: 'descripcion',  label: 'DESCRIPCION', width: 55, h: 'left' },
  { key: 'unidad',       label: 'UND',         width: 8,  h: 'center' },
  { key: 'veces',        label: 'VECES',       width: 8,  h: 'center' },
  { key: 'cantidad',     label: 'CANTIDA',     width: 9,  h: 'center' },
  { key: 'largo',        label: 'LARGO',       width: 9,  h: 'center' },
  { key: 'ancho',        label: 'ANCHO',       width: 9,  h: 'center' },
  { key: 'altura',       label: 'ALTURA',      width: 9,  h: 'center', bg: C.GREEN_BG }, // Columna resaltada en verde
  { key: 'area',         label: 'AREA',        width: 9,  h: 'center' },
  { key: 'volumen',      label: 'VOLUME',      width: 9,  h: 'center' },
  { key: 'factor',       label: 'FACTOR',      width: 8,  h: 'center' },
  { key: 'acero',        label: 'ACERO',       width: 9,  h: 'center' },
  { key: 'subtotal',     label: 'SUB TOTA',    width: 11, h: 'right' },
  { key: 'total',        label: 'TOTAL',       width: 11, h: 'right' },
  { key: 'frente',       label: 'FRENTE',      width: 12, h: 'center' },
  { key: 'bloque',       label: 'BLOQUE',      width: 12, h: 'center' },
  { key: 'nivel',        label: 'NIVEL',       width: 10, h: 'center' },
  { key: 'sistema',      label: 'SISTEMA/AMBIENTE', width: 20, h: 'left' },
  { key: 'observacion',  label: 'OBSERVACIÓN',  width: 15, h: 'left' },
  { key: 'modificaciones',label: 'MODIFICACIONES', width: 12, h: 'center' },
  { key: 'fecha',        label: 'FECHA',        width: 12, h: 'center' },
  { key: 'cuadrilla',    label: 'CUADRILLA',    width: 15, h: 'left' },
  { key: 'autor',        label: 'AUTOR',        width: 15, h: 'left' },
  { key: 'grado',        label: 'GRADO',        width: 10, h: 'center' },
];

const NCOLS = COLS.length;

// ─── Filtros ──────────────────────────────────────────────────────────────────
export interface FiltrosExport {
  especialidad?: string;
  frente?: string;
  bloque?: string;
  nivel?: string;
  autor?: string;
  cuadrilla?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

// ─── Fetch Datos ─────────────────────────────────────────────────────────────────
async function fetchDatos(filtros: FiltrosExport, localData?: any[]) {
  if (localData && localData.length > 0) {
    const partidasMap = new Map(useMetradosStore.getState().partidas.map(p => [p.id, p]));
    return localData.map((m: any) => {
      const p = partidasMap.get(m.partida_id);
      return {
        ...m,
        snapshot_codigo: m.snapshot_codigo || p?.codigo_expediente || '',
        snapshot_descripcion: m.snapshot_descripcion || p?.descripcion || '',
        _modificacion: p?.modificacion || ''
      };
    });
  }

  let q = supabase
    .from('registro_metrados')
    .select(`
      grado, fecha_ejecucion, especialidad, frente_trabajo, bloque_sector,
      nivel_piso, cuadrilla, elemento_desc, detalle_desc, observacion,
      snapshot_codigo, snapshot_descripcion,
      cantidad_elementos, medida_largo_area, medida_ancho_empalme, medida_alto_gancho, nro_repeticiones,
      acero_diametro, hvac_factor, resultado_total, unidad, firma_ingeniero,
      metrados_obreros ( personal_obrero ( nombres_completos, categoria_laboral ) ),
      catalogo_partidas ( modificacion, precio_unitario_base, pu_actual, codigo_expediente, descripcion )
    `)
    .order('grado',           { ascending: true })
    .order('fecha_ejecucion', { ascending: true });

  if (filtros.especialidad) q = q.eq('especialidad', filtros.especialidad);
  if (filtros.frente)       q = q.eq('frente_trabajo', filtros.frente);
  if (filtros.bloque)       q = q.eq('bloque_sector', filtros.bloque);
  if (filtros.nivel)        q = q.eq('nivel_piso', filtros.nivel);
  if (filtros.autor)        q = q.eq('firma_ingeniero', filtros.autor);
  if (filtros.cuadrilla)    q = q.ilike('cuadrilla', `%${filtros.cuadrilla}%`);
  if (filtros.fechaDesde)   q = q.gte('fecha_ejecucion', filtros.fechaDesde);
  if (filtros.fechaHasta)   q = q.lte('fecha_ejecucion', filtros.fechaHasta);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return (data ?? []).map((m: any) => ({
    ...m,
    snapshot_codigo: m.snapshot_codigo || m.catalogo_partidas?.codigo_expediente || '',
    snapshot_descripcion: m.snapshot_descripcion || m.catalogo_partidas?.descripcion || '',
    _modificacion: (m.catalogo_partidas && !Array.isArray(m.catalogo_partidas) ? m.catalogo_partidas.modificacion : null) || ''
  }));
}

// ─── Builder ──────────────────────────────────────────────────────────────────
export async function buildWorkbook(rows: any[], filtros: FiltrosExport): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sistema Metrados';
  const ws = wb.addWorksheet('Planilla Liquidacion', {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    views: [{ showGridLines: false }]
  });

  ws.columns = COLS.map(c => ({ width: c.width }));

  let r = 1;

  // 1. Título principal
  ws.mergeCells(r, 1, r, NCOLS);
  const cellTitle = ws.getCell(r, 1);
  cellTitle.value = `PLANILLA DE METRADOS - LIQUIDACIÓN ${filtros.especialidad ? '- ' + filtros.especialidad : ''}`.toUpperCase();
  cellTitle.fill = fill('FF1A3B5C'); // Azul muy oscuro
  cellTitle.font = fnt('FFFFFFFF', 11, true);
  cellTitle.alignment = aln('left');
  ws.getRow(r).height = 22;
  r++;

  // 2. Encabezados de Columna
  ws.getRow(r).height = 25;
  COLS.forEach((col, i) => {
    const cell = ws.getCell(r, i + 1);
    cell.value     = col.label;
    cell.fill      = fill(col.bg || C.HDR_COL_BG);
    cell.font      = fnt(C.HDR_COL_FG, 9, true);
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border    = brd();
  });
  const freezeRow = r;
  r++;

  // 3. Agrupar por Partida
  const partidasMap = new Map<string, {
    item: string;
    descripcion: string;
    unidad: string;
    total: number;
    metrados: any[];
    modificacion: string;
  }>();

  for (const row of rows) {
    const key = row.snapshot_codigo || 'SIN CODIGO';
    if (!partidasMap.has(key)) {
      partidasMap.set(key, {
        item: key,
        descripcion: row.snapshot_descripcion || '',
        unidad: row.unidad || '',
        total: 0,
        metrados: [],
        modificacion: row._modificacion || ''
      });
    }
    const group = partidasMap.get(key)!;
    group.metrados.push(row);
    group.total += (row.resultado_total || 0);
  }

  const partidasList = Array.from(partidasMap.values());
  partidasList.sort((a, b) => a.item.localeCompare(b.item, undefined, { numeric: true, sensitivity: 'base' }));

  // 4. Imprimir filas
  for (const partida of partidasList) {
    // 4a. Fila de Partida
    ws.getRow(r).height = 18;
    
    // A: ITEM
    let cell = ws.getCell(r, 1);
    cell.value = partida.item;
    cell.font = fnt(C.PARTIDA_FG, 9, true);
    cell.border = brd();
    cell.alignment = aln('left');

    // B: DESCRIPCION
    cell = ws.getCell(r, 2);
    cell.value = partida.descripcion;
    cell.font = fnt(C.PARTIDA_FG, 9, true);
    cell.border = brd();
    cell.alignment = aln('left');
    for (let c = 1; c <= NCOLS; c++) {
      const cell = ws.getCell(r, c);
      
      cell.fill = fill(C.PARTIDA_BG);
      cell.border = brd();

      if (c === 1) {
        cell.value = partida.item;
        cell.font = fnt(C.PARTIDA_FG, 9, true);
      } else if (c === 2) {
        cell.value = partida.descripcion;
        cell.font = fnt(C.PARTIDA_FG, 9, true, false);
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      } else if (c === 3) {
        cell.value = partida.unidad;
        cell.font = fnt(C.PARTIDA_FG, 9, true);
        cell.alignment = aln('center');
      } else if (c === 14) {
        cell.value = partida.total;
        cell.font = fnt(C.PARTIDA_FG, 9, true);
        cell.alignment = aln('right');
        cell.numFmt = '#,##0.00';
      } else if (c === 20) {
        cell.value = partida.modificacion || '';
        cell.font = fnt(C.PARTIDA_FG, 9, true);
        cell.alignment = aln('center');
      }
    }
    r++;

    // 4b. Filas de Detalle (Metrados)
    for (const m of partida.metrados) {
      ws.getRow(r).height = 16;
      
      // Construir string de sustento (Alineado a la derecha en la columna B)
      const partesSustento = [m.bloque_sector, m.elemento_desc, m.detalle_desc].filter(p => p && p !== '-' && p !== '---');
      const sustentoStr = partesSustento.length > 0 ? partesSustento.join(' - ') : 'Sustento general';

      for (let c = 1; c <= NCOLS; c++) {
        const cell = ws.getCell(r, c);
        cell.border = brdDotted(); // Borde punteado para los detalles
        cell.font = fnt(C.DETAIL_FG, 8);
        
        // Mantener fondo de columna resaltada
        if (COLS[c-1].bg) {
          cell.fill = fill(COLS[c-1].bg!);
        }

        if (c === 2) {
          // DESCRIPCION (Sustento)
          cell.value = sustentoStr;
          cell.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
          cell.font = fnt(C.DETAIL_FG, 8, false, true); // Italic
        } else if (c === 4 && m.nro_repeticiones) {
          cell.value = m.nro_repeticiones; cell.alignment = aln('center'); cell.numFmt = '#,##0.00';
        } else if (c === 5 && m.cantidad_elementos) {
          cell.value = m.cantidad_elementos; cell.alignment = aln('center'); cell.numFmt = '#,##0.00';
        } else if (c === 6 && m.medida_largo_area) {
          cell.value = m.medida_largo_area; cell.alignment = aln('center'); cell.numFmt = '#,##0.00';
        } else if (c === 7 && m.medida_ancho_empalme) {
          cell.value = m.medida_ancho_empalme; cell.alignment = aln('center'); cell.numFmt = '#,##0.00';
        } else if (c === 8 && m.medida_alto_gancho) {
          cell.value = m.medida_alto_gancho; cell.alignment = aln('center'); cell.numFmt = '#,##0.00';
        } else if (c === 11 && m.hvac_factor) {
          cell.value = m.hvac_factor; cell.alignment = aln('center'); cell.numFmt = '#,##0.00';
        } else if (c === 12 && m.acero_diametro) {
          cell.value = m.acero_diametro; cell.alignment = aln('center');
        } else if (c === 13) {
          // SUB TOTAL
          cell.value = m.resultado_total; cell.alignment = aln('right'); cell.numFmt = '#,##0.00';
        } else if (c === 15) {
          cell.value = m.frente_trabajo; cell.alignment = aln('center');
        } else if (c === 16) {
          cell.value = m.bloque_sector; cell.alignment = aln('center');
        } else if (c === 17) {
          cell.value = m.nivel_piso; cell.alignment = aln('center');
        } else if (c === 18) {
          cell.value = m.elemento_desc; cell.alignment = aln('left', true);
        } else if (c === 19) {
          cell.value = m.observacion || ''; cell.alignment = aln('left', true);
        } else if (c === 20) {
          cell.value = m._modificacion || ''; cell.alignment = aln('center');
        } else if (c === 21) {
          cell.value = m.fecha_ejecucion; cell.alignment = aln('center');
        } else if (c === 22) {
          cell.value = m.cuadrilla; cell.alignment = aln('left');
        } else if (c === 23) {
          cell.value = getInitials(m.firma_ingeniero); cell.alignment = aln('center');
        } else if (c === 24) {
          cell.value = m.grado; cell.alignment = aln('center');
        } else {
          // Otras celdas quedan vacías pero con borde
          cell.value = '';
        }
      }
      r++;
    }
    
    // Fila en blanco separadora con bordes laterales
    ws.getRow(r).height = 6;
    for (let c = 1; c <= NCOLS; c++) {
       const cell = ws.getCell(r, c);
       cell.border = { left: { style: 'thin', color: { argb: C.BORDER_CLR } }, right: { style: 'thin', color: { argb: C.BORDER_CLR } } };
       if (COLS[c-1].bg) cell.fill = fill(COLS[c-1].bg!);
    }
    // Cerrar el borde inferior del bloque separador
    for (let c = 1; c <= 23; c++) {
        ws.getCell(r, c).border = { bottom: { style: 'thin', color: { argb: C.BORDER_CLR } }, left: { style: 'thin', color: { argb: C.BORDER_CLR } }, right: { style: 'thin', color: { argb: C.BORDER_CLR } } };
    }
    r++;
  }

  ws.views = [{ state: 'frozen', ySplit: freezeRow, xSplit: 0, activeCell: `A${freezeRow + 1}` }];
  return wb;
}

// ─── Download helper ──────────────────────────────────────────────────────────
async function downloadBlob(wb: ExcelJS.Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Función pública ──────────────────────────────────────────────────────────
export async function exportarLiquidExcel(
  filtros: FiltrosExport = {},
  localData?: any[]
): Promise<void> {
  const datos = await fetchDatos(filtros, localData);

  if (!datos.length) {
    alert('Sin registros para los filtros seleccionados.');
    return;
  }

  if (typeof window !== 'undefined' && window.Worker) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('../workers/exportWorker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (e) => {
        if (e.data.success) {
          const blob = new Blob([e.data.buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const fecha = new Date().toISOString().slice(0, 10);
          a.download = `Planilla_Metrados_Liquidacion_${fecha}.xlsx`;
          a.click();
          URL.revokeObjectURL(url);
          worker.terminate();
          resolve();
        } else {
          worker.terminate();
          reject(new Error(e.data.error));
        }
      };
      worker.onerror = (err) => {
        worker.terminate();
        reject(err);
      };
      worker.postMessage({ type: 'LIQUID', datos, filtros });
    });
  } else {
    const wb = await buildWorkbook(datos, filtros);
    const fecha = new Date().toISOString().slice(0, 10);
    await downloadBlob(wb, `Planilla_Metrados_Liquidacion_${fecha}.xlsx`);
  }
}