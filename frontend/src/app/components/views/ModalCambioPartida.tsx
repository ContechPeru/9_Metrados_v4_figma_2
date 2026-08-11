import { useState, useMemo, useEffect } from 'react';
import { Search, Check, X, AlertTriangle } from 'lucide-react';
import { useMetradosStore } from '../../store/useMetradosStore';
import type { Partida } from '../../store/useMetradosStore';

interface ModalCambioPartidaProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSuccess: () => void;
}

export function ModalCambioPartida({ isOpen, onClose, selectedIds, onSuccess }: ModalCambioPartidaProps) {
  const { partidas, cambiarPartidaMasivo } = useMetradosStore();
  const [search, setSearch] = useState('');
  const [selectedPartida, setSelectedPartida] = useState<Partida | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedPartida(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Boolean search exactly like MetradosForm
  const partidasOptions = useMemo(() => {
    if (search.trim().length < 2) return [];

    let result = partidas.filter(p => !p.es_agrupador); // Can change to any project or limit to current
    const terms = search.toLowerCase().trim().split(/\s+/);
    
    result = result.filter(p => {
      const textToSearch = `${p.codigo_expediente} ${p.descripcion}`.toLowerCase();
      return terms.every(term => {
        if (term.startsWith('-')) {
          const word = term.substring(1);
          return word ? !textToSearch.includes(word) : true;
        } else {
          const word = term.startsWith('+') ? term.substring(1) : term;
          return word ? textToSearch.includes(word) : true;
        }
      });
    });

    return result.slice(0, 50);
  }, [search, partidas]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!selectedPartida) return;
    setIsSubmitting(true);
    
    const res = await cambiarPartidaMasivo(
      selectedIds, 
      selectedPartida.id, 
      selectedPartida.codigo_expediente, 
      selectedPartida.descripcion,
      selectedPartida.unidad_medida || 'UND'
    );
    
    setIsSubmitting(false);
    
    if (res.success) {
      onSuccess();
    } else {
      alert("Error al cambiar partidas: " + res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Cambio Masivo de Partida</h2>
            <p className="text-xs text-slate-500 mt-0.5">Se actualizarán <strong className="text-blue-600">{selectedIds.length}</strong> metrados seleccionados.</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          {!selectedPartida ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Buscar nueva partida (Mín. 2 letras)</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ej: OE.2.3.9 encofrado"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {search.trim().length >= 2 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                  {partidasOptions.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">No se encontraron resultados</div>
                  ) : (
                    partidasOptions.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPartida(p)}
                        className="w-full text-left p-3 hover:bg-blue-50 transition-colors flex items-start gap-3 group"
                      >
                        <div className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Check size={14} className="text-blue-500" />
                        </div>
                        <div>
                          <div className="font-mono text-xs font-bold text-slate-700">{p.codigo_expediente}</div>
                          <div className="text-xs text-slate-600 mt-0.5 line-clamp-2">{p.descripcion}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 relative">
                <button 
                  onClick={() => setSelectedPartida(null)}
                  className="absolute top-3 right-3 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-white border border-blue-200 px-2 py-1 rounded"
                >
                  Cambiar
                </button>
                <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Partida Destino</div>
                <div className="font-mono text-sm font-bold text-slate-800">{selectedPartida.codigo_expediente}</div>
                <div className="text-sm text-slate-700 mt-1">{selectedPartida.descripcion}</div>
              </div>

              {selectedPartida.tipo_calculo !== 'ACERO' && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-xs">
                  <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>Aviso:</strong> La nueva partida no es del tipo ACERO. Si los metrados seleccionados tenían diámetros de acero registrados, estos serán eliminados para evitar inconsistencias.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedPartida || isSubmitting}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? 'Procesando...' : 'Confirmar Cambio'}
          </button>
        </div>
      </div>
    </div>
  );
}
