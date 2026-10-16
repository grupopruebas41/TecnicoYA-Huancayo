# Avance · Pimentel · Sprint 04

## Retiro del prototipo, parte backend, Python e infraestructura (D-26, D-62) y DEF-45

- **Integrante:** Pimentel (configuración común, integración).
- **Sprint / módulo:** 04 / común (`infra`), antes del S4.2 (D-62).
- **HU / RF / tarea:**
  - retiro del prototipo histórico (DEF-22, DEF-26);
  - guarda de comandos destructivos con `APP_ENV=testing` (DEF-45).

  No hay HU comercial.
- **Cambios y archivos:**
  - **Backend:**
    - se quitan las rutas `/api/*` con token, salvo `GET /api/health`;
    - se quitan `MarketplaceController`, el `AuthController` de token, `ApiToken`, `app/Services/*` y `resources/domain/rules.json`;
    - se quitan `marketplace:tick` y `marketplace:admin`, y las pruebas `MarketplaceTest` y `AnnouncementsTest`;
    - migración `2026_10_16_000020_drop_prototype_tables.php`.
  - **Python e infraestructura:**
    - se quitan `python/`, `domain/`, `scripts/sync-rules.py` y el servicio `matching` de Compose;
    - se quitan la tarea de VS Code, `python` de `project.yml` y `PYTHON_*` de los ejemplos `.env`.
  - **DEF-45:**
    - `app/Shared/Database/DestructiveCommandGuard.php` y `DestructiveCommandRefused.php`;
    - `AppServiceProvider`;
    - `tests/Feature/Sprint04/DestructiveCommandGuardTest.php` (S04-TC-120 a 127).
  - **Documentos:**
    - AGENTS §2 (Vite 8, Vitest 5 y prototipo retirado) y §13 (artisan con las variables del slot);
    - README, PLAN-MAESTRO §1 y §10, y D-26;
    - `REGISTRO-DEFECTOS`: DEF-22, 26 y 45;
    - `evidencias/sprint-04/retiro/`.
  - El frontend lo retiró Codex en el PR #18.
- **Rama / commits / PR:** `feature/pimentel/infra/retiro-prototipo`, desde `main` `cced99e` (etiqueta `v0.3-antes-retiro-prototipo`), con `main` `4e85669` fusionado.
  - `07e15aa`, `ae11118` y `f5f8100`: retiro;
  - `017d786` y `0ac7ce8`: pruebas en rojo de DEF-45;
  - `20cf695`: la guarda;
  - `210055a`: documentos.

  PR: ver `HANDOFF-claude.md`.
- **Pruebas previstas:**
  - S04-TC-120 a 127;
  - regresión completa: Pest, Vitest, Cypress de S01 a S03 y las auditorías.
- **Pruebas ejecutadas** (todas en el slot A):

  | Prueba | Resultado |
  |---|---|
  | Pest | 176/176 (1991 aserciones) |
  | S04-TC-120 a 126 | 6 en rojo y luego 8/8 en verde (con la 127) |
  | Mutación de `DestructiveCommandGuard` | 21/21 (100 %), con `tmp/e2e-cypress.lock` tomado |
  | Vitest | 117/117; líneas 82,66 % |
  | Build | Aprobado |
  | Cypress S01, S02 y S03 | 17/17 cada uno |
  | `composer audit` y `npm audit` | Limpios |
  | Migración 000020 | Subida, reversión y subida |

  Detalle en [evidencias/sprint-04/retiro/](../../../documentacion/evidencias/sprint-04/retiro/).
- **SonarQube:** no aplica. Se analiza en el cierre del S4.
- **Revisor:** Pimentel Chumbes James
- **Fecha:** 2026-10-16
- **Pendientes y bloqueos:**
  - Agregar S04-TC-120 a 127 a `CATALOGO-S04.csv` al fusionar `main` en `feature/mayhuasca/b-matching/s04`.
  - Sin bloqueos.
- **Decisiones relacionadas:** [DECISIONES.md](../../../documentacion/sprints/DECISIONES.md): D-19, D-26, D-59 y D-62 (esta última en la rama del S4).

## Uso de IA

| Herramienta y modelo | Fecha | Qué se aceptó | Qué se corrigió | Quién lo revisó |
|---|---|---|---|---|
| Claude Code · Claude Opus 5.5 (`claude-opus-5-5`) | 2026-10-16 | Plan e implementación del retiro, migración reversible, guarda de comandos destructivos con TDD, regresión completa y evidencias anonimizadas | Un `artisan migrate:fresh --env=testing` lanzado a mano apuntó a `tecnicoya`; MySQL lo rechazó y no cambió nada (DEF-45). La primera versión de la guarda escuchaba `CommandStarting`, pero Laravel no lo emite con `APP_ENV=testing`; las primeras pruebas usaban `Artisan::call`, que tampoco lo emite. Se cambiaron a un proceso artisan aparte (explicado en `0ac7ce8`) y la guarda pasó a leer `argv`. Un `sed` con comillas invertidas vació rutas del HANDOFF y se corrigió a mano. Los reemplazos en archivos CRLF no aplicaron a la primera y se repitieron | [PENDIENTE] |
