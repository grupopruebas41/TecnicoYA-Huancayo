// Panel del administrador, Fase A3 (Operación): capturas a 1366 y 390 px, en tema claro y oscuro, con demo-admin
// (DemoSeeder) en el slot A (tecnicoya_testing): Solicitudes (DEF-81: sin desborde y con controles de 44 px), su detalle,
// el diálogo de cancelar con motivo, el Emparejamiento en vivo y las Alertas operativas. Mide desborde horizontal,
// centrado, texto partido en vertical, imágenes rotas y controles de menos de 44 px. Datos sintéticos; la contraseña se
// genera al vuelo y no se guarda.
// Uso: node <script> <repo> <outDir> <prefix>
import {spawn, spawnSync} from 'node:child_process';
import {readFileSync, writeFileSync, mkdirSync, openSync, closeSync, writeSync, unlinkSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {parseEnv} from 'node:util';
import {createRequire} from 'node:module';
import path from 'node:path';

const [root, outDir, prefix, only = ''] = process.argv.slice(2);
const wanted = only ? new Set(only.split(',')) : null;
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
  TECNICOYA_API_URL: api, TECNICOYA_WEB_URL: web, TECNICOYA_DEMO_PASSWORD: password};
delete env.ELECTRON_RUN_AS_NODE;

const lock = path.join(root, 'tmp/e2e-slot-A.lock');
const fd = openSync(lock, 'wx'); writeSync(fd, String(process.pid)); closeSync(fd);
const services = [];
const run = (args, label, extra = {}) => new Promise((ok, ko) => {
  const child = spawn(php, args, {cwd: backend, env: {...env, ...extra}, stdio: ['ignore', 'inherit', 'inherit'], windowsHide: true});
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
  // DemoSeeder solo corre con APP_ENV=local; la base sigue siendo tecnicoya_testing.
  await run(['artisan', 'db:seed', '--class=DemoSeeder', '--force', '--no-ansi'], 'demo', {APP_ENV: 'local'});
  // La bienvenida y el tutorial ya se capturaron en la Fase A1: aquí demo-admin los tiene vistos.
  await run(['artisan', 'tinker', '--no-ansi',
    "--execute=DB::table('users')->where('email', 'demo-admin@example.test')->update(['onboarding_completed_at' => now(), 'tour_completed_at' => now()]);"], 'visitas');
  services.push(spawn(php, ['artisan', 'serve', '--host=127.0.0.1', '--port=8001', '--no-reload'], {cwd: backend, env: {...env, PHP_CLI_SERVER_WORKERS: '4'}, stdio: 'ignore', windowsHide: true}));
  services.push(spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host=127.0.0.1', '--port=5174', '--strictPort'], {cwd: frontend, env, stdio: 'ignore', windowsHide: true}));
  await ready(api + '/api/health');
  await ready(web);
  mkdirSync(outDir, {recursive: true});
  const browser = await chromium.launch({executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe'),
    args: ['--renderer-process-limit=1', '--disable-gpu', '--disable-extensions', '--disable-background-networking']});

  const measure = page => page.evaluate(() => {
    const content = document.querySelector('.panel-content');
    const main = document.querySelector('.panel-main');
    const box = content?.getBoundingClientRect();
    const mainBox = main?.getBoundingClientRect();
    const visible = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
    // Texto partido en vertical: un elemento en línea con 2+ caracteres más alto que ancho y con varias líneas.
    const vertical = [...document.querySelectorAll('.panel-content span, .panel-content strong, .panel-content h3, .panel-content small')]
      .filter(el => visible(el) && el.children.length === 0 && el.textContent.trim().length >= 3)
      .filter(el => { const r = el.getBoundingClientRect(); const line = parseFloat(getComputedStyle(el).lineHeight) || 20; return r.height > line * 2.2 && r.width < 40; })
      .map(el => el.textContent.trim()).slice(0, 10);
    const small = [...document.querySelectorAll('.panel-content button, .panel-content a[href], .panel-content summary')]
      .filter(visible).filter(el => { const r = el.getBoundingClientRect(); return r.height < 43.5 || r.width < 43.5; })
      .map(el => (el.getAttribute('aria-label') || el.textContent).trim().slice(0, 40)).slice(0, 10);
    return {
      overflowX: document.documentElement.scrollWidth > innerWidth,
      centrado: box && mainBox ? Math.abs((box.left - mainBox.left) - (mainBox.right - box.right)) < 4 : null,
      vertical,
      imagenesRotas: [...document.querySelectorAll('.panel-content img')].filter(img => img.complete && img.naturalWidth === 0).map(img => img.getAttribute('src')),
      menos44: small,
      desbordan: [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed')
        .map(el => el.tagName.toLowerCase() + '.' + [...el.classList].join('.')).slice(0, 6),
    };
  });

  const login = async (page, account) => {
    await page.goto(web + '/#cuenta', {waitUntil: 'load', timeout: 90000});
    await page.waitForSelector('[data-cy=login-email]', {timeout: 90000});
    await page.fill('[data-cy=login-email]', `${account}@example.test`);
    await page.fill('[data-cy=login-password]', password);
    await page.click('[data-cy=login-submit]');
    await page.waitForSelector('[data-cy=portal-admin]');
  };
  const setTheme = async (page, theme) => {
    if (await page.evaluate(() => document.documentElement.dataset.theme) === theme) return;
    await page.click('.panel-avatar-button');
    await page.getByRole('tab', {name: 'Apariencia'}).click();
    await page.getByText(theme === 'light' ? 'Claro' : 'Oscuro', {exact: true}).click();
    await page.waitForFunction(value => document.documentElement.dataset.theme === value, theme);
    await page.waitForTimeout(400);
    await page.keyboard.press('Escape');
  };
  const shot = async (page, name) => {
    report[name] = await measure(page);
    await page.screenshot({path: `${outDir}/${prefix}-${name}.png`, fullPage: true});
  };

  for (const [width, height] of [[1366, 900], [390, 844]]) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce'});
      const page = await context.newPage();
      page.on('pageerror', error => { report.errores = [...(report.errores || []), String(error)]; });
      await login(page, 'demo-admin');
      await setTheme(page, theme);
      const label = `${width}-${theme === 'light' ? 'claro' : 'oscuro'}`;
      const menu = async name => {
        if (width < 760) await page.click('.panel-drawer-toggle');
        await page.locator('.panel-sidebar nav').getByRole('button', {name: new RegExp('^' + name)}).first().click();
        await page.waitForTimeout(900);
      };
      const steps = [
        ['solicitudes', async () => { await menu('Solicitudes'); await page.locator('.adm-responsive').waitFor(); }],
        ['solicitud-detalle', async () => {
          await page.locator('.adm-row-open').first().click();
          await page.locator('.adm-request-bar').waitFor();
        }],
        ['dialogo-cancelar', async () => {
          const open = page.getByRole('button', {name: 'Cancelar con motivo'});
          if (await open.count()) { await open.click(); await page.locator('dialog[open]').waitFor(); }
        }],
        ['emparejamiento', async () => {
          if (await page.locator('dialog[open]').count()) await page.keyboard.press('Escape');
          await menu('Emparejamiento en vivo');
          await page.locator('.adm-live-grid').waitFor();
        }],
        ['alertas', async () => { await menu('Alertas operativas'); await page.locator('.adm-alert-list, .cx-empty').first().waitFor(); }],
      ];
      for (const [name, go] of steps) {
        try { await go(); await page.waitForTimeout(400); await shot(page, `${label}-${name}`); }
        catch (error) { report[`${label}-${name}`] = {fallo: String(error).slice(0, 200)}; }
      }
      await context.close();
    }
  }
  await browser.close();
  writeFileSync(path.join(outDir, `${prefix}-capturas.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 1).slice(0, 8000));
} finally {
  stop();
}
