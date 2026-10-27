# Avance · Mayhuasca · Sprint 04

- **Integrante:** Mayhuasca (capa backend), dueño de los módulos `a-solicitudes` y `b-matching` según D-38; en este sprint también `c-notificaciones` (bandeja, entrega y tiempo real).
- **Sprint / módulo:** 04 / `b-matching` (matching, rondas, ofertas, elección) y `c-notificaciones`.
- **HU / RF / tarea:**
  - HU-S04-01 a HU-S04-10;
  - RF-06 a RF-18, RF-29, RNF-01 y RNF-07; transversales D-60 (IDEM-01) y D-61 (MEDIA-02);
  - pasos S4.1 (análisis, contrato y catálogo), S4.2 (Pest en rojo) y S4.3 (backend en verde).
- **Objetivo:** que una solicitud enviada encuentre técnicos elegibles con un puntaje explicable, les ofrezca la atención en rondas de hasta tres con un plazo de 10 minutos que el servidor hace cumplir, deje elegir al cliente entre quienes aceptaron y avise en la bandeja y en tiempo real, sin perder datos ante fallos ni concurrencia.
- **Cambios y archivos:**
  - **Catálogo y contrato** en `docs/documentacion/plan-pruebas-v3/sprint-04/`: `CATALOGO-S04.csv` (132 casos: 101 Pest, 18 Cypress y 13 Vitest) y `CONTRATO-API.md` v1.1.
  - **Pest nuevas** en `backend/api/tests/Unit/Sprint04/` y `tests/Feature/Sprint04/` (S04-TC-001 a 082 y 114 a 132), con ayudas en `tests/Support/Sprint04.php`, `concurrent-request.php` (procesos PHP reales con barrera `GET_LOCK`) y `CommittedDatabase.php`.
  - **Migraciones** `000021` a `000023`: distrito base y matriz de distancias (D-64), pesos con CHECK de suma 100 y versión 2 de reglas (D-63), ejecuciones y candidatos del matching, rondas, ofertas, participaciones, citas, bandeja, intentos de entrega, outbox y tablas de la cola.
  - **`BMatching`:** `Eligibility`, `Scorer`, `Ranker`, `Matcher`, `TechnicianHistory`, `RoundOpener`, `MatchingFlow`, `OfferResponses`, `ClientSelection`, `CandidatesView`, `OfferView`, `SearchState`, `RequestProgress`, los jobs `PrepareMatching`, `OpenOfferRound`, `ExpireOfferRound`, `RetryPendingMatching` y `ExpirePendingRequest`, y las rutas de ofertas, candidatos, elección y búsqueda alternativa.
  - **`CNotifications`:** `Inbox`, `NotificationDelivery` (reintentos a 1, 2 y 4 min, D-68), `Outbox`, `OutboxPublisher`, `OutboxBroadcast`, `GET /notifications`, canales privados y `POST /api/v1/broadcasting/auth`.
  - **Transversales:** `Idempotency-Key` en `POST /requests` (D-60), `DELETE /media/{id}` (D-61), `base_district_id` en el perfil del técnico, barrido `tecnicoya:sweep` cada minuto, `RuleBook` con excepción propia (deuda `php:S112` del S3) y MySQL en READ COMMITTED.
  - **E2E:** `Sprint04E2ESeeder`, `php artisan tecnicoya:e2e`, `scripts/e2e-tareas-s04.mjs` y el arrancador con Reverb, cola y scheduler por slot (D-70). `laravel/reverb` 1.12 instalado sin `-W`.
- **Rama / commits / PR:** `feature/mayhuasca/b-matching/s04`

  | Commit | Qué |
  |---|---|
  | `96a055a` | docs(s04): análisis, contrato y catálogo (S4.1) |
  | `3cda4b4` | merge de `main` con el retiro del prototipo (PR #19) |
  | `9c0ad10` | docs(s04): S04-TC-120 a 127 en el catálogo |
  | `217503f` | test(s04): S04-TC-001 a 082 y 114 a 119 (87 en rojo) |
  | `c9759bc` | test(s04): repetición idempotente comparada sin orden de claves |
  | `b604d41` | feat(s04): D-60 y D-61 |
  | `2114fec` | test(s04): S04-TC-128 en rojo |
  | `f64355b` | test(s04): base confirmada para concurrencia y reloj fijo en S03-TC-030 |
  | `ffa7b17` | chore(s04): laravel/reverb |
  | `a3aeea9` | refactor(s04): Idempotency, RuleBook y READ COMMITTED |
  | `5ab9643` | feat(s04): matching, ofertas, notificaciones y outbox |
  | `a5d1fc2` | feat(s04): seeder y tareas E2E, arrancador con Reverb |
  | `b94e484` | test(s04): S04-TC-129 a 132 |
  | `570d96d` | docs(s04): contrato v1.1, DIST-02 y evidencias |
  | `e726174` | test(s04): mutación válida y DEF-46 |

  PR #21: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/21
- **Pruebas previstas:** S04-TC-001 a 132 (`CATALOGO-S04.csv`). A cargo de Claude Code: las 101 Pest.
- **Pruebas ejecutadas** (slot A):
  - **Rojo** (`217503f`): 87 fallan y 9 pasan (las 8 de la guarda, ya en verde desde el PR #19, y S04-TC-078, que el código ya cumplía). [01-rojo](../../../documentacion/evidencias/sprint-04/01-rojo-antes-de-implementar.txt)
  - **Verde:** suite completa **269/269** (2510 aserciones); conteo del S4: **101 IDs Pest aprobados**. [02-verde](../../../documentacion/evidencias/sprint-04/02-verde-y-cobertura.txt)
  - **Cobertura:** total 95,0 %; `BMatching` 96,40 % y `CNotifications` 100 %.
  - **Concurrencia real:** S04-TC-040, 045 y 046 con dos procesos PHP, estables en tres corridas seguidas.
  - **Mutación** de las clases nuevas o modificadas, con el bloqueo global de Cypress tomado (unos 150 min): 1513 mutantes, 955 eliminados, **439 sobrevivientes** y 119 sin cubrir; puntuación **63,12 %**. Una primera corrida dio 92,13 % y era falsa (DEF-46: el plugin contaba como eliminados los procesos que morían en Windows); se validó la herramienta con un control negativo antes de esta corrida. Los sobrevivientes se concentran en `OfferView`, `CandidatesView`, `ServiceRequestView`, `NotificationController` (campos de respuesta sin aserción) y en ramas de `MatchingFlow` y `ClientSelection`. [04-mutacion](../../../documentacion/evidencias/sprint-04/04-mutacion.txt)
  - **`composer audit`:** sin avisos. [05-composer-audit](../../../documentacion/evidencias/sprint-04/05-composer-audit.txt)
  - **Cypress (083 a 100) y Vitest (101 a 113):** a cargo de Codex (S4.4 y S4.5).
- **SonarQube:** no se ejecuta en este paso (regla 12b); se analiza en el cierre del sprint.
- **Revisor:** Pimentel Chumbes James
- **Fecha:** 2026-10-17
- **Pendientes y bloqueos:**
  - reforzar las aserciones de las clases con sobrevivientes y repetir su mutación; repetir la mutación del S3 (DEF-46);
  - decidir **DIST-02** (cercanía sin distrito base; opción A aplicada de forma provisional);
  - Codex: pantallas, Vitest y Cypress con las tareas `serverClock`, `runJobs` y `openRoundFor`;
  - cierre del sprint: Cypress del S4, SonarQube, `npm audit` e informe.
- **Decisiones relacionadas:** [DECISIONES.md](../../../documentacion/sprints/DECISIONES.md) D-11, D-18 a D-25, D-32, D-33, D-57 a D-71 y DIST-02 (pendiente).

## Uso de IA

| Herramienta y modelo | Fecha | Qué se aceptó | Qué se corrigió | Quién lo revisó |
|---|---|---|---|---|
| Claude Code · Claude Opus 5.5 (`claude-opus-5-5`) | 2026-10-16 y 2026-10-17 | Las 101 pruebas Pest, el backend del matching, las ofertas y las notificaciones, el seeder y las tareas E2E | **Elegibilidad:** `codeFor` convertía el `null` (elegible) en exclusión por un `??`. **Concurrencia real:** aparecieron un deadlock en `Idempotency` y otro por `FOR UPDATE` por rango con REPEATABLE READ; se cambió la reserva de la clave y la conexión a READ COMMITTED. **Mutación:** la primera puntuación (92,13 %) era falsa (DEF-46); se detectó por la duración y se confirmó con un control negativo. **Pruebas:** `DatabaseMigrations` dejaba la base a medias al revertir (se reemplazó por `CommittedDatabase`); tres comparaciones de respuestas repetidas dependían del orden de claves de una columna JSON; S03-TC-030 dependía de la fecha real. Cada cambio de prueba se explica en su commit. **Diseño sin decisión:** la cercanía sin distrito base quedó como DIST-02 pendiente | Pimentel Chumbes James |
