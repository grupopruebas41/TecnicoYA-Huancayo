import {spawn, spawnSync} from 'node:child_process';
import {readFileSync, existsSync, mkdirSync, openSync, closeSync, unlinkSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {parseEnv} from 'node:util';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const backend = path.join(root, 'backend/api');
const frontend = path.join(root, 'frontend/web');
const php = process.env.PHP_BINARY || (process.platform === 'win32' ? 'C:/xampp/php/php.exe' : 'php');
const fixture = parseEnv(readFileSync(path.join(backend, '.env.testing'), 'utf8'));
const env = {...process.env, ...fixture, APP_ENV: 'testing', APP_DEBUG: 'false',
  APP_KEY: `base64:${randomBytes(32).toString('base64')}`, APP_URL: 'http://127.0.0.1:8001',
  DB_CONNECTION: 'mysql', DB_HOST: '127.0.0.1', DB_PORT: '3306',
  DB_DATABASE: 'tecnicoya_testing', DB_USERNAME: 'tecnicoya_test',
  SESSION_DRIVER: 'database', SESSION_COOKIE: 'tecnicoya_sprint01_session', SESSION_DOMAIN: 'null',
  SESSION_SECURE_COOKIE: 'false', SESSION_HTTP_ONLY: 'true', CACHE_STORE: 'array',
  SANCTUM_STATEFUL_DOMAINS: '127.0.0.1:5174', CORS_ALLOWED_ORIGINS: 'http://127.0.0.1:5174',
  VITE_API_URL: 'http://127.0.0.1:8001', TECNICOYA_E2E_PASSWORD: randomBytes(24).toString('base64url'),
};
const services = [];
let lock;
const lockPath = path.join(root, 'tmp/sprint01-e2e.lock');
function command(binary, args, cwd, stdio = 'inherit') {
  return spawn(binary, args, {cwd, env, stdio, windowsHide: true});
}
function run(binary, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = command(binary, args, cwd);
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`El proceso terminó con código ${code}.`)));
  });
}
async function waitReady(url) {
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(url, {signal: AbortSignal.timeout(1500)})).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`El servicio no respondió: ${url}`);
}
async function ensurePortsFree() {
  const {createServer} = await import('node:net');
  for (const port of [8001, 5174]) {
    await new Promise((resolve, reject) => {
      const server = createServer();
      server.once('error', () => reject(new Error(`Puerto ${port} ocupado; no se reutilizan servidores desconocidos.`)));
      server.listen(port, '127.0.0.1', () => server.close(resolve));
    });
  }
}
function stopServices() {
  for (const child of services.reverse()) {
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {windowsHide: true, stdio: 'ignore'});
    else child.kill('SIGTERM');
  }
  if (lock !== undefined) { closeSync(lock); unlinkSync(lockPath); lock = undefined; }
}
process.on('SIGINT', () => { stopServices(); process.exit(130); });
process.on('SIGTERM', () => { stopServices(); process.exit(143); });
try {
  if (!env.DB_PASSWORD) throw new Error('Falta DB_PASSWORD en backend/api/.env.testing.');
  if (existsSync(path.join(backend, 'bootstrap/cache/config.php'))) throw new Error('Configuración cacheada: retirarla antes de las pruebas aisladas.');
  mkdirSync(path.join(root, 'tmp'), {recursive: true});
  lock = openSync(lockPath, 'wx');
  await ensurePortsFree();
  console.log('E2E usa exclusivamente tecnicoya_testing. No ejecutar Pest hasta que termine.');
  await run(php, ['artisan', 'migrate', '--force', '--no-ansi'], backend);
  await run(php, ['artisan', 'db:seed', '--class=Sprint01E2ESeeder', '--force', '--no-ansi'], backend);
  services.push(command(php, ['artisan', 'serve', '--host=127.0.0.1', '--port=8001', '--no-reload'], backend, 'ignore'));
  services.push(command(process.execPath, ['node_modules/vite/bin/vite.js', '--host=127.0.0.1', '--port=5174', '--strictPort'], frontend, 'ignore'));
  await waitReady('http://127.0.0.1:8001/api/health');
  await waitReady('http://127.0.0.1:5174');
  await run(process.execPath, ['node_modules/cypress/bin/cypress', 'run', '--e2e', '--browser', process.env.E2E_BROWSER || 'chrome', '--config-file', 'cypress.sprint01.config.js'], frontend);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally { stopServices(); }
