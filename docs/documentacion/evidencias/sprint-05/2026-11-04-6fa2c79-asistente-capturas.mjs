// Capturas del asistente del pedido por especialidades (D-95) con la API real del slot A y la siembra E2E del S4.
// Basado en 2026-10-28-f9e58c5-pedido-capturas.mjs. Uso: node <script> <repo> <outDir> <prefix>
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

  // Pedido por especialidades (D-95): los cinco pasos, la confirmación, Mis solicitudes, el error legible, el perfil sin
  // descripción y el bloqueo con 3 pedidos activos, en claro y oscuro, a 1366 y 390 px. Entre combinaciones se cierran las
  // solicitudes de e2e-client para liberar el cupo.
  const measure = page => page.evaluate(() => {
    const bar = document.querySelector('.order-bar')?.getBoundingClientRect();
    const clipped = [...document.querySelectorAll('.order-card, .order-row, .order-summary-card, .order-tabs [role=tab], .order-live, .panel-shell .error')]
      .filter(el => el.scrollWidth > el.clientWidth + 1).length;
    return {overflowX: document.documentElement.scrollWidth > innerWidth, clipped, barVisible: bar ? bar.bottom <= innerHeight + 1 : null,
      pie: document.querySelector('.order-live')?.textContent ?? null, quota: document.querySelectorAll('.order-quota, .order-counter, .order-limit').length};
  });
  const contrast = page => page.evaluate(() => {
    const el = document.querySelector('.panel-shell .error');
    if (!el) return null;
    const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
    const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
    const style = getComputedStyle(el);
    const [a, b] = [lum(rgb(style.color)), lum(rgb(style.backgroundColor))].sort((x, y) => y - x);
    return {color: style.color, background: style.backgroundColor, ratio: +((a + .05) / (b + .05)).toFixed(2)};
  });
  const tomorrow = new Date(Date.now() - 5 * 3600000 + 86400000).toISOString().slice(0, 10);
  const freeQuota = () => run(['artisan', 'tinker', '--no-ansi', '--execute',
    "DB::table('service_requests')->whereIn('client_id', DB::table('client_profiles')->join('users', 'users.id', '=', 'client_profiles.user_id')"
    + "->where('users.email', 'e2e-client@example.test')->pluck('client_profiles.id'))->whereNull('closed_at')->update(['closed_at' => now()]);"], 'cupo');

  for (const [width, height, theme] of [[1366, 900, 'light'], [1366, 900, 'dark'], [390, 844, 'light'], [390, 844, 'dark']]) {
    const tag = `${width}-${theme}`;
    // SOLO_BLOQUEO=1 repite solo el bloqueo y el perfil, sin el recorrido completo.
    if (!process.env.SOLO_BLOQUEO) {
    const {context, page} = await session(width, height);
    const shot = async (name, target = null) => {
      if (target === 'top') await page.evaluate(() => window.scrollTo(0, 0));
      else if (target) await target.evaluate(el => el.scrollIntoView({block: 'center'}));
      await settle(page);
      report[`${tag}-${name}`] = await measure(page);
      await page.screenshot({path: `${outDir}/${prefix}-${tag}-${name}.png`});
    };
    const wizard = page.getByRole('region', {name: 'Nueva solicitud'});
    const next = () => wizard.getByRole('button', {name: /^(Siguiente|Enviar pedido)$/}).click();
    await login(page, 'e2e-client'); await setTheme(page, theme);
    await nav(page, width, 'Nueva solicitud');
    await wizard.getByRole('checkbox', {name: /^Cómputo/}).waitFor({state: 'attached'});
    await wizard.getByText('Cómputo', {exact: true}).first().click();
    await wizard.getByText('Refrigeración comercial', {exact: true}).first().click();
    await shot('paso1-sin-trabajos', 'top');
    await wizard.getByText('Electricidad', {exact: true}).first().click();
    await shot('paso1-tres', 'top');

    await next();
    await wizard.getByRole('heading', {name: 'Paso 2: Subcategorías'}).waitFor();
    await wizard.locator('label.order-row', {hasText: 'Reparación de hardware'}).click();
    await wizard.locator('section.order-group').first().locator('label.order-row').nth(3).click();
    await wizard.locator('section.order-group').nth(1).locator('label.order-row').nth(0).click();
    await wizard.locator('section.order-group').nth(1).locator('label.order-row').nth(1).click();
    await wizard.locator('label.order-row', {hasText: 'Tableros eléctricos'}).click();
    await shot('paso2-cinco-trabajos', 'top');
    report[`${tag}-deshabilitadas`] = await wizard.locator('input[name=subcategory_ids]:disabled').count();
    await wizard.getByRole('searchbox', {name: 'Filtrar subcategorías'}).fill('tablero');
    await shot('paso2-filtro', 'top');
    await wizard.getByRole('searchbox', {name: 'Filtrar subcategorías'}).fill('');

    await next();
    await wizard.getByRole('heading', {name: 'Paso 3: Detalle por especialidad'}).waitFor();
    const description = () => wizard.getByRole('textbox', {name: 'Descripción de la falla'});
    await wizard.locator('.order-chip').first().click().catch(() => {});
    await description().fill('El equipo falla desde ayer y hace un ruido fuerte cuando arranca.');
    await wizard.getByText('Urgente', {exact: true}).click();
    await wizard.getByText('Usar la misma descripción para todas').click();
    await shot('paso3', 'top');
    await wizard.getByRole('tab', {name: /Electricidad/}).click();
    await shot('paso3-otra-especialidad', 'top');

    await next();
    await wizard.getByRole('heading', {name: 'Paso 4: Ubicación y horario'}).waitFor();
    if (!(await wizard.getByRole('combobox', {name: 'Distrito'}).inputValue())) await wizard.getByRole('combobox', {name: 'Distrito'}).selectOption({label: 'Huancayo'});
    await wizard.getByRole('textbox', {name: 'Dirección'}).fill('Jr. Sintético 742, interior B');
    await wizard.getByText('Programar', {exact: true}).click();
    await wizard.getByLabel('Fecha').fill(tomorrow);
    await wizard.locator('label.order-option', {hasText: 'Tarde'}).click();
    await shot('paso4', 'top');

    await next();
    await wizard.getByRole('heading', {name: 'Paso 5: Resumen y envío'}).waitFor();
    await shot('paso5', 'top');
    await wizard.getByText('Confirmo que el resumen es correcto').click();

    // Error simulado del servidor, con la referencia sintética: mensaje legible y referencia pequeña.
    await page.route('**/api/v1/orders', route => route.fulfill({status: 500, contentType: 'application/json',
      body: JSON.stringify({message: 'No pudimos completar la operación. Inténtalo de nuevo.', error: {code: 'INTERNAL_ERROR'}, meta: {request_id: '00000000-0000-4000-8000-000000000000'}})}));
    await next();
    await page.locator('.panel-shell .error').first().waitFor();
    report[`${tag}-contraste-error`] = await contrast(page);
    await shot('error-legible', page.locator('.panel-shell .error').first());
    await page.unroute('**/api/v1/orders');

    await next();
    await wizard.getByRole('heading', {name: 'Pedido enviado'}).waitFor({timeout: 30000});
    report[`${tag}-pedido`] = await wizard.locator('.order-done-list li').allTextContents();
    await shot('confirmacion');
    await wizard.getByRole('button', {name: 'Ir a Mis solicitudes'}).click();
    await page.getByRole('region', {name: /^Pedido #/}).first().waitFor();
    await shot('mis-solicitudes', page.getByRole('region', {name: /^Pedido #/}).first());
    await context.close();
    await freeQuota();

    }

    // Bloqueo con 3 pedidos activos (e2e-client-limit).
    const blocked = await session(width, height);
    await login(blocked.page, 'e2e-client-limit'); await setTheme(blocked.page, theme);
    await nav(blocked.page, width, 'Nueva solicitud');
    await blocked.page.getByRole('heading', {name: 'Ya tienes 3 pedidos activos'}).waitFor();
    await settle(blocked.page);
    report[`${tag}-bloqueo`] = await measure(blocked.page);
    await blocked.page.screenshot({path: `${outDir}/${prefix}-${tag}-bloqueo.png`});
    await blocked.context.close();

    // Perfil público sin descripción: se pide con bio vacía para ver el estado vacío.
    const profile = await session(width, height);
    await login(profile.page, 'e2e-client-match'); await setTheme(profile.page, theme);
    await profile.page.route(/\/api\/v1\/technicians\/\d+$/, async route => {
      const response = await route.fetch();
      const body = await response.json();
      body.data.bio = null;
      await route.fulfill({response, json: body});
    });
    await nav(profile.page, width, 'Buscar técnicos');
    try {
      await profile.page.getByRole('button', {name: /Ver perfil/}).first().click({timeout: 15000});
      await profile.page.getByText('Este técnico aún no agregó una descripción.').waitFor({timeout: 15000});
      await settle(profile.page);
      report[`${tag}-perfil-sin-descripcion`] = await measure(profile.page);
      await profile.page.screenshot({path: `${outDir}/${prefix}-${tag}-perfil-sin-descripcion.png`});
    } catch (failure) {
      report[`${tag}-perfil-sin-descripcion`] = {omitida: String(failure).slice(0, 160)};
    }
    await profile.context.close();
  }
  await browser.close();
  writeFileSync(path.join(outDir, `${prefix}-capturas.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  stop();
}
