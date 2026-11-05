import type { TimePoint } from './dashboard.ts';
/** Contrato provisional; no supone que las exportaciones ya estén validadas. */
export interface VaccinationQuery { campaign: 2024 | 2025; region: string }
export interface VaccinationResponse {
  status: 'ready' | 'empty';
  mode: 'simulated' | 'real';
  query: VaccinationQuery;
  unit: 'doses';
  vaccine: 'influenza';
  monthly: TimePoint[];
  territories: { id:string; label:string; value:number|null; status:'available'|'unavailable' }[];
  total: number;
  coverage: { value:number|null; denominator:number|null; reason:string|null };
  meta: { source:string; territorialBasis:'pending'|'residence'|'administration'; campaignDefinition:string; warnings:string[] };
}
