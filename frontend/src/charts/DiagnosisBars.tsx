import type { CategoryValue } from '../types/dashboard.ts';
import { number } from '../utils/format.ts';

export function DiagnosisBars({ values, total, label = 'Grupo diagnóstico' }: { values: CategoryValue[]; total: number; label?: string }) {
  const maximum = Math.max(1, ...values.map(v => v.value));
  return <>
    <div className="ranking-columns" aria-hidden="true"><span>{label}</span><span>Eventos / % del total</span></div>
    <ol className="diagnosis-bars">{values.map((d, i) => <li key={d.id}><div className="diagnosis-row"><span className="rank-index">{String(i + 1).padStart(2, '0')}</span><span className="diagnosis-name">{d.label}</span><span className="diagnosis-number">{number(d.value)} <span>{d.percent === null ? '—' : `${number(d.percent, 1)}%`}</span></span></div><div className="bar-track" aria-hidden="true"><div style={{ width: `${100 * d.value / maximum}%` }} /></div></li>)}</ol>
    <p className="chart-reading">Se muestran todos los grupos de la selección, incluidos los no especificados. Suma de eventos: <strong>{number(total)}</strong>.</p>
  </>;
}
