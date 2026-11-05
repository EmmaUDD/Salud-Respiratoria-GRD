import { isRealData } from '../services/sourceMode.ts';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CategoryValue } from '../types/dashboard.ts';
import { number } from '../utils/format.ts';

export function DistributionChart({ values, color = '#21A69A' }: { values: CategoryValue[]; color?:string }) {
  if (values.length > 8) return <>
    <div style={{ width: '100%', height: values.length * 30 + 50 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={values} layout="vertical" margin={{ top: 8, right: 20, left: 0, bottom: 25 }} accessibilityLayer>
        <CartesianGrid horizontal={false} stroke="#e5edf2" />
        <XAxis type="number" domain={[0, 'auto']} allowDecimals={false} tick={{ fontSize: 11 }} label={{ value: isRealData?'Hospitalizaciones GRD':'Hospitalizaciones simuladas', position: 'bottom', offset: 8 }} />
        <YAxis type="category" dataKey="label" width={110} interval={0} tick={{ fontSize: 11 }} />
        <Tooltip formatter={v => [number(Number(v)), isRealData?'Eventos GRD':'Eventos simulados']} />
        <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} maxBarSize={20} isAnimationActive={false} />
      </BarChart></ResponsiveContainer>
    </div>
    <details><summary>Ver cantidades y porcentajes por tramo</summary><div className="table-wrap"><table><thead><tr><th>Tramo de edad</th><th>Hospitalizaciones</th><th>% de la selección</th></tr></thead><tbody>{values.map(v => <tr key={v.id}><th scope="row">{v.label}</th><td>{number(v.value)}</td><td>{v.percent === null ? '—' : `${number(v.percent, 1)} %`}</td></tr>)}</tbody></table></div></details>
    <p className="fine-print">Tramos en orden de edad; desconocidos al final. Los ceros disponibles se conservan. Son cantidades de eventos {isRealData?'GRD':'ficticios'}, sin ajuste por población.</p>
  </>;
  return <><div className="distribution-chart"><ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={values} margin={{top:15,right:8,left:-15,bottom:20}} accessibilityLayer><CartesianGrid vertical={false} stroke="#e5edf2"/><XAxis dataKey="label" tick={{fontSize:10}} interval={0} tickFormatter={s=>String(s).replace('años','').replace('Menores de','<').replace('o más','+').replace('desconocida','s/d').replace('desconocido','s/d')} /><YAxis allowDecimals={false} tick={{fontSize:11}}/><Tooltip formatter={v=>[number(Number(v)),isRealData?'Eventos GRD':'Eventos simulados']}/><Bar dataKey="value" fill={color} radius={[5,5,0,0]} maxBarSize={60} isAnimationActive={false}/></BarChart></ResponsiveContainer></div><div className="distribution-key">{values.map(v=><div key={v.id}><span>{v.label}</span><strong>{number(v.value)} <small>{v.percent===null?'—':`${number(v.percent,1)} %`}</small></strong></div>)}</div><p className="fine-print">Número de hospitalizaciones de la selección; se conserva la categoría desconocida.</p></>;
}
