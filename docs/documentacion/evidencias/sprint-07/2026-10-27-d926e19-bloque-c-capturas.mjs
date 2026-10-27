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
  // Bloque C (D-85): menú agrupado, Inicio, Estadísticas, Usuarios, Solicitudes y activación, con la API real del slot A.
  const browser = await chromium.launch({executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe'),
    args: ['--renderer-process-limit=1', '--disable-gpu', '--disable-extensions', '--disable-background-networking']});
  async function session(width, height) {
    const context = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce'});
    const page = await context.newPage();
    globalThis.debugPage = page;
    page.on('console', message => { if (message.type() === 'error') console.error('[consola]', message.text()); });
    page.on('pageerror', error => { report.errors = [...(report.errors || []), String(error)]; });
    return {context, page};
  }
  const login = async (page, role) => {
    await page.goto(web + '/#cuenta', {waitUntil: 'load', timeout: 90000});
    await page.waitForSelector('[data-cy=login-email]', {timeout: 90000});
    await page.fill('[data-cy=login-email]', `e2e-${role}@example.test`);
    await page.fill('[data-cy=login-password]', password);
    await page.click('[data-cy=login-submit]');
    await page.waitForSelector(`[data-cy=portal-${role}]`);
  };
  const logout = async page => { await page.locator('[data-cy=logout]').evaluate(node => node.click()); await page.waitForSelector('[data-cy=login-submit]'); };
  const setTheme = async (page, theme) => {
    if (await page.evaluate(() => document.documentElement.dataset.theme) !== theme) {
      await page.click('.panel-avatar-button');
      await page.getByRole('menuitem', {name: /Tema/}).click();
      await page.waitForFunction(value => document.documentElement.dataset.theme === value, theme);
    }
  };
  const nav = async (page, width, label) => {
    if (width < 760) await page.click('.panel-drawer-toggle');
    await page.locator('.panel-sidebar nav').getByRole('button', {name: label, exact: true}).click();
  };
  const settle = page => page.waitForTimeout(500);

  // 1) Un usuario creado desde el formulario real (pendiente de activación), una sola vez.
  {
    const {context, page} = await session(1366, 900);
    await login(page, 'admin'); await setTheme(page, 'light');
    await page.getByRole('navigation', {name: 'Accesos rápidos'}).getByRole('button', {name: 'Crear usuario'}).click();
    await page.getByLabel('Nombres').fill('Rosa Elena');
    await page.getByLabel('Apellidos').fill('Huamán Soto');
    await page.getByLabel('Correo').fill('rosa.sintetica@example.test');
    await page.getByLabel('Teléfono').fill('987654321');
    await page.getByLabel('Distrito', {exact: true}).selectOption({label: 'Huancayo'});
    await page.getByLabel('Motivo (queda en la auditoría)').fill('Alta pedida por soporte telefónico.');
    await page.screenshot({path: `${outDir}/${prefix}-1366-light-usuarios-alta.png`});
    await page.getByRole('button', {name: 'Crear y enviar activación'}).click();
    await page.getByText('Usuario creado: le enviamos el enlace de activación a su correo.').waitFor();
    await context.close();
  }

  // 2) Capturas por tamaño y tema.
  for (const [width, height, theme] of [[1366, 900, 'light'], [1366, 900, 'dark'], [390, 844, 'light'], [390, 844, 'dark']]) {
    const tag = `${width}-${theme}`;
    const {context, page} = await session(width, height);
    const shot = name => page.screenshot({path: `${outDir}/${prefix}-${tag}-${name}.png`});
    const overflow = async name => { report[`${tag}-${name}`] = {overflowX: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)}; };
    await login(page, 'admin'); await setTheme(page, theme);
    await page.getByRole('region', {name: 'Últimos eventos'}).waitFor();
    await settle(page);
    await shot('inicio'); await overflow('inicio');
    report[`${tag}-badge`] = await page.evaluate(() => {
      const badge = document.querySelector('.panel-badge');
      if (!badge) return null;
      const style = getComputedStyle(badge);
      const own = badge.getBoundingClientRect();
      const parent = badge.parentElement.getBoundingClientRect();
      return {position: style.position, top: Math.round(own.top - parent.top), height: Math.round(own.height), parentHeight: Math.round(parent.height),
        margin: style.margin, transform: style.transform, lineHeight: style.lineHeight};
    });
    if (width > 760) {
      await page.getByRole('button', {name: 'Contraer menú'}).click();
      await page.locator('.panel-sidebar nav').getByRole('button', {name: 'Usuarios'}).hover();
      await settle(page);
      await shot('menu-contraido');
      await page.getByRole('button', {name: 'Expandir menú'}).click();
    } else {
      await page.click('.panel-drawer-toggle');
      await settle(page);
      await shot('menu-cajon');
      await page.keyboard.press('Escape');
    }

    await nav(page, width, 'Estadísticas');
    await page.getByRole('img', {name: /Solicitudes por día/}).or(page.getByText('Sin solicitudes en este período.').first()).first().waitFor();
    await settle(page);
    await shot('estadisticas'); await overflow('estadisticas');
    report[`${tag}-estadisticas-datos`] = await page.evaluate(() => [...document.querySelectorAll('.admin-stats .panel-card h3')].map(node => node.textContent));

    await nav(page, width, 'Usuarios');
    await page.getByRole('table', {name: /Usuarios/}).waitFor();
    await shot('usuarios'); await overflow('usuarios');
    await page.getByRole('button', {name: 'Rosa Elena Huamán Soto'}).click();
    await page.getByRole('group', {name: 'Acciones de la cuenta'}).waitFor();
    await settle(page);
    await shot('usuario-detalle'); await overflow('usuario-detalle');
    await page.getByRole('button', {name: 'Bloquear'}).click();
    await page.getByLabel('Motivo (queda en la auditoría)').fill('Reportes repetidos de suplantación.');
    await shot('dialogo-bloquear');
    await page.getByRole('button', {name: 'Cancelar'}).click();
    await page.getByRole('button', {name: 'Eliminar'}).click();
    await page.getByLabel('Motivo (queda en la auditoría)').fill('Pedido del titular.');
    await page.getByLabel('Escribe ELIMINAR para confirmar').fill('ELIMINAR');
    await shot('dialogo-eliminar'); await overflow('dialogo-eliminar');
    await page.getByRole('button', {name: 'Cancelar'}).click();

    await nav(page, width, 'Solicitudes');
    await page.getByRole('table', {name: /Solicitudes/}).or(page.getByText('Ninguna solicitud coincide con los filtros.')).first().waitFor();
    await shot('solicitudes'); await overflow('solicitudes');
    const first = page.getByRole('button', {name: /Ver la solicitud/}).first();
    if (await first.count()) {
      await first.click();
      await page.getByRole('region', {name: 'Línea de tiempo'}).waitFor();
      await settle(page);
      await shot('solicitud-detalle'); await overflow('solicitud-detalle');
    }
    await logout(page);
    await page.goto(web + '/#cuenta/activar?token=enlace-sintetico&email=rosa.sintetica%40example.test', {waitUntil: 'load'});
    await page.getByRole('heading', {name: 'Activa tu cuenta'}).waitFor();
    await shot('activacion'); await overflow('activacion');
    await context.close();
  }
  await browser.close();
  writeFileSync(`${outDir}/${prefix}-capturas.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(error);
  try { await globalThis.debugPage?.screenshot({path: `${outDir}/fallo.png`}); } catch {}
  process.exitCode = 1;
} finally { stop(); }
