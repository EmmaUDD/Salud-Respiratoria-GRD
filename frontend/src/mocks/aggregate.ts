import { ageBands } from '../utils/ages.ts';
import type { AgeGroup, CategoryValue, Filters, Measure, Overview, TimePoint } from '../types/dashboard.ts';
import { events, filterOptions, type SimulatedEvent } from './data.ts';

export function matchesAge(age: number | null, group: AgeGroup): boolean {
  if (group === 'all') return true;
  if (group === 'unknown') return age === null;
  if (age === null) return false;
  const band = ageBands.find(b => b.id === group);
  return !!band && age >= band.min && age <= band.max;
}

export function validateFilters(f: Filters, options = filterOptions): void {
  for (const date of [f.startDate, f.endDate]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error('Selecciona fechas válidas.');
  }
  if (f.startDate > f.endDate) throw new Error('La fecha inicial no puede ser posterior a la fecha final.');
  if (f.startDate < options.minDate || f.endDate > options.maxDate) throw new Error('La cobertura simulada abarca del 1 de enero de 2019 al 31 de diciembre de 2024.');
  if (f.region !== 'all' && !options.regions.some(o => o.id === f.region)) throw new Error('Territorio no disponible.');
  if (f.communes?.some(id => !options.communes.some(c => c.id === id))) throw new Error('Código de comuna no disponible.');
  if (new Set(f.communes).size !== (f.communes?.length ?? 0)) throw new Error('La selección de comunas contiene duplicados.');
  if (f.commune !== 'all') {
    const commune = options.communes.find(c => c.id === f.commune);
    if (!commune || commune.region !== f.region) throw new Error('La comuna no corresponde a la región seleccionada.');
  }
  if (f.diagnosis !== 'all' && !options.diagnoses.some(o => o.id === f.diagnosis)) throw new Error('Diagnóstico no disponible.');
  if (f.age !== 'all' && !options.ages.some(o => o.id === f.age)) throw new Error('Grupo etario no disponible.');
  if (f.sex !== 'all' && !options.sexes.some(o => o.id === f.sex)) throw new Error('Sexo no disponible.');
}

function measure(value: number | null, unit: Measure['unit'], validCount: number, reason?: Measure['reason']): Measure {
  return { value, status: value === null ? 'unavailable' : 'available', unit, validCount, ...(reason ? { reason } : {}) };
}

export function summarize(filters: Filters, source: readonly SimulatedEvent[] = events, options = filterOptions): Overview {
  validateFilters(filters, options);
  const universe = source.filter(e => e.dischargeDate >= filters.startDate && e.dischargeDate <= filters.endDate
    && (filters.region === 'all' || e.region === filters.region)
    && (filters.commune === 'all' || e.commune === filters.commune)
    && (!filters.communes?.length || filters.communes.includes(e.commune))
    && matchesAge(e.age, filters.age) && (filters.sex === 'all' || e.sex === filters.sex));
  // El diagnóstico modifica el numerador respiratorio, nunca el universo de egresos.
  const selected = universe.filter(e => e.respiratory && (filters.diagnosis === 'all' || e.diagnosis === filters.diagnosis));
  const monthCounts = new Map<string, number>();
  const regionalCounts = new Map<string, number>();
  for (const event of selected) {
    const month = event.dischargeDate.slice(0,7), key = `${event.region}:${month}`;
    monthCounts.set(month,(monthCounts.get(month) ?? 0)+1);
    regionalCounts.set(key,(regionalCounts.get(key) ?? 0)+1);
  }
  const stays = selected.flatMap(e => e.stayDays === null ? [] : [e.stayDays]).sort((a, b) => a - b);
  const middle = Math.floor(stays.length / 2);
  const median = stays.length ? (stays.length % 2 ? stays[middle] : (stays[middle - 1] + stays[middle]) / 2) : null;
  const monthly: TimePoint[] = [];
  const cursor = new Date(`${filters.startDate.slice(0, 7)}-01T00:00:00Z`);
  const lastMonth = filters.endDate.slice(0, 7);
  while (cursor.toISOString().slice(0, 7) <= lastMonth) {
    const period = cursor.toISOString().slice(0, 7);
    const end = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
    monthly.push({ period, value: monthCounts.get(period) ?? 0, status: 'available', partial: filters.startDate > `${period}-01` || filters.endDate < end });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  const distribution = (options: { id: string; label: string }[], predicate: (e: SimulatedEvent, id: string) => boolean): CategoryValue[] => options.map(o => {
    const value = selected.filter(e => predicate(e, o.id)).length;
    return { ...o, value, percent: selected.length ? 100 * value / selected.length : null };
  });
  const selectedRegions = filters.communes?.length ? new Set(options.communes.filter(c => filters.communes!.includes(c.id)).map(c => c.region)) : null;
  const inRegionSelection = (id:string) => (filters.region === 'all' || id === filters.region) && (!selectedRegions || selectedRegions.has(id));
  return {
    status: selected.length ? 'ready' : 'empty',
    indicators: {
      hospitalizations: measure(selected.length, 'events', selected.length),
      proportion: measure(universe.length ? 100 * selected.length / universe.length : null, 'percent', universe.length, universe.length ? undefined : 'zero_denominator'),
      medianStay: measure(median, 'days', stays.length, median === null ? selected.length ? 'missing_values' : 'no_events' : undefined),
    },
    monthly,
    communes: distribution(options.communes.filter(c => (filters.region === 'all' || c.region === filters.region) && (filters.commune === 'all' || c.id === filters.commune) && (!filters.communes?.length || filters.communes.includes(c.id))), (e, id) => e.commune === id),
    regionalMonthly: options.regions.filter(r => inRegionSelection(r.id)).map(r => ({ ...r, points: monthly.map(p => ({ ...p, value: regionalCounts.get(`${r.id}:${p.period}`) ?? 0 })) })),
    diagnoses: distribution(options.diagnoses.filter(o => filters.diagnosis === 'all' || o.id === filters.diagnosis), (e, id) => e.diagnosis === id).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'es')),
    territories: distribution(options.regions.filter(o => inRegionSelection(o.id)), (e, id) => e.region === id),
    demographics: {
      age: distribution(options.ages, (e, id) => matchesAge(e.age, id as AgeGroup)),
      sex: distribution(options.sexes, (e, id) => e.sex === id),
    },
    meta: {
      mode: 'simulated', source: 'Conjunto de demostración Surviral; no contiene registros GRD reales', version: 'demo-3-tramos-2025', updatedAt: '2026-11-04',
      minDate: options.minDate, maxDate: options.maxDate,
      territorialBasis: 'atencion_simulada', temporalBasis: 'discharge',
      definition: 'Eventos ficticios de hospitalización con diagnóstico principal agrupado para la demostración. Fecha de referencia: egreso. Definiciones reales pendientes de validación.',
      appliedFilters: { ...filters }, respiratoryTotal: selected.length, universeTotal: universe.length,
      missingStay: selected.length - stays.length,
      unknownAge: selected.filter(e => e.age === null).length,
      unknownSex: selected.filter(e => e.sex === 'unknown').length,
      warnings: ['Cobertura 2019–2024 exclusivamente simulada; la cobertura real de cada año no está validada.', 'Territorio de atención ficticio; la futura asignación por hospital requiere un catálogo validado y no identifica la residencia.'],
    },
  };
}
