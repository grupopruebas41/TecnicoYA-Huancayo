# Relevo Codex · PR #24 · mejora de mapa y Especialidades

- Fecha: 2026-10-20. Rama: `feature/delgado/landing/rediseno-landing`.
- Commits de esta tarea: `8085d6e` (pruebas rojas), `b895554` (vitrina y mapa), `0e8d6fb` (navegación/tipo foco y traslado de evidencia roja). El código validado está en `0e8d6fb`.
- Alcance: solo `frontend/web`. No se modificaron backend, hero, cabecera, intro del video ni fondo fijo.
- Vitrina: sin formulario de búsqueda; usa especialidades/subcategorías de API, tarifa solo si viene del API, mapas de imágenes locales por categoría, fallback, skeleton/empty/error único; mini carrusel cada 3 s, chips/flechas, autoplay de categoría a 9 s y pausas/reduced motion.
- Mapa: tres zonas SVG enfocables y tocables, estado seleccionado, capas de volumen, elevación 3D, entrada escalonada y modo de movimiento reducido.
- Catálogo: proxy y HTTP client no difieren de `origin/main`; `.env.development` no existe. Backend no escuchaba en `127.0.0.1:3000`, Vite devolvió 502 por `ECONNREFUSED` en `/api/v1/catalog/specialties`; no se puede atribuir 404/500.
- Validación de código: `npm run test` 183/183 (24 archivos), `npm run lint` aprobado, `npm run build` aprobado. Cypress no ejecutado.
- Evidencias de rojo/verde, lint, build y proxy: `docs/documentacion/evidencias/landing/` (archivos `2026-10-20-*`; movidos desde `frontend/web/evidencias/` en el cierre S4.6).
- PR #24: https://github.com/grupopruebas41/TecnicoYa-Huancayo/pull/24. `git push origin feature/delgado/landing/rediseno-landing` actualiza el PR; revisar CI. Para comprobar catálogo real, iniciar Laravel en puerto 3000 y volver a cargar la landing.
- Revisor: [PENDIENTE].
