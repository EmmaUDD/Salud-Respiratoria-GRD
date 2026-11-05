import type { CategoryValue } from '../types/dashboard.ts';
import { number } from '../utils/format.ts';

export function DiagnosisBars({ values, total, label = 'Grupo diagnóstico' }: { values: CategoryValue[]; total: number; label?: string }) {
  const other=values.slice(10).reduce((s,v)=>s+v.value,0);
  const shown=values.length>12?[...values.slice(0,10),{id:'__remaining',label:`Otros ${values.length-10} elementos`,value:other,percent:total?100*other/total:null}]:values;
  const maximum = Math.max(1, ...shown.map(v => v.value));
  return <>
    <div className="ranking-columns" aria-hidden="true"><span>{label}</span><span>Eventos / % del total</span></div>
    <ol className="diagnosis-bars">{shown.map((d, i) => <li key={d.id}><div className="diagnosis-row"><span className="rank-index">{String(i + 1).padStart(2, '0')}</span><span className="diagnosis-name">{d.label}</span><span className="diagnosis-number">{number(d.value)} <span>{d.percent === null ? '—' : `${number(d.percent, 1)}%`}</span></span></div><div className="bar-track" aria-hidden="true"><div style={{ width: `${100 * d.value / maximum}%` }} /></div></li>)}</ol>
    {values.length>12&&<details><summary>Ver todos los códigos y conteos</summary><div className="table-wrap"><table><thead><tr><th>Elemento</th><th>Eventos</th></tr></thead><tbody>{values.map(v=><tr key={v.id}><th scope="row">{v.label}</th><td>{number(v.value)}</td></tr>)}</tbody></table></div></details>}
    <p className="chart-reading">Las selecciones extensas muestran los primeros diez y el resto agrupado; la tabla conserva todos los elementos. Suma de eventos: <strong>{number(total)}</strong>.</p>
  </>;
}
