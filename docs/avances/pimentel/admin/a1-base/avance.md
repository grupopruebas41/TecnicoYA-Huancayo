# Avance · Pimentel · Panel del administrador, Fases A0 (plan) y A1 (base y menú), adelanto del S7

## Datos de la tarea

- **Integrante:** Pimentel (integración y panel del administrador). Lo ejecuta Claude Code según D-72.
- **Sprint:** adelanto del Sprint 7 (D-73), con IDs S07-TC.
- **Módulo:** F-Administración.
- **HU/RF:** HU-S07-01 (dashboard: contadores y alertas, TC-087 y TC-088 parciales) y HU-S07-07 (administradores parciales, bienvenida); RNF de seguridad, accesibilidad y usabilidad.
- **Fecha:** 2026-11-24.
- **Rama:** `feature/pimentel/admin/a1-base`, desde `main` `90a2a62` (#67 integrado). El plan de la Fase A0 entra en el mismo PR (pedido de Pimentel).
- **Plan:** `docs/documentacion/sprints/PLAN-PANEL-ADMIN.md`.
- **Decisiones:**
  - D-115, D-116 y D-117, tomadas por el equipo al empezar;
  - D-118 a D-124 (ADM-13 a ADM-19), tomadas por Pimentel al revisar el plan: opción A en todas y, en ADM-19, las 5 zonas del informe.

## Commits

- `f3cb456`: plan de la Fase A0.
- `2d74b51`: Pest en rojo (S07-TC-144 a 152) y registro de D-118 a D-124.
- `dee78c3`: Vitest en rojo (S07-TC-153 a 162).
- `6d2b1ba`: backend.
- `6e5069d`: frontend.
- `db92077`: siembra E2E del Sprint 7, Pest S07-TC-166 y Cypress S07-TC-163 a 165.
- `12263e4`: el Sprint 07 en el workflow `e2e-cierre`.
- `51008f9`: S01-TC-063 adaptada a los permisos de D-119.
- `b36bd42`: el paso 1 del tutorial resalta el menú completo (visto en las capturas).
- Documentación y evidencias: los commits siguientes de la rama.

## Cambios

- **Backend:**
  - `AuthorizationSeeder`: `requests.intervene`, `audit.view` y `content.manage` (D-119);
  - `DistrictSeeder`: Pilcomayo y Huancán, solo con su par de 1 km (D-124);
  - migración `000039`: versión 4 de las reglas (D-121), con los umbrales de D-118;
  - `OperationalAlerts` y `GET /admin/dashboard › badges`;
  - `DemoSeeder`: `demo-admin` vuelve a su primera visita en cada siembra;
  - `Sprint07E2ESeeder`: `e2e-admin-nuevo` y una solicitud sin técnico de 45 minutos.
- **Frontend:**
  - `AdminApp`: menú en 8 grupos filtrado por permisos, contadores y secciones en preparación;
  - `AdminOnboarding`: bienvenida y tutorial de 5 pasos;
  - Ayuda › «Cómo funciona el panel»;
  - Catálogo y Palabras clave como secciones separadas;
  - `adm.css` con el prefijo `adm-`.
- **CI:** `e2e-cierre` corre el Sprint 07.
- **Pruebas adaptadas sin cambiar su ID** (explicado en el código): S02-TC-020 y S04-TC-136 (5 zonas), S07-TC-057 y S07-TC-129 (menú nuevo) y S01-TC-063 (permisos de D-119).
- **Defecto:** DEF-81 (Solicitudes desborda a 390 px; pantalla anterior, se corrige en A3).

## Pruebas

- **IDs nuevos:**
  - Pest: S07-TC-144 a 152 y 166 (10);
  - Vitest: S07-TC-153 a 162 (10). S07-TC-161 pasó desde el inicio: fija los 8 ajustes de accesibilidad que el administrador ya tenía;
  - Cypress: S07-TC-163 a 165 (3).
- **Resultados:** ver `docs/documentacion/evidencias/sprint-07/admin-a1/README.md`.

## Pendientes

- Los km de Pilcomayo y Huancán con los otros distritos (D-124): consultarlos como en D-64. Mientras tanto la cercanía no aporta al puntaje en esos pares.
- En la base de desarrollo:
  - `php artisan migrate` (000039);
  - `php artisan db:seed --class=AuthorizationSeeder`;
  - `php artisan db:seed --class=DistrictSeeder`;
  - `php artisan db:seed --class=DemoSeeder` con `TECNICOYA_DEMO_PASSWORD`.
- Siguiente: Fase A2 (Inicio), desde S07-TC-167.

## Registro de uso de IA

- **Herramienta y modelo:** Claude Code (Claude Opus 5.5), 2026-11-24.
- **Qué se aceptó:** plan, migración, seeders, servicio de alertas, componentes, pruebas y workflow.
- **Qué se corrigió:**
  - en mis pruebas: S07-TC-161 buscaba un solo grupo «Tamaño de texto» y hay dos (el `fieldset` y el grupo de botones);
  - en el orden de commits: la eliminación de `CatalogSection.jsx` había quedado en el commit del backend y dejaba un commit intermedio sin compilar. Se rehicieron los commits locales antes de publicarlos.
- **Revisó:** [PENDIENTE]

## Revisión

- **Revisor:** [PENDIENTE]
- **Enlace a SonarQube:** solo en el cierre del sprint (regla 12b).
