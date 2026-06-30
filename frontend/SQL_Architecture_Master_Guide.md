# SQL Architecture Master Guide

> [!NOTE]
> This document is automatically generated and updated whenever a change is made to the SQL Server.

## Database Schema Overview

### Table: `catalogo_insumos`
- **id** (uuid)
- **codigo_insumo** (text,)
- **descripcion** (text,)
- **unidad_medida** (text,)
- **costo_presupuestado** (numeric(12,2),)
- **cantidad_teorica** (numeric(12,2))

### Table: `catalogo_insumos_v2`
- **id** (bigint)
- **item** (text,)
- **procedencia** (text,)
- **codigo** (text,)
- **descripcion** (text,)
- **unidad** (text,)
- **cantidad** (double)
- **costo** (double)
- **total** (double)

### Table: `catalogo_movimientos_v2`
- **id** (bigint)
- **nombre** (text)

### Table: `catalogo_partidas`
- **id** (uuid)
- **codigo_expediente** (text,)
- **descripcion** (text,)
- **unidad_medida** (text,)
- **ruta_jerarquica** (text[],)
- **nivel_arbol** (integer,)
- **es_agrupador** (boolean)
- **parent_id** (uuid,)
- **proyecto_id** (uuid,)
- **tipo_calculo** (text,)
- **es_adicional** (boolean)
- **precio_unitario_base** (numeric(12,2),)
- **cantidad_presupuestada** (numeric(12,2),)
- **se_valoriza** (boolean)
- **acumulado_anterior_qty** (numeric,)
- **metrado_anterior_acumulado** (numeric,)
- **valorizacion_anterior** (numeric,)
- **pu_actual** (numeric,)
- **metrado_programado** (numeric,)
- **valorizacion_programada** (numeric,)
- **especialidad** (text,)
- **user_id** (uuid,)
- **origen** (text,)
- **estado_activo** (boolean)
- 🔗 **Foreign Key**: `especialidad` -> `especialidades.nombre`
- 🔗 **Foreign Key**: `parent_id` -> `catalogo_partidas.id`
- 🔗 **Foreign Key**: `proyecto_id` -> `proyectos.id`
- 🔗 **Foreign Key**: `user_id` -> `usuarios_sistema.id`

### Table: `cuadrillas`
- **id** (uuid)
- **nombre** (text, UNIQUE)
- **descripcion** (text, nullable)
- **estado_activo** (boolean)
- **created_at** (timestamp)

### Table: `especialidades`
- **id** (uuid)
- **nombre** (text)
- **codigo_prefijos** (text[],)
- **estado_activo** (boolean)

### Table: `factores_hvac`
- **id** (uuid)
- **categoria** (character)
- **label** (character)
- **factor** (numeric(15,8))
- **created_at** (timestamp)

### Table: `homologacion_insumos`
- **insumo_catalogo_id** (uuid)
- **compra_id** (uuid)
- **usuario_auditor** (text)
- 🔗 **Foreign Key**: `compra_id` -> `registro_compras.id`
- 🔗 **Foreign Key**: `insumo_catalogo_id` -> `catalogo_insumos.id`

### Table: `mapeo_insumos_v2`
- **id** (bigint)
- **master_id** (bigint,)
- **comprado_id** (bigint,)
- **usuario** (text)
- 🔗 **Foreign Key**: `comprado_id` -> `registro_compras_v2.id`
- 🔗 **Foreign Key**: `master_id` -> `catalogo_insumos_v2.id`

### Table: `metrados_obreros`
- **metrado_id** (uuid)
- **obrero_id** (uuid)
- 🔗 **Foreign Key**: `metrado_id` -> `registro_metrados.id`
- 🔗 **Foreign Key**: `obrero_id` -> `personal_obrero.id`

### Table: `obreros_cuadrillas`
- **obrero_id** (uuid)
- **cuadrilla_id** (uuid)
- 🔗 **Foreign Key**: `obrero_id` -> `personal_obrero.id`
- 🔗 **Foreign Key**: `cuadrilla_id` -> `cuadrillas.id`

### Table: `personal_obrero`
- **id** (uuid)
- **dni** (text,)
- **nombres_completos** (text,)
- **categoria_laboral** (text,)
- **especialidad** (text,)
- **estado_contrato** (text,)
- **sexo** (text,)
- **telefono** (text,)
- **fecha_ingreso** (text,)
- **oficio** (text,)
- **cuadrilla** (text,)
- **estado_activo** (boolean)
- 🔗 **Foreign Key**: `especialidad` -> `especialidades.nombre`

### Table: `proyectos`
- **id** (uuid)
- **codigo** (text)
- **nombre** (text)

### Table: `registro_compras`
- **id** (uuid)
- **nro_comprobante** (text,)
- **descripcion_comercial** (text,)
- **cantidad_real** (numeric(12,2),)
- **precio_unitario_real** (numeric(12,2),)
- **tipo_movimiento_id** (uuid)
- 🔗 **Foreign Key**: `tipo_movimiento_id` -> `tipos_movimiento.id`

### Table: `registro_compras_v2`
- **id** (bigint)
- **item_compra** (text,)
- **anio** (integer,)
- **tipo** (text,)
- **orden** (text,)
- **detalle** (text,)
- **unidad** (text,)
- **cantidad** (double)
- **pu** (double)
- **total** (double)
- **expediente** (text,)
- **observacion** (text,)
- **especialidad** (text,)
- **tipo_id** (bigint,)
- **opinion** (text)
- 🔗 **Foreign Key**: `tipo_id` -> `catalogo_movimientos_v2.id`

### Table: `registro_metrados`
- **id** (uuid)
- **fecha_ejecucion** (date,)
- **frente_trabajo** (text,)
- **bloque_sector** (text,)
- **nivel_piso** (text,)
- **cuadrilla** (text,)
- **partida_id** (uuid,)
- **snapshot_codigo** (text,)
- **snapshot_descripcion** (text,)
- **unidad** (text,)
- **elemento_desc** (text,)
- **detalle_desc** (text,)
- **acero_diametro** (text,)
- **cantidad_elementos** (numeric,)
- **medida_largo_area** (numeric,)
- **medida_ancho_empalme** (numeric,)
- **medida_alto_gancho** (numeric,)
- **nro_repeticiones** (numeric,)
- **resultado_parcial** (numeric,)
- **resultado_total** (numeric,)
- **hvac_item_id** (uuid,)
- **hvac_factor** (numeric,)
- **hvac_item_type** (text,)
- **firma_ingeniero** (text,)
- **created_at** (timestamp)
- **proyecto** (text,)
- **especialidad** (text,)
- **grado** (text,)
- **user_id** (uuid,)
- **plano_sist** (text,)
- **plano_num** (text,)
- **sin_plano** (boolean,)
- **obs_motivo** (text,)
- **obs_detalle** (text)
  - **ambiente** (text)
- 🔗 **Foreign Key**: `especialidad` -> `especialidades.nombre`
- 🔗 **Foreign Key**: `hvac_item_id` -> `factores_hvac.id`
- 🔗 **Foreign Key**: `partida_id` -> `catalogo_partidas.id`
- 🔗 **Foreign Key**: `user_id` -> `usuarios_sistema.id`

### Table: `tipos_movimiento`
- **id** (uuid)
- **nombre** (text)
- **afecta_costo** (boolean)

### Table: `usuarios_sistema`
- **id** (uuid)
- **dni_username** (text,)
- **password_hash** (text,)
- **nombre_completo** (text,)
- **correo_institucional** (text,)
- **area** (text,)
- **cargo_rol** (text,)
- **especialidad** (text,)
- **permisos_json** (jsonb,)
- **created_at** (timestamp)
- **last_login** (timestamp)
- **es_administrador_presupuesto** (boolean)
- **es_gerencia** (boolean)
- **is_active** (boolean)
- 🔗 **Foreign Key**: `especialidad` -> `especialidades.nombre`

---

## Integración Frontend - Supabase

El Frontend ha sido refactorizado para conectarse directamente a Supabase utilizando llamadas asíncronas, eliminando la dependencia de datos simulados (`mockData.ts`). Las correspondencias principales son:

### 1. `Catalogo.tsx` (Catálogo de Partidas)
- **Tabla:** `catalogo_partidas`
- **Condición:** Se filtran únicamente las filas donde `estado_activo = true`.
- **Mapeo:**
  - `wbs` <- `codigo_expediente`
  - `descripcion` <- `descripcion`
  - `unidad` <- `unidad_medida`
  - `tipoCalculo` <- `tipo_calculo`

### 2. `Personal.tsx` (Personal Obrero)
- **Tabla:** `personal_obrero`
- **Mapeo:**
  - `nombres` <- `nombres_completos`
  - `dni` <- `dni`
  - `oficio` <- `oficio`
  - `especialidad` <- `especialidad`
  - `estado` <- `estado_contrato` ("Activo", "Inactivo", "Licencia")
  - `cuadrilla` <- `cuadrilla`

### 3. `Metrados.tsx` (Registro Diario/Semanal de Metrados)
- **Tabla:** `registro_metrados`
- **Mapeo:**
  - `wbs` <- `snapshot_codigo`
  - `descripcion` <- `snapshot_descripcion`
  - `especialidad` <- `especialidad`
  - Todas las dimensiones de aceros, hvac y medidas geométricas se obtienen directamente de los campos respectivos (`medida_largo_area`, `acero_diametro`, etc.).
  - `total` <- `resultado_total`

### 4. `Dashboard.tsx` y `StatusGerencial.tsx` (Tableros de Mando)
- **Tablas Consultadas:** `registro_metrados` y `personal_obrero`
- **se_valoriza** (boolean)
- **acumulado_anterior_qty** (numeric,)
- **metrado_anterior_acumulado** (numeric,)
- **valorizacion_anterior** (numeric,)
- **pu_actual** (numeric,)
- **metrado_programado** (numeric,)
- **valorizacion_programada** (numeric,)
- **especialidad** (text,)
- **user_id** (uuid,)
- **origen** (text,)
- **estado_activo** (boolean)
- 🔗 **Foreign Key**: `especialidad` -> `especialidades.nombre`
- 🔗 **Foreign Key**: `parent_id` -> `catalogo_partidas.id`
- 🔗 **Foreign Key**: `proyecto_id` -> `proyectos.id`
- 🔗 **Foreign Key**: `user_id` -> `usuarios_sistema.id`

### Table: `especialidades`
- **id** (uuid)
- **nombre** (text)
- **codigo_prefijos** (text[],)
- **estado_activo** (boolean)

### Table: `factores_hvac`
- **id** (uuid)
- **categoria** (character)
- **label** (character)
- **factor** (numeric(15,8))
- **created_at** (timestamp)

### Table: `homologacion_insumos`
- **insumo_catalogo_id** (uuid)
- **compra_id** (uuid)
- **usuario_auditor** (text)
- 🔗 **Foreign Key**: `compra_id` -> `registro_compras.id`
- 🔗 **Foreign Key**: `insumo_catalogo_id` -> `catalogo_insumos.id`

### Table: `mapeo_insumos_v2`
- **id** (bigint)
- **master_id** (bigint,)
- **comprado_id** (bigint,)
- **usuario** (text)
- 🔗 **Foreign Key**: `comprado_id` -> `registro_compras_v2.id`
- 🔗 **Foreign Key**: `master_id` -> `catalogo_insumos_v2.id`

### Table: `metrados_obreros`
- **metrado_id** (uuid)
- **obrero_id** (uuid)
- 🔗 **Foreign Key**: `metrado_id` -> `registro_metrados.id`
- 🔗 **Foreign Key**: `obrero_id` -> `personal_obrero.id`

### Table: `personal_obrero`
- **id** (uuid)
- **dni** (text,)
- **nombres_completos** (text,)
- **categoria_laboral** (text,)
- **especialidad** (text,)
- **estado_contrato** (text,)
- **sexo** (text,)
- **telefono** (text,)
- **fecha_ingreso** (text,)
- **oficio** (text,)
- **cuadrilla** (text,)
- **estado_activo** (boolean)
- 🔗 **Foreign Key**: `especialidad` -> `especialidades.nombre`

### Table: `proyectos`
- **id** (uuid)
- **codigo** (text)
- **nombre** (text)

### Table: `registro_compras`
- **id** (uuid)
- **nro_comprobante** (text,)
- **descripcion_comercial** (text,)
- **cantidad_real** (numeric(12,2),)
- **precio_unitario_real** (numeric(12,2),)
- **tipo_movimiento_id** (uuid)
- 🔗 **Foreign Key**: `tipo_movimiento_id` -> `tipos_movimiento.id`

### Table: `registro_compras_v2`
- **id** (bigint)
- **item_compra** (text,)
- **anio** (integer,)
- **tipo** (text,)
- **orden** (text,)
- **detalle** (text,)
- **unidad** (text,)
- **cantidad** (double)
- **pu** (double)
- **total** (double)
- **expediente** (text,)
- **observacion** (text,)
- **especialidad** (text,)
- **tipo_id** (bigint,)
- **opinion** (text)
- 🔗 **Foreign Key**: `tipo_id` -> `catalogo_movimientos_v2.id`

### Table: `registro_metrados`
- **id** (uuid)
- **fecha_ejecucion** (date,)
- **frente_trabajo** (text,)
- **bloque_sector** (text,)
- **nivel_piso** (text,)
- **cuadrilla** (text,)
- **partida_id** (uuid,)
- **snapshot_codigo** (text,)
- **snapshot_descripcion** (text,)
- **unidad** (text,)
- **elemento_desc** (text,)
- **detalle_desc** (text,)
- **acero_diametro** (text,)
- **cantidad_elementos** (numeric,)
- **medida_largo_area** (numeric,)
- **medida_ancho_empalme** (numeric,)
- **medida_alto_gancho** (numeric,)
- **nro_repeticiones** (numeric,)
- **resultado_parcial** (numeric,)
- **resultado_total** (numeric,)
- **hvac_item_id** (uuid,)
- **hvac_factor** (numeric,)
- **hvac_item_type** (text,)
- **firma_ingeniero** (text,)
- **created_at** (timestamp)
- **proyecto** (text,)
- **especialidad** (text,)
- **grado** (text,)
- **user_id** (uuid,)
- **plano_sist** (text,)
- **plano_num** (text,)
- **sin_plano** (boolean,)
- **obs_motivo** (text,)
- **obs_detalle** (text)
  - **ambiente** (text)
- 🔗 **Foreign Key**: `especialidad` -> `especialidades.nombre`
- 🔗 **Foreign Key**: `hvac_item_id` -> `factores_hvac.id`
- 🔗 **Foreign Key**: `partida_id` -> `catalogo_partidas.id`
- 🔗 **Foreign Key**: `user_id` -> `usuarios_sistema.id`

### Table: `tipos_movimiento`
- **id** (uuid)
- **nombre** (text)
- **afecta_costo** (boolean)

### Table: `usuarios_sistema`
- **id** (uuid)
- **dni_username** (text,)
- **password_hash** (text,)
- **nombre_completo** (text,)
- **correo_institucional** (text,)
- **area** (text,)
- **cargo_rol** (text,)
- **especialidad** (text,)
- **permisos_json** (jsonb,)
- **created_at** (timestamp)
- **last_login** (timestamp)
- **es_administrador_presupuesto** (boolean)
- **es_gerencia** (boolean)
- **is_active** (boolean)
- 🔗 **Foreign Key**: `especialidad` -> `especialidades.nombre`

---

## Integración Frontend - Supabase

El Frontend ha sido refactorizado para conectarse directamente a Supabase utilizando llamadas asíncronas, eliminando la dependencia de datos simulados (`mockData.ts`). Las correspondencias principales son:

### 1. `Catalogo.tsx` (Catálogo de Partidas)
- **Tabla:** `catalogo_partidas`
- **Condición:** Se filtran únicamente las filas donde `estado_activo = true`.
- **Mapeo:**
  - `wbs` <- `codigo_expediente`
  - `descripcion` <- `descripcion`
  - `unidad` <- `unidad_medida`
  - `tipoCalculo` <- `tipo_calculo`

### 2. `Personal.tsx` (Personal Obrero)
- **Tabla:** `personal_obrero`
- **Mapeo:**
  - `nombres` <- `nombres_completos`
  - `dni` <- `dni`
  - `oficio` <- `oficio`
  - `especialidad` <- `especialidad`
  - `estado` <- `estado_contrato` ("Activo", "Inactivo", "Licencia")
  - `cuadrilla` <- `cuadrilla`
- **Operaciones CRUD:**
  - **CREATE / UPDATE:** A través del componente `PersonalFormDialog.tsx`, que envía una mutación directamente a Supabase. Si el registro existe (tiene ID), ejecuta un `.update()`; en caso contrario, realiza un `.insert()`.
  - **SOFT DELETE:** El borrado desde el panel lateral no elimina físicamente el registro (para no romper foreign keys en `metrados_obreros`). Se ejecuta un `UPDATE personal_obrero SET estado_activo = false`.

### 3. `Metrados.tsx` (Registro Diario/Semanal de Metrados)
- **Tabla:** `registro_metrados`
- **Mapeo:**
  - `wbs` <- `snapshot_codigo`
  - `descripcion` <- `snapshot_descripcion`
  - `especialidad` <- `especialidad`
  - Todas las dimensiones de aceros, hvac y medidas geométricas se obtienen directamente de los campos respectivos (`medida_largo_area`, `acero_diametro`, etc.).
  - `total` <- `resultado_total`

### 4. `Dashboard.tsx` y `StatusGerencial.tsx` (Tableros de Mando)
- **Tablas Consultadas:** `registro_metrados` y `personal_obrero`
- **Lógica:**
  - El "Avance General" y "Presupuesto Ejecutado" se calculan sumando el campo `resultado_total` por `especialidad`.
  - El "Cuadrillas en Campo" cuenta los valores distintos de `cuadrilla` en `personal_obrero` donde `estado_activo = true`.
  - El "Partidas Activas" cuenta los valores distintos de `snapshot_codigo` en `registro_metrados`.

### 5. `ImportacionExcel.tsx` (Módulo de Inserción Masiva)
- **Tablas:** `catalogo_partidas`, `personal_obrero`, `registro_metrados`, `metrados_obreros`.
- **Lógica:**
  - El Frontend cruza las filas del Excel con el catálogo de partidas y el personal en memoria.
  - Las filas válidas se envían como un único payload JSON al backend.
  - La consolidación atómica se realiza mediante la función RPC `importar_metrados_batch(payload JSONB)`.
  - Dicha función inserta a `registro_metrados` y genera los cruces en `metrados_obreros` automáticamente en una sola transacción, resolviendo el problema de mapeo N:M.
