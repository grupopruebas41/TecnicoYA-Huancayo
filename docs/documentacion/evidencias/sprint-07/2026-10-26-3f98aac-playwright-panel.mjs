// Capturas de la Fase 1 del panel con la API real del slot A (tecnicoya_testing) y datos sintéticos E2E.
// Repite el entorno de scripts/run-e2e.mjs sin Cypress. Uso: node panel-real.mjs <repo> <outDir> <prefix>
import {spawn, spawnSync} from 'node:child_process';
import {readFileSync, writeFileSync, mkdirSync, openSync, closeSync, writeSync, unlinkSync, existsSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {parseEnv} from 'node:util';
import {createRequire} from 'node:module';
import path from 'node:path';

const [root, outDir, prefix] = process.argv.slice(2);
const require = createRequire(import.meta.url);
const {chromium} = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const backend = path.join(root, 'backend/api');
const frontend = path.join(root, 'frontend/web');
const php = 'C:/xampp/php/php.exe';
const api = 'http://127.0.0.1:8001';
const web = 'http://127.0.0.1:5174';
const fixture = parseEnv(readFileSync(path.join(backend, '.env.testing'), 'utf8'));
const password = randomBytes(24).toString('base64url');
const env = {...process.env, ...fixture, TECNICOYA_SLOT: 'A', APP_ENV: 'testing', APP_DEBUG: 'false',
  APP_KEY: `base64:${randomBytes(32).toString('base64')}`, APP_URL: api,
  DB_CONNECTION: 'mysql', DB_HOST: '127.0.0.1', DB_PORT: '3306', DB_DATABASE: 'tecnicoya_testing', DB_USERNAME: 'tecnicoya_test',
  SESSION_DRIVER: 'database', SESSION_COOKIE: 'tecnicoya_e2e_a_session', SESSION_DOMAIN: 'null',
  SESSION_SECURE_COOKIE: 'false', SESSION_HTTP_ONLY: 'true', CACHE_STORE: 'array', BROADCAST_CONNECTION: 'log', QUEUE_CONNECTION: 'sync',
  SANCTUM_STATEFUL_DOMAINS: '127.0.0.1:5174', CORS_ALLOWED_ORIGINS: web, VITE_API_URL: api,
  TECNICOYA_API_URL: api, TECNICOYA_WEB_URL: web, TECNICOYA_E2E_PASSWORD: password};
delete env.ELECTRON_RUN_AS_NODE;

const lock = path.join(root, 'tmp/e2e-slot-A.lock');
const fd = openSync(lock, 'wx'); writeSync(fd, String(process.pid)); closeSync(fd);
const services = [];
const run = (args, label) => new Promise((ok, ko) => {
  const child = spawn(php, args, {cwd: backend, env, stdio: ['ignore', 'inherit', 'inherit'], windowsHide: true});
  child.on('exit', code => code === 0 ? ok() : ko(new Error(`${label}: ${code}`)));
});
async function ready(url) {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(url, {signal: AbortSignal.timeout(1500)})).ok) return; } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error('sin respuesta ' + url);
}
function stop() {
  for (const child of services) spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {stdio: 'ignore'});
  try { unlinkSync(lock); } catch {}
}

const report = {};
try {
  if (env.DB_DATABASE !== 'tecnicoya_testing') throw new Error('base no permitida');
  await run(['artisan', 'migrate:fresh', '--force', '--no-ansi'], 'migrate');
  await run(['artisan', 'db:seed', '--class=Sprint04E2ESeeder', '--force', '--no-ansi'], 'seed');
  services.push(spawn(php, ['artisan', 'serve', '--host=127.0.0.1', '--port=8001', '--no-reload'], {cwd: backend, env, stdio: 'ignore', windowsHide: true}));
  services.push(spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host=127.0.0.1', '--port=5174', '--strictPort'], {cwd: frontend, env, stdio: 'ignore', windowsHide: true}));
  await ready(api + '/api/health');
  await ready(web);
  mkdirSync(outDir, {recursive: true});
  const browser = await chromium.launch({executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe')});
  for (const [w, h] of [[1366, 768], [390, 844]]) {
    for (const theme of ['dark', 'light']) {
      const tag = `${w}-${theme}`;
      const context = await browser.newContext({viewport: {width: w, height: h}, reducedMotion: 'reduce'});
      const page = await context.newPage();
      const shot = name => page.screenshot({path: `${outDir}/${prefix}-${tag}-${name}.png`});
      const login = async role => {
        await page.goto(web + '/#cuenta', {waitUntil: 'networkidle'});
        await page.fill('[data-cy=login-email]', `e2e-${role}@example.test`);
        await page.fill('[data-cy=login-password]', password);
        await page.click('[data-cy=login-submit]');
        await page.waitForSelector(`[data-cy=portal-${role}]`);
        await page.waitForLoadState('networkidle');
      };
      const setTheme = async () => {
        const current = await page.evaluate(() => document.documentElement.dataset.theme);
        if (current !== theme) {
          await page.click('.panel-avatar-button');
          await page.getByRole('menuitem', {name: /Tema/}).click();
          await page.waitForLoadState('networkidle');
        }
      };
      const nav = async label => {
        if (w < 760) await page.click('.panel-drawer-toggle');
        await page.locator('.panel-sidebar nav').getByRole('button', {name: label}).click();
        await page.waitForLoadState('networkidle');
      };
      await login('admin');
      await setTheme();
      await nav('Inicio');
      await page.waitForSelector('.panel-kpi');
      await shot('admin-inicio');
      report[tag] = await page.evaluate(() => ({theme: document.documentElement.dataset.theme,
        overflowX: document.documentElement.scrollWidth > innerWidth,
        kpis: [...document.querySelectorAll('.panel-card')].map(card => card.innerText.replace(/\s+/g, ' ').slice(0, 160))}));
      await page.click('[aria-label^="Notificaciones"]');
      await shot('admin-campana');
      await page.keyboard.press('Escape');
      await page.click('.panel-avatar-button');
      await shot('admin-menu-avatar');
      await page.keyboard.press('Escape');
      if (w < 760) { await page.click('.panel-drawer-toggle'); await shot('admin-cajon'); await page.keyboard.press('Escape'); }
      else {
        await page.getByRole('button', {name: 'Contraer menú'}).click(); await shot('admin-contraido');
        await page.getByRole('button', {name: 'Expandir menú'}).click();
      }
      await nav('Catálogo');
      await shot('admin-catalogo');
      await nav('Verificación');
      await page.locator('.s02-panel select').first().selectOption('active');
      await page.waitForLoadState('networkidle');
      await page.locator('.s02-panel > button').first().click();
      await page.getByRole('button', {name: 'Suspender técnico'}).waitFor();
      await shot('admin-verificacion');
      const suspend = page.getByRole('button', {name: 'Suspender técnico'});
      await suspend.click();
      await page.getByLabel('Motivo de la suspensión').scrollIntoViewIfNeeded();
      await shot('admin-suspender');
      await nav('Mi perfil');
      await shot('admin-perfil');
      await page.locator('form[aria-label="Cambiar contraseña"]').scrollIntoViewIfNeeded();
      await shot('admin-perfil-contrasena');
      await page.locator('[data-cy=logout]').evaluate(node => node.click());
      await page.waitForSelector('[data-cy=login-submit]');
      for (const role of ['technician', 'client']) {
        await login(role);
        await setTheme();
        await shot(`${role}-inicio`);
        await page.locator('[data-cy=logout]').evaluate(node => node.click());
        await page.waitForSelector('[data-cy=login-submit]');
      }
      await context.close();
    }
  }
  await browser.close();
  writeFileSync(`${outDir}/${prefix}-panel-real.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally { stop(); }
