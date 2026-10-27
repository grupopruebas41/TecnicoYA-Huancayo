# Avance · Pimentel · Sprint 02

- Fecha: 2026-10-10. Módulo F, integración/CI (D-39, DEF-27). Sin nuevas HU/RF de producto.
- Rama: feature/pimentel/f-administracion/s02-ci. Commits 3d28cd7, 352288b. PR #9.
- Archivos: .github/workflows/ci.yml, docs/documentacion/calidad/CI.md, evidencias de CI y HANDOFF-codex.md.
- Pruebas previstas y ejecutadas: Pest completo 102/102, Vitest 92/92, build, auditorías y conteo; https://github.com/grupopruebas41/TecnicoYA-Huancayo/actions/runs/38028328415.
- SonarQube: no ejecutado; se mantiene local al cierre. Cypress también local.
- Pendiente: revisión e integración del PR. Revisor: Pimentel Chumbes James.
- Decisiones: docs/documentacion/sprints/DECISIONES.md, D-39 y D-42.

## S2.6 · Cierre del Sprint 2 (integración y calidad)

- **Integrante:** Pimentel (configuración común; dueño del módulo `f-administracion` según D-38).
- **Sprint / módulo:** 02 / `f-administracion`
- **HU / RF / tarea:** HU-S02-01 a HU-S02-07 · paso S2.6: cierre del sprint (regresión, mutación, SonarQube, trazabilidad e informe), DEF-40 y DEF-42.
- **Cambios y archivos:**
  - `backend/api/storage/**/.gitignore`: estándar de Laravel; los PNG de DEF-38 y los logs quedan ignorados.
  - `backend/api/tests/Feature/Sprint02/`:
    - refuerzo de aserciones en S02-TC-007, 026 a 028, 032, 034, 042 y 045;
    - S02-TC-090 nuevo (DEF-40).
  - `backend/api/app/Modules/FAdministration/`:
    - `Portfolio::present` con `subcategory_id` (DEF-40);
    - `CatalogEntries`, extraído de las tres clases `Manage*`;
    - `SeedingRefused` y `AdministratorProvisioningRefused`, para incidencias seguras de SonarQube.
  - `scripts/run-e2e.mjs`: log de la API e informe de la RAM libre (DEF-42). `sonar-project.properties`: `projectVersion=sprint-02`.
  - `docs/documentacion/`:
    - `CONTRATO-API.md` v1.2 y `CATALOGO-S02.csv` (90 casos, Aprobado);
    - `Matriz-Trazabilidad-TC.csv` (15 de las 17 filas de S2);
    - `REGISTRO-DEFECTOS` (DEF-40 a 42 cerrados, DEF-27 cerrado y DEF-16, 24 y 25 parciales);
    - `evidencias/sprint-02/cierre/` y `cypress/2026-10-14-DEF-42-diagnostico.md`;
    - `INFORME-SPRINT-02.md` y `HANDOFF-claude.md`.
  - Revisor en `docs/avances/mayhuasca/sprint-02/avance.md`, indicado por el usuario.
- **Rama / commits / PR:** `feature/pimentel/f-administracion/s02-cierre`, desde `main` `f7c524e`, con `0a5977f` (PR #10) fusionado en `8730a13`. Commits principales:
  - `9896b40`, `670a1cb`, `439aac3`;
  - `989761e` y `86a65aa` (DEF-40 en rojo y en verde), `3b9e6d8`, `1c58b45`;
  - `9e1c272` (DEF-42), `e176a6b` (versión de SonarQube);
  - el commit de cierre.

  PR: ver `HANDOFF-claude.md`.
- **Pruebas previstas:** S02-TC-001 a 090 (CATALOGO-S02.csv) y la regresión de S01.
- **Pruebas ejecutadas** (todas en el slot A):
  - Pest 149/149 (1685 aserciones).
  - Vitest 116/116.
  - Cypress S01 17/17 y S02 17/17.
  - Conteo S02: 90 IDs (Pest 59, Cypress 17, Vitest 14).
  - Mutación de las 4 clases reforzadas: 91,32 % (284/311).
  - Cobertura: 97,22 % en el backend del módulo y 86,77 % en el frontend del módulo.
  - `composer audit` y `npm audit` limpios.

  Detalle en [evidencias/sprint-02/cierre/](../../../documentacion/evidencias/sprint-02/cierre/README.md).
- **SonarQube:** análisis `sprint-02` de `e176a6b`. **Quality Gate APROBADO** después de marcar `php:S5693` (StoreMediaRequest:33) como falso positivo por D-46. Cobertura de código nuevo: 82,5 % ([gate.json](../../../documentacion/evidencias/sprint-02/cierre/sonar/gate.json)).
- **Revisor:** Pimentel Chumbes James
- **Fecha:** 2026-10-15
- **Pendientes y bloqueos:**
  - Confirmar en equipo el falso positivo `php:S5693` y si TC-131 y TC-135 se vinculan a S02-TC-074 y 073.
  - 7 mutantes sobrevivientes (3 equivalentes).
  - 13 avisos `S6819` del frontend (Codex).
  - Causa de DEF-42 no aislada.
  - Sin bloqueos.
- **Decisiones relacionadas:** [DECISIONES.md](../../../documentacion/sprints/DECISIONES.md): D-38, D-39 y D-46 a D-52.

## Uso de IA

| Herramienta y modelo | Fecha | Qué se aceptó | Qué se corrigió | Quién lo revisó |
|---|---|---|---|---|
| Claude Code · Claude Opus 5.5 (`claude-opus-5-5`) | Del 2026-10-13 al 2026-10-15 | Refuerzo de aserciones, refactor `CatalogEntries`, DEF-40 con TDD, incidencias seguras de SonarQube, diagnóstico de DEF-42, regresión, mutación, análisis, registro, matriz e informe | La primera versión del script de la matriz leía `classname` en lugar de `name` y marcaba PARCIAL a todas las filas; se detectó al revisar el resultado y se corrigió antes de guardar. El aviso de RAM del arrancador afirmaba una causa de DEF-42 que no estaba demostrada; se reescribió para describir solo lo observado. `php:S5693` no era un hotspot sino una incidencia: se marcó como falso positivo, no como «Safe» | Pimentel Chumbes James |

Codex (modelo no expuesto por la sesión), 2026-10-10: elaboración del workflow y documentación; se incorporó la configuración solicitada y se corrigió el entorno dotenv tras leer la evidencia remota. No se alteraron pruebas ni código de producto. Revisión humana: Pimentel Chumbes James.
