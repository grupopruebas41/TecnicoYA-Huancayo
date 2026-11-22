# Cypress del cierre común S4-S5 · workflow «e2e-cierre»

- **Qué es:** `.github/workflows/e2e-cierre.yml`, un job por sprint en GitHub Actions (Ubuntu 24.04). No depende de la memoria del PC del equipo.
- **Cada job levanta:**
  - MySQL 8.4 efímero, con la base del slot A;
  - la API Laravel con `php artisan serve` y 4 procesos;
  - el frontend con Vite;
  - desde el S4, Reverb, la cola y el scheduler.
- **Mismo arrancador que en local:** `node scripts/run-e2e.mjs --sprint NN --slot A --junit`.
- **Disparo:** a mano desde Actions › e2e-cierre › Run workflow (por defecto S01 a S05). Mientras el archivo no estaba en `main`, también corrió con cada push a `feature/pimentel/e2e-cierre/**`.
- **S07:** no tiene Cypress ni siembra E2E; sus IDs son de Vitest. Por eso el workflow corre S01 a S05.

## Resultado final

Ejecución `44539805436`, commit `b0c0512`, 2026-11-19: **101 casos, 0 fallos, 0 omitidos.**

| Sprint | Casos | Aprobados | Meta Cypress (≥ 14) |
|---|---|---|---|
| S01 | 17 | 17 | Cumple |
| S02 | 17 | 17 | Cumple |
| S03 | 17 | 17 | Cumple |
| S04 | 18 | 18 | Cumple |
| S05 | 32 | 32 | Cumple |

Los JUnit y la salida de cada sprint están en [2026-11-19-b0c0512-e2e-cierre/](2026-11-19-b0c0512-e2e-cierre/), una carpeta por sprint. Las capturas de los fallos de las ejecuciones anteriores quedaron como artefactos de GitHub Actions (30 días).

## Cómo se llegó al verde (6 ejecuciones)

| Ejecución | S01 | S02 | S03 | S04 | S05 | Qué se corrigió después |
|---|---|---|---|---|---|---|
| 1 | 7 fallan | 4 | 9 | 12 | 29 | Bienvenida en las siembras (DEF-71) y Cypress desactualizadas (DEF-75) |
| 2 | ✅ | 2 | ✅ | 11 | 21 | Invitado sin JSON con 500 (DEF-72) y vigía de la API en `run-e2e` |
| 3 | ✅ | 1 | ✅ | 14 | 24 | La API caía con SIGSEGV (DEF-73); reloj E2E con instante fijo |
| 4 | 1 | 1 | ✅ | 13 | 4 | JIT de opcache desactivado (causa de DEF-73); carrusel con movimiento reducido (DEF-74) |
| 5 | ✅ | ✅ | ✅ | 1 | 1 | Barrido antes del Historial y vuelta al Inicio |
| 6 | ✅ | ✅ | ✅ | ✅ | ✅ | — |

## Pruebas en rojo de los defectos del producto

| Prueba | Defecto | Rojo |
|---|---|---|
| S05-TC-376 (Pest) | DEF-71: las cuentas E2E no tenían la bienvenida marcada | [2026-11-19-s05-tc-376-pest-rojo.txt](2026-11-19-s05-tc-376-pest-rojo.txt) |
| S05-TC-377 (Pest) | DEF-72: 500 «Route [login] not defined» para un invitado que no pide JSON | [2026-11-19-s05-tc-377-pest-rojo.txt](2026-11-19-s05-tc-377-pest-rojo.txt) |
| S05-TC-378 (Pest) | DEF-73: reloj E2E con closure como hora de prueba | [2026-11-19-s05-tc-378-pest-rojo.txt](2026-11-19-s05-tc-378-pest-rojo.txt) |
| S05-TC-379 (Vitest) | DEF-74: la tarjeta del carrusel tapaba los controles con movimiento reducido | [2026-11-19-s05-tc-379-vitest-rojo.txt](2026-11-19-s05-tc-379-vitest-rojo.txt) |

## Notas

- **DEF-73 (la API caía):**
  - **Causa de las caídas:** el JIT de opcache que `setup-php` activa por defecto. PHP rechazaba objetos de su propia clase (`must be of type Carbon\CarbonImmutable, Carbon\CarbonImmutable given`) y el servidor terminaba con código 139.
  - **El reloj E2E no era la causa.** El cambio a un instante fijo se mantiene porque es más simple, es el camino de `travelTo` y la cola lo renueva en cada vuelta.
  - En local (XAMPP) el JIT no está activo y no se reproduce.
- **S02-TC-071 a 075** se reescribieron sobre las pantallas nuevas (pedido de Pimentel):
  - **S02-TC-073** prueba «al menos una franja», porque la semana ahora usa franjas fijas y ya no puede haber solapes;
  - **S02-TC-075** prueba las zonas, porque la pausa se retiró (D-104).
- **Cambios en las pruebas existentes:** todos están explicados en el código. En particular, S05-TC-179 ahora verifica el último intento de cancelar, porque la app reintenta sola después de un 409.
