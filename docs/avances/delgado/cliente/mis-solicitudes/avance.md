# Avance · Panel del cliente final, Fase 2 (frontend)

| Campo | Valor |
|---|---|
| Integrante | Delgado Janampa, Jesus Oscar |
| Sprint | 5 (adelanto, D-87) |
| Módulo | `a-solicitudes` |
| HU/RF y tarea | HU-S03-03, HU-S05-06, RF-01 y RF-19: Mis solicitudes completo |
| Rama | `feature/delgado/cliente/mis-solicitudes`, apilada sobre `feature/mayhuasca/cliente/mis-solicitudes-api` |
| Commit/PR | Ver el historial de la rama y su PR |
| Fecha | 2026-11-04 |
| Revisor | [PENDIENTE] |
| Enlace a SonarQube | No aplica todavía: SonarQube corre al cierre del sprint (regla 12b) |
| Decisiones | D-28; D-100 propuesta y pendiente de confirmar ([DECISIONES.md](../../../../documentacion/sprints/DECISIONES.md)) |

## Cambios

- **`MyRequests`:** pestañas Activas, Programadas, Completadas y Canceladas con contador; búsqueda; grupos por pedido; paginación; skeleton; estados vacíos; error con Reintentar.
- **Tarjeta:** especialidad, subcategorías, estado con ícono y texto, técnico o «Buscando técnico» con el tiempo transcurrido, fecha y franja, y línea de tiempo resumida.
- **Acciones:** Ver detalle; Cancelar con diálogo accesible (`CancelRequestDialog`); Calificar desactivado con «Disponible en el Sprint 6».

## Pruebas

Ver la evidencia `fase2-frontend` y `fase2-cypress` en `docs/documentacion/evidencias/sprint-05/`.

**Pruebas cambiadas, con motivo:**

- S05-TC-032, 048, 113 y S03-TC-080: el tablero reemplaza a la lista anterior.
- Cypress S03-TC-067 y 068: abren Mis solicitudes y buscan la tarjeta nueva.
- Cypress del S4 que abren una solicitud: la buscan en las cuatro pestañas.
- Cypress S05-TC-146: el rótulo del grupo cambió.

**Defectos vistos al probar y corregidos:**

- En las capturas: ícono encima del texto, cuarta pestaña cortada en el celular y orden inverso dentro del pedido (S05-TC-150 y 164).
- En Cypress: cancelar fallaba con 409 si la búsqueda avanzaba mientras la lista estaba abierta (S05-TC-180).

## Pendientes

- Que Pimentel confirme D-100.
- DEF-59: 8 Cypress del S4 fallan también en `main`.

## Registro de uso de IA

| Campo | Valor |
|---|---|
| Herramienta y modelo | Claude Code, Claude Opus 5.5 |
| Fecha | 2026-11-04 |
| Qué se aceptó | [PENDIENTE] |
| Qué se corrigió | [PENDIENTE] |
| Quién lo revisó | [PENDIENTE] |
