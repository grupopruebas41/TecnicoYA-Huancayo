# Avance · Delgado · Panel del cliente sobre PanelShell (D-87 a D-91, DEF-49)

## Datos de la tarea

- **Integrante:** Delgado (frontend). Lo ejecuta Claude Code según D-72.
- **Sprint:** adelanto del Sprint 5 (D-87), con IDs S05-TC.
- **Módulos:** A-Solicitudes, B-Matching y C-Notificaciones (pantallas del cliente).
- **HU/RF:** HU-S03-04 (RF-C06), HU-S05-05 parcial (RF-19, [TC-067]), HU-S08-03 parcial (RF-C09, [TC-106]) y HU-01 (RF-01).
- **Fecha:** 2026-10-27.
- **Rama:** `feature/delgado/cliente/panel-base`, rebasada sobre `feature/mayhuasca/cliente/cercania` (PR #38) porque la API todavía no está en `main`.
- **Plan:** `docs/documentacion/sprints/PLAN-PANEL-CLIENTE.md`. **Decisiones:** D-87 a D-91.

## Commits

- `750c463`: Vitest en rojo (S05-TC-025 a 040) y su evidencia.
- `4eed58b`: SPA del panel del cliente y arreglo de DEF-49.
- Después: evidencias, catálogo y relevo.

## Cambios

- **`ClientPanel` (nuevo):**
  - menú General (Inicio), Servicios (Nueva solicitud, Buscar técnicos, Mis solicitudes) y Cuenta (Notificaciones, Mi perfil), con la etiqueta «Gestión del cliente»;
  - contadores de solicitudes por elegir y notificaciones sin leer;
  - bloqueo del menú mientras el asistente guarda;
  - la búsqueda de la portada abre «Buscar técnicos».
- **Inicio (`ClientHome`):** comunicados, resumen real, solicitudes en curso, técnicos cerca y accesos por rubro. Cada bloque carga y falla por su cuenta. Sin próxima cita ni calificaciones.
- **Búsqueda:** `sort=proximity` cuando hay distrito, «Tarifa máxima» y tarjetas con iniciales, distancia y «Desde S/». Conserva un solo botón por tarjeta y `data-cy=technician-card`.
- **Mis solicitudes:** pestañas con contador, estados con texto y color, y `openId` desde el Inicio. La línea de tiempo (`RequestTimeline`) va dentro de `RequestTracking`, que ya se recarga con `request.updated`.
- **Notificaciones (`NotificationsPage`):** filtros, marcar una o todas como leídas, alertas y tiempo real.
- **Mi perfil (`ClientDetails`):** distrito principal y dirección de referencia, con doble validación.
- **`PanelShell`:** `initialSection`, `initialIntent`, `locked`, `bellKey` e iconos `plus`, `search` y `bell`.
- **DEF-49:** `NotificationBell` lee `items` y `unread_count`, se recarga con `notification.created` y suma «Ver todas».
- **`RequestPhase`:** suma «Registrada». El listado del S4 trae `phase` también para los borradores y antes mostraba «Estado pendiente de consulta».
- **Asistente:** colores de `requests.css` pasados a tokens del tema; tarjeta en el panel.
- **Retirado:** `ClientPortal.jsx` y su rama en `Sprint02Portal`.

## Pruebas adaptadas sin cambiar su ID

- **S07-TC-060 y 071:** la bandeja simulada usa la forma real (DEF-49).
- **S03-TC-080 complemento y S02-TC-089 (rediseño):** montan `ClientPanel` en lugar de `ClientPortal`. S02-TC-089 espera además `sort=proximity`, porque el filtro trae distrito.
- **S01-TC-016 y 076:** suman *mocks* del Inicio del cliente y del tiempo real, como ya hacían con `Sprint02Portal`; las aserciones no cambian.
- **Cypress, adaptadas sin ejecutar:**
  - ayudante `openMyRequests()`, usado antes de «Ver solicitud #N» en `sprint-03/request-submission`, `sprint-04/helpers` (openRequest), `realtime` y `selection` (3);
  - `support/sprint01.js` acepta el menú «Gestión del cliente» para abrir Mi perfil.
- **Correcciones a la prueba nueva antes del verde:**
  - la simulación de `makeEcho` no tenía `disconnect`;
  - S05-TC-039 esperaba «Solicitud dirigida a…», cuando el asistente dice «Técnico elegido: …»;
  - S05-TC-040 se rehízo como prueba directa de `PanelShell` bloqueado, porque llegar a un guardado real exigía recorrer el asistente entero.

## Pruebas

- **Rojo en `750c463`:** 16/16 fallidas (`evidencias/sprint-05/2026-10-27-vitest-rojo.txt`).
- **En `4eed58b`:** Vitest 325/325, lint y build aprobados y `npm audit` con 0 vulnerabilidades.
- **Conteo:** S05 con 24 Pest y 16 Vitest (40). Falta Cypress del S5.
- **Capturas:** 31, con la API real del slot A (siembra E2E del S4, cliente `e2e-client-match`). Script: `2026-10-27-4eed58b-panel-cliente-capturas.mjs`.
  - Inicio, búsqueda, nueva solicitud, Mis solicitudes, detalle con línea de tiempo, notificaciones y perfil, en claro y oscuro, a 1366 y 390 px, más el cajón móvil;
  - el guardado del distrito desde Mi perfil, de punta a punta;
  - ninguna desborda a lo ancho y no hubo errores de página;
  - «Sin conexión en tiempo real» aparece porque el entorno de capturas no levanta Reverb.
- **Cypress:** no se ejecutó.

## Pendientes

- Integrar el PR #38 y después este PR (se reapunta solo a `main` si se borra la rama del backend al integrar).
- Regresión Cypress S1 a S4 con los ayudantes adaptados.

## Registro de uso de IA

- **Herramienta y modelo:** Claude Code (Claude Opus 5.5), 2026-10-27.
- **Qué se aceptó:** componentes, estilos, pruebas y adaptaciones.
- **Qué se corrigió:**
  - la calificación de la tarjeta quedó unida al texto de experiencia y rompía S03-TC-078; ahora va en su propio elemento;
  - el script de capturas guardaba el perfil antes de que respondiera el `PATCH` del tema y recibía un 409 correcto; ahora espera esa respuesta;
  - las primeras capturas eran de página completa y dejaban la barra lateral fija en mitad de la imagen; se rehicieron a tamaño de ventana.
- **Revisó:** [PENDIENTE].

## Revisión

- **Revisor:** [PENDIENTE].
