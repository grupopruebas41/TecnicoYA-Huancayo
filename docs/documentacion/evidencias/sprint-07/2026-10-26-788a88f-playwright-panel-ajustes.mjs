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
      const overflow = async name => { const o = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth); report[tag + '-' + name] = {overflowX: o}; };
      await nav('Catálogo');
      await page.waitForSelector('.catalog-row');
      await shot('admin-catalogo-especialidades'); await overflow('especialidades');
      await page.getByRole('button', {name: 'Subcategorías', exact: true}).click();
      await shot('admin-catalogo-subcategorias'); await overflow('subcategorias');
      report[tag + '-subcategorias'].rows = await page.locator('.catalog-row').count();
      await page.locator('.catalog-row [role=switch]').first().click();
      await page.getByRole('dialog').waitFor();
      await shot('admin-catalogo-confirmar');
      await page.getByRole('dialog').getByRole('button', {name: 'Cancelar'}).click();
      await page.getByLabel('Filtrar por especialidad').selectOption({index: 1});
      await shot('admin-catalogo-filtro');
      await page.getByRole('button', {name: 'Distritos', exact: true}).click();
      await shot('admin-catalogo-distritos'); await overflow('distritos');
      await nav('Verificación');
      await shot('admin-verificacion');
      await nav('Comunicados');
      await page.getByRole('button', {name: 'Crear comunicado'}).click();
      await page.getByLabel('Título').fill('Mantenimiento programado');
      await page.getByLabel('Contenido').fill('El sábado de 6:00 a 8:00 el sitio estará en mantenimiento. Gracias por tu paciencia.');
      await page.locator('.s02-preview').first().scrollIntoViewIfNeeded();
      await shot('admin-comunicados-vista-previa');
      report[tag + '-vista-previa'] = await page.locator('.s02-preview').first().evaluate(node => { const s = getComputedStyle(node); return {color: s.color, background: s.backgroundColor}; });
      await nav('Mi perfil');
      const png = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
        g.fillStyle = '#1f6f6b'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#c9a35a'; g.beginPath(); g.arc(64, 64, 40, 0, 7); g.fill(); return c.toDataURL('image/png').split(',')[1]; });
      await page.locator('.profile-avatar-pick input').setInputFiles({name: 'avatar.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64')});
      await page.getByText('Foto de perfil actualizada.').waitFor();
      report[tag + '-avatar'] = {uploaded: true, topbarImage: await page.locator('.panel-avatar-button img').count()};
      await shot('admin-perfil');
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
  writeFileSync(`${outDir}/${prefix}-panel-capturas.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally { stop(); }
