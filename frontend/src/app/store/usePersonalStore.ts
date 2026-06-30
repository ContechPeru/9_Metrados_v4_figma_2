import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Obrero {
  id: string;
  dni: string;
  nombres_completos: string;
  categoria_laboral: string;
  especialidad: string;
  oficio: string;
  cuadrilla: string;
  cuadrillas_asignadas?: string[]; // Array of assigned cuadrilla names
}

interface PersonalState {
  obreros: Obrero[];
  cuadrillasUnicas: string[];
  cuadrillasList: {id: string, nombre: string, especialidades: string[]}[];
  isLoading: boolean;
  fetchPersonal: () => Promise<void>;
  
  // Estado de selección global de obreros para el metrado actual
  selectedObrerosIds: string[];
  setSelectedObrerosIds: (ids: string[]) => void;
  addObreroId: (id: string) => void;
  removeObreroId: (id: string) => void;
}

export const usePersonalStore = create<PersonalState>((set) => ({
  obreros: [],
  cuadrillasUnicas: [],
  cuadrillasList: [],
  isLoading: false,
  selectedObrerosIds: [],
  
  fetchPersonal: async () => {
    set({ isLoading: true });
    
    // 1. Fetch obreros and their multiple cuadrillas
    const { data: obrerosData, error: obrerosError } = await supabase
      .from('personal_obrero')
      .select(`
        id, dni, nombres_completos, categoria_laboral, especialidad, oficio, cuadrilla,
        obreros_cuadrillas (
          cuadrillas ( nombre )
        )
      `)
      .eq('estado_activo', true)
      .order('nombres_completos', { ascending: true });
      
    // 2. Fetch master cuadrillas for dropdowns
    // Include rows where estado_activo is true OR null (legacy rows without value set)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cuadrillasData: any[] | null = null;
    {
      const { data, error } = await supabase
        .from('cuadrillas')
        .select('id, nombre, especialidades')
        .or('estado_activo.eq.true,estado_activo.is.null')
        .order('nombre');

      // Fallback: if query failed (e.g. 'especialidades' column missing), retry without it
      if (error) {
        console.warn('[usePersonalStore] cuadrillas fetch with especialidades failed:', error.message, '— retrying without especialidades column');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('cuadrillas')
          .select('id, nombre')
          .or('estado_activo.eq.true,estado_activo.is.null')
          .order('nombre');

        if (fallbackError) {
          console.error('[usePersonalStore] fallback cuadrillas fetch also failed:', fallbackError.message);
        } else {
          // Normalise shape to match expected type
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cuadrillasData = (fallbackData || []).map((c: any) => ({ ...c, especialidades: [] }));
        }
      } else {
        cuadrillasData = data;
      }
    }

    if (!obrerosError && obrerosData) {
      const parsedData = obrerosData.map((o: any) => {
        // Map the many-to-many relationship into a simple array of strings
        const assigned = (o.obreros_cuadrillas as any[])
          ?.map(oc => oc.cuadrillas?.nombre)
          .filter(Boolean) || [];

        return {
          id: o.id,
          dni: o.dni,
          nombres_completos: o.nombres_completos,
          categoria_laboral: o.categoria_laboral,
          especialidad: o.especialidad,
          oficio: o.oficio,
          cuadrilla: o.cuadrilla, // legacy
          cuadrillas_asignadas: assigned
        } as Obrero;
      });

      // Prefer the master cuadrillas table, fallback to legacy parsing if empty
      let unicas: string[] = [];
      if (cuadrillasData && cuadrillasData.length > 0) {
        unicas = cuadrillasData.map((c: any) => c.nombre);
      } else {
        // Legacy fallback: extract unique cuadrilla names from obreros
        const cuadrillasSet = new Set<string>();
        parsedData.forEach(o => {
          if (o.cuadrilla && o.cuadrilla.trim() !== '' && o.cuadrilla !== 'nan') {
            cuadrillasSet.add(o.cuadrilla.trim());
          }
          if (o.cuadrillas_asignadas) {
            o.cuadrillas_asignadas.forEach(c => cuadrillasSet.add(c.trim()));
          }
        });
        unicas = Array.from(cuadrillasSet).sort();
      }

      set({
        obreros: parsedData,
        cuadrillasUnicas: unicas,
        cuadrillasList: cuadrillasData || [],
        isLoading: false
      });
    } else {
      set({ isLoading: false });
    }
  },
  
  setSelectedObrerosIds: (ids) => set({ selectedObrerosIds: ids }),
  addObreroId: (id) => set((state) => {
    if (state.selectedObrerosIds.includes(id)) return state;
    return { selectedObrerosIds: [...state.selectedObrerosIds, id] };
  }),
  removeObreroId: (id) => set((state) => ({
    selectedObrerosIds: state.selectedObrerosIds.filter(i => i !== id)
  }))
}));
