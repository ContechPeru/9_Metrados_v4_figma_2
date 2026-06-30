export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      catalogo_partidas: {
        Row: {
          id: string
          codigo_expediente: string | null
          descripcion: string | null
          unidad_medida: string | null
          ruta_jerarquica: string[] | null
          nivel_arbol: number | null
          es_agrupador: boolean | null
          parent_id: string | null
          proyecto_id: string | null
          tipo_calculo: string | null
          es_adicional: boolean | null
          precio_unitario_base: number | null
          cantidad_presupuestada: number | null
          se_valoriza: boolean | null
          metrado_acumulado_anterior: number | null
          monto_acumulado_anterior: number | null
          pu_actual: number | null
          metrado_programado: number | null
          valorizacion_programada: number | null
          especialidad: string | null
          user_id: string | null
          origen: string | null
          modificacion: string | null
          estado_activo: boolean | null
        }
        Insert: {
          id?: string
          codigo_expediente?: string | null
          descripcion?: string | null
          unidad_medida?: string | null
          ruta_jerarquica?: string[] | null
          nivel_arbol?: number | null
          es_agrupador?: boolean | null
          parent_id?: string | null
          proyecto_id?: string | null
          tipo_calculo?: string | null
          es_adicional?: boolean | null
          precio_unitario_base?: number | null
          cantidad_presupuestada?: number | null
          se_valoriza?: boolean | null
          metrado_acumulado_anterior?: number | null
          monto_acumulado_anterior?: number | null
          pu_actual?: number | null
          metrado_programado?: number | null
          valorizacion_programada?: number | null
          especialidad?: string | null
          modificacion?: string | null
          user_id?: string | null
          origen?: string | null
          estado_activo?: boolean | null
        }
        Update: {
          id?: string
          // ... other fields optional
          estado_activo?: boolean | null
        }
      }
      registro_metrados: {
        Row: {
          id: string
          fecha_ejecucion: string | null
          frente_trabajo: string | null
          bloque_sector: string | null
          nivel_piso: string | null
          cuadrilla: string | null
          partida_id: string | null
          snapshot_codigo: string | null
          snapshot_descripcion: string | null
          unidad: string | null
          elemento_desc: string | null
          detalle_desc: string | null
          acero_diametro: string | null
          cantidad_elementos: number | null
          medida_largo_area: number | null
          medida_ancho_empalme: number | null
          medida_alto_gancho: number | null
          nro_repeticiones: number | null
          resultado_parcial: number | null
          resultado_total: number | null
          hvac_item_id: string | null
          hvac_factor: number | null
          hvac_item_type: string | null
          firma_ingeniero: string | null
          created_at: string | null
          proyecto: string | null
          especialidad: string | null
          grado: string | null
          user_id: string | null
          plano_sist: string | null
          plano_num: string | null
          sin_plano: boolean | null
          obs_motivo: string | null
          obs_detalle: string | null
          plano_esp: string | null
        }
        Insert: {
          id?: string
          fecha_ejecucion?: string | null
          // ... all other fields
        }
        Update: {
          id?: string
          // ... all other fields optional
        }
      }
      personal_obrero: {
        Row: {
          id: string
          dni: string | null
          nombres_completos: string | null
          categoria_laboral: string | null
          especialidad: string | null
          estado_contrato: string | null
          sexo: string | null
          telefono: string | null
          fecha_ingreso: string | null
          oficio: string | null
          cuadrilla: string | null
          estado_activo: boolean | null
        }
      }
      especialidades: {
        Row: {
          id: string
          nombre: string
          codigo_prefijos: string[] | null
          estado_activo: boolean | null
        }
      }
      cuadrillas: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          estado_activo: boolean | null
          created_at: string | null
          especialidades: string[] | null
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          estado_activo?: boolean | null
          created_at?: string | null
          especialidades?: string[] | null
        }
        Update: {
          id?: string
          nombre?: string
          descripcion?: string | null
          estado_activo?: boolean | null
          created_at?: string | null
          especialidades?: string[] | null
        }
      }
      obreros_cuadrillas: {
        Row: {
          obrero_id: string
          cuadrilla_id: string
        }
        Insert: {
          obrero_id: string
          cuadrilla_id: string
        }
      }
      usuarios_sistema: {
        Row: {
          id: string
          dni_username: string | null
          password_hash: string | null
          nombre_completo: string | null
          correo_institucional: string | null
          area: string | null
          cargo_rol: string | null
          especialidad: string | null
          permisos_json: Json | null
          created_at: string | null
          last_login: string | null
          es_administrador_presupuesto: boolean | null
          es_gerencia: boolean | null
          is_active: boolean | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
