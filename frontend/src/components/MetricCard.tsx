import type { LucideIcon } from 'lucide-react';
import type { Measure } from '../types/dashboard.ts';
import { number } from '../utils/format.ts';

export function MetricCard({ title, measure, detail, icon: Icon, tone = 'blue' }: { title: string; measure: Measure; detail: string; icon: LucideIcon; tone?: 'blue' | 'teal' | 'navy' }) {
  const unavailable = measure.reason === 'missing_denominator' ? 'No disponible: falta el universo completo de egresos.' : measure.reason === 'zero_denominator' ? 'No calculable: sin egresos en el universo.' : measure.reason === 'missing_values' ? 'Estancia no disponible en los eventos seleccionados.' : 'Sin eventos para calcular la mediana.';
  return <section className={`metric-card ${tone}`} aria-label={title}>
    <div className="metric-top"><h2>{title}</h2><span className="metric-icon"><Icon size={21} strokeWidth={1.7} aria-hidden="true" /></span></div>
    <div className="metric-value" data-testid={`metric-${measure.unit}`}>{measure.value === null ? '—' : number(measure.value, measure.unit === 'events' ? 0 : 1)}{measure.value !== null && measure.unit !== 'events' && <span>{measure.unit === 'percent' ? '%' : 'días'}</span>}</div>
    <p>{measure.value === null ? unavailable : detail}</p>
  </section>;
}
