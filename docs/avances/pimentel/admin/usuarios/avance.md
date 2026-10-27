# Avance · Pimentel · Usuarios, menú, estadísticas y solicitudes (bloque C, adelanto del S7)

## Datos de la tarea

- **Integrante:** Pimentel (integración), con backend de Mayhuasca y frontend de Delgado. Lo ejecuta Claude Code según D-72.
- **Sprint:** adelanto del Sprint 7 (D-73), con IDs S07-TC.
- **Módulo:** F-Administración.
- **HU/RF:** HU-S07-01 (dashboard y estadísticas, sin las alertas TC-087/088) y HU-S07-03 (usuarios y bloqueos, TC-091/092); RNF de seguridad, privacidad y accesibilidad.
- **Fecha:** 2026-10-27.
- **Rama:** `feature/pimentel/admin/usuarios`, creada desde `main` después de integrar el PR #33.
- **Decisiones:**
  - D-85, nueva, con cuatro valores que se confirmaron después (2026-10-27, PR #35, con la reconfirmación de contraseña al crear administradores): vigencia de la activación, alcance de «restablecer acceso», alta de administradores y permiso de Estadísticas y Solicitudes;
  - D-83: el mínimo móvil y la tolerancia quedan confirmados.

## Commits

- `94c4bcf`: D-83 confirmada.
- **Usuarios:**
  - `e542567`: Pest en rojo (S07-TC-109 a 120);
  - `9812bdd`: corrección del helper de sesión de mis pruebas;
  - `8326125`: API.
- **Estadísticas, solicitudes e Inicio:**
  - `95976a5`: Pest en rojo (S07-TC-121 a 128);
  - `ac175b8`: corrección de la fecha de los datos y de la cota de consultas;
  - `02042f3`: API.
- **SPA:**
  - `350f7c6`: Vitest en rojo (S07-TC-129 a 140);
  - `c33c4ff`: implementación;
  - `6df501e` y `d926e19`: ajustes vistos en las capturas.

## Cambios

- **Backend:**
  - migración `000028` (`users.invited_at` y `users.activated_at`);
  - broker `activations` de 72 horas y notificación `AccountActivation`;
  - `ManageUsers` y `/admin/users` (`users.manage`);
  - `AdminStatistics` y `GET /admin/statistics`;
  - `AdminRequests` y `/admin/requests`, en solo lectura;
  - `GET /admin/dashboard` agrega `announcements_active` y `recent_events`;
  - el restablecimiento de contraseña activa las cuentas pendientes.
  - Contrato S07, §9.
- **Frontend:**
  - menú agrupado con iconos SVG en línea, contadores accesibles y tooltips (`PanelShell`, `icons.jsx`);
  - Inicio con accesos rápidos y últimos eventos;
  - módulo `src/features/admin/` (Estadísticas, Usuarios, Solicitudes, diálogo con motivo y reglas);
  - pantalla `#cuenta/activar`.
- **Pruebas adaptadas sin cambiar su ID:** S07-TC-057, por el orden nuevo del menú.

## Pruebas

- **IDs nuevos:**
  - Pest: S07-TC-109 a 128 (20);
  - Vitest: S07-TC-129 a 140 (12).
- **Suites completas en `d926e19`** (evidencias `sprint-07/2026-10-27-d926e19-*`):
  - Pest 343/343 y Vitest 308/308;
  - lint y build aprobados; `npm audit` y `composer audit` sin vulnerabilidades.
- **Capturas:** 41, de 1366 y 390 px en tema claro y oscuro, con la API real del slot A y datos sintéticos; ninguna desborda a lo ancho.
- **Cypress:** no se ejecutó.

## Pendientes

- **Confirmar en D-85:**
  - vigencia de la activación: 72 h, o 24 h;
  - «Restablecer acceso»: invalidar la contraseña, o solo enviar el enlace;
  - alta de administradores desde el panel: sí, o solo con `tecnicoya:provision-admin`;
  - permiso de Estadísticas y Solicitudes: `dashboard.view`, o uno nuevo `requests.view`.
- En la base de desarrollo: `php artisan migrate` (000028).
- Siguen en el S7: las alertas del dashboard (TC-087 y TC-088) y Reglas del matching, Reportes, Soporte y Auditoría.

## Registro de uso de IA

- **Herramienta y modelo:** Claude Code (Claude Opus 5.5), 2026-10-27.
- **Qué se aceptó:** migración, API, componentes y pruebas.
- **Qué se corrigió:**
  - en mis pruebas Pest: un login fallido es 401 y no 422; el helper de sesión dejaba la identidad en memoria; `sentRequest` usa el reloj de MySQL; la cota de consultas no contaba la sesión;
  - en la SPA: el contador del menú chocaba con la clase `.panel-badge` de la campana; las barras de Estadísticas se rompían con flex en la celda; los eventos del Inicio mostraban la siembra de permisos;
  - en el orden de trabajo de la SPA: los componentes se escribieron antes que las pruebas. El rojo se reconstruyó corriendo las pruebas contra el código de `main` (evidencia `2026-10-27-02042f3-tc129-140-vitest-rojo.txt`) antes del commit de la implementación.
- **Revisó:** Pimentel Chumbes James.

## Revisión

- **Revisor:** Pimentel Chumbes James.
