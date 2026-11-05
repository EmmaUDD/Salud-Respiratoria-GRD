import { isRealData } from '../services/sourceMode.ts';
import type { TimePoint } from '../types/dashboard.ts';
const months=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
export function YearHeatmap({points}:{points:TimePoint[]}) {
  const years=[...new Set(points.map(p=>p.period.slice(0,4)))];
  const max=Math.max(1,...points.map(p=>p.value??0));
  return <><div className="table-wrap heatmap"><table><caption>{isRealData?'Eventos GRD':'Eventos ficticios'} por mes de egreso. —: fuera del rango o sin dato disponible; 0: sin eventos; *: mes parcial.</caption><thead><tr><th scope="col">Año / mes</th>{months.map(m=><th key={m} scope="col">{m}</th>)}</tr></thead><tbody>{years.map(y=><tr key={y}><th scope="row">{y}</th>{months.map((m,i)=>{const p=points.find(p=>p.period===`${y}-${String(i+1).padStart(2,'0')}`);const v=p?.status==='available'?p.value:null;return <td key={m} style={{background:v==null?'#eef2f5':`rgba(40,118,168,${.08+.72*v/max})`,color:v!=null&&v/max>.55?'white':'#153B50'}} title={`${m} ${y}: ${v??'no disponible'}${p?.partial?' · mes parcial':''}`}>{v??'—'}{p?.partial?'*':''}</td>;})}</tr>)}</tbody></table></div><p className="fine-print">Permite comparar meses equivalentes. Los meses parciales no se deben interpretar como comparables a meses completos. {isRealData?'La selección permite describir conteos, no incidencia ni causalidad.':'La simulación no demuestra estacionalidad real.'}</p></>;
}
