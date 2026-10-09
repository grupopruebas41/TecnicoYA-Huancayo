// Envoltura de compatibilidad: las evidencias y REPRODUCIR.md del Sprint 1 citan este comando.
// Equivale a: node scripts/run-e2e.mjs --sprint 01 [argumentos adicionales, p. ej. --slot B]
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const runner = fileURLToPath(new URL('./run-e2e.mjs', import.meta.url));
const result = spawnSync(process.execPath, [runner, '--sprint', '01', ...process.argv.slice(2)], {stdio: 'inherit'});
process.exitCode = result.status ?? 1;
