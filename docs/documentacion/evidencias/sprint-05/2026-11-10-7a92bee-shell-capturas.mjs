// Capturas de la Fase 4 (modo rápido): barra superior, panel del avatar, menú y páginas nuevas del cliente, con la API
// real del slot A. Basado en 2026-11-08-402ac39-motivos-capturas.mjs; repite el entorno de scripts/run-e2e.mjs sin
// Cypress. Uso: node <script> <repo> <outDir> <prefix>
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
  await run(['artisan', 'db:seed', '--class=Sprint05E2ESeeder', '--force', '--no-ansi'], 'seed');
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
  const login = async (page, account, portal) => {
    await page.goto(web + '/#cuenta', {waitUntil: 'load', timeout: 90000});
    await page.waitForSelector('[data-cy=login-email]', {timeout: 90000});
    await page.fill('[data-cy=login-email]', `${account}@example.test`);
    await page.fill('[data-cy=login-password]', password);
    await page.click('[data-cy=login-submit]');
    await page.waitForSelector(`[data-cy=portal-${portal}]`);
  };
  const setTheme = async (page, theme) => {
    if (await page.evaluate(() => document.documentElement.dataset.theme) !== theme) {
      // Fase 4: el cliente cambia el tema en la pestaña Apariencia del panel del avatar.
      await page.click('.panel-avatar-button');
      const saved = page.waitForResponse(response => response.url().endsWith('/api/v1/me') && response.request().method() === 'PATCH');
      await page.getByRole('tab', {name: 'Apariencia'}).click();
      await page.getByText(theme === 'light' ? 'Claro' : 'Oscuro', {exact: true}).click();
      await page.waitForFunction(value => document.documentElement.dataset.theme === value, theme);
      await saved;
      await page.keyboard.press('Escape');
    }
  };
  const nav = async (page, width, label) => {
    if (width < 760) await page.click('.panel-drawer-toggle');
    await page.locator('.panel-sidebar nav').getByRole('button', {name: label}).first().click();
  };
  const settle = page => page.waitForTimeout(600);
  const idle = page => page.waitForFunction(() => document.querySelector('[aria-label="Buscar técnicos"]')?.getAttribute('aria-busy') === 'false');

  // Fase 4 (modo rápido): una captura por pantalla principal, a 1366 y 390 en tema claro.
  const measure = page => page.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth > innerWidth,
    objetivosBajos: [...document.querySelectorAll('.panel-nav-item, .account-tabs [role=tab], .a11y-sizes button, .panel-icon-button, .panel-avatar-button')]
      .filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 40; }).length,
    recortados: [...document.querySelectorAll('.panel-label, .account-tabs [role=tab], .client-page h2, .premium-features h3')]
      .filter(el => el.getBoundingClientRect().width > 0 && el.scrollWidth > el.clientWidth + 1).length,
  }));
  for (const [width, height] of [[1366, 900], [390, 844]]) {
    const {context, page} = await session(width, height);
    const shot = async name => {
      await settle(page);
      report[`${width}-${name}`] = await measure(page);
      await page.screenshot({path: `${outDir}/${prefix}-${width}-light-${name}.png`});
    };
    const menu = async label => {
      if (width < 760) await page.click('.panel-drawer-toggle');
      await page.locator('.panel-sidebar nav').getByRole('button', {name: label}).first().click();
    };
    await login(page, 'e2e-client-match', 'client'); await setTheme(page, 'light');
    await settle(page);
    await shot('inicio');
    if (width < 760) { await page.click('.panel-drawer-toggle'); await shot('menu-cajon'); await page.keyboard.press('Escape'); }
    else { await page.getByRole('button', {name: 'Contraer menú'}).click(); await shot('menu-contraido'); await page.getByRole('button', {name: 'Expandir menú'}).click(); }
    await page.getByRole('button', {name: /^Notificaciones: \d+ sin leer$/}).click();
    await shot('campana');
    await page.keyboard.press('Escape');
    await page.getByRole('button', {name: 'Accesibilidad rápida'}).click();
    await shot('accesibilidad-rapida');
    await page.keyboard.press('Escape');
    await page.getByRole('button', {name: /^Cuenta de /}).click();
    await page.getByRole('dialog').waitFor();
    await shot('cuenta');
    for (const [tab, name] of [['Mis direcciones', 'direcciones'], ['Accesibilidad', 'cuenta-accesibilidad'], ['Comunicación', 'comunicacion'], ['Apariencia', 'apariencia']]) {
      await page.getByRole('tab', {name: tab}).click();
      if (name === 'direcciones') { await page.getByRole('button', {name: 'Agregar dirección'}).click(); }
      await shot(name);
    }
    await page.keyboard.press('Escape');
    for (const [label, name] of [['Mis equipos', 'premium'], ['Técnicos favoritos', 'favoritos'], ['Especialidades', 'especialidades'],
      ['Novedades', 'novedades'], ['Cómo funciona', 'como-funciona'], ['Preguntas frecuentes', 'preguntas'], ['Privacidad y términos', 'privacidad']]) {
      await menu(label);
      await page.waitForSelector('.client-page');
      await page.evaluate(() => scrollTo(0, 0));
      await shot(name);
    }
    await context.close();
  }
  await browser.close();
  writeFileSync(path.join(outDir, `${prefix}-capturas.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  stop();
}
