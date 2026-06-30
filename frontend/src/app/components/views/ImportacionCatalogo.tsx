import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';

interface CatalogoRow {
  id: number;
  codigo_expediente: string;
  descripcion: string;
  es_agrupador: boolean;
  especialidad: string;
  unidad_medida: string;
  cantidad_presupuestada: number | null;
  precio_unitario_base: number | null;
  metrado_programado: number | null;
  metrado_acumulado_anterior: number | null;
  es_adicional: boolean;
  origen: string;
  modificacion?: string;
  tipo_calculo: string;
  _status: 'ok' | 'error' | 'warning';
  _errorMsg?: string;
}

export default function ImportacionCatalogo() {
  const [data, setData] = useState<CatalogoRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [validEspecialidades, setValidEspecialidades] = useState<string[]>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);

  useEffect(() => {
    async function loadDependencies() {
      setIsLoadingCatalogs(true);
      const { data: especialidades } = await supabase.from('especialidades').select('nombre').eq('estado_activo', true);
      if (especialidades) {
        setValidEspecialidades(especialidades.map((e: any) => e.nombre));
      }
      setIsLoadingCatalogs(false);
    }
    loadDependencies();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawData = XLSX.utils.sheet_to_json<any>(ws);

      const parsedData: CatalogoRow[] = rawData.map((row, index) => {
        let status: 'ok' | 'error' | 'warning' = 'ok';
        let errorMsg = '';

        const wbs = row['Item_WBS'] || row['codigo_wbs'] || '';
        const esTitulo = String(row['Es_Titulo'] || '').toUpperCase() === 'SI';
        const especialidad = row['Especialidad'] || '';

        if (!wbs) {
          status = 'error';
          errorMsg += 'Falta Item_WBS. ';
        }

        if (!especialidad) {
           status = 'error';
           errorMsg += 'Falta Especialidad. ';
        } else if (!validEspecialidades.includes(especialidad)) {
           status = 'error';
           errorMsg += `Especialidad "${especialidad}" inválida. `;
        }

        const precio = Number(row['Precio_Unitario_Base']);
        if (esTitulo && precio > 0) {
           status = 'warning';
           errorMsg += 'Un título no debería tener precio unitario. Se ignorará. ';
        }

        return {
          id: index,
          codigo_expediente: wbs,
          descripcion: row['Descripcion'] || '',
          es_agrupador: esTitulo,
          especialidad: especialidad,
          unidad_medida: esTitulo ? '' : (row['Unidad'] || 'und'),
          cantidad_presupuestada: esTitulo ? null : (Number(row['Metrado_Presupuestado']) || null),
          precio_unitario_base: esTitulo ? null : (Number(row['Precio_Unitario_Base']) || null),
          metrado_programado: esTitulo ? null : (Number(row['Metrado_Programado']) || null),
          metrado_acumulado_anterior: esTitulo ? null : (Number(row['Metrado_Ejecutado_Anterior']) || null),
          es_adicional: String(row['Es_Adicional'] || '').toUpperCase() === 'SI',
          origen: row['Origen_Modificacion'] || '',
          modificacion: row['Modificacion'] || '',
          tipo_calculo: row['Tipo_Calculo'] || '',
          _status: status,
          _errorMsg: errorMsg.trim()
        };
      });

      setData(parsedData);
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
    
    const payload = validData.map(d => ({
        codigo_expediente: d.codigo_expediente,
        descripcion: d.descripcion,
        es_agrupador: d.es_agrupador,
        especialidad: d.especialidad,
        unidad_medida: d.unidad_medida,
        cantidad_presupuestada: d.cantidad_presupuestada,
        precio_unitario_base: d.precio_unitario_base,
        metrado_programado: d.metrado_programado,
        metrado_acumulado_anterior: d.metrado_acumulado_anterior,
        es_adicional: d.es_adicional,
        origen: d.origen,
        modificacion: d.modificacion,
        tipo_calculo: d.tipo_calculo
    }));

    // @ts-ignore
    const { data: result, error } = await supabase.rpc('importar_catalogo_batch', { payload });
    
    setIsConsolidating(false);
    if (error) {
      alert('Error al consolidar catálogo: ' + error.message);
    } else {
      alert(`¡Éxito! El Árbol Estructural WBS se ha actualizado y saneado correctamente.`);
      clearData();
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'Item_WBS', 'Descripcion', 'Es_Titulo', 'Especialidad', 'Unidad', 
      'Metrado_Presupuestado', 'Precio_Unitario_Base', 'Metrado_Programado', 
      'Metrado_Ejecutado_Anterior', 'Es_Adicional', 'Origen_Modificacion', 'Modificacion', 'Tipo_Calculo'
    ];
    
    const row1 = ['01', 'ESTRUCTURAS', 'SI', 'Estructuras', '', '', '', '', '', 'NO', '', '', ''];
    const row2 = ['01.01', 'MOVIMIENTO DE TIERRAS', 'SI', 'Estructuras', '', '', '', '', '', 'NO', '', '', ''];
    const row3 = ['01.01.01', 'Excavacion manual de zanjas', 'NO', 'Estructuras', 'm3', '150.50', '45.20', '150.50', '20.00', 'NO', 'Expediente Base', '', 'Estandar'];
    const row4 = ['01.01.02', 'Relleno compactado c/equipo', 'NO', 'Estructuras', 'm3', '85.00', '60.00', '85.00', '0.00', 'NO', 'Expediente Base', 'MM5', 'Estandar'];
    const row5 = ['01.01.03', 'Acero corrugado fy=4200 kg/cm2', 'NO', 'Estructuras', 'kg', '12500.00', '5.50', '12500.00', '0.00', 'SI', 'Adicional N°1', 'PN6', 'Acero'];
    
    // Ejemplos de Instalaciones Mecánicas
    const row6 = ['02', 'INSTALACIONES MECÁNICAS (HVAC)', 'SI', 'Mecánicas', '', '', '', '', '', 'NO', '', '', ''];
    const row7 = ['02.01', 'EQUIPOS PRINCIPALES', 'SI', 'Mecánicas', '', '', '', '', '', 'NO', '', '', ''];
    const row8 = ['02.01.01', 'Suministro e instalación de Chiller 200 TR', 'NO', 'Mecánicas', 'und', '2.00', '185000.00', '2.00', '0.00', 'NO', 'Expediente Base', '', 'Estandar'];
    const row9 = ['02.02', 'REDES DE DISTRIBUCIÓN', 'SI', 'Mecánicas', '', '', '', '', '', 'NO', '', '', ''];
    const row10 = ['02.02.01', 'Ductos de plancha galvanizada e=1/16"', 'NO', 'Mecánicas', 'kg', '4500.00', '25.50', '4500.00', '1500.00', 'NO', 'Expediente Base', '', 'HVAC'];
    const row11 = ['02.02.02', 'Tubería de agua helada negra SCH 40 Ø 6"', 'NO', 'Mecánicas', 'ml', '350.00', '120.00', '350.00', '0.00', 'SI', 'Adicional N°2', '', 'Estandar'];

    const ws = XLSX.utils.aoa_to_sheet([headers, row1, row2, row3, row4, row5, row6, row7, row8, row9, row10, row11]);
    const wscols = headers.map(h => ({ wch: Math.max(h.length + 2, 15) }));
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master_Presupuesto");
    XLSX.writeFile(wb, "Plantilla_Master_Catálogo.xlsx");
  };

  const validCount = data.filter(r => r._status === 'ok' || r._status === 'warning').length;
  const errorCount = data.filter(r => r._status === 'error').length;

  return (
    <div className="flex flex-col h-full bg-[#FAFBFC] overflow-hidden p-6 font-sans">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Módulo de Importación: Catálogo Maestro</h1>
          <p className="text-[#5E748A] text-sm mt-1">Ingesta el Excel oficial para crear el Árbol WBS y sanear los presupuestos y especialidades.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={downloadTemplate}
            className="px-4 py-2 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm font-medium"
          >
            <FileSpreadsheet size={16} /> Descargar Plantilla Master
          </button>

          {data.length > 0 && (
            <>
              <button 
                onClick={clearData}
                className="px-4 py-2 flex items-center gap-2 rounded-lg bg-white border border-[#DDE3EC] text-[#5E748A] hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Trash2 size={16} /> Limpiar
              </button>
              <button 
                onClick={handleConsolidate}
                disabled={errorCount > 0 || isConsolidating}
                className={`px-4 py-2 flex items-center gap-2 rounded-lg text-white transition-colors ${(errorCount > 0 || isConsolidating) ? 'bg-[#9BAFC4] cursor-not-allowed' : 'bg-[#1A6BFF] hover:bg-[#0F4FC8]'}`}
              >
                {isConsolidating ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />} 
                {isConsolidating ? 'Smart Upsert BD...' : 'Smart Upsert BD'}
              </button>
            </>
          )}
        </div>
      </div>

      {isLoadingCatalogs ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
          <p className="text-gray-500">Cargando dependencias...</p>
        </div>
      ) : data.length === 0 ? (
        <div 
          className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all ${isDragging ? 'border-[#1A6BFF] bg-[#E0E9F4]' : 'border-[#DDE3EC] bg-white'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="w-16 h-16 rounded-full bg-[#F0F4F8] flex items-center justify-center mb-4 text-[#1A6BFF]">
            <Upload size={32} />
          </div>
          <h3 className="text-lg font-semibold text-[#1E3A5F] mb-2">Arrastra tu Catálogo Maestro aquí</h3>
          <p className="text-[#5E748A] mb-6">Usa estrictamente la Plantilla Master (.xlsx, .csv)</p>
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
            <div className="bg-white px-4 py-3 rounded-lg border border-[#DDE3EC] flex items-center gap-3 shadow-sm">
              <FileSpreadsheet className="text-[#1A6BFF]" size={20} />
              <div>
                <div className="text-xs text-[#5E748A]">Total Filas</div>
                <div className="font-semibold text-[#1E3A5F]">{data.length}</div>
              </div>
            </div>
            <div className="bg-white px-4 py-3 rounded-lg border border-[#DDE3EC] flex items-center gap-3 shadow-sm">
              <CheckCircle2 className="text-emerald-500" size={20} />
              <div>
                <div className="text-xs text-[#5E748A]">Listas para Sincronizar</div>
                <div className="font-semibold text-emerald-600">{validCount}</div>
              </div>
            </div>
            <div className={`bg-white px-4 py-3 rounded-lg border border-[#DDE3EC] flex items-center gap-3 shadow-sm ${errorCount > 0 ? 'bg-red-50 border-red-200' : ''}`}>
              <AlertCircle className={errorCount > 0 ? "text-red-500" : "text-[#9BAFC4]"} size={20} />
              <div>
                <div className={`text-xs ${errorCount > 0 ? 'text-red-500' : 'text-[#5E748A]'}`}>Bloqueos Críticos</div>
                <div className={`font-semibold ${errorCount > 0 ? 'text-red-600' : 'text-[#1E3A5F]'}`}>{errorCount}</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#DDE3EC] rounded-xl overflow-hidden flex-1 flex flex-col shadow-sm">
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-[#F8FAFC] text-[#5E748A] sticky top-0 border-b border-[#DDE3EC] z-10 shadow-sm">
                  <tr>
                    <th className="py-3 px-4 font-semibold w-12">St</th>
                    <th className="py-3 px-4 font-semibold">WBS</th>
                    <th className="py-3 px-4 font-semibold">Descripción</th>
                    <th className="py-3 px-4 font-semibold">Esp.</th>
                    <th className="py-3 px-4 font-semibold">Tipo</th>
                    <th className="py-3 px-4 font-semibold text-right">PU (S/)</th>
                    <th className="py-3 px-4 font-semibold text-right">Q Presup.</th>
                    <th className="py-3 px-4 font-semibold text-right">Q Ejec. Ant.</th>
                    <th className="py-3 px-4 font-semibold text-center">Adicional</th>
                    <th className="py-3 px-4 font-semibold">Observación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE3EC]">
                  {data.map(row => (
                    <tr key={row.id} className={`hover:bg-[#F8FAFC] transition-colors ${row._status === 'error' ? 'bg-red-50/50' : row._status === 'warning' ? 'bg-yellow-50/50' : ''}`}>
                      <td className="py-2.5 px-4">
                        {row._status === 'ok' ? (
                          <CheckCircle2 size={16} className="text-emerald-600" />
                        ) : row._status === 'warning' ? (
                          <AlertCircle size={16} className="text-yellow-600" />
                        ) : (
                          <AlertCircle size={16} className="text-red-600" />
                        )}
                      </td>
                      <td className={`py-2.5 px-4 font-mono text-xs ${row.es_agrupador ? 'font-bold text-[#1E3A5F]' : 'text-[#5E748A]'}`}>
                        {row.codigo_expediente}
                      </td>
                      <td className={`py-2.5 px-4 ${row.es_agrupador ? 'font-bold text-[#1E3A5F] uppercase' : 'text-[#334155]'}`}>
                        {row.descripcion} {row.unidad_medida && <span className="text-gray-400 font-normal ml-1">({row.unidad_medida})</span>}
                      </td>
                      <td className="py-2.5 px-4 text-[#334155] text-xs">{row.especialidad}</td>
                      <td className="py-2.5 px-4 text-xs">
                        {row.es_agrupador ? (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Título</span>
                        ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full font-medium">Tarea</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-[#334155] font-mono text-right">{row.precio_unitario_base || '-'}</td>
                      <td className="py-2.5 px-4 text-[#334155] font-mono text-right">{row.cantidad_presupuestada || '-'}</td>
                      <td className="py-2.5 px-4 text-[#334155] font-mono text-right">{row.metrado_acumulado_anterior || '-'}</td>
                      <td className="py-2.5 px-4 text-center">
                          {row.es_adicional ? <span className="text-amber-600 font-bold text-xs">SI</span> : <span className="text-gray-400 text-xs">NO</span>}
                      </td>
                      <td className="py-2.5 px-4">
                        {row._status !== 'ok' && (
                          <span className={`text-xs font-medium ${row._status === 'error' ? 'text-red-600' : 'text-yellow-600'}`}>
                            {row._errorMsg}
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
