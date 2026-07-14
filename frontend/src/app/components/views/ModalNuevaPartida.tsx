import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useMetradosStore } from '../../store/useMetradosStore';
import type { Partida } from '../../store/useMetradosStore';

interface ModalNuevaPartidaProps {
  onClose: (newPartida?: Partida) => void;
}

export const ModalNuevaPartida: React.FC<ModalNuevaPartidaProps> = ({ onClose }) => {
  const { partidas, createPartidaPersonalizada, especialidades } = useMetradosStore();
  const agrupadores = partidas.filter(p => p.es_agrupador);

  const [parentId, setParentId] = useState<string>('');
  const [tipoItem, setTipoItem] = useState<'AGRUPADOR' | 'ACTIVIDAD' | 'PARTIDA'>('PARTIDA');
  const [descripcion, setDescripcion] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('');
  const [codigoSugerido, setCodigoSugerido] = useState('');
  const [especialidad, setEspecialidad] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generar código sugerido cuando cambia el padre
  useEffect(() => {
    if (!parentId) {
      setCodigoSugerido('');
      return;
    }
    const parent = partidas.find(p => p.id === parentId);
    if (!parent) return;

    const prefijo = parent.codigo_expediente;
    // Buscar todos los items que compartan el mismo prefijo en toda la base de datos
    const prefixDot = `${prefijo}.`;
    let maxSufijo = 0;
    partidas.forEach(p => {
      if (p.codigo_expediente && p.codigo_expediente.startsWith(prefixDot)) {
        // Obtenemos lo que sigue después del prefijo
        const resto = p.codigo_expediente.substring(prefixDot.length);
        // Queremos el primer número de esa cadena (ej: de "2.1", queremos "2")
        const firstPart = parseInt(resto.split('.')[0], 10);
        if (!isNaN(firstPart) && firstPart > maxSufijo) {
          maxSufijo = firstPart;
        }
      }
    });

    setCodigoSugerido(`${prefijo}.${maxSufijo + 1}`);

    // Heredar especialidad del padre por defecto
    if (parent.especialidad) {
      setEspecialidad(parent.especialidad);
    } else {
      setEspecialidad('');
    }
  }, [parentId, partidas]);

  // Check duplicate
  const isDuplicateWBS = useMemo(() => {
    if (!codigoSugerido) return false;
    return partidas.some(p => p.codigo_expediente.toLowerCase() === codigoSugerido.toLowerCase());
  }, [codigoSugerido, partidas]);

  // Existing children
  const existingSiblings = useMemo(() => {
    if (!parentId) return [];
    const parent = partidas.find(p => p.id === parentId);
    if (!parent) return [];
    const prefixDot = `${parent.codigo_expediente}.`;
    return partidas.filter(p => p.codigo_expediente && p.codigo_expediente.startsWith(prefixDot));
  }, [parentId, partidas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentId || !descripcion || !codigoSugerido) {
      setError('Por favor llena los campos obligatorios (Padre, Código, Descripción)');
      return;
    }
    if (isDuplicateWBS) {
      setError(`El código WBS '${codigoSugerido}' ya existe. Por favor usa uno distinto.`);
      return;
    }
    
    const parent = partidas.find(p => p.id === parentId);
    if (!parent) return;

    setLoading(true);
    setError(null);

    const isAgrupador = tipoItem === 'AGRUPADOR';
    const isActividad = tipoItem === 'ACTIVIDAD';

    const payload: Partial<Partida> & { precio_unitario_base?: number } = {
      codigo_expediente: codigoSugerido,
      descripcion: descripcion.toUpperCase(),
      unidad_medida: isAgrupador ? null : (unidadMedida || 'und'),
      es_agrupador: isAgrupador,
      nivel_arbol: parent.nivel_arbol + 1,
      parent_id: parent.id,
      ruta_jerarquica: parent.ruta_jerarquica ? [...(Array.isArray(parent.ruta_jerarquica) ? parent.ruta_jerarquica : []), codigoSugerido] : [codigoSugerido],
      modificacion: isActividad ? 'ACT' : (isAgrupador ? null : 'PC'),
      proyecto_id: parent.proyecto_id,
      tipo_calculo: isAgrupador ? null : 'ESTANDAR', // Por defecto estandar, se podría elegir luego
      especialidad: especialidad || parent.especialidad,
      se_valoriza: false,
      es_adicional: true,
      precio_unitario_base: 0
    };

    const res = await createPartidaPersonalizada(payload);
    setLoading(false);
    if (res.success && res.data) {
      onClose(res.data);
    } else {
      setError(res.error || 'Error al guardar');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm font-sans">
      <div className="bg-slate-100 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">✨ Crear Nuevo Ítem</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
          
          <div className="space-y-4">
            {/* 1. Tipo de Ítem */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">1. ¿Qué deseas crear?</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTipoItem('AGRUPADOR')}
                  className={`p-3 border rounded-lg text-left flex flex-col items-center justify-center gap-1 transition-all ${
                    tipoItem === 'AGRUPADOR' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <span className="text-2xl">📁</span>
                  <span className="text-xs font-bold">Título / Agrupador</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTipoItem('ACTIVIDAD')}
                  className={`p-3 border rounded-lg text-left flex flex-col items-center justify-center gap-1 transition-all ${
                    tipoItem === 'ACTIVIDAD' ? 'border-orange-500 bg-orange-50 text-orange-700 ring-1 ring-orange-500' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <span className="text-2xl">🚧</span>
                  <span className="text-xs font-bold text-center">Actividad Interna<br/><span className="font-normal text-[10px]">(No se valoriza)</span></span>
                </button>
                <button
                  type="button"
                  onClick={() => setTipoItem('PARTIDA')}
                  className={`p-3 border rounded-lg text-left flex flex-col items-center justify-center gap-1 transition-all ${
                    tipoItem === 'PARTIDA' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <span className="text-2xl">💰</span>
                  <span className="text-xs font-bold text-center">Partida Creada<br/><span className="font-normal text-[10px]">(Pendiente)</span></span>
                </button>
              </div>
            </div>

            {/* 2. Ubicación */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">2. Ubicación en el Presupuesto</label>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Partida Padre (Agrupador)</label>
                <select 
                  className="w-full border-gray-300 rounded text-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  required
                >
                  <option value="">Seleccione el nivel donde se insertará...</option>
                  {agrupadores.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.codigo_expediente} - {a.descripcion}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Especialidad</label>
                <select
                  value={especialidad}
                  onChange={e => setEspecialidad(e.target.value)}
                  className="w-full border-gray-300 rounded text-sm p-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-100"
                  required
                >
                  <option value="">Seleccione especialidad...</option>
                  {especialidades.map(esp => (
                    <option key={esp.id} value={esp.nombre}>{esp.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Código (WBS)</label>
                  <input 
                    type="text" 
                    value={codigoSugerido} 
                    onChange={e => setCodigoSugerido(e.target.value)}
                    className={`w-full border rounded text-sm p-2 bg-slate-100 focus:ring-blue-500 focus:border-blue-500 ${isDuplicateWBS ? 'border-red-500 ring-1 ring-red-500 text-red-700' : 'border-gray-300'}`}
                    placeholder="Ej. OE.1.2.3"
                    required
                  />
                  {isDuplicateWBS && (
                    <p className="text-[10px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                      <AlertTriangle size={10} /> Este código ya está en uso.
                    </p>
                  )}
                </div>
                {tipoItem === 'PARTIDA' && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Etiqueta Interna</label>
                    <input type="text" disabled value="PC (Pendiente de Aprobación)" className="w-full border-gray-200 text-gray-500 rounded text-sm p-2 bg-gray-100" />
                  </div>
                )}
                {tipoItem === 'ACTIVIDAD' && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Etiqueta Interna</label>
                    <input type="text" disabled value="ACT" className="w-full border-gray-200 text-gray-500 rounded text-sm p-2 bg-gray-100" />
                  </div>
                )}
              </div>

              {parentId && existingSiblings.length > 0 && (
                <div className="bg-slate-100 border border-gray-200 rounded-lg p-3 mt-3 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wide">Partidas existentes en este nivel (Hijos de {agrupadores.find(a => a.id === parentId)?.codigo_expediente}):</p>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {existingSiblings.sort((a,b) => a.codigo_expediente.localeCompare(b.codigo_expediente, undefined, {numeric: true})).map(s => (
                      <div key={s.id} className="flex items-center text-[10px] bg-gray-50 border border-gray-200 rounded px-1.5 py-1 max-w-full hover:bg-gray-100 transition-colors cursor-help" title={s.descripcion}>
                        <span className="font-bold text-[#1E3A5F] mr-1.5 whitespace-nowrap">{s.codigo_expediente}</span>
                        <span className="text-gray-500 truncate max-w-[150px]">{s.descripcion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Datos */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">3. Datos del Ítem</label>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Descripción</label>
                <textarea 
                  value={descripcion} 
                  onChange={e => setDescripcion(e.target.value)}
                  className="w-full border-gray-300 rounded text-sm p-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  placeholder="Ej. EXCAVACIÓN DE ZANJAS..."
                  rows={2}
                  required
                />
              </div>

              {tipoItem !== 'AGRUPADOR' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Unidad de Medida</label>
                    <input 
                      type="text" 
                      value={unidadMedida} 
                      onChange={e => setUnidadMedida(e.target.value)}
                      className="w-full border-gray-300 rounded text-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej. m3, glb, m2"
                      required
                    />
                  </div>
                  {tipoItem === 'PARTIDA' && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Precio Unitario Base (S/)</label>
                      <input 
                        type="text" 
                        disabled
                        value="0.00 (Se definirá al aprobar)" 
                        className="w-full border-gray-200 text-gray-500 rounded text-sm p-2 bg-gray-100"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-slate-100 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar Ítem'}
          </button>
        </div>
      </div>
    </div>
  );
};
