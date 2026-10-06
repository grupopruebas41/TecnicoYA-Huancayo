import { defineConfig } from 'cypress';

// E2E contra la app real (Vite en 5173). Para el servidor de pruebas remoto:
// npx cypress run --config baseUrl=https://<servidor-de-pruebas>
export default defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:5173',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: false,
    video: false,
    screenshotsFolder: 'cypress/screenshots',
  },
});
