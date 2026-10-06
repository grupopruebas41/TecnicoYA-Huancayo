import {defineConfig} from 'cypress';

export default defineConfig({
  video: false,
  screenshotOnRunFailure: false,
  defaultCommandTimeout: 20000,
  requestTimeout: 20000,
  env: {E2E_PASSWORD: process.env.TECNICOYA_E2E_PASSWORD},
  e2e: {
    baseUrl: 'http://127.0.0.1:5174',
    specPattern: 'cypress/e2e/sprint-01/**/*.cy.js',
    supportFile: false,
    testIsolation: true,
    setupNodeEvents(on) {
      on('before:browser:launch', (browser, options) => {
        if (browser.family === 'chromium' && browser.name !== 'electron') options.args.push('--force-prefers-reduced-motion');
        return options;
      });
    },
  },
});
