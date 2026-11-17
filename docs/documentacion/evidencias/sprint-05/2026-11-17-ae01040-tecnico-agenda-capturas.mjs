// Capturas de la corrección de Mi agenda del técnico (navegación de semanas y contador «Visitas»), con la API real del
// slot A. Basado en el script de la Fase T3; repite el entorno de scripts/run-e2e.mjs sin Cypress.
// Uso: node <script> <repo> <outDir> <prefix>
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
  const login = async (page, account, portal) => {
    await page.goto(web + '/#cuenta', {waitUntil: 'load', timeout: 90000});
    await page.waitForSelector('[data-cy=login-email]', {timeout: 90000});
    await page.fill('[data-cy=login-email]', `${account}@example.test`);
    await page.fill('[data-cy=login-password]', password);
    await page.click('[data-cy=login-submit]');
    await page.waitForSelector(`[data-cy=portal-${portal}]`);
  };
  // Corrección de Mi agenda: navegación de semanas y contador «Visitas». Dos ofertas abiertas (contador del menú) y la
  // historia demo del técnico (visitas en la semana actual y la siguiente).
  for (let i = 0; i < 2; i++) await run(['artisan', 'tecnicoya:e2e', 'open-round', 'e2e-technician-perfil@example.test', '--no-ansi'], 'oferta');
  const seedActivity = "$t = (int) DB::table('technician_profiles as t')->join('users as u', 'u.id', '=', 't.user_id')"
    + "->where('u.email', 'e2e-technician-perfil@example.test')->value('t.id');"
    + "$c = DB::table('client_profiles')->orderBy('id')->limit(2)->pluck('id')->map(fn ($i) => (int) $i)->all();"
    + "app(implode(chr(92), ['Database', 'Seeders', 'DemoTechnicianActivity']))->run($t, $c);";
  await run(['artisan', 'tinker', '--execute=' + seedActivity, '--no-ansi'], 'actividad');
  // Centrado de los contadores: distancia entre el centro del texto y el centro del círculo (0 = centrado).
  const measure = page => page.evaluate(() => {
    const offset = el => {
      const box = el.getBoundingClientRect(); const range = document.createRange();
      range.selectNodeContents([...el.childNodes].find(node => node.nodeType === 3 && node.textContent.trim()) || el);
      const text = range.getBoundingClientRect();
      return Math.round(Math.max(Math.abs((text.left + text.right) / 2 - (box.left + box.right) / 2), Math.abs((text.top + text.bottom) / 2 - (box.top + box.bottom) / 2)) * 10) / 10;
    };
    const nav = document.querySelector('.tech-weeknav');
    return {
      overflowX: document.documentElement.scrollWidth > innerWidth,
      desvioContadores: [...document.querySelectorAll('.tech-week-visits, .panel-nav-badge:not(.is-text)')].filter(el => el.offsetParent).map(offset),
      rango: nav?.querySelector('.tech-weeknav-title, strong')?.textContent?.trim() ?? null,
      etiqueta: document.querySelector('.tech-weeknav-tag')?.textContent ?? null,
      estaSemanaDesactivado: [...(nav?.querySelectorAll('button') || [])].find(b => /Esta semana/.test(b.textContent))?.getAttribute('aria-disabled') ?? null,
    };
  });
  for (const [width, height] of [[1366, 900], [390, 844]]) {
    const context = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce'});
    const page = await context.newPage();
    page.on('pageerror', error => { report.errors = [...(report.errors || []), String(error)]; });
    const shot = async (name, theme = 'light') => {
      await page.waitForTimeout(700);
      report[`${width}-${theme}-${name}`] = await measure(page);
      await page.screenshot({path: `${outDir}/${prefix}-${width}-${theme}-${name}.png`});
    };
    const menu = async label => {
      if (width < 760) await page.click('.panel-drawer-toggle');
      await page.locator('.panel-sidebar nav').getByRole('button', {name: label}).first().click();
    };
    const agenda = () => page.waitForResponse(response => response.url().includes('/technicians/me/agenda'));
    const week = async name => { const done = agenda(); await page.locator('.tech-weeknav').getByRole('button', {name}).click(); await done; };
    const theme = value => page.evaluate(v => { document.documentElement.dataset.theme = v; }, value);
    await login(page, 'e2e-technician-perfil', 'technician');
    await theme('light');
    if (width < 760) { await page.click('.panel-drawer-toggle'); await shot('menu'); await page.keyboard.press('Escape'); }
    await menu('Mi agenda');
    await page.locator('.tech-week').first().waitFor();
    await page.locator('.tech-weeknav').scrollIntoViewIfNeeded();
    if (width >= 760) await shot('menu');
    await shot('agenda-actual');
    await week('Semana siguiente');
    await shot('agenda-siguiente');
    await week('Esta semana');
    await week('Semana anterior');
    await shot('agenda-anterior');
    await week('Esta semana');
    await page.locator('.tech-weeknav').getByRole('button', {name: 'Semana siguiente'}).focus();
    await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
    await shot('agenda-foco');
    await theme('dark');
    await shot('agenda-actual', 'dark');
    await week('Semana siguiente');
    await shot('agenda-siguiente', 'dark');
    await week('Esta semana');
    await theme('light');
    await page.evaluate(() => { document.documentElement.dataset.textSize = '150'; });
    await shot('agenda-texto150');
    await page.evaluate(() => { delete document.documentElement.dataset.textSize; });
    await context.close();
  }
  await browser.close();
  writeFileSync(path.join(outDir, `${prefix}-capturas.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  stop();
}
