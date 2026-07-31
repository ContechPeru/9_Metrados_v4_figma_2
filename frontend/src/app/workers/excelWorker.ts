import * as XLSX from 'xlsx';

export interface StagingRow {
  id: number;
  partida_id?: string;
  snapshot_codigo: string;
  snapshot_descripcion: string;
  fecha_ejecucion: string;
  frente_trabajo: string;
  bloque_sector: string;
  nivel_piso: string;
  cuadrilla: string;
  obreros_ids: string[];
  obreros_dnis_raw: string;
  elemento_desc: string;
  detalle_desc: string;
  acero_diametro: string;
  hvac_item_id?: string;
  hvac_tipo_raw: string;
  cantidad_elementos: number;
  medida_largo_area: number;
  medida_ancho_empalme: number;
  medida_alto_gancho: number;
  nro_repeticiones: number;
  resultado_parcial: number;
  resultado_total: number;
  unidad: string;
  especialidad: string;
  _status: 'ok' | 'error' | 'warning';
  _errorMsg?: string;
}

const parseExcelDate = (excelDate: any) => {
  if (!excelDate) return new Date().toISOString().split('T')[0];
  if (typeof excelDate === 'number') {
    const date = new Date((excelDate - (25567 + 2)) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  const str = String(excelDate);
  if (str.includes('/')) {
    const [d, m, y] = str.split('/');
    if (y && m && d) return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return str;
};

self.onmessage = (e: MessageEvent) => {
  try {
    const { binaryString, catalogoPartidas, catalogoObreros } = e.data;

    const wb = XLSX.read(binaryString, { type: 'binary' });
    const wsname = wb.SheetNames[0];
    const ws = wb.Sheets[wsname];
    const rawData = XLSX.utils.sheet_to_json<any>(ws);

    const parsedData: StagingRow[] = rawData.map((row, index) => {
      let status: 'ok' | 'error' | 'warning' = 'ok';
      let errorMsg = '';

      const wbs = row['Codigo_WBS'] || row['codigo_wbs'] || '';
      const partidaMatch = catalogoPartidas.find((p: any) => p.codigo_expediente === wbs);
      
      if (!wbs) {
        status = 'error';
        errorMsg += 'Falta Codigo_WBS. ';
      } else if (!partidaMatch) {
        status = 'error';
        errorMsg += `Partida ${wbs} no encontrada en el catálogo. `;
      }

      const dnisRaw = String(row['DNI_Obreros'] || '');
      const dnisArray = dnisRaw.split(',').map(d => d.trim()).filter(Boolean);
      const obrerosIds: string[] = [];
      const obrerosFaltantes: string[] = [];

      dnisArray.forEach(dni => {
        const match = catalogoObreros.find((o: any) => o.dni === dni);
        if (match) obrerosIds.push(match.id);
        else obrerosFaltantes.push(dni);
      });

      if (obrerosFaltantes.length > 0) {
        status = status === 'error' ? 'error' : 'warning';
        errorMsg += `Obreros no encontrados: ${obrerosFaltantes.join(', ')}. `;
      }

      const cant = Number(row['Cantidad']) || 0;
      const largo = Number(row['Largo_Area']) || 0;
      const ancho = Number(row['Ancho']) || 0;
      const alto = Number(row['Alto']) || 0;
      const veces = Number(row['Veces']) || 0;

      let parcial = cant;
      if (largo !== 0) parcial *= largo;
      if (ancho !== 0) parcial *= ancho;
      if (alto !== 0) parcial *= alto;
      
      const total = parcial * (veces > 0 ? veces : 1);

      return {
        id: index,
        partida_id: partidaMatch?.id,
        snapshot_codigo: wbs,
        snapshot_descripcion: partidaMatch ? partidaMatch.descripcion : (row['Descripcion'] || ''),
        unidad: partidaMatch ? partidaMatch.unidad_medida : 'und',
        especialidad: partidaMatch ? partidaMatch.especialidad : 'General',
        fecha_ejecucion: parseExcelDate(row['Fecha']),
        frente_trabajo: row['Frente'] || '---',
        bloque_sector: row['Sector'] || '---',
        nivel_piso: row['Nivel'] || '',
        cuadrilla: row['Nombre_Cuadrilla'] || '',
        obreros_dnis_raw: dnisRaw,
        obreros_ids: obrerosIds,
        elemento_desc: row['Elemento'] || '---',
        detalle_desc: row['Detalle'] || '',
        acero_diametro: row['Diametro_Acero'] || '',
        hvac_tipo_raw: row['Tipo_HVAC'] || '',
        cantidad_elementos: cant,
        medida_largo_area: largo,
        medida_ancho_empalme: ancho,
        medida_alto_gancho: alto,
        nro_repeticiones: veces,
        resultado_parcial: parcial,
        resultado_total: total,
        _status: status,
        _errorMsg: errorMsg.trim()
      };
    });

    self.postMessage({ success: true, parsedData });
  } catch (error: any) {
    self.postMessage({ success: false, error: error.message });
  }
};
