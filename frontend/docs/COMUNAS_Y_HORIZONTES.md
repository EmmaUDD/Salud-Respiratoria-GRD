# Comunas y estimaciones a 1–12 meses

## Datos territoriales

`src/assets/communes.json` contiene únicamente código CUT comunal (5 caracteres), nombre y región (2 caracteres). Se extrajeron 346 filas de [chile-hub, catálogo comunal](https://github.com/cortega26/chile-hub/blob/main/data/normalized/comunas.json); atribución a sus autores y a las fuentes territoriales documentadas por el proyecto. [Condiciones y trazabilidad](https://github.com/cortega26/chile-hub/blob/main/DATA_LICENSES.md). Es un catálogo de referencia, no registros sanitarios ni una validación del campo COMUNA de GRD. Homologar códigos, modificaciones territoriales y residencia/atención con el equipo antes de integrar datos reales. No se usan población estimada ni otras columnas del catálogo.

La versión `demo-2-comunas` crea eventos ficticios por comuna, año y mes de 2019–2024. Los totales cambian respecto de demo-1 porque ahora la muestra tiene cobertura comunal. Las asignaciones y patrones son construidos; no son distribuciones territoriales reales. Todas las pantallas y el modelo siguen calculando desde la misma fuente. Se conserva la insuficiencia de muestra como estado, no se fuerza un ajuste para todos los filtros combinados.

`Filters.commune` es un CUT o `all`. `FilterOptions.communes` devuelve `{id,label,region}`. Elegir región o seleccionarla en el mapa limpia comuna; quitar el chip regional también la limpia. Sin región no se permite elegir comuna. La pareja se valida en el servicio y modifica el universo de egresos y la selección respiratoria. No se incorpora geometría comunal ni se presenta el mapa regional como un mapa de comunas.

## Horizonte directo

`getLogisticPreview(filters,horizon,signal)` recibe un entero 1–12. El selector ofrece los meses posteriores al último mes completo de la fecha final. Con corte diciembre de 2024 son enero–diciembre de 2025. No son predicciones para 2026 ni meses cubiertos por nuevos registros reales.

Para un mes objetivo t y horizonte h, el origen está en t-h. Predictores: trimestre de t, clase del conteo de t-h y clase del conteo de t-12. Los dos conteos son conocidos en el origen si h≤12. Se ajusta un modelo directo por horizonte. No usa el conteo del mes t-1 cuando aún no se conoce ni encadena clases estimadas como si fueran conteos observados.

Evaluación: últimos 12 meses completos como objetivos; entrenamiento termina en el origen del primer objetivo de evaluación. El percentil 75 se calcula solo hasta ese origen. Los h-1 meses entre ese cierre y el primer objetivo no se usan para ajustar ni definir umbral. Para cada fila posterior se utilizan los predictores disponibles en su propio origen, con coeficientes congelados.

Con corte diciembre 2024 y h=12: entrenamiento enero 2020–enero 2023; umbral con conteos enero 2019–enero 2023; evaluación enero–diciembre 2024 desde orígenes enero–diciembre 2023; estimación diciembre 2025 desde origen diciembre 2024. No equivale a 12 predicciones hechas todas en enero 2023.

Mínimo de historia: 47+h meses completos, para mantener 24 filas de entrenamiento, 12 meses iniciales para rezagos y 12 objetivos de evaluación, más la separación temporal requerida. Cinco meses de cada clase siguen siendo una guarda didáctica, no una garantía estadística.

El resultado incluye `horizon`, `targetPeriod`, `originPeriod` y `originHigh`. Sustituyen el supuesto de que el predictor siempre es el mes inmediatamente anterior. El gráfico y CSV de evaluación corresponden al horizonte elegido. Las probabilidades de distintos filtros usan umbrales relativos diferentes: no interpretarlas como ranking de capacidad sanitaria entre comunas.
