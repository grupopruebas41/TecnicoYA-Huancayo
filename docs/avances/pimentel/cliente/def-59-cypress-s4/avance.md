# Avance · DEF-59: las 8 Cypress del S4 en rojo

| Campo | Valor |
|---|---|
| Integrante | Pimentel Chumbes, James |
| Sprint | 4 (regresión) |
| Módulo | `b-matching` y `c-notificaciones` |
| HU/RF y tarea | HU-S04-03, HU-S04-07 y RF-29: causa y corrección de S04-TC-085, 086, 088, 093, 094, 095, 096 y 100 |
| Rama | `feature/pimentel/cliente/def-59-cypress-s4`, sobre `feature/delgado/cliente/mis-solicitudes` (PR #47) |
| Commit/PR | Ver el historial de la rama y su PR |
| Fecha | 2026-11-08 |
| Revisor | [PENDIENTE] |
| Enlace a SonarQube | No aplica todavía: SonarQube corre al cierre del sprint (regla 12b) |
| Decisiones | No hay decisiones nuevas |

## Causas

| Prueba | Causa | Tipo | Corrección |
|---|---|---|---|
| S04-TC-093, 094 y 095 | «Conexión activa» antes de suscribir el canal, y sin recuperación tras una caída que pasa por `connecting` | **Producto (DEF-60)** | `connection.js`: estado según el canal suscrito y recuperación al volver a suscribirse |
| S04-TC-085 | La oferta vencida respondía «La información cambió» | **Producto (DEF-61)** | `OfferResponses`: el vencimiento va antes que la versión |
| S04-TC-086, 088 y 100 | `cy.visit` a otro hash no recarga la página: la SPA seguía con la cuenta anterior | Prueba | `switchAccount` recarga; S04-TC-086 visita otra URL |
| S04-TC-096 | La tecla Enter simulada sin `text` no activa el botón en Chrome | Prueba | Se agrega `text: "\r"` |
| S04-TC-094 y 095 | Esperaban 20 s una caída que pusher-js detecta a los 30 s | Prueba | Espera de 45 s |

## Pruebas

| Prevista | Ejecutada | Resultado |
|---|---|---|
| S04-TC-144 a 146 en rojo | `da57f79` y `e78da51` | Rojo |
| Cypress S4 completo | Slot A | 19/19 |
| Cypress S3 | Slot A | 17/17 |
| Cypress S5 | Slot A | Cortada por una interrupción de la sesión; repetir |
| Pest completo | Slot A | 446/446 |
| Vitest completo | Local | 402/402 |
| Lint, build y audits | Local | Aprobados |

**Pruebas cambiadas, con motivo:** S04-TC-104 (dos versiones) ahora recupera al volver a suscribirse el canal.

## Registro de uso de IA

| Campo | Valor |
|---|---|
| Herramienta y modelo | Claude Code, Claude Opus 5.5 |
| Fecha | 2026-11-08 |
| Qué se aceptó | [PENDIENTE] |
| Qué se corrigió | [PENDIENTE] |
| Quién lo revisó | [PENDIENTE] |
