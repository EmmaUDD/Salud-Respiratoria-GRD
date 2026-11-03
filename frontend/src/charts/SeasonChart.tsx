import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TimePoint } from '../types/dashboard.ts';
const months=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const colors=['#2876A8','#167c73','#9b671e','#785a97','#153B50','#ab485c'];
export function SeasonChart({points}:{points:TimePoint[]}) {
  const years=[...new Set(points.map(p=>p.period.slice(0,4)))];
  const rows=months.map((month,i)=>Object.fromEntries([['month',month],...years.map(y=>[y,points.find(p=>p.period===`${y}-${String(i+1).padStart(2,'0')}`)?.value??null])]));
  return <><div className="monthly-chart"><ResponsiveContainer width="100%" height="100%" minWidth={0}><LineChart data={rows} accessibilityLayer><CartesianGrid vertical={false} stroke="#e5edf2"/><XAxis dataKey="month" tick={{fontSize:11}}/><YAxis allowDecimals={false} width={35}/><Tooltip/><Legend/>{years.map((y,i)=><Line key={y} dataKey={y} stroke={colors[i%colors.length]} strokeDasharray={i%2?'6 3':undefined} strokeWidth={2} dot={{r:3}} connectNulls={false} isAnimationActive={false}/>)}</LineChart></ResponsiveContainer></div><p className="fine-print">Cada línea corresponde a un año seleccionado. Los meses fuera del rango quedan vacíos. Los extremos pueden ser meses parciales. Amplía el período para comparar años.</p></>;
}
