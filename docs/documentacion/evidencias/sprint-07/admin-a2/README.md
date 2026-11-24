# Evidencias · Panel del administrador, Fase A2 (Inicio tipo panel de control)

- **Fecha:** 2026-11-25.
- **Rama:** `feature/pimentel/admin/a2-inicio`.
- **Datos:** solo sintéticos (`@example.test`, rotulados «(demostración)»). Las contraseñas se generan al vuelo y no se guardan.

## Pruebas

| Suite | Resultado | Commit |
|---|---|---|
| Pest completa (slot A) | 556 de 558 en la primera corrida. S04-TC-139 contaba 4 técnicos verificados y demo-tecnico-ocupado suma el quinto. S07-TC-173 vio una consulta de más en la primera petición del proceso (52 frente a 51; es una carga única, no depende de los datos). Ambas se adaptaron con la explicación en el código y pasan | `0c37d47` y `4fd7f0a` |
| Pest de la fase (S07-TC-167 a 178) | 12 de 12, más las adaptadas S07-TC-128, S04-TC-139 y S07-TC-173 | `4fd7f0a` |
| Vitest completa | 542 de 542; lint sin avisos y build correcto | `fd0616c`; la de la fase se repitió en `afe0bf1` |
| Vitest de la fase (S07-TC-179 a 186) | 8 de 8, más las adaptadas S07-TC-064, 065, 071 y 130 | `afe0bf1` |
| e2e-cierre en la rama | Ver el PR: run sobre el último commit | — |

## Rojo

- **Pest (`a17c772`):** los 12 casos fallaron porque faltaban `kpis`, `series`, `tasks`, `RuleBook::formalized`, la demo del Inicio y el archivo de distancias.
- **Vitest (`d97d076`):** fallaron los 8 casos nuevos y las 3 adaptadas (S07-TC-064, 065 y 130).

## Gráfico (dataviz)

- **Paleta:** categórica de 4 series, validada con `validate_palette.js`:
  - **tema oscuro**, sobre `#152a2d`: todo PASS;
  - **tema claro**, sobre `#ffffff`: PASS, con aviso de contraste (< 3:1) en aqua y amarillo. Por eso el gráfico lleva leyenda, etiquetas directas al final de cada línea, el detalle del día y la tabla equivalente.
- **Forma:** líneas de 2 px en una sola escala, con el detalle del día al pasar el mouse o con las flechas (`End`, `Home` y `Escape`) y un resumen en texto.

## Capturas (`afe0bf1`)

Hay 12 capturas con demo-admin a 1366 y 390 px, en tema claro y oscuro: el Inicio, el gráfico de 30 días con el detalle de un día y la tabla abierta.

**Mediciones (`…-capturas.json`):** sin desborde de página, con el contenido centrado, sin texto partido en vertical, sin imágenes rotas y sin controles de menos de 44 px.

**Vistos en las capturas y corregidos:**
- **`864c646`:** a 390 px el gráfico se encogía (letra diminuta y etiquetas encimadas) y la tabla desbordaba la página. Ahora el dibujo usa el ancho real del contenedor y la tabla se desplaza dentro de su tarjeta;
- **`afe0bf1`:** a 1366 px las etiquetas «Canceladas 0» y «Vencidas 0» se encimaban con la fecha del último día, y los indicadores quedaban en 4 + 2. Ahora están en 3 + 3.

**Script:** `capturas.mjs`. Usa el slot A y no se ejecuta a la vez que Pest ni Cypress.
