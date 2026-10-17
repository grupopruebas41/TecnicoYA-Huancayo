// Arrancador E2E por sprint y slot: migra y siembra la base aislada del slot, levanta
// Laravel y Vite en los puertos del slot y ejecuta Cypress contra ellos.
//
//   node scripts/run-e2e.mjs --sprint 01 [--slot A|B] [--browser chrome] [--junit]
//
// --junit: reporte JUnit en frontend/web/test-results/cypress/sprint-NN-*.xml (reporter junit
// incluido en Cypress) para scripts/contar-pruebas-sprint.mjs; reemplaza los del mismo sprint.
//
// Slot: --slot, si no la variable TECNICOYA_SLOT, si no la clave TECNICOYA_SLOT de
// backend/api/.env.testing, si no A. Ver docs/documentacion/sprints/ENTORNO-PARALELO.md.
//
// La salida de la API (una línea por petición) queda en tmp/e2e-api-<slot>.log para diagnosticar
// fallos de transporte (DEF-42). Se informa la RAM libre y, por debajo de 1 GB, se avisa.
//
// Desde el Sprint 4 (D-70) levanta además, por slot, Reverb (8081 en A, 8082 en B), la cola `database` y el
// scheduler, y activa el reloj del servidor de las tareas de Cypress (scripts/e2e-tareas-s04.mjs).
import {spawn, spawnSync} from 'node:child_process';
import {readFileSync, existsSync, mkdirSync, openSync, closeSync, writeSync, unlinkSync, readdirSync} from 'node:fs';
import {freemem} from 'node:os';
import {randomBytes} from 'node:crypto';
import {parseEnv, parseArgs} from 'node:util';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const SLOTS = {
  A: {database: 'tecnicoya_testing', api: 8001, web: 5174, reverb: 8081},
  B: {database: 'tecnicoya_b_testing', api: 8002, web: 5175, reverb: 8082},
};

const root = fileURLToPath(new URL('../', import.meta.url));
const backend = path.join(root, 'backend/api');
const frontend = path.join(root, 'frontend/web');
const php = process.env.PHP_BINARY || (process.platform === 'win32' ? 'C:/xampp/php/php.exe' : 'php');

const {values: options} = parseArgs({options: {
  sprint: {type: 'string'}, slot: {type: 'string'}, browser: {type: 'string'}, junit: {type: 'boolean', default: false},
}});
const sprint = (options.sprint || '').padStart(2, '0');
if (!/^0[1-8]$/.test(sprint)) {
  console.error('Uso: node scripts/run-e2e.mjs --sprint NN [--slot A|B]  (NN entre 01 y 08)');
  process.exit(2);
}

const fixture = parseEnv(readFileSync(path.join(backend, '.env.testing'), 'utf8'));
const slotName = (options.slot || process.env.TECNICOYA_SLOT || fixture.TECNICOYA_SLOT || 'A').toUpperCase();
const slot = SLOTS[slotName];
if (!slot) {
  console.error('Slot inválido: use A o B.');
  process.exit(2);
}

const apiUrl = `http://127.0.0.1:${slot.api}`;
const webUrl = `http://127.0.0.1:${slot.web}`;
const seeder = `Sprint${sprint}E2ESeeder`;
const specs = `cypress/e2e/sprint-${sprint}/**/*.cy.js`;

const env = {...process.env, ...fixture, TECNICOYA_SLOT: slotName, APP_ENV: 'testing', APP_DEBUG: 'false',
  APP_KEY: `base64:${randomBytes(32).toString('base64')}`, APP_URL: apiUrl,
  DB_CONNECTION: 'mysql', DB_HOST: '127.0.0.1', DB_PORT: '3306',
  DB_DATABASE: slot.database, DB_USERNAME: 'tecnicoya_test',
  SESSION_DRIVER: 'database', SESSION_COOKIE: `tecnicoya_e2e_${slotName.toLowerCase()}_session`, SESSION_DOMAIN: 'null',
  SESSION_SECURE_COOKIE: 'false', SESSION_HTTP_ONLY: 'true', CACHE_STORE: 'array',
  SANCTUM_STATEFUL_DOMAINS: `127.0.0.1:${slot.web}`, CORS_ALLOWED_ORIGINS: webUrl,
  VITE_API_URL: apiUrl, TECNICOYA_API_URL: apiUrl, TECNICOYA_WEB_URL: webUrl, TECNICOYA_E2E_SPECS: specs,
  TECNICOYA_E2E_PASSWORD: randomBytes(24).toString('base64url'),
};
// D-70: tiempo real, cola y reloj del servidor desde el Sprint 4. Credenciales de Reverb sintéticas por ejecución si
// .env.testing no trae las suyas; la SPA las recibe como VITE_REVERB_*.
const realtime = Number(sprint) >= 4;
if (realtime) {
  Object.assign(env, {
    QUEUE_CONNECTION: 'database', BROADCAST_CONNECTION: 'reverb',
    REVERB_APP_ID: fixture.REVERB_APP_ID || 'tecnicoya-e2e', REVERB_APP_KEY: fixture.REVERB_APP_KEY || randomBytes(12).toString('hex'),
    REVERB_APP_SECRET: fixture.REVERB_APP_SECRET || randomBytes(24).toString('hex'),
    REVERB_HOST: '127.0.0.1', REVERB_PORT: String(slot.reverb), REVERB_SCHEME: 'http',
    REVERB_SERVER_HOST: '127.0.0.1', REVERB_SERVER_PORT: String(slot.reverb),
    TECNICOYA_E2E_CLOCK: '1', TECNICOYA_PHP: php, TECNICOYA_BACKEND: backend,
  });
  Object.assign(env, {VITE_REVERB_APP_KEY: env.REVERB_APP_KEY, VITE_REVERB_HOST: '127.0.0.1', VITE_REVERB_PORT: String(slot.reverb), VITE_REVERB_SCHEME: 'http'});
}
// La terminal integrada de VS Code (y los agentes) exporta ELECTRON_RUN_AS_NODE=1: con ella
// Cypress.exe arranca como Node y muere con 0xC000001D. Ver DIAGNOSTICO-E2E-2026-10-09.md.
delete env.ELECTRON_RUN_AS_NODE;

// Los bloqueos viven en el tmp/ de la carpeta principal, compartido por todos los worktrees.
function sharedTmp() {
  const git = spawnSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {cwd: root, encoding: 'utf8', windowsHide: true});
  const common = git.status === 0 ? git.stdout.trim() : '';
  return path.join(common ? path.dirname(common) : root, 'tmp');
}
const tmp = sharedTmp();
mkdirSync(tmp, {recursive: true});

function alive(pid) {
  try { process.kill(pid, 0); return true; } catch (error) { return error.code === 'EPERM'; }
}
// Crea el archivo de bloqueo con el PID; retira un bloqueo huérfano de un proceso muerto.
function tryLock(file) {
  try {
    const fd = openSync(file, 'wx');
    writeSync(fd, String(process.pid));
    closeSync(fd);
    return true;
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const pid = Number.parseInt(readFileSync(file, 'utf8'), 10);
    if (Number.isInteger(pid) && alive(pid)) return false;
    unlinkSync(file);
    return tryLock(file);
  }
}
const held = [];
function release(file) {
  const index = held.indexOf(file);
  if (index === -1) return;
  held.splice(index, 1);
  try { unlinkSync(file); } catch {}
}
async function lockOrWait(file, label, minutes) {
  for (let waited = 0; ; waited += 5) {
    if (tryLock(file)) { held.push(file); return; }
    if (waited === 0) console.log(`Esperando: ${label} ocupado por otro proceso (máximo ${minutes} min).`);
    if (waited >= minutes * 60) throw new Error(`${label} sigue ocupado tras ${minutes} min.`);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

const services = [];
function command(binary, args, cwd, stdio = 'inherit') {
  return spawn(binary, args, {cwd, env, stdio, windowsHide: true});
}
function run(binary, args, cwd, label) {
  return new Promise((resolve, reject) => {
    const child = command(binary, args, cwd);
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${label} terminó con código ${code}.`)));
  });
}
async function waitReady(url) {
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(url, {signal: AbortSignal.timeout(1500)})).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`El servicio no respondió: ${url}`);
}
async function waitPort(port) {
  const {connect} = await import('node:net');
  for (let attempt = 0; attempt < 60; attempt++) {
    const open = await new Promise(resolve => {
      const socket = connect(port, '127.0.0.1', () => { socket.end(); resolve(true); });
      socket.once('error', () => resolve(false));
    });
    if (open) return;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Reverb no abrió el puerto ${port}.`);
}
async function ensurePortsFree() {
  const {createServer} = await import('node:net');
  for (const port of realtime ? [slot.api, slot.web, slot.reverb] : [slot.api, slot.web]) {
    await new Promise((resolve, reject) => {
      const server = createServer();
      server.once('error', () => reject(new Error(`Puerto ${port} ocupado; no se reutilizan servidores desconocidos.`)));
      server.listen(port, '127.0.0.1', () => server.close(resolve));
    });
  }
}
function stopServices() {
  for (const child of services.splice(0).reverse()) {
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {windowsHide: true, stdio: 'ignore'});
    else child.kill('SIGTERM');
  }
  for (const file of [...held]) release(file);
}
process.on('SIGINT', () => { stopServices(); process.exit(130); });
process.on('SIGTERM', () => { stopServices(); process.exit(143); });

try {
  if (!env.DB_PASSWORD) throw new Error('Falta DB_PASSWORD en backend/api/.env.testing.');
  if (existsSync(path.join(backend, 'bootstrap/cache/config.php'))) throw new Error('Configuración cacheada: retirarla antes de las pruebas aisladas.');
  if (!existsSync(path.join(backend, `database/seeders/${seeder}.php`))) throw new Error(`No existe el seeder E2E ${seeder}.`);
  if (!existsSync(path.join(frontend, `cypress/e2e/sprint-${sprint}`))) throw new Error(`No existe cypress/e2e/sprint-${sprint}.`);

  // Un slot no se usa dos veces a la vez, aunque sea desde otro worktree.
  if (!tryLock(path.join(tmp, `e2e-slot-${slotName}.lock`))) throw new Error(`El slot ${slotName} ya está en uso por otra ejecución E2E.`);
  held.push(path.join(tmp, `e2e-slot-${slotName}.lock`));
  await ensurePortsFree();
  console.log(`Sprint ${sprint}, slot ${slotName}: base ${slot.database}, API ${apiUrl}, web ${webUrl}. No ejecutar Pest de este slot hasta que termine.`);
  const freeMb = Math.round(freemem() / 1048576);
  console.log(`RAM libre: ${freeMb} MB.${freeMb < 1024 ? ' Aviso: DEF-42 (subidas sin respuesta en Chrome) se observó con poca memoria libre; si falla una subida, revisar tmp/e2e-api-' + slotName + '.log y repetir con más memoria.' : ''}`);

  await run(php, ['artisan', 'migrate', '--force', '--no-ansi'], backend, 'migrate');
  await run(php, ['artisan', 'db:seed', `--class=${seeder}`, '--force', '--no-ansi'], backend, seeder);
  const apiLog = openSync(path.join(tmp, `e2e-api-${slotName}.log`), 'w');
  services.push(command(php, ['artisan', 'serve', '--host=127.0.0.1', `--port=${slot.api}`, '--no-reload'], backend, ['ignore', apiLog, apiLog]));
  services.push(command(process.execPath, ['node_modules/vite/bin/vite.js', '--host=127.0.0.1', `--port=${slot.web}`, '--strictPort'], frontend, 'ignore'));
  if (realtime) {
    services.push(command(php, ['artisan', 'reverb:start', '--host=127.0.0.1', `--port=${slot.reverb}`, '--no-ansi'], backend, ['ignore', apiLog, apiLog]));
    services.push(command(php, ['artisan', 'queue:work', '--sleep=1', '--tries=1', '--no-ansi'], backend, ['ignore', apiLog, apiLog]));
    services.push(command(php, ['artisan', 'schedule:work', '--no-ansi'], backend, ['ignore', apiLog, apiLog]));
  }
  await waitReady(`${apiUrl}/api/health`);
  await waitReady(webUrl);
  if (realtime) await waitPort(slot.reverb);

  // Un único Cypress a la vez en todo el PC, sea cual sea el slot (memoria limitada).
  const cypressLock = path.join(tmp, 'e2e-cypress.lock');
  await lockOrWait(cypressLock, 'Cypress', 30);
  try {
    const reporte = [];
    if (options.junit) {
      const carpeta = path.join(frontend, 'test-results/cypress');
      mkdirSync(carpeta, {recursive: true});
      for (const viejo of readdirSync(carpeta).filter(n => n.startsWith(`sprint-${sprint}-`) && n.endsWith('.xml'))) unlinkSync(path.join(carpeta, viejo));
      reporte.push('--reporter', 'junit', '--reporter-options', `mochaFile=test-results/cypress/sprint-${sprint}-[hash].xml,toConsole=false`);
    }
    await run(process.execPath, ['node_modules/cypress/bin/cypress', 'run', '--e2e', '--browser', options.browser || process.env.E2E_BROWSER || 'chrome',
      '--config-file', 'cypress.e2e.config.js', ...reporte], frontend, 'Cypress');
  } finally {
    release(cypressLock);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  stopServices();
}
