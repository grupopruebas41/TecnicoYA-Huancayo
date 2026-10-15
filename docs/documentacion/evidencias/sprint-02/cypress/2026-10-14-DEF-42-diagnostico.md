# DEF-42 · Diagnóstico de las subidas sin respuesta en Cypress

**Fecha:** 2026-10-13 y 2026-10-14 · **Autor:** Claude Code (cierre S2.6) · **Slot:** A · **Revisor:** [PENDIENTE]
**Código probado:** `b3302c1` (rama `feature/delgado/f-administracion/s02`, PR #10), sin cambios en producto ni en pruebas.

## Síntoma (registrado por Codex en S2.5)

S02-TC-061 (foto de subcategoría) y S02-TC-071 (foto de portafolio) fallaban en Chrome: `GET /sanctum/csrf-cookie` respondía 204, pero el formulario mostraba «No pudimos confirmar el resultado…» y `cy.wait('@media')` decía «No request ever occurred». Corrida completa: 15/17.

## Qué se comprobó

| # | Prueba | Resultado |
|---|---|---|
| 1 | Hipótesis a) GD o fileinfo | Descartada: el backend no usa GD (`ImageSanitizer` es PHP puro y el tipo se comprueba con `finfo`). `fileinfo` y `exif` están cargados |
| 2 | Hipótesis b) `php.ini` de XAMPP | Descartada: `upload_max_filesize` y `post_max_size` son de 40M y `upload_tmp_dir` (`C:\xampp\tmp`) existe |
| 3 | Hipótesis c) CORS | Descartada: `X-XSRF-TOKEN` e `Idempotency-Key` están permitidas. En Cypress, un XHR manual multipart con propósito `catalog` recibió 201 en 0,8 s, y otro sin archivo recibió 422 |
| 4 | Hipótesis d) `Content-Type` a mano | Descartada: `http.js` solo pone `application/json` cuando el cuerpo no es `FormData` |
| 5 | Secuencia de la SPA sin navegador (Node contra `artisan serve`): CSRF, login, subida, GET de imágenes, subida, y subida en paralelo con las imágenes | Todas 201, en menos de 1 s |
| 6 | Chrome real sin Cypress (headless por CDP, perfil temporal), dentro de la SPA: subida, carga de 3 imágenes `<img>` y dos subidas más | Todas 201, en unos 0,4 s |
| 7 | Cypress + Chrome el 2026-10-13, con poca RAM libre y todas las pruebas 2 o 3 veces más lentas | Tras cargar las imágenes del panel, cualquier POST multipart (`fetch` o XHR, con o sin `AbortSignal`) quedaba sin respuesta. El POST JSON y los GET respondían. El `fetch` de `http.js` terminaba en `TimeoutError` a los 15 s |
| 8 | Cypress + Chrome el 2026-10-14, tras reiniciar el equipo: tres corridas completas de S2 en el slot A (una con `--junit`) | **17/17 las tres**, sin cambios en el código |
| 9 | Cypress + Electron el 2026-10-14 (specs de catálogo y técnico) | 9/9 |

## Conclusión

- El producto y la API funcionan: lo prueban 5 y 6 con el mismo navegador y la misma secuencia.
- El fallo se dio solo dentro del navegador de Cypress y solo en el estado del equipo del 2026-10-13. Después no se reprodujo en ninguna corrida.
- No se pudo aislar el componente exacto (Chrome o el proxy de Cypress). El factor común observado es la poca memoria libre, que Codex anotó en 303–893 MB. Es una hipótesis, no una causa demostrada: el 2026-10-14 no se logró repetir esa condición de forma controlada.

## Acciones

- Sin cambios en el producto ni en las pruebas. No se relajaron aserciones ni se agregaron reintentos o esperas.
- `scripts/run-e2e.mjs` (`9e1c272`, rama `feature/pimentel/f-administracion/s02-cierre`):
  - guarda la salida de la API en `tmp/e2e-api-<slot>.log`; antes iba a `ignore`, y eso impidió ver si el POST llegaba;
  - informa la RAM libre al empezar y avisa si hay menos de 1 GB.
- Si vuelve a aparecer: revisar `tmp/e2e-api-<slot>.log`. Si el POST `/api/v1/media` no está, la petición no salió del navegador. Después, liberar memoria y repetir.

## Archivos

- `2026-10-14-b3302c1-s2-slotA-chrome.txt`: salida de la corrida completa con `--junit`, 17/17.
- Los scripts de diagnóstico (Node, CDP y el spec temporal) quedaron fuera del repositorio: eran desechables y no se versionan.
