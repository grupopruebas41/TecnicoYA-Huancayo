import { defineConfig } from 'cypress';

export default defineConfig({
  video: false,
  screenshotOnRunFailure: false,
  env: { E2E_PASSWORD: process.env.TECNICOYA_E2E_PASSWORD },
  e2e: {
    baseUrl: 'http://localhost:5174',
    specPattern: 'cypress/e2e/sprint-01/**/*.cy.js',
    supportFile: false,
    testIsolation: true,
  },
});
