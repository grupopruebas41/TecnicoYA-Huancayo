// Resumen en Markdown de los JUnit de Cypress de un sprint (workflow e2e-cierre): totales y casos fallidos u omitidos.
//   node scripts/resumen-junit-cypress.mjs <carpeta> <NN>
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import path from 'node:path';

const [carpeta, sprint] = process.argv.slice(2);
const archivos = existsSync(carpeta) ? readdirSync(carpeta).filter(n => n.startsWith(`sprint-${sprint}-`) && n.endsWith('.xml')) : [];
const casos = [];
for (const archivo of archivos) {
  const xml = readFileSync(path.join(carpeta, archivo), 'utf8');
  for (const match of xml.matchAll(/<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g)) {
    const nombre = /name="([^"]*)"/.exec(match[1])?.[1] ?? '(sin nombre)';
    const cuerpo = match[3] ?? '';
    const estado = /<failure\b|<error\b/.test(cuerpo) ? 'falló' : /<skipped\b/.test(cuerpo) ? 'omitida' : 'aprobada';
    casos.push({nombre: nombre.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'), estado});
  }
}
const cuenta = estado => casos.filter(caso => caso.estado === estado).length;
console.log(`### Cypress S${sprint}`);
console.log(`- Archivos JUnit: ${archivos.length}`);
console.log(`- Casos: ${casos.length} · aprobados ${cuenta('aprobada')} · fallidos ${cuenta('falló')} · omitidos ${cuenta('omitida')}`);
for (const caso of casos.filter(caso => caso.estado !== 'aprobada')) console.log(`  - ${caso.estado}: ${caso.nombre}`);
