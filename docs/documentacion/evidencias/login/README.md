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
