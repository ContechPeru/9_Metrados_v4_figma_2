import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';

interface Obrero {
  id: string;
  nombres_completos: string;
  dni: string;
  categoria_laboral: string;
  especialidad: string;
}

interface CuadrillaObrerosSelectorProps {
  obreros: Obrero[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  cuadrillaEspecialidades?: string[];
}

export function CuadrillaObrerosSelector({ obreros, selectedIds, onChange, cuadrillaEspecialidades = [] }: CuadrillaObrerosSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);

  const seleccionados = obreros.filter(o => selectedIds.includes(o.id));

  const addObreroId = (id: string) => {
    if (!selectedIds.includes(id)) {
      onChange([...selectedIds, id]);
    }
  };

  const removeObreroId = (id: string) => {
    onChange(selectedIds.filter(selId => selId !== id));
  };

  const sugerencias = useMemo(() => {
    if (searchTerm.length < 2) return [];
    
    // Si la cuadrilla tiene especialidades y showAll es falso, damos prioridad a mostrar obreros afines
    const filtradosEspecialidad = (showAll || cuadrillaEspecialidades.length === 0)
      ? obreros 
      : obreros.filter(o => {
          if (!o.especialidad || o.especialidad === 'Sin Especialidad') return true; // Mostrar peones o gente sin esp
          return cuadrillaEspecialidades.some(ce => o.especialidad.toLowerCase().includes(ce.toLowerCase()));
        });

    const lowerSearch = searchTerm.toLowerCase();
    const filtradosBusqueda = filtradosEspecialidad.filter(o => 
      o.nombres_completos?.toLowerCase().includes(lowerSearch) || 
      o.dni?.includes(lowerSearch)
    );

    const noSeleccionados = filtradosBusqueda.filter(o => !selectedIds.includes(o.id));

    return noSeleccionados.slice(0, 30);
  }, [obreros, searchTerm, showAll, cuadrillaEspecialidades, selectedIds]);

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <label className="block text-sm font-semibold text-slate-700" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
          Obreros en la Cuadrilla
        </label>
        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 rounded-full border border-slate-200">
          {seleccionados.length} asignados
        </span>
      </div>

      {/* Píldoras seleccionadas */}
      {seleccionados.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3 bg-slate-50 p-2 rounded-md border border-slate-100 max-h-40 overflow-y-auto">
          {seleccionados.map(o => (
            <div key={o.id} className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-full pl-2.5 pr-1.5 py-1 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-blue-900 leading-tight">{o.nombres_completos}</span>
                <span className="text-[9px] text-blue-600 leading-tight">{o.categoria_laboral}</span>
              </div>
              <button 
                type="button"
                onClick={() => removeObreroId(o.id)}
                className="p-0.5 bg-slate-100 hover:bg-blue-200 rounded-full text-blue-400 hover:text-blue-700 transition-colors border border-blue-100"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar obrero por nombre o DNI para agregarlo..."
          className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-gray-300 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-sm"
        />
        
        {/* Toggle para ver a todos */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-slate-100 pl-2">
          <input 
            type="checkbox" 
            id="showAllObsCuad" 
            checked={showAll} 
            onChange={e => setShowAll(e.target.checked)} 
            className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="showAllObsCuad" className="text-[10px] font-medium text-slate-500 cursor-pointer uppercase tracking-wide">
            Ver Todos
          </label>
        </div>

        {/* Dropdown sugerencias buscador manual */}
        {sugerencias.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-100 border border-gray-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
            {sugerencias.map(o => (
              <div 
                key={o.id}
                onClick={() => {
                  addObreroId(o.id);
                  setSearchTerm('');
                }}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
              >
                <div className="text-xs font-semibold text-slate-800">{o.nombres_completos}</div>
                <div className="text-[10px] text-slate-500 flex gap-2 mt-0.5">
                  <span className="font-mono">DNI: {o.dni}</span>
                  <span>•</span>
                  <span className="font-medium text-blue-600">{o.categoria_laboral}</span>
                  {o.especialidad && o.especialidad !== 'Sin Especialidad' && (
                    <>
                      <span>•</span>
                      <span>{o.especialidad}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <p className="text-[10px] text-slate-400 mt-1.5 italic">
        Escribe al menos 2 letras para buscar personal.
      </p>
    </div>
  );
}
