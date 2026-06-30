import { useState, useMemo, useEffect } from 'react';
import { usePersonalStore } from '../store/usePersonalStore';
import { Search, X } from 'lucide-react';

export function PersonalMultiSelect({ especialidadActual, cuadrillaFilter }: { especialidadActual: string; cuadrillaFilter?: string }) {
  const { obreros, fetchPersonal, selectedObrerosIds, addObreroId, removeObreroId, isLoading } = usePersonalStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (obreros.length === 0) fetchPersonal();
  }, []);

  const seleccionados = obreros.filter(o => selectedObrerosIds.includes(o.id));

  const sugerencias = useMemo(() => {
    if (searchTerm.length < 2) return [];
    
    // Filtrar por especialidad si showAll es false
    const filtradosEspecialidad = showAll 
      ? obreros 
      : obreros.filter(o => !especialidadActual || o.especialidad?.toLowerCase().includes(especialidadActual.toLowerCase()));

    // Filtrar por busqueda (nombre o DNI)
    const lowerSearch = searchTerm.toLowerCase();
    const filtradosBusqueda = filtradosEspecialidad.filter(o => 
      o.nombres_completos?.toLowerCase().includes(lowerSearch) || 
      o.dni?.includes(lowerSearch)
    );

    // Excluir los que ya estan seleccionados
    const noSeleccionados = filtradosBusqueda.filter(o => !selectedObrerosIds.includes(o.id));

    // Tope de 30 para rendimiento
    return noSeleccionados.slice(0, 30);
  }, [obreros, searchTerm, showAll, especialidadActual, selectedObrerosIds]);

  const obrerosCuadrillaRapida = useMemo(() => {
    if (!cuadrillaFilter) return [];
    const filtros = cuadrillaFilter.split(',').map(s => s.trim()).filter(Boolean);
    if (filtros.length === 0) return [];
    
    return obreros.filter(o => {
      // Validamos estrictamente contra el array relacional para que coincida 100% con "Gestión de Personal"
      const match = filtros.some(f => o.cuadrillas_asignadas?.includes(f));
      return match && !selectedObrerosIds.includes(o.id);
    });
  }, [obreros, cuadrillaFilter, selectedObrerosIds]);



  return (
    <div className="w-full">
      {/* Píldoras seleccionadas */}
      {seleccionados.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {seleccionados.map(o => (
            <div key={o.id} className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-full pl-2.5 pr-1.5 py-1">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-blue-900 leading-tight">{o.nombres_completos}</span>
                <span className="text-[9px] text-blue-600 leading-tight">{o.categoria_laboral}</span>
              </div>
              <button 
                onClick={() => removeObreroId(o.id)}
                className="p-0.5 hover:bg-blue-200 rounded-full text-blue-400 hover:text-blue-700 transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder={isLoading ? "Cargando personal..." : `Buscar obrero...`}
          className="w-full pl-7 pr-3 py-1.5 text-xs rounded border outline-none focus:ring-1 focus:ring-blue-500 border-gray-200"
        />
        
        {/* Toggle para ver a todos */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <input 
            type="checkbox" 
            id="showAllObs" 
            checked={showAll} 
            onChange={e => setShowAll(e.target.checked)} 
            className="w-3 h-3"
          />
          <label htmlFor="showAllObs" className="text-[9px] text-gray-500 cursor-pointer">Ver todos</label>
        </div>

        {/* Dropdown sugerencias buscador manual */}
        {sugerencias.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-40 overflow-y-auto">
            {sugerencias.map(o => (
              <div 
                key={o.id}
                onClick={() => {
                  addObreroId(o.id);
                  setSearchTerm('');
                }}
                className="px-2 py-1.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
              >
                <div className="text-[11px] font-medium text-gray-800">{o.nombres_completos}</div>
                <div className="text-[9px] text-gray-500 flex gap-2">
                  <span>DNI: {o.dni}</span>
                  <span>•</span>
                  <span>{o.categoria_laboral}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sugerencias Rápidas de Cuadrilla (Botones) */}
      {obrerosCuadrillaRapida.length > 0 && (
        <div className="mt-2.5">
          <div className="text-[9px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
            Disponible en Cuadrilla(s):
          </div>
          <div className="flex flex-wrap gap-1.5">
            {obrerosCuadrillaRapida.map(o => (
              <button
                key={o.id}
                type="button"
                onClick={() => addObreroId(o.id)}
                className="flex items-center gap-1 bg-white border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 rounded pl-1.5 pr-2 py-0.5 text-left transition-colors"
              >
                <span className="text-gray-400 font-bold text-[10px]">+</span>
                <span className="text-[10px] text-gray-600 font-medium">{o.nombres_completos}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
