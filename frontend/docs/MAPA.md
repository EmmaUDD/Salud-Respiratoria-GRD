# Mapa referencial de Chile

La geometría se descargó el 27 de octubre de 2026 de https://raw.githubusercontent.com/caracena/chile-geojson/master/regiones.json (repositorio: https://github.com/caracena/chile-geojson). Contiene 16 regiones, Ñuble incluida; `codregion` enlaza con las claves regionales de la simulación.

Se conserva el archivo fuente en `src/assets/chile-regions-source.json`. `node scripts/prepare-map.mjs` produce `src/assets/chile-map.json` con trazados SVG simplificados (tolerancia 0,18 unidades de dibujo), proyección equirectangular ajustada a latitud media y recuadros separados para Rapa Nui y Juan Fernández. Se omiten polígonos que colapsan durante la simplificación. No se incluye territorio antártico porque no está en la fuente. No es cartografía oficial ni tiene precisión geodésica. Los recuadros insulares tienen distinta escala y seleccionan Valparaíso, sin inventar conteos insulares.

La licencia de redistribución de este repositorio no está explícita en los archivos consultados: antes de publicar externamente, confirmar sus condiciones o sustituir por cartografía oficial con licencia documentada. La atribución visible no sustituye esa validación. Esta entrega es local.

La interfaz no requiere consultar un servidor de mapas. Colores = conteos simulados de los filtros activos; gris y raya = región fuera del filtro, no cero. Seleccionar una región actualiza el filtro compartido; pulsarla nuevamente o «Ver todas las regiones» lo limpia. La lista ofrece la misma interacción y los conteos mediante teclado. La geometría no representa una fuente de datos sanitarios.

## Integración provisional

`Overview.regionalMonthly` contiene `{id, label, points: TimePoint[]}` por región incluida. Sus sumas por fila coinciden con `territories` y por columna con `monthly`; pruebas verifican ambas relaciones. Respeta todos los filtros. Fuera del período se representa ausencia de punto, no cero; meses parciales se señalan con asterisco en el mapa de calor. La comparación interanual agrupa la serie mensual recibida sin agregar datos externos ni extrapolar meses faltantes.
