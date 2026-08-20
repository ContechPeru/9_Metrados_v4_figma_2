/**
 * exportMetrados.ts
 * Ubicación: src/app/lib/exportMetrados.ts
 *
 * Requiere: npm install exceljs --legacy-peer-deps
 * Imagen:   src/assets/logo-gobierno-cusco.png
 */

import ExcelJS from 'exceljs';
import { supabase } from './supabase';
import { useMetradosStore } from '../store/useMetradosStore';
import { usePersonalStore } from '../store/usePersonalStore';

// ─── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  HDR_COL_BG:  'FF1B4F82',  // azul corporativo — encabezados columna
  HDR_COL_FG:  'FFFFFFFF',
  OBRA_BG:     'FFD6E4F0',  // azul muy claro — título obra
  OBRA_FG:     'FF1A2B45',
  SUB_BG:      'FFE8F0F8',  // azul pálido — subtítulo
  SUB_FG:      'FF1A2B45',
  ROW_ODD:     'FFFFFFFF',  // blanco
  ROW_EVEN:    'FFE9F1FB',  // celeste suave
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

/**
 * Construye el string de nombres de la cuadrilla a partir del nombre del código de cuadrilla.
 * Usa el store de personal como fuente. Respeta la misma arquitectura Many-to-Many:
 *   cuadrillas ← obreros_cuadrillas → personal_obrero
 * Fallback para metrados existentes cuya tabla metrados_obreros está vacía.
 */
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

// ─── Columnas ─────────────────────────────────────────────────────────────────
interface ColDef { key: string | null; label: string; width: number; h: ExcelJS.Alignment['horizontal']; }

const COLS: ColDef[] = [
  { key: 'fecha_ejecucion',      label: 'FECHA',              width: 12, h: 'center' },
  { key: 'especialidad',         label: 'ESPECIALIDAD',       width: 14, h: 'left'   },
  { key: 'frente_trabajo',       label: 'FRENTE',             width: 10, h: 'center' },
  { key: 'bloque_sector',        label: 'BLOQUE',             width: 9,  h: 'center' },
  { key: 'nivel_piso',           label: 'NIVEL\n(PISO)',      width: 8,  h: 'center' },
  { key: 'ambiente',             label: 'SIST. /\nAMBIENTE',  width: 15, h: 'center' },
  { key: 'cuadrilla',            label: 'CUADRILLA',          width: 12, h: 'center' },
  { key: '_partida_desc',        label: 'PARTIDA',            width: 50, h: 'left'   },
  { key: '_detalle_completo',    label: 'DETALLE',            width: 32, h: 'left'   },
  { key: 'cantidad_elementos',   label: 'CANTIDAD',           width: 9,  h: 'center' },
  { key: 'medida_largo_area',    label: 'LONGITUD/\nAREA',    width: 12, h: 'center' },
  { key: 'medida_ancho_empalme', label: 'ANCHO/\nEMPAME',    width: 12, h: 'center' },
  { key: 'medida_alto_gancho',   label: 'ALTURA/\nGANCHO',   width: 12, h: 'center' },
  { key: 'resultado_parcial',    label: 'PARCIAL',            width: 10, h: 'center' },
  { key: 'nro_repeticiones',     label: 'N° VECES',           width: 9,  h: 'center' },
  { key: 'acero_diametro',       label: 'ACERO',              width: 9,  h: 'center' },
  { key: 'resultado_total',      label: 'TOTAL',              width: 10, h: 'center' },
  { key: 'unidad',               label: 'UNIDAD',             width: 8,  h: 'center' },
  { key: '_modificacion',        label: 'MODIF.',             width: 7,  h: 'center' },
  { key: '_plano',               label: 'PLANO',              width: 14, h: 'left'   },
  { key: '_obreros',             label: 'NOMBRES CUADRILLAS', width: 50, h: 'left'   },
  { key: 'firma_ingeniero',      label: 'AUTOR',              width: 22, h: 'left'   },
  { key: 'observacion',          label: 'OBSERVACIÓN',        width: 35, h: 'left'   },
  { key: 'ubicacion',            label: 'UBICACIÓN',          width: 12, h: 'center' },
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

// ─── Supabase ─────────────────────────────────────────────────────────────────
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

      // Prioridad 1: obrero_nombre guardado en el store (viene de metrados_obreros JOIN)
      // Prioridad 2: fallback dinámico buscando en el store de personal por nombre de cuadrilla
      // Esto cubre metrados históricos cuya tabla metrados_obreros no fue poblada.
      const obrerosStr = (m.obrero_nombre && m.obrero_nombre.trim() !== '' && m.obrero_nombre !== '-')
        ? m.obrero_nombre
        : buildObrerosFromCuadrillaName(m.cuadrilla || '');

      const codigo = m.snapshot_codigo || p?.codigo_expediente || '';
      const desc = m.snapshot_descripcion || p?.descripcion || '';
      const partidaDesc = (codigo || desc) ? `${codigo} - ${desc}` : '-';

      return {
        ...m,
        _partida_desc: partidaDesc,
        _detalle_completo: [m.elemento_desc, m.detalle_desc].filter(Boolean).join(' / '),
        _modificacion: p?.modificacion || '',
        ubicacion: m.ubicacion || m.obs_detalle || '',
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
      grado, fecha_ejecucion, especialidad, frente_trabajo, ambiente, bloque_sector,
      nivel_piso, cuadrilla, elemento_desc, detalle_desc,
      snapshot_codigo, snapshot_descripcion,
      cantidad_elementos, medida_largo_area, medida_ancho_empalme, medida_alto_gancho,
      resultado_parcial, nro_repeticiones, acero_diametro, resultado_total,
      unidad, plano_sist, plano_num, sin_plano, obs_motivo, obs_detalle, observacion, ubicacion, firma_ingeniero,
      metrados_obreros ( personal_obrero ( nombres_completos, categoria_laboral ) ),
      catalogo_partidas ( modificacion, codigo_expediente, descripcion )
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
    const espAbbr = espMap.get(m.especialidad) || FALLBACK_ESP_ABBR[m.especialidad] || m.especialidad?.substring(0, 3).toUpperCase() || 'E?';
    
    const codigo = m.snapshot_codigo || m.catalogo_partidas?.codigo_expediente || '';
    const desc = m.snapshot_descripcion || m.catalogo_partidas?.descripcion || '';
    const partidaDesc = (codigo || desc) ? `${codigo} - ${desc}` : '-';

    return {
      ...m,
      _partida_desc: partidaDesc,
      _detalle_completo: [m.elemento_desc, m.detalle_desc].filter(Boolean).join(' / '),
      _modificacion: m.catalogo_partidas?.modificacion || '',
      ubicacion: m.ubicacion || m.obs_detalle || '',
      firma_ingeniero: getInitials(m.firma_ingeniero),
      _obreros: (() => {
          // Prioridad 1: relación metrados_obreros → personal_obrero (fuente canónica)
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
          // Prioridad 2: fallback por nombre de cuadrilla desde el store de personal
          return fromRelacion || buildObrerosFromCuadrillaName(m.cuadrilla || '');
        })(),
      _plano: m.sin_plano
        ? `Sin plano${m.obs_motivo ? ` - ${m.obs_motivo}` : ''}${m.obs_detalle ? ` - ${m.obs_detalle}` : ''}`
        : ['2361679', 'GRC', m.bloque_sector || 'B?', m.nivel_piso || 'N?', espAbbr, m.plano_sist || '?', 'PLN', m.plano_num || '?'].join(' - '),
    };
  });
}

let cachedLogoBuffer: ArrayBuffer | null = null;

// ─── Cargar imagen desde assets (Caché en memoria) ───────────────────────────
async function loadLogoBuffer(): Promise<ArrayBuffer | null> {
  if (cachedLogoBuffer) return cachedLogoBuffer;
  try {
    const logoUrl = new URL('/src/assets/logo-gobierno-cusco.png', import.meta.url).href;
    const res = await fetch(logoUrl);
    if (!res.ok) return null;
    cachedLogoBuffer = await res.arrayBuffer();
    return cachedLogoBuffer;
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
export async function buildWorkbook(rows: any[], logoBuffer: ArrayBuffer | null): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sistema Metrados';
  const ws = wb.addWorksheet('Metrados', {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  });

  ws.columns = COLS.map(c => ({ width: c.width }));

  // ── helper: fila fusionada con texto ────────────────────────────────────
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

  // ══════════════════════════════════════════════════════════════
  //  BLOQUE 1: Logo institucional (3 filas de altura = ~90px)
  // ══════════════════════════════════════════════════════════════
  const LOGO_ROWS  = 3;
  const ROW_HEIGHT = 25;
  const LOGO_H_PX  = LOGO_ROWS * ROW_HEIGHT * 1.333;
  const LOGO_W_PX  = Math.round(LOGO_H_PX * (1349 / 282));

  for (let i = 0; i < LOGO_ROWS; i++) {
    ws.mergeCells(r + i, 1, r + i, NCOLS);
    const cell = ws.getCell(r + i, 1);
    cell.fill = fill('FFFFFFFF');
    ws.getRow(r + i).height = ROW_HEIGHT;
  }

  if (logoBuffer) {
    const imageId = wb.addImage({ buffer: logoBuffer, extension: 'png' });
    ws.addImage(imageId, {
      tl: { col: 0, row: r - 1 },
      ext: { width: LOGO_W_PX, height: LOGO_H_PX },
      editAs: 'oneCell',
    });
  } else {
    spanRow(r,
      'GOBIERNO REGIONAL CUSCO  |  Gerencia Regional de Gestión de Inversiones de Infraestructura  |  Subgerencia de Gestión de Obras',
      'FF1F3864', 'FFFFFFFF', 10, true, ROW_HEIGHT * LOGO_ROWS, 'center');
  }

  r += LOGO_ROWS;

  // ══════════════════════════════════════════════════════════════
  //  BLOQUE 4: Encabezados de columna
  // ══════════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════════
  //  BLOQUE 5: Filas de datos — alternadas
  // ══════════════════════════════════════════════════════════════
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
        cell.numFmt = '0.00';
      }
    });

    r++;
    dataIdx++;
  }

  // Congelar encabezados
  ws.views = [{ state: 'frozen', ySplit: freezeRow, xSplit: 0, activeCell: `A${freezeRow + 1}` }];

  return wb;
}

// ─── Función pública ──────────────────────────────────────────────────────────
export async function exportarMetradosExcel(
  filtros: FiltrosExport = {},
  localData?: any[]
): Promise<void> {
  const datos = await fetchDatos(filtros, localData);
  if (!datos.length) {
    alert('Sin registros para los filtros seleccionados.');
    return;
  }
  const logoBuffer = await loadLogoBuffer();

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
          a.download = `Metrados_${fecha}.xlsx`;
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
      worker.postMessage({ type: 'METRADOS', datos, filtros, logoBuffer });
    });
  } else {
    const wb = await buildWorkbook(datos, logoBuffer);
    const fecha = new Date().toISOString().slice(0, 10);
    await downloadBlob(wb, `Metrados_${fecha}.xlsx`);
  }
}