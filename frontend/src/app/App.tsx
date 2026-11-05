import { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, BookOpen, CalendarDays, CircleHelp, FlaskConical, LayoutDashboard, Syringe, MapPinned, Menu, Users, X } from 'lucide-react';
import type { FilterOptions, Filters, Overview } from '../types/dashboard.ts';
import { dashboardService } from '../services/index.ts';
import { FilterBar } from '../components/FilterBar.tsx';
import { ErrorState, LoadingState } from '../components/AsyncState.tsx';
import { OverviewScreen } from '../screens/OverviewScreen.tsx';
import { MethodologyScreen } from '../screens/MethodologyScreen.tsx';
import { plannedViews, type PlannedView } from '../screens/PlannedScreen.tsx';
import { ExploreScreen } from '../screens/ExploreScreen.tsx';
import { EnvironmentScreen } from '../screens/EnvironmentScreen.tsx';
import { defaultFilters } from './defaults.ts';

type View = 'overview' | 'methodology' | PlannedView;
type Request = { status: 'loading' } | { status: 'error'; message: string } | { status: 'success'; data: Overview };
const navigation = [
  { id: 'overview', label: 'Panorama general', icon: LayoutDashboard },
  { id: 'territory', label: 'Territorio', icon: MapPinned },
  { id: 'time', label: 'Evolución temporal', icon: CalendarDays },
  { id: 'profile', label: 'Perfil y patologías', icon: Users },
  { id: 'environment', label: 'Vacunación respiratoria', icon: Syringe },
  { id: 'methodology', label: 'Metodología y fuentes', icon: BookOpen },
] as const;
function readView(): View { const hash = location.hash.slice(1); return navigation.some(n => n.id === hash) ? hash as View : 'overview'; }

export default function App() {
  const [view, setView] = useState<View>(readView);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({ ...defaultFilters });
  const [forecastHorizon, setForecastHorizon] = useState(1);
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [optionsError, setOptionsError] = useState('');
  const [request, setRequest] = useState<Request>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const reset = () => setFilters({ ...defaultFilters });
  const go = (next: View) => { location.hash = next; setView(next); setMenuOpen(false); };
  useEffect(() => { const changed = () => { setView(readView()); setMenuOpen(false); }; window.addEventListener('hashchange', changed); return () => window.removeEventListener('hashchange', changed); }, []);
  useEffect(() => {
    if (!menuOpen) return;
    document.querySelector<HTMLAnchorElement>('.sidebar nav a[aria-current="page"]')?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); document.querySelector<HTMLButtonElement>('.mobile-menu')?.focus(); }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menuOpen]);
  useEffect(() => {
    const controller = new AbortController();
    setOptionsError('');
    dashboardService.getFilterOptions(controller.signal).then(setOptions).catch(error => { if (!controller.signal.aborted) setOptionsError(error instanceof Error ? error.message : 'No fue posible obtener las opciones de filtros.'); });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => {
    const controller = new AbortController(); setRequest({ status: 'loading' });
    dashboardService.getOverview(filters, controller.signal).then(data => { if (!controller.signal.aborted) setRequest({ status: 'success', data }); }).catch(error => { if (!controller.signal.aborted) setRequest({ status: 'error', message: error instanceof Error ? error.message : 'Error inesperado al consultar los datos.' }); });
    return () => controller.abort();
  }, [filters, attempt]);
  const title = view === 'overview' ? 'Panorama general' : view === 'methodology' ? 'Metodología y fuentes' : plannedViews[view].title;
  const question = view === 'overview' ? '¿Cómo se distribuyen las hospitalizaciones respiratorias en el período y territorio seleccionados?' : view === 'methodology' ? '¿Qué representan estos resultados y cuáles son sus límites?' : plannedViews[view].question;
  return <div className="app-layout">
    <a className="skip-link" href="#main-content">Saltar al contenido</a>
    <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="Navegación principal">
      <a href="#overview" className="brand" onClick={() => go('overview')}><span className="brand-mark"><Activity size={26} strokeWidth={1.8} /></span><span>Surviral<span className="brand-subtitle">DATOS PARA COMPRENDER</span></span></a>
      <div className="sidebar-rule" /><span className="nav-label">EXPLORAR</span>
      <nav>{navigation.map(({ id, label, icon: Icon }) => <a key={id} href={`#${id}`} onClick={() => go(id)} aria-current={view === id ? 'page' : undefined}><Icon size={19} strokeWidth={1.7} /><span>{label}</span>{view === id && <span className="nav-current" aria-hidden="true" />}</a>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><span className="note-dot" />Prototipo académico<p>Hospitalizaciones por enfermedades respiratorias en Chile.</p></div><span className="university">INGENIERÍA · UDD <span>2026</span></span></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" aria-label={menuOpen ? 'Cerrar navegación' : 'Abrir navegación'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button><span className="breadcrumb">Surviral<span>/</span><strong>Explorador respiratorio</strong></span></div><div className="topbar-right"><span className="demo-badge"><FlaskConical size={14} />Datos simulados</span><button className="icon-button help-button" aria-label="Consultar metodología y fuentes" onClick={() => go('methodology')}><CircleHelp size={20} /></button></div></header>
      <main id="main-content" className="main-content">
        <div className="page-heading"><div><span className="eyebrow">HOSPITALIZACIONES RESPIRATORIAS EN CHILE</span><h1>{title}</h1><p>{question}</p></div><button className="button heading-method" onClick={() => go(view === 'methodology' ? 'overview' : 'methodology')}>{view === 'methodology' ? 'Volver al panorama' : 'Acerca de los datos'}<ArrowUpRight size={16} /></button></div>
        <div className="demo-notice"><FlaskConical size={18} /><p><strong>Demostración con datos ficticios.</strong> Las cifras de hospitalizaciones no son resultados GRD ni evidencia sanitaria. Vacunación todavía no está integrada.</p></div>
        {view !== 'methodology' && view !== 'environment' ? <>
          {options && <FilterBar filters={filters} options={options} onChange={setFilters} reset={reset} />}
          {optionsError ? <ErrorState message={optionsError} retry={() => setAttempt(attempt + 1)} /> : request.status === 'loading' || !options ? <LoadingState /> : request.status === 'error' ? <ErrorState message={request.message} retry={() => setAttempt(attempt + 1)} /> : view === 'overview' ? <OverviewScreen data={request.data} reset={reset} methodology={() => go('methodology')} regions={options.regions} onRegion={region => setFilters(f => ({...f,region,commune: 'all', communes: []}))} /> : <ExploreScreen onCommunes={communes => setFilters(f => ({...f,region:'all',commune:'all',communes}))} horizon={forecastHorizon} onHorizon={setForecastHorizon} view={view} data={request.data} options={options} onRegion={region => setFilters(f=>({...f,region,commune: 'all', communes: []}))} reset={reset}/>}
        </> : view === 'methodology' ? <MethodologyScreen /> : <EnvironmentScreen />}
        <footer className="page-footer"><span>Surviral · Análisis de Datos e Inferencia Estadística</span><span>{view === 'environment' ? 'Vacunación · demostración 2024–2025' : 'Hospitalizaciones · demostración 2019–2024'}</span></footer>
      </main>
    </div>
  </div>;
}
