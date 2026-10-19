import {defineConfig} from 'cypress';
import {tareasSprint04} from '../../scripts/e2e-tareas-s04.mjs';

// Configuración que usa scripts/run-e2e.mjs para cualquier sprint y slot. Los valores llegan
// por variables de entorno del arrancador; los predeterminados son los del slot A, Sprint 1.
// La contraseña sintética va en env (secreta, se lee con cy.env); las URL en expose (públicas).
export default defineConfig({
  video: false,
  screenshotOnRunFailure: false,
  defaultCommandTimeout: 20000,
  requestTimeout: 20000,
  env: {E2E_PASSWORD: process.env.TECNICOYA_E2E_PASSWORD},
  expose: {
    apiUrl: process.env.TECNICOYA_API_URL || 'http://127.0.0.1:8001',
    sessionCookie: process.env.SESSION_COOKIE || 'tecnicoya_e2e_a_session',
  },
  e2e: {
    baseUrl: process.env.TECNICOYA_WEB_URL || 'http://127.0.0.1:5174',
    specPattern: process.env.TECNICOYA_E2E_SPECS || 'cypress/e2e/sprint-01/**/*.cy.js',
    supportFile: false,
    testIsolation: true,
    setupNodeEvents(on) {
      on('task', tareasSprint04());
      on('before:browser:launch', (browser, options) => {
        if (browser.family === 'chromium' && browser.name !== 'electron') options.args.push('--force-prefers-reduced-motion');
        return options;
      });
    },
  },
});
