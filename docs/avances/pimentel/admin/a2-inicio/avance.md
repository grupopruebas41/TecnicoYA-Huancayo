# Avance · Pimentel · Panel del administrador, Fase A2 (Inicio tipo panel de control), adelanto del S7

## Datos de la tarea

- **Integrante:** Pimentel (integración y panel del administrador). Lo ejecuta Claude Code según D-72.
- **Sprint:** adelanto del Sprint 7 (D-73), con IDs S07-TC.
- **Módulo:** F-Administración, con Premium (D-121).
- **HU/RF:** HU-S07-01 (dashboard con indicadores y alertas, TC-087 y TC-088); RNF de accesibilidad, rendimiento y usabilidad.
- **Fecha:** 2026-11-25.
- **Rama:** `feature/pimentel/admin/a2-inicio`, desde `main` `475d471` (#68 integrado).
- **Plan:** `docs/documentacion/sprints/PLAN-PANEL-ADMIN.md` (Fase A2).
- **Decisiones aplicadas:** D-118 (umbrales), D-121 (reglas v4 en el código) y D-124 (lugar de carga de las distancias). No hay decisiones nuevas.

## Commits

- `a17c772`: Pest en rojo (S07-TC-167 a 178).
- `0c37d47`: backend.
- `d97d076`: Vitest en rojo (S07-TC-179 a 186).
- `fd0616c`: frontend.
- `ff39f25`: Cypress S07-TC-187 a 189.
- `4fd7f0a`: S04-TC-139 y S07-TC-173 adaptadas.
- `864c646` y `afe0bf1`: ajustes vistos en las capturas.

## Cambios

- **Backend:**
  - `GET /admin/dashboard` suma `kpis`, `series` (30 días de Lima) y `tasks` (`AdminTasks`, con su umbral en `limit`), y la actividad pasa a 10 eventos;
  - `RuleBook::formalized`;
  - garantía, factor de atención IoT y mantenimiento leídos de las reglas;
  - `DemoAdminOperations`, con demo-operacion y demo-tecnico-ocupado;
  - `data/district-distances.php`, con los 7 pares pendientes de D-124.
- **Frontend:** `AdminHome` reescrito con:
  - saludo y fecha de Lima;
  - 6 indicadores con cuenta animada;
  - `AdmTrendChart`;
  - Tareas pendientes;
  - Actividad reciente;
  - accesos rápidos.
- **Pruebas adaptadas sin cambiar su ID** (explicado en el código): S07-TC-128, S04-TC-139, S07-TC-064, 065, 071 y 130, y S07-TC-173 y 177 (cómo se mide).

## Pruebas

- **IDs nuevos:**
  - Pest: S07-TC-167 a 178 (12);
  - Vitest: S07-TC-179 a 186 (8);
  - Cypress: S07-TC-187 a 189 (3).
- **Resultados:** ver `docs/documentacion/evidencias/sprint-07/admin-a2/README.md`.

## Pendientes

- **Distancias de Pilcomayo y Huancán (D-124):** completar `backend/api/database/seeders/data/district-distances.php` y ejecutar `php artisan db:seed --class=DistrictSeeder`.
- **Base de desarrollo:** con `TECNICOYA_DEMO_PASSWORD`, ejecutar `php artisan db:seed --class=DemoSeeder`. No hay migraciones nuevas.
- **Siguiente:** Fase A3 (Operación), desde S07-TC-190. Ahí se corrige DEF-81.

## Registro de uso de IA

- **Herramienta y modelo:** Claude Code (Claude Opus 5.5), 2026-11-25.
- **Qué se aceptó:** servicio de tareas, indicadores, serie, reglas formalizadas, demo, gráfico, pantallas y pruebas.
- **Qué se corrigió:**
  - en mis pruebas: un ayudante tipado con `CarbonImmutable` recibía `Carbon`; la simulación del Inicio necesitaba el formato real;
  - en la pantalla, a partir de las capturas: gráfico encogido y tabla desbordada a 390 px, y etiquetas encimadas e indicadores en 4 + 2 a 1366 px;
  - en la demo: la tarifa de referencia salía de la subcategoría, que no la tiene, y ahora sale del servicio del técnico.
- **Revisó:** [PENDIENTE]

## Revisión

- **Revisor:** [PENDIENTE]
- **Enlace a SonarQube:** solo en el cierre del sprint (regla 12b).
