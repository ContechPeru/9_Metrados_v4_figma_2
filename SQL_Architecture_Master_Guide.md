# SQL Architecture Master Guide

Este documento contiene la arquitectura de la base de datos de Metrados, actualizada según la última migración a la nueva base de datos.

## 1. Módulo Principal de Metrados

**Tabla: proyectos**
- id (UUID, PK)
- nombre (TEXT)
- descripcion (TEXT)
- fecha_inicio (DATE)
- estado (TEXT)

**Tabla: catalogo_partidas**
- id (UUID, PK)
- codigo_expediente (TEXT, UNIQUE)
- descripcion (TEXT)
- unidad_medida (TEXT)
- ruta_jerarquica (TEXT[])
- nivel_arbol (INTEGER)
- es_agrupador (BOOLEAN)
- parent_id (UUID, FK -> catalogo_partidas)
- proyecto_id (UUID, FK -> proyectos)
- tipo_calculo (TEXT)
- es_adicional (BOOLEAN)
- modificacion (TEXT)
- precio_unitario_base (NUMERIC)
- cantidad_presupuestada (NUMERIC)
- se_valoriza (BOOLEAN)

**Tabla: registro_metrados**
- id (UUID, PK)
- fecha_ejecucion (DATE)
- frente_trabajo, bloque_sector, nivel_piso (TEXT)
- cuadrilla (TEXT)
- partida_id (UUID, FK -> catalogo_partidas)
- snapshot_codigo, snapshot_descripcion, unidad (TEXT)
- elemento_desc, detalle_desc (TEXT)
- acero_diametro (TEXT)
- cantidad_elementos, medida_largo_area, medida_ancho_empalme, medida_alto_gancho (NUMERIC)
- nro_repeticiones, resultado_parcial, resultado_total (NUMERIC)
- hvac_item_id, hvac_factor, hvac_item_type (TEXT/NUMERIC)
- firma_ingeniero, proyecto, especialidad, grado, plano_sist, plano_num (TEXT)
- sin_plano (BOOLEAN)
- user_id (UUID)
- obs_motivo, obs_detalle (TEXT)

## 2. Módulo de Personal y Cuadrillas

**Tabla: personal_obrero**
- id (UUID, PK)
- dni (TEXT, UNIQUE)
- nombres_completos, categoria_laboral, especialidad, estado_contrato, sexo, telefono, fecha_ingreso, oficio, cuadrilla (TEXT)

**Tabla: metrados_obreros (Muchos a Muchos)**
- metrado_id (UUID, FK -> registro_metrados)
- obrero_id (UUID, FK -> personal_obrero)
- PK (metrado_id, obrero_id)

**Tabla: cuadrillas (Referencia a futura migración o estado lógico)**
- id (UUID, PK)
- nombre (TEXT, UNIQUE)
- estado_activo (BOOLEAN)
- especialidades (TEXT[])

**Tabla: obreros_cuadrillas (Muchos a Muchos)**
- obrero_id (UUID, FK -> personal_obrero)
- cuadrilla_id (UUID, FK -> cuadrillas)
- PK (obrero_id, cuadrilla_id)

## 3. Módulo del Sistema y Configuración

**Tabla: especialidades**
- id (UUID, PK)
- nombre (TEXT, UNIQUE)
- codigo_prefijos (TEXT[])

**Tabla: usuarios_sistema**
- id (UUID, PK)
- dni_username (TEXT, UNIQUE)
- password_hash, nombre_completo (UNIQUE)
- correo_institucional, area, cargo_rol, especialidad (TEXT)
- permisos_json (JSONB)
- es_administrador_presupuesto, es_gerencia, is_active (BOOLEAN)

## 4. Módulo de Insumos y Compras

**Tabla: tipos_movimiento**
- id (UUID, PK)
- nombre (TEXT, UNIQUE)
- afecta_costo (BOOLEAN)

**Tabla: catalogo_insumos**
- id (UUID, PK)
- codigo_insumo, descripcion, unidad_medida (TEXT)
- costo_presupuestado, cantidad_teorica (NUMERIC)

**Tabla: registro_compras**
- id (UUID, PK)
- nro_comprobante, descripcion_comercial (TEXT)
- cantidad_real, precio_unitario_real (NUMERIC)
- tipo_movimiento_id (UUID, FK -> tipos_movimiento)

**Tabla: homologacion_insumos**
- insumo_catalogo_id (UUID, FK -> catalogo_insumos)
- compra_id (UUID, FK -> registro_compras)
- usuario_auditor (TEXT)
- PK (insumo_catalogo_id, compra_id)
