# Avance · Pimentel · Panel del administrador, Fase A3 (Operación), adelanto del S7

## Datos de la tarea

- **Integrante:** Pimentel (integración y panel del administrador). Lo ejecuta Claude Code según D-72.
- **Sprint:** adelanto del Sprint 7 (D-73), con IDs S07-TC.
- **Módulo:** F-Administración, con A-Solicitudes, B-Emparejamiento y C-Notificaciones.
- **HU/RF:** HU-S07-04 (operación de solicitudes), HU-S07-01 (alertas, TC-088) y HU-S07-07 (permisos); RNF de seguridad, privacidad, portabilidad (SQLite) y accesibilidad.
- **Fecha:** 2026-11-25.
- **Rama:** `feature/pimentel/admin/a3-operacion`, desde `main` con el #69 integrado.
- **Plan:** `docs/documentacion/sprints/PLAN-PANEL-ADMIN.md` (Fase A3).
- **Decisiones aplicadas:** D-116, D-118, D-119, D-120 y D-21. No hay decisiones nuevas.

## Commits

- `2c07a38`: Pest en rojo (S07-TC-199 a 210).
- `19cdf9f`: backend.
- `6e76f08`: Vitest en rojo (S07-TC-211 a 220).
- `605da32`: frontend.
- `89c8613`: Cypress S07-TC-221 a 223 y siembra E2E.
- `929da5e`: DEF-81 (visto en las capturas).
- `2f70c54` y `dd04618`: DEF-84 en rojo y corregido; Cypress S07-TC-164 adaptada.
- `ba3cce7`: catálogo, contrato 1.8, plan y capturas.
- `08f1093`: la señal del tablero en su propio evento (S04-TC-068).

## Cambios

- **Backend:**
  - detalle completo de la solicitud (cliente con id, nombre, distrito y plan; subcategorías; ofertas con ronda, estado y tiempo de respuesta; acciones);
  - `POST /admin/requests/{id}/cancellation` y `/rematch` con el permiso `requests.intervene`, motivo de 10 a 500 caracteres, versión esperada, `Idempotency-Key`, auditoría, línea de tiempo y avisos;
  - `GET /admin/requests/export` (CSV de la vista filtrada, sin datos del cliente y con fórmulas neutralizadas);
  - `GET /admin/matching/live` y el canal privado `admin.matching`;
  - `GET /admin/alerts`, priorizadas según D-118, con la misma fuente que el contador del menú;
  - migración `2026_11_25_000040_add_admin_cancellation_code`;
  - demo y siembra E2E con datos para cada pantalla.
- **Frontend:** Solicitudes reescrita (filtros, orden, paginación, tarjetas en el celular, CSV, detalle e intervención con confirmación), Emparejamiento en vivo (cuenta regresiva e indicador de conexión, Reverb o cada 30 s) y Alertas operativas con acción directa.
- **Pruebas adaptadas sin cambiar su ID** (explicado en el código): S07-TC-139, 157 y 164 (las secciones ya no están en preparación) y S07-TC-208 (la señal es otro evento).

## Pruebas

- **IDs nuevos:**
  - Pest: S07-TC-199 a 210 (12, una en el grupo `sqlite`);
  - Vitest: S07-TC-211 a 220 y 224 (11);
  - Cypress: S07-TC-221 a 223 (3).
- **Resultados:** ver `docs/documentacion/evidencias/sprint-07/admin-a3/README.md`.

## Pendientes

- **Base de desarrollo:** ejecutar `php artisan migrate` (una migración nueva) y, con `TECNICOYA_DEMO_PASSWORD`, `php artisan db:seed --class=DemoSeeder`.
- **DEF-82:** sigue abierto (419 intermitente en el cambio de cuenta del S04); propuesta de corrección en un PR aparte.
- **Distancias de Pilcomayo y Huancán (D-124):** siguen pendientes.
- **Siguiente:** Fase A4, desde S07-TC-225.

## Registro de uso de IA

- **Herramienta y modelo:** Claude Code (Claude Opus 5.5), 2026-11-25.
- **Qué se aceptó:** intervención, exportación, tablero, alertas, pantallas, demo y pruebas.
- **Qué se corrigió:**
  - en mis pruebas: el ayudante de la solicitud asignada debía rechazar antes las demás ofertas pendientes; la cabecera `Idempotency-Key` quedaba entre peticiones;
  - en el código: el espacio de nombres de `EffectivePermissions`; la señal del tablero usaba el evento del outbox y duplicaba su difusión (S04-TC-068);
  - en la pantalla: desborde a 390 px (DEF-81) y respuestas viejas que pisaban la lista (DEF-84).
- **Revisó:** [PENDIENTE]

## Revisión

- **Revisor:** [PENDIENTE]
- **Enlace a SonarQube:** solo en el cierre del sprint (regla 12b).
