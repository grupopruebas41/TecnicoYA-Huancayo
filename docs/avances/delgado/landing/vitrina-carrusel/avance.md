# Avance · Delgado · vitrina de subespecialidades

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
- Revisor: [PENDIENTE].
- PR: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/25.
- CI al abrir PR: backend y frontend pendientes de ejecución.

## Uso de IA

- Herramienta: Codex; modelo no expuesto por el entorno. Fecha: 2026-10-22.
- Aceptado: implementación React/CSS y pruebas de Vitest alineadas con el pedido.
- Corregido durante el trabajo: las pruebas heredadas que esperaban las cifras eliminadas y el selector de título anterior; se actualizaron para reflejar el nuevo contrato visual.
- Revisor humano: [PENDIENTE].
