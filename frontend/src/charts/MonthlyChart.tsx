import { isRealData } from '../services/sourceMode.ts';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, Table2 } from 'lucide-react';
import type { TimePoint } from '../types/dashboard.ts';
import { downloadCsv, monthLabel, number } from '../utils/format.ts';

export function MonthlyChart({ points }: { points: TimePoint[] }) {
  const data = points.map(p => ({ ...p, label: monthLabel(p.period), fullLabel: monthLabel(p.period, true) }));
  return <>
    <div className="chart-axis-label">Hospitalizaciones · número de eventos</div>
    <div className="monthly-chart" aria-label="Evolución mensual de hospitalizaciones respiratorias; valores en tabla desplegable">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart data={data} margin={{ top: 18, right: 20, left: 0, bottom: 8 }} accessibilityLayer>
          <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 4" />
          <XAxis dataKey="period" tickFormatter={p => monthLabel(String(p))} axisLine={false} tickLine={false} minTickGap={24} tickMargin={13} tick={{ fill: '#5c707e', fontSize: 12 }} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={45} tickFormatter={v => number(Number(v))} domain={[0, 'auto']} tick={{ fill: '#5c707e', fontSize: 12 }} />
          <Tooltip labelFormatter={p => monthLabel(String(p), true)} formatter={value => [number(Number(value)), 'Hospitalizaciones']} contentStyle={{ border: '1px solid #dce6ec', borderRadius: 10, color: '#153B50', fontSize: 13 }} />
          <Line type="linear" dataKey="value" name="Hospitalizaciones" stroke="#2876A8" strokeWidth={3} dot={points.length <= 24 ? { r: 4, fill: '#fff', strokeWidth: 2 } : false} activeDot={{ r: 6 }} connectNulls={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
    <div className="chart-bottom"><span><i className="line-swatch" />Hospitalizaciones respiratorias · {isRealData?'GRD local':'datos ficticios'}</span>{points.some(p => p.partial) && <span className="partial-note">El rango incluye meses parciales</span>}</div>
    <div className="chart-tools"><details><summary><Table2 size={15} />Ver datos del gráfico</summary><div className="table-wrap"><table><caption>{isRealData?'Serie mensual GRD.':'Serie mensual simulada.'} Mes del egreso; un mes parcial solo incluye los días seleccionados.</caption><thead><tr><th>Mes</th><th>Eventos</th><th>Período</th></tr></thead><tbody>{points.map(p => <tr key={p.period}><th scope="row">{monthLabel(p.period, true)}</th><td>{p.value === null ? 'No disponible' : number(p.value)}</td><td>{p.partial ? 'Parcial' : 'Completo'}</td></tr>)}</tbody></table></div></details><button className="text-button" onClick={() => downloadCsv([[isRealData?'GRD local — universo hospitalario definido':'DATOS SIMULADOS — no son resultados del proyecto'], ['Mes de egreso', 'Eventos', 'Período'], ...points.map(p => [p.period, p.value === null ? 'No disponible' : String(p.value), p.partial ? 'Parcial' : 'Completo'])], isRealData?'surviral-serie-GRD.csv':'surviral-serie-SIMULADA.csv')}><Download size={14} />Descargar serie</button></div>
  </>;
}
