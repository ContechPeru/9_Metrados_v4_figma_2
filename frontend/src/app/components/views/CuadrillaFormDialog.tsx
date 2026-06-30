import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { usePersonalStore } from '../../store/usePersonalStore';
import { CuadrillaObrerosSelector } from './CuadrillaObrerosSelector';

interface CuadrillaFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cuadrillaToEdit?: { id: string; nombre: string; especialidades?: string[] } | null;
}

export default function CuadrillaFormDialog({ isOpen, onClose, cuadrillaToEdit }: CuadrillaFormDialogProps) {
  const [nombre, setNombre] = useState('');
  const [selectedEspecialidades, setSelectedEspecialidades] = useState<string[]>([]);
  const [selectedObrerosIds, setSelectedObrerosIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { obreros, fetchPersonal } = usePersonalStore();

  const especialidadesDisponibles = useMemo(() => {
    const unicas = new Set<string>();
    obreros.forEach(o => {
      if (o.especialidad && o.especialidad !== 'Sin Especialidad') {
        unicas.add(o.especialidad);
      }
    });
    return Array.from(unicas).sort();
  }, [obreros]);

  useEffect(() => {
    if (isOpen) {
      if (cuadrillaToEdit) {
        setNombre(cuadrillaToEdit.nombre || '');
        setSelectedEspecialidades(cuadrillaToEdit.especialidades || []);
        const members = obreros.filter(o => o.cuadrillas_asignadas?.includes(cuadrillaToEdit.nombre));
        setSelectedObrerosIds(members.map(m => m.id));
      } else {
        setNombre('');
        setSelectedEspecialidades([]);
        setSelectedObrerosIds([]);
      }
    }
  }, [isOpen, cuadrillaToEdit]);

  if (!isOpen) return null;

  const toggleEspecialidad = (esp: string) => {
    setSelectedEspecialidades(prev => 
      prev.includes(esp) ? prev.filter(e => e !== esp) : [...prev, esp]
    );
  };

  const handleDelete = async () => {
    if (!cuadrillaToEdit) return;
    if (!window.confirm(`¿Está seguro de eliminar la cuadrilla "${cuadrillaToEdit.nombre}"? Esta acción removerá a todos los obreros de la cuadrilla y no se puede deshacer.`)) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await supabase.from('obreros_cuadrillas').delete().eq('cuadrilla_id', cuadrillaToEdit.id);
      const { error } = await supabase.from('cuadrillas').delete().eq('id', cuadrillaToEdit.id);
      if (error) throw error;
      
      toast.success('Cuadrilla eliminada exitosamente');
      fetchPersonal();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al eliminar la cuadrilla');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error('El nombre de la cuadrilla es obligatorio');
      return;
    }

    setIsSubmitting(true);
    try {
      let currentCuadrillaId = cuadrillaToEdit?.id;

      if (cuadrillaToEdit) {
        const { error } = await supabase
          .from('cuadrillas')
          // @ts-expect-error Type infer failure
          .update({ nombre, especialidades: selectedEspecialidades })
          .eq('id', cuadrillaToEdit.id);
        if (error) throw error;
        toast.success('Cuadrilla actualizada exitosamente');
      } else {
        const { data, error } = await supabase
          .from('cuadrillas')
          // @ts-expect-error Type infer failure
          .insert([{ nombre, especialidades: selectedEspecialidades, estado_activo: true }])
          .select()
          .single();
        if (error) throw error;
        currentCuadrillaId = data.id;
        toast.success('Cuadrilla creada exitosamente');
      }

      // Update obreros_cuadrillas relationships
      if (currentCuadrillaId) {
        await supabase.from('obreros_cuadrillas').delete().eq('cuadrilla_id', currentCuadrillaId);
        if (selectedObrerosIds.length > 0) {
          const toInsert = selectedObrerosIds.map(oId => ({ obrero_id: oId, cuadrilla_id: currentCuadrillaId }));
          const { error: errorObreros } = await supabase.from('obreros_cuadrillas').insert(toInsert);
          if (errorObreros) throw errorObreros;
        }
      }

      fetchPersonal();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Ocurrió un error al guardar la cuadrilla');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {cuadrillaToEdit ? 'Editar Cuadrilla' : 'Nueva Cuadrilla'}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
              Nombre de Cuadrilla <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej. C-01"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
              Especialidades Asociadas
            </label>
            <div className="max-h-48 overflow-y-auto pr-2 grid grid-cols-2 gap-2">
              {especialidadesDisponibles.length > 0 ? (
                especialidadesDisponibles.map(esp => (
                  <label key={esp} className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors" style={{ borderColor: selectedEspecialidades.includes(esp) ? '#3B82F6' : '#E2E8F0', backgroundColor: selectedEspecialidades.includes(esp) ? '#EFF6FF' : 'transparent' }}>
                    <input
                      type="checkbox"
                      checked={selectedEspecialidades.includes(esp)}
                      onChange={() => toggleEspecialidad(esp)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium" style={{ color: selectedEspecialidades.includes(esp) ? '#1D4ED8' : '#475569' }}>
                      {esp}
                    </span>
                  </label>
                ))
              ) : (
                <div className="col-span-2 text-sm text-slate-500 italic">No hay especialidades registradas en el personal.</div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <CuadrillaObrerosSelector 
              obreros={obreros}
              selectedIds={selectedObrerosIds}
              onChange={setSelectedObrerosIds}
              cuadrillaEspecialidades={selectedEspecialidades}
            />
          </div>

          <div className="flex justify-between items-center mt-2">
            <div>
              {cuadrillaToEdit && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                  title="Eliminar Cuadrilla"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-70 transition-colors"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Guardar Cuadrilla
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
