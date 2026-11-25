# Evidencias · Panel del administrador, Fase A3 (Operación)

- **Fecha:** 2026-11-25.
- **Rama:** `feature/pimentel/admin/a3-operacion`.
- **Datos:** solo sintéticos (`@example.test`, rotulados «(demostración)»). Las contraseñas se generan al vuelo y no se guardan.
- **Decisiones aplicadas:** D-116 (intervención), D-118 (umbrales de alertas), D-119 (permisos), D-120 (cuándo se puede intervenir) y D-21 (plazo del pendiente de 24 h). No hay decisiones nuevas.

## Pruebas

| Suite | Resultado | Commit |
|---|---|---|
| Pest completa (slot A) | 572 de 573. S04-TC-068 («una sola difusión por fila del outbox») falló porque la señal `admin.matching` usaba el mismo evento `OutboxBroadcast`. Se corrigió el código, no la prueba: la señal es ahora `AdminMatchingSignal`. Después, Outbox, Realtime y A3: 17 de 17 | `dd04618`; corrección `08f1093` |
| Pest de la fase (S07-TC-199 a 208 y 210) | 11 de 11 | `08f1093` |
| Pest sobre SQLite, grupo `sqlite` (S07-TC-209 y las de A2) | 7 de 7; la CI lo corre en «Pest sobre SQLite (grupo sqlite)» | `08f1093` |
| Vitest de la fase (S07-TC-211 a 220 y 224) | 11 de 11, más las adaptadas S07-TC-139 y 157 | `dd04618` |
| Vitest completa, lint y build | 559 de 559; lint y build correctos | `08f1093` |
| e2e-cierre en la rama, run `45485928414` | S01 17, S02 17, S03 17, S05 35 y **S07 9** (S07-TC-163 a 165, 187 a 189 y 221 a 223), 0 fallos. S04: 17 de 18; S04-TC-088 falló en el cambio de cuenta con un 419 (DEF-82, intermitente) | `ba3cce7` |
| e2e-cierre, solo S04, run `45486976649` | **18 de 18**: no es una regresión de la fase | `ba3cce7` |

## Rojo

- **Pest (`2c07a38`):** los 12 casos fallaron (faltaban las rutas, `RequestIntervention`, el tablero, las alertas priorizadas, el canal y la demo).
- **Vitest (`6e76f08`):** fallaron los 10 casos nuevos.
- **DEF-84 (`2f70c54`):** S07-TC-224 falló (una respuesta vieja pisaba la lista filtrada); se corrigió en `dd04618`.

## Defectos

- **DEF-81, corregido (`929da5e`):** Solicitudes desbordaba a 390 px y el orden por columna tenía botones de menos de 44 px. Ahora la tabla pasa a tarjetas con `data-label` y los botones miden 44 px.
- **DEF-84, corregido (`dd04618`):** visto en la primera corrida de S07-TC-221. La lista aplicaba cualquier respuesta, aunque llegara después de una búsqueda más nueva. Ahora solo aplica la de la última consulta.
- **DEF-82, abierto:** se registró la evidencia nueva (419 en el login del cambio de cuenta). No es de esta fase.

## Capturas (`929da5e`)

Hay 20 capturas con demo-admin a 1366 y 390 px, en tema claro y oscuro: Solicitudes, el detalle de una solicitud, el diálogo «Cancelar con motivo», Emparejamiento en vivo y Alertas operativas.

**Mediciones (`2026-11-25-929da5e-admin-a3-capturas.json`):** sin desborde de página, con el contenido centrado, sin texto partido en vertical, sin imágenes rotas y sin controles de menos de 44 px.

**Visto en las capturas y corregido (`929da5e`):** a 390 px Solicitudes medía 498 px de ancho porque las celdas heredaban `white-space: nowrap`.

**Script:** `capturas.mjs`. Usa el slot A y no se ejecuta a la vez que Pest ni Cypress.

## Vitest completa

Con `08f1093`: 559 de 559 en 65 archivos; lint sin avisos y build correcto.
