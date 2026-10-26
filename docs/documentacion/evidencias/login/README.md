# Evidencias · encuadre de la pantalla de sesión (#cuenta)

- **Fecha:** 2026-10-26.
- **Rama:** `feature/delgado/auth/encuadre-login`.
- **Commits:** `f20bb97` pruebas en rojo · `4aa5ff6` implementación.
- **Rojo** (`2026-10-26-f20bb97-login-vitest-rojo.txt`): fallan las 3 pruebas nuevas de `AuthLayout.test.jsx`.
- **Verde:** Vitest 234/234 en 29 archivos, lint aprobado y build aprobado (`2026-10-26-4aa5ff6-{vitest,lint,build}.txt`).
- **Capturas:** Playwright con el Chromium ya instalado. Vite en `127.0.0.1:5180` y la API local `:3000`, que devuelve 401 en `/me`.
  - Tamaños: 1366×768, 1920×1080 y 390×844.
  - Estados: inicio de sesión, registro, error de conexión y «Comprobando tu sesión».
  - El error de conexión se simula cortando `/api/v1/me`; «Comprobando tu sesión» se obtiene dejando esa petición pendiente.
  - El script de captura es `*-playwright-login.cjs` y las medidas están en `*-layout.json`.
- **Medidas:**
  - La cabecera mide 72 px.
  - En 1366×768 la tarjeta cabe entera en todos los estados; el registro llega hasta 712 px de 768.
  - El panel de marca mide 431 px y el formulario 647 px, es decir, 40 % y 60 %.
  - Ningún `role=alert` queda fuera de la tarjeta y no hay desbordamiento horizontal.
  - En 390 px el registro hace scroll dentro de la página; es lo esperado en móvil.
- **Cypress:** no se ejecutó. Se conservan los `data-cy` y el orden del DOM que recorre S01-TC-075: marca → Volver al inicio → `.auth-switch` → campos.
- **Revisor:** [PENDIENTE].

## Cambio de modo y Mostrar contraseña (2026-10-26)

- **Commits:** `a1b1498` pruebas en rojo · `3ad452d` implementación.
- **Rojo** (`2026-10-26-a1b1498-modo-vitest-rojo.txt`): fallan las 4 pruebas nuevas; las 3 anteriores siguen en verde.
- **Verde:** Vitest 238/238, lint aprobado y build aprobado (`2026-10-26-3ad452d-{vitest,lint,build}.txt`).
- **Capturas:** script `*-playwright-modos.cjs`, con movimiento normal.
  - 1366 px: inicio de sesión, un fotograma intermedio a 300 ms del clic, registro con la contraseña visible y vuelta al inicio de sesión.
  - 390 px: los mismos estados sin deslizamiento lateral.
  - Medidas en `*-modos.json`. En registro, el panel ocupa x 144–575 y el formulario x 575–1222. Al volver, el foco cae en `login-email`. No queda ningún enlace de cambio de modo dentro del formulario.
- **Cypress S01-TC-075:** ajustada, pero no ejecutada.
  - Tras pulsar Enter en el panel, el foco llega solo a «Nombre», así que se quita el Tab que había antes.
  - Después de cada contraseña se suma un Tab por su botón Mostrar.
