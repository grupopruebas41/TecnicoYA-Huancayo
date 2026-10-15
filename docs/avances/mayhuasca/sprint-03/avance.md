# Avance · Mayhuasca · Sprint 03

- **Integrante:** Mayhuasca (capa backend), dueño de los módulos `a-solicitudes` y `b-matching` según D-38.
- **Sprint / módulo:** 03 / `a-solicitudes` (búsqueda de técnicos en `b-matching`, solo consulta).
- **HU / RF / tarea:**
  - HU-S03-01 a HU-S03-06;
  - RF-01 a RF-04, RF-33, RF-C02 y RF-C06;
  - pasos S3.1 (brechas, catálogo, contrato y decisiones), S3.2 (Pest en rojo) y S3.3 (backend en verde).
- **Objetivo:** que el cliente describa, revise y envíe su solicitud en cinco pasos de forma segura y busque técnicos por especialidad, sin confundir la búsqueda con el matching (S4).
- **Cambios y archivos:**
  - **Catálogo y contrato** en `docs/documentacion/plan-pruebas-v3/sprint-03/`:
    - `CATALOGO-S03.csv`: 81 casos (51 Pest, 17 Cypress y 13 Vitest);
    - `CONTRATO-API.md` v1.0.
  - **Decisiones** en `docs/documentacion/sprints/DECISIONES.md`:
    - D-53 y D-54, pendientes del S2;
    - D-55 a D-58: inicio programado, dirección, pausa en la búsqueda y reglas versionadas.
  - **Renombrado** a `S03-TC-001…015 [TC-0xx]` de las 15 Pest existentes, sin cambios de lógica.
  - **Pest nuevas** en `backend/api/tests/Feature/Sprint03/` (S03-TC-016 a 051):
    - `RequestDescriptionLimitsTest`, `RequestEvidenceUploadTest`, `RequestEvidenceVisibilityTest` y `RequestConcurrencyTest`;
    - `RequestSubmissionRevalidationTest`, `ActiveRequestLimitTest` y `RequestIdempotencyTest`;
    - `RequestListAndAccessTest`, `RequestScheduleAndAddressTest` y `TechnicianSearchTest`;
    - ayudas en `tests/Support/Sprint03.php`.
  - **Backend:**
    - `POST /media` con `purpose=evidence`, solo para clientes y privada (`StoreMediaRequest` y `StoreMedia`);
    - límites de descripción, dirección e inicio programado (`StoreServiceRequestRequest` y `UpdateServiceRequestRequest`);
    - máximo de 5 fotos (`ManageServiceRequests`);
    - `SubmissionPolicy`: revalida al enviar y aplica el máximo de 3 activas;
    - `App\Shared\Rules\RuleBook`;
    - `BMatching`: `TechnicianSearch`, `SearchTechniciansRequest` y `TechnicianSearchController` (`GET /technicians`).
  - **Migración** `2026_10_15_000019_add_request_evidence_and_rule_versions`: tablas `rule_*` con la versión 1, `service_requests.rule_version_id` y `purpose=evidence`.
  - **Seeder** `Sprint03E2ESeeder` (contrato §7).
- **Rama / commits / PR:** `feature/mayhuasca/a-solicitudes/s03`

  | Commit | Qué |
  |---|---|
  | `40c615a` | docs(s02): D-53 y D-54 |
  | `15a5df8` | test(s03): renombra las 15 Pest |
  | `d7bfe92` | docs(s03): catálogo, contrato y D-55 a D-58 |
  | `acebacc` | test(s03): S03-TC-016 a 051 (21 en rojo y 30 ya en verde) |
  | `20dcc34` | feat(s03): backend en verde |

  PR: ver HANDOFF-claude.md.
- **Pruebas previstas:** S03-TC-001 a 081 (`CATALOGO-S03.csv`). A cargo de Claude Code: Pest 001 a 051.
- **Pruebas ejecutadas** (slot A):
  - **Rojo** (`acebacc`): Sprint03 con 21 en rojo y 30 en verde (431 aserciones). [01-rojo](../../../documentacion/evidencias/sprint-03/01-rojo-antes-de-implementar.txt)
    - Las 30 verdes son las 15 renombradas y 15 nuevas que el código existente ya cumplía: visibilidad de fotos, concurrencia, idempotencia, listado y eventos. Se conservan como regresión de lo que el S3.3 toca.
    - La S03-TC-020 se endureció antes del commit: pasaba porque `purpose=evidence` aún no existía.
  - **Verde** (`20dcc34`): suite completa 185/185 (2100 aserciones); Sprint03 51/51. [02-verde](../../../documentacion/evidencias/sprint-03/02-verde-tras-implementar.txt)
  - **Cobertura:** total 90,5 %. Al 100 % las clases de `ARequests` (11), las de `BMatching` (3) y `RuleBook`.
  - **Mutación** de las 10 clases nuevas o modificadas, con el bloqueo global de Cypress tomado: 403 mutantes, 375 eliminados, **0 sobrevivientes** y 28 sin cubrir (constantes que PCOV no registra); puntuación **93,05 %**. [04-mutacion](../../../documentacion/evidencias/sprint-03/04-mutacion.txt)
  - **`composer audit`:** sin avisos. [05-composer-audit](../../../documentacion/evidencias/sprint-03/05-composer-audit.txt)
  - **`Sprint03E2ESeeder`:** `migrate:fresh` y dos siembras en el slot A con los mismos conteos (idempotente); la búsqueda excluye al técnico en pausa.
  - **Cypress (052 a 068) y Vitest (069 a 081):** a cargo de Codex (S3.4 y S3.5).
- **SonarQube:** no se ejecuta en este paso (regla 12b); se analiza en el cierre S3.6.
- **Revisor:** [PENDIENTE]
- **Fecha:** 2026-10-15
- **Pendientes y bloqueos:**
  - Codex:
    - pantallas del asistente, Mis solicitudes, búsqueda y perfil, con Vitest 069 a 081;
    - Cypress 052 a 068 con `Sprint03E2ESeeder`.
  - Cierre S3.6:
    - regresión completa y conteo ≥ 60;
    - SonarQube con Gate, `npm audit` e informe.
  - `min_rating` deja fuera a todos los técnicos hasta que existan calificaciones (S6), como manda D-18.
- **Decisiones relacionadas:** [DECISIONES.md](../../../documentacion/sprints/DECISIONES.md) D-11, D-12, D-13, D-15, D-18, D-24, D-25, D-32, D-46, D-47, D-52 y D-53 a D-58.

## Uso de IA

| Herramienta y modelo | Fecha | Qué se aceptó | Qué se corrigió | Quién lo revisó |
|---|---|---|---|---|
| Claude Code · Claude Opus 5.5 (`claude-opus-5-5`) | 2026-10-15 | Tabla de brechas, catálogo de 81 casos, contrato de API, propuesta de 4 decisiones nuevas (el equipo eligió la opción A en todas), 36 pruebas Pest y la implementación del backend | **Fuentes:** el prompt pedía opciones para P03, P05, P10, P16, P17 y P22, que ya estaban decididas (D-11 a D-25); se detuvo y el usuario confirmó aplicar las D-xx. **S03-TC-020:** se endureció porque pasaba por un motivo ajeno. **Siembra E2E:** la primera prueba se lanzó sin las variables del slot y apuntó a la base `tecnicoya`; MySQL la rechazó (sin cambios) y se repitió con las variables explícitas del arrancador sobre `tecnicoya_testing`. **Fecha de la versión 1 de reglas:** se fijó en la de D-11 para que no dependa del reloj al migrar | [PENDIENTE] |
