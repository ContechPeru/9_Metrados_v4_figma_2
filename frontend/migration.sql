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

CREATE TABLE public.catalogo_partidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_expediente TEXT UNIQUE,
    descripcion TEXT,
    unidad_medida TEXT,
    ruta_jerarquica TEXT[],
    nivel_arbol INTEGER,
    es_agrupador BOOLEAN DEFAULT false,
    parent_id UUID REFERENCES public.catalogo_partidas(id) ON DELETE CASCADE,
    proyecto_id UUID, -- Will add FK later
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

-- 2. Data Migration

-- Migrate especialidad -> especialidades
-- The old table used integer ID, but new is UUID. We'll generate new UUIDs but we don't have FKs to integer IDs anyway, they used text.
INSERT INTO public.especialidades (nombre, codigo_prefijos)
SELECT nombre, codigo_prefijos FROM public.especialidad;

-- Migrate usuarios -> usuarios_sistema
INSERT INTO public.usuarios_sistema (
    id, dni_username, password_hash, nombre_completo, correo_institucional,
    area, cargo_rol, especialidad, permisos_json, created_at, last_login,
    es_administrador_presupuesto, es_gerencia, is_active
)
SELECT 
    id, dni_username, password, nombre_completo, correo,
    area, cargo, especialidad, roles_apps, created_at, last_login,
    es_administrador_presupuesto, es_gerencia, is_active
FROM public.usuarios;

-- Migrate trabajadores -> personal_obrero
INSERT INTO public.personal_obrero (
    id, dni, nombres_completos, categoria_laboral, especialidad,
    estado_contrato, sexo, telefono, fecha_ingreso, oficio, cuadrilla
)
SELECT 
    id, dni, 
    COALESCE(nombre_formateado, nombre_original), 
    categoria, especialidad, condicion, sexo, telefono, fecha_ingreso, oficio, cuadrilla
FROM public.trabajadores;

-- Migrate proyectos (schema stays same, just add FK later)
-- Assuming 'proyectos' exists, no need to recreate, just leave it as is.
-- Wait, the new schema uses 'proyectos' as is, so we don't drop it.

-- Migrate partidas -> catalogo_partidas
-- Need to handle parent_id since it refers to itself, order might matter if FK is enforced immediately.
-- Oh wait, we added the FK constraint. We might need to disable triggers or insert without FK first.
ALTER TABLE public.catalogo_partidas DROP CONSTRAINT catalogo_partidas_parent_id_fkey;

INSERT INTO public.catalogo_partidas (
    id, codigo_expediente, descripcion, unidad_medida, ruta_jerarquica,
    nivel_arbol, es_agrupador, parent_id, proyecto_id, tipo_calculo,
    es_adicional, precio_unitario_base, cantidad_presupuestada, se_valoriza,
    acumulado_anterior_qty, metrado_anterior_acumulado, valorizacion_anterior,
    pu_actual, metrado_programado, valorizacion_programada, especialidad, user_id, origen
)
SELECT 
    id, codigo, descripcion, unidad, jerarquia,
    nivel_jerarquia, is_title, parent_id, proyecto_id, tipo_metrado,
    (modificacion = 'PC'), precio_unitario, cantidad_presupuesto, se_valoriza,
    acumulado_anterior_qty, metrado_anterior_acumulado, valorizacion_anterior,
    pu_actual, metrado_programado, valorizacion_programada, especialidad, user_id, origen
FROM public.partidas;

ALTER TABLE public.catalogo_partidas ADD CONSTRAINT catalogo_partidas_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.catalogo_partidas(id) ON DELETE CASCADE;

-- Migrate metrados -> registro_metrados
INSERT INTO public.registro_metrados (
    id, fecha_ejecucion, frente_trabajo, bloque_sector, nivel_piso, cuadrilla,
    partida_id, snapshot_codigo, snapshot_descripcion, unidad, elemento_desc,
    detalle_desc, acero_diametro, cantidad_elementos, medida_largo_area,
    medida_ancho_empalme, medida_alto_gancho, nro_repeticiones, resultado_parcial,
    resultado_total, hvac_item_id, hvac_factor, hvac_item_type, firma_ingeniero,
    created_at, proyecto, especialidad, grado, user_id, plano_sist, plano_num,
    sin_plano, obs_motivo, obs_detalle
)
SELECT 
    id, fecha, frente, bloque, nivel, cuadrilla,
    partida_id, codigo_partida, descripcion_partida, unidad, elemento,
    detalle, diametro, cantidad, longitud_area,
    ancho_empalme, altura_gancho, nro_veces, parcial,
    total, hvac_item_id, hvac_factor, hvac_item_type, autor_usuario,
    created_at, proyecto, especialidad, grado, user_id, plano_sist, plano_num,
    sin_plano, obs_motivo, obs_detalle
FROM public.metrados;

-- Migrate metrado_trabajador -> metrados_obreros
INSERT INTO public.metrados_obreros (metrado_id, obrero_id)
SELECT metrado_id, trabajador_id FROM public.metrado_trabajador;

-- Add FK from catalogo_partidas to proyectos
-- Assuming proyectos exists:
ALTER TABLE public.catalogo_partidas ADD CONSTRAINT catalogo_partidas_proyecto_id_fkey FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id);

-- 3. Drop Old Tables
DROP TABLE public.metrado_trabajador;
DROP TABLE public.metrados;
DROP TABLE public.partidas;
DROP TABLE public.usuarios;
DROP TABLE public.trabajadores;
DROP TABLE public.especialidad;
DROP TABLE public.backup_metrados_mayo_previo; -- cleanup backup tables

-- We keep factores_hvac, proyectos as they are (unless they need renaming but they match the PDF closely enough).
