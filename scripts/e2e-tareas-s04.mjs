// Tareas de Cypress del Sprint 4 (contrato S4 §9) para registrar con cy.task en la configuración E2E:
//
//   import {tareasSprint04} from '../../scripts/e2e-tareas-s04.mjs';
//   setupNodeEvents(on) { on('task', tareasSprint04()); }
//
//   cy.task('serverClock', '+10m')      adelanta el reloj del SERVIDOR del slot (cy.clock solo mueve el del navegador)
//   cy.task('serverClock', 'reset')     vuelve a la hora real (conviene en un after/afterEach de cada spec)
//   cy.task('runJobs')                  barrido del scheduler y cola vaciada una vez
//   cy.task('openRoundFor', 'e2e-technician-electro@example.test')  ronda dirigida a ese técnico (tiempo real)
//
// Solo funcionan dentro de node scripts/run-e2e.mjs: el arrancador pone TECNICOYA_E2E_CLOCK=1, APP_ENV=testing, la base
// del slot y las rutas de PHP y del backend. Detrás está `php artisan tecnicoya:e2e`, que también exige la base aislada.
import {spawnSync} from 'node:child_process';

function artisan(args) {
  const {TECNICOYA_PHP: php, TECNICOYA_BACKEND: backend, TECNICOYA_E2E_CLOCK: clock} = process.env;
  if (clock !== '1' || !php || !backend) {
    throw new Error('Tareas E2E del S4 disponibles solo con node scripts/run-e2e.mjs --sprint 04.');
  }
  const result = spawnSync(php, ['artisan', 'tecnicoya:e2e', ...args, '--no-ansi'], {cwd: backend, env: process.env, encoding: 'utf8', windowsHide: true});
  if (result.status !== 0) {
    throw new Error(`tecnicoya:e2e ${args.join(' ')} falló: ${(result.stderr || result.stdout || '').trim().slice(0, 500)}`);
  }
  const lines = result.stdout.trim().split(/\r?\n/);
  return JSON.parse(lines[lines.length - 1]);
}

export function tareasSprint04() {
  return {
    serverClock: change => artisan(['clock', String(change ?? 'reset')]),
    runJobs: () => artisan(['jobs']),
    openRoundFor: email => artisan(['open-round', String(email)]),
  };
}
