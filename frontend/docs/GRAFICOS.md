# Catálogo inicial de gráficos

Todos los valores actuales son ficticios. La representación pertenece al frontend; definiciones clínicas, limpieza y análisis definitivo al equipo de datos.

## Evolución mensual

- Pregunta: ¿cómo cambia el número de eventos respiratorios durante el período seleccionado?
- Variables: mes del egreso y número de eventos.
- Unidad: hospitalizaciones; no pacientes ni incidencia.
- Período: rango inclusivo aplicado, agrupación mensual, meses parciales identificados.
- Filtros: fechas, región, edad, sexo y grupo diagnóstico.
- Lectura: una diferencia entre puntos describe la distribución de los eventos seleccionados. En la simulación no es evidencia de estacionalidad real.
- Ausentes: cero si el mes tiene cobertura y no hay eventos; nulo/unavailable si no hay cobertura. No conectar vacíos.
- Acceso: teclado en el gráfico, tabla de valores y CSV rotulado como simulado.

## Ranking diagnóstico

- Pregunta: ¿qué grupos diagnósticos concentran los eventos seleccionados?
- Variables: grupo principal excluyente y número de eventos; porcentaje del total respiratorio seleccionado.
- Unidad: eventos y porcentaje. No tasa poblacional.
- Período y filtros: los mismos que la serie y tarjetas.
- Lectura: compara frecuencias de esta selección; no prevalencias poblacionales.
- Ausentes: grupo no especificado explícito; categorías con cero se conservan. Todos los grupos se muestran, sin un top que oculte el resto.
- Reconciliación: suma de barras = tarjeta de hospitalizaciones = suma mensual.

## Indicadores

Hospitalizaciones: número de eventos. Proporción: eventos respiratorios seleccionados / egresos del universo × 100. Estancia: mediana de estancias válidas, incluyendo cero días y excluyendo ausentes con recuento explícito. Las tres tarjetas comparten selección; diagnóstico no filtra el denominador de egresos. Sin eventos, el conteo es cero y la mediana no se calcula.

## Distribución territorial y mapa de calor

- Pregunta: ¿cómo se distribuyen las hospitalizaciones por región y mes?
- Variables: región de residencia simulada, mes del egreso y conteo. Unidad: eventos, nunca tasas poblacionales.
- Período y filtros: rango activo, edad, sexo y diagnóstico. La selección del mapa modifica el mismo filtro regional que el selector.
- Lectura: intensidad de color proporcional al número de eventos de la selección. No permite comparar riesgo poblacional.
- Ausentes: regiones fuera de selección aparecen grises y con raya; no son cero. El mapa de calor indica meses parciales con asterisco; nulos con raya. Una celda con cobertura y sin eventos muestra 0.
- Reconciliación: la matriz regional mensual suma lo mismo que la serie temporal, las barras territoriales y el indicador. La tabla complementa el mapa.
- Fuente y límites de la geometría: ver `MAPA.md`.

## Comparación interanual

- Pregunta: ¿cómo se distribuyen los eventos de distintos años en meses equivalentes?
- Variables: mes, año y conteo. Unidad: eventos de hospitalización.
- Período y filtros: todos los activos. Con un único año solo se dibuja una línea; con varios se comparan los años contenidos en el rango.
- Lectura: colores, trazos y puntos identifican series; no es una conclusión de estacionalidad real.
- Ausentes: meses fuera del rango quedan vacíos, sin interpolar ni asumir cero. Advertencia de posibles extremos parciales. La tabla de la serie cronológica permite consultar valores exactos y parciales.

## Distribuciones demográficas

- Pregunta: ¿qué grupos de edad y categorías de sexo reúnen los eventos seleccionados?
- Variables: grupo etario / sexo y conteo; porcentaje sobre hospitalizaciones de la selección.
- Unidad: eventos y porcentaje; no pacientes únicos. Período y filtros: todos los activos.
- Lectura: barras de comparación, con valores y etiquetas completos debajo.
- Ausentes: categorías desconocidas explícitas. Con selección vacía se muestran conteos 0 y porcentajes no calculables.

Ambiente y vacunas permanecen sin gráficos hasta validar fuentes compatibles. Se muestran su disponibilidad y las condiciones de integración. No se muestran tasas poblacionales ni mortalidad sin definiciones y datos adecuados.
