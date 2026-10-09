# HANDOFF · Claude Code (backend)

Archivo de relevo de Claude Code (regla 12 de AGENTS.md). La entrada más reciente va primero. Al empezar, leer también [HANDOFF-codex.md](HANDOFF-codex.md).

## 2026-10-09 · Sprint 0 · puesta en orden (reglas, entorno paralelo, deuda y plan v3)

- **Rama:** `feature/pimentel/f-administracion/s00` (configuración común), base `main` `d361c63`. PR pendiente de crear: `gh` no está instalado.
- **Commits** (orden cronológico):
  - `fa6de02` ci(s00): entornos de prueba en paralelo por slot
  - `6f0fad9` docs(s00): registro de defectos DEF-01 a DEF-34
  - `3b52cff` fix(s00): retira el exporte crudo de SonarQube con datos personales (DEF-17)
  - `6e454f4` docs(s01): salida del único análisis SonarQube del Sprint 1
  - `08db8e3` fix(s00): Laravel 12.69.3 y league/commonmark 2.10.3 (DEF-11)
  - `985f971` fix(s00): retira firebase/php-jwt (DEF-14)
  - `508eb4b` fix(s00): MySQL 8.4 como motor del producto (DEF-12)
  - `a8c886d` fix(s00): matching sin root (DEF-13)
  - `b3edf5a` docs(s00): evidencias de sprint-00 y registro actualizado
  - `deabac5` AGENTS.md · `4634204` CLAUDE.md · `5ef25f8` HANDOFF-codex.md · `34d5d2a` DECISIONES.md · `5b41b5c` docs/avances/README.md · `3754494` PLAN-MAESTRO-v3.md
  - `2ee5815` test(s00): conteo de pruebas por sprint y herramienta desde JUnit
  - `d5601f6` docs(s00): análisis de estado versionados y causa de NEW-01 corregida
  - `acd932a` fix(s00): retira el Word con códigos de alumno (DEF-17)
- **Pruebas** (09-10, slot A, después de recrear el volumen):
  - Pest 62/62 (714 aserciones).
  - Prueba de humo en el slot B: 1/1 contra `tecnicoya_b_testing`.
  - Cypress Sprint 1: 11/11 con `--junit`.
  - Vitest en `main`: 38/38.
  - `composer audit`: sin avisos.
  - Fallidas: ninguna.
- **Conteo** (`node scripts/contar-pruebas-sprint.mjs`, IDs heredados TC-NNN): S01 13 (Pest 11, Cypress 8), S02 12 y S03 15. Ningún sprint llega a 60. No hay todavía IDs `SNN-TC-NNN`.
- **Entorno:** el volumen de pruebas se recreó (`down -v` y `up -d --wait`). Existen `tecnicoya_testing` y `tecnicoya_b_testing`, con permisos del usuario de pruebas sobre las dos.
- **Evidencias:** `docs/documentacion/evidencias/sprint-00/` (Pest, composer audit, Docker) y `evidencias/sprint-01/continuacion/DIAGNOSTICO-E2E-2026-10-09.md`.

**Qué falta:**
1. DEF-17: reemplazar `fuentes/proyecto-final.pdf` cuando el equipo entregue la versión sin códigos (D-08). La purga no se ejecuta (D-09).
2. DEF-07: análisis SonarQube con cobertura (`composer test:sonar`) sobre el commit integrado, en el cierre del sprint.
3. DEF-13: contenedor web sin root (pedido a Codex, abajo).
4. Cierre de S1 a S3:
   - catálogo de 60 casos por sprint y contrato de API (paso N.1 del plan v3);
   - renombrar los IDs a `SNN-TC-NNN`;
   - `GET /api/v1/technicians`;
   - endpoints de S2 que faltan.
5. DEF-16: actualizar `Matriz-Trazabilidad-TC.csv` con los casos de S2 y S3 que pasan.

**Bloqueos:**
- Decisiones P10, P17 y P22 (bloquean TC-122, 123 y 130 de S3) y MOD-01 (asignación de módulos).
- Calendario sin fechas.

**Pedidos a Codex:**
1. Al integrar el PR #1, mover `/HANDOFF-codex.md` de la raíz a `docs/documentacion/sprints/HANDOFF-codex.md` (regla 12).
2. DEF-13: añadir un usuario no root a `frontend/web/Dockerfile`.
3. Las specs de `cypress/e2e/sprint-01/` ya no tienen puertos ni cookie fijos: leen `Cypress.expose('apiUrl')`, `Cypress.expose('sessionCookie')` y `Cypress.config('baseUrl')` (commit `fa6de02`). Las specs nuevas deben seguir ese patrón y lanzarse con `node scripts/run-e2e.mjs --sprint NN --slot B --junit`.
4. Al cerrar S1 a S3, renombrar las pruebas Vitest y Cypress a `SNN-TC-NNN [TC-0xx]` para que cuenten.
5. Tras integrar el PR #1, Claude Code cerrará en el registro DEF-08, DEF-10 y DEF-18 cuando el nuevo análisis SonarQube y `npm audit` lo confirmen.

**Integración:** el PR #1 (`codex/s00-frontend`) y esta rama **no comparten archivos**; se pueden integrar en cualquier orden.
