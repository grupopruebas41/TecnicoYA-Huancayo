# Corrección de landing · 2026-10-18

Rama feature/delgado/landing/fix-carrusel, base origin/main 4c56cd7. S4.5 estaba limpio y publicado (76c5d16); no se trasladó su código a esta rama. Rojo fb1d945, implementación dec9aa9.

## Diagnóstico

ServiceCarousel deducía las especialidades desde GET /catalog/carousel. Ese endpoint solo contiene subcategorías activas con fotos públicas revisadas: no es el catálogo de especialidades. Ahora consulta GET /catalog/specialties y conserva todas las activas aunque el carrusel esté vacío. La foto principal ya no es la primera subcategoría. Sin image_url se muestra Imagen de la especialidad no disponible; sin subcategorías publicadas, su aviso separado. Sin especialidades activas, estado vacío explícito.

**Pedido al backend:** incluir image_url: string|null en cada elemento de GET /api/v1/catalog/specialties, a partir de specialties.hero_media_id y solo cuando el medio sea público, revisado (clean) y no retirado. Hoy CatalogController::specialties solo devuelve id, code, name, description. No se consulta /admin desde la landing ni se exponen IDs/rutas privadas. No se cambió backend/.

## Comparación histórica y estilos

Comparados styles.css, marketplace.css, main.jsx y sprint02.css con v0.3-antes-retiro-prototipo (cced99e): los estilos compartidos examinados no fueron borrados por el retiro. El problema es su aplicación al marcado v1: h1 con line-height .8, cabecera con diez enlaces, hero alto sin su contenido antiguo y tarjetas absolutas con alto fijo. Se conserva Barlow, Instrument Serif y paleta; landing.css delimita ajustes a .landing-page, evitando alterar los portales. Rejilla de cabecera y pasos, títulos con interlineado legible, secciones con fondos propios y espaciado consistente, y tarjetas de carrusel que reservan altura según contenido.

Se conserva el orden de diez secciones, navegación, 2500 ms y pausas por foco, hover, fuera de pantalla y movimiento reducido. Los tests S02-TC-084/085/089 mantienen sus aserciones y suman casos de foto principal, categorías sin fotos, catálogo vacío y hover.

## Evidencia visual

Capturas antes (4c56cd7) y después (dec9aa9) a 1440 y 375 px. Mediciones adicionales a 1024 y 768 px en JSON. Ancho del documento igual al viewport y cero solapamientos entre secciones en las cuatro medidas después del cambio. Revisión visual de las capturas completas, con movimiento reducido para congelar video/animaciones.

Fuente: GET reales del backend de desarrollo 127.0.0.1:3000, solo catálogo público, sin cambios de datos. El navegador de revisión 127.0.0.1:5175 encontró bloqueo CORS: para las capturas se reenviaron únicamente las lecturas /api/v1/catalog/** al mismo backend y se ajustaron cabeceras CORS en el navegador de revisión. No se fabricaron cuerpos/respuestas, no es una prueba de CORS ni E2E de producción. El entorno devolvía tres especialidades y carrusel vacío. No se subieron imágenes ni se tocó la base de desarrollo.

## Pruebas

Rojo: 3 fallan y 4 pasan (JUnit guardado). Verde final y cobertura en log; build aprobado y audit 0 vulnerabilidades. Logs fb1d945 capturados con implementación sin commit, posteriormente confirmada como dec9aa9. JUnit final y LCOV corresponden a dec9aa9. No Cypress: RAM observada entre 0,75 y 0,94 GiB. No Docker ni Pest local. CI se consulta en el PR.

Revisor: [PENDIENTE].

## Vitrina abanico 3D · 2026-10-22

Rama `feature/delgado/landing/vitrina-carrusel`. Commit de pruebas en rojo `b747eab`; implementación `b06775e`.

- Se quitaron las cifras duplicadas de «¿Qué necesitas resolver?» y las pruebas heredadas se ajustaron para verificar su ausencia.
- El carrusel usa solo las subespecialidades que devuelve el API para la especialidad seleccionada. Presenta hasta cinco cartas en escritorio y tres en móvil, con miniaturas, flechas, contador, teclado, clic en laterales, arrastre y swipe por eventos Pointer.
- Autoplay a 3 s; pausa por hover, foco y pestaña oculta; movimiento reducido quita autoplay/tilt/barajado y conserva cambios con fundido. La tarifa solo aparece si el API envía `reference_fee`; la siguiente imagen se precarga.
- La imagen principal usa `specialty.image_url` solo si no duplica una imagen del carrusel; en caso contrario emplea la imagen local de la especialidad. El índice inicial busca una foto distinta cuando existe.
- Primer rojo observado en Vitest: 23 pruebas; 5 fallos esperados por ausencia de las cifras eliminadas, kicker, abanico/miniaturas y diferenciación de imagen principal.
- Resultado verde, captura real de comandos: `2026-10-22-b06775e-vitest.txt` (214/214, 27 archivos), `2026-10-22-b06775e-lint.txt` y `2026-10-22-b06775e-build.txt` (Vite build aprobado).
- No se instaló nada, no se tocó backend y Cypress no se ejecutó.
- Revisor: [PENDIENTE].
