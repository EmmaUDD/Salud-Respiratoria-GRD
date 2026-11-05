import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, RotateCcw, X, CalendarDays } from 'lucide-react';
import type { AgeGroup, FilterOptions, Filters, Sex } from '../types/dashboard.ts';
import { dateLabel } from '../utils/format.ts';

export function FilterBar({ filters, options, onChange, reset }: { filters: Filters; options: FilterOptions; onChange: (filters: Filters) => void; reset: () => void }) {
  const [range, setRange] = useState({ startDate: filters.startDate, endDate: filters.endDate });
  const [extra, setExtra] = useState({ age: filters.age, sex: filters.sex, diagnosis: filters.diagnosis });
  const [rangeError, setRangeError] = useState('');
  const details = useRef<HTMLDetailsElement>(null);
  useEffect(() => { setRange({ startDate: filters.startDate, endDate: filters.endDate }); setRangeError(''); }, [filters.startDate, filters.endDate]);
  useEffect(() => { setExtra({ age: filters.age, sex: filters.sex, diagnosis: filters.diagnosis }); }, [filters.age, filters.sex, filters.diagnosis]);
  const optionLabel = (list: { id: string; label: string }[], id: string) => list.find(o => o.id === id)?.label || id;
  const extraCount = [filters.age, filters.sex, filters.diagnosis].filter(v => v !== 'all').length;
  const changed = range.startDate !== filters.startDate || range.endDate !== filters.endDate;
  const applyRange = () => {
    if (!range.startDate || !range.endDate || range.startDate > range.endDate) { setRangeError('Indica un rango válido: la fecha inicial debe ser anterior o igual a la final.'); return; }
    if (range.startDate < options.minDate || range.endDate > options.maxDate) { setRangeError('El rango debe estar dentro de 2019–2024, la cobertura de demostración.'); return; }
    setRangeError(''); onChange({ ...filters, ...range });
  };
  return <section className="filter-section" aria-label="Filtros de la consulta">
    <div className="filter-heading"><span><SlidersHorizontal size={16} aria-hidden="true" />Personaliza la consulta</span><button className="text-button" onClick={reset}><RotateCcw size={14} />Limpiar filtros</button></div>
    <div className="filter-main">
      <div className="date-range"><label>Desde<input type="date" value={range.startDate} min={options.minDate} max={options.maxDate} aria-invalid={!!rangeError} aria-describedby={rangeError ? 'range-error' : undefined} onChange={e => setRange({ ...range, startDate: e.target.value })} /></label><span className="date-separator" aria-hidden="true">→</span><label>Hasta<input type="date" value={range.endDate} min={options.minDate} max={options.maxDate} aria-invalid={!!rangeError} aria-describedby={rangeError ? 'range-error' : undefined} onChange={e => setRange({ ...range, endDate: e.target.value })} /></label><button className={`button apply-range ${changed ? 'primary' : ''}`} disabled={!changed} onClick={applyRange}>Aplicar rango</button></div>
      <label className="region-filter">Región de atención · simulada<select aria-label="Región de atención · simulada" value={filters.region} onChange={e => onChange({ ...filters, region: e.target.value, commune: 'all' })}><option value="all">Todas las regiones</option>{options.regions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select></label>
      <label className="region-filter">Comuna de atención · simulada<select aria-label="Comuna de atención · simulada" disabled={filters.region === 'all'} value={filters.commune} onChange={e => onChange({ ...filters, commune: e.target.value })}><option value="all">{filters.region === 'all' ? 'Selecciona una región' : 'Todas las comunas'}</option>{options.communes.filter(c => c.region === filters.region).map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select></label>
      <details className="more-filters" ref={details} onKeyDown={event => { if (event.key === 'Escape' && details.current) { details.current.open = false; details.current.querySelector('summary')?.focus(); } }}><summary><SlidersHorizontal size={16} />Más filtros{extraCount > 0 && <span className="filter-count">{extraCount}</span>}</summary><div className="extra-fields">
        <p>Se aplican a los gráficos y al modelo logístico. Diagnóstico selecciona el numerador respiratorio; el universo de egresos se conserva.</p>
        <label>Tramo de edad · formato 2025<select aria-label="Grupo etario" value={extra.age} onChange={e => setExtra({ ...extra, age: e.target.value as AgeGroup })}><option value="all">Todas las edades</option>{options.ages.map(o => <option value={o.id} key={o.id}>{o.label}</option>)}</select></label>
        <label>Sexo registrado<select aria-label="Sexo registrado" value={extra.sex} onChange={e => setExtra({ ...extra, sex: e.target.value as 'all' | Sex })}><option value="all">Todos, incluido desconocido</option>{options.sexes.map(o => <option value={o.id} key={o.id}>{o.label}</option>)}</select></label>
        <label>Diagnóstico respiratorio<select aria-label="Diagnóstico respiratorio" value={extra.diagnosis} onChange={e => setExtra({ ...extra, diagnosis: e.target.value })}><option value="all">Todos los grupos respiratorios</option>{options.diagnoses.map(o => <option value={o.id} key={o.id}>{o.label}</option>)}</select></label>
        <div className="extra-footer"><button className="button" onClick={() => { setExtra({ age: filters.age, sex: filters.sex, diagnosis: filters.diagnosis }); if (details.current) details.current.open = false; }}>Cancelar</button><button className="button primary" onClick={() => { onChange({ ...filters, ...extra }); if (details.current) details.current.open = false; }}>Aplicar filtros</button></div>
      </div></details>
    </div>
    {rangeError && <p className="field-error" role="alert" id="range-error">{rangeError}</p>}
    <div className="filter-bottom"><div className="quick-years"><span>Año completo</span>{[2024, 2023, 2022].map(year => <button className={filters.startDate === `${year}-01-01` && filters.endDate === `${year}-12-31` ? 'selected-year' : ''} key={year} onClick={() => onChange({ ...filters, startDate: `${year}-01-01`, endDate: `${year}-12-31` })}>{year}</button>)}<button onClick={() => onChange({ ...filters, startDate: options.minDate, endDate: options.maxDate })}>2019–2024</button></div><span className="filter-scope">Fecha de referencia: egreso</span></div>
    <div className="active-filters" aria-label="Selección aplicada"><span className="selection-label">Selección activa</span><span className="selection-date"><CalendarDays size={13} />{dateLabel(filters.startDate)} — {dateLabel(filters.endDate)}</span>
      {(['region', 'commune', 'age', 'sex', 'diagnosis'] as const).filter(key => filters[key] !== 'all').map(key => <button className="filter-chip" key={key} onClick={() => onChange({ ...filters, [key]: 'all', ...(key === 'region' ? { commune: 'all' } : {}) })} aria-label={`Quitar filtro ${optionLabel(key === 'region' ? options.regions : key === 'commune' ? options.communes : key === 'age' ? options.ages : key === 'sex' ? options.sexes : options.diagnoses, filters[key])}`}>{optionLabel(key === 'region' ? options.regions : key === 'commune' ? options.communes : key === 'age' ? options.ages : key === 'sex' ? options.sexes : options.diagnoses, filters[key])}<X size={12} /></button>)}
      {extraCount === 0 && filters.region === 'all' && <span className="selection-all">Todas las regiones · todas las edades y sexos · todos los grupos respiratorios</span>}
    </div>
  </section>;
}
