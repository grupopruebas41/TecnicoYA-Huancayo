// Capturas de la revisión del #63: etiquetas del menú (técnico, cliente y administrador) a 1366 y 390 px, en tema claro
// y oscuro, con texto al 100 % y al 150 %, y el menú contraído. Mide que ninguna etiqueta se salga del menú ni quede bajo la
// barra, que la letra mida 12 px o más y que el texto del ítem no se corte. Basado en el script de la T5. Datos sintéticos.
// Uso: node <script> <repo> <outDir> <prefix>
import {spawn, spawnSync} from 'node:child_process';
import {readFileSync, writeFileSync, mkdirSync, openSync, closeSync, writeSync, unlinkSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {parseEnv} from 'node:util';
import {createRequire} from 'node:module';
import path from 'node:path';

const [root, outDir, prefix, tmpDir] = process.argv.slice(2);
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
const tinker = (code, label) => run(['artisan', 'tinker', '--execute=' + code, '--no-ansi'], label);
const technicianId = email => `(int) DB::table('technician_profiles as t')->join('users as u', 'u.id', '=', 't.user_id')->where('u.email', '${email}')->value('t.id')`;

const report = {};
try {
  if (env.DB_DATABASE !== 'tecnicoya_testing') throw new Error('base no permitida');
  await run(['artisan', 'migrate:fresh', '--force', '--no-ansi'], 'migrate');
  await run(['artisan', 'db:seed', '--class=Sprint05E2ESeeder', '--force', '--no-ansi'], 'seed');
  // Todas las cuentas ya vieron la bienvenida y el tutorial; e2e-technician-nuevo sube su DNI (en revisión): el menú dice «Falta 1».
  await tinker(`app(Database\\Seeders\\DemoSeeder::class)->verificationDocuments(${technicianId('e2e-technician-nuevo@example.test')}, `
    + `(int) DB::table('users')->where('email', 'e2e-technician-nuevo@example.test')->value('id'), 'pending', ['identity']); `
    + `DB::table('users')->update(['onboarding_completed_at' => now(), 'tour_completed_at' => now()]);`, 'documento');
  services.push(spawn(php, ['artisan', 'serve', '--host=127.0.0.1', '--port=8001', '--no-reload'], {cwd: backend, env, stdio: 'ignore', windowsHide: true}));
  services.push(spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host=127.0.0.1', '--port=5174', '--strictPort'], {cwd: frontend, env, stdio: 'ignore', windowsHide: true}));
  await ready(api + '/api/health');
  await ready(web);
  mkdirSync(outDir, {recursive: true});
  const browser = await chromium.launch({executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe'),
    args: ['--renderer-process-limit=1', '--disable-gpu', '--disable-extensions', '--disable-background-networking']});

  // Mediciones del menú: cada etiqueta dentro del área visible del menú (sin contar la barra), letra de 12 px o más,
  // texto del ítem sin cortar y, contraído, el punto dentro del ítem.
  const measure = page => page.evaluate(() => {
    const sidebar = document.querySelector('.panel-sidebar');
    const box = sidebar.getBoundingClientRect();
    const inner = box.left + sidebar.clientLeft + sidebar.clientWidth;
    const items = [...sidebar.querySelectorAll('.panel-nav-item')].filter(item => item.querySelector('.panel-nav-badge'));
    return {
      barraReservada: getComputedStyle(sidebar).scrollbarGutter,
      etiquetas: items.map(item => {
        const badge = item.querySelector('.panel-nav-badge').getBoundingClientRect();
        const label = item.querySelector('.panel-label');
        const style = getComputedStyle(item.querySelector('.panel-nav-badge'));
        return {item: label.textContent.trim(), texto: item.querySelector('.panel-nav-badge').textContent.trim(),
          title: item.querySelector('.panel-nav-badge').getAttribute('title'),
          dentro: badge.left >= box.left - 0.5 && badge.right <= inner + 0.5 && badge.right <= item.getBoundingClientRect().right + 0.5,
          letraPx: parseFloat(style.fontSize), textoCortado: label.scrollWidth > label.clientWidth + 1 && getComputedStyle(label).position !== 'absolute'};
      }),
      desborde: document.documentElement.scrollWidth > innerWidth,
      // Si hay desborde, los elementos visibles que pasan del borde derecho (fuera del menú).
      quienDesborda: document.documentElement.scrollWidth > innerWidth ? [...document.querySelectorAll('.panel-main *')]
        .filter(el => el.getBoundingClientRect().right > innerWidth + 1 && el.offsetParent !== null)
        .slice(0, 6).map(el => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} (${Math.round(el.getBoundingClientRect().right)})`) : []};
  });
  const accounts = [['tecnico', 'e2e-technician-nuevo'], ['tecnico-aprobado', 'e2e-technician-frio'], ['cliente', 'e2e-client-limit'], ['admin', 'e2e-admin']];
  for (const [width, height] of [[1366, 900], [390, 844]]) {
    for (const theme of ['light', 'dark']) {
      for (const text of ['100', '150']) {
        for (const [role, account] of accounts) {
          // El técnico va en las 8 combinaciones; el aprobado, el cliente y el administrador, en claro al 150 % y oscuro al 100 %.
          if (role !== 'tecnico' && !((theme === 'light' && text === '150') || (theme === 'dark' && text === '100'))) continue;
          const context = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce', colorScheme: theme});
          const page = await context.newPage();
          page.on('pageerror', error => { report.errors = [...(report.errors || []), String(error)]; });
          await page.goto(web + '/#cuenta', {waitUntil: 'load', timeout: 90000});
          await page.waitForSelector('[data-cy=login-email]', {timeout: 90000});
          await page.fill('[data-cy=login-email]', `${account}@example.test`);
          await page.fill('[data-cy=login-password]', password);
          await page.click('[data-cy=login-submit]');
          await page.waitForSelector('[data-cy^=portal-] .panel-sidebar', {state: 'attached'});
          await page.evaluate(([t, s]) => { document.documentElement.dataset.theme = t; document.documentElement.dataset.textSize = s; }, [theme, text]);
          // El menú contraído se guarda en la cuenta: cada captura empieza con el menú expandido.
          if (width > 760 && await page.locator('.panel-shell.is-collapsed').count()) {
            await page.click('.panel-brand-toggle');
            await page.waitForSelector('.panel-shell:not(.is-collapsed)');
          }
          if (width < 760) await page.click('.panel-drawer-toggle');
          await page.waitForFunction(() => document.querySelectorAll('.panel-nav-badge').length > 0, null, {timeout: 20000}).catch(() => {});
          await page.waitForTimeout(800);
          const name = `${width}-${theme}-texto${text}-menu-${role}`;
          report[name] = await measure(page);
          await page.screenshot({path: `${outDir}/${prefix}-${name}.png`});
          // Menú contraído (escritorio): punto de color sobre el ícono y el texto completo en el tooltip.
          if (width > 760 && role === 'tecnico' && text === '100') {
            await page.click('.panel-brand-toggle');
            await page.locator('.panel-nav-item[data-section="verification"]').hover();
            await page.waitForTimeout(500);
            report[`${width}-${theme}-menu-contraido`] = await page.evaluate(() => {
              const item = document.querySelector('.panel-nav-item[data-section="verification"]');
              const dot = item.querySelector('.panel-nav-badge').getBoundingClientRect();
              return {tooltip: item.dataset.tooltip, punto: [Math.round(dot.width), Math.round(dot.height)],
                dentro: dot.right <= item.getBoundingClientRect().right + 0.5};
            });
            await page.screenshot({path: `${outDir}/${prefix}-${width}-${theme}-menu-contraido.png`});
            const saved = page.waitForResponse(response => response.url().endsWith('/api/v1/me') && response.request().method() === 'PATCH').catch(() => {});
            await page.click('.panel-brand-toggle');
            await saved;
          }
          await context.close();
        }
      }
    }
  }
  await browser.close();
  writeFileSync(path.join(outDir, `${prefix}-capturas.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  stop();
}
