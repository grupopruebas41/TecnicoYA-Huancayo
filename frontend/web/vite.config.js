import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: {port: 5173, proxy: {
    '/api': process.env.API_URL || 'http://127.0.0.1:3000',
    '/sanctum': process.env.API_URL || 'http://127.0.0.1:3000',
  }},
  test: {
    environment: 'jsdom', setupFiles: ['./src/test-setup.js'],
    reporters: ['default', 'junit'],
    outputFile: {junit: './test-results/junit.xml'},
    coverage: {
      provider: 'v8', reporter: ['text', 'lcov'], reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/**/*.test.{js,jsx}', 'src/test-setup.js'],
    },
  },
});
