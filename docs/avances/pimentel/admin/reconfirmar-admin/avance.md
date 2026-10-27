# Avance · Pimentel · Reconfirmar la contraseña al crear un administrador (D-85)

## Datos de la tarea

- **Integrante:** Pimentel (integración), con backend de Mayhuasca y frontend de Delgado. Lo ejecuta Claude Code según D-72.
- **Sprint:** adelanto del Sprint 7 (D-73), con IDs S07-TC.
- **Módulo:** F-Administración.
- **HU/RF:** HU-S07-03 (usuarios); RNF de seguridad.
- **Fecha:** 2026-10-27.
- **Rama:** `feature/pimentel/admin/reconfirmar-admin`, creada desde `main` después de integrar el PR #34.
- **Decisiones:** D-85 queda confirmada con las cuatro recomendaciones y un cambio: el alta de un administrador desde el panel exige reingresar la contraseña de quien lo crea.

## Commits

- `590c20b`: Pest en rojo (S07-TC-141 y 142).
- `e285ff9`: Vitest en rojo (S07-TC-143), y `a108d98`, que anonimiza la ruta local de esa evidencia.
- `16cfd3a`: API.
- `a4854b5`: SPA. Incluye el ajuste de S07-TC-111, que ahora envía la contraseña al crear un administrador; debió ir en `16cfd3a`.

## Cambios

- **Backend:**
  - `AdminCreateUserRequest`: con `account_type=admin`, `current_password` es obligatorio y se compara con la contraseña del administrador; para clientes y técnicos está prohibido;
  - límite de 5 fallos cada 15 minutos por cuenta (`admin-reconfirm:<id>`); al acertar, se limpia;
  - el controlador quita `current_password` antes del caso de uso, así que nunca llega a la auditoría;
  - mensaje nuevo `api.reconfirm_locked`.
- **Frontend:** campo «Tu contraseña (para confirmar)» (`type=password`, `autocomplete=current-password`) solo al crear un administrador; validación de cliente; se vacía si el servidor rechaza el alta.
- **Documentos:** D-85 sin valores pendientes; contrato S07 §9.1; catálogo S07-TC-141 a 143 (143 IDs).
- **Prueba adaptada sin cambiar su ID:** S07-TC-111 (Pest): fija una contraseña conocida del administrador antes de la primera petición y la envía al crear el administrador. Cambiarla después cerraría su sesión (D-32).

## Pruebas

- **IDs nuevos:** Pest S07-TC-141 y 142; Vitest S07-TC-143.
- **Suites completas en `a4854b5`** (evidencias `sprint-07/2026-10-27-a4854b5-*`): Pest 345/345; Vitest 309/309; lint y build aprobados.
- **Capturas:** 6, a 1366 px en claro y 390 px en oscuro, con la API real del slot A: sin contraseña, contraseña incorrecta y alta hecha. Ninguna desborda a lo ancho.
- **Cypress:** no se ejecutó.

## Pendientes

- Ninguno de este cambio.

## Registro de uso de IA

- **Herramienta y modelo:** Claude Code (Claude Opus 5.5), 2026-10-27.
- **Qué se aceptó:** validación, límite de intentos, campo de la SPA y pruebas.
- **Qué se corrigió:** cambiar la contraseña del administrador en mitad de S07-TC-111 cerraba su sesión; se fija al principio. La evidencia en rojo de Vitest tenía la ruta local; se anonimizó en `a108d98`.
- **Revisó:** Pimentel Chumbes James.

## Revisión

- **Revisor:** Pimentel Chumbes James.
