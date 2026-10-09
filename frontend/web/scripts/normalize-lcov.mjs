import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {relative, resolve} from 'node:path';
const webRoot = fileURLToPath(new URL('../', import.meta.url));
const repoRoot = resolve(webRoot, '../..');
const report = resolve(webRoot, 'coverage/lcov.info');
const normalized = readFileSync(report, 'utf8').replace(/^SF:(.+)$/gm, (_, source) =>
  'SF:' + relative(repoRoot, resolve(webRoot, source.trim())).replaceAll('\\', '/'));
writeFileSync(report, normalized);
console.log('LCOV normalizado a rutas relativas del repositorio para SonarQube.');
