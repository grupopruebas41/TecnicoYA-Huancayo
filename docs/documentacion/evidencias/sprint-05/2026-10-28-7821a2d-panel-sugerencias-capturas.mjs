// Capturas del panel de sugerencias del buscador (ajuste del PR #40, D-94) con la API real del slot A y la siembra E2E del S4.
// Basado en 2026-10-28-07649f6-buscador-capturas.mjs. Uso: node <script> <repo> <outDir> <prefix>
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
  const login = async (page, account = 'e2e-client-match', portal = 'client') => {
    await page.goto(web + '/#cuenta', {waitUntil: 'load', timeout: 90000});
    await page.waitForSelector('[data-cy=login-email]', {timeout: 90000});
    await page.fill('[data-cy=login-email]', `${account}@example.test`);
    await page.fill('[data-cy=login-password]', password);
    await page.click('[data-cy=login-submit]');
    await page.waitForSelector(`[data-cy=portal-${portal}]`);
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

  // Panel de sugerencias (ajuste del PR #40): 3 sugerencias abiertas en el Inicio y en el paso 1 de Nueva solicitud, en
  // claro y oscuro, a 1366 y 390 px. Se mide que el panel quede entre el campo y los chips y que nada lo tape.
  const layout = (page, scope) => page.evaluate(selector => {
    const root = document.querySelector(selector);
    const box = root.querySelector('.problem-search-box').getBoundingClientRect();
    const panel = root.querySelector('.problem-search-panel').getBoundingClientRect();
    const chips = root.querySelector('.problem-chips')?.getBoundingClientRect();
    const section = root.closest('section, .panel-card, .request-wizard');
    const next = section?.nextElementSibling?.getBoundingClientRect();
    const rows = [...root.querySelectorAll('[role=option]')].map(row => {
      const rect = row.getBoundingClientRect();
      return {height: Math.round(rect.height), clipped: row.scrollWidth > row.clientWidth + 1};
    });
    // El elemento visible en el centro de cada fila tiene que ser la fila misma (nada encima).
    const covered = [...root.querySelectorAll('[role=option]')].some(row => {
      const rect = row.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return hit && !row.contains(hit);
    });
    return {panelBelowField: panel.top >= box.bottom, gapToChips: chips ? Math.round(chips.top - panel.bottom) : null,
      nextCardBelow: next ? next.top >= panel.bottom : null, rows, covered,
      overflowX: document.documentElement.scrollWidth > innerWidth};
  }, scope);

  for (const [width, height, theme] of [[1366, 900, 'light'], [1366, 900, 'dark'], [390, 844, 'light'], [390, 844, 'dark']]) {
    const tag = `${width}-${theme}`;
    const {context, page} = await session(width, height);
    await login(page); await setTheme(page, theme);
    await page.getByRole('region', {name: 'Precios de referencia'}).getByText('desde S/', {exact: false}).first().waitFor();

    const finder = page.getByRole('combobox', {name: '¿Qué se malogró?'});
    await finder.fill('no enfría');
    await page.locator('.problem-search-panel [role=option]').nth(2).waitFor();
    await page.locator('.problem-search-panel').evaluate(panel => panel.scrollIntoView({block: 'center'}));
    await settle(page);
    report[`${tag}-inicio`] = {...await layout(page, '.client-problem-section .problem-search'),
      sugerencias: await page.getByRole('option').allTextContents()};
    await page.screenshot({path: `${outDir}/${prefix}-${tag}-inicio-sugerencias.png`});
    // Con el teclado: la segunda fila activa.
    await finder.press('ArrowDown');
    await settle(page);
    await page.screenshot({path: `${outDir}/${prefix}-${tag}-inicio-teclado.png`});
    await finder.fill('');

    await nav(page, width, 'Nueva solicitud');
    const wizard = page.getByRole('region', {name: 'Nueva solicitud'});
    const step1 = wizard.getByRole('combobox', {name: 'Describe el problema o elige la categoría'});
    await step1.fill('no enfría');
    await page.locator('.problem-search-panel [role=option]').nth(2).waitFor();
    await page.locator('.problem-search-panel').evaluate(panel => panel.scrollIntoView({block: 'center'}));
    await settle(page);
    report[`${tag}-asistente`] = await layout(page, '.request-wizard .problem-search');
    await page.screenshot({path: `${outDir}/${prefix}-${tag}-asistente-sugerencias.png`});
    await context.close();
  }
  await browser.close();
  writeFileSync(path.join(outDir, `${prefix}-capturas.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  stop();
}
