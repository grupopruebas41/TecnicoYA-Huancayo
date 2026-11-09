// Capturas del diálogo de cancelación con la lista cerrada de motivos (D-100) con la API real del slot A.
// Basado en 2026-11-04-6fa2c79-asistente-capturas.mjs. Uso: node <script> <repo> <outDir> <prefix>
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

  // Mis solicitudes completo (Fase 2): pestañas, grupos, cancelar, canceladas, búsqueda vacía, sin solicitudes, skeleton y
  // error, en claro y oscuro, a 1366 y 390 px. Cada combinación usa una cuenta nueva para que el contador sea exacto.
  const measure = page => page.evaluate(() => {
    const clipped = [...document.querySelectorAll('.client-request-card, .client-tabs [role=tab], .client-card-actions .button, .client-status')]
      .filter(el => el.scrollWidth > el.clientWidth + 1).length;
    const small = [...document.querySelectorAll('.client-card-actions .button')].filter(el => el.getBoundingClientRect().height < 44).length;
    return {overflowX: document.documentElement.scrollWidth > innerWidth, clipped, botonesBajos: small,
      tabs: [...document.querySelectorAll('.client-tabs [role=tab]')].map(el => el.textContent)};
  });
  const contrast = (page, selector) => page.evaluate(sel => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
    const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
    const style = getComputedStyle(el);
    let node = el; let background = 'rgba(0, 0, 0, 0)';
    while (node && /rgba\(.*, 0\)|transparent/.test(background)) { background = getComputedStyle(node).backgroundColor; node = node.parentElement; }
    const [a, b] = [lum(rgb(style.color)), lum(rgb(background))].sort((x, y) => y - x);
    return +((a + .05) / (b + .05)).toFixed(2);
  }, selector);

  const place = async (page, width, specialties, fill) => {
    await nav(page, width, 'Nueva solicitud');
    const wizard = page.getByRole('region', {name: 'Nueva solicitud'});
    await wizard.getByRole('checkbox', {name: /^Cómputo/}).waitFor({state: 'attached'});
    for (const name of specialties) await wizard.getByText(name, {exact: true}).first().click();
    await wizard.getByRole('button', {name: 'Siguiente'}).click();
    await wizard.getByRole('heading', {name: 'Paso 2: Subcategorías'}).waitFor();
    for (const group of await wizard.locator('section.order-group').all()) {
      await group.locator('label.order-row').first().click();
    }
    await wizard.getByRole('button', {name: 'Siguiente'}).click();
    await wizard.getByRole('heading', {name: /^Paso 3/}).waitFor();
    await wizard.getByRole('textbox', {name: 'Descripción de la falla'}).fill('El equipo falla desde ayer y necesito una revisión.');
    if (specialties.length > 1) await wizard.getByText('Usar la misma descripción para todas').click();
    await wizard.getByRole('button', {name: 'Siguiente'}).click();
    await wizard.getByRole('heading', {name: /^Paso 4/}).waitFor();
    if (!(await wizard.getByRole('combobox', {name: 'Distrito'}).inputValue())) await wizard.getByRole('combobox', {name: 'Distrito'}).selectOption({label: 'Huancayo'});
    await wizard.getByRole('textbox', {name: 'Dirección'}).fill('Jr. Sintético 742, interior B');
    if (fill) await fill(wizard);
    await wizard.getByRole('button', {name: 'Siguiente'}).click();
    await wizard.getByRole('heading', {name: /^Paso 5/}).waitFor();
    await wizard.getByText('Confirmo que el resumen es correcto').click();
    await wizard.getByRole('button', {name: 'Enviar pedido'}).click();
    await wizard.getByRole('heading', {name: 'Pedido enviado'}).waitFor({timeout: 30000});
  };
  for (const [width, height, theme] of [[1366, 900, 'light'], [1366, 900, 'dark'], [390, 844, 'light'], [390, 844, 'dark']]) {
    const tag = `${width}-${theme}`;
    const {context, page} = await session(width, height);
    const shot = async name => {
      await settle(page);
      report[`${tag}-${name}`] = await page.evaluate(() => {
        const options = [...document.querySelectorAll('.client-reason-option')];
        const dialog = document.querySelector('dialog');
        const box = dialog?.getBoundingClientRect();
        return {overflowX: document.documentElement.scrollWidth > innerWidth, opciones: options.length,
          opcionesBajas: options.filter(el => el.getBoundingClientRect().height < 48).length,
          recortadas: options.filter(el => el.scrollWidth > el.clientWidth + 1).length,
          circuloAlLado: options.every(el => { const r = el.querySelector('input').getBoundingClientRect(); const t = el.querySelector('span').getBoundingClientRect(); return r.right <= t.left + 1; }),
          dialogoCabe: box ? box.top >= 0 && box.bottom <= innerHeight + 1 && box.left >= 0 && box.right <= innerWidth + 1 : null,
          seDesplaza: dialog ? dialog.scrollHeight > dialog.clientHeight : null};
      });
      await page.screenshot({path: `${outDir}/${prefix}-${tag}-${name}.png`});
    };
    await login(page, 'e2e-client'); await setTheme(page, theme);
    await place(page, width, ['Cómputo']);
    await nav(page, width, 'Mis solicitudes');
    const board = page.getByRole('region', {name: 'Mis solicitudes'});
    await board.getByRole('button', {name: /^Cancelar la solicitud/}).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('radiogroup').waitFor();
    await shot('dialogo');
    await dialog.getByRole('button', {name: 'Cancelar solicitud'}).click();
    await dialog.getByText('Elige un motivo.').waitFor();
    await shot('sin-motivo');
    await dialog.getByText('Otro motivo', {exact: true}).click();
    await dialog.getByRole('button', {name: 'Cancelar solicitud'}).click();
    await dialog.getByText(/de 5 a 255 caracteres/).waitFor();
    await shot('otro-motivo-vacio');
    await dialog.getByText('Ya se solucionó el problema', {exact: true}).click();
    await dialog.getByRole('button', {name: 'Cancelar solicitud'}).scrollIntoViewIfNeeded();
    await shot('final-del-dialogo');
    await dialog.getByRole('button', {name: 'Cancelar solicitud'}).click();
    await board.getByText(/^Cancelaste la solicitud/).waitFor();
    await shot('cancelada');
    await context.close();
  }
  await browser.close();
  writeFileSync(path.join(outDir, `${prefix}-capturas.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  stop();
}
