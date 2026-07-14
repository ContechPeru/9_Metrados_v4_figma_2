-- 1. Create New Tables

CREATE TABLE public.especialidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT UNIQUE NOT NULL,
    codigo_prefijos TEXT[]
);

CREATE TABLE public.tipos_movimiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT UNIQUE NOT NULL,
    afecta_costo BOOLEAN DEFAULT true
);

CREATE TABLE public.proyectos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE,
    estado TEXT DEFAULT 'ACTIVO'
);

CREATE TABLE public.catalogo_partidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_expediente TEXT UNIQUE,
    descripcion TEXT,
    unidad_medida TEXT,
    ruta_jerarquica TEXT[],
    nivel_arbol INTEGER,
    es_agrupador BOOLEAN DEFAULT false,
    parent_id UUID REFERENCES public.catalogo_partidas(id) ON DELETE CASCADE,
    proyecto_id UUID REFERENCES public.proyectos(id),
    tipo_calculo TEXT,
    es_adicional BOOLEAN DEFAULT false,
    precio_unitario_base NUMERIC(12,2),
    cantidad_presupuestada NUMERIC(12,2),
    se_valoriza BOOLEAN DEFAULT true,
    metrado_acumulado_anterior NUMERIC,
    monto_acumulado_anterior NUMERIC,
    pu_actual NUMERIC,
    metrado_programado NUMERIC,
    valorizacion_programada NUMERIC,
    especialidad TEXT,
    user_id UUID,
    origen TEXT
);

CREATE TABLE public.personal_obrero (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dni TEXT UNIQUE,
    nombres_completos TEXT,
    categoria_laboral TEXT,
    especialidad TEXT,
    estado_contrato TEXT,
    sexo TEXT,
    telefono TEXT,
    fecha_ingreso TEXT,
    oficio TEXT,
    cuadrilla TEXT
);

CREATE TABLE public.usuarios_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dni_username TEXT UNIQUE,
    password_hash TEXT,
    nombre_completo TEXT UNIQUE,
    correo_institucional TEXT,
    area TEXT,
    cargo_rol TEXT,
    especialidad TEXT,
    permisos_json JSONB,
    created_at TIMESTAMP DEFAULT now(),
    last_login TIMESTAMP,
    es_administrador_presupuesto BOOLEAN DEFAULT false,
    es_gerencia BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE public.registro_metrados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha_ejecucion DATE,
    frente_trabajo TEXT,
    bloque_sector TEXT,
    nivel_piso TEXT,
    cuadrilla TEXT,
    partida_id UUID REFERENCES public.catalogo_partidas(id),
    snapshot_codigo TEXT,
    snapshot_descripcion TEXT,
    unidad TEXT,
    elemento_desc TEXT,
    detalle_desc TEXT,
    acero_diametro TEXT,
    cantidad_elementos NUMERIC,
    medida_largo_area NUMERIC,
    medida_ancho_empalme NUMERIC,
    medida_alto_gancho NUMERIC,
    nro_repeticiones NUMERIC,
    resultado_parcial NUMERIC,
    resultado_total NUMERIC,
    hvac_item_id UUID,
    hvac_factor NUMERIC,
    hvac_item_type TEXT,
    firma_ingeniero TEXT,
    created_at TIMESTAMP DEFAULT now(),
    proyecto TEXT,
    especialidad TEXT,
    grado TEXT,
    user_id UUID,
    plano_sist TEXT,
    plano_num TEXT,
    sin_plano BOOLEAN,
    obs_motivo TEXT,
    obs_detalle TEXT
);

CREATE TABLE public.metrados_obreros (
    metrado_id UUID REFERENCES public.registro_metrados(id) ON DELETE CASCADE,
    obrero_id UUID REFERENCES public.personal_obrero(id) ON DELETE CASCADE,
    PRIMARY KEY (metrado_id, obrero_id)
);

CREATE TABLE public.catalogo_insumos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_insumo TEXT,
    descripcion TEXT,
    unidad_medida TEXT,
    costo_presupuestado NUMERIC(12,2),
    cantidad_teorica NUMERIC(12,2)
);

CREATE TABLE public.registro_compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nro_comprobante TEXT,
    descripcion_comercial TEXT,
    cantidad_real NUMERIC(12,2),
    precio_unitario_real NUMERIC(12,2),
    tipo_movimiento_id UUID REFERENCES public.tipos_movimiento(id)
);

CREATE TABLE public.homologacion_insumos (
    insumo_catalogo_id UUID REFERENCES public.catalogo_insumos(id),
    compra_id UUID REFERENCES public.registro_compras(id),
    usuario_auditor TEXT,
    PRIMARY KEY (insumo_catalogo_id, compra_id)
);
