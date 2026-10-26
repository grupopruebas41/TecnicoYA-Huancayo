# Avance · Delgado · pulido visual de landing y Nosotros

## Datos de la tarea

- **Integrante:** Delgado (frontend). Por D-72, la ejecuta Claude Code mientras Codex no está disponible.
- **Sprint y módulo:** frontend público, landing y Nosotros; regresiones de S02-TC-089 a S02-TC-092.
- **Fecha:** 2026-10-26.
- **Rama:** `feature/delgado/landing/pulido-visual`, creada desde `main` `441644b`.
- **Commits:**
  - `2076753`: pruebas en rojo;
  - `febb525`: implementación;
  - `e2b7850`: ajuste de ancho de la vitrina.
- **PR:** https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/27

## Qué se cambió

- **A1:** los tokens `--ty-md`, `--ty-lg`, `--ty-xl` y `--ty-2xl` se usaban sin estar definidos, así que esos paddings y gaps valían 0. Esa era la causa de que el texto tocara el borde. Ahora están definidos y todas las secciones, la portada de Nosotros y el pie usan un único contenedor centrado.
- **A2:** el velo oscuro está en la capa fija del fondo y se intensifica al salir del hero. Se quitaron los `margin-bottom` de Contacto y Preguntas, que dejaban franjas de foto, y las tarjetas de especialidad pasan a estar dentro de una sección.
- **A3:** la cabecera y una barra fija de ancho completo para el submenú llevan vidrio oscuro con `blur(14px)`. La píldora tiene el mismo estilo arriba y al hacer scroll.
- **A4:**
  - `calculateScrollTarget` alinea el borde superior de la sección bajo la cabecera, o bajo cabecera + submenú en Nosotros, con las medidas reales.
  - `data-frame="center"` centra juntos «Más simple, paso a paso» y «Técnicos verificados…».
  - `useFixedChromeOffset` publica la altura medida de cabecera y submenú en `--ty-fixed-top`, que usan los `min-height`.
  - Se mantienen el desplazamiento sin hash, el modo inmediato con movimiento reducido y el recálculo al cambiar el tamaño y al cargar imágenes.
- **B1:** botón «Iniciar sesión» de 40 px de alto.
- **B2:** pasos más espaciados y viñetas con iconos.
- **B3:** «Para técnicos» más grande, con la foto de hasta 600 px y viñetas doradas.
- **B4:** «Preguntas» con una columna de introducción y botón «Ir a contacto», y un acordeón con icono +/− y fundido.
- **B5:** tarjeta destacada de «Empieza ahora», solo en la landing.
- **B6:** pie de cuatro columnas con Términos y Privacidad en un panel modal (foco en «Cerrar», Escape lo cierra y devuelve el foco) y una barra académica inferior.
- **C1:** portada de Nosotros dentro del contenedor, con el título un 20 % más pequeño.
- **C2:** «Quiénes somos» queda encuadrado bajo el submenú y su pie de foto ya no sale recortado.
- **C3:** «Cómo verificamos» con pasos en círculo dorado y una nota aparte.
- **C4:** barra de pesos de 72 px con mejor contraste y tarjetas de seguridad de igual altura.
- **C5:** Testimonios encuadrados sin que se vea la sección anterior.
- **C6:** las tarjetas de especialidad usan la imagen del API o la local por slug, la misma que la vitrina.
- **C7:** tarjetas de calidad con «60+», «CI» y «✓».
- **C8:** contacto en tarjeta. Los datos están centralizados en `landing/contact.js`, en `null`, y se muestran como «Por confirmar» con la etiqueta «Datos por confirmar».
- **C9:** no queda franja de foto antes del pie.

## Archivos

- `frontend/web/src/App.jsx`
- `frontend/web/src/ServiceCarousel.jsx`
- `frontend/web/src/styles/tokens.css`
- En `frontend/web/src/landing/`: `About.jsx`, `Home.jsx`, `Shared.jsx`, `HeroBackground.jsx`, `navigation.js`, `config.js`, `contact.js` (nuevo) y `polish.css` (nuevo).
- Pruebas: `frontend/web/src/landing/Polish.test.jsx` (nueva), `frontend/web/src/landing/navigation.test.jsx` y `frontend/web/src/LandingRedesign.test.jsx`.

## Pruebas

- **Previstas:** 10 nuevas en `Polish.test.jsx`, con estos temas:
  - encuadre superior con y sin submenú;
  - grupo centrado;
  - Cómo funciona;
  - barra de Nosotros;
  - pie de cuatro columnas;
  - panel legal;
  - constantes de contacto;
  - ausencia de REEMPLAZAR;
  - imagen por slug.
- **Pruebas anteriores modificadas:**
  - Dos pruebas de `navigation.test.jsx` cambian su valor esperado porque el equipo sustituyó el criterio de centrado (A4).
  - `LandingRedesign.test.jsx` ahora busca el texto académico solo dentro de Equipo, porque el pie también lo muestra (B6).
- **Resultado:** Vitest 228/228 en 28 archivos, lint aprobado y build aprobado. Los IDs nuevos son complementos de S02-TC-089 y S02-TC-092, así que no suman IDs distintos.
- **No ejecutado:** Cypress.
- **Evidencias:** `docs/documentacion/evidencias/landing/2026-10-26-*` y `2026-10-26-e2b7850-pulido-verificacion.md`.

## Pendientes

- El marcador ✦ del mapa Misión/Visión/Valores sigue junto al texto «PUNTO 1 DE 3», como antes del cambio. No se tocó por ser diseño aprobado.
- Cuando el equipo confirme los datos reales de contacto, se cargan en `landing/contact.js`.

## Revisión

- **SonarQube:** no aplica en esta tarea; corresponde al cierre del sprint.
- **Revisor:** [PENDIENTE].
- **Decisiones:** D-72 (Claude Code asume el frontend).

## Correcciones adicionales · 2026-10-26

- **Commits:** `70efaa6` pruebas en rojo; `a48812f` implementación.
- **Empieza ahora:** encabezado y dos tarjetas con imagen, viñetas doradas y botones a los mismos destinos de antes (registro de cliente y registro de técnico). La sección se ajusta a su contenido; las tarjetas tienen entrada escalonada (sin animación con movimiento reducido) y se apilan en móvil.
- **Submenú de Nosotros:** oculto mientras la portada está en pantalla (con `aria-hidden` e `inert`). Al salir de ella aparece con fundido y deslizamiento de 250 ms.
- **Cabecera y submenú:** forman un solo bloque, sin hueco entre ellos y con un único borde al final.
- **Encuadre:** cuenta el submenú aunque esté oculto. La sección activa del submenú se recalcula al terminar el desplazamiento.
- **Pruebas:** 3 nuevas. La prueba S02-TC-090 del submenú ahora simula que la portada ya salió de la vista, porque el submenú deja de mostrarse sobre ella. Vitest 231/231; lint y build aprobados.
- **Evidencias:** `docs/documentacion/evidencias/landing/2026-10-26-a48812f-*`.

## Uso de IA

- **Herramienta y modelo:** Claude Code (Claude Opus 5.5).
- **Fecha:** 2026-10-26.
- **Aceptado:** estilos, componentes, pruebas y scripts de captura.
- **Corregido durante la tarea:**
  - el grid del encuadre encogía la vitrina (commit `e2b7850`);
  - el logo del pie salía apilado;
  - el pie de foto de Quiénes somos salía recortado;
  - las capturas de Equipo mostraban nombres reales y se repitieron anonimizadas.
- **Revisión humana:** [PENDIENTE].
