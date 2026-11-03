import type { Filters } from './dashboard.ts';
export interface LogisticPoint {
  period: string;
  count: number;
  observed: 0 | 1;
  probability: number;
  quarter: number;
  originHigh: 0 | 1;
  originPeriod: string;
  seasonalHigh: 0 | 1;
}
/** Propuesta de contrato; no es un acuerdo aprobado por el backend. */
export type LogisticPreview = {
  mode: 'simulated';
  filters: Filters;
  cutoff: string;
  horizon: number;
  targetPeriod: string;
  omittedPartialMonth: boolean;
} & ({ status: 'unavailable'; reason: string } | {
  status: 'ready';
  countThreshold: number;
  trainStart: string;
  trainEnd: string;
  trainSize: number;
  trainPositive: number;
  testStart: string;
  testEnd: string;
  test: LogisticPoint[];
  baselineProbability: number;
  brier: number;
  baselineBrier: number;
  next: Omit<LogisticPoint, 'observed' | 'count'>;
  coefficients: { label: string; value: number }[];
});
