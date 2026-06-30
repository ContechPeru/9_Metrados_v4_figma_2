/**
 * export1.ts
 * Ubicación: src/app/lib/export1.ts
 */

import ExcelJS from 'exceljs';
import { supabase } from './supabase';
import { useMetradosStore } from '../store/useMetradosStore';
import { usePersonalStore } from '../store/usePersonalStore';

// ─── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  HDR_COL_BG:  'FF1B4F82',
  HDR_COL_FG:  'FFFFFFFF',
  ROW_ODD:     'FFFFFFFF',
  ROW_EVEN:    'FFE9F1FB',
  DATA_FG:     'FF2D3748',
  BORDER_CLR:  'FFBDC7D8',
  RES_HDR_BG:  'FF7AD1D8', // Light teal from image
  RES_HDR_FG:  'FF000000',
  BIEN_BG:     'FFC5D9F1',
  ACT_BG:      'FFC00000',
  ACT_FG:      'FFFFFFFF',
  MANUAL_BG:   'FFFFF2CC' // Light yellow for manual entry
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

// ... existing helpers ...
const getInitials = (name: string): string => {
  if (!name || typeof name !== 'string') return '';
  return name.trim().split(/\s+/).map(word => word[0]).filter(Boolean).join('').toUpperCase();
};

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

// ─── Lógica de Fetch ────────────────────────────────────────────────────────
async function fetchDatos(filtros: FiltrosExport, localData?: any[]) {
  const { data: espData } = await supabase.from('especialidades').select('nombre, codigo');
  const espMap = new Map((espData || []).map((e: any) => [e.nombre, e.codigo]));

  if (localData && localData.length > 0) {
    const store = useMetradosStore.getState();
    const partidasMap = new Map(store.partidas.map(p => [p.id, p]));
    const metrados = localData.map((m: any) => {
      const p = partidasMap.get(m.partida_id);
      const precio_unitario = p?.precio_unitario_base || p?.pu_actual || 0;
      const monto_total = (m.resultado_total || 0) * precio_unitario;
      let fecha_obj = null;
      if (m.fecha_ejecucion) {
        const [y, mm, d] = m.fecha_ejecucion.split('-');
        fecha_obj = new Date(parseInt(y), parseInt(mm) - 1, parseInt(d));
      }
      return {
        ...m,
        precio_unitario,
        monto_total,
        fecha_obj
      };
    });
    return { metrados, partidas: store.partidas, anteriorAcumuladoMap: new Map<string, number>() };
  }

  // Obtener todas las partidas para Hoja 2
  const { data: partidasData, error: errP } = await supabase.from('catalogo_partidas').select('*');
  if (errP) throw new Error(errP.message);

  let q = supabase
    .from('registro_metrados')
    .select(`
      grado, fecha_ejecucion, especialidad, frente_trabajo, bloque_sector,
      nivel_piso, ambiente, cuadrilla, elemento_desc, detalle_desc,
      snapshot_codigo, snapshot_descripcion, partida_id,
      cantidad_elementos, medida_largo_area, medida_ancho_empalme, medida_alto_gancho,
      resultado_parcial, nro_repeticiones, acero_diametro, resultado_total,
      unidad, plano_sist, plano_num, sin_plano, obs_motivo, obs_detalle, firma_ingeniero
    `)
    .order('fecha_ejecucion', { ascending: true });

  if (filtros.especialidad) q = q.eq('especialidad', filtros.especialidad);
  if (filtros.fechaDesde)   q = q.gte('fecha_ejecucion', filtros.fechaDesde);
  if (filtros.fechaHasta)   q = q.lte('fecha_ejecucion', filtros.fechaHasta);

  const { data: metradosData, error } = await q;
  if (error) throw new Error(error.message);

  const metrados = (metradosData ?? []).map((m: any) => {
    const p = partidasData.find((pt:any) => pt.id === m.partida_id);
    const precio_unitario = p?.precio_unitario_base || p?.pu_actual || 0;
    const monto_total = (m.resultado_total || 0) * precio_unitario;

    return {
      ...m,
      precio_unitario,
      monto_total,
      fecha_obj: m.fecha_ejecucion ? new Date(m.fecha_ejecucion) : null
    };
  });

  // 1. Obtener Acumulado Anterior
  const anteriorAcumuladoMap = new Map<string, number>();
  if (filtros.fechaDesde) {
    const { data: antData } = await supabase
      .from('registro_metrados')
      .select('partida_id, resultado_total')
      .lt('fecha_ejecucion', filtros.fechaDesde);
    if (antData) {
      antData.forEach((row: any) => {
        anteriorAcumuladoMap.set(row.partida_id, (anteriorAcumuladoMap.get(row.partida_id) || 0) + (row.resultado_total || 0));
      });
    }
  }

  return { metrados, partidas: partidasData || [], anteriorAcumuladoMap };
}

// ─── Helper para descargar ──────────────────────────────────────────────────
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

// ─── Generador Principal ────────────────────────────────────────────────────

function addHojaFormato711(wb: ExcelJS.Workbook, metrados: any[], partidas: any[], antAcumMap: Map<string, number>, filtros: FiltrosExport) {
  const ws = wb.addWorksheet('FORMATO 7-11', { views: [{ showGridLines: false }] });
  
  // Días del mes a partir de filtros.fechaDesde (asume mes actual si no hay)
  let year = new Date().getFullYear();
  let month = new Date().getMonth();
  if (filtros.fechaDesde) {
    const [y, m, d] = filtros.fechaDesde.split('-');
    year = parseInt(y);
    month = parseInt(m) - 1;
  }
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayLetters = ['D', 'L', 'M', 'Mi', 'J', 'V', 'S'];

  // Columnas: A-B-C-D-E (5) + 31 dias (36) + AK-AL-AM (39 cols)
  ws.getColumn('A').width = 15;
  ws.getColumn('B').width = 45;
  ws.getColumn('C').width = 6;
  ws.getColumn('D').width = 10;
  ws.getColumn('E').width = 12;
  for(let i=1; i<=31; i++) ws.getColumn(5+i).width = 4;
  ws.getColumn(37).width = 12; // AK
  ws.getColumn(38).width = 12; // AL
  ws.getColumn(39).width = 10; // AM

  // Cabeceras Superiores
  ws.getCell('A1').value = 'FORMATO - 7 - 11';
  ws.getCell('A1').font = fnt(C.HDR_COL_FG, 12, true);
  
  ws.getCell('A6').value = 'HOJA DE METRADOS DIARIOS - MES ACTUAL';
  ws.getCell('A6').font = fnt(C.DATA_FG, 10, true);
  ws.mergeCells('A6:AM6');
  
  ws.getCell('A7').value = 'OBRA';
  ws.getCell('B7').value = ' : "MEJORAMIENTO Y AMPLIACION DE LOS SERVICIOS DE SALUD DEL ESTABLECIMIENTO DE SALUD DE BELEMPAMPA"'; // Puedes cambiarlo a dinamico si tienes el nombre
  ws.getCell('A8').value = 'META';
  ws.getCell('B8').value = ' : #REF!';

  // Fila 10: Nombres de las columnas
  const headers = ['ÍTEM', 'DESCRIPCIÓN', 'UND', 'METRADO', 'ANTERIOR ACUMULADO'];
  for(let i=0; i<headers.length; i++) {
    const cell = ws.getCell(10, i+1);
    cell.value = headers[i];
    cell.font = fnt(C.HDR_COL_FG, 8, true);
    cell.fill = fill(C.HDR_COL_BG);
    cell.alignment = aln('center', true);
    cell.border = brd();
    if(i !== 4) ws.mergeCells(10, i+1, 12, i+1);
  }
  
  ws.getCell(10, 6).value = '+';
  ws.getCell(10, 6).font = fnt(C.HDR_COL_FG, 8, true);
  ws.getCell(10, 6).fill = fill(C.HDR_COL_BG);
  ws.getCell(10, 6).alignment = aln('center');
  ws.getCell(10, 6).border = brd();
  ws.mergeCells(10, 6, 10, 36);

  const endHeaders = [
    { label: 'METRADO ACTUAL', col: 37 },
    { label: 'METRADO ACUMULADO', col: 38 },
    { label: 'SALDO', col: 39 }
  ];
  endHeaders.forEach(eh => {
    const cell = ws.getCell(10, eh.col);
    cell.value = eh.label;
    cell.font = fnt(C.HDR_COL_FG, 8, true);
    cell.fill = fill(C.HDR_COL_BG);
    cell.alignment = aln('center', true);
    cell.border = brd();
    ws.mergeCells(10, eh.col, 12, eh.col);
  });

  // Fila 11 y 12: Días de la semana y días del mes
  for(let i=1; i<=31; i++) {
    const col = 5 + i;
    const c11 = ws.getCell(11, col);
    const c12 = ws.getCell(12, col);
    if(i <= daysInMonth) {
       const date = new Date(year, month, i);
       c11.value = dayLetters[date.getDay()];
       c12.value = i;
    } else {
       c11.value = ''; c12.value = '';
    }
    [c11, c12].forEach(c => {
       c.font = fnt(C.HDR_COL_FG, 8, true);
       c.fill = fill(C.HDR_COL_BG);
       c.alignment = aln('center');
       c.border = brd();
    });
  }
  // Ajustar borde "ANTERIOR ACUMULADO" fila 11 y 12
  ws.mergeCells(11, 5, 12, 5);
  const cellE11 = ws.getCell(11, 5);
  cellE11.border = brd(); cellE11.fill = fill(C.HDR_COL_BG);

  // Group metrados
  const dailyMap = new Map<string, number[]>();
  metrados.forEach(m => {
    if(m.fecha_ejecucion) {
      const [yy, mm, dd] = m.fecha_ejecucion.split('-');
      const d = parseInt(dd);
      if(!dailyMap.has(m.partida_id)) dailyMap.set(m.partida_id, new Array(31).fill(0));
      dailyMap.get(m.partida_id)![d - 1] += m.resultado_total || 0;
    }
  });

  let r = 13;
  partidas.sort((a, b) => (a.codigo_expediente||'').localeCompare(b.codigo_expediente||'')).forEach(p => {
    const isAgrupador = p.es_agrupador;
    const row = ws.getRow(r);
    
    row.getCell(1).value = p.codigo_expediente;
    row.getCell(2).value = p.descripcion;
    row.getCell(3).value = p.unidad_medida || '';

    if (isAgrupador) {
       row.font = fnt(C.DATA_FG, 8, true);
       for(let c=1; c<=39; c++) {
          row.getCell(c).fill = fill(C.SUB_BG);
          row.getCell(c).border = brd();
       }
    } else {
       row.font = fnt(C.DATA_FG, 8, false);
       const qtyBase = 0; // Default a 0 por ahora hasta que agreguemos cantidad_base a la bd
       const antAcum = antAcumMap.get(p.id) || 0;
       const daily = dailyMap.get(p.id) || new Array(31).fill(0);
       const sumActual = daily.reduce((a, b) => a + b, 0);
       const sumAcumulado = antAcum + sumActual;
       const saldo = qtyBase - sumAcumulado;

       row.getCell(4).value = qtyBase;
       row.getCell(5).value = antAcum;
       
       for(let i=0; i<31; i++) {
          if (daily[i] > 0) row.getCell(6+i).value = daily[i];
          else row.getCell(6+i).value = '';
       }

       row.getCell(37).value = sumActual;
       row.getCell(38).value = sumAcumulado;
       row.getCell(39).value = saldo;

       // Formatear números
       [4, 5, 37, 38, 39].forEach(c => row.getCell(c).numFmt = '#,##0.00');
       for(let i=0; i<31; i++) row.getCell(6+i).numFmt = '#,##0.00';

       for(let c=1; c<=39; c++) {
          row.getCell(c).fill = fill(r % 2 === 0 ? C.ROW_EVEN : C.ROW_ODD);
          row.getCell(c).border = brd();
       }
    }
    r++;
  });
}


export async function exportarFormato1Excel(filtros: FiltrosExport = {}, localData?: any[]): Promise<void> {
  const { metrados, partidas, anteriorAcumuladoMap } = await fetchDatos(filtros, localData);

  if (!metrados.length && !partidas.length) {
    alert('Sin registros para exportar.');
    return;
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'App Metrados';
  wb.created = new Date();

  // Llamar al nuevo formato
  if (anteriorAcumuladoMap) {
    addHojaFormato711(wb, metrados, partidas, anteriorAcumuladoMap, filtros);
  }

  // ══════════════════════════════════════════════════════════════
  // HOJA 1: Resumen General (Trimble / Programa)
  // ══════════════════════════════════════════════════════════════
  const wsRes = wb.addWorksheet('Resumen General', { views: [{ showGridLines: false }] });
  
  // Analizar datos para semanas
  const hoy = new Date();
  const resumenEsp = new Map<string, any>();
  
  const semanasOrdenadas = ['SEMANA 1', 'SEMANA 2', 'SEMANA 3', 'SEMANA 4', 'SEMANA 5'];

  metrados.forEach(m => {
    const esp = m.especialidad || 'SIN ESPECIALIDAD';
    if (!resumenEsp.has(esp)) {
      resumenEsp.set(esp, {
        ultimaFecha: null,
        total: 0,
        hasCuadrillas: false,
        semanas: {}
      });
    }
    const r = resumenEsp.get(esp);
    if (!r.ultimaFecha || (m.fecha_obj && m.fecha_obj > r.ultimaFecha)) {
      r.ultimaFecha = m.fecha_obj;
    }
    if (m.cuadrilla && m.cuadrilla !== '-' && m.cuadrilla.trim() !== '') {
      r.hasCuadrillas = true;
    }
    r.total += (m.monto_total || 0);
    
    if (m.fecha_obj) {
      const dayOfMonth = m.fecha_obj.getDate();
      let weekNum = Math.ceil(dayOfMonth / 7);
      if (weekNum > 5) weekNum = 5;
      const weekStr = `SEMANA ${weekNum}`;
      r.semanas[weekStr] = (r.semanas[weekStr] || 0) + (m.monto_total || 0);
    }
  });

  const headersRes = [
    { label: 'ESPECIALIDAD', width: 25 },
    { label: 'REGISTRO TRIMBLE', width: 18 },
    { label: 'REG. PROGRAMA', width: 18 },
    { label: 'PLAZO', width: 15 },
    { label: 'CUADRILLAS', width: 15 },
    { label: 'INF. SEM 2', width: 12 },
    ...semanasOrdenadas.map(s => ({ label: s, width: 15 })),
    { label: 'VALORIZACIONES', width: 20 }
  ];

  headersRes.forEach((h, i) => {
    const col = wsRes.getColumn(i + 1);
    col.width = h.width;
    const cell = wsRes.getCell(1, i + 1);
    cell.value = h.label;
    cell.font = fnt(C.RES_HDR_FG, 9, true);
    cell.fill = fill(C.RES_HDR_BG);
    cell.alignment = aln('center', true);
    cell.border = brd();
  });

  let rIdx = 2;
  const especialidadesKeys = Array.from(resumenEsp.keys()).sort();
  
  especialidadesKeys.forEach(esp => {
    const rData = resumenEsp.get(esp);
    const row = wsRes.getRow(rIdx);
    
    const trimbleStr = rData.ultimaFecha ? rData.ultimaFecha.toLocaleDateString('es-PE') : '-';
    // Lógica Plazo: si hace más de 3 días que no hay registro, ACTUALIZAR
    let plazoText = 'BIEN';
    let isAct = false;
    if (rData.ultimaFecha) {
      const diffTime = Math.abs(hoy.getTime() - rData.ultimaFecha.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 3) {
        plazoText = 'ACTUALIZAR';
        isAct = true;
      }
    } else {
      plazoText = 'FALSE';
    }

    row.getCell(1).value = esp;
    row.getCell(1).font = fnt('FF1A4B82', 9, true);
    row.getCell(1).fill = fill('FFE8F0F8');
    row.getCell(1).border = brd();

    row.getCell(2).value = '';
    row.getCell(2).fill = fill(C.MANUAL_BG);
    row.getCell(2).border = brd();
    row.getCell(2).alignment = aln('center');

    row.getCell(3).value = ''; // Reg. Programa manual
    row.getCell(3).fill = fill(C.MANUAL_BG);
    row.getCell(3).border = brd();
    row.getCell(3).alignment = aln('center');
    
    row.getCell(4).value = plazoText;
    if (isAct) {
      row.getCell(4).fill = fill(C.ACT_BG);
      row.getCell(4).font = fnt(C.ACT_FG, 9, true);
    } else {
      row.getCell(4).fill = fill(C.BIEN_BG);
    }
    row.getCell(4).border = brd();
    row.getCell(4).alignment = aln('center');

    row.getCell(5).value = rData.hasCuadrillas ? 'SI' : 'NO';
    row.getCell(5).border = brd();
    row.getCell(5).alignment = aln('center');

    row.getCell(6).value = ''; // Inf Sem manual
    row.getCell(6).fill = fill(C.MANUAL_BG);
    row.getCell(6).border = brd();
    row.getCell(6).alignment = aln('center');

    let colBase = 7;
    semanasOrdenadas.forEach((sw) => {
      const v = rData.semanas[sw] || 0;
      row.getCell(colBase).value = v;
      row.getCell(colBase).numFmt = '"S/"#,##0.00';
      colBase++;
    });

    row.getCell(colBase).value = rData.total;
    row.getCell(colBase).numFmt = '"S/"#,##0.00';
    row.getCell(colBase).font = fnt(C.DATA_FG, 9, true);

    for(let i=2; i<=colBase; i++){
       if(i!==4) row.getCell(i).border = brd();
    }
    rIdx++;
  });

  // Fila Total Resumen
  const totalRow = wsRes.getRow(rIdx);
  totalRow.getCell(6).value = 'TOTAL';
  totalRow.getCell(6).font = fnt(C.DATA_FG, 9, true);
  totalRow.getCell(6).alignment = aln('right');

  let cb = 7;
  semanasOrdenadas.forEach(sw => {
    const tSem = especialidadesKeys.reduce((acc, e) => acc + (resumenEsp.get(e).semanas[sw] || 0), 0);
    totalRow.getCell(cb).value = tSem;
    totalRow.getCell(cb).numFmt = '"S/"#,##0.00';
    totalRow.getCell(cb).font = fnt(C.DATA_FG, 9, true);
    cb++;
  });
  const tGen = especialidadesKeys.reduce((acc, e) => acc + resumenEsp.get(e).total, 0);
  totalRow.getCell(cb).value = tGen;
  totalRow.getCell(cb).numFmt = '"S/"#,##0.00';
  totalRow.getCell(cb).font = fnt(C.DATA_FG, 9, true);
  totalRow.getCell(cb).fill = fill('FFF2F2F2');

  // ══════════════════════════════════════════════════════════════
  // HOJA 2: PARTIDAS (Presupuesto)
  // ══════════════════════════════════════════════════════════════
  const wsP = wb.addWorksheet('Partidas', { views: [{ showGridLines: false }] });
  
  // Agregar totales por partida
  const partidasMap = new Map();
  metrados.forEach(m => {
     const pid = m.partida_id;
     if(!pid) return;
     if(!partidasMap.has(pid)) {
        partidasMap.set(pid, { qty: 0, val: 0 });
     }
     const current = partidasMap.get(pid);
     current.qty += (m.resultado_total || 0);
     current.val += (m.monto_total || 0);
  });

  const pHeaders = [
    { label: 'CÓDIGO', width: 15 },
    { label: 'DESCRIPCIÓN', width: 50 },
    { label: 'UND', width: 8 },
    { label: 'P.U. BASE', width: 12 },
    { label: 'METRADO EJECUTADO', width: 15 },
    { label: 'MONTO EJECUTADO', width: 15 }
  ];

  pHeaders.forEach((h, i) => {
    wsP.getColumn(i+1).width = h.width;
    wsP.getCell(1, i+1).value = h.label;
    wsP.getCell(1, i+1).font = fnt(C.HDR_COL_FG, 9, true);
    wsP.getCell(1, i+1).fill = fill(C.HDR_COL_BG);
    wsP.getCell(1, i+1).alignment = aln('center');
  });

  partidas.sort((a:any, b:any) => (a.codigo_expediente||'').localeCompare(b.codigo_expediente||'')).forEach((p:any, i:number) => {
    const row = wsP.getRow(i+2);
    const metrics = partidasMap.get(p.id) || { qty:0, val:0 };
    const pu = p.precio_unitario_base || p.pu_actual || 0;
    
    row.getCell(1).value = p.codigo_expediente;
    row.getCell(2).value = p.descripcion;
    row.getCell(3).value = p.unidad_medida;
    row.getCell(4).value = pu;
    row.getCell(5).value = metrics.qty;
    row.getCell(6).value = metrics.val;

    if (p.es_agrupador) {
       row.font = fnt(C.DATA_FG, 9, true);
       row.getCell(2).value = p.descripcion.toUpperCase();
       row.getCell(2).fill = fill(C.SUB_BG);
    } else {
       row.font = fnt(C.DATA_FG, 9);
       row.getCell(4).numFmt = '"S/"#,##0.00';
       row.getCell(5).numFmt = '#,##0.00';
       row.getCell(6).numFmt = '"S/"#,##0.00';
    }
  });


  // ══════════════════════════════════════════════════════════════
  // HOJA 3: REGISTRO DETALLADO
  // ══════════════════════════════════════════════════════════════
  const wsD = wb.addWorksheet('Registro Detallado', { views: [{ showGridLines: false }] });
  const dHeaders = [
    { key: 'fecha', label: 'FECHA', width: 12 },
    { key: 'esp', label: 'ESPECIALIDAD', width: 15 },
    { key: 'ubi', label: 'UBICACIÓN', width: 30 },
    { key: 'par', label: 'PARTIDA', width: 40 },
    { key: 'det', label: 'DETALLE', width: 30 },
    { key: 'und', label: 'UND', width: 8 },
    { key: 'qty', label: 'METRADO', width: 12 },
    { key: 'pu', label: 'P.U.', width: 12 },
    { key: 'monto', label: 'MONTO', width: 15 }
  ];

  dHeaders.forEach((h, i) => {
    wsD.getColumn(i+1).width = h.width;
    wsD.getCell(1, i+1).value = h.label;
    wsD.getCell(1, i+1).font = fnt(C.HDR_COL_FG, 9, true);
    wsD.getCell(1, i+1).fill = fill(C.HDR_COL_BG);
    wsD.getCell(1, i+1).alignment = aln('center');
  });

  metrados.forEach((m, i) => {
    const row = wsD.getRow(i+2);
    row.getCell(1).value = m.fecha_obj || '';
    if (m.fecha_obj) row.getCell(1).numFmt = 'dd/mm';
    row.getCell(2).value = m.especialidad;
    row.getCell(3).value = [m.frente_trabajo, m.bloque_sector, m.nivel_piso, m.ambiente].filter(Boolean).join(' - ');
    row.getCell(4).value = `${m.snapshot_codigo||''} - ${m.snapshot_descripcion||''}`;
    row.getCell(5).value = [m.elemento_desc, m.detalle_desc].filter(Boolean).join(' / ');
    row.getCell(6).value = m.unidad;
    row.getCell(7).value = m.resultado_total || 0;
    row.getCell(7).numFmt = '#,##0.00';
    row.getCell(8).value = m.precio_unitario || 0;
    row.getCell(8).numFmt = '"S/"#,##0.00';
    row.getCell(9).value = m.monto_total || 0;
    row.getCell(9).numFmt = '"S/"#,##0.00';
    
    const bg = i % 2 === 0 ? C.ROW_ODD : C.ROW_EVEN;
    for(let c=1; c<=9; c++) {
      row.getCell(c).fill = fill(bg);
      row.getCell(c).border = brd();
    }
  });


  // Finalizar
  const fecha = new Date().toISOString().slice(0, 10);
  await downloadBlob(wb, `Exportar_Resumen_y_Detalle_${fecha}.xlsx`);
}
