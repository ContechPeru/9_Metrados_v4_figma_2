import { useState } from 'react';
import { X,  Save } from 'lucide-react';
import { useMetradosStore } from '../../store/useMetradosStore';

interface PartidaData {
  id: string;
  codigo_expediente: string;
  descripcion: string;
  unidad_medida: string;
  precio_unitario_base: number;
  especialidad: string;
  tipo_calculo: string;
  se_valoriza: boolean;
  modificacion?: string | null;
  es_agrupador: boolean;
}

interface ModalEditarPartidaProps {
  partida: PartidaData;
  onClose: () => void;
  isSuper: boolean;
  userEspecialidad: string | null;
}

export function ModalEditarPartida({ partida, onClose, isSuper, userEspecialidad }: ModalEditarPartidaProps) {
  const { updatePartidaMaestra, especialidades } = useMetradosStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    codigo_expediente: partida.codigo_expediente || '',
    descripcion: partida.descripcion || '',
    unidad_medida: partida.unidad_medida || '',
    precio_unitario_base: partida.precio_unitario_base || 0,
    especialidad: partida.especialidad || 'GENERAL',
    tipo_calculo: partida.tipo_calculo || 'ESTÁNDAR',
    se_valoriza: partida.se_valoriza !== false, // true por defecto
    modificacion: partida.modificacion || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.descripcion.trim()) {
      setError('La descripción no puede estar vacía');
      return;
    }
    
    // Si no es super admin, y trata de cambiar la especialidad a una diferente a la suya, advertir
    if (!isSuper && formData.especialidad !== userEspecialidad) {
      const confirmMsg = "Estás a punto de cambiar la especialidad de esta partida a otra diferente a la tuya. Una vez guardado, perderás el acceso para volver a editarla. ¿Deseas continuar?";
      if (!window.confirm(confirmMsg)) return;
    }

    setIsSubmitting(true);
    setError('');

    const res = await updatePartidaMaestra(partida.id, {
      codigo_expediente: formData.codigo_expediente,
      descripcion: formData.descripcion,
      unidad_medida: formData.unidad_medida,
      precio_unitario_base: formData.precio_unitario_base,
      especialidad: formData.especialidad,
      tipo_calculo: formData.tipo_calculo,
      se_valoriza: formData.se_valoriza,
      modificacion: formData.modificacion || null
    });

    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Ocurrió un error al actualizar la partida');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Editar Partida</h2>
            {partida.es_agrupador ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded cursor-not-allowed" title="No se puede editar el código de un agrupador">
                  🔒 {partida.codigo_expediente}
                </span>
              </div>
            ) : (
              <input
                type="text"
                name="codigo_expediente"
                value={formData.codigo_expediente}
                onChange={handleChange}
                className="mt-1 text-xs font-mono p-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none w-48 uppercase"
                required
              />
            )}
          </div>
          <button onClick={onClose} className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors shadow-sm">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Descripción</label>
              <input
                type="text"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className="w-full text-sm p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Unidad</label>
                <input
                  type="text"
                  name="unidad_medida"
                  value={formData.unidad_medida}
                  onChange={handleChange}
                  className="w-full text-sm p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Precio Unitario Base</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    name="precio_unitario_base"
                    value={formData.precio_unitario_base}
                    onChange={handleChange}
                    className="w-full text-sm pl-8 p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Especialidad</label>
                <select
                  name="especialidad"
                  value={formData.especialidad}
                  onChange={handleChange}
                  className="w-full text-sm p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="">Seleccionar...</option>
                  {especialidades.map(esp => (
                    <option key={esp.id} value={esp.nombre}>{esp.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tipo de Cálculo</label>
                <select
                  name="tipo_calculo"
                  value={formData.tipo_calculo}
                  onChange={handleChange}
                  className="w-full text-sm p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="ESTÁNDAR">Estándar</option>
                  <option value="ACERO">Acero Corrugado</option>
                  <option value="HVAC">Inst. Mecánicas (HVAC)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Modificación (Estado)</label>
                <input
                  type="text"
                  name="modificacion"
                  value={formData.modificacion || ''}
                  onChange={handleChange}
                  placeholder="Ej: PC, ACT, M, A, PN5..."
                  className="w-full text-sm p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
                <input
                  type="checkbox"
                  name="se_valoriza"
                  checked={formData.se_valoriza}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-blue-900">Esta partida se valoriza</span>
                  <span className="text-[11px] text-blue-600/80">Desmárcalo si es solo una partida de seguimiento de campo sin impacto financiero directo.</span>
                </div>
              </label>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-[#1A6BFF] text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {isSubmitting ? (
                <>Guardando...</>
              ) : (
                <><Save size={16} /> Guardar Cambios</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
