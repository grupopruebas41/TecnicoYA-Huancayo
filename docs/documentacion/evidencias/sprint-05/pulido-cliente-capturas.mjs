// Pulido final del panel del cliente: capturas de cada pantalla tocada a 1366 y 390 px, en tema claro y oscuro, con las
// cuentas de demostración (DemoSeeder: demo-mype Premium y demo-cliente Free) en el slot A (tecnicoya_testing). Mide
// desborde horizontal, texto partido en vertical (insignias letra por letra), imágenes rotas, controles de menos de 44 px
// y si el contenido está centrado. Datos sintéticos; la contraseña se genera al vuelo y no se guarda.
// Uso: node <script> <repo> <outDir> <prefix> [pantallas separadas por coma]
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
  await run(['artisan', 'tinker', '--no-ansi', `--execute=DB::table('users')->update(['onboarding_completed_at' => now(), 'tour_completed_at' => now()]);`], 'visitas');
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
    await page.waitForSelector('[data-cy=portal-client]');
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

  const SCREENS = [
    ['inicio', async (page, menu) => { await menu('Inicio'); await page.locator('.client-home').first().waitFor(); await page.waitForFunction(() => !document.querySelector('.client-skeleton'), null, {timeout: 20000}).catch(() => {}); }],
    ['buscar', async (page, menu) => { await menu('Buscar técnicos'); await page.locator('[data-testid=technician-card]').first().waitFor({timeout: 20000}); }],
    ['perfil', async page => {
      await page.locator('[data-testid=technician-card]').first().getByRole('button', {name: /^Ver perfil/}).click();
      await page.waitForTimeout(800);
    }],
    ['solicitudes', async (page, menu) => {
      await menu('Mis solicitudes');
      await page.locator('#client-board-panel[aria-busy=false]').waitFor();
      if (!await page.locator('.client-request-card').count()) await page.getByRole('tab', {name: /^Completadas/}).click();
      await page.locator('#client-board-panel[aria-busy=false]').waitFor();
    }],
    ['solicitud-detalle', async page => {
      const button = page.locator('.client-request-card').first().getByRole('button', {name: /^Ver detalle/});
      if (await button.count()) { await button.click(); await page.locator('.client-request-detail').waitFor(); await page.locator('.client-request-detail').scrollIntoViewIfNeeded(); }
    }],
    ['favoritos', async (page, menu) => { await menu('Técnicos favoritos'); await page.waitForTimeout(800); }],
    ['equipos', async (page, menu) => { await menu('Mis equipos'); await page.locator('.equipment-card, .premium-empty').first().waitFor(); }],
    ['sensores', async (page, menu) => { await menu('Sensores IoT'); await page.locator('.sensor-card, .premium-empty').first().waitFor(); }],
    ['alertas', async (page, menu) => { await menu('Alertas'); await page.locator('.premium-alert, .premium-empty').first().waitFor(); }],
    ['promociones', async (page, menu) => { await menu('Promociones'); await page.waitForTimeout(800); }],
    ['garantias', async (page, menu) => { await menu('Garantías'); await page.waitForTimeout(800); }],
    ['novedades', async (page, menu) => { await menu('Novedades'); await page.waitForTimeout(800); }],
    ['faq', async (page, menu) => { await menu('Preguntas frecuentes'); await page.waitForTimeout(500); }],
    ['privacidad', async (page, menu) => { await menu('Privacidad y términos'); await page.waitForTimeout(500); }],
  ];

  for (const [account, screens] of [['demo-mype', SCREENS], ['demo-cliente', SCREENS.slice(0, 3)]]) {
    for (const [width, height] of [[1366, 900], [390, 844]]) {
      for (const theme of ['light', 'dark']) {
        const context = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce'});
        const page = await context.newPage();
        page.on('pageerror', error => { report.errores = [...(report.errores || []), String(error)]; });
        await login(page, account);
        await setTheme(page, theme);
        const menu = async label => {
          if (width < 760) await page.click('.panel-drawer-toggle');
          await page.locator('.panel-sidebar nav').getByRole('button', {name: new RegExp('^' + label)}).first().click();
          await page.waitForTimeout(300);
        };
        for (const [name, go] of screens) {
          try {
            await go(page, menu);
            await page.waitForTimeout(700);
            if (wanted && !wanted.has(name)) continue;
            const key = `${account}-${width}-${theme}-${name}`;
            report[key] = await measure(page);
            await page.screenshot({path: `${outDir}/${prefix}-${account === 'demo-mype' ? 'premium' : 'free'}-${width}-${theme === 'light' ? 'claro' : 'oscuro'}-${name}.png`, fullPage: true});
          } catch (error) {
            report[`${account}-${width}-${theme}-${name}`] = {fallo: String(error).slice(0, 200)};
          }
        }
        await context.close();
      }
    }
  }
  await browser.close();
  writeFileSync(path.join(outDir, `${prefix}-capturas.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 1).slice(0, 6000));
} finally {
  stop();
}
