# Exportación GRD v1 y conexión local

Ejecutar desde la raíz: `python Procesamiento/exportar_dashboard.py`. Requiere pandas, numpy y openpyxl. Usa funciones del notebook de limpieza existente; revisar el exportador cuando cambien esas funciones. Los originales y el notebook no se modifican.

## Reglas aplicadas
- Diagnóstico principal J, según los archivos ER existentes.
- Universo: HOSPITALIZACIÓN y HOSPITALIZACIÓN EN URGENCIA. Excluye CMA y HOSPITALIZACIÓN DIURNA; estas categorías se conservan por separado.
- Se eliminan 130 duplicados exactos. Para candidatos se amplía la clave a beneficiario, hospital, ingreso, alta, diagnóstico principal y actividad. Se conserva la primera fila en orden de origen por clave y se excluyen 21 repeticiones. Las coincidencias de la clave anterior que difieren en alta/actividad permanecen y conservan POSIBLE_DUPLICADO; no se borran los 144 candidatos en bloque. Es una regla operativa documentada, no una certificación de identidad clínica de los episodios.
- Se excluyen cinco fechas de ingreso nulas. Todas las exclusiones y grupos candidatos tienen archivos de auditoría comprimidos.
- Se conserva COMUNA_RESIDENCIA; COMUNA y COD_COMUNA_ATENCION representan atención. Códigos enlazados con el catálogo DEIS local de establecimientos; no son una certificación histórica de todos los establecimientos.
- Félix Bulnes: el [Servicio de Salud Metropolitano Occidente](https://ssmoc.redsalud.gob.cl/hospital-felix-bulnes/) describe dos sedes previas y comienzo del traslado el 18/04/2020. El [reporte de traslado del servicio](https://ssmoc.redsalud.gob.cl/salud-occidente-puso-en-marcha-hospital-metropolitano-exclusivo-para-pacientes-covid-19-positivos/) ubica liberación de sede anterior el 23/04/2020. Por prudencia, ingresos anteriores al 23/04/2020 no se asignan a una comuna concreta. No inferir cuál de las dos sedes atendió a la persona. Los demás códigos usan el catálogo actual con ESTADO_TERRITORIO explícito de historia no certificada.
- Las diferencias Coihaique/Coyhaique se resuelven por código; 110110 toma Santiago del catálogo y 200717 toma nombre y comuna del catálogo. No se utilizan asignaciones manuales como evidencia definitiva.
- FECHAALTA para conteos mensuales/interanuales del frontend. FECHA_INGRESO y MES_INGRESO se conservan para preguntas de ingreso separadas. Estancia = alta − ingreso; valor negativo se convierte en ausente.

## Salidas
`GRD_CIE_TM/GRD_limpio/v1/`: siete tablas completas CSV.gz, exclusiones exactas/clave/fecha/actividad, candidatos y reporte JSON con versión, fuentes, cobertura, reglas y sumas. Se usa CSV comprimido para no añadir una dependencia de Parquet. Contiene identificadores de origen: queda ignorado por Git y no se entrega al navegador.

`frontend/public/data/grd-cube.json`: agregado por fecha de alta, comuna de atención, tramo, sexo, diagnóstico y estancia con frecuencia. No contiene identificadores de beneficiario ni fechas de nacimiento. Se conservan frecuencias para obtener mediana exacta de estancias y sumar filtros. Es un artefacto generado local, ignorado por Git, de aproximadamente 23 MB; una API agregada es el siguiente paso para reducir la carga del navegador. No publicar automáticamente este archivo sin revisar el nivel de detalle y los requisitos del equipo.

Resultado: 457.166 eventos; 3.222 sin comuna históricamente asignable según las reglas de esta versión. Se mantienen en totales y categoría desconocida, no se reparten entre comunas. La identidad `entradas = exportadas + exclusiones` se verificó por año.

## Frontend
`.env.local` contiene `VITE_DATA_SOURCE=real` para esta instalación; reiniciar Vite si estaba abierto. Cambiar a `mock` recupera la demostración. El servicio real carga el contrato v1 y los filtros incluyen 2025. No necesita servidor de backend para esta primera conexión local. Los gráficos no reciben identificadores personales.

La proporción entre todos los egresos queda no disponible: ER no incluye el denominador no respiratorio. La actividad logística de demostración se oculta en modo real. Vacunación queda sin asociar: comprobar unidad, campaña, corte, población y residencia/administración frente a atención antes de relacionar fuentes. No se calcula causalidad ni eficacia individual.

## Comprobaciones realizadas
23 pruebas existentes aprobadas. Compilación de frontend correcta. Revisión automatizada: 2024 = 80.819; 2025 = 83.769; total 2019–2025 = 457.166; proporción ausente; selección comunal funcional y vista de vacunación sin mezcla simulada. Reconciliación de los siete CSV y exclusiones con los insumos; suma del cubo igual a filas exportadas. La extensión observada de fechas no prueba exhaustividad ni representatividad nacional.
