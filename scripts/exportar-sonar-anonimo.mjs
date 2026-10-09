// Genera un resumen de incidencias de SonarQube sin datos personales.
//
//   node scripts/exportar-sonar-anonimo.mjs <issues.json crudo> [salida.json]
//
// El exporte crudo (api/issues/search) incluye author/assignee (correos) y bloques de
// usuarios: NO se versiona (.gitignore). Este script copia solo una lista blanca de campos
// técnicos, anonimiza rutas de usuario y correos en los textos y aborta si queda alguno.
import {readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const [entrada, salida] = process.argv.slice(2);
if (!entrada) {
  console.error('Uso: node scripts/exportar-sonar-anonimo.mjs <issues.json> [salida.json]');
  process.exit(2);
}

const CORREO = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const RUTA_USUARIO = /([A-Za-z]:[\\/]+Users[\\/]+)[^\\/\s"']+/gi;
const limpiar = texto => typeof texto === 'string'
  ? texto.replace(CORREO, '[correo]').replace(RUTA_USUARIO, '$1<usuario>')
  : texto;

const crudo = JSON.parse(readFileSync(entrada, 'utf8'));
// Acepta la respuesta de api/issues/search ({issues: [...]}) o solo la lista de incidencias.
const incidencias = Array.isArray(crudo) ? crudo : Array.isArray(crudo.issues) ? crudo.issues : [];
if (incidencias.length === 0) {
  console.error('No se encontraron incidencias en el archivo de entrada.');
  process.exit(1);
}

// Lista blanca: nada de author, assignee, users, comments, changelog ni hashes.
const resumen = incidencias.map(issue => ({
  rule: issue.rule,
  type: issue.type,
  severity: issue.severity,
  impacts: (issue.impacts || []).map(({softwareQuality, severity}) => ({softwareQuality, severity})),
  cleanCodeAttribute: issue.cleanCodeAttribute,
  status: issue.issueStatus || issue.status,
  file: limpiar(String(issue.component || '').replace(/^[^:]+:/, '')),
  line: issue.line ?? issue.textRange?.startLine ?? null,
  message: limpiar(issue.message),
  effort: issue.effort,
  tags: issue.tags || [],
}));

const contar = clave => resumen.reduce((acc, item) => {
  const valor = typeof clave === 'function' ? clave(item) : item[clave];
  acc[valor] = (acc[valor] || 0) + 1;
  return acc;
}, {});

const documento = {
  fuente: path.basename(entrada),
  generado: new Date().toISOString(),
  nota: 'Resumen anonimizado: sin autores, asignados ni usuarios del exporte original.',
  total: resumen.length,
  porTipo: contar('type'),
  porSeveridad: contar('severity'),
  porRegla: contar('rule'),
  porArchivo: contar('file'),
  incidencias: resumen,
};

const texto = JSON.stringify(documento, null, 2);
if (CORREO.test(texto) || /Users[\\/]+(?!<usuario>)[^\\/\s"']+[\\/]/i.test(texto)) {
  console.error('Abortado: el resumen todavía contiene un correo o una ruta de usuario.');
  process.exit(1);
}
if (salida) writeFileSync(salida, `${texto}\n`, 'utf8');
else process.stdout.write(`${texto}\n`);
console.error(`Resumen anonimizado: ${resumen.length} incidencias${salida ? ` → ${salida}` : ''}.`);
