# Normalización de datos GRD

`normalizar_grd.py` procesa todos los archivos `GRD_PUBLICO_AAAA.txt` sin
modificar los originales. La salida queda en `salida_normalizada/` y contiene:

- `grd_eventos_AAAA.csv`: una fila por egreso, con las variables usadas por el
  frontend y las dimensiones sanitaria, territorial y temporal de la propuesta.
- `grd_diagnosticos_AAAA.csv`: una fila por diagnóstico y posición.
- `calidad_grd_AAAA.csv`: recuentos de entrada y validaciones básicas.
- `resumen_normalizacion.csv`: resumen de todos los años procesados.

## Ejecución

Los archivos GRD del repositorio están administrados por Git LFS. Primero deben
descargarse sus contenidos reales:

```powershell
git lfs pull
```

Luego, desde la raíz del repositorio:

```powershell
python desarrolloInvestigacion\normalizar_grd.py
```

Después de normalizar, publique el contrato estable para el frontend:

```powershell
python desarrolloInvestigacion\generar_datos_frontend.py
```

El archivo resultante queda en `frontend\public\data\dashboard-data.json`.
Para visualizarlo con datos reales:

```powershell
cd frontend
$env:VITE_DATA_SOURCE = "real"
npm run dev
```

React depende únicamente de este contrato (`contractVersion`), no de las
columnas de `salida_normalizada`. Los cambios de limpieza deben conservar o
adaptar este contrato antes de publicar una nueva versión.

También se pueden indicar rutas explícitas:

```powershell
python desarrolloInvestigacion\normalizar_grd.py `
  --input-dir datos_grd `
  --output-dir desarrolloInvestigacion\salida_normalizada
```

## Reglas y límites

- Se conserva el código CIE original y se detecta CIE-9/CIE-10 de forma
  estructural; no se reemplazan códigos por diagnósticos inventados.
- `respiratorio` usa el capítulo J00–J99 de CIE-10 y los rangos respiratorios
  de CIE-9. La clasificación debe ser validada con el equipo clínico.
- Los grupos técnicos `pneumonia`, `copd`, `asthma`, `bronchitis`, `other` y
  `unknown` coinciden con los identificadores del frontend. Las etiquetas en
  español deben definirse en el catálogo visual, no en los datos.
- La edad se calcula al ingreso, y la estancia como `fecha_alta -
  fecha_ingreso`; fechas inválidas producen ausentes y se informan.
- La región no se deriva automáticamente desde comuna, provincia o servicio
  de salud. `region_codigo` y `region_nombre` quedan ausentes hasta incorporar
  un catálogo oficial de correspondencia.
- Los duplicados se informan, pero no se eliminan automáticamente.
- Las tablas de vacunación y ambiente no se mezclan en esta etapa; deberán
  unirse posteriormente por territorio, período y población compatibles.
