// Resumen legible de `npm audit --json` para el log de la CI (D-110). Es informativo: nunca falla el job.
// Muestra cuántos avisos hay por gravedad y qué paquetes los traen (directos o transitivos), con su GHSA.
// Uso: node scripts/resumen-npm-audit.mjs <npm-audit.json>
// Si existe GITHUB_STEP_SUMMARY, agrega la misma tabla al resumen del job.
import {appendFileSync, readFileSync} from 'node:fs';

const file = process.argv[2];
let report;
try {
  report = JSON.parse(readFileSync(file, 'utf8'));
} catch (error) {
  console.log(`No se pudo leer el informe de npm audit (${file}): ${error.message}`);
  process.exit(0);
}

const order = ['critical', 'high', 'moderate', 'low', 'info'];
const totals = report.metadata?.vulnerabilities ?? {};
const packages = Object.values(report.vulnerabilities ?? {})
  .sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity) || a.name.localeCompare(b.name));
const advisories = pkg => [...new Set(pkg.via.filter(via => typeof via === 'object')
  .map(via => via.url?.split('/').pop() || via.title))];
const origin = pkg => (pkg.via.some(via => typeof via === 'object') ? 'aviso propio' : `por ${pkg.via.join(', ')}`);

const total = totals.total ?? packages.length;
const counts = order.filter(level => totals[level]).map(level => `${totals[level]} ${level}`).join(', ') || 'ninguno';
const lines = [`npm audit completo (informativo, no bloquea): ${total} paquetes con avisos (${counts}).`];
for (const pkg of packages) {
  const ids = advisories(pkg);
  lines.push(`- ${pkg.name} · ${pkg.severity} · ${pkg.isDirect ? 'directo' : 'transitivo'} · ${pkg.range} · ${ids.length ? ids.join(', ') : origin(pkg)}`);
}
console.log(lines.join('\n'));

if (process.env.GITHUB_STEP_SUMMARY) {
  const table = ['### npm audit completo (informativo, D-110)', '', `${total} paquetes con avisos (${counts}).`, ''];
  if (packages.length) {
    table.push('| Paquete | Gravedad | Tipo | Rango | Aviso u origen |', '|---|---|---|---|---|');
    for (const pkg of packages) {
      const ids = advisories(pkg);
      table.push(`| ${pkg.name} | ${pkg.severity} | ${pkg.isDirect ? 'directo' : 'transitivo'} | \`${pkg.range}\` | ${ids.length ? ids.join(', ') : origin(pkg)} |`);
    }
  }
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, table.join('\n') + '\n');
}
