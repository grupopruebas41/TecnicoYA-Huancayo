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
  // Bloque B (D-83): comunicados creados desde la interfaz real con imágenes sintéticas dibujadas en el navegador.
  // Genially se responde con una página local: las capturas no salen a view.genially.com.
  const browser = await chromium.launch({executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe'), args: ['--renderer-process-limit=1', '--disable-gpu', '--disable-extensions', '--disable-background-networking']});
  const genially = route => route.fulfill({contentType: 'text/html; charset=utf-8', body: '<!doctype html><meta charset="utf-8"><body style="margin:0;display:grid;place-items:center;height:100vh;background:linear-gradient(120deg,#3b2a6b,#1f6f6b);color:#fff;font:600 28px system-ui">Presentación interactiva sintética</body>'});
  const banner = (page, {width, height, title, subtitle, colors}) => page.evaluate(({width, height, title, subtitle, colors}) => {
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const g = canvas.getContext('2d'); const gradient = g.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, colors[0]); gradient.addColorStop(1, colors[1]); g.fillStyle = gradient; g.fillRect(0, 0, width, height);
    g.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(width * (0.75 + i * 0.04), height * 0.5, height * (0.2 + i * 0.12), 0, 7); g.fill(); }
    g.fillStyle = '#ffffff'; g.font = `700 ${Math.round(height * 0.075)}px system-ui`; g.fillText(title, width * 0.14, height * 0.47);
    g.fillStyle = '#e8d3a3'; g.font = `500 ${Math.round(height * 0.04)}px system-ui`; g.fillText(subtitle, width * 0.14, height * 0.62);
    return canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
  }, {width, height, title, subtitle, colors}).then(data => Buffer.from(data, 'base64'));

  async function session(width, height, theme) {
    const context = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce'});
    await context.route('https://view.genially.com/**', genially);
    const page = await context.newPage();
    globalThis.debugPage = page;
    page.on('console', message => { if (message.type() === 'error') console.error('[consola]', message.text()); });
    page.on('pageerror', error => { report.errors = [...(report.errors || []), String(error)]; });
    return {context, page};
  }
  const login = async (page, role) => {
    await page.goto(web + '/#cuenta', {waitUntil: 'load', timeout: 90000}); await page.waitForSelector('[data-cy=login-email]', {timeout: 90000});
    await page.fill('[data-cy=login-email]', `e2e-${role}@example.test`);
    await page.fill('[data-cy=login-password]', password);
    await page.click('[data-cy=login-submit]');
    await page.waitForSelector(`[data-cy=portal-${role}]`);
    await page.waitForLoadState('networkidle');
  };
  const logout = async page => { await page.locator('[data-cy=logout]').evaluate(node => node.click()); await page.waitForSelector('[data-cy=login-submit]'); };
  const setTheme = async (page, theme) => {
    if (await page.evaluate(() => document.documentElement.dataset.theme) !== theme) {
      await page.click('.panel-avatar-button');
      await page.getByRole('menuitem', {name: /Tema/}).click();
      await page.waitForLoadState('networkidle');
    }
  };
  const nav = async (page, width, label) => {
    if (width < 760) await page.click('.panel-drawer-toggle');
    await page.locator('.panel-sidebar nav').getByRole('button', {name: label}).click();
    await page.waitForLoadState('networkidle');
  };
  const pick = async (page, label, file) => {
    await page.getByLabel(label, {exact: true}).setInputFiles({name: 'banner.jpg', mimeType: 'image/jpeg', buffer: file});
  };
  async function imageReady(page, text) {
    const done = page.getByText(text).or(page.locator('.image-slot [role=alert]')).first();
    await done.waitFor({timeout: 60000});
    const alert = page.locator('.image-slot [role=alert]');
    if (await alert.count()) throw new Error('Selector de imagen: ' + await alert.first().innerText());
  }
  async function fillCommon(page, {title, kind, alt, audience, link}) {
    await page.getByLabel('Título interno').fill(title);
    await page.getByRole('radiogroup', {name: 'Tipo'}).getByText(kind, {exact: true}).click();
    await page.getByLabel('Texto alternativo').fill(alt);
    await page.getByRole('radiogroup', {name: 'Audiencia'}).getByText(audience).click();
    if (link) { await page.getByLabel('Enlace (opcional)').fill(link[0]); await page.getByLabel('Etiqueta del botón').fill(link[1]); }
  }
  async function publish(page) {
    await page.getByRole('button', {name: 'Publicar', exact: true}).click();
    await page.getByText('Comunicado publicado.').waitFor();
  }

  // 1) Alta de los comunicados, una sola vez, desde el panel del administrador (escritorio, tema claro).
  {
    const {context, page} = await session(1366, 900, 'light');
    const shot = name => page.screenshot({path: `${outDir}/${prefix}-1366-light-${name}.png`, fullPage: false});
    await login(page, 'admin'); await setTheme(page, 'light'); await nav(page, 1366, 'Comunicados');
    await page.getByRole('button', {name: 'Crear comunicado'}).click();
    await shot('admin-editor-vacio');
    await pick(page, 'Imagen principal', await banner(page, {width: 2400, height: 1350, title: 'Mantenimiento preventivo −20 %', subtitle: 'Equipos de cómputo y refrigeración · hasta el 30 de noviembre', colors: ['#0f2a2e', '#1f6f6b']}));
    await page.getByRole('button', {name: 'Usar este recorte'}).waitFor();
    await page.getByLabel('Encuadre vertical').fill('0.45');
    await page.locator('.image-crop').scrollIntoViewIfNeeded();
    await shot('admin-editor-recorte');
    report.crop = await page.locator('.image-crop .muted').innerText();
    await page.getByRole('button', {name: 'Usar este recorte'}).click();
    await imageReady(page, 'Imagen lista: 1920 × 640 px.');
    await pick(page, 'Imagen móvil', await banner(page, {width: 1080, height: 720, title: 'Mantenimiento −20 %', subtitle: 'Hasta el 30 de noviembre', colors: ['#0f2a2e', '#1f6f6b']}));
    await imageReady(page, 'Imagen lista: 1080 × 720 px.');
    await fillCommon(page, {title: 'Campaña de mantenimiento preventivo', kind: 'Promoción', alt: 'Promoción: 20 % de descuento en mantenimiento preventivo de equipos de cómputo y refrigeración hasta el 30 de noviembre',
      audience: 'Ambos', link: ['https://example.test/promocion', 'Ver promoción']});
    await page.locator('.announcement-preview-pane').scrollIntoViewIfNeeded();
    await shot('admin-editor-escritorio');
    await page.getByRole('region', {name: 'Vista previa'}).getByRole('button', {name: 'Móvil'}).click();
    await shot('admin-editor-movil');
    await publish(page);

    await page.getByRole('button', {name: 'Crear comunicado'}).click();
    await pick(page, 'Imagen principal', await banner(page, {width: 1920, height: 640, title: 'Sorteo de herramientas', subtitle: 'Para técnicos verificados · participa hasta el 15 de noviembre', colors: ['#4a2f12', '#b8893b']}));
    await imageReady(page, 'Imagen lista: 1920 × 640 px.');
    await fillCommon(page, {title: 'Sorteo de herramientas para técnicos', kind: 'Sorteo', alt: 'Sorteo de un kit de herramientas para técnicos verificados; participa hasta el 15 de noviembre', audience: 'Solo técnicos'});
    await publish(page);

    await page.getByRole('button', {name: 'Crear comunicado'}).click();
    await page.getByRole('radiogroup', {name: 'Origen del comunicado'}).getByText('Genially', {exact: true}).click();
    await page.getByLabel('Enlace de Genially').fill('https://view.genially.com/66f1c2a0b3e4d5f6a7b8c9d0/novedades-noviembre');
    await pick(page, 'Imagen de portada', await banner(page, {width: 1920, height: 640, title: 'Novedades de noviembre', subtitle: 'Presentación interactiva', colors: ['#3b2a6b', '#1f6f6b']}));
    await imageReady(page, 'Imagen lista: 1920 × 640 px.');
    await fillCommon(page, {title: 'Novedades de noviembre (Genially)', kind: 'Novedad', alt: 'Presentación interactiva con las novedades de noviembre en TécnicoYa', audience: 'Solo clientes'});
    await page.locator('.announcement-preview-pane').scrollIntoViewIfNeeded();
    await shot('admin-editor-genially');
    await publish(page);

    // Programado: queda para mañana y en borrador otro, para ver las fases en el listado.
    await page.getByRole('button', {name: 'Crear comunicado'}).click();
    await pick(page, 'Imagen principal', await banner(page, {width: 1920, height: 640, title: 'Nuevo horario de atención', subtitle: 'Desde el lunes, de 7:00 a 21:00', colors: ['#13222a', '#5a6b70']}));
    await imageReady(page, 'Imagen lista: 1920 × 640 px.');
    await fillCommon(page, {title: 'Aviso de nuevo horario', kind: 'Aviso', alt: 'Aviso: desde el lunes atendemos de 7:00 a 21:00', audience: 'Ambos'});
    const tomorrow = await page.evaluate(() => { const d = new Date(Date.now() + 86400000); d.setSeconds(0, 0); const p = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; });
    await page.getByLabel('Inicio de vigencia').fill(tomorrow);
    await page.getByRole('button', {name: '2 semanas'}).click();
    await publish(page);
    await page.getByRole('button', {name: 'Crear comunicado'}).click();
    await pick(page, 'Imagen principal', await banner(page, {width: 1920, height: 640, title: 'Encuesta de satisfacción', subtitle: 'Borrador en preparación', colors: ['#1c4a4f', '#2e7d5b']}));
    await imageReady(page, 'Imagen lista: 1920 × 640 px.');
    await fillCommon(page, {title: 'Encuesta de satisfacción (borrador)', kind: 'Novedad', alt: 'Encuesta de satisfacción del servicio', audience: 'Solo clientes'});
    await page.getByRole('button', {name: 'Guardar borrador'}).click();
    await page.getByText('Borrador guardado.').waitFor();
    await context.close();
  }

  // 2) D-84: menú por estado, editor de un vigente, diálogo de eliminar y retirado con «Restaurar como borrador».
  const live = 'Campaña de mantenimiento preventivo';
  const draft = 'Encuesta de satisfacción (borrador)';
  const retiredTitle = 'Aviso E2E publicado';
  const images = page => page.waitForFunction(() => [...document.querySelectorAll('.announcement-card img')].every(i => i.complete && i.naturalWidth > 0));
  let retired = false;
  for (const [width, height, theme] of [[1366, 900, 'light'], [1366, 900, 'dark'], [390, 844, 'light']]) {
    const tag = `${width}-${theme}`;
    const {context, page} = await session(width, height, theme);
    const shot = name => page.screenshot({path: `${outDir}/${prefix}-${tag}-d84-${name}.png`});
    const overflow = async name => { report[`${tag}-${name}`] = {overflowX: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)}; };
    const list = async () => { await nav(page, width, 'Comunicados'); await page.waitForSelector('.announcement-card'); await images(page); };
    await login(page, 'admin'); await setTheme(page, theme); await list();
    if (!retired) {
      await page.getByRole('button', {name: `Acciones de «${retiredTitle}»`}).click();
      await page.getByRole('menuitem', {name: 'Retirar'}).click();
      await page.getByRole('button', {name: 'Confirmar'}).click();
      await page.getByText('Contenido retirado.').waitFor();
      retired = true;
    }
    await page.getByRole('button', {name: `Acciones de «${live}»`}).click();
    await page.getByText('Despublícalo antes de eliminarlo.').waitFor();
    await page.getByRole('menu').scrollIntoViewIfNeeded();
    await shot('menu-vigente'); await overflow('menu');
    await page.keyboard.press('Escape');

    await page.getByRole('button', {name: draft, exact: true}).click();
    await page.getByText('Los cambios se verán de inmediato en los paneles.').waitFor({state: 'detached', timeout: 1000}).catch(() => {});
    await page.getByRole('button', {name: '← Volver al listado'}).click();
    await page.waitForSelector('.announcement-card');
    await page.getByRole('button', {name: live, exact: true}).click();
    await page.getByText('Los cambios se verán de inmediato en los paneles.').waitFor();
    await page.waitForTimeout(400);
    await shot('editor-vigente'); await overflow('editor-vigente');
    await page.getByRole('button', {name: '← Volver al listado'}).click();
    await page.waitForSelector('.announcement-card'); await images(page);

    await page.getByRole('button', {name: `Acciones de «${draft}»`}).click();
    await page.getByRole('menuitem', {name: 'Eliminar'}).click();
    await page.getByLabel('Escribe ELIMINAR para confirmar').fill('ELIMINAR');
    await shot('dialogo-eliminar'); await overflow('dialogo');
    await page.getByRole('button', {name: 'Cancelar'}).click();

    await page.getByLabel('Mostrar retirados').check();
    await page.getByRole('button', {name: retiredTitle, exact: true}).click();
    await page.getByRole('button', {name: 'Restaurar como borrador'}).waitFor();
    await shot('editor-retirado'); await overflow('editor-retirado');
    await logout(page);
    await context.close();
  }
  await browser.close();
  writeFileSync(`${outDir}/${prefix}-d84-capturas.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(error);
  try { await globalThis.debugPage?.screenshot({path: `${outDir}/fallo.png`}); } catch {}
  process.exitCode = 1;
} finally { stop(); }
