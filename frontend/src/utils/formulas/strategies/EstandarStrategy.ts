import type { FormulaStrategy, MetradoFormValues } from './types';

export const EstandarStrategy: FormulaStrategy = {
  isFieldLocked: () => false,
  
  getFieldLabel: (f) => f === 'long' ? 'Largo / Área' : f === 'ancho' ? 'Ancho' : 'Alt. / Gan.',
  
  calcularParcial: (v: MetradoFormValues) => {
    const hasDims = v.long > 0 || v.ancho > 0 || v.alt > 0;
    const l = v.long > 0 ? v.long : 1;
    const a = v.ancho > 0 ? v.ancho : 1;
    const h = v.alt > 0 ? v.alt : 1;
    
    return hasDims ? v.cant * l * a * h : v.cant;
  }
};
