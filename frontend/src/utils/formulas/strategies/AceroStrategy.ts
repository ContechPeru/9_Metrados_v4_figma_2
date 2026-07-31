import type { FormulaStrategy, MetradoFormValues } from './types';

export const PESOS_ACERO: Record<string, number> = {
  "1/4": 0.254,
  "3/8": 0.560,
  "1/2": 0.994,
  "5/8": 1.550,
  "3/4": 2.240,
  "1": 3.970
};

export const AceroStrategy: FormulaStrategy = {
  // En acero, normalmente bloqueamos el empalme a menos que sea un usuario con rol (simplificaremos esto por ahora dejando libre o manejado externamente)
  isFieldLocked: (f, extraData) => {
    // Permitir la edición del empalme para todos (solicitado por el usuario)
    return false;
  }, 
  
  getFieldLabel: (f) => f === 'long' ? 'Long. Recta' : f === 'ancho' ? 'Empalme' : 'Ganchos',
  
  calcularParcial: (v: MetradoFormValues) => {
    // 1. Extrae el valor de la Cantidad de varillas
    const c = v.cant || 0;
    
    // 2. Suma las longitudes
    const longitudTotal = (v.long || 0) + (v.ancho || 0) + (v.alt || 0);
    
    // Protección contra Ceros
    if (c === 0 && longitudTotal === 0) return 0;
    
    // 3. Detecta el diámetro y factor
    const factorKg = v.diametroAcero ? (PESOS_ACERO[v.diametroAcero] || 1) : 1;
    
    // 4. Cálculo final
    return c * longitudTotal * factorKg; 
  }
};
