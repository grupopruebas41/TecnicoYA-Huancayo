# Avance · Pimentel · Fase 1 del panel del administrador (base común de paneles)

## Datos de la tarea

- **Integrante:** Pimentel (integración), con backend de Mayhuasca y frontend de Delgado. Lo ejecuta Claude Code según D-72.
- **Sprint:** adelanto del Sprint 7 (D-73), con IDs S07-TC. El conteo del S1, ya cerrado, no cambia.
- **Módulo:** F-Administración, panel del administrador. La base común también la usan cliente y técnico.
- **HU/RF:** HU-S07-01 / TC-087 parcial (Inicio con indicadores; los filtros y alertas quedan para el S7). Perfil propio (HU-01/02), RNF-SEG (cambio de contraseña) y RNF de accesibilidad.
- **Fecha:** 2026-10-26.
- **Rama:** `feature/pimentel/admin/panel-base`, creada desde `main` tras integrar el PR #31. Backend y frontend van en la misma rama: los endpoints nuevos son pocos (plan §5).
- **Decisiones:** D-73 a D-79 y D-81, nueva: los permisos se asignan por `AuthorizationSeeder` y no por migración. Plan: `docs/documentacion/sprints/PLAN-PANEL-ADMIN.md`.

## Commits

- `ff7009c`: plan del panel (cherry-pick).
- `ba479ea`: Pest en rojo (S07-TC-046 a 056).
- `16b38b0`: API.
- `35316af`: Vitest en rojo (S07-TC-057 a 070).
- `3f98aac`: frontend y S07-TC-071.
- `786bc84`: Cypress del S1 adaptadas a «Mi perfil».
- `48dc495`: S01-TC-063 (lista de permisos del admin) y S02-TC-039 (el ejemplo de finalidad desconocida era «avatar») se ajustan sin cambiar su ID.

## Cambios

- **Backend:**
  - `GET /admin/dashboard`, con `dashboard.view`;
  - `POST /me/password`;
  - `PATCH /me` con nombres y apellidos, tema y foto;
  - `GET /me` con `theme_preference` y `avatar_url`;
  - finalidad de media `avatar`;
  - migración `000026`;
  - permisos `dashboard.view` y `users.manage` en `AuthorizationSeeder`.
  - Detalle en el contrato S07, §7.
- **Frontend:**
  - `PanelShell`, con barra lateral contraíble, cajón en móvil, campana, menú del avatar y tema claro u oscuro;
  - Inicio del administrador con indicadores reales;
  - Catálogo, Verificación (con suspender y reactivar) y Comunicados como secciones;
  - Mi perfil, con nombres, foto e iniciales, y cambio de contraseña.
  - Cliente y técnico conservan su contenido dentro de la misma base.
- **Cypress (sin ejecutar):** S01-TC-025, 073, 074, 076 y 077 abren «Mi perfil» con `openProfile()`. Los `data-cy` se conservan.

## Pruebas

- **Pest:** 11 IDs S07 nuevos (046 a 056). Suite completa: 305/305 en `48dc495`, en el slot A.
- **Vitest:** 15 IDs S07 nuevos (057 a 071). Suite completa: 277/277.
- **Lint, build, `composer audit` y `npm audit`:** sin errores ni vulnerabilidades.
- **Pruebas ajustadas:**
  - S07-TC-057 y 070 leen la etiqueta visible y no el icono decorativo.
  - `AccountApp.test` simula también los tres módulos de administración.
  - Las aserciones no cambian; el motivo está en el commit `3f98aac`.
- **Defectos que se vieron en las capturas reales y se corrigieron antes del PR:**
  - Mi perfil oscuro en el tema claro: `account.css` tenía colores fijos.
  - Los popovers no se cerraban con Escape desde su botón ni con un clic fuera. Lo cubre S07-TC-071, que se vio en rojo.
  - «Elegir foto» ocupaba todo el ancho.
  - Botón de pausa del carrusel desbordado.
  - «p. m..» con punto doble y «1 administradores».

## Evidencias

`docs/documentacion/evidencias/sprint-07/`:
- Registros en rojo: `ba479ea`, `35316af` y `3f98aac-tc071`.
- Vitest, lint, build y audits de `3f98aac`; Pest completo de `48dc495`.
- 44 capturas `2026-10-26-3f98aac-panel-*` con la API real del slot A (`tecnicoya_testing`, sembrado `Sprint04E2ESeeder`, cuentas sintéticas E2E). Cubren:
  - tema claro y oscuro;
  - 1366 y 390 px;
  - administrador: Inicio, campana, menú, barra contraída o cajón, Catálogo, Verificación, suspensión y perfil;
  - técnico y cliente.
- `-panel-capturas.json`: indicadores leídos y comprobación de desbordamiento horizontal.
- El script `-playwright-panel.mjs`.

## Pendientes

- Ejecutar las Cypress del S1 en la regresión del cierre S4.6.
- En la base de desarrollo: `php artisan migrate` (000026) y `php artisan db:seed --class=AuthorizationSeeder`.
- **Fase 2:** Usuarios, con `users.manage`.
- **SonarQube:** no aplica; corresponde al cierre del sprint.

## Registro de uso de IA

- **Herramienta y modelo:** Claude Code (Claude Opus 5.5), 2026-10-26.
- **Qué se aceptó:** endpoints, migración, componentes del panel y pruebas.
- **Qué se corrigió:**
  - la sesión actual se cerraba al cambiar la contraseña: faltaba refrescar el usuario para `AuthenticateSession`;
  - una aserción vacía en S07-TC-052;
  - los defectos visuales de la lista de pruebas.
- **Revisó:** [PENDIENTE].

## Revisión

- **Revisor:** [PENDIENTE].
