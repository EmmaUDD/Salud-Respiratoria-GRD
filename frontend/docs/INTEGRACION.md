# Contrato provisional de integración

Estado: propuesta del frontend, pendiente de acuerdo con backend y equipo de datos. Ningún endpoint se considera aprobado. El frontend funciona ahora solo con simulación.

## Punto de conexión

`src/services/index.ts` exporta un `DashboardService`. Las pantallas solo consumen `getFilterOptions` y `getOverview`; nunca importan los eventos. Los gráficos reciben agregados a través de propiedades. Una implementación HTTP futura debe cumplir `src/types/dashboard.ts`, validar sus respuestas en ejecución y respetar `AbortSignal`. Cambiar la implementación del servicio no debería exigir cambiar los gráficos.

No se debe hacer una conversión forzada de JSON a tipos como sustituto de validación. Comprobar fechas, categorías, números finitos no negativos, unidades, disponibilidad, coherencia de metadatos y versión del contrato. No se implementa un adaptador HTTP hasta acordar rutas y respuestas.

## Solicitud

Filtros: `startDate` y `endDate` ISO YYYY-MM-DD (inclusivos); `region` como código estable o `all`; `age`, `sex`, `diagnosis` como claves de catálogo. La cobertura, opciones y etiquetas provienen del servicio. La aplicación no ofrece 2025 ni comunas todavía.

La simulación usa fecha de egreso y región de residencia ficticia. La semántica territorial real debe indicarse en `territorialBasis` (residencia o atención). Cambiar la fecha de referencia requiere actualizar metadatos, interfaz y etiquetas, no solo la consulta.

Diagnóstico filtra los eventos respiratorios (numerador). El denominador conserva todos los egresos del mismo período, territorio, edad y sexo. El catálogo incluye categorías desconocidas. Clasificación respiratoria y universo hospitalario real por definir, incluyendo diagnóstico principal/secundario y exclusión de actividad ambulatoria.

## Respuesta de panorama

Una respuesta conjunta evita mezclar versiones de indicadores y gráficos. Devuelve:

- `status`: ready/empty, referido a los eventos respiratorios seleccionados.
- `indicators.hospitalizations`: conteo de eventos, no personas únicas.
- `indicators.proportion`: porcentaje entre 0 y 100, numerador y denominador en los metadatos.
- `indicators.medianStay`: mediana en días, número de valores válidos y cantidad ausente. No sustituirla por media ni calcular mediana de medianas.
- `monthly`: meses ISO YYYY-MM en orden, valor y bandera de período parcial.
- `diagnoses`: grupos principales excluyentes, incluidos otros/no especificados. Deben sumar el conteo seleccionado.
- `territories`: código, nombre, cantidad y proporción sobre los eventos seleccionados. Su suma reconcilia con el total.
- `regionalMonthly`: una fila `{id, label, points: TimePoint[]}` por región seleccionada. Sus filas suman `territories` y sus columnas suman `monthly`; el frontend usa esta matriz en el mapa de calor.
- `demographics`: edad y sexo con desconocidos explícitos. Cada distribución reconcilia con el total.
- `meta`: modo simulado/real, fuente y versión, actualización, cobertura, definición, semántica temporal y territorial, filtros aplicados y diagnósticos de calidad.

Las opciones de filtros deben representar categorías realmente disponibles y conservar el significado de los códigos. Si una opción no está disponible en una cobertura, omitirla o extender el contrato con disponibilidad y motivo; no inventar resultados.

## Ausencia y error

### Actividad logística provisional

`getLogisticPreview(filters, horizon, signal)` devuelve `LogisticPreview` de `src/types/logistic.ts`. El adaptador simulado ajusta un modelo didáctico con eventos ficticios en `src/mocks/logistic.ts`; la pantalla no accede directamente a ellos. El backend futuro entregará probabilidades y metadatos de un modelo revisado, sin entrenar dentro de un componente visual. No hay endpoint aprobado todavía.

Incluye estado ready/unavailable, razón de insuficiencia, corte de datos, exclusión de mes parcial, umbral de conteo, períodos de entrenamiento/evaluación, probabilidades de evaluación, clases y conteos observados, coeficientes, Brier y referencia, y probabilidad del mes siguiente. `mode` actualmente solo admite simulated; cambiar el contrato y la rotulación cuando exista integración real, nunca cambiar solo la etiqueta.

La fecha inicial limita las gráficas históricas pero no el entrenamiento: usa historia desde enero de 2019 hasta el último mes completo anterior o igual a la fecha final. Todos los filtros de población sí aplican al modelo. La evaluación es directa al horizonte elegido (1–12 meses), con separación temporal y coeficientes congelados; no es un horizonte simultáneo de 12 meses. Condiciones de categorías, ajuste y limitaciones se documentan en `ACTIVIDAD_REGRESION_LOGISTICA.txt`. La idea de pronosticar cantidades queda separada en `IDEA_FUTURA_PRONOSTICO.txt`.

Medidas: `value: 0` con status available es un cero válido; `value: null` con status unavailable informa ausencia/no calculabilidad y su motivo. Denominador cero produce porcentaje nulo. Un mes sin cobertura debe devolver nulo/unavailable, no cero; la línea se interrumpe. La categoría desconocida no representa ausencia de eventos.

La UI tiene carga, error con reintento, consulta cancelada (silenciosa) y selección sin resultados. Un error del backend no debe mostrarse como lista vacía. Las respuestas tardías de una consulta previa se descartan. En integración real, evaluar una instantánea o versión de datos común al resumen completo.

## Archivos Python futuros

El backend puede organizar cálculos en módulos Python por dominio: indicadores, series temporales, territorio y demografía. Devuelve agregados JSON a través del contrato; no necesita entregar imágenes para los gráficos interactivos. No se crean esos módulos dentro del frontend. El equipo acordará dónde vivirán.

## Geografía y nuevas fuentes

La demostración local incorpora geometría referencial con 16 regiones unidas por códigos de dos caracteres. Fuente, transformaciones, alcance y validación pendiente de licencia se documentan en `MAPA.md`. Seleccionar una región actualiza filtros y paneles; la lista y tabla ofrecen alternativas accesibles al mapa. La matriz región × mes usa el mismo universo y reconcilia con los agregados existentes. Antes de conectar el backend, validar si la región representa residencia o atención y la cobertura de la geografía elegida.

Vacunación: vacuna, campaña, dosis/pauta, población objetivo, numerador y denominador de cobertura, fechas y geografía compatibles. Ambiente: contaminante/variable, unidad, estación, agregación territorial, período y cobertura de medición. Fuentes oficiales o institucionales verificadas. No comparar dosis con cobertura ni hospitalizaciones con incidencia. No inferir causalidad de correlaciones o asociaciones agregadas.

Comunas y horizonte: ver `COMUNAS_Y_HORIZONTES.md`. `Filters.commune` y `FilterOptions.communes` son parte del contrato provisional. La comuna modifica también el denominador del universo.
