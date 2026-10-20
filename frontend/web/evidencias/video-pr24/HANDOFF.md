# Relevo: video del hero · PR #24

2026-10-20 · feature/delgado/landing/rediseno-landing · Base 5a216e2.

Se restaura el archivo original habitacion.mp4 sin transformaciones CSS. Su zoom inicial está codificado en el video. El primer recorrido empieza en 0; al finalizar, repite desde CONTENT_REVEAL_SECONDS (00:04:19, cue preexistente) para omitir la entrada. Al salir del hero se pausa y al volver conserva currentTime. IntersectionObserver usa threshold 0.15. La pestaña oculta también pausa. Poster WebP existente, fallback ante carga/autoplay fallidos y movimiento reducido. Observer y listeners se limpian al desmontar. Diseño, cabecera y secciones aprobados conservados.

Pruebas nuevas: pausa/reanudación sin reiniciar, reduced-motion inicial y dinámico, repetición sin entrada, fallback de reproducción, limpieza. La prueba del fondo estático anterior se actualiza por el nuevo requisito; conserva la comprobación de posición fija y poster. Mocks de HTMLMediaElement en las dos suites que montan App porque jsdom no implementa reproducción.

- Rojo: suite nueva falla por componente aún no creado (vitest-red.txt).
- Verde: npm run test -- --maxWorkers=2: 170/170, 23 archivos.
- npm run lint: aprobado.
- npm run build: aprobado.
- Sin Cypress, Docker ni cambios backend. Todo dentro de frontend/web.

Uso de IA: Codex para implementación y pruebas. Revisor humano: [PENDIENTE].
PR: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/24
