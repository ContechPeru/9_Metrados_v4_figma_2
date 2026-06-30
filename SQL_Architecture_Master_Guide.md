
### Módulo de Personal (Arquitectura de Cuadrillas Actualizada)
**Tabla: cuadrillas**
- id (UUID, PK)
- nombre (TEXT, UNIQUE)
- estado_activo (BOOLEAN)

**Tabla: obreros_cuadrillas (Muchos a Muchos)**
- obrero_id (UUID, FK -> personal_obrero)
- cuadrilla_id (UUID, FK -> cuadrillas)
- PK (obrero_id, cuadrilla_id)

**Actualización de Cuadrillas (Especialidades)**
- Se ha añadido la columna especialidades (TEXT[]) a la tabla cuadrillas para clasificación en base a la Opción 2.


**Actualización de Catálogo de Partidas**
- Se ha añadido la columna modificacion (TEXT) a la tabla catalogo_partidas para marcar si una partida ha sido modificada u otra nomenclatura interna.
