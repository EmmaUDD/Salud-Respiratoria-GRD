/** Contratos provisionales: requieren validación con el equipo de datos. */
export type Sex = 'female' | 'male' | 'unknown';
export type AgeGroup = 'all' | '0to4' | '5to9' | '10to14' | '15to19' | '20to24' | '25to29' | '30to34' | '35to39' | '40to44' | '45to49' | '50to54' | '55to59' | '60to64' | '65to69' | '70to74' | '75to79' | '80to84' | '85to89' | '90to94' | '95to99' | '100to104' | '105to109' | 'unknown';
export interface Filters {
  startDate: string;
  endDate: string;
  region: string;
  commune: string;
  age: AgeGroup;
  sex: 'all' | Sex;
  diagnosis: string;
}
export interface Option { id: string; label: string }
export interface FilterOptions {
  minDate: string;
  maxDate: string;
  years: number[];
  regions: Option[];
  communes: (Option & { region: string })[];
  ages: Option[];
  sexes: Option[];
  diagnoses: Option[];
}
export interface Measure {
  value: number | null;
  status: 'available' | 'unavailable';
  reason?: 'zero_denominator' | 'no_events' | 'missing_values';
  unit: 'events' | 'percent' | 'days';
  validCount: number;
}
export interface TimePoint {
  period: string;
  value: number | null;
  status: 'available' | 'unavailable';
  partial: boolean;
}
export interface CategoryValue {
  id: string;
  label: string;
  value: number;
  percent: number | null;
}
export interface SourceMetadata {
  mode: 'simulated' | 'real';
  source: string;
  version: string;
  updatedAt: string;
  minDate: string;
  maxDate: string;
  territorialBasis: 'residencia_simulada' | 'atencion_simulada' | 'residencia' | 'atencion';
  temporalBasis: 'discharge' | 'admission';
  definition: string;
  appliedFilters: Filters;
  respiratoryTotal: number;
  universeTotal: number;
  missingStay: number;
  unknownAge: number;
  unknownSex: number;
  warnings: string[];
}
export interface Overview {
  status: 'ready' | 'empty';
  indicators: { hospitalizations: Measure; proportion: Measure; medianStay: Measure };
  monthly: TimePoint[];
  diagnoses: CategoryValue[];
  territories: CategoryValue[];
  regionalMonthly: { id: string; label: string; points: TimePoint[] }[];
  demographics: { age: CategoryValue[]; sex: CategoryValue[] };
  meta: SourceMetadata;
}
export interface DashboardService {
  getFilterOptions(signal?: AbortSignal): Promise<FilterOptions>;
  getOverview(filters: Filters, signal?: AbortSignal): Promise<Overview>;
  getLogisticPreview(filters: Filters, horizon: number, signal?: AbortSignal): Promise<import('./logistic.ts').LogisticPreview>;
}
