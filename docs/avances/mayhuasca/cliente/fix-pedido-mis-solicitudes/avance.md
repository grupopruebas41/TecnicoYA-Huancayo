# Avance · Panel del cliente final, Fase 1 (backend)

| Campo | Valor |
|---|---|
| Integrante | Mayhuasca Huanca, Karen Jandre |
| Sprint | 5 (adelanto, D-87) |
| Módulo | `a-solicitudes` y `b-matching` |
| HU/RF y tarea | HU-S03-01, HU-S03-03, HU-S03-06, HU-S04-01, RF-01 y RF-05: corregir los dos 500 e implementar D-95 y D-96 |
| Rama | `feature/mayhuasca/cliente/fix-pedido-mis-solicitudes`, desde `main` `ce58081` |
| Commit/PR | Ver el historial de la rama y su PR |
| Fecha | 2026-11-04 |
| Revisor | [PENDIENTE] |
| Enlace a SonarQube | No aplica todavía: SonarQube corre al cierre del sprint (regla 12b) |
| Decisiones | D-95 y D-96 ([DECISIONES.md](../../../../documentacion/sprints/DECISIONES.md)) |

## Cambios

- **DEF-53 y DEF-54 (los dos 500):** la migración `000030` lleva guarda de MySQL y cada paso comprueba si ya existe, así que corre en SQLite y se recupera de un intento a medias. S05-TC-115 y 116 lo comprueban en la CI.
- **DEF-58:** `down()` de la migración `000027`.
- **DEF-57:** `DemoSeeder` deja la descripción vacía.
- **D-95:**
  - tabla `request_subcategories`;
  - versión 3 de reglas con `max_active_orders_per_client`;
  - `POST /orders` con una solicitud por especialidad;
  - clase `ActiveOrders` para el límite.
- **D-96:** `Eligibility` exige todas las subcategorías; `Matcher` y `TechnicianHistory` usan suma de tarifas, menor experiencia y estimación con cualquiera de ellas (`matching_v2`).
- **Documentos:** contrato §9, catálogo, reglas formalizadas y README (SQLite en local).

## Pruebas

| Prevista | Ejecutada | Resultado |
|---|---|---|
| Pest completo en `d4b78fe` | Slot A | 431/431 |
| `composer audit` | Local | Sin avisos |
| `npm audit` | Local | 0 vulnerabilidades |
| Migración sobre una copia de `local.sqlite` | Prueba temporal, no versionada | 31 aplicadas, sin perder solicitudes y con las versiones 1, 2 y 3 |

**Pruebas cambiadas, con motivo:**

- S05-TC-088 a 101: el cuerpo de `POST /orders` y el cupo cambian por D-95.
- S04-TC-025: espera `matching_v2` por D-96.
- S04-TC-140 y 142: suman el campo aditivo `subcategories`.

Las S03-TC-030 y 031 no cambian: una solicitud suelta cuenta como un pedido.

## Pendientes

- Integrar este PR junto con el del asistente (`feature/delgado/cliente/asistente-sin-limites`): este cambia el cuerpo de `POST /orders`.

## Registro de uso de IA

| Campo | Valor |
|---|---|
| Herramienta y modelo | Claude Code, Claude Opus 5.5 |
| Fecha | 2026-11-04 |
| Qué se aceptó | [PENDIENTE] |
| Qué se corrigió | [PENDIENTE] |
| Quién lo revisó | [PENDIENTE] |
