import { ArrowLeft, Compass } from 'lucide-react';
import { Panel } from '../components/Panel.tsx';

export const plannedViews = {
  territory: { title: 'Territorio', question: '¿Dónde se concentra la carga hospitalaria respiratoria?', items: ['Mapa de Chile con selección regional vinculada a gráficos y tabla.', 'Comparación territorial por volumen y proporción entre egresos.', 'Mapa de calor región × mes para explorar el componente temporal.'], condition: 'Se incorporará geometría geográfica verificable y se validará si el territorio representa residencia o atención. No se mostrarán tasas poblacionales sin denominadores compatibles.' },
  time: { title: 'Evolución temporal', question: '¿Cómo cambia el patrón mensual entre años?', items: ['Comparación de meses equivalentes entre años.', 'Mapa de calor para explorar patrones mensuales y estacionales.', 'Rangos personalizados dentro de la cobertura validada.'], condition: 'La primera etapa ya permite explorar rangos en Panorama general. La comparación interanual se añadirá con reglas explícitas de cobertura y períodos parciales.' },
  profile: { title: 'Perfil y patologías', question: '¿Cómo se distribuyen los eventos por edad, sexo y diagnóstico?', items: ['Distribuciones por edad y sexo, incluyendo categorías desconocidas.', 'Comparación entre grupos de diagnósticos respiratorios.', 'Cruces entre variables solo cuando respondan una pregunta concreta.'], condition: 'Se conservará el mismo universo de eventos y los filtros compartidos. Los resultados se describirán como hospitalizaciones, no como pacientes únicos.' },
  environment: { title: 'Vacunación respiratoria', question: '¿Cómo se distribuyen las dosis de influenza por mes y región?', items: ['Evaluación de fuentes oficiales de vacunación respiratoria.', 'Evaluación de calidad del aire y variables ambientales pertinentes.', 'Comparaciones solo con territorios, períodos y poblaciones compatibles.'], condition: 'Integración pendiente. Todavía no hay datos de vacunación ni ambiente conectados; no se representan asociaciones ficticias como evidencia.' },
};
export type PlannedView = keyof typeof plannedViews;

export function PlannedScreen({ view, back }: { view: PlannedView; back: () => void }) {
  const config = plannedViews[view];
  return <Panel title="Vista prevista para la siguiente etapa" subtitle="El contexto de tus filtros se conserva al volver al Panorama general.">
    <div className="planned-intro"><span className="planned-icon"><Compass size={30} /></span><div><span className="eyebrow">EN PLANIFICACIÓN</span><h2>{config.title}</h2><p>{config.condition}</p></div></div>
    <ol className="planned-list">{config.items.map((item, i) => <li key={item}><span>{String(i + 1).padStart(2, '0')}</span>{item}</li>)}</ol>
    <button className="button primary" onClick={back}><ArrowLeft size={16} />Volver al panorama funcional</button>
  </Panel>;
}
