import type { TimePoint } from '../types/dashboard.ts';
export function Heatmap({rows}:{rows:{id:string;label:string;points:TimePoint[]}[]}) {
  const periods=[...new Set(rows.flatMap(r=>r.points.map(p=>p.period)))].sort();
  const max=Math.max(1,...rows.flatMap(r=>r.points.map(p=>p.value??0)));
  return <><div className="table-wrap heatmap"><table><caption>Hospitalizaciones simuladas. Cada celda muestra el conteo exacto; mayor intensidad indica más eventos. * Mes parcial.</caption><thead><tr><th scope="col">Región / período</th>{periods.map(p=><th scope="col" key={p}>{p.slice(5)}/{p.slice(2,4)}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id}><th scope="row">{r.label}</th>{periods.map(period=>{const point=r.points.find(p=>p.period===period);const v=point?.value; return <td key={period} style={{background:v==null?'#eef2f5':`rgba(40,118,168,${.08+.72*v/max})`,color:v!=null&&v/max>.55?'white':'#153B50'}} title={`${r.label}, ${period}: ${v??'no disponible'}${point?.partial?' (mes parcial)':''}`}>{v??'—'}{point?.partial?'*':''}</td>;})}</tr>)}</tbody></table></div></>;
}
