export type MetradoFormValues = {
  proyecto_id: string;
  fecha: string;
  autor: string;
  especialidad: string;
  frente: string;
  ambiente: string;
  bloque: string;
  nivel: string;
  cuadrilla: string;
  elemento: string;
  detalle: string;
  
  cant: number;
  long: number;
  ancho: number;
  alt: number;
  veces: number;
  diametroAcero?: string;
  hvacItemId?: string; // ID del factor seleccionado en HVAC
  sinPlano?: boolean;
  motivoSinPlano?: string;
  obsSinPlano?: string;
  planoCui?: string;
  planoEntidad?: string;
  planoBloque?: string;
  planoNivel?: string;
  planoEsp?: string;
  planoSist?: string;
  planoTipo?: string;
  planoNum?: string;
  observacion?: string;
};
export interface FormulaStrategy {
  isFieldLocked(field: 'long' | 'ancho' | 'alt', extraData?: any): boolean;
  getFieldLabel(field: 'long' | 'ancho' | 'alt'): string;
  calcularParcial(values: MetradoFormValues, extraData?: any): number;
}
