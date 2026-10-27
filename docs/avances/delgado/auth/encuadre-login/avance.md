# Avance · Delgado · encuadre de la pantalla de sesión

## Datos de la tarea

- **Integrante:** Delgado (frontend). La ejecuta Claude Code según D-72.
- **Sprint y módulo:** Sprint 1 · F-Administración, sesión. Regresión de S01-TC-075 y S01-TC-084.
- **Fecha:** 2026-10-26.
- **Rama:** `feature/delgado/auth/encuadre-login`, creada desde `main` `16cf3cb`.
- **Commits:**
  - `f20bb97`: pruebas en rojo;
  - `4aa5ff6`: implementación;
  - un commit final de documentación.

## Cambios

- **Cabecera:** compacta, de 72 px, como la de la landing.
- **Tarjeta:** centrada en el alto disponible, con un ancho máximo de 1080 px. El formulario ocupa el 60 % y el panel de marca el 40 %.
- **Aviso de conexión:** el error y «Reintentar conexión» van dentro de la tarjeta, como aviso compacto con icono.
- **Registro:** dos campos por fila, sin cambiar el orden del DOM ni los `data-cy`.
- **Estados «Comprobando tu sesión» y cuenta bloqueada:** usan la misma tarjeta compacta.
- **Móvil:** panel de marca reducido arriba y formulario a ancho completo.

## Archivos

- `frontend/web/src/features/administration/AccountApp.jsx`
- `frontend/web/src/features/administration/SessionForm.jsx`
- `frontend/web/src/features/administration/auth.css`
- `frontend/web/src/features/administration/account.css`
- Prueba nueva: `frontend/web/src/features/administration/AuthLayout.test.jsx`

## Pruebas

- **Nuevas:** 3 complementos de S01-TC-084 y S01-TC-075. No suman IDs distintos.
- **Resultado:** Vitest 234/234, lint aprobado y build aprobado.
- **No ejecutado:** Cypress.
- **Evidencias:** `docs/documentacion/evidencias/login/`.

## Cambio de modo y Mostrar contraseña · 2026-10-26

- **Commits:** `a1b1498` pruebas en rojo; `3ad452d` implementación. Antes se hizo merge de `origin/main`, con el conflicto de HANDOFF resuelto.
- **Cambios:**
  - se quitan los enlaces de cambio de modo bajo el botón principal; el cambio queda en el botón del panel (`data-cy` `show-register` y `show-login`);
  - deslizamiento de 600 ms con la curva del panel invertida y fundido del formulario; el texto del panel cambia según el modo;
  - foco al primer campo al terminar;
  - sin deslizamiento con movimiento reducido o en móvil;
  - botón Mostrar/Ocultar con `aria-pressed` en cada contraseña.
- **Cypress S01-TC-075:** ajustada (foco automático y un Tab más por cada botón Mostrar), pero no ejecutada.
- **Pruebas:** Vitest 238/238; lint y build aprobados.

## Revisión

- **Revisor:** Pimentel Chumbes James.

## Uso de IA

- **Herramienta y modelo:** Claude Code (Claude Opus 5.5).
- **Fecha:** 2026-10-26.
- **Aceptado:** pruebas, estilos y marcado.
- **Corregido:** en móvil el aviso de conexión quedaba apretado; «Reintentar» pasó debajo del texto.
- **Revisión humana:** Pimentel Chumbes James.
