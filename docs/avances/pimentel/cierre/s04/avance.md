# Avance · Pimentel · Cierre del Sprint 4 (S4.6)

## Datos de la tarea

- **Integrante:** Pimentel (integración y cierre), con backend de Mayhuasca y frontend de Delgado. Lo ejecuta Claude Code según D-72.
- **Sprint:** 4 (cierre S4.6).
- **Módulos:** `b-matching` y `c-notificaciones`; herramientas de prueba y CI.
- **Fecha:** 2026-10-27.
- **Rama:** `feature/pimentel/cierre/s04`, creada desde `main` (`4d1ba16`, con el PR #34 integrado). PR #36.
- **Decisiones:** D-86 (DIST-02, opción A definitiva).

## Cambios

1. **Regresión Cypress S1 a S4: NO EJECUTADA.** La RAM libre fue de 0,83 a 0,87 GB en cada control, por debajo del umbral de 1,5 GB que pidió Pimentel. Quedan preparadas para esa corrida:
   - S01-TC-075 por teclado, el registro, los portales, el catálogo S02-TC-063 y 065 a 068;
   - los 17 casos del S4.5;
   - S04-TC-094, que ahora tiene su tarea.
2. **S04-TC-094 desbloqueado.**
   - Backend: tarea `tecnicoya:e2e replay <id de solicitud | correo de cliente E2E>`. Republica dos veces por Reverb el último evento publicado de esa solicitud, con el mismo `event_id`, sin escribir en la base y solo en la base de un slot. Prueba: Pest S04-TC-137.
   - Puente: `replayEvent` en `scripts/e2e-tareas-s04.mjs`.
   - Spec: la Cypress S04-TC-094 queda sin `skip`. Pasos:
     1. corta la conexión;
     2. vence la oferta en el servidor;
     3. republica el evento dos veces;
     4. reconecta.

     Esperado: una sola lectura de la API, con la versión vigente.
3. **DIST-02 → D-86:** opción A definitiva (C = 0, elegible y `distance` null). Prueba: Pest S04-TC-138.
4. **DEF-46, mutación reproducible.**
   - `scripts/mutacion.sh` y el workflow «Mutación» en Linux, que se lanzan a mano o con las etiquetas `mutacion`, `mutacion-s03` y `mutacion-s04` del PR.
   - Migran una sola vez y exigen un control negativo con sobrevivientes.
   - S3 rehecho: **63,21 %** (no 93,05 %), y `INFORME-SPRINT-03` corregido.
   - Refuerzo del S4: S04-TC-140 a 143 comparan la forma completa de las respuestas de ofertas, candidatos, solicitud y notificaciones.
5. **`DemoSeeder`.**
   - Solo con `APP_ENV=local` y `TECNICOYA_DEMO_PASSWORD`; es idempotente.
   - Crea cuentas `demo-*@example.test`, la foto de cada subcategoría y tres comunicados con imágenes D-83, recortadas de esas fotos con Chromium.
   - Prueba: Pest S04-TC-139.
6. **README:** desarrollo local (backend en `:3000`, frontend en `:5173`, `migrate`, `db:seed`, `storage:link` y `DemoSeeder`).
7. **CI:**
   - un PR que solo cambia `docs/**` ya no corre backend, frontend ni conteo (job `cambios`);
   - `qs` 6.17.0 en el lockfile (GHSA-6pq8-jhm2-2vcw, moderada, vía `cypress`), que hacía fallar la auditoría npm.
8. **Evidencias movidas:** de `frontend/web/evidencias/` y `frontend/web/HANDOFF-PR24.md` a `docs/documentacion/evidencias/landing/` (y `landing/pr24/`).
9. **Revisores:** «Pimentel Chumbes James» en los avances donde decía `[PENDIENTE]` (60 campos). Se conservaron los `[PENDIENTE]` de SonarQube y la plantilla.
10. **Conteo, SonarQube e informe:** ver «Pendientes».

## Commits

- `51d8ca7` (rojo) y `c5067a9`: tarea `replay` y S04-TC-094.
- `82e9cfa`: D-86 y S04-TC-138.
- `cf4b9bf`, `9079e5d` y `1fe9e11`: mutación en Linux y CI sin `docs/**`.
- `2cc55c5` (rojo) y `ea47cb6`: `DemoSeeder`.
- `dbb59f1`: `qs` en el lockfile.
- `35d2153`: README.
- `1ed55a5`: evidencias movidas.
- `a1926c0`: revisores.
- `8db658f`: refuerzo de los mutantes, S04-TC-140 a 143.
- `2e7f87c`: S3 rehecho e informe corregido.
- `b13bb36`: catálogo, contrato y evidencias.

## Pruebas

- **IDs nuevos:** Pest S04-TC-137 a 143 (7). El catálogo S04 queda con 143 IDs.
- **Suites en `2e7f87c`** (evidencias `sprint-04/cierre/2026-10-27-2e7f87c-*`):
  - Pest 350/350 y Vitest 308/308;
  - lint y build aprobados;
  - `composer audit` y `npm audit` sin avisos.
- **Conteo S04 sin Cypress:** Pest 112, Vitest 13 y Cypress 0, con 125 IDs aprobados. No llega a la meta porque falta la cuota Cypress (14).
- **Mutación en Linux** (job «Mutación», con control negativo de 4 sobrevivientes en cada corrida):
  - **S3**, en `1fe9e11`: **63,21 %**, con 268 eliminados, 125 sobrevivientes y 31 sin cubrir, de 424 mutantes. Antes se informó 93,05 %, que era falso;
  - **S4**, en `8db658f`, con el refuerzo: **68,61 %**, con 1038 eliminados, 379 sobrevivientes y 96 sin cubrir, de 1513 mutantes, en 4115 s. La corrida válida anterior (Windows con parche) dio 63,12 %, con 439 sobrevivientes y 119 sin cubrir;
  - sobrevivientes por clase, antes y después: OfferView 50 → 17, ServiceRequestView 44 → 11, CandidatesView 48 → 21 y NotificationController 42 → 23;
  - siguen altos MatchingFlow (59), Matcher (33) y ClientSelection (30), con escrituras de auditoría y eventos sin aserción y casts equivalentes. Quedan para el S5.

## Pendientes

- Liberar RAM (al menos 1,5 GB libres) y correr la regresión Cypress S4, S1, S2 y S3, una a la vez, con `node scripts/run-e2e.mjs --sprint NN --slot A --junit`.
- Con esos JUnit, el conteo final del S4.
- SonarQube y el Quality Gate: avisar antes de levantarlo, por la RAM.
- `INFORME-SPRINT-04`.

## Registro de uso de IA

- **Herramienta y modelo:** Claude Code (Claude Opus 5.5), 2026-10-27.
- **Qué se aceptó:** tarea `replay`, spec 094, mutación en Linux, `DemoSeeder`, README, CI y pruebas de forma.
- **Qué se corrigió:**
  - en S04-TC-137, una segunda `expectsOutputToContain` sobre la misma línea;
  - en S04-TC-138, la cercanía esperada del técnico con base: con una sola distancia, esa distancia es la máxima y su C también es 0, así que se agregó un técnico lejano como referencia;
  - en S04-TC-139, el medio previo necesitaba dueño;
  - en el `DemoSeeder`, el orden de TDD: se escribió antes que su prueba, y el rojo se obtuvo apartando la clase (evidencia `2026-10-27-82e9cfa-tc139-pest-rojo.txt`);
  - las sustituciones con `perl` y `sed` sobre archivos CRLF fallaron varias veces y se rehicieron con Edit.
- **Revisó:** Pimentel Chumbes James.

## Revisión

- **Revisor:** Pimentel Chumbes James.
