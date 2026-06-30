import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface MetradoRecord {
  id: string;
  partida_id: string;
  snapshot_codigo: string;
  snapshot_descripcion: string;
  unidad: string;
  especialidad: string;
  frente_trabajo: string;
  bloque_sector: string;
  nivel_piso: string;
  ambiente?: string;
  cuadrilla: string;
  elemento_desc: string;
  detalle_desc: string;
  cantidad_elementos: number;
  medida_largo_area: number;
  medida_ancho_empalme: number;
  medida_alto_gancho: number;
  resultado_parcial: number;
  nro_repeticiones: number;
  resultado_total: number;
  fecha_ejecucion: string;
  obrero_nombre?: string;
  autor_nombre?: string;
  firma_ingeniero?: string;
  acero_diametro?: string | null;
  hvac_item_id?: string | null;
  obreros_ids?: string[];
  plano_sist?: string | null;
  ambiente?: string | null;
  plano_num?: string | null;
  sin_plano?: boolean;
  obs_motivo?: string | null;
  obs_detalle?: string | null;
  is_liberado?: boolean;
}

export interface Partida {
  id: string;
  codigo_expediente: string;
  descripcion: string;
  unidad_medida: string | null;
  es_agrupador: boolean;
  nivel_arbol: number;
  parent_id: string | null;
  ruta_jerarquica: string[];
  modificacion: string | null;
  proyecto_id: string;
  tipo_calculo: string | null;
  especialidad: string;
  se_valoriza: boolean;
  es_adicional: boolean;
  precio_unitario_base: number;
  cantidad_presupuestada?: number | null;
  metrado_acumulado_anterior?: number | null;
}

interface Proyecto { id: string; nombre: string; codigo?: string; }
interface Especialidad { id: string; nombre: string; estado_activo: boolean; codigo?: string; codigo_prefijos?: string[]; }
interface Usuario { id: string; nombre_completo: string; }
interface FactorHvac { id: string; label: string; factor: number; }

interface MetradosState {
  metrados: MetradoRecord[];
  proyectos: Proyecto[];
  especialidades: Especialidad[];
  usuarios: Usuario[];
  factoresHvac: FactorHvac[];
  partidas: Partida[];
  isLoading: boolean;
  fetchMetrados: (fetchAll?: boolean, startDate?: string, endDate?: string) => Promise<void>;
  fetchCatalogosGlobales: () => Promise<void>;
  addMetrado: (metrado: Omit<MetradoRecord, 'id'>, obrerosIds: string[]) => Promise<{success: boolean; error?: string}>;
  updateMetrado: (id: string, updates: Partial<MetradoRecord>, obrerosIds?: string[]) => Promise<{success: boolean; error?: string}>;
  deleteMetrado: (id: string) => Promise<{success: boolean; error?: string}>;
  toggleLiberarMetrado: (id: string, is_liberado: boolean) => Promise<{success: boolean; error?: string}>;
  liberarMetradosMasivo: (ids: string[], is_liberado: boolean) => Promise<{success: boolean; error?: string}>;
  editingMetrado: MetradoRecord | null;
  setEditingMetrado: (metrado: MetradoRecord | null) => void;
  createPartidaPersonalizada: (partida: Partial<Partida> & { precio_unitario_base?: number }) => Promise<{success: boolean; error?: string}>;
  aprobarActividadAPartida: (id: string, precio: number, modificacion: string) => Promise<{success: boolean; error?: string}>;
  updatePartidaMaestra: (id: string, updates: Partial<Partida>) => Promise<{success: boolean; error?: string}>;
}

export const useMetradosStore = create<MetradosState>((set, get) => ({
  metrados: [],
  proyectos: [],
  especialidades: [],
  usuarios: [],
  factoresHvac: [],
  partidas: [],
  isLoading: false,
  editingMetrado: null,

  setEditingMetrado: (metrado) => set({ editingMetrado: metrado }),

  fetchCatalogosGlobales: async () => {
    const getAllPartidas = async () => {
      let all: Partida[] = [];
      let hasMore = true;
      let page = 0;
      const size = 1000;
      while (hasMore) {
        const { data } = await supabase
          .from('catalogo_partidas')
          .select('id, codigo_expediente, descripcion, unidad_medida, es_agrupador, nivel_arbol, parent_id, ruta_jerarquica, modificacion, proyecto_id, tipo_calculo, especialidad, se_valoriza, es_adicional, precio_unitario_base, cantidad_presupuestada, metrado_acumulado_anterior')
          .order('codigo_expediente')
          .range(page * size, (page + 1) * size - 1);
        
        if (data && data.length > 0) {
          all = [...all, ...(data as Partida[])];
          page++;
          if (data.length < size) hasMore = false;
        } else {
          hasMore = false;
        }
      }
      return all;
    };

    const [{ data: proyData }, { data: espData }, { data: userData }, { data: hvacData }, partidasData] = await Promise.all([
      supabase.from('proyectos').select('*').order('nombre'),
      supabase.from('especialidades').select('*').eq('estado_activo', true).order('nombre'),
      supabase.from('usuarios_sistema').select('id, nombre_completo').order('nombre_completo'),
      supabase.from('factores_hvac').select('*').order('label'),
      getAllPartidas()
    ]);
    
    set({
      proyectos: proyData || [],
      especialidades: espData || [],
      usuarios: userData || [],
      factoresHvac: hvacData || [],
      partidas: partidasData || []
    });
  },

  fetchMetrados: async (fetchAll = false, startDate?: string, endDate?: string) => {
    set({ isLoading: true });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allMetrados: any[] = [];
    let hasMore = true;
    let page = 0;
    const size = 1000;
    
    // Calcular fecha límite (30 días atrás) si no es fetchAll
    const treintaDiasAtras = new Date();
    treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);
    const fechaLimite = treintaDiasAtras.toISOString().split('T')[0];
    
    while (hasMore) {
      let query = supabase
        .from('registro_metrados')
        .select(`
          *,
          metrados_obreros(
            obrero_id,
            personal_obrero(nombres_completos, categoria_laboral)
          ),
          catalogo_partidas(precio_unitario_base)
        `);

      if (!fetchAll) {
        if (startDate && endDate) {
          query = query.gte('fecha_ejecucion', startDate).lte('fecha_ejecucion', endDate);
        } else if (startDate) {
          query = query.gte('fecha_ejecucion', startDate);
        } else if (endDate) {
          query = query.lte('fecha_ejecucion', endDate);
        } else {
          query = query.gte('fecha_ejecucion', fechaLimite);
        }
      }

      const { data, error } = await query
        .order('fecha_ejecucion', { ascending: true })
        .order('created_at', { ascending: true })
        .range(page * size, (page + 1) * size - 1);
        
      if (error) {
        set({ isLoading: false });
        console.error("Error fetching metrados:", error);
        return;
      }
      
      if (data && data.length > 0) {
        allMetrados.push(...data);
        page++;
        if (data.length < size) hasMore = false;
      } else {
        hasMore = false;
      }
    }

    if (allMetrados.length > 0) {
      const data = allMetrados;
      const usuarios = get().usuarios;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedData = data.map((m: any) => {
        const obrerosRel = m.metrados_obreros || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nombresObrerosStr = obrerosRel
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((rel: any) => {
            if (!rel.personal_obrero) return '';
            const fn = rel.personal_obrero.nombres_completos?.trim().split(' ')[0] || '';
            const cat = rel.personal_obrero.categoria_laboral || '';
            const c = cat.toUpperCase();
            let catAbbr = cat;
            if (c.includes('OPERARIO')) catAbbr = 'OP';
            else if (c.includes('OFICIAL') || c.includes('OFIICIAL')) catAbbr = 'OF';
            else if (c.includes('PEON') || c.includes('PEÓN')) catAbbr = 'P';
            return `${fn} (${catAbbr})`;
          })
          .filter(Boolean)
          .join(' / ');
        
        const precioUnitario = m.catalogo_partidas?.precio_unitario_base || 0;
        const total = m.resultado_total || 0;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obrerosIds = obrerosRel.map((rel: any) => rel.obrero_id).filter(Boolean);
        
        const autorUser = usuarios.find(u => u.id === m.user_id);
        const autorNombre = autorUser ? autorUser.nombre_completo : m.firma_ingeniero;

        return {
          ...m,
          obrero_nombre: nombresObrerosStr || null,
          autor_nombre: autorNombre || null,
          obreros_ids: obrerosIds,
          precio_unitario: precioUnitario,
          monto_total: parseFloat((total * precioUnitario).toFixed(2))
        };
      });
      
      set({ metrados: mappedData as MetradoRecord[], isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  addMetrado: async (metradoData, obrerosIds) => {
    // Remover campos virtuales que no existen en la BD real
    const { obrero_nombre, obreros_ids, precio_unitario, monto_total, ...dbPayload } = metradoData as Record<string, unknown>;

    const { data: newMetrado, error } = await supabase
      .from('registro_metrados')
      // @ts-expect-error Typescript complain about dbPayload
      .insert(dbPayload)
      .select('*')
      .single();

    if (error) return { success: false, error: error.message };

    // Si hay obreros, guardamos en la tabla intermedia
    if (newMetrado && obrerosIds.length > 0) {
      const inserts = obrerosIds.map(oid => ({
        metrado_id: (newMetrado as Record<string, unknown>).id,
        obrero_id: oid
      })) as any[];
      try {
        // @ts-expect-error Typescript complain about inserts type
        await supabase.from('metrados_obreros').insert(inserts);
      } catch (_e) {
        // Ignorar
      }
    }

    const autorUser = get().usuarios.find((u: any) => u.nombre_completo === metradoData.firma_ingeniero);
    const finalMetrado = {
      ...(newMetrado as Record<string, unknown>),
      obrero_nombre: metradoData.obrero_nombre || null,
      autor_nombre: autorUser ? autorUser.nombre_completo : metradoData.firma_ingeniero,
      obreros_ids: obrerosIds || [],
      precio_unitario: 0,
      monto_total: 0
    };

    set(state => ({ metrados: [finalMetrado as unknown as MetradoRecord, ...state.metrados] }));
    return { success: true };
  },

  updateMetrado: async (id, updates, obrerosIds) => {
    const { obrero_nombre, obreros_ids, precio_unitario, monto_total, ...dbPayload } = updates as Record<string, unknown>;

    const { data, error } = await supabase
      .from('registro_metrados')
      // @ts-expect-error Typing update dynamically
      .update(dbPayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) return { success: false, error: error.message };

    // Si pasaron obreros, actualizamos (borrar y crear)
    if (obrerosIds !== undefined) {
      const { error: delError } = await supabase.from('metrados_obreros').delete().eq('metrado_id', id);
      if (delError) console.error("Error deleting old obreros:", delError);
      
      // 2. Insert new
      if (obrerosIds.length > 0) {
        const inserts = obrerosIds.map(oid => ({
          metrado_id: id,
          obrero_id: oid
        }));
        // @ts-expect-error Typescript complain about inserts type
        const { error: insError } = await supabase.from('metrados_obreros').insert(inserts);
        if (insError) console.error("Error inserting new obreros:", insError);
      }
    }

    set(state => ({
      metrados: state.metrados.map(m => m.id === id ? { 
        ...m, 
        ...(data as Record<string, unknown>), 
        obrero_nombre: obrero_nombre !== undefined ? (obrero_nombre as string) : m.obrero_nombre,
        obreros_ids: obrerosIds ? obrerosIds : m.obreros_ids
      } as unknown as MetradoRecord : m)
    }));
    return { success: true };
  },

  deleteMetrado: async (id) => {
    const { error } = await supabase
      .from('registro_metrados')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    set(state => ({
      metrados: state.metrados.filter(m => m.id !== id)
    }));
    return { success: true };
  },

  toggleLiberarMetrado: async (id: string, is_liberado: boolean) => {
    const { error } = await (supabase as any).from('registro_metrados').update({ is_liberado }).eq('id', id);
    if (error) return { success: false, error: error.message };
    
    set(state => ({
      metrados: state.metrados.map(m => m.id === id ? { ...m, is_liberado } : m)
    }));
    return { success: true };
  },

  liberarMetradosMasivo: async (ids: string[], is_liberado: boolean) => {
    if (ids.length === 0) return { success: true };
    const { error } = await (supabase as any).from('registro_metrados').update({ is_liberado }).in('id', ids);
    if (error) return { success: false, error: error.message };

    const idsSet = new Set(ids);
    set(state => ({
      metrados: state.metrados.map(m => idsSet.has(m.id) ? { ...m, is_liberado } : m)
    }));
    return { success: true };
  },

  createPartidaPersonalizada: async (partidaData) => {
    if (partidaData.codigo_expediente) {
      const isDuplicate = get().partidas.some(p => p.codigo_expediente.toLowerCase() === partidaData.codigo_expediente!.toLowerCase());
      if (isDuplicate) {
        return { success: false, error: `El código WBS '${partidaData.codigo_expediente}' ya está en uso por otra partida.` };
      }
    }

    const { data, error } = await (supabase as any)
      .from('catalogo_partidas')
      .insert([partidaData])
      .select('id, codigo_expediente, descripcion, unidad_medida, es_agrupador, nivel_arbol, parent_id, ruta_jerarquica, modificacion, proyecto_id, tipo_calculo, especialidad, se_valoriza, es_adicional, precio_unitario_base, cantidad_presupuestada, metrado_acumulado_anterior')
      .single();

    if (error) {
      if (error.code === '23505' || error.message?.includes('unique')) {
        return { success: false, error: 'El código WBS ya existe en la base de datos.' };
      }
      return { success: false, error: error.message };
    }

    if (data) {
      set(state => ({ partidas: [...state.partidas, data as Partida] }));
      return { success: true, data: data as Partida };
    }
    return { success: true };
  },

  aprobarActividadAPartida: async (id, precio, modificacion) => {
    const { data, error } = await (supabase as any)
      .from('catalogo_partidas')
      .update({ se_valoriza: true, precio_unitario_base: precio, modificacion })
      .eq('id', id)
      .select('id, codigo_expediente, descripcion, unidad_medida, es_agrupador, nivel_arbol, parent_id, ruta_jerarquica, modificacion, proyecto_id, tipo_calculo, especialidad, se_valoriza, es_adicional, precio_unitario_base, cantidad_presupuestada, metrado_acumulado_anterior')
      .single();

    if (error) return { success: false, error: error.message };

    if (data) {
      set(state => ({
        partidas: state.partidas.map(p => p.id === id ? (data as Partida) : p)
      }));
    }
    return { success: true };
  },

  updatePartidaMaestra: async (id, updates) => {
    if (updates.codigo_expediente) {
      const isDuplicate = get().partidas.some(p => p.id !== id && p.codigo_expediente.toLowerCase() === updates.codigo_expediente!.toLowerCase());
      if (isDuplicate) {
        return { success: false, error: `El código WBS '${updates.codigo_expediente}' ya está en uso por otra partida.` };
      }
    }

    const { data, error } = await (supabase as any)
      .from('catalogo_partidas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating partida:", error);
      if (error.code === '23505' || error.message?.includes('unique')) {
        return { success: false, error: 'El código WBS ya existe en la base de datos.' };
      }
      return { success: false, error: error.message };
    }

    // 2. ACTUALIZACIÓN RETROACTIVA (Opción B)
    // Si se modificó la descripción, unidad o especialidad, actualizamos todos los metrados históricos
    const metradosUpdates: any = {};
    if (updates.descripcion) metradosUpdates.snapshot_descripcion = updates.descripcion;
    if (updates.unidad_medida) metradosUpdates.unidad = updates.unidad_medida;
    if (updates.especialidad) metradosUpdates.especialidad = updates.especialidad;
    if (updates.codigo_expediente) metradosUpdates.snapshot_codigo = updates.codigo_expediente;

    if (Object.keys(metradosUpdates).length > 0) {
      const { error: metradosError } = await (supabase as any)
        .from('registro_metrados')
        .update(metradosUpdates)
        .eq('partida_id', id);
        
      if (metradosError) {
        console.error("Error updating historical metrados:", metradosError);
      } else {
        // Refrescar los metrados en el frontend para que se vea el cambio en vivo
        get().fetchMetrados();
      }
    }

    if (data) {
      set(state => ({
        partidas: state.partidas.map(p => p.id === id ? { ...p, ...data } : p)
      }));
    }
    return { success: true };
  }
}));

