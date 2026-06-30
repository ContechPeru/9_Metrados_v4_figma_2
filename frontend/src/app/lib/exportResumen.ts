import * as ExcelJS from 'exceljs';
import { supabase } from './supabase';
import { useMetradosStore } from '../store/useMetradosStore';
import type { FiltrosExport } from './export1';

const C = {
  HDR_COL_BG: 'FF1B4F82',
  HDR_COL_FG: 'FFFFFFFF',
  ROW_ODD: 'FFFFFFFF',
  ROW_EVEN: 'FFE9F1FB',
  DATA_FG: 'FF2D3748',
  BORDER_CLR: 'FFBDC7D8',
  BIEN_BG: 'FFC5D9F1',
  ACT_BG: 'FFC00000',
  ACT_FG: 'FFFFFFFF',
  MANUAL_BG: 'FFFFF2CC' // Light yellow for manual entry
};

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

// Lógica para obtener los metrados
async function fetchDatosResumen(filtros: FiltrosExport, localData?: any[]) {
  const { data: espData } = await supabase.from('especialidades').select('nombre, codigo');

  let metrados = [];
  let partidasData = [];

  if (localData && localData.length > 0) {
    const store = useMetradosStore.getState();
    const partidasMap = new Map(store.partidas.map(p => [p.id, p]));
    metrados = localData.map((m: any) => {
      const p = partidasMap.get(m.partida_id);
      const precio_unitario = p?.precio_unitario_base || p?.pu_actual || 0;
      const monto_total = (m.resultado_total || 0) * precio_unitario;
      let fecha_obj = null;
      if (m.fecha_ejecucion) {
        const [y, mm, d] = m.fecha_ejecucion.split('-');
        fecha_obj = new Date(parseInt(y), parseInt(mm) - 1, parseInt(d));
      }
      return { ...m, precio_unitario, monto_total, fecha_obj };
    });
  } else {
    const { data: pData, error: errP } = await supabase.from('catalogo_partidas').select('*');
    if (errP) throw new Error(errP.message);
    partidasData = pData || [];

    let q = supabase
      .from('registro_metrados')
      .select('*')
      .order('fecha_ejecucion', { ascending: true });

    if (filtros.especialidad) q = q.eq('especialidad', filtros.especialidad);
    if (filtros.fechaDesde) q = q.gte('fecha_ejecucion', filtros.fechaDesde);
    if (filtros.fechaHasta) q = q.lte('fecha_ejecucion', filtros.fechaHasta);

    const { data: mData, error } = await q;
    if (error) throw new Error(error.message);

    metrados = (mData ?? []).map((m: any) => {
      const p = partidasData.find((pt: any) => pt.id === m.partida_id);
      const precio_unitario = p?.precio_unitario_base || p?.pu_actual || 0;
      const monto_total = (m.resultado_total || 0) * precio_unitario;

      return {
        ...m,
        precio_unitario,
        monto_total,
        fecha_obj: m.fecha_ejecucion ? new Date(m.fecha_ejecucion) : null
      };
    });
  }

  return { metrados, especialidades: espData || [] };
}

export async function exportarResumenExcel(filtros: FiltrosExport = {}, localData?: any[]): Promise<void> {
  const { metrados, especialidades } = await fetchDatosResumen(filtros, localData);

  if (!metrados.length) {
    alert('Sin registros para exportar en este resumen.');
    return;
  }

  // Determinar mes y año objetivo
  let targetYear = new Date().getFullYear();
  let targetMonth = new Date().getMonth(); // 0-index

  if (filtros.fechaDesde) {
    const [y, m, d] = filtros.fechaDesde.split('-');
    targetYear = parseInt(y);
    targetMonth = parseInt(m) - 1;
  } else if (metrados[0]?.fecha_obj) {
    targetYear = metrados[0].fecha_obj.getFullYear();
    targetMonth = metrados[0].fecha_obj.getMonth();
  }

  // Formato MM (ej: 05)
  const padMonth = (targetMonth + 1).toString().padStart(2, '0');
  
  // Días del mes final
  const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

  // Nombres y rangos de las semanas
  const weekRanges = [
    { name: 'SEMANA 1', start: 1, end: 7, label: `SEMANA 1\n(01/${padMonth} - 07/${padMonth})` },
    { name: 'SEMANA 2', start: 8, end: 14, label: `SEMANA 2\n(08/${padMonth} - 14/${padMonth})` },
    { name: 'SEMANA 3', start: 15, end: 21, label: `SEMANA 3\n(15/${padMonth} - 21/${padMonth})` },
    { name: 'SEMANA 4', start: 22, end: 28, label: `SEMANA 4\n(22/${padMonth} - 28/${padMonth})` },
    { name: 'SEMANA 5', start: 29, end: lastDayOfMonth, label: `SEMANA 5\n(29/${padMonth} - ${lastDayOfMonth.toString().padStart(2, '0')}/${padMonth})` },
  ];

  const wb = new ExcelJS.Workbook();
  wb.creator = 'App Metrados';
  wb.created = new Date();

  const wsRes = wb.addWorksheet('Resumen General', { views: [{ showGridLines: false }] });

  const hoy = new Date();
  const resumenEsp = new Map<string, any>();

  // Iniciar todas las especialidades disponibles o encontradas
  const especialidadesSet = new Set(especialidades.map((e:any) => e.nombre));
  metrados.forEach(m => {
    if (m.especialidad) especialidadesSet.add(m.especialidad);
  });

  const especialidadesKeys = Array.from(especialidadesSet).sort();
  especialidadesKeys.forEach(esp => {
    resumenEsp.set(esp as string, {
      ultimaFecha: null as Date | null,
      hasCuadrillas: false,
      semanas: {
        'SEMANA 1': 0,
        'SEMANA 2': 0,
        'SEMANA 3': 0,
        'SEMANA 4': 0,
        'SEMANA 5': 0,
      } as Record<string, number>,
      totalMes: 0
    });
  });

  // Procesar metrados sumando SOLO si coinciden con el Mes Objetivo
  metrados.forEach(m => {
    const esp = m.especialidad || 'SIN ESPECIALIDAD';
    if (!resumenEsp.has(esp)) return;

    const r = resumenEsp.get(esp);

    // Actualizar última fecha sin importar el mes
    if (!r.ultimaFecha || (m.fecha_obj && m.fecha_obj > r.ultimaFecha)) {
      r.ultimaFecha = m.fecha_obj;
    }

    if (m.cuadrilla && m.cuadrilla !== '-' && m.cuadrilla.trim() !== '') {
      r.hasCuadrillas = true;
    }

    // Filtrar para sumar SOLO el mes objetivo
    if (m.fecha_obj && m.fecha_obj.getFullYear() === targetYear && m.fecha_obj.getMonth() === targetMonth) {
      const d = m.fecha_obj.getDate();
      let assignedWeek = '';
      
      for (const w of weekRanges) {
        if (d >= w.start && d <= w.end) {
          assignedWeek = w.name;
          break;
        }
      }

      if (assignedWeek) {
        r.semanas[assignedWeek] += (m.monto_total || 0);
        r.totalMes += (m.monto_total || 0);
      }
    }
  });

  const headersRes = [
    { label: 'ESPECIALIDAD', width: 25 },
    { label: 'REGISTRO TRIMBLE', width: 18 },
    { label: 'REG. PROGRAMA', width: 18 },
    { label: 'PLAZO', width: 15 },
    { label: 'CUADRILLAS', width: 15 },
    { label: 'INF. SEM 2', width: 12 },
    ...weekRanges.map(w => ({ label: w.label, width: 15 })),
    { label: 'VALORIZACIONES', width: 20 }
  ];

  headersRes.forEach((h, i) => {
    const col = wsRes.getColumn(i + 1);
    col.width = h.width;
    const cell = wsRes.getCell(1, i + 1);
    cell.value = h.label;
    cell.font = fnt(C.HDR_COL_FG, 9, true);
    cell.fill = fill(C.HDR_COL_BG);
    cell.alignment = aln('center', true);
    cell.border = brd();
  });

  let rIdx = 2;
  especialidadesKeys.forEach(esp => {
    const rData = resumenEsp.get(esp as string);
    const row = wsRes.getRow(rIdx);
    
    // Lógica Plazo
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

    let regProgramaStr = '';
    if (rData.ultimaFecha) {
      const d = rData.ultimaFecha.getDate().toString().padStart(2, '0');
      const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const mName = monthNames[rData.ultimaFecha.getMonth()];
      regProgramaStr = `${d}-${mName}`;
    }

    row.getCell(3).value = regProgramaStr;
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
    weekRanges.forEach((w) => {
      const v = rData.semanas[w.name] || 0;
      row.getCell(colBase).value = v;
      row.getCell(colBase).numFmt = '"S/"#,##0.00';
      colBase++;
    });

    row.getCell(colBase).value = rData.totalMes;
    row.getCell(colBase).numFmt = '"S/"#,##0.00';
    // El verde claro para valorizaciones: '#C6E0B4'
    row.getCell(colBase).fill = fill('FFC6E0B4');
    row.getCell(colBase).font = fnt('FF006100', 9, true);

    for(let i=2; i<=colBase; i++){
       if(i!==4 && i !== colBase) row.getCell(i).border = brd();
       if (i === colBase) row.getCell(i).border = brd(); // Para el fill
    }
    rIdx++;
  });

  // Fila Total Resumen
  const totalRow = wsRes.getRow(rIdx);
  totalRow.getCell(6).value = 'TOTAL';
  totalRow.getCell(6).font = fnt(C.DATA_FG, 9, true);
  totalRow.getCell(6).alignment = aln('right');

  let cb = 7;
  weekRanges.forEach(w => {
    const tSem = especialidadesKeys.reduce((acc, e) => acc + (resumenEsp.get(e as string).semanas[w.name] || 0), 0);
    totalRow.getCell(cb).value = tSem;
    totalRow.getCell(cb).numFmt = '"S/"#,##0.00';
    totalRow.getCell(cb).font = fnt(C.DATA_FG, 9, true);
    cb++;
  });
  
  const tGen = especialidadesKeys.reduce((acc, e) => acc + resumenEsp.get(e as string).totalMes, 0);
  totalRow.getCell(cb).value = tGen;
  totalRow.getCell(cb).numFmt = '"S/"#,##0.00';
  totalRow.getCell(cb).font = fnt('FF006100', 9, true);
  totalRow.getCell(cb).fill = fill('FFC6E0B4');
  
  // Guardar archivo
  const fileMonthName = new Intl.DateTimeFormat('es-PE', { month: 'long' }).format(new Date(targetYear, targetMonth, 1));
  await downloadBlob(wb, `Resumen_General_${fileMonthName.toUpperCase()}_${targetYear}.xlsx`);
}
