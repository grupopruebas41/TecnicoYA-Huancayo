# Corrección visual de vitrina — 2026-10-25

- Rama: `feature/delgado/landing/vitrina-carrusel`.
- Commits de implementación: `3179918` (pruebas en rojo), `61b9542` y `5be135d`.
- Frontend Vite: `http://127.0.0.1:5175` (5173 y 5174 ya estaban ocupados).
- API local: `http://127.0.0.1:3000/api/health`, respondió HTTP 200.
- Navegador: Playwright con Chromium ya instalado; no se instalaron navegadores ni dependencias.

## Verificación visual

| Ancho | Cartas | Alto del escenario | Imágenes cargadas | Desbordamiento horizontal |
|---:|---:|---:|---|---|
| 1366 px | 5 | 380 px | 5/5 | No |
| 1920 px | 5 | 380 px | 5/5 | No |
| 390 px | 3 | 360 px | 3/3 | No |

En los tres tamaños, la carta central tiene `loading="eager"` y su URL coincide con la miniatura activa.

- [Captura a 1366 px](2026-10-25-5be135d-vitrina-1366.png)
- [Captura a 1920 px](2026-10-25-5be135d-vitrina-1920.png)
- [Captura a 390 px](2026-10-25-5be135d-vitrina-390.png)

## Pruebas y calidad

- `npm test`: 27 archivos y 216 pruebas aprobadas. Salida en `2026-10-25-5be135d-vitest.txt`.
- `npm run lint`: aprobado. Salida en `2026-10-25-5be135d-lint.txt`.
- `npm run build`: aprobado, 80 módulos transformados. Salida en `2026-10-25-5be135d-build.txt`.
- Cypress no se ejecutó, según el alcance de la tarea.

## TDD

En `3179918`, antes de corregir la implementación, las dos pruebas nuevas fallaron: `parseFloat(stage.style.height)` era `NaN` y el encabezado `.ty-product-title` aún no existía. La salida resumida está en `2026-10-25-3179918-vitrina-vitest-rojo.txt`. La corrección se implementó en `61b9542`.
