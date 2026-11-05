# Frontend de Surviral

Explorador de hospitalizaciones respiratorias con vistas territoriales, temporales, demográficas y de vacunación. Todas las cifras son ficticias; cada área usa una fuente determinista y sus gráficos reconcilian entre sí. No se leen los archivos GRD del repositorio.

## Ejecutar en tu computador

Requisito: Node.js 22.12 o posterior; para ejecutar las pruebas de TypeScript sin herramientas adicionales se recomienda Node.js 24.

Abre una terminal en `frontend/`:

```sh
npm install # Solo la primera vez o si cambian las dependencias
npm run dev
```

- **Abrir:** http://127.0.0.1:5173/. Mantén la terminal abierta.
- **Apagar:** presiona `Ctrl + C` en esa terminal. Cerrar la pestaña no detiene el servidor.
- **Puerto 5173 ocupado:** ya hay un servidor activo. Usa el enlace o detén la instancia anterior antes de iniciar otra.

No se necesita backend para los datos simulados.

```sh
npm test
npm run build
npm run preview
```

La compilación crea `dist/`; para compartirla se debe servir esa carpeta mediante un servidor estático. No abrir `index.html` con doble clic: es una aplicación con módulos. El servidor de desarrollo solo escucha en este equipo por defecto.

## Alcance de esta entrega

- Panorama general: tres indicadores, serie mensual y ranking diagnóstico.
- Fechas inclusivas 2019–2024, región, edad, sexo y diagnóstico; selecciones visibles, limpieza y cancelación de consultas antiguas.
- Datos, gráficos y medianas calculados desde eventos ficticios individuales. Categorías desconocidas explícitas.
- Tabla accesible y descarga CSV de la serie, identificada como simulada.
- Vista de metodología y fuentes.
- Mapa interactivo de las 16 regiones en panorama y territorio, con islas en recuadros; geometría referencial sin territorio antártico.
- Territorio: mapa ampliable con 344 polígonos comunales, catálogo de 346 comunas, búsqueda y selección múltiple entre regiones; comparación, tabla y mapa de calor región × mes. Evolución: mapa de calor año × mes, comparación mensual entre años y serie cronológica. Perfil: edad, sexo y diagnósticos.
- Vacunación respiratoria: serie mensual, comparación regional y filtros independientes de campaña 2024/2025 y región; cifras ficticias, cobertura no calculada sin denominador. Ambiente fuera de esta versión.
- Evolución temporal incluye una actividad logística funcional con datos ficticios: selector de los 12 meses posteriores al corte, filtros de región y comuna, probabilidad de superar un umbral mensual, evaluación temporal y corte de clasificación interactivo. Variables y método en `docs/ACTIVIDAD_REGRESION_LOGISTICA.txt`; pronóstico de cantidades reservado en `docs/IDEA_FUTURA_PRONOSTICO.txt`.

Fecha de referencia provisional: egreso. Geografía: atención simulada. El filtro de diagnóstico solo modifica el numerador respiratorio del porcentaje. Estas definiciones deben validarse antes de conectar datos reales.

## Organización

- `src/app`: navegación y filtros compartidos.
- `src/screens`: composición de las pantallas.
- `src/components`: filtros, paneles, indicadores y estados reutilizables.
- `src/charts`: presentación de series y distribuciones.
- `src/services`: interfaz de acceso; punto único de sustitución en `index.ts`.
- `src/mocks`: eventos ficticios y agregaciones exclusivas de la demostración.
- `src/types`: contratos provisionales, valores ausentes y metadatos.
- `src/styles`: paleta y diseño adaptable.
- `src/utils`: presentación de fechas, números y descarga CSV.
- `tests`: coherencia de universos, filtros, ausentes y cancelación.
- `docs`: integración y catálogo de gráficos.

Todo el trabajo de frontend se mantiene dentro de esta carpeta. La limpieza real, clasificación diagnóstica y análisis estadístico definitivo pertenecen al equipo de datos y backend.

## Dependencias

React y TypeScript para componentes y contratos; Vite para desarrollo/compilación; Recharts para el gráfico mensual; Lucide para iconos. CSS propio, sin framework visual, sin servidor de datos simulado y sin biblioteca global de estado.

Catálogo territorial, simulación comunal y evaluación por horizonte: `docs/COMUNAS_Y_HORIZONTES.md`.

Contratos de selección múltiple, geometrías, gráficos y vacunación: [CONTRATOS_Y_MAPA_COMUNAL.md](docs/CONTRATOS_Y_MAPA_COMUNAL.md). La actividad logística está en un desplegable académico cerrado inicialmente.
