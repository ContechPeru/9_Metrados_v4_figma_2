// ─────────────────────────────────────────────
// MOCK DATA — SISTEMA DE METRADOS PERÚ
// ─────────────────────────────────────────────

export type TipoMetrado = 'PC' | 'MM' | 'PN' | 'DD' | 'ET';

export interface MetradoRow {
  id: number;
  fecha: string;
  item: string;
  descripcion: string;
  und: string;
  cant: number;
  long: number;
  ancho: number;
  alt: number;
  parcial: number;
  veces: number;
  autor: string;
  total: number;
  tipo: TipoMetrado;
  especialidad: string;
  frente: string;
  bloque: string;
  nivel: string;
}

export const metradosData: MetradoRow[] = [
  { id: 1, fecha: '11/05', item: 'OE.1.1.1', descripcion: 'Excavación masiva de suelos sueltos con equipo', und: 'm³', cant: 1, long: 15.20, ancho: 8.50, alt: 2.00, parcial: 258.40, veces: 1, autor: 'R. Torres', total: 258.40, tipo: 'MM', especialidad: 'Estructuras', frente: 'Frente A', bloque: 'Bloque 01', nivel: 'Sótano' },
  { id: 2, fecha: '11/05', item: 'OE.1.2.3', descripcion: "Concreto f'c=210 kg/cm² para zapatas aisladas", und: 'm³', cant: 1, long: 2.00, ancho: 2.00, alt: 0.60, parcial: 2.40, veces: 8, autor: 'M. Quispe', total: 19.20, tipo: 'PC', especialidad: 'Estructuras', frente: 'Frente B', bloque: 'Bloque 01', nivel: 'Sótano' },
  { id: 3, fecha: '11/05', item: 'OE.1.3.1', descripcion: "Acero fy=4200 kg/cm² grado 60 en zapatas Ø5/8\"", und: 'kg', cant: 1, long: 0, ancho: 0, alt: 0, parcial: 450.00, veces: 1, autor: 'C. Huanca', total: 450.00, tipo: 'PC', especialidad: 'Estructuras', frente: 'Frente A', bloque: 'Bloque 01', nivel: 'Sótano' },
  { id: 4, fecha: '10/05', item: 'OE.2.1.4', descripcion: 'Encofrado y desencofrado de muros de contención', und: 'm²', cant: 1, long: 12.00, ancho: 1, alt: 3.00, parcial: 36.00, veces: 2, autor: 'R. Torres', total: 72.00, tipo: 'MM', especialidad: 'Estructuras', frente: 'Frente C', bloque: 'Bloque 02', nivel: 'Piso 01' },
  { id: 5, fecha: '10/05', item: 'IE.1.1.2', descripcion: 'Salida de techo para centro de luz con cable NHX-90', und: 'pto', cant: 24, long: 0, ancho: 0, alt: 0, parcial: 24.00, veces: 1, autor: 'J. Vargas', total: 24.00, tipo: 'ET', especialidad: 'IIEE', frente: 'Frente B', bloque: 'Bloque 02', nivel: 'Piso 02' },
  { id: 6, fecha: '10/05', item: 'IS.2.3.1', descripcion: 'Tubería PVC SAP Ø4" agua fría tendido horizontal', und: 'm', cant: 1, long: 45.00, ancho: 1, alt: 1, parcial: 45.00, veces: 1, autor: 'P. Medina', total: 45.00, tipo: 'PN', especialidad: 'IISS', frente: 'Frente A', bloque: 'Bloque 01', nivel: 'Piso 01' },
  { id: 7, fecha: '09/05', item: 'AR.1.1.3', descripcion: 'Tarrajeo rayado o primario en muros interiores', und: 'm²', cant: 1, long: 8.50, ancho: 1, alt: 2.80, parcial: 23.80, veces: 4, autor: 'A. Flores', total: 95.20, tipo: 'DD', especialidad: 'Arquitectura', frente: 'Frente D', bloque: 'Bloque 03', nivel: 'Piso 03' },
  { id: 8, fecha: '09/05', item: 'OE.3.2.1', descripcion: "Concreto f'c=280 kg/cm² para columnas estructurales", und: 'm³', cant: 1, long: 0.45, ancho: 0.45, alt: 3.20, parcial: 0.648, veces: 12, autor: 'M. Quispe', total: 7.78, tipo: 'PC', especialidad: 'Estructuras', frente: 'Frente A', bloque: 'Bloque 01', nivel: 'Piso 02' },
  { id: 9, fecha: '09/05', item: 'OE.3.2.2', descripcion: "Acero fy=4200 kg/cm² en columnas Ø3/4\" (fierrería)", und: 'kg', cant: 1, long: 0, ancho: 0, alt: 0, parcial: 1240.50, veces: 1, autor: 'C. Huanca', total: 1240.50, tipo: 'PC', especialidad: 'Estructuras', frente: 'Frente B', bloque: 'Bloque 02', nivel: 'Piso 02' },
  { id: 10, fecha: '08/05', item: 'HVAC.1.1.1', descripcion: 'Ducto rectangular 400×200mm plancha galvanizada', und: 'm²', cant: 1, long: 12.00, ancho: 1, alt: 1, parcial: 28.80, veces: 1, autor: 'L. Sánchez', total: 28.80, tipo: 'ET', especialidad: 'HVAC', frente: 'Frente C', bloque: 'Bloque 03', nivel: 'Piso 04' },
  { id: 11, fecha: '08/05', item: 'OE.4.1.1', descripcion: "Losa aligerada e=0.20m f'c=210 kg/cm² viguetas", und: 'm²', cant: 1, long: 18.50, ancho: 12.00, alt: 1, parcial: 222.00, veces: 1, autor: 'R. Torres', total: 222.00, tipo: 'MM', especialidad: 'Estructuras', frente: 'Frente A', bloque: 'Bloque 01', nivel: 'Piso 03' },
  { id: 12, fecha: '07/05', item: 'AR.2.1.2', descripcion: 'Piso porcelanato importado 60×60 alto tráfico', und: 'm²', cant: 1, long: 18.50, ancho: 12.00, alt: 1, parcial: 222.00, veces: 1, autor: 'A. Flores', total: 222.00, tipo: 'DD', especialidad: 'Arquitectura', frente: 'Frente B', bloque: 'Bloque 02', nivel: 'Piso 01' },
  { id: 13, fecha: '07/05', item: 'IS.1.2.3', descripcion: 'Inodoro losa vitrificada tanque bajo color blanco', und: 'pza', cant: 18, long: 0, ancho: 0, alt: 0, parcial: 18.00, veces: 1, autor: 'P. Medina', total: 18.00, tipo: 'PN', especialidad: 'IISS', frente: 'Frente D', bloque: 'Bloque 04', nivel: 'Piso 02' },
  { id: 14, fecha: '06/05', item: 'IE.2.2.1', descripcion: 'Tablero distribución TD-01 12 circuitos c/llave ther.', und: 'pza', cant: 4, long: 0, ancho: 0, alt: 0, parcial: 4.00, veces: 1, autor: 'J. Vargas', total: 4.00, tipo: 'ET', especialidad: 'IIEE', frente: 'Frente C', bloque: 'Bloque 03', nivel: 'Piso 01' },
  { id: 15, fecha: '06/05', item: 'OE.5.1.1', descripcion: 'Relleno compactado c/material préstamo c/equipo', und: 'm³', cant: 1, long: 25.00, ancho: 6.00, alt: 0.50, parcial: 75.00, veces: 2, autor: 'R. Torres', total: 150.00, tipo: 'MM', especialidad: 'Estructuras', frente: 'Frente A', bloque: 'Bloque 01', nivel: 'Sótano' },
];

export const kpiData = {
  totalMetrado: 18420.55,
  avancePct: 68.4,
  partidasActivas: 156,
  cuadrillasCampo: 8,
};

export const chartByEspecialidad = [
  { name: 'Estructuras', metrado: 8520, presupuesto: 12400 },
  { name: 'Arquitectura', name2: 'Arq.', metrado: 3240, presupuesto: 5200 },
  { name: 'IIEE', metrado: 1850, presupuesto: 2800 },
  { name: 'IISS', metrado: 2100, presupuesto: 3500 },
  { name: 'HVAC', metrado: 890, presupuesto: 1800 },
];

export const actividadReciente = [
  { id: 1, tipo: 'PC', autor: 'M. Quispe', accion: 'Registró 3 metrados en OE.1.2.3', tiempo: 'Hace 12 min', icon: 'add' },
  { id: 2, tipo: 'MM', autor: 'R. Torres', accion: 'Exportó planilla oficial - Estructuras', tiempo: 'Hace 38 min', icon: 'export' },
  { id: 3, tipo: 'DD', autor: 'A. Flores', accion: 'Actualizó partida AR.1.1.3 - Tarrajeo', tiempo: 'Hace 1h 15min', icon: 'edit' },
  { id: 4, tipo: 'ET', autor: 'J. Vargas', accion: 'Creó cuadrilla IIEE-03 con 5 obreros', tiempo: 'Hace 2h', icon: 'team' },
  { id: 5, tipo: 'PN', autor: 'P. Medina', accion: 'Registró metrado IS.2.3.1 - Tubería 4"', tiempo: 'Hace 3h 22min', icon: 'add' },
];

export const alertas = [
  { id: 1, tipo: 'warning', mensaje: '2 partidas duplicadas detectadas en Estructuras', detalle: 'OE.1.1.1 aparece en Frente A y B sin variación' },
  { id: 2, tipo: 'error', mensaje: '5 ítems sin cuadrilla asignada', detalle: 'Verificar asignación en Arquitectura - Frente D' },
];

export interface Personal {
  id: string;
  nombre: string;
  especialidad: string;
  cuadrilla: string;
  estado: 'Activo' | 'Inactivo' | 'Licencia';
  dni: string;
  ingreso: string;
}

export const personalData: Personal[] = [
  { id: 'OB-001', nombre: 'Carlos Quispe Mamani', especialidad: 'Fierrero', cuadrilla: 'C-01 Estructuras', estado: 'Activo', dni: '45823190', ingreso: '03/01/2024' },
  { id: 'OB-002', nombre: 'Juan Huanca Ccopa', especialidad: 'Carpintero', cuadrilla: 'C-01 Estructuras', estado: 'Activo', dni: '71234567', ingreso: '10/01/2024' },
  { id: 'OB-003', nombre: 'Pedro Medina Rosas', especialidad: 'Gasfitero', cuadrilla: 'C-02 Instalaciones', estado: 'Activo', dni: '60983421', ingreso: '15/01/2024' },
  { id: 'OB-004', nombre: 'Andrés Flores Cáceres', especialidad: 'Albañil', cuadrilla: 'C-03 Arquitectura', estado: 'Activo', dni: '48712390', ingreso: '03/01/2024' },
  { id: 'OB-005', nombre: 'Luis Sánchez Tapia', especialidad: 'Mecánico HVAC', cuadrilla: 'C-04 HVAC', estado: 'Activo', dni: '75312098', ingreso: '20/02/2024' },
  { id: 'OB-006', nombre: 'Jorge Vargas Pinto', especialidad: 'Electricista', cuadrilla: 'C-02 Instalaciones', estado: 'Activo', dni: '62198430', ingreso: '15/01/2024' },
  { id: 'OB-007', nombre: 'Miguel Torres Solis', especialidad: 'Operario', cuadrilla: 'C-01 Estructuras', estado: 'Licencia', dni: '53219087', ingreso: '03/01/2024' },
  { id: 'OB-008', nombre: 'Rosa Condori Yapura', especialidad: 'Operaria', cuadrilla: 'C-03 Arquitectura', estado: 'Activo', dni: '80134521', ingreso: '01/03/2024' },
  { id: 'OB-009', nombre: 'Víctor Paredes Luna', especialidad: 'Fierrero', cuadrilla: 'C-01 Estructuras', estado: 'Activo', dni: '43980217', ingreso: '03/01/2024' },
  { id: 'OB-010', nombre: 'Elena Mamani Quispe', especialidad: 'Pintora', cuadrilla: 'C-03 Arquitectura', estado: 'Inactivo', dni: '91823450', ingreso: '05/04/2024' },
];

export interface CatalogoItem {
  id: string;
  wbs: string;
  descripcion: string;
  und: string;
  tipo: string;
  precio: number | null;
  level: number;
  expanded?: boolean;
  modificacion?: string;
  especialidad?: string;
  se_valoriza?: boolean;
}

export const catalogoData: CatalogoItem[] = [
  { wbs: 'OE', descripcion: 'OBRAS CIVILES Y ESTRUCTURAS', und: '—', tipo: 'ESTÁNDAR', precio: null, level: 1 },
  { wbs: 'OE.1', descripcion: 'OBRAS DE CONCRETO SIMPLE', und: '—', tipo: 'ESTÁNDAR', precio: null, level: 2 },
  { wbs: 'OE.1.1', descripcion: 'Excavaciones', und: '—', tipo: 'MM', precio: null, level: 3 },
  { wbs: 'OE.1.1.1', descripcion: 'Excavación masiva de suelos sueltos c/equipo', und: 'm³', tipo: 'MM', precio: 12.50, level: 4 },
  { wbs: 'OE.1.1.2', descripcion: 'Excavación en roca suelta c/equipo', und: 'm³', tipo: 'MM', precio: 28.00, level: 4 },
  { wbs: 'OE.1.2', descripcion: 'Concreto Ciclópeo y Simple', und: '—', tipo: 'MM', precio: null, level: 3 },
  { wbs: 'OE.1.2.3', descripcion: "Concreto f'c=210 kg/cm² para zapatas", und: 'm³', tipo: 'PC', precio: 350.00, level: 4 },
  { wbs: 'OE.1.3', descripcion: 'Acero de Refuerzo', und: '—', tipo: 'PC', precio: null, level: 3 },
  { wbs: 'OE.1.3.1', descripcion: "Acero fy=4200 kg/cm² Ø5/8\" en zapatas", und: 'kg', tipo: 'PC', precio: 4.80, level: 4 },
  { wbs: 'AR', descripcion: 'ARQUITECTURA Y ACABADOS', und: '—', tipo: 'ESTÁNDAR', precio: null, level: 1 },
  { wbs: 'AR.1', descripcion: 'REVOQUES Y ENLUCIDOS', und: '—', tipo: 'DD', precio: null, level: 2 },
  { wbs: 'AR.1.1.3', descripcion: 'Tarrajeo rayado o primario en muros interiores', und: 'm²', tipo: 'DD', precio: 22.50, level: 3 },
  { wbs: 'AR.2.1.2', descripcion: 'Piso porcelanato 60×60 alto tráfico', und: 'm²', tipo: 'DD', precio: 85.00, level: 3 },
  { wbs: 'IE', descripcion: 'INSTALACIONES ELÉCTRICAS', und: '—', tipo: 'ESTÁNDAR', precio: null, level: 1 },
  { wbs: 'IE.1.1.2', descripcion: 'Salida de techo para centro de luz', und: 'pto', tipo: 'ET', precio: 145.00, level: 3 },
  { wbs: 'IE.2.2.1', descripcion: 'Tablero distribución 12 circuitos', und: 'pza', tipo: 'ET', precio: 520.00, level: 3 },
  { wbs: 'IS', descripcion: 'INSTALACIONES SANITARIAS', und: '—', tipo: 'ESTÁNDAR', precio: null, level: 1 },
  { wbs: 'IS.2.3.1', descripcion: 'Tubería PVC SAP Ø4" agua fría', und: 'm', tipo: 'PN', precio: 38.00, level: 3 },
  { wbs: 'IS.1.2.3', descripcion: 'Inodoro losa vitrificada tanque bajo', und: 'pza', tipo: 'PN', precio: 280.00, level: 3 },
  { wbs: 'HVAC', descripcion: 'INSTALACIONES HVAC / DUCTOS', und: '—', tipo: 'ESTÁNDAR', precio: null, level: 1 },
  { wbs: 'HVAC.1.1.1', descripcion: 'Ducto rectangular 400×200mm plancha galvanizada', und: 'm²', tipo: 'ET', precio: 95.00, level: 3 },
];

export const statusData = {
  componente1: [
    { especialidad: 'Estructuras', presupuesto: 1240000, ejecutado: 847320, pct: 68.3 },
    { especialidad: 'Arquitectura', presupuesto: 520000, ejecutado: 285400, pct: 54.9 },
    { especialidad: 'IIEE', presupuesto: 280000, ejecutado: 198200, pct: 70.8 },
    { especialidad: 'IISS', presupuesto: 350000, ejecutado: 227500, pct: 65.0 },
    { especialidad: 'HVAC', presupuesto: 180000, ejecutado: 72000, pct: 40.0 },
  ],
};
