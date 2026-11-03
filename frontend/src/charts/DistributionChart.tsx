import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CategoryValue } from '../types/dashboard.ts';
import { number } from '../utils/format.ts';

export function DistributionChart({ values, color = '#21A69A' }: { values: CategoryValue[]; color?:string }) {
  return <><div className="distribution-chart"><ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={values} margin={{top:15,right:8,left:-15,bottom:20}} accessibilityLayer><CartesianGrid vertical={false} stroke="#e5edf2"/><XAxis dataKey="label" tick={{fontSize:10}} interval={0} tickFormatter={s=>String(s).replace('años','').replace('Menores de','<').replace('o más','+').replace('desconocida','s/d').replace('desconocido','s/d')} /><YAxis allowDecimals={false} tick={{fontSize:11}}/><Tooltip formatter={v=>[number(Number(v)),'Eventos simulados']}/><Bar dataKey="value" fill={color} radius={[5,5,0,0]} maxBarSize={60} isAnimationActive={false}/></BarChart></ResponsiveContainer></div><div className="distribution-key">{values.map(v=><div key={v.id}><span>{v.label}</span><strong>{number(v.value)} <small>{v.percent===null?'—':`${number(v.percent,1)} %`}</small></strong></div>)}</div><p className="fine-print">Número de hospitalizaciones de la selección; se conserva la categoría desconocida.</p></>;
}
