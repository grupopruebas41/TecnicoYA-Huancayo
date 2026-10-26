# Pulido visual de landing y Nosotros · verificación

- **Fecha:** 2026-10-26. **Rama:** `feature/delgado/landing/pulido-visual`.
- **Commits:** `2076753` pruebas en rojo · `febb525` implementación · `e2b7850` ajuste de ancho de la vitrina.
- **Entorno:** Vite en `127.0.0.1:5180` (el 5173 lo ocupaba otro proceso), API local `:3000` con health HTTP 200. Playwright y Chromium 1248 ya instalados en el equipo; no se instaló nada.
- **Nombres del equipo:** se sustituyen por «Integrante N» solo en las capturas (regla 9 de AGENTS.md). La página conserva los nombres autorizados.

## Cómo se capturó

- `*-playwright-recorrido.cjs` recorre la página a 1366×768 y 1920×1080 con `reducedMotion: "reduce"`, que omite la intro y hace inmediato el desplazamiento:
  - el hero de la landing;
  - un clic en cada enlace del menú: Servicios, Cómo funciona, Para técnicos y Preguntas;
  - el pie;
  - Nosotros;
  - un clic en cada enlace del submenú: Quiénes somos, Cómo verificamos, Tu seguridad, Testimonios, Equipo y Contacto;
  - el pie de Nosotros.

  A 390×844 captura el hero, Cómo funciona, el pie y Nosotros.
- `*-playwright-interacciones.cjs`: la primera pregunta frecuente abierta y el panel de Términos. Al abrirlo, el foco queda en «Cerrar»; tras Escape quedan 0 diálogos.
- `*-playwright-abanico.cjs`: sin movimiento reducido, espera a que termine la intro de video y captura el hero y la vitrina. El abanico muestra **5 cartas visibles** tanto a 1366 como a 1920. Con movimiento reducido las cartas se apilan; así estaba diseñado antes de este cambio.

## Medidas (`*-playwright-layout.json`)

| Vista | Borde fijo inferior | Borde superior de la sección |
|---|---|---|
| Landing 1366×768 y 1920×1080 (cabecera) | 72 px | 72 px en Servicios, Cómo funciona, Para técnicos y Preguntas |
| Nosotros 1366×768 y 1920×1080 (cabecera + barra del submenú) | 134 px | 134 px en las seis secciones del submenú |

- Las 31 vistas registran `hash: ""`, sin desbordamiento horizontal y sin texto visible a menos de 8 px del borde izquierdo. Antes del cambio, el pie y el hero de Nosotros estaban en x = 0.
- **Cómo funciona:** el grupo pasos + confianza mide 696 px en 1366×768, igual al espacio libre. Cabe entero bajo la cabecera.
- **Testimonios a 1366×768:** mide 657 px frente a 634 px libres. Los puntos del carrusel siguen visibles; solo el margen inferior queda fuera.

## Revisión visual propia

- Sin franjas de foto entre secciones. La capa fija pasa a un velo del 94 % al salir del hero.
- El logo y el menú no quedan tapados al hacer scroll: la cabecera y la barra del submenú usan vidrio oscuro.
- La píldora del submenú no tapa ningún kicker ni título.

## Pendiente o fuera de alcance

- El marcador ✦ del mapa Misión/Visión/Valores sigue cerca del texto «PUNTO 1 DE 3», como estaba antes del cambio. Se conservó por ser diseño aprobado.
- Cypress no se ejecutó.
