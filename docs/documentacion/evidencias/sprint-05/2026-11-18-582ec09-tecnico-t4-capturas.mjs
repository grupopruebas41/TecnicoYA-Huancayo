// Capturas de la Fase T4 del panel del técnico (Perfil profesional, Servicios y tarifas, Portafolio, Verificación y
// Estadísticas) a 1366 y 390 px en tema claro, con la API real del slot A. Basado en el script de Mi agenda; repite el
// entorno de scripts/run-e2e.mjs sin Cypress. Datos sintéticos: cuentas e2e-*@example.test de Sprint05E2ESeeder, historia
// demo (DemoTechnicianActivity) e imágenes «antes» y «después» dibujadas en un canvas.
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
  // Historia demo de Rosa (últimos 30 días y meses anteriores) para las estadísticas.
  await tinker(`$t = ${technicianId('e2e-demo-rosa@example.test')}; $c = DB::table('client_profiles')->orderBy('id')->limit(2)->pluck('id')->map(fn ($i) => (int) $i)->all();`
    + "$a = app(implode(chr(92), ['Database', 'Seeders', 'DemoTechnicianActivity'])); $a->run($t, $c); $a->history($t, $c);", 'actividad');
  // Diego: verificación observada (el certificado no se lee) y perfil en espera de nueva revisión, para ver los otros estados.
  await tinker(`$t = ${technicianId('e2e-demo-diego@example.test')};`
    + "DB::table('technician_documents')->where('technician_id', $t)->where('document_type', 'like', 'Certificado%')->update(['review_status' => 'rejected', 'review_note' => 'La foto del certificado está borrosa; súbela otra vez con buena luz.']);"
    + "DB::table('technician_profiles')->where('id', $t)->update(['status' => 'pending_verification', 'verification_status' => 'rejected']);", 'observado');
  services.push(spawn(php, ['artisan', 'serve', '--host=127.0.0.1', '--port=8001', '--no-reload'], {cwd: backend, env, stdio: 'ignore', windowsHide: true}));
  services.push(spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host=127.0.0.1', '--port=5174', '--strictPort'], {cwd: frontend, env, stdio: 'ignore', windowsHide: true}));
  await ready(api + '/api/health');
  await ready(web);
  mkdirSync(outDir, {recursive: true});
  mkdirSync(tmpDir, {recursive: true});
  const browser = await chromium.launch({executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe'),
    args: ['--renderer-process-limit=1', '--disable-gpu', '--disable-extensions', '--disable-background-networking']});

  // Imágenes sintéticas «antes» y «después» (640×480) dibujadas en un canvas.
  const painter = await browser.newPage();
  for (const [name, dirty] of [['antes', true], ['despues', false]]) {
    const data = await painter.evaluate(isDirty => {
      const canvas = Object.assign(document.createElement('canvas'), {width: 640, height: 480});
      const g = canvas.getContext('2d');
      const sky = g.createLinearGradient(0, 0, 0, 480);
      sky.addColorStop(0, isDirty ? '#7d8a8f' : '#cfe8f3'); sky.addColorStop(1, isDirty ? '#4b5357' : '#8fc3d8');
      g.fillStyle = sky; g.fillRect(0, 0, 640, 480);
      g.fillStyle = isDirty ? '#3a3f42' : '#f4f7f8'; g.fillRect(140, 70, 360, 340);
      g.fillStyle = isDirty ? '#5d6468' : '#dff1f8'; g.fillRect(165, 95, 310, 200);
      g.strokeStyle = isDirty ? '#2a2e30' : '#5aa5c4'; g.lineWidth = 8; g.strokeRect(165, 95, 310, 200);
      for (let i = 0; i < 3; i++) { g.fillStyle = isDirty ? '#8a6a3d' : '#2f9e72'; g.fillRect(190 + i * 95, 320, 70, 60); }
      if (isDirty) { g.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 40; i++) g.fillRect(170 + (i * 37) % 300, 100 + (i * 53) % 190, 18, 10); }
      return canvas.toDataURL('image/png').split(',')[1];
    }, dirty);
    writeFileSync(path.join(tmpDir, `${name}.png`), Buffer.from(data, 'base64'));
  }
  await painter.close();
  writeFileSync(path.join(tmpDir, 'certificado.pdf'), '%PDF-1.4\n% Documento sintético de prueba, sin datos personales.\n%%EOF\n');

  const login = async (page, account) => {
    await page.goto(web + '/#cuenta', {waitUntil: 'load', timeout: 90000});
    await page.waitForSelector('[data-cy=login-email]', {timeout: 90000});
    await page.fill('[data-cy=login-email]', `${account}@example.test`);
    await page.fill('[data-cy=login-password]', password);
    await page.click('[data-cy=login-submit]');
    await page.waitForSelector('[data-cy=portal-technician]');
  };
  // Mediciones: sin desborde horizontal y sin controles nativos con el estilo gris del navegador.
  const measure = page => page.evaluate(() => {
    const main = document.querySelector('.panel-content') || document.body;
    const native = [...main.querySelectorAll('select, input[type=number], input[type=file]:not(.tech-file-input)')].filter(el => el.offsetParent)
      .filter(el => el.tagName !== 'SELECT' || getComputedStyle(el).appearance !== 'none');
    const wide = [...main.querySelectorAll('*')].filter(el => el.getBoundingClientRect().right > innerWidth + 1 && el.offsetParent
      && !el.closest('.tech-table-scroll')).map(el => el.className || el.tagName).slice(0, 5);
    return {overflowX: document.documentElement.scrollWidth > innerWidth, controlesNativos: native.length, fueraDeLaPantalla: wide,
      alertas: [...main.querySelectorAll('[role=alert], [role=status]')].map(el => el.textContent.trim()).filter(Boolean)};
  });
  for (const [width, height] of [[1366, 900], [390, 844]]) {
    const context = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce'});
    const page = await context.newPage();
    page.on('pageerror', error => { report.errors = [...(report.errors || []), String(error)]; });
    page.on('console', message => { if (message.type() === 'error') report.consola = [...(report.consola || []), message.text()]; });
    try {
    const shot = async (name, full = true) => {
      await page.waitForTimeout(600);
      report[`${width}-light-${name}`] = await measure(page);
      // Página larga: se agranda la ventana al alto del contenido (fullPage repetiría la barra fija en medio).
      const tall = full ? await page.evaluate(() => document.documentElement.scrollHeight) : height;
      if (tall > height) { await page.setViewportSize({width, height: tall}); await page.waitForTimeout(300); }
      await page.screenshot({path: `${outDir}/${prefix}-${width}-light-${name}.png`});
      if (tall > height) await page.setViewportSize({width, height});
    };
    const menu = async label => {
      if (width < 760) await page.click('.panel-drawer-toggle');
      await page.locator('.panel-sidebar nav').getByRole('button', {name: label}).first().click();
      await page.evaluate(() => window.scrollTo(0, 0));
    };
    const theme = () => page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });

    await login(page, 'e2e-demo-rosa');
    await theme();
    // Perfil profesional
    await menu('Perfil profesional');
    await page.getByRole('heading', {name: 'Sobre mí', level: 3}).waitFor();
    await shot('perfil');
    await page.getByLabel(/Qué garantía ofreces/).fill('Garantía de 30 días en la mano de obra y revisión gratis a la semana.');
    await page.getByRole('button', {name: 'Sumar un año a años de experiencia'}).click();
    await page.getByRole('button', {name: 'Guardar perfil'}).click();
    await page.getByText('Guardamos tu perfil profesional.').waitFor();
    await shot('perfil-guardado');
    // Servicios y tarifas
    await menu('Servicios y tarifas');
    await page.locator('.tech-service-name small').first().waitFor();
    await shot('servicios');
    await page.locator('.tech-service').first().getByRole('button', {name: /^Editar/}).click();
    await shot('servicios-editar');
    await page.getByRole('button', {name: 'Cancelar'}).first().click();
    await page.getByRole('button', {name: /Añadir servicio/}).click();
    await page.getByLabel('Buscar subcategoría').fill('mant');
    await shot('servicios-anadir');
    await page.getByRole('button', {name: 'Cerrar'}).click();
    // Portafolio: nuevo trabajo con antes y después, guardado, orden y confirmación de retiro.
    await menu('Portafolio');
    await page.getByRole('list', {name: /Tus trabajos/}).waitFor();
    await page.getByRole('button', {name: /Añadir trabajo/}).click();
    await page.getByLabel('Título del trabajo').fill(width < 760 ? 'Cámara de frío sin escarcha (sintético)' : 'Vitrina sin escarcha (sintético)');
    await page.getByTestId('drop-portfolio').setInputFiles(path.join(tmpDir, 'antes.png'));
    await page.getByLabel(/^Texto alternativo de la foto 1/).waitFor();
    await page.getByTestId('drop-portfolio').setInputFiles(path.join(tmpDir, 'despues.png'));
    await page.getByLabel(/^Texto alternativo de la foto 2/).waitFor();
    await page.getByRole('button', {name: 'Guardar trabajo'}).click();
    await shot('portafolio-alt-obligatorio');
    await page.getByLabel(/^Texto alternativo de la foto 1/).fill('Vitrina con escarcha y luces apagadas');
    await page.getByLabel(/^Texto alternativo de la foto 2/).fill('Vitrina limpia, iluminada y con productos');
    await shot('portafolio-nuevo');
    await page.getByRole('button', {name: 'Guardar trabajo'}).click();
    await page.getByText(/Añadimos «(Vitrina|Cámara de frío) sin escarcha/).waitFor();
    await shot('portafolio');
    await page.getByRole('button', {name: /^Bajar «(Vitrina|Cámara de frío) sin escarcha/}).first().click();
    await page.getByText(/Movimos «(Vitrina|Cámara de frío) sin escarcha/).waitFor();
    await shot('portafolio-orden');
    await page.getByRole('button', {name: /^Quitar «/}).first().click();
    await shot('portafolio-quitar', false);
    await page.getByRole('dialog').getByRole('button', {name: 'Cancelar'}).click();
    // Verificación: aprobada (coherente con el menú) y subida con progreso.
    await menu('Verificación');
    await page.getByRole('list', {name: 'Documentos obligatorios'}).waitFor();
    await shot('verificacion');
    await page.getByLabel(/^Tipo de documento/).selectOption('Otro documento de respaldo');
    await page.getByTestId('drop-document').setInputFiles(path.join(tmpDir, 'certificado.pdf'));
    await page.getByText('Archivo subido').waitFor();
    await page.locator('.tech-doc-upload').scrollIntoViewIfNeeded();
    await shot('verificacion-subida', false);
    await page.getByRole('button', {name: 'Adjuntar documento'}).click();
    await page.getByText(/Recibimos tu «Otro documento de respaldo»/).waitFor();
    await shot('verificacion-recibido');
    // Estadísticas por semana y por mes, y el detalle de una barra con el foco.
    await menu('Estadísticas');
    await page.locator('.tech-chart svg').first().waitFor();
    await shot('estadisticas-semana');
    await page.locator('.tech-chart-bucket').nth(7).focus();
    await page.locator('.tech-charts').scrollIntoViewIfNeeded();
    await shot('estadisticas-detalle', false);
    await page.getByRole('tab', {name: 'Por mes'}).click();
    await page.locator('caption', {hasText: 'Datos por mes'}).waitFor({state: 'attached'});
    await shot('estadisticas-mes');
    if (width < 760) { await page.click('.panel-drawer-toggle'); await shot('menu', false); await page.keyboard.press('Escape'); }
    else await shot('menu', false);
    } catch (failure) {
      await page.screenshot({path: path.join(tmpDir, `fallo-${width}.png`), fullPage: true});
      console.log(JSON.stringify(report, null, 2));
      throw failure;
    }
    await context.close();

    // Diego: verificación observada con la nota del revisor.
    const second = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce'});
    const other = await second.newPage();
    other.on('pageerror', error => { report.errors = [...(report.errors || []), String(error)]; });
    await login(other, 'e2e-demo-diego');
    await other.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
    if (width < 760) await other.click('.panel-drawer-toggle');
    await other.locator('.panel-sidebar nav').getByRole('button', {name: 'Verificación'}).first().click();
    await other.getByRole('list', {name: 'Documentos obligatorios'}).waitFor();
    await other.waitForTimeout(600);
    report[`${width}-light-verificacion-observado`] = await measure(other);
    const tall = await other.evaluate(() => document.documentElement.scrollHeight);
    await other.setViewportSize({width, height: Math.max(height, tall)});
    await other.waitForTimeout(300);
    await other.screenshot({path: `${outDir}/${prefix}-${width}-light-verificacion-observado.png`});
    await second.close();
  }
  await browser.close();
  writeFileSync(path.join(outDir, `${prefix}-capturas.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  stop();
}
