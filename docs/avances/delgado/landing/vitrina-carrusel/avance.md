## Ajuste de escala y encuadre · 2026-10-25

- **PR:** #25, rama `feature/delgado/landing/vitrina-carrusel`.
- **Commits:** `d2f837b` pruebas de cálculo en rojo; `a9aa340` escala/navegación; `51f9a3b` ajuste de altura de Testimonios.
- **Cambios:** escala más compacta para landing y Nosotros; vitrina 3D conservada y escalada para caber en escritorio; cálculo de desplazamiento con medidas reales del header y submenú, centrado cuando la sección cabe y alineación superior cuando excede; foco accesible, URL sin hash y estado activo sincronizado. Añadido margen inferior a Contacto/Preguntas y transparencia del submenú sin franja rectangular.
- **Verificación real:** Chromium con Vite en `127.0.0.1:5175` y API local `:3000`; 1366×768 y 1920×1080, después de clicar Hero, Especialidades, Para técnicos, Testimonios y Equipo. Móvil 390×844: Hero. Todos los registros mostraron `hash: ""` y `overflow: false`. En 1366×768 las alturas fueron: Especialidades 634 px, Para técnicos 513 px, Testimonios 600 px y Equipo 405 px; todas dentro de la zona visible bajo header/submenú. Reporte: `docs/documentacion/evidencias/landing/2026-10-25-51f9a3b-playwright-layout.json`; capturas con el mismo prefijo.
- **Vitest:** `npm test` aprobado, 218/218 (27 archivos). `npm run lint` aprobado. `npm run build` aprobado (80 módulos). Cypress no ejecutado.
- **Archivos de código:** `frontend/web/src/landing.css`, `src/styles/tokens.css`, `src/landing/navigation.js`, `navigation.test.jsx`, `LandingRedesign.test.jsx`, `landing/Shared.jsx`, `landing/About.jsx`.
- **Revisor:** Pimentel Chumbes James.
# Avance · Delgado · vitrina de subespecialidades

## Corrección visual · 2026-10-25

- **PR:** [#25](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/25). Rama `feature/delgado/landing/vitrina-carrusel`.
- **Causa raíz:** `landing.css` tenía selectores más específicos para `.subcategory-card` que anulaban los estilos 3D de `service-carousel.css`. En Chromium las tarjetas quedaban `position: relative`, las vecinas `visibility: hidden` y `opacity: 0`; por eso se veía únicamente la tira de miniaturas y los elementos en flujo desplazaban el centro fuera del escenario. El escenario tenía altura, pero sus cartas estaban ocultas.
- **Cambios:** estilos con ámbito `.landing-page .ty-product-stage` recuperan `position:absolute`, perspectiva y visibilidad de las cinco cartas en escritorio/tres en móvil; escenario con altura comprobable (380 px escritorio, 360 px móvil); cartas centrales y vecinas usan `loading="eager"`; menor desplazamiento para que se vean las cartas exteriores; kicker dorado de 1 rem y título serif de la subespecialidad activa encima del abanico con fundido. El título usa `div` para no crear un segundo landmark `banner`.
- **Commits:** `3179918` pruebas en rojo; `61b9542` corrección visual; `5be135d` ajuste semántico.
- **Vitest:** **216/216**, 27 archivos. `npm run lint` aprobado. `npm run build` aprobado (80 módulos). Cypress no ejecutado.
- **CI PR #25:** frontend, backend y conteo aprobados en la ejecución [40251523217](https://github.com/grupopruebas41/TecnicoYA-Huancayo/actions/runs/40251523217).
- **Playwright/Chromium real:** con API local `:3000` (health HTTP 200), capturas a 1366 y 1920 px con cinco cartas y a 390 px con tres; todas visibles y con imagen cargada, ancho documental igual al viewport, altura 380/360 px, centro eager e imagen igual a la miniatura activa. Capturas y salidas: `docs/documentacion/evidencias/landing/2026-10-25-5be135d-*`.
- **Archivos de código:** `frontend/web/src/ServiceCarousel.jsx`, `frontend/web/src/service-carousel.css`, `frontend/web/src/Sprint02Landing.test.jsx`.
- **Dependencias/backend:** sin cambios.
- **Revisor:** Pimentel Chumbes James.

- Fecha: 2026-10-22.
- Módulo: frontend público / sección Especialidades.
- HU/RF y casos: vitrina conectada al catálogo; regresiones S02-TC-084, S02-TC-085 y S02-TC-089.
- Rama: `feature/delgado/landing/vitrina-carrusel`, creada desde `origin/main` actualizado.
- Commits: `b747eab` pruebas Vitest en rojo; `b06775e` implementación del abanico 3D.
- Cambios: retiré las cifras repetidas del encabezado; reemplacé el carrusel simple por abanico de hasta cinco cartas (tres en móvil); añadí temporizador de 3 s, miniaturas, navegación por flechas/teclado/clic/arrastre, pausa por hover/foco/visibilidad, inclinación en escritorio, transición al cambiar de especialidad, tarifa opcional y carga anticipada de la siguiente imagen. La imagen principal elige el recurso propio/local y evita coincidir con la subespecialidad activa cuando existe alternativa.
- Archivos de código: `frontend/web/src/ServiceCarousel.jsx`, `frontend/web/src/service-carousel.css`, `frontend/web/src/landing/Home.jsx`, `frontend/web/src/Sprint02Landing.test.jsx`, `frontend/web/src/LandingRedesign.test.jsx`.
- Evidencias: `docs/documentacion/evidencias/landing/2026-10-22-b06775e-{vitest,lint,build}.txt` y `README.md`.
- Pruebas: Vitest 214/214 (27 archivos); lint aprobado; build aprobado. Cypress no ejecutado.
- Seguridad/dependencias: no se tocó backend ni se instalaron dependencias.
- Revisor: Pimentel Chumbes James.
- PR: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/25.
- CI al abrir PR: backend y frontend pendientes de ejecución.

## Uso de IA

- Herramienta: Codex; modelo no expuesto por el entorno. Fecha: 2026-10-22.
- Aceptado: implementación React/CSS y pruebas de Vitest alineadas con el pedido.
- Corregido durante el trabajo: las pruebas heredadas que esperaban las cifras eliminadas y el selector de título anterior; se actualizaron para reflejar el nuevo contrato visual.
- Revisor humano: Pimentel Chumbes James.
