# Avance · Pimentel · Sprint 03

## S3.6 · Cierre del Sprint 3 (integración y calidad)

- **Integrante:** Pimentel (configuración común, integración y cierre).
- **Sprint / módulo:** 03 / `a-solicitudes` (con la consulta de técnicos de `b-matching`).
- **HU / RF / tarea:** HU-S03-01 a HU-S03-06 · paso S3.6: cierre del sprint (regresión, conteo, cobertura, mutación, SonarQube, trazabilidad e informe) y DEF-44.
- **Cambios y archivos:**
  - `backend/api/database/seeders/E2EDatabaseGuard.php` (nuevo): guarda común de base `_testing` de los slots A y B. La llaman al empezar `Sprint01E2ESeeder`, `Sprint02E2ESeeder` y `Sprint03E2ESeeder` (DEF-44, D-59).
  - `backend/api/tests/Feature/Sprint03/E2ESeederGuardTest.php` (nuevo): S03-TC-082 a 085.
  - `sonar-project.properties`: `projectVersion=sprint-03`.
  - `docs/documentacion/`:
    - `CATALOGO-S03.csv`: 85 casos; S03-TC-052 a 081 pasan de Previsto a Implementado;
    - `Matriz-Trazabilidad-TC.csv`: las 24 filas de S3 en APROBADO;
    - `REGISTRO-DEFECTOS`: DEF-44 nuevo y cerrado; DEF-16, 24 y 25 cerrados;
    - `DECISIONES.md`: D-59, y pendientes IDEM-01 y MEDIA-02;
    - `evidencias/sprint-03/cierre/`;
    - `INFORME-SPRINT-03.md` y `HANDOFF-claude.md`.
  - Revisor en `docs/avances/mayhuasca/sprint-03/avance.md`, indicado por el usuario.
- **Rama / commits / PR:** `feature/pimentel/a-solicitudes/s03-cierre`, desde `main` `913a538`.
  - `e7d4878` test(s03): S03-TC-082 a 085 en rojo;
  - `66be473` fix(s03): `E2EDatabaseGuard` (DEF-44);
  - `2947a4d` ci(s03): versión de SonarQube;
  - el commit «docs(s03): cierre del Sprint 3».

  PR: ver `HANDOFF-claude.md`.
- **Pruebas previstas:** S03-TC-001 a 085 (`CATALOGO-S03.csv`) y la regresión de S01, S02 y el prototipo.
- **Pruebas ejecutadas** (todas en el slot A):
  - Pest 189/189 (2114 aserciones).
  - Vitest 146/146.
  - pytest 4/4.
  - Cypress S01, S02 y S03 17/17 cada uno.
  - Conteo S03: 85 IDs (Pest 55, Cypress 17, Vitest 13).
  - Mutación de las 4 clases del cierre: 98,29 % (344/350; 0 sobrevivientes).
  - Cobertura: 100 % en `ARequests` y `BMatching`; 84,67 % y 83,92 % en `features/requests` y `features/matching`.
  - `composer audit` y `npm audit` limpios.

  Detalle en [evidencias/sprint-03/cierre/](../../../documentacion/evidencias/sprint-03/cierre/README.md).
- **SonarQube:** análisis `sprint-03` de `2947a4d`. **Quality Gate APROBADO** a la primera, con cobertura de código nuevo de 86,2 % ([gate.json](../../../documentacion/evidencias/sprint-03/cierre/sonar/gate.json)).
- **Revisor:** [PENDIENTE]
- **Fecha:** 2026-10-16
- **Pendientes y bloqueos:**
  - Decidir IDEM-01 (idempotencia de `POST /requests`) y MEDIA-02 (borrar una evidencia no vinculada); opciones en `INFORME-SPRINT-03.md` §4.2.
  - 8 incidencias nuevas de SonarQube: 6 del frontend (Codex) y 2 `php:S112` en `RuleBook` (Claude Code).
  - Programar el retiro del prototipo (DEF-22, D-26).
  - Sin bloqueos.
- **Decisiones relacionadas:** [DECISIONES.md](../../../documentacion/sprints/DECISIONES.md): D-11, D-12, D-24, D-55 a D-59, IDEM-01 y MEDIA-02.

## Uso de IA

| Herramienta y modelo | Fecha | Qué se aceptó | Qué se corrigió | Quién lo revisó |
|---|---|---|---|---|
| Claude Code · Claude Opus 5.5 (`claude-opus-5-5`) | Del 2026-10-15 al 2026-10-16 | Guarda común de los seeders con TDD, regresión completa, conteo, cobertura, mutación, análisis de SonarQube, matriz, registro, decisiones pendientes e informe | El script de la matriz repitió el error de S2: leía `classname` antes que `name` y dejaba fuera a Vitest (72 IDs en lugar de 85). Además, el patrón de `testcase` absorbía los casos autocerrados de Pest. Se detectó al comparar con el contador y se corrigió antes de escribir. La primera reescritura del catálogo cambió las comillas de 36 filas; se descartó y se cambió solo el estado de las 30 filas. Una edición del `.md` del registro reemplazó la cabecera; se restauró y se editó a mano. El primer intento de exportar SonarQube leía mal el token (401) y se repitió | [PENDIENTE] |
