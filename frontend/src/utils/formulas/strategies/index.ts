import type { FormulaStrategy } from './types';
import { EstandarStrategy } from './EstandarStrategy';
import { AceroStrategy } from './AceroStrategy';
import { HvacStrategy } from './HvacStrategy';

export * from './types';
export * from './EstandarStrategy';
export * from './AceroStrategy';
export * from './HvacStrategy';

export const formulaRegistry: Record<string, FormulaStrategy> = {
  'ESTANDAR': EstandarStrategy,
  'ACERO': AceroStrategy,
  'HVAC': HvacStrategy
};
