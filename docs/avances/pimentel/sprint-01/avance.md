# Avance · Pimentel · Sprint 01

- **Integrante:** Pimentel (configuración común; dueño del módulo `f-administracion` según D-38).
- **Sprint / módulo:** 01 / `f-administracion`
- **HU / RF / tarea:** HU-S01-01 a HU-S01-06 · RF-28, RF-33, RF-C01, RF-C06 · paso S1.6, cierre del sprint (regresión, mutación, SonarQube, trazabilidad e informe). Revisión e integración de los PR #6 y #7 (2026-10-09).
- **Objetivo:** cerrar el Sprint 1 con la definición de terminado verificada sobre el código integrado.
- **Cambios y archivos:**
  - `backend/api/tests/Feature/Sprint01/TC012CatalogApiTest.php`: S01-TC-010 reforzada (campos, orden, `image_url` y filtro no entero) y disco público simulado (DEF-38).
  - `sonar-project.properties`: `projectVersion=sprint-01`.
  - `docs/documentacion/evidencias/sprint-01/cierre/`: evidencias del cierre (README).
  - `docs/documentacion/sprints/INFORME-SPRINT-01.md`, `DECISIONES.md` (D-45) y `HANDOFF-claude.md`.
  - `docs/documentacion/calidad/REGISTRO-DEFECTOS.csv` y `.md`: DEF-36 y DEF-34 cerrados, DEF-25 parcial, DEF-38 y DEF-39 nuevos y cerrados.
  - `docs/documentacion/editables/plan-pruebas-v2/Matriz-Trazabilidad-TC.csv` (13 filas de S1) y `plan-pruebas-v3/sprint-01/CATALOGO-S01.csv` (estado Aprobado).
  - Revisor en `docs/avances/mayhuasca/sprint-01/avance.md` y `docs/avances/delgado/sprint-01/avance.md`.
- **Rama / commits / PR:** `feature/pimentel/f-administracion/s01-cierre`. Commits:
  - `4171f06` test(s01): refuerzo de S01-TC-010;
  - `b0d794b` fix(s01): DEF-38;
  - `61076a9` ci(s01): `projectVersion`;
  - el commit de documentos de cierre.

  PR: ver `HANDOFF-claude.md`.
- **Pruebas previstas:** S01-TC-001 a 087 (CATALOGO-S01.csv), en regresión.
- **Pruebas ejecutadas:**
  - Pest: 102/102.
  - Cypress: 17/17 en el slot A.
  - Vitest: 92/92.
  - Conteo S01: 87 IDs (Pest 54, Cypress 17, Vitest 24).
  - Mutación de `CatalogController`: 27/27 (100 %).
  - Cobertura: 95,7 % en el backend del módulo y 96,27 % en el frontend del módulo.
  - `composer audit` y `npm audit` limpios.

  Detalle en [evidencias/sprint-01/cierre/](../../../documentacion/evidencias/sprint-01/cierre/README.md).
- **SonarQube:** análisis `sprint-01` de la revisión `4171f06` (el producto es `main` `8c570e9`). **Quality Gate APROBADO**, con cobertura de código nuevo de 77,8 % ([gate.json](../../../documentacion/evidencias/sprint-01/cierre/sonar/gate.json)).
- **Revisor:** [PENDIENTE]
- **Fecha:** 2026-10-10
- **Pendientes y bloqueos:**
  - Workflow de GitHub Actions (D-39, DEF-27).
  - 10 mutantes sin cubrir: `AuthController::login` con rol inactivo y la carrera de `RegisterAccount`.
  - 3 code smells críticos nuevos y 3 avisos `S6819`.
  - Borrar a mano los 20 PNG sintéticos de `backend/api/storage/app/public/media` (DEF-38).
  - Sin bloqueos.
- **Decisiones relacionadas:** [DECISIONES.md](../../../documentacion/sprints/DECISIONES.md): D-38, D-39, D-42, D-43, D-44 y D-45.

## Uso de IA

| Herramienta y modelo | Fecha | Qué se aceptó | Qué se corrigió | Quién lo revisó |
|---|---|---|---|---|
| Claude Code · Claude Opus 5.5 (`claude-opus-5-5`) | 2026-10-09 y 2026-10-10 | Aserciones de S01-TC-010, ejecución de la regresión, la mutación y SonarQube, actualización de la matriz, del registro de defectos y de los avances, e informe del sprint | La prueba reforzada escribía imágenes en el disco real; Claude Code lo detectó en `git status` tras la regresión y lo corrigió con `Storage::fake('public')` (DEF-38). La vista Markdown del registro de defectos estaba desfasada (sin DEF-36 ni DEF-37) y se regeneró desde el CSV | [PENDIENTE] |
