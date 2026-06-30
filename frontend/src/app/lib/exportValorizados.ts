/**
 * exportValorizados.ts
 * Ubicación: src/app/lib/exportValorizados.ts
 */

import ExcelJS from 'exceljs';
import { supabase } from './supabase';
import { useMetradosStore } from '../store/useMetradosStore';
import { usePersonalStore } from '../store/usePersonalStore';

// ─── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  HDR_COL_BG:  'FF1B4F82',
  HDR_COL_FG:  'FFFFFFFF',
  OBRA_BG:     'FFD6E4F0',
  OBRA_FG:     'FF1A2B45',
  SUB_BG:      'FFE8F0F8',
  SUB_FG:      'FF1A2B45',
  ROW_ODD:     'FFFFFFFF',
  ROW_EVEN:    'FFE9F1FB',
  DATA_FG:     'FF2D3748',
  BORDER_CLR:  'FFBDC7D8',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fill = (argb: string): ExcelJS.Fill =>
  ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

const fnt = (argb: string, sz: number, bold = false): Partial<ExcelJS.Font> =>
  ({ name: 'Arial', size: sz, bold, color: { argb } });

const brd = (): Partial<ExcelJS.Borders> => {
  const side = { style: 'thin' as ExcelJS.BorderStyle, color: { argb: C.BORDER_CLR } };
  return { top: side, bottom: side, left: side, right: side };
};

const aln = (
  h: ExcelJS.Alignment['horizontal'],
  wrap = false,
): Partial<ExcelJS.Alignment> => ({ horizontal: h, vertical: 'middle', wrapText: wrap });

const getInitials = (name: string): string => {
  if (!name || typeof name !== 'string') return '';
  return name.trim().split(/\s+/).map(word => word[0]).filter(Boolean).join('').toUpperCase();
};

function buildObrerosFromCuadrillaName(cuadrillaName: string): string {
  if (!cuadrillaName || cuadrillaName === '-') return '';
  const { obreros } = usePersonalStore.getState();
  const matchObreros = obreros.filter(o =>
    o.cuadrilla === cuadrillaName ||
    o.cuadrillas_asignadas?.includes(cuadrillaName)
  );
  return matchObreros
    .map(o => {
      const fn = o.nombres_completos?.trim().split(' ')[0] || '';
      const cat = (o.categoria_laboral || '').toUpperCase();
      let catAbbr = o.categoria_laboral || '';
      if (cat.includes('OPERARIO')) catAbbr = 'OP';
      else if (cat.includes('OFICIAL') || cat.includes('OFIICIAL')) catAbbr = 'OF';
      else if (cat.includes('PEON') || cat.includes('PEÓN')) catAbbr = 'P';
      return `${fn} (${catAbbr})`;
    })
    .filter(Boolean)
    .join(' / ');
}

// ─── Columnas Valorizadas ──────────────────────────────────────────────────────
interface ColDef { key: string | null; label: string; width: number; h: ExcelJS.Alignment['horizontal']; }

const COLS: ColDef[] = [
  { key: 'fecha_ejecucion',      label: 'FECHA',              width: 12, h: 'center' },
  { key: 'especialidad',         label: 'ESPECIALIDAD',       width: 14, h: 'left'   },
  { key: 'frente_trabajo',       label: 'FRENTE',             width: 10, h: 'center' },
  { key: 'bloque_sector',        label: 'BLOQUE',             width: 9,  h: 'center' },
  { key: 'nivel_piso',           label: 'NIVEL\n(PISO)',      width: 8,  h: 'center' },
  { key: 'cuadrilla',            label: 'CUADRILLA',          width: 12, h: 'center' },
  { key: '_partida_desc',        label: 'PARTIDA',            width: 50, h: 'left'   },
  { key: '_detalle_completo',    label: 'DETALLE',            width: 32, h: 'left'   },
  { key: 'resultado_total',      label: 'TOTAL METRADO',      width: 12, h: 'center' },
  { key: 'unidad',               label: 'UND.',               width: 8,  h: 'center' },
  { key: 'precio_unitario',      label: 'PRECIO\nUNITARIO',   width: 12, h: 'right'  },
  { key: 'monto_total',          label: 'MONTO\nTOTAL',       width: 14, h: 'right'  },
  { key: '_obreros',             label: 'NOMBRES CUADRILLAS', width: 50, h: 'left'   },
  { key: 'firma_ingeniero',      label: 'AUTOR',              width: 22, h: 'left'   },
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

const FALLBACK_ESP_ABBR: Record<string, string> = {
  "ARQUEOLOGÍA": "ARQL",
  "ARQUITECTURA": "ARQ",
  "COMUNICACIONES": "TIC",
  "ELÉCTRICAS": "IIEE",
  "ELECTROMECÁNICAS": "IMM",
  "EQUIPAMIENTO BIOMÉDICO": "EQB",
  "ESTRUCTURAS": "EST",
  "GENERAL": "GEN",
  "INSTALACIONES DE COMUNICACIONES": "TIC",
  "INSTALACIONES ELÉCTRICAS Y MECÁNICAS": "IEM",
  "INSTALACIONES SANITARIAS": "IISS",
  "OBRAS PROVISIONALES": "OP",
  "PLAN DE MANEJO AMBIENTAL": "PMA",
  "SEGURIDAD": "SEG"
};

async function fetchDatos(filtros: FiltrosExport, localData?: any[]) {
  const { data: espData } = await supabase.from('especialidades').select('nombre, codigo');
  const espMap = new Map((espData || []).map((e: any) => [e.nombre, e.codigo]));

  if (localData && localData.length > 0) {
    const partidasMap = new Map(useMetradosStore.getState().partidas.map(p => [p.id, p]));
    return localData.map((m: any) => {
      const espAbbr = espMap.get(m.especialidad) || FALLBACK_ESP_ABBR[m.especialidad] || m.especialidad?.substring(0, 3).toUpperCase() || 'E?';
      const p = partidasMap.get(m.partida_id);
      
      const precio_unitario = p?.precio_unitario_base || p?.pu_actual || 0;
      const monto_total = (m.resultado_total || 0) * precio_unitario;

      const obrerosStr = (m.obrero_nombre && m.obrero_nombre.trim() !== '' && m.obrero_nombre !== '-')
        ? m.obrero_nombre
        : buildObrerosFromCuadrillaName(m.cuadrilla || '');

      return {
        ...m,
        _partida_desc: `${m.snapshot_codigo || ''} - ${m.snapshot_descripcion || ''}`,
        precio_unitario,
        monto_total,
        _detalle_completo: [m.elemento_desc, m.detalle_desc].filter(Boolean).join(' / '),
        _modificacion: p?.modificacion || '',
        firma_ingeniero: getInitials(m.firma_ingeniero),
        _obreros: obrerosStr,
        _plano: m.sin_plano
          ? `Sin plano${m.obs_motivo ? ` - ${m.obs_motivo}` : ''}${m.obs_detalle ? ` - ${m.obs_detalle}` : ''}`
          : ['2361679', 'GRC', m.bloque_sector || 'B?', m.nivel_piso || 'N?', espAbbr, m.plano_sist || '?', 'PLN', m.plano_num || '?'].join(' - '),
      };
    });
  }

  let q = supabase
    .from('registro_metrados')
    .select(`
      grado, fecha_ejecucion, especialidad, frente_trabajo, bloque_sector,
      nivel_piso, cuadrilla, elemento_desc, detalle_desc,
      snapshot_codigo, snapshot_descripcion,
      cantidad_elementos, medida_largo_area, medida_ancho_empalme, medida_alto_gancho,
      resultado_parcial, nro_repeticiones, acero_diametro, resultado_total,
      unidad, plano_sist, plano_num, sin_plano, obs_motivo, obs_detalle, firma_ingeniero,
      metrados_obreros ( personal_obrero ( nombres_completos, categoria_laboral ) ),
      catalogo_partidas ( modificacion, precio_unitario_base, pu_actual )
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

  return (data ?? []).map((m: any) => {
    const precio_unitario = m.catalogo_partidas?.precio_unitario_base || m.catalogo_partidas?.pu_actual || 0;
    const monto_total = (m.resultado_total || 0) * precio_unitario;

    const espAbbr = espMap.get(m.especialidad) || FALLBACK_ESP_ABBR[m.especialidad] || m.especialidad?.substring(0, 3).toUpperCase() || 'E?';
    return {
      ...m,
      _partida_desc: `${m.snapshot_codigo || ''} - ${m.snapshot_descripcion || ''}`,
      precio_unitario,
      monto_total,
      _detalle_completo: [m.elemento_desc, m.detalle_desc].filter(Boolean).join(' / '),
      _modificacion: m.catalogo_partidas?.modificacion || '',
      firma_ingeniero: getInitials(m.firma_ingeniero),
      _obreros: (() => {
          const fromRelacion = (m.metrados_obreros ?? [])
            .map((r: any) => {
              if (!r.personal_obrero) return '';
              const firstName = r.personal_obrero.nombres_completos?.trim().split(' ')[0] || '';
              const cat = r.personal_obrero.categoria_laboral || '';
              const c = cat.toUpperCase();
              let catAbbr = cat;
              if (c.includes('OPERARIO')) catAbbr = 'OP';
              else if (c.includes('OFICIAL') || c.includes('OFIICIAL')) catAbbr = 'OF';
              else if (c.includes('PEON') || c.includes('PEÓN')) catAbbr = 'P';
              return `${firstName} (${catAbbr})`;
            })
            .filter(Boolean).join(' / ');
          return fromRelacion || buildObrerosFromCuadrillaName(m.cuadrilla || '');
        })(),
      _plano: m.sin_plano
        ? `Sin plano${m.obs_motivo ? ` - ${m.obs_motivo}` : ''}${m.obs_detalle ? ` - ${m.obs_detalle}` : ''}`
        : ['2361679', 'GRC', m.bloque_sector || 'B?', m.nivel_piso || 'N?', espAbbr, m.plano_sist || '?', 'PLN', m.plano_num || '?'].join(' - '),
    };
  });
}

// ─── Cargar imagen desde assets ───────────────────────────────────────────────
async function loadLogoBuffer(): Promise<ArrayBuffer | null> {
  try {
    const logoUrl = new URL('/src/assets/logo-gobierno-cusco.png', import.meta.url).href;
    const res = await fetch(logoUrl);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
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

// ─── Builder ──────────────────────────────────────────────────────────────────
async function buildWorkbook(rows: any[], logoBuffer: ArrayBuffer | null): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sistema Metrados';
  const ws = wb.addWorksheet('Desglose Valorizado', {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  });

  ws.columns = COLS.map(c => ({ width: c.width }));

  function spanRow(
    rowNum: number,
    value: string,
    bgArgb: string,
    fgArgb: string,
    sz: number,
    bold: boolean,
    height: number,
    hAlign: ExcelJS.Alignment['horizontal'] = 'center',
    wrap = false,
  ) {
    ws.mergeCells(rowNum, 1, rowNum, NCOLS);
    const cell = ws.getCell(rowNum, 1);
    cell.value = value;
    cell.fill  = fill(bgArgb);
    cell.font  = fnt(fgArgb, sz, bold);
    cell.alignment = aln(hAlign, wrap);
    ws.getRow(rowNum).height = height;
  }

  let r = 1;

  const LOGO_ROWS  = 3;
  const ROW_HEIGHT = 25;
  const LOGO_H_PX  = LOGO_ROWS * ROW_HEIGHT * 1.333;
  const LOGO_W_PX  = Math.round(LOGO_H_PX * (1349 / 282));

  if (logoBuffer) {
    const imageId = wb.addImage({ buffer: logoBuffer, extension: 'png' });
    ws.addImage(imageId, {
      tl: { col: 0, row: r - 1 },
      ext: { width: LOGO_W_PX, height: LOGO_H_PX },
      editAs: 'oneCell',
    });
  } else {
    spanRow(r,
      'GOBIERNO REGIONAL CUSCO  |  Gerencia Regional de Gestión de Inversiones de Infraestructura',
      'FF1F3864', 'FFFFFFFF', 10, true, ROW_HEIGHT * LOGO_ROWS, 'center');
  }

  r += LOGO_ROWS;

  ws.getRow(r).height = 32;
  COLS.forEach((col, i) => {
    const cell = ws.getCell(r, i + 1);
    cell.value     = col.label;
    cell.fill      = fill(C.HDR_COL_BG);
    cell.font      = fnt(C.HDR_COL_FG, 8, true);
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border    = brd();
  });
  const freezeRow = r;
  r++;

  let dataIdx = 0;

  for (const row of rows) {
    const bgArgb = dataIdx % 2 === 0 ? C.ROW_ODD : C.ROW_EVEN;
    ws.getRow(r).height = 14;

    COLS.forEach((col, i) => {
      const cell = ws.getCell(r, i + 1);
      const val  = col.key ? (row[col.key] ?? null) : null;
      let cellValue = val;
      if (col.key === 'fecha_ejecucion' && typeof val === 'string') {
        const parts = val.split('-');
        if (parts.length === 3) {
          cellValue = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
      }

      cell.value     = cellValue;
      cell.font      = fnt(C.DATA_FG, 8);
      cell.fill      = fill(bgArgb);
      cell.alignment = aln(col.h);
      cell.border    = brd();
      
      if (col.key === 'fecha_ejecucion') {
        cell.numFmt = 'dd/mm';
      } else if (typeof val === 'number') {
        if (col.key === 'precio_unitario' || col.key === 'monto_total') {
          cell.numFmt = '"S/"#,##0.00';
        } else {
          cell.numFmt = '0.00';
        }
      }
    });

    r++;
    dataIdx++;
  }

  ws.views = [{ state: 'frozen', ySplit: freezeRow, xSplit: 0, activeCell: `A${freezeRow + 1}` }];

  // ══════════════════════════════════════════════════════════════
  //  NUEVA HOJA: Resumen por Especialidad
  // ══════════════════════════════════════════════════════════════
  const wsRes = wb.addWorksheet('Resumen Especialidades', { views: [{ showGridLines: false }] });
  
  wsRes.getColumn(1).width = 40;
  wsRes.getColumn(2).width = 25;

  wsRes.getCell('A1').value = 'RESUMEN VALORIZADO POR ESPECIALIDAD';
  wsRes.getCell('A1').font = fnt(C.HDR_COL_FG, 12, true);
  wsRes.getCell('A1').fill = fill(C.HDR_COL_BG);
  wsRes.getCell('A1').alignment = aln('center');
  wsRes.mergeCells('A1:B1');

  wsRes.getCell('A2').value = 'ESPECIALIDAD';
  wsRes.getCell('B2').value = 'MONTO TOTAL (S/)';
  ['A2', 'B2'].forEach(c => {
    const cell = wsRes.getCell(c);
    cell.font = fnt(C.HDR_COL_FG, 10, true);
    cell.fill = fill(C.HDR_COL_BG);
    cell.alignment = aln('center');
    cell.border = brd();
  });

  const resumen = new Map<string, number>();
  let totalGeneral = 0;
  
  for (const row of rows) {
    const esp = row.especialidad || 'SIN ESPECIALIDAD';
    const monto = row.monto_total || 0;
    resumen.set(esp, (resumen.get(esp) || 0) + monto);
    totalGeneral += monto;
  }

  let rowIdx = 3;
  Array.from(resumen.entries())
    .sort((a, b) => b[1] - a[1]) // Sort desc by monto
    .forEach(([esp, monto]) => {
      const cellEsp = wsRes.getCell(`A${rowIdx}`);
      const cellMonto = wsRes.getCell(`B${rowIdx}`);
      
      cellEsp.value = esp;
      cellMonto.value = monto;
      
      [cellEsp, cellMonto].forEach(c => {
        c.font = fnt(C.DATA_FG, 9);
        c.border = brd();
        c.fill = fill(rowIdx % 2 === 0 ? C.ROW_EVEN : C.ROW_ODD);
      });
      cellMonto.numFmt = '"S/"#,##0.00';
      cellMonto.alignment = aln('right');
      
      rowIdx++;
    });

  const cellEspTot = wsRes.getCell(`A${rowIdx}`);
  const cellMontoTot = wsRes.getCell(`B${rowIdx}`);
  cellEspTot.value = 'TOTAL GENERAL';
  cellMontoTot.value = totalGeneral;
  
  [cellEspTot, cellMontoTot].forEach(c => {
    c.font = fnt(C.DATA_FG, 10, true);
    c.border = brd();
    c.fill = fill('#FFD9E2ED'); // Color especial para totales
  });
  cellEspTot.alignment = aln('right');
  cellMontoTot.numFmt = '"S/"#,##0.00';
  cellMontoTot.alignment = aln('right');

  return wb;
}

// ─── Función pública ──────────────────────────────────────────────────────────
export async function exportarValorizadosExcel(
  filtros: FiltrosExport = {},
  localData?: any[]
): Promise<void> {
  const [datos, logoBuffer] = await Promise.all([
    fetchDatos(filtros, localData),
    loadLogoBuffer(),
  ]);

  if (!datos.length) {
    alert('Sin registros para los filtros seleccionados.');
    return;
  }

  const wb = await buildWorkbook(datos, logoBuffer);
  const fecha = new Date().toISOString().slice(0, 10);
  await downloadBlob(wb, `Valorizacion_Metrados_${fecha}.xlsx`);
}