import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import type { Personal } from '../../data/mockData';
import { usePersonalStore } from '../../store/usePersonalStore';

interface PersonalFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  personToEdit?: Personal | null;
}

export default function PersonalFormDialog({ isOpen, onClose, onSuccess, personToEdit }: PersonalFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    dni: '',
    nombres_completos: '',
    categoria_laboral: 'Operario',
    especialidad: '',
    estado_contrato: 'Activo',
    sexo: 'M',
    telefono: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    oficio: '',
    cuadrilla: 'Sin asignar',
    cuadrillas_asignadas: [] as string[]
  });

  const { cuadrillasList } = usePersonalStore();

  useEffect(() => {
    async function loadEspecialidades() {
      const { data } = await supabase.from('especialidades').select('nombre').eq('estado_activo', true);
      if (data) {
        setEspecialidades((data as any[]).map(e => e.nombre));
      }
    }
    if (isOpen) {
      loadEspecialidades();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (personToEdit) {
        // Fetch full record to get all fields
        (supabase.from('personal_obrero') as any).select('*, obreros_cuadrillas(cuadrilla_id)').eq('id', personToEdit.id).single()
          .then(({ data }: any) => {
            if (data) {
              const d = data as any;
              setFormData({
                dni: d.dni || '',
                nombres_completos: d.nombres_completos || '',
                categoria_laboral: d.categoria_laboral || 'Operario',
                especialidad: d.especialidad || '',
                estado_contrato: d.estado_contrato || 'Activo',
                sexo: d.sexo || 'M',
                telefono: d.telefono || '',
                fecha_ingreso: d.fecha_ingreso || new Date().toISOString().split('T')[0],
                oficio: d.oficio || '',
                cuadrilla: d.cuadrilla || 'Sin asignar',
                cuadrillas_asignadas: d.obreros_cuadrillas ? d.obreros_cuadrillas.map((oc: any) => oc.cuadrilla_id) : []
              });
            }
          });
      } else {
        setFormData({
          dni: '',
          nombres_completos: '',
          categoria_laboral: 'Operario',
          especialidad: '',
          estado_contrato: 'Activo',
          sexo: 'M',
          telefono: '',
          fecha_ingreso: new Date().toISOString().split('T')[0],
          oficio: '',
          cuadrilla: 'Sin asignar',
          cuadrillas_asignadas: []
        });
      }
    }
  }, [isOpen, personToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombres_completos || !formData.dni) {
      toast.error('Por favor, ingresa al menos el DNI y los Nombres Completos.');
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSave = { ...formData } as any;
      const cuadrillasToSave = dataToSave.cuadrillas_asignadas;
      delete dataToSave.cuadrillas_asignadas;
      
      let obreroId = personToEdit?.id;

      if (personToEdit) {
        // Update
        const { error } = await (supabase.from('personal_obrero') as any)
          .update({
            ...dataToSave,
            estado_activo: true // ensure it's active
          })
          .eq('id', obreroId);
        
        if (error) throw error;
        toast.success('Ficha del obrero actualizada correctamente');
      } else {
        // Insert
        const { data: newObrero, error } = await (supabase.from('personal_obrero') as any)
          .insert([{
            ...dataToSave,
            estado_activo: true
          }]).select('id').single();
        
        if (error) throw error;
        obreroId = newObrero.id;
        toast.success('Nuevo obrero registrado correctamente');
      }

      // Handle obreros_cuadrillas relations
      if (obreroId) {
        // First delete existing
        await supabase.from('obreros_cuadrillas').delete().eq('obrero_id', obreroId);
        // Then insert new
        if (cuadrillasToSave && cuadrillasToSave.length > 0) {
          const toInsert = cuadrillasToSave.map((cId: string) => ({ obrero_id: obreroId, cuadrilla_id: cId }));
          const { error: errorCuadrillas } = await supabase.from('obreros_cuadrillas').insert(toInsert);
          if (errorCuadrillas) throw errorCuadrillas;
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al guardar: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1527]/40 backdrop-blur-sm">
      <div 
        className="w-full max-w-2xl bg-slate-100 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E9F0] bg-[#F8FAFC]">
          <h2 className="text-lg font-bold text-[#1A2B45]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {personToEdit ? 'Editar Ficha del Obrero' : 'Registrar Nuevo Obrero'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[#E2E8F0] text-[#64748B] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
            
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">
                  DNI *
                </label>
                <input 
                  type="text" 
                  name="dni" 
                  value={formData.dni} 
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:outline-none focus:border-[#1A6BFF] focus:ring-1 focus:ring-[#1A6BFF]"
                  placeholder="Número de documento"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">
                  Nombres Completos *
                </label>
                <input 
                  type="text" 
                  name="nombres_completos" 
                  value={formData.nombres_completos} 
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:outline-none focus:border-[#1A6BFF] focus:ring-1 focus:ring-[#1A6BFF]"
                  placeholder="Apellidos y Nombres"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">
                  Especialidad
                </label>
                <select 
                  name="especialidad" 
                  value={formData.especialidad} 
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:outline-none focus:border-[#1A6BFF] focus:ring-1 focus:ring-[#1A6BFF] bg-slate-100"
                >
                  <option value="">Seleccione especialidad...</option>
                  {especialidades.map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">
                  Categoría Laboral
                </label>
                <select 
                  name="categoria_laboral" 
                  value={formData.categoria_laboral} 
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:outline-none focus:border-[#1A6BFF] focus:ring-1 focus:ring-[#1A6BFF] bg-slate-100"
                >
                  <option value="Operario">Operario</option>
                  <option value="Oficial">Oficial</option>
                  <option value="Peón">Peón</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">
                  Cuadrillas Asignadas
                </label>
                <div className="flex flex-wrap gap-2">
                  {cuadrillasList.length === 0 && <span className="text-xs text-gray-400 italic">No hay cuadrillas registradas</span>}
                  {cuadrillasList.map(c => {
                    const isChecked = formData.cuadrillas_asignadas.includes(c.id);
                    return (
                      <label 
                        key={c.id} 
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-colors ${
                          isChecked ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({...prev, cuadrillas_asignadas: [...prev.cuadrillas_asignadas, c.id]}));
                            } else {
                              setFormData(prev => ({...prev, cuadrillas_asignadas: prev.cuadrillas_asignadas.filter(id => id !== c.id)}));
                            }
                          }}
                        />
                        {c.nombre}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">
                  Estado de Contrato
                </label>
                <select 
                  name="estado_contrato" 
                  value={formData.estado_contrato} 
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:outline-none focus:border-[#1A6BFF] focus:ring-1 focus:ring-[#1A6BFF] bg-slate-100"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Licencia">Licencia</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">
                  Teléfono
                </label>
                <input 
                  type="text" 
                  name="telefono" 
                  value={formData.telefono} 
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:outline-none focus:border-[#1A6BFF] focus:ring-1 focus:ring-[#1A6BFF]"
                  placeholder="Ej: 987654321"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">
                  Sexo
                </label>
                <select 
                  name="sexo" 
                  value={formData.sexo} 
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:outline-none focus:border-[#1A6BFF] focus:ring-1 focus:ring-[#1A6BFF] bg-slate-100"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">
                  Fecha Ingreso
                </label>
                <input 
                  type="date" 
                  name="fecha_ingreso" 
                  value={formData.fecha_ingreso} 
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:outline-none focus:border-[#1A6BFF] focus:ring-1 focus:ring-[#1A6BFF]"
                />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5E9F0] bg-[#F8FAFC]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-[#CBD5E1] text-[#475569] hover:bg-[#F1F5F9] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 text-sm font-semibold rounded-lg text-white bg-[#1A6BFF] hover:bg-[#1557D1] transition-colors disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSubmitting ? 'Guardando...' : 'Guardar Ficha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
