# Avance · Panel del cliente final, Fase 2 (backend)

| Campo | Valor |
|---|---|
| Integrante | Mayhuasca Huanca, Karen Jandre |
| Sprint | 5 (adelanto, D-87) |
| Módulo | `a-solicitudes` |
| HU/RF y tarea | HU-S03-03, HU-S05-06, RF-01 y RF-19: tablero de Mis solicitudes y cancelación del cliente |
| Rama | `feature/mayhuasca/cliente/mis-solicitudes-api`, desde `main` `8bc2446` |
| Commit/PR | Ver el historial de la rama y su PR |
| Fecha | 2026-11-04 |
| Revisor | [PENDIENTE] |
| Enlace a SonarQube | No aplica todavía: SonarQube corre al cierre del sprint (regla 12b) |
| Decisiones | D-28; D-100 propuesta y pendiente de confirmar ([DECISIONES.md](../../../../documentacion/sprints/DECISIONES.md)) |

## Cambios

- `GET /client/requests` (`ClientRequestBoard`): pestañas, contadores, búsqueda, grupos por pedido y paginación por grupos.
- `POST /requests/{id}/cancellation` (`RequestCancellation`): cancelación con motivo, que libera ofertas, ronda, participación y cita.
- `ClientTimeline`: suma `request.cancelled`.
- Contrato S5 §10 y catálogo S05-TC-148 a 161.
- Sin migraciones: `cancelled_at` y `cancellation_reason` ya existían.

## Pruebas

Ver la evidencia `fase2-pest-completo` y `fase2-audits` en `docs/documentacion/evidencias/sprint-05/`.

## Pendientes

- Que Pimentel confirme D-100.

## Registro de uso de IA

| Campo | Valor |
|---|---|
| Herramienta y modelo | Claude Code, Claude Opus 5.5 |
| Fecha | 2026-11-04 |
| Qué se aceptó | [PENDIENTE] |
| Qué se corrigió | [PENDIENTE] |
| Quién lo revisó | [PENDIENTE] |
