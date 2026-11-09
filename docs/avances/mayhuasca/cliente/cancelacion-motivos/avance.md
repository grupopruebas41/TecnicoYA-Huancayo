# Avance · D-100 aprobada: motivo de cancelación de una lista cerrada

| Campo | Valor |
|---|---|
| Integrante | Mayhuasca Huanca, Karen Jandre |
| Sprint | 5 (adelanto, D-87) |
| Módulo | `a-solicitudes` |
| HU/RF y tarea | HU-S05-06 y RF-19: motivo de cancelación de una lista cerrada |
| Rama | `feature/mayhuasca/cliente/cancelacion-motivos`, sobre `feature/delgado/cliente/mis-solicitudes` (PR #47) |
| Commit/PR | Ver el historial de la rama y su PR |
| Fecha | 2026-11-08 |
| Revisor | [PENDIENTE] |
| Enlace a SonarQube | No aplica todavía: SonarQube corre al cierre del sprint (regla 12b) |
| Decisiones | D-100, aprobada por Pimentel el 2026-11-08 ([DECISIONES.md](../../../../documentacion/sprints/DECISIONES.md)) |

## Cambios

- **Migración `000032`:** columna `service_requests.cancellation_reason_code`, con su CHECK solo en MySQL.
- **Backend:** `reason_code` obligatorio de la lista; con `other`, el texto es obligatorio de 5 a 255; con los demás, opcional hasta 255.
- **Diálogo:** seis opciones grandes (48 px o más) como `radiogroup`, foco inicial en la primera, error asociado, y texto obligatorio solo con «Otro motivo».
- **Contrato S5 §10.2** y D-100 registrada como aprobada.

## Pruebas

| Prevista | Ejecutada | Resultado |
|---|---|---|
| Rojo de la lista cerrada | `c158ca8` | Rojo |
| Rojo del diálogo más alto que la pantalla | `168f4b4` | Rojo |
| Pest completo | Slot A | 445/445 |
| Vitest completo | Local | 400/400 |
| Lint, build y audits | Local | Aprobados |
| Capturas (1366 y 390, claro y oscuro) | 20 | Sin desborde; el diálogo cabe y se desplaza |
| Cypress S05-TC-179 | **Adaptada, sin ejecutar** | Menos de 1,5 GB libres |

**Pruebas cambiadas, con motivo:** S05-TC-156, 160, 169, 170, 171, 177, 180 y la Cypress S05-TC-179, por el cambio a lista cerrada que pidió Pimentel.

**Defecto visto en las capturas y corregido:** con seis opciones el diálogo superaba la pantalla y el botón «Cancelar solicitud» quedaba fuera; el círculo de cada opción salía encima del texto.

## Registro de uso de IA

| Campo | Valor |
|---|---|
| Herramienta y modelo | Claude Code, Claude Opus 5.5 |
| Fecha | 2026-11-08 |
| Qué se aceptó | [PENDIENTE] |
| Qué se corrigió | [PENDIENTE] |
| Quién lo revisó | [PENDIENTE] |
