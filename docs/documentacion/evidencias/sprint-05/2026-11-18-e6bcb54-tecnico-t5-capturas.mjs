// Capturas de la Fase T5 del panel del técnico (bienvenida, tutorial de 5 pasos, Primeros pasos, Avisos, modo simple y
// texto al 150 % en Mi agenda) a 1366 y 390 px en tema claro, con la API real del slot A. Basado en el script de la T4.
// e2e-technician-nuevo es el equivalente E2E de demo-tecnico-pendiente (primera visita). Datos sintéticos.
// Uso: node <script> <repo> <outDir> <prefix> <tmpDir>
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
  // Oferta abierta para e2e-technician-frio (oferta en vivo en modo simple) e historia demo para su Inicio.
  await run(['artisan', 'tecnicoya:e2e', 'open-round', 'e2e-technician-frio@example.test', '--no-ansi'], 'oferta');
  services.push(spawn(php, ['artisan', 'serve', '--host=127.0.0.1', '--port=8001', '--no-reload'], {cwd: backend, env, stdio: 'ignore', windowsHide: true}));
  services.push(spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host=127.0.0.1', '--port=5174', '--strictPort'], {cwd: frontend, env, stdio: 'ignore', windowsHide: true}));
  await ready(api + '/api/health');
  await ready(web);
  mkdirSync(outDir, {recursive: true});
  const browser = await chromium.launch({executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe'),
    args: ['--renderer-process-limit=1', '--disable-gpu', '--disable-extensions', '--disable-background-networking']});
  const login = async (page, account) => {
    await page.goto(web + '/#cuenta', {waitUntil: 'load', timeout: 90000});
    await page.waitForSelector('[data-cy=login-email]', {timeout: 90000});
    await page.fill('[data-cy=login-email]', `${account}@example.test`);
    await page.fill('[data-cy=login-password]', password);
    await page.click('[data-cy=login-submit]');
    await page.waitForSelector('[data-cy=portal-technician]');
    await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
  };
  // Mediciones: desborde horizontal, burbuja del tutorial dentro de la pantalla y controles de menos de 44 px.
  const measure = page => page.evaluate(() => {
    const bubble = document.querySelector('.tour-bubble')?.getBoundingClientRect();
    const small = [...document.querySelectorAll('.panel-shell button, .panel-shell a[href], .welcome-dialog button, .tour-bubble button, .account-panel button, .account-panel input[role=switch]')]
      .filter(el => el.offsetParent !== null && !el.closest('[hidden]'))
      .map(el => ({el, box: el.getBoundingClientRect()}))
      .filter(({el, box}) => box.width > 0 && (box.height < 43.5 || box.width < 43.5) && el.getAttribute('role') !== 'switch' && !el.closest('.tech-week-cell'))
      .map(({el, box}) => `${(el.getAttribute('aria-label') || el.textContent || el.className).trim().slice(0, 40)} (${Math.round(box.width)}×${Math.round(box.height)})`);
    return {overflowX: document.documentElement.scrollWidth > innerWidth,
      burbujaDentro: bubble ? bubble.left >= 0 && bubble.top >= 0 && bubble.right <= innerWidth && bubble.bottom <= innerHeight : null,
      menosDe44: [...new Set(small)].slice(0, 12)};
  });
  for (const [width, height] of [[1366, 900], [390, 844]]) {
    const context = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce'});
    const page = await context.newPage();
    page.on('pageerror', error => { report.errors = [...(report.errors || []), String(error)]; });
    const shot = async name => {
      await page.waitForTimeout(700);
      report[`${width}-light-${name}`] = await measure(page);
      await page.screenshot({path: `${outDir}/${prefix}-${width}-light-${name}.png`});
    };
    const menu = async label => {
      if (width < 760) await page.click('.panel-drawer-toggle');
      await page.locator('.panel-sidebar nav').getByRole('button', {name: label}).first().click();
      await page.evaluate(() => window.scrollTo(0, 0));
    };

    // 1. Técnico nuevo: bienvenida, tutorial de 5 pasos y «Primeros pasos». La siembra se repite entre anchos.
    if (width < 760) await run(['artisan', 'db:seed', '--class=Sprint05E2ESeeder', '--force', '--no-ansi'], 'seed-390');
    await login(page, 'e2e-technician-nuevo');
    await page.getByRole('dialog', {name: '¿Cómo prefieres usar TécnicoYa?'}).waitFor();
    await shot('bienvenida');
    await page.getByRole('button', {name: /Avisos de ofertas más notorios/}).click();
    await shot('bienvenida-elegida');
    await page.getByRole('button', {name: 'Guardar y continuar'}).click();
    for (let step = 1; step <= 5; step += 1) {
      await page.getByText(`Paso ${step} de 5`).waitFor();
      await shot(`tutorial-paso-${step}`);
      await page.locator('.tour-bubble').getByRole('button', {name: step === 5 ? 'Terminar' : 'Siguiente'}).click();
    }
    await page.locator('.tour-bubble').waitFor({state: 'detached'});
    if (width < 760) await page.keyboard.press('Escape');
    await menu('Inicio');
    await page.locator('.tech-first-steps').waitFor();
    await shot('inicio-primeros-pasos');
    // Avisos: la bienvenida dejó sonido, vibración y destello encendidos; «Probar el aviso» muestra el destello.
    await page.locator('.panel-avatar-button').click();
    await page.getByRole('tab', {name: 'Avisos'}).click();
    await page.getByRole('switch', {name: /Leer la oferta/}).click();
    await page.getByText('Guardamos tus avisos de ofertas.').waitFor();
    await shot('cuenta-avisos');
    await page.getByRole('button', {name: 'Probar el aviso'}).click();
    await page.locator('.tech-offer-flash').waitFor();
    await shot('cuenta-avisos-probar');
    await page.keyboard.press('Escape');
    // Ayuda › Cómo funciona con «Ver el tutorial otra vez».
    await menu('Cómo funciona');
    await page.getByRole('button', {name: /Ver el tutorial otra vez/}).waitFor();
    await shot('como-funciona');
    await context.close();

    // 2. Técnico con oferta abierta: modo simple (Aceptar y Rechazar extragrandes) y «Leer la oferta en voz alta».
    const second = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce'});
    const other = await second.newPage();
    other.on('pageerror', error => { report.errors = [...(report.errors || []), String(error)]; });
    const otherShot = async name => {
      await other.waitForTimeout(700);
      report[`${width}-light-${name}`] = await measure(other);
      await other.screenshot({path: `${outDir}/${prefix}-${width}-light-${name}.png`});
    };
    await login(other, 'e2e-technician-frio');
    await other.locator('.panel-a11y-button').click();
    await other.getByRole('button', {name: /Más ajustes|Más opciones|accesibilidad/i}).last().click();
    // El ajuste queda en la cuenta entre anchos: solo se enciende si está apagado.
    const simple = other.getByRole('switch', {name: /Modo simple/});
    if (!(await simple.isChecked())) await simple.click();
    await other.keyboard.press('Escape');
    await other.evaluate(() => window.scrollTo(0, 0));
    await other.locator('.offer-spotlight').first().waitFor();
    await other.locator('.offer-spotlight').first().scrollIntoViewIfNeeded();
    await otherShot('oferta-modo-simple');
    // WCAG: Mi agenda con texto al 150 % (el rótulo «Mañana» ya no se corta en el celular).
    await other.evaluate(() => { document.documentElement.dataset.textSize = '150'; });
    if (width < 760) await other.click('.panel-drawer-toggle');
    await other.locator('.panel-sidebar nav').getByRole('button', {name: 'Mi agenda'}).first().click();
    await other.locator('.tech-week').first().waitFor();
    report[`${width}-light-agenda-texto150-franjas`] = await other.evaluate(() => [...document.querySelectorAll('.tech-week-franja strong')]
      .map(el => ({texto: el.textContent, cortado: el.scrollWidth > el.clientWidth + 1 || el.getBoundingClientRect().right > el.parentElement.getBoundingClientRect().right + 1})));
    await other.locator('.tech-week').first().scrollIntoViewIfNeeded();
    await otherShot('agenda-texto150');
    await second.close();
  }
  await browser.close();
  writeFileSync(path.join(outDir, `${prefix}-capturas.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  stop();
}
