import type { FormulaStrategy, MetradoFormValues } from './types';

export const HvacStrategy: FormulaStrategy = {
  // Bloquea longitud si el ítem seleccionado es un accesorio estático (ej. no es ducto ni codo)
  isFieldLocked: (f, extraData) => {
    if (f !== 'long') return false;
    const hvacItemType = extraData?.hvacItemType || '';
    // Si no es CODO ni DUCTO, bloqueamos el largo (ej. TEE, DIFUSOR, REJILLA)
    const isLongitudinal = hvacItemType.includes('CODO') || hvacItemType.includes('DUCTO');
    return !isLongitudinal;
  }, 
  
  getFieldLabel: (f) => f === 'long' ? 'Longitud' : f === 'ancho' ? 'Ancho' : 'Alto',
  
  calcularParcial: (v: MetradoFormValues, extraData) => {
    const c = v.cant > 0 ? v.cant : 1;
    
    const hvacItemType = extraData?.hvacItemType || '';
    const hvacFactor = extraData?.hvacFactor !== undefined ? Number(extraData.hvacFactor) : 1;
    
    // La longitud solo cuenta si es Ducto o Codo
    const usesLong = hvacItemType.includes('CODO') || hvacItemType.includes('DUCTO');
    const l = usesLong ? (v.long !== 0 ? v.long : 1) : 1;
    
    const a = v.ancho !== 0 ? v.ancho : 1;
    const h = v.alt !== 0 ? v.alt : 1;
    
    // Multiplicación final con factor secreto
    return c * l * a * h * hvacFactor;
  }
};
