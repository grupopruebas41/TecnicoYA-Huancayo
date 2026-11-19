# SonarQube · cierre de los Sprints 4 y 5

- **Proyecto:** `tecnicoya-huancayo`, versión `sprint-05`. Quality Gate «TecnicoYa».
- **Código nuevo:** desde `sprint-03` (2026-10-16), así que un solo análisis cubre el Sprint 4 y el Sprint 5. El Sprint 4 no tuvo análisis propio en su cierre.
- **Rama:** `feature/pimentel/cierre-sonar/s05`, desde `main` `3f359ff`.
- **Cobertura importada:**
  - Pest con PCOV: 514/514, 96,1 % en total (`backend/api/test-results/clover.xml`);
  - Vitest con V8: 501/501, 85,8 % de sentencias (`frontend/web/coverage/lcov.info`).
- **Pedido de Pimentel:** corregir de verdad, sin marcar falsos positivos. Solo S5693 (límite de subida de 5 MB, D-46) queda aceptado por Pimentel en la interfaz.

## Antes y después

«Antes» es el análisis de las 20:27, ya sin los 5 bugs de JavaScript ni el `sha1` corregidos en `fa01e53`. El primer análisis del cierre tenía 8 bugs y 2 vulnerabilidades en el código nuevo, con fiabilidad C y seguridad D.

| Medida (código nuevo desde sprint-03) | Antes | Después |
|---|---|---|
| Fiabilidad (hallazgos) | 49 | 0 |
| Seguridad (hallazgos) | 1 | 1 (S5693, aceptado) |
| Mantenibilidad · High | 45 | 0 |
| Mantenibilidad · Medium | 310 | 265 |
| Mantenibilidad · Low | 95 | 59 |
| Mantenibilidad · Info | 7 | 7 |
| Calificación de fiabilidad | B | A |
| Calificación de seguridad | C | C, hasta que S5693 quede aceptado |
| Calificación de mantenibilidad | A | A |
| Cobertura del código nuevo | 89,7 % | 89,8 % |
| Duplicación del código nuevo | 0,49 % | 0,33 % |
| Cobertura total | 89,4 % | 89,4 % |

Lo que queda está en [DEUDA-TECNICA.md](../../../../calidad/DEUDA-TECNICA.md), con el conteo por regla y la razón.

## Archivos

| Archivo | Contenido |
|---|---|
| `gate.json` | Estado del Quality Gate y sus 5 condiciones |
| `measures.json` | Medidas del proyecto y del código nuevo |
| `issues-anonimo.json` | Hallazgos abiertos, anonimizados con `scripts/exportar-sonar-anonimo.mjs` |
| `antes-measures.json` y `antes-issues-anonimo.json` | Lo mismo en el análisis de «antes» |

## Qué se corrigió, por tipo de regla

| Commit | Reglas |
|---|---|
| `fa01e53` | S3403, S2259, S4790 y S1082 (fondos de diálogo) |
| `324b866` (S05-TC-374) | Expresiones con retroceso: agrupado de miles y limpieza de espacios |
| `9ec3e2c` | S6772, S6747, S6853 y S7737 |
| `ceef5c1` | S1082, S6845, S6847, S6848 y S6852: fondo como botón nativo, `<dialog>`, botón estirado, menú con flechas y `tablist` enfocables |
| `cf3d1d8` | S6847 en el menú de la portada |
| `b2fae85` | S1192: literales repetidos en PHP |
| `e16303b` | S3776 en PHP |
| `52dd800`, `8e0bc29` y `525d941` | S3776 en JavaScript (S05-TC-375) |
| `7d5656a` | Mecánicos: S2681, S1940, S6353, S6582, S6749, S7755, S7751, S5869 y S7744 |
