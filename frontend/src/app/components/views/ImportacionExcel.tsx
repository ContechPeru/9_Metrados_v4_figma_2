import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';

interface StagingRow {
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

export default function ImportacionExcel() {
  const [data, setData] = useState<StagingRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isConsolidating, setIsConsolidating] = useState(false);
  
  const [catalogoPartidas, setCatalogoPartidas] = useState<any[]>([]);
  const [catalogoObreros, setCatalogoObreros] = useState<any[]>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);

  useEffect(() => {
    async function loadDependencies() {
      setIsLoadingCatalogs(true);
      const [ { data: partidas }, { data: obreros } ] = await Promise.all([
        supabase.from('catalogo_partidas').select('id, codigo_expediente, descripcion, especialidad, unidad_medida').eq('estado_activo', true),
        supabase.from('personal_obrero').select('id, dni, nombres_completos').eq('estado_activo', true)
      ]);
      if (partidas) setCatalogoPartidas(partidas);
      if (obreros) setCatalogoObreros(obreros);
      setIsLoadingCatalogs(false);
    }
    loadDependencies();
  }, []);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const parseExcelDate = (excelDate: any) => {
    if (!excelDate) return new Date().toISOString().split('T')[0];
    if (typeof excelDate === 'number') {
      const date = new Date((excelDate - (25567 + 2)) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    // Si es string "DD/MM/YYYY" o "YYYY-MM-DD"
    const str = String(excelDate);
    if (str.includes('/')) {
      const [d, m, y] = str.split('/');
      if (y && m && d) return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return str;
  };

  const processFile = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      
      const worker = new Worker(new URL('../../workers/excelWorker.ts', import.meta.url), {
        type: 'module'
      });

      worker.onmessage = (e) => {
        setIsProcessing(false);
        if (e.data.success) {
          setData(e.data.parsedData);
        } else {
          alert('Error procesando el Excel: ' + e.data.error);
        }
        worker.terminate();
      };

      worker.postMessage({
        binaryString: bstr,
        catalogoPartidas,
        catalogoObreros
      });
    };
    reader.readAsBinaryString(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const clearData = () => {
    setData([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConsolidate = async () => {
    setIsConsolidating(true);
    const validData = data.filter(r => r._status === 'ok' || r._status === 'warning');
    
    // Payload optimizado para enviar todo el arreglo a la función SQL
    const payload = validData.map(d => {
      const rowClean: any = {
        partida_id: d.partida_id,
        snapshot_codigo: d.snapshot_codigo,
        snapshot_descripcion: d.snapshot_descripcion,
        unidad: d.unidad,
        especialidad: d.especialidad,
        frente_trabajo: d.frente_trabajo,
        bloque_sector: d.bloque_sector,
        nivel_piso: d.nivel_piso,
        cuadrilla: d.cuadrilla,
        elemento_desc: d.elemento_desc,
        detalle_desc: d.detalle_desc,
        acero_diametro: d.acero_diametro,
        cantidad_elementos: d.cantidad_elementos,
        medida_largo_area: d.medida_largo_area,
        medida_ancho_empalme: d.medida_ancho_empalme,
        medida_alto_gancho: d.medida_alto_gancho,
        nro_repeticiones: d.nro_repeticiones,
        resultado_parcial: parseFloat(d.resultado_parcial.toFixed(3)),
        resultado_total: parseFloat(d.resultado_total.toFixed(3)),
        fecha_ejecucion: d.fecha_ejecucion,
      };
      if (d.obreros_ids.length > 0) {
        rowClean.obreros_ids = d.obreros_ids;
      }
      return rowClean;
    });

    // @ts-ignore
    const { data: result, error } = await supabase.rpc('importar_metrados_batch', { payload });
    
    setIsConsolidating(false);
    if (error) {
      alert('Error al consolidar datos: ' + error.message);
    } else {
      // @ts-ignore
      alert(`¡Éxito! Se han consolidado ${result?.inserted || validData.length} metrados y sus obreros.`);
      clearData();
    }
  };

  const validCount = data.filter(r => r._status === 'ok' || r._status === 'warning').length;
  const errorCount = data.filter(r => r._status === 'error').length;

  const downloadTemplate = () => {
    const headers = [
      'Codigo_WBS', 'Descripcion', 'Fecha', 'Frente', 'Sector', 'Nivel', 
      'Nombre_Cuadrilla', 'DNI_Obreros', 'Elemento', 'Detalle', 
      'Diametro_Acero', 'Tipo_HVAC', 'Cantidad', 'Largo_Area', 
      'Ancho', 'Alto', 'Veces'
    ];
    
    // Fila de ejemplo
    const exampleRow = [
      '01.01.01.01', 'Trazo y replanteo inicial', '15/05/2026', 'Hospitalizacion', 'Sector A', 'Piso 1',
      'Cuadrilla Topografía', '72339122, 45221990', 'Eje A-B', 'Trazo de zapatas',
      '', '', '1', '2.5', '1.2', '', ''
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
    
    const wscols = headers.map(h => ({ wch: Math.max(h.length + 2, 12) }));
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Oficial");
    XLSX.writeFile(wb, "Plantilla_Importacion_Metrados.xlsx");
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFBFC] overflow-hidden p-6 font-sans">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Módulo de Importación (Ciclo Completo)</h1>
          <p className="text-[#5E748A] text-sm mt-1">Sube tu Excel para validarlo contra el catálogo oficial e insertar metrados y personal relacional.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={downloadTemplate}
            className="px-4 py-2 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm font-medium"
          >
            <FileSpreadsheet size={16} /> Descargar Plantilla Oficial
          </button>

          {data.length > 0 && (
            <>
              <button 
                onClick={clearData}
                className="px-4 py-2 flex items-center gap-2 rounded-lg bg-slate-100 border border-[#DDE3EC] text-[#5E748A] hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Trash2 size={16} /> Limpiar
              </button>
              <button 
                onClick={handleConsolidate}
                disabled={errorCount > 0 || isConsolidating}
                className={`px-4 py-2 flex items-center gap-2 rounded-lg text-white transition-colors ${(errorCount > 0 || isConsolidating) ? 'bg-[#9BAFC4] cursor-not-allowed' : 'bg-[#1A6BFF] hover:bg-[#0F4FC8]'}`}
              >
                {isConsolidating ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />} 
                {isConsolidating ? 'Consolidando...' : 'Consolidar a BD'}
              </button>
            </>
          )}
        </div>
      </div>

      {isLoadingCatalogs || isProcessing ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
          <p className="text-gray-500">{isProcessing ? "Procesando Excel en segundo plano..." : "Cargando catálogos maestros..."}</p>
        </div>
      ) : data.length === 0 ? (
        <div 
          className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all ${isDragging ? 'border-[#1A6BFF] bg-[#E0E9F4]' : 'border-[#DDE3EC] bg-slate-100'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="w-16 h-16 rounded-full bg-[#F0F4F8] flex items-center justify-center mb-4 text-[#1A6BFF]">
            <Upload size={32} />
          </div>
          <h3 className="text-lg font-semibold text-[#1E3A5F] mb-2">Arrastra tu Excel aquí</h3>
          <p className="text-[#5E748A] mb-6">Usa estrictamente la Plantilla Oficial (.xlsx, .csv)</p>
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2.5 bg-[#1E3A5F] text-white rounded-lg font-medium hover:bg-[#152a45] transition-colors shadow-sm"
          >
            Explorar Archivos
          </button>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex gap-4 mb-4">
            <div className="bg-slate-100 px-4 py-3 rounded-lg border border-[#DDE3EC] flex items-center gap-3 shadow-sm">
              <FileSpreadsheet className="text-[#1A6BFF]" size={20} />
              <div>
                <div className="text-xs text-[#5E748A]">Total Filas</div>
                <div className="font-semibold text-[#1E3A5F]">{data.length}</div>
              </div>
            </div>
            <div className="bg-slate-100 px-4 py-3 rounded-lg border border-[#DDE3EC] flex items-center gap-3 shadow-sm">
              <CheckCircle2 className="text-emerald-500" size={20} />
              <div>
                <div className="text-xs text-[#5E748A]">Listas para Importar</div>
                <div className="font-semibold text-emerald-600">{validCount}</div>
              </div>
            </div>
            <div className={`bg-slate-100 px-4 py-3 rounded-lg border border-[#DDE3EC] flex items-center gap-3 shadow-sm ${errorCount > 0 ? 'bg-red-50 border-red-200' : ''}`}>
              <AlertCircle className={errorCount > 0 ? "text-red-500" : "text-[#9BAFC4]"} size={20} />
              <div>
                <div className={`text-xs ${errorCount > 0 ? 'text-red-500' : 'text-[#5E748A]'}`}>Bloqueos Críticos</div>
                <div className={`font-semibold ${errorCount > 0 ? 'text-red-600' : 'text-[#1E3A5F]'}`}>{errorCount}</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-100 border border-[#DDE3EC] rounded-xl overflow-hidden flex-1 flex flex-col shadow-sm">
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#F8FAFC] text-[#5E748A] sticky top-0 border-b border-[#DDE3EC] z-10 shadow-sm">
                  <tr>
                    <th className="py-3 px-4 font-semibold w-12">Estado</th>
                    <th className="py-3 px-4 font-semibold w-24">Item WBS</th>
                    <th className="py-3 px-4 font-semibold">Descripción Catálogo</th>
                    <th className="py-3 px-4 font-semibold w-24">Fecha</th>
                    <th className="py-3 px-4 font-semibold w-24 text-right">Cant</th>
                    <th className="py-3 px-4 font-semibold w-24 text-right">Total Calculado</th>
                    <th className="py-3 px-4 font-semibold">Obreros</th>
                    <th className="py-3 px-4 font-semibold">Observación de BD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE3EC]">
                  {data.map(row => (
                    <tr key={row.id} className={`hover:bg-[#F8FAFC] transition-colors ${row._status === 'error' ? 'bg-red-50/50' : row._status === 'warning' ? 'bg-yellow-50/50' : ''}`}>
                      <td className="py-2.5 px-4">
                        {row._status === 'ok' ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 size={14} className="text-emerald-600" />
                          </div>
                        ) : row._status === 'warning' ? (
                          <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
                            <AlertCircle size={14} className="text-yellow-600" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertCircle size={14} className="text-red-600" />
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs text-[#1E3A5F]">{row.snapshot_codigo}</td>
                      <td className="py-2.5 px-4 text-[#334155] text-xs">
                        {row.snapshot_descripcion} <span className="text-gray-400">({row.unidad})</span>
                      </td>
                      <td className="py-2.5 px-4 text-[#334155]">{row.fecha_ejecucion}</td>
                      <td className="py-2.5 px-4 text-[#334155] font-mono text-right">{row.cantidad_elementos}</td>
                      <td className="py-2.5 px-4 text-[#334155] font-mono text-right font-semibold">{row.resultado_total.toFixed(3)}</td>
                      <td className="py-2.5 px-4 text-[#334155] text-xs">
                        {row.obreros_ids.length > 0 ? (
                           <span className="text-emerald-600">{row.obreros_ids.length} mapeados</span>
                        ) : (
                           <span className="text-gray-400">Ninguno</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        {row._status === 'error' ? (
                          <span className="text-red-600 text-xs font-medium flex items-center gap-1.5">
                            <AlertCircle size={12} /> {row._errorMsg}
                          </span>
                        ) : row._status === 'warning' ? (
                          <span className="text-yellow-600 text-xs font-medium flex items-center gap-1.5">
                            <AlertCircle size={12} /> {row._errorMsg}
                          </span>
                        ) : (
                          <span className="text-emerald-600 text-xs font-medium flex items-center gap-1.5">
                            Match Perfecto
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
