// Capturas del rediseño del panel del cliente (revisión del PR #39, DEF-50) con la API real del slot A
// (tecnicoya_testing) y la siembra E2E del S4. Basado en 2026-10-27-4eed58b-panel-cliente-capturas.mjs.
// Repite el entorno de scripts/run-e2e.mjs sin Cypress. Uso: node <script> <repo> <outDir> <prefix>
import {spawn, spawnSync} from 'node:child_process';
import {readFileSync, writeFileSync, mkdirSync, openSync, closeSync, writeSync, unlinkSync} from 'node:fs';
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
  for (let i = 0; i < 90; i++) {
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
  const browser = await chromium.launch({executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe'),
    args: ['--renderer-process-limit=1', '--disable-gpu', '--disable-extensions', '--disable-background-networking']});
  async function session(width, height) {
    const context = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce'});
    const page = await context.newPage();
    page.on('pageerror', error => { report.errors = [...(report.errors || []), String(error)]; });
    return {context, page};
  }
  const login = async page => {
    await page.goto(web + '/#cuenta', {waitUntil: 'load', timeout: 90000});
    await page.waitForSelector('[data-cy=login-email]', {timeout: 90000});
    await page.fill('[data-cy=login-email]', 'e2e-client-match@example.test');
    await page.fill('[data-cy=login-password]', password);
    await page.click('[data-cy=login-submit]');
    await page.waitForSelector('[data-cy=portal-client]');
  };
  const setTheme = async (page, theme) => {
    if (await page.evaluate(() => document.documentElement.dataset.theme) !== theme) {
      await page.click('.panel-avatar-button');
      // El tema se guarda con PATCH /me (D-76): se espera su respuesta para no editar el perfil con una versión vieja.
      const saved = page.waitForResponse(response => response.url().endsWith('/api/v1/me') && response.request().method() === 'PATCH');
      await page.getByRole('menuitem', {name: /Tema/}).click();
      await page.waitForFunction(value => document.documentElement.dataset.theme === value, theme);
      await saved;
    }
  };
  const nav = async (page, width, label) => {
    if (width < 760) await page.click('.panel-drawer-toggle');
    await page.locator('.panel-sidebar nav').getByRole('button', {name: label}).first().click();
  };
  const settle = page => page.waitForTimeout(500);

  // 1) D-91 de punta a punta: el cliente E2E (sin distrito) guarda su distrito principal y su dirección en Mi perfil.
  {
    const {context, page} = await session(1366, 900);
    await login(page); await setTheme(page, 'light');
    await nav(page, 1366, 'Mi perfil');
    const form = page.getByRole('form', {name: 'Datos de cliente'});
    await form.getByLabel('Distrito principal').selectOption({label: 'Huancayo'});
    await form.getByLabel('Dirección de referencia (privada)').fill('Jr. Sintético 742, frente al parque');
    await form.getByRole('button', {name: 'Guardar datos de cliente'}).click();
    await form.getByText('Guardamos tus datos de cliente.').waitFor();
    await settle(page);
    await page.screenshot({path: `${outDir}/${prefix}-1366-light-perfil-guardado.png`});
    await context.close();
  }

  // 2) Cada sección en claro y oscuro, a 1366 y 390 px.
  for (const [width, height, theme] of [[1366, 900, 'light'], [1366, 900, 'dark'], [390, 844, 'light'], [390, 844, 'dark']]) {
    const tag = `${width}-${theme}`;
    const {context, page} = await session(width, height);
    const shot = async name => {
      await settle(page);
      report[`${tag}-${name}`] = {overflowX: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)};
      await page.screenshot({path: `${outDir}/${prefix}-${tag}-${name}.png`});
    };
    await login(page); await setTheme(page, theme);
    await page.getByRole('region', {name: 'Técnicos cerca de ti'}).getByText(/En tu distrito|A .* km|Distancia no disponible/).first().waitFor();
    await shot('inicio');
    if (width < 760) { await page.click('.panel-drawer-toggle'); await shot('menu-cajon'); await page.keyboard.press('Escape'); }

    await nav(page, width, 'Buscar técnicos');
    await page.locator('[data-cy=technician-card]').first().waitFor();
    await shot('buscar');
    await page.locator('[data-cy=technician-card]').first().getByRole('button').click();
    await page.getByRole('region', {name: 'Perfil público'}).getByRole('heading', {level: 2}).waitFor();
    await shot('perfil-tecnico');

    await nav(page, width, 'Nueva solicitud');
    const wizard = page.getByRole('region', {name: 'Nueva solicitud'});
    await wizard.getByRole('radio').first().waitFor();
    await shot('nueva-solicitud');
    await wizard.getByRole('radio').first().check();
    await wizard.getByRole('button', {name: 'Siguiente'}).click();
    await wizard.getByRole('group', {name: 'Subcategoría'}).getByRole('radio').first().waitFor();
    await shot('nueva-solicitud-paso-2');

    await nav(page, width, 'Mis solicitudes');
    await page.getByRole('tablist', {name: 'Estados de tus solicitudes'}).waitFor();
    await shot('mis-solicitudes');
    await page.getByRole('tab', {name: /Por elegir/}).click();
    await page.getByRole('region', {name: 'Mis solicitudes'}).getByRole('button', {name: /Ver solicitud #/}).first().click();
    await page.getByRole('list', {name: 'Progreso de la solicitud'}).waitFor();
    await page.getByRole('list', {name: 'Progreso de la solicitud'}).scrollIntoViewIfNeeded();
    await shot('seguimiento');
    await page.getByRole('list', {name: 'Línea de tiempo de la solicitud'}).scrollIntoViewIfNeeded();
    await shot('detalle-linea-de-tiempo');
    report[`${tag}-linea-de-tiempo`] = await page.getByRole('list', {name: 'Línea de tiempo de la solicitud'}).locator('strong').allTextContents();

    await nav(page, width, 'Notificaciones');
    await page.getByRole('region', {name: 'Notificaciones'}).getByRole('button', {name: 'Marcar todas como leídas'}).waitFor();
    await page.waitForFunction(() => !document.querySelector('.client-notifications[aria-busy="true"]'));
    await shot('notificaciones');

    await nav(page, width, 'Mi perfil');
    await page.getByRole('form', {name: 'Datos de cliente'}).getByLabel('Distrito principal').waitFor();
    await shot('perfil');
    await context.close();
  }
  await browser.close();
  writeFileSync(path.join(outDir, `${prefix}-capturas.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  stop();
}
