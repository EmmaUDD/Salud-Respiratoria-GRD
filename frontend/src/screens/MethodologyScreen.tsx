import { BookOpen, Download, FileSpreadsheet, FileText, Info } from 'lucide-react';
import { Panel } from '../components/Panel.tsx';

const documents = [
  { name: 'CIE-9', type: 'Hoja de cálculo', spreadsheet: true },
  { name: 'CIE-10', type: 'Hoja de cálculo', spreadsheet: true },
  ...[2019, 2020, 2021, 2022, 2023, 2024].map(year => ({ name: `GRD_PUBLICO_${year}`, type: 'Documento de texto', spreadsheet: false })),
  { name: 'Tablas maestras bases GRD', type: 'Hoja de cálculo', spreadsheet: true },
];

export function MethodologyScreen() {
  return <div className="methodology-content"><Panel title="Definiciones de esta demostración" subtitle="Contratos provisionales para validar con el equipo de datos" action={<BookOpen size={22} />}>
    <dl className="definitions"><div><dt>Hospitalizaciones respiratorias</dt><dd>Número de eventos ficticios marcados como respiratorios y compatibles con los filtros. No son pacientes únicos ni nuevos casos de enfermedad.</dd></div><div><dt>Proporción entre egresos</dt><dd>Eventos respiratorios seleccionados / todos los egresos del mismo período, territorio, edad y sexo × 100. Diagnóstico solo filtra el numerador. Con denominador cero no se calcula un porcentaje.</dd></div><div><dt>Estancia mediana</dt><dd>Mediana de las estancias válidas de los eventos respiratorios seleccionados, en días. Se conserva una estancia válida de cero días y se informa cuántos valores están ausentes.</dd></div><div><dt>Tramos de edad</dt><dd>Grupos de cinco años, desde 0–4 hasta 105–109, y edad desconocida, siguiendo las categorías observadas en GRD 2025. Los datos del mockup siguen siendo ficticios de 2019–2024; la armonización real está en preparación.</dd></div><div><dt>Fechas y territorio</dt><dd>Rango inclusivo basado provisionalmente en fecha de egreso y territorio de atención simulado. La ubicación del hospital no determina la residencia del paciente. La asignación real por código de hospital requiere un catálogo validado.</dd></div></dl>
  </Panel><Panel title="Cobertura y fuentes" subtitle="Fuente demo-3-tramos-2025 · versión de la simulación: 4 de noviembre de 2026">
    <p>Fuente: conjunto determinista creado dentro del frontend, sin registros personales reales. Cubre de enero de 2019 a diciembre de 2024 y contiene 16 regiones y 346 comunas como categorías de demostración. Los eventos se simulan por comuna; no representan registros reales.</p><p>La disponibilidad real de cada año GRD permanece pendiente de validación. No se incorpora 2025. Los grupos diagnósticos son etiquetas didácticas, no una clasificación CIE validada.</p><p>Ambiente y vacunación no se han integrado. No se calculan tasas poblacionales, mortalidad ni correlaciones en esta primera etapa.</p>
    <div className="inline-notice"><Info size={19} /><p>Los patrones observados son ficticios. La pantalla demuestra filtros y presentación, y no permite concluir nada sobre hospitalizaciones reales en Chile.</p></div>
  </Panel><Panel title="Documentos y bases de referencia" subtitle="Archivos previstos para consulta y descarga" action={<span className="panel-tag">Vista de demostración</span>}>
    <p id="documents-download-note" className="fine-print">Las descargas se habilitarán cuando se incorporen los archivos. Estos documentos todavía no alimentan los gráficos de la demostración.</p>
    <ul className="source-documents">{documents.map(document => {
      const Icon = document.spreadsheet ? FileSpreadsheet : FileText;
      return <li key={document.name}><span className={`document-icon ${document.spreadsheet ? 'spreadsheet' : ''}`}><Icon size={21} aria-hidden="true" /></span><div className="document-description"><strong>{document.name}</strong><span>{document.type}</span></div><button className="button document-download" disabled aria-label={`Descargar ${document.name}: próximamente`} aria-describedby="documents-download-note"><Download size={15} aria-hidden="true" /><span>Descargar</span></button></li>;
    })}</ul>
  </Panel><Panel title="Cómo interpretar información ausente">
    <div className="table-wrap"><table><thead><tr><th>Situación</th><th>Representación</th></tr></thead><tbody><tr><td>Conteo disponible de cero</td><td>0 eventos</td></tr><tr><td>Sin egresos para el denominador</td><td>Porcentaje no calculable</td></tr><tr><td>Estancias completamente ausentes</td><td>Mediana no disponible; cantidad ausente explícita</td></tr><tr><td>Edad o sexo desconocidos</td><td>Categoría específica, conservada en los totales</td></tr><tr><td>Período sin cobertura</td><td>No disponible; nunca se sustituirá por cero</td></tr></tbody></table></div>
  </Panel></div>;
}
