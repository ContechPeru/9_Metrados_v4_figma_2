import { create } from 'zustand';
import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabase';

export interface AuthUser {
  id: string;
  nombre_completo: string;
  dni_username: string;
  correo_institucional: string;
  area: string;
  cargo_rol: string;
  especialidad: string;
  especialidades: string[];
  permisos_json: Record<string, any> | null;
  es_administrador_presupuesto: boolean;
  es_gerencia: boolean;
  iniciales: string;
}

export interface SystemConfig {
  metrados_lock?: {
    activo: boolean;
    fecha_cierre: string;
  };
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  systemConfig: SystemConfig | null;
  
  // Acciones
  login: (dni: string, password: string) => Promise<string | null>;
  logout: () => void;
  checkAuth: () => void;
  fetchSystemConfig: () => Promise<void>;
  
  // Guardias de Permisos
  puedeVer: (vista: string) => boolean;
  isReadOnlyMetrados: () => boolean;
  canCrearMetrado: () => boolean;
  canEditMetrado: (metradoFecha: string, autorFila: string) => boolean;
  canLiberarMetrados: () => boolean;
  canExportarPlanilla: () => boolean;
  canGestionarObreros: () => boolean;
  isAdminPresupuesto: () => boolean;
  isGerencia: () => boolean;
  isLiquidaciones: () => boolean;
  isMetrador: () => boolean;
}

const SESSION_KEY = 'gore_cusco_session';

function derivarIniciales(nombre: string): string {
  if (!nombre) return '';
  return nombre.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  systemConfig: null,

  login: async (dni: string, password: string) => {
    if (!dni.trim()) return 'El DNI es requerido.';
    if (!password.trim()) return 'La contraseña es requerida.';

    const { data, error } = await supabase
      .from('usuarios_sistema')
      .select('id, nombre_completo, dni_username, correo_institucional, area, cargo_rol, especialidad, especialidades, permisos_json, es_administrador_presupuesto, es_gerencia, password_hash')
      .eq('dni_username', dni)
      .eq('is_active', true)
      .single() as any;

    if (error || !data) return 'DNI o contraseña incorrectos.';

    const valid = await bcrypt.compare(password, data.password_hash ?? '');
    if (!valid) return 'DNI o contraseña incorrectos.';

    // Actualizar last_login
    // @ts-expect-error Fire and forget update
    supabase.from('usuarios_sistema').update({ last_login: new Date().toISOString() }).eq('id', data.id).then();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash: _hash, ...userWithoutHash } = data;
    const finalUser = { 
      ...userWithoutHash, 
      especialidad: data.especialidad || '',
      especialidades: Array.isArray(data.especialidades) ? data.especialidades : (data.especialidad ? [data.especialidad] : []),
      iniciales: derivarIniciales(data.nombre_completo) 
    } as AuthUser;

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(finalUser));
    
    set({ user: finalUser, isAuthenticated: true });
    
    await get().fetchSystemConfig();
    return null;
  },

  logout: () => {
    sessionStorage.removeItem(SESSION_KEY);
    set({ user: null, isAuthenticated: false, systemConfig: null });
  },

  checkAuth: () => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        set({ user: parsed, isAuthenticated: true });
        get().fetchSystemConfig();

        // Refetch silencioso: actualiza especialidades/permisos sin forzar re-login
        supabase
          .from('usuarios_sistema')
          .select('nombre_completo, especialidades, permisos_json, es_administrador_presupuesto, es_gerencia, cargo_rol')
          .eq('id', parsed.id)
          .eq('is_active', true)
          .single()
          .then(({ data }: any) => {
            if (data) {
              const updated = {
                ...parsed,
                nombre_completo: data.nombre_completo ?? parsed.nombre_completo,
                especialidades: Array.isArray(data.especialidades)
                  ? data.especialidades
                  : (parsed.especialidad ? [parsed.especialidad] : []),
                permisos_json: data.permisos_json,
                es_administrador_presupuesto: data.es_administrador_presupuesto,
                es_gerencia: data.es_gerencia,
                cargo_rol: data.cargo_rol,
              };
              sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
              set({ user: updated });
            }
          });
      }
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },

  fetchSystemConfig: async () => {
    try {
      const { data } = await supabase
        .from('usuarios_sistema')
        .select('permisos_json')
        .eq('dni_username', 'SISTEMA')
        .maybeSingle() as any;
      
      if (data && data.permisos_json) {
        set({ systemConfig: data.permisos_json as SystemConfig });
      }
    } catch (e) {
      console.error("Error al cargar config de SISTEMA", e);
    }
  },

  puedeVer: (vista: string) => {
    const { user, isGerencia, isAdminPresupuesto } = get();
    if (!user) return false;
    if (isAdminPresupuesto() || isGerencia()) return true;
    
    const p = user.permisos_json;
    if (!p) return false;
    
    switch (vista) {
      case 'metrados': return !!p.ver_metrados;
      case 'dashboard': return !!p.ver_dashboard;
      case 'catalogo': return !!p.editar_catalogo;
      case 'personal': return !!p.gestionar_obreros;
      case 'admin': return !!p.acceso_admin;
      case 'status': return !!p.acceso_admin || !!p.ver_metrados;
      case 'liquidaciones': return !!p.acceso_liquidaciones;
      default: return false;
    }
  },

  isReadOnlyMetrados: () => {
    const { user, isGerencia, isAdminPresupuesto } = get();
    if (!user) return true;
    if (isAdminPresupuesto() || isGerencia()) return false;
    
    const p = user.permisos_json;
    return !(p?.crear_metrados || p?.editar_metrados);
  },

  canCrearMetrado: () => {
    const { user, isGerencia, isAdminPresupuesto } = get();
    if (!user) return false;
    if (isAdminPresupuesto() || isGerencia()) return true;
    return !!user.permisos_json?.crear_metrados;
  },

  canEditMetrado: (metradoFecha: string, autorFila: string) => {
    const { user, systemConfig, isGerencia, isAdminPresupuesto } = get();
    if (!user) return false;
    if (isAdminPresupuesto() || isGerencia()) return true;

    const p = user.permisos_json;
    if (!p?.editar_metrados) return false;

    // Row-level Security: El usuario "SISTEMA" define candado temporal
    if (systemConfig?.metrados_lock?.activo) {
      const lockDate = systemConfig.metrados_lock.fecha_cierre;
      if (metradoFecha && lockDate && metradoFecha <= lockDate) {
        return false;
      }
    }

    // Autoría: Todos solo editan los suyos, excepto Jefe Especialidad
    const rol = user.cargo_rol?.toUpperCase() ?? '';
    if (rol !== 'JEFE ESPECIALIDAD') {
      if (autorFila) {
        const normalizar = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalizar(autorFila) !== normalizar(user.nombre_completo)) {
          return false;
        }
      }
    }

    return true;
  },

  canLiberarMetrados: () => {
    const { user, isGerencia, isAdminPresupuesto } = get();
    if (!user) return false;
    if (isAdminPresupuesto() || isGerencia()) return true;
    return !!user.permisos_json?.liberar_metrados;
  },

  canExportarPlanilla: () => {
    const { user, isGerencia, isAdminPresupuesto } = get();
    if (!user) return false;
    if (isAdminPresupuesto() || isGerencia()) return true;
    return !!user.permisos_json?.exportar_planilla;
  },

  // NUEVO — Gestión de obreros y cuadrillas (/personal)
  canGestionarObreros: () => {
    const { user, isGerencia, isAdminPresupuesto } = get();
    if (!user) return false;
    if (isAdminPresupuesto() || isGerencia()) return true;
    return !!user.permisos_json?.gestionar_obreros;
  },

  isAdminPresupuesto: () => {
    const user = get().user;
    if (!user) return false;
    return user.es_administrador_presupuesto || user.permisos_json?.admin_presupuesto === true;
  },
  
  isGerencia: () => get().user?.es_gerencia || false,
  
  isLiquidaciones: () => {
    const user = get().user;
    if (!user) return false;
    return !!user.permisos_json?.acceso_liquidaciones;
  },

  isMetrador: () => {
    const { user } = get();
    return user?.cargo_rol?.toLowerCase().includes('metrador') ?? false;
  }
}));