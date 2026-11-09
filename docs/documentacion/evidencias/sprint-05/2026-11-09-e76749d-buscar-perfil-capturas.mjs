// Capturas de la Fase 3 (D-101): Buscar técnicos y perfil público modernos, con Rosa Quispe y Diego Huamán, con la API
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
      await page.click('.panel-avatar-button');
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
  const settle = page => page.waitForTimeout(600);
  const idle = page => page.waitForFunction(() => document.querySelector('[aria-label="Buscar técnicos"]')?.getAttribute('aria-busy') === 'false');

  // Mediciones del diseño: sin desborde horizontal, objetivos táctiles de 44 px, textos sin recortar, barra fija y
  // contraste de la marca de ejemplo.
  const measure = page => page.evaluate(() => {
    const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
    const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
    const ratio = el => {
      if (!el) return null;
      let node = el; let background = 'rgba(0, 0, 0, 0)';
      while (node && /rgba\(.*, 0\)|transparent/.test(background)) { background = getComputedStyle(node).backgroundColor; node = node.parentElement; }
      const [a, b] = [lum(rgb(getComputedStyle(el).color)), lum(rgb(background))].sort((x, y) => y - x);
      return +((a + .05) / (b + .05)).toFixed(2);
    };
    const targets = [...document.querySelectorAll('.search-chip, .tech-favorite, .search-specialty, .profile-cta-bar .button')];
    const bar = document.querySelector('.profile-cta-bar');
    const barBox = bar?.getBoundingClientRect();
    return {
      overflowX: document.documentElement.scrollWidth > innerWidth,
      objetivosBajos: targets.filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height < 44; }).length,
      recortados: [...document.querySelectorAll('.tech-card h3, .search-specialty span, .tech-services h4, .tech-week th')]
        .filter(el => el.scrollWidth > el.clientWidth + 1).length,
      tarjetas: document.querySelectorAll('[data-cy=technician-card]').length,
      barraFiltros: document.querySelector('.search-filters') ? getComputedStyle(document.querySelector('.search-filters')).position : null,
      barraSolicitar: bar ? {posicion: getComputedStyle(bar).position, abajo: Math.round(innerHeight - barBox.bottom)} : null,
      contrasteEjemplo: ratio(document.querySelector('.tech-sample-tag')),
      contrasteChip: ratio(document.querySelector('.search-chip > span')),
    };
  });

  for (const [width, height, theme] of [[1366, 900, 'light'], [1366, 900, 'dark'], [390, 844, 'light'], [390, 844, 'dark']]) {
    const tag = `${width}-${theme}`;
    const {context, page} = await session(width, height);
    const shot = async (name, fullPage = false) => {
      await settle(page);
      report[`${tag}-${name}`] = await measure(page);
      await page.screenshot({path: `${outDir}/${prefix}-${tag}-${name}.png`, fullPage});
    };
    await login(page, 'e2e-client', 'client'); await setTheme(page, theme);
    await nav(page, width, 'Buscar técnicos');
    const search = page.getByRole('region', {name: 'Buscar técnicos'});
    await idle(page);
    await shot('buscar');
    await search.getByRole('group', {name: 'Especialidades'}).getByRole('button', {name: 'Refrigeración comercial'}).click();
    await idle(page);
    // La misma cuenta sirve para las cuatro combinaciones: si Rosa ya es favorita, se quita antes de guardarla.
    if (await search.getByRole('button', {name: 'Quitar a Rosa Quispe de favoritos'}).count()) {
      await search.getByRole('button', {name: 'Quitar a Rosa Quispe de favoritos'}).click();
      await page.getByText('Quitaste a Rosa Quispe de tus favoritos.').waitFor();
    }
    await search.getByRole('button', {name: 'Guardar a Rosa Quispe en favoritos'}).click();
    await page.getByText('Guardaste a Rosa Quispe en tus favoritos.').waitFor();
    await page.getByRole('button', {name: 'Quitar a Rosa Quispe de favoritos'}).scrollIntoViewIfNeeded();
    await shot('favorito');
    await search.getByRole('button', {name: 'Disponible hoy'}).click();
    await page.selectOption('#search-sort', 'price');
    await idle(page);
    await page.locator('.search-filters').scrollIntoViewIfNeeded();
    await shot('filtros');
    await page.locator('.search-filters').getByLabel('Calificación mínima').selectOption('5');
    await page.getByText('No hay técnicos que coincidan con los filtros elegidos.').waitFor();
    await shot('vacio');
    await search.getByRole('button', {name: 'Quitar filtros'}).click();
    await idle(page);
    await search.getByRole('group', {name: 'Especialidades'}).getByRole('button', {name: 'Refrigeración comercial'}).click();
    await idle(page);
    await search.getByRole('button', {name: 'Ver perfil de Rosa Quispe'}).click();
    const profile = page.getByRole('region', {name: 'Perfil público'});
    await profile.getByRole('heading', {name: 'Sobre mí'}).waitFor();
    await page.evaluate(() => scrollTo(0, 0));
    await shot('perfil-rosa');
    await profile.getByRole('heading', {name: 'Disponibilidad'}).scrollIntoViewIfNeeded();
    await shot('perfil-disponibilidad');
    await profile.getByRole('heading', {name: 'Calificaciones'}).scrollIntoViewIfNeeded();
    await shot('perfil-calificaciones');
    await profile.getByRole('button', {name: /^Ver el trabajo/}).first().click();
    await page.getByRole('dialog').waitFor();
    await shot('visor');
    await page.keyboard.press('Escape');
    await shot('perfil-completo', true);
    await profile.getByRole('button', {name: 'Volver a la búsqueda'}).click();
    await idle(page);
    await search.getByRole('group', {name: 'Especialidades'}).getByRole('button', {name: 'Cómputo'}).click();
    await idle(page);
    await search.getByRole('button', {name: 'Ver perfil de Diego Huamán'}).click();
    await profile.getByRole('heading', {name: 'Sobre mí'}).waitFor();
    await page.evaluate(() => scrollTo(0, 0));
    await shot('perfil-diego');
    await context.close();

    // El técnico edita su forma de trabajo, garantía y «qué incluye».
    const tech = await session(width, height);
    await login(tech.page, 'e2e-demo-diego', 'technician'); await setTheme(tech.page, theme);
    await tech.page.getByLabel('Forma de trabajo').scrollIntoViewIfNeeded();
    await settle(tech.page);
    report[`${tag}-tecnico-perfil`] = await measure(tech.page);
    await tech.page.screenshot({path: `${outDir}/${prefix}-${tag}-tecnico-perfil.png`});
    await tech.page.getByRole('button', {name: 'Servicios y tarifas'}).click();
    await tech.page.getByLabel(/^Qué incluye/).first().scrollIntoViewIfNeeded();
    await settle(tech.page);
    await tech.page.screenshot({path: `${outDir}/${prefix}-${tag}-tecnico-servicios.png`});
    await tech.context.close();
  }
  await browser.close();
  writeFileSync(path.join(outDir, `${prefix}-capturas.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  stop();
}
