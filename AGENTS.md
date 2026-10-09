# AGENTS.md · Reglas del proyecto TécnicoYa Huancayo

1. **Proyecto:** marketplace web que conecta clientes (MYPES y hogares de Huancayo) con técnicos de cómputo, refrigeración comercial y electricidad. Curso Pruebas y Calidad de Software, Universidad Continental. Equipo: Delgado (frontend), Mayhuasca (backend), Pimentel (base de datos, Docker e integración).

2. **Stack vigente:** React 18 + Vite 5 (`frontend/web`); Laravel 12 con API `/api/v1` y sesión Sanctum (`backend/api`); MySQL 8.4; Pest 3, Vitest 2.1 y Cypress 16.1; SonarQube.
   **Congelado** (no se amplía; solo se mantienen sus pruebas hasta retirarlo según D-26, cuando las pantallas v1 de S2 y S3 pasen sus pruebas Cypress):
   - la API `/api/*` con token, **salvo `GET /api/health`**, que se mantiene porque el arrancador E2E la usa para saber si la API está lista;
   - la demo `localStorage` (`#demo`);
   - los comandos `marketplace:tick` y `marketplace:admin`;
   - el servicio Python y pytest (el matching va en PHP, D-19);
   - PostgreSQL;
   - el plan histórico de 10 iteraciones de los PDF 08 a 17.

3. **Fuentes, por prioridad:**
   1. `docs/documentacion/sprints/DECISIONES.md`
   2. `docs/documentacion/editables/REGLAS-DE-NEGOCIO-FORMALIZADAS-TecnicoYa.md`
   3. `docs/documentacion/editables/sprints-01-08/CANVAS-Sprint-0N.md`
   4. `docs/documentacion/plan-pruebas-v3/`
   5. El resto.

   Si dos fuentes se contradicen, detente y pregunta. Las carpetas `docs/documentacion/sprints/S01..S04/` son **históricas**: describen un plan anterior (PostgreSQL, 4 iteraciones) y no se siguen.

4. **Reparto:**
   - **Claude Code:** backend (migraciones, modelos, casos de uso, API, permisos, colas, eventos) y pruebas Pest; catálogo de casos, contrato de API, integración, SonarQube y cierre de sprint.
   - **Codex:** frontend (pantallas, estado, validaciones de cliente, alertas, accesibilidad) y pruebas Vitest y Cypress.

   No edites la carpeta del otro (`backend/` o `frontend/`) salvo que el prompt lo indique. Pide lo que necesites en tu archivo HANDOFF.

5. **Ramas y carpetas (adenda P10):**
   - **Formato de rama:** `feature/<integrante>/<módulo>/sNN`.
     - Integrante en minúsculas y sin tildes: `delgado`, `mayhuasca` o `pimentel`.
     - Módulo: `a-solicitudes`, `b-matching`, `c-notificaciones`, `d-atencion`, `e-calificaciones` o `f-administracion`.
     - Nunca se crea la rama sin `/sNN`: Git no admite a la vez una rama `x` y otra `x/sNN`, así que la rama base impediría crear las de sprint.
   - **Carpetas:**
     - Claude Code trabaja en la carpeta principal con ramas de backend (`feature/mayhuasca/…`).
     - Codex trabaja en `..\TecnicoYa-cx` con ramas de frontend (`feature/delgado/…`).
     - La configuración común usa `feature/pimentel/…`.
   - **Excepción registrada:** Codex hizo la Fase 1 (Sprint 0) en la rama `codex/s00-frontend` (PR #1). Desde el Sprint 1 usa `feature/delgado/<módulo>/sNN`.
   - **Integración:** nunca commit ni push a `main`. `main` solo cambia por Pull Request integrado por el equipo. Push solo de tu rama feature y solo cuando el prompt lo pida.
   - **Prohibido:** `push --force`, reescribir historial publicado y `git reset --hard` sobre trabajo ajeno.
   - **Base de pruebas:** un solo contenedor MySQL con dos slots (ver `docs/documentacion/sprints/ENTORNO-PARALELO.md`).
     - Slot A, Claude Code: `tecnicoya_testing`, puertos 8001 y 5174.
     - Slot B, Codex: `tecnicoya_b_testing`, puertos 8002 y 5175.
     - El contenedor se levanta **solo desde la carpeta principal**. Desde el worktree, Compose lo recrearía en mitad de las pruebas del otro slot.

6. **Commits:** Conventional Commits con ámbito del sprint (`feat(s04): …`, `test(s04): …`, `fix`, `docs`, `ci`, `refactor`, `chore`). Un cambio lógico por commit. TDD: primero el commit de pruebas en rojo, luego el de implementación en verde.

7. **Pruebas:**
   - **Identificador:** cada prueba **empieza su descripción** con su ID `SNN-TC-NNN`, por ejemplo `it('S04-TC-017 rechaza la aceptación después del SLA')`. Pest antepone `it ` al nombre en JUnit; el contador busca el ID en la descripción. Si la prueba deriva del catálogo base, agrega `[TC-0xx]`.
   - **IDs heredados:** los `S01-SEC-*` existentes no cuentan hasta renombrarlos al formato `SNN-TC-NNN`.
   - **Meta:** 60 o más IDs distintos ejecutados y aprobados por sprint, con un mínimo de 36 Pest, 14 Cypress y 10 Vitest.
   - **Qué no cuenta:**
     - Los casos bloqueados por una decisión pendiente se marcan `skip` con motivo y no cuentan.
     - Un dataset cuenta como varios casos solo si cada fila tiene su propio ID y un resultado esperado distinto.
   - **Prohibido:**
     - pruebas sin aserción relevante, duplicadas o que siempre pasan;
     - `sleep`;
     - reintentos que oculten fallos;
     - cambiar una prueba para que pase sin explicarlo.
   - **Plazos:** con reloj controlado (`travel` o `Carbon::setTestNow`, `cy.clock`, `vi.useFakeTimers`).
   - **Datos:** solo sintéticos.
   - **Prototipo histórico:** sus pruebas (Vitest de la demo, pytest y las Pest de `MarketplaceTest` y `AnnouncementsTest`) se mantienen como regresión, pero no cuentan para la meta.

8. **Definición de terminado (adendas del docente):**
   - alertas de éxito y de error en cada operación CRUD, con su prueba automatizada;
   - doble validación (cliente y servidor);
   - textos y mensajes en español;
   - confirmación antes de eliminar;
   - accesibilidad básica (labels, teclado, foco visible, botones con `type`);
   - permisos verificados en el servidor, con prueba negativa;
   - auditoría de acciones sensibles;
   - cobertura de 70 % o más en el módulo del sprint;
   - Quality Gate de SonarQube aprobado;
   - sin vulnerabilidades críticas o altas nuevas (`composer audit`, `npm audit`);
   - evidencias guardadas.

9. **Seguridad y privacidad:**
   - No abras ni imprimas `.env`, `.env.testing`, `.env.quality.local` ni claves, y no versiones secretos.
   - No pongas correos, nombres reales, códigos de alumno ni datos personales en evidencias. Anonimiza los exportes de SonarQube con `scripts/exportar-sonar-anonimo.mjs`; los crudos `**/sonar/issues.json` están ignorados.
   - Para pruebas, usa solo bases que terminen en `_testing`. No toques el MySQL/MariaDB de XAMPP.
   - No actualices dependencias con `composer -W` ni `npm audit fix --force` sin permiso.

10. **Decisiones:** P01 a P23 están decididas desde el 2026-10-09 (D-10 a D-37 en `DECISIONES.md`); aplícalas tal como están registradas. Para lo que siga pendiente (MOD-01, CI-01 y las de la tabla de pendientes) o surja después: no inventes valores, propón dos opciones con tu recomendación, espera la decisión y regístrala en `DECISIONES.md` con la fecha y quién decidió.

11. **Evidencias:**
    - **Pruebas:** `docs/documentacion/evidencias/sprint-NN/` (rojo, verde, cobertura, mutación, vitest, cypress, calidad, audit). Cada archivo lleva la fecha y el hash del commit.
    - **Defectos:** `docs/documentacion/calidad/REGISTRO-DEFECTOS.csv`.
    - **Avance individual (adenda P10):** `docs/avances/<integrante>/sprint-NN/avance.md`, con integrante, sprint, módulo, HU/RF y tarea, cambios y archivos, rama, commit/PR, pruebas previstas y ejecutadas, enlace a SonarQube, revisor, fecha, pendientes y enlace a decisiones.
    - **Registro de uso de IA:** en ese mismo avance, con herramienta y modelo, fecha, qué se aceptó, qué se corrigió y quién lo revisó.
    - No rellenes revisores ni aprobaciones: deja `[PENDIENTE]` para que el integrante lo complete.

12. **Relevo:** al terminar cada tarea, o si te vas a quedar sin límite de uso, actualiza tu archivo `docs/documentacion/sprints/HANDOFF-claude.md` o `HANDOFF-codex.md`. Incluye fecha, rama, commits, pruebas (aprobadas y fallidas), qué falta, bloqueos y pedidos al otro agente. Al empezar, lee los dos.

    **12b. Memoria del PC:**
    - Solo una corrida de Cypress a la vez. Respeta el bloqueo global `tmp/e2e-cypress.lock` del arrancador E2E, compartido por los dos worktrees.
    - SonarQube solo en el cierre del sprint.

13. **Comandos:**
    - **Backend:** desde `backend/api`, con `C:\xampp\php\php.exe`.
    - **Base de pruebas:** `docker compose -f docker-compose.testing.yml --env-file .env.testing up -d --wait`, solo desde la carpeta principal.
    - **Frontend:** desde `frontend/web`, con `npm test` y `npm run build`.
    - **E2E:** `node scripts/run-e2e.mjs --sprint NN [--slot A|B] [--junit]`. El arrancador quita `ELECTRON_RUN_AS_NODE`, que heredan las terminales de VS Code y de los agentes; con ella activa, Cypress muere con `0xC000001D`. Si lanzas Cypress a mano, usa `env -u ELECTRON_RUN_AS_NODE` (Git Bash) o `Remove-Item Env:ELECTRON_RUN_AS_NODE` (PowerShell).
    - **Conteo por sprint:** `node scripts/contar-pruebas-sprint.mjs`.

14. **Comunicación:** responde en español y breve. Al terminar, di qué archivos cambiaste, qué comandos ejecutaste con su resultado real y qué debo hacer yo.
