# Pulido final del panel del cliente · evidencias (2026-11-22)

Rama `feature/delgado/cliente/pulido-final`, desde `main` `c4da798` (#65 integrado). Datos sintéticos: cuentas `@example.test` del DemoSeeder en la base `tecnicoya_testing` (slot A), con una contraseña generada al vuelo que no se guarda.

## Capturas

Script: [`../pulido-cliente-capturas.mjs`](../pulido-cliente-capturas.mjs) (`node <script> <repo> <carpeta> <prefijo>`).

- **Antes** (`2026-11-22-c4da798-antes-*`, 66 capturas): `main` sin cambios.
- **Después** (`2026-11-22-3a6ea02-despues-*`, 68 capturas): la rama con todos los cambios de pantalla.
- **Cobertura:** 1366 y 390 px en tema claro y oscuro.
  - `premium` es demo-mype (Premium) y muestra las 14 pantallas: Inicio, Buscar técnicos, Perfil, Mis solicitudes, Detalle, Favoritos, Mis equipos, Sensores, Alertas, Promociones, Garantías, Novedades, Preguntas y Privacidad.
  - `free` es demo-cliente (Free) y muestra Inicio, Buscar técnicos y Perfil.
- **Mediciones** (`*-capturas.json`, por captura):
  - desborde horizontal y los elementos que se salen;
  - contenido centrado en el área principal;
  - texto partido en vertical: piezas de 3 o más letras más altas que 2,2 líneas y de menos de 40 px de ancho;
  - imágenes rotas;
  - controles de menos de 44 px.

| Medición | Antes | Después |
|---|---|---|
| Texto vertical en Buscar técnicos | «Ejemplo», «Nuevo» (y «4,6» partido) | ninguno |
| Controles de menos de 44 px | Inicio, paginación y pestañas de Mis solicitudes | ninguno |
| Desborde horizontal | Inicio a 1366 px mientras carga | ninguno |
| Imágenes rotas | ninguna | ninguna (sin el archivo, la imagen del equipo cambia a una ilustración SVG) |

## Pruebas

- **Rojo:**
  - Pest S05-TC-380 a 386 en `5e634fd` y S05-TC-387 en `c05a030`;
  - Vitest S05-TC-388 a 403 en `385a5d0`, que falla porque faltan los módulos nuevos: [`2026-11-22-vitest-rojo.txt`](2026-11-22-vitest-rojo.txt).
- **Verde:**
  - Pest 525/525 ([`2026-11-22-pest-verde.txt`](2026-11-22-pest-verde.txt));
  - Vitest 518/518 ([`2026-11-22-vitest-verde.txt`](2026-11-22-vitest-verde.txt));
  - lint sin avisos y build correcto;
  - e2e-cierre en la rama, run `45055447761` (`81d71b1`): **104 casos, 0 fallos** (S01 17, S02 17, S03 17, S04 18 y S05 35). La primera corrida (`45054900228`) encontró S05-TC-234, que esperaba `<details>` y se adaptó.

## Avisos ajenos a la app

En un Chromium limpio, sin extensiones (el que usa este script), no aparece el botón flotante de lápiz que tapa «Garantías» y «Cómo funciona», ni el aviso «¿No escucha nada? Subir el volumen».

Ninguno de los dos textos ni sus estilos existen en `frontend/web`. La lectura en voz alta del panel (`quickAccessibility.jsx`) no muestra avisos de volumen.

Los dos vienen de extensiones del navegador del equipo; no se tocaron.

## Revisión del #66 (2026-11-22)

- **Rojo:**
  - Pest S05-TC-407 a 414: [`2026-11-22-limite-pest-rojo.txt`](2026-11-22-limite-pest-rojo.txt);
  - Vitest S05-TC-415 a 419: [`2026-11-22-limite-vitest-rojo.txt`](2026-11-22-limite-vitest-rojo.txt).
- **Verde:**
  - Pest 533/533 ([`2026-11-22-revision66-pest-verde.txt`](2026-11-22-revision66-pest-verde.txt));
  - Vitest 524/524, lint y build;
  - e2e-cierre, run 45067814350: 104 casos, 0 fallos.
- **Capturas** (`2026-11-22-03e2269-revision66-*`, 24): Inicio, Perfil, Mis equipos (con las 11 imágenes del equipo) y Alertas, a 1366 y 390 px, en claro y oscuro. Sin imágenes rotas, desborde ni controles de menos de 44 px.
