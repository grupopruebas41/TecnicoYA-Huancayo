// Capturas del asistente del pedido con varios rubros (D-92) con la API real del slot A y la siembra E2E del S4.
// Basado en 2026-10-28-7821a2d-panel-sugerencias-capturas.mjs. Uso: node <script> <repo> <outDir> <prefix>
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

  // Pedido con varios rubros (D-92): los cinco pasos, la confirmación y Mis solicitudes agrupadas, en claro y oscuro, a
  // 1366 y 390 px, con e2e-client (sin solicitudes). Entre combinaciones se cierran sus solicitudes para liberar el cupo.
  const measure = page => page.evaluate(() => {
    const bar = document.querySelector('.order-bar')?.getBoundingClientRect();
    const clipped = [...document.querySelectorAll('.order-card, .order-row, .order-summary-card, .order-tabs [role=tab]')]
      .filter(el => el.scrollWidth > el.clientWidth + 1).length;
    return {overflowX: document.documentElement.scrollWidth > innerWidth, clipped, barVisible: bar ? bar.bottom <= innerHeight + 1 : null};
  });
  const tomorrow = new Date(Date.now() - 5 * 3600000 + 86400000).toISOString().slice(0, 10);
  const freeQuota = () => run(['artisan', 'tinker', '--no-ansi', '--execute',
    "DB::table('service_requests')->whereIn('client_id', DB::table('client_profiles')->join('users', 'users.id', '=', 'client_profiles.user_id')"
    + "->where('users.email', 'e2e-client@example.test')->pluck('client_profiles.id'))->whereNull('closed_at')->update(['closed_at' => now()]);"], 'cupo');

  for (const [width, height, theme] of [[1366, 900, 'light'], [1366, 900, 'dark'], [390, 844, 'light'], [390, 844, 'dark']]) {
    const tag = `${width}-${theme}`;
    const {context, page} = await session(width, height);
    // Capturas de la vista (no de página completa: la cabecera fija se repetiría en medio de la imagen).
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
    await wizard.getByText('Electricidad', {exact: true}).first().click();
    await shot('paso1');
    const finder = wizard.getByRole('combobox', {name: '¿Qué se malogró?'});
    await finder.fill('mi refrigeradora no enfría');
    await page.locator('.problem-search-panel [role=option]').first().click();
    await wizard.getByText(/^Agregado:/).waitFor();
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot('paso1-agregado');

    await next();
    await wizard.getByRole('heading', {name: 'Paso 2: Subcategorías'}).waitFor();
    await wizard.locator('label.order-row', {hasText: 'Reparación de hardware'}).click();
    await wizard.locator('label.order-row', {hasText: 'Tableros eléctricos'}).click();
    await wizard.getByText('3 de 3').waitFor();
    await shot('paso2-limite', 'top');
    await shot('paso2-electricidad', wizard.locator('label.order-row', {hasText: 'Tableros eléctricos'}));

    await next();
    await wizard.getByRole('heading', {name: 'Paso 3: Detalle por rubro'}).waitFor();
    const description = () => wizard.getByRole('textbox', {name: 'Descripción de la falla'});
    await wizard.getByRole('button', {name: 'No enfría'}).first().click().catch(() => {});
    await description().fill('No enfría desde ayer y hace un ruido fuerte cuando arranca el motor.');
    await wizard.getByText('Urgente', {exact: true}).click();
    await wizard.getByLabel(/^Agregar fotos de/).setInputFiles(path.join(frontend, 'cypress/fixtures/evidencia.png'));
    await wizard.getByText('Foto agregada. Se adjuntará al enviar el pedido.').waitFor();
    await wizard.getByText('Usar la misma descripción para todos').click();
    await shot('paso3', 'top');
    await shot('paso3-urgencia-fotos', wizard.locator('.order-urgency'));
    await wizard.getByRole('tab', {name: /Reparación de hardware/}).click();
    await shot('paso3-otro-rubro', 'top');

    await next();
    await wizard.getByRole('heading', {name: 'Paso 4: Ubicación y horario'}).waitFor();
    if (!(await wizard.getByRole('combobox', {name: 'Distrito'}).inputValue())) await wizard.getByRole('combobox', {name: 'Distrito'}).selectOption({label: 'Huancayo'});
    await wizard.getByRole('textbox', {name: 'Dirección'}).fill('Jr. Sintético 742, interior B');
    await wizard.getByRole('textbox', {name: 'Referencia (opcional)'}).fill('Frente al parque sintético');
    await wizard.getByText('Programar', {exact: true}).click();
    await wizard.getByLabel('Fecha').fill(tomorrow);
    await wizard.locator('label.order-option', {hasText: 'Tarde'}).click();
    await shot('paso4', 'top');

    await next();
    await wizard.getByRole('heading', {name: 'Paso 5: Resumen y envío'}).waitFor();
    await shot('paso5', 'top');
    await wizard.getByText('Confirmo que el resumen es correcto').click();
    await shot('paso5-confirmar', wizard.getByText('Confirmo que el resumen es correcto'));
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
  await browser.close();
  writeFileSync(path.join(outDir, `${prefix}-capturas.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  stop();
}
