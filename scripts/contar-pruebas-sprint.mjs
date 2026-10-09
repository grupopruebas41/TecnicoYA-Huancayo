// Cuenta los IDs de prueba aprobados por sprint y herramienta a partir de reportes JUnit
// y comprueba la meta de AGENTS.md (≥ 60 IDs por sprint: ≥ 36 Pest, ≥ 14 Cypress, ≥ 10 Vitest).
//
//   node scripts/contar-pruebas-sprint.mjs [--pest <xml>] [--vitest <xml>] [--cypress <xml|carpeta>]
//                                          [--sprint NN] [--json] [--estricto]
//
// Reportes predeterminados:
//   Pest    backend/api/test-results/junit.xml        (cd backend/api && composer test:junit)
//   Vitest  frontend/web/test-results/junit.xml       (cd frontend/web && npm test; reporter junit en vite.config.js)
//   Cypress frontend/web/test-results/cypress/*.xml   (node scripts/run-e2e.mjs --sprint NN --junit)
//
// IDs: SNN-TC-NNN (vigente). Durante la transición acepta TC-NNN y deduce el sprint con
// docs/documentacion/editables/plan-pruebas-v2/Matriz-Trazabilidad-TC.csv. Si una prueba
// tiene un ID SNN-TC-NNN, los [TC-0xx] de su descripción son referencias y no se cuentan.
// Por ID: «fallido» si alguna ejecución falla; «aprobado» si alguna pasa y ninguna falla;
// si no, «omitido».
import {readFileSync, existsSync, statSync, readdirSync} from 'node:fs';
import {parseArgs} from 'node:util';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const META = {total: 60, Pest: 36, Cypress: 14, Vitest: 10};
const HERRAMIENTAS = ['Pest', 'Cypress', 'Vitest'];

const {values: opciones} = parseArgs({options: {
  pest: {type: 'string', default: path.join(root, 'backend/api/test-results/junit.xml')},
  vitest: {type: 'string', default: path.join(root, 'frontend/web/test-results/junit.xml')},
  cypress: {type: 'string', default: path.join(root, 'frontend/web/test-results/cypress')},
  sprint: {type: 'string'},
  json: {type: 'boolean', default: false},
  estricto: {type: 'boolean', default: false},
}});

function sprintsDelCatalogo() {
  const archivo = path.join(root, 'docs/documentacion/editables/plan-pruebas-v2/Matriz-Trazabilidad-TC.csv');
  const mapa = new Map();
  if (!existsSync(archivo)) return mapa;
  for (const linea of readFileSync(archivo, 'utf8').replace(/^﻿/, '').split(/\r?\n/).slice(1)) {
    const [id, sprint] = linea.split(',');
    if (/^TC-\d{3}$/.test(id) && /^\d+$/.test(sprint)) mapa.set(id, sprint.padStart(2, '0'));
  }
  return mapa;
}
const catalogo = sprintsDelCatalogo();

function archivosJUnit(ruta) {
  if (!existsSync(ruta)) return [];
  if (statSync(ruta).isDirectory()) {
    return readdirSync(ruta).filter(nombre => nombre.endsWith('.xml')).map(nombre => path.join(ruta, nombre));
  }
  return [ruta];
}

const entidades = {'&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&amp;': '&'};
const decodificar = texto => texto
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(Number.parseInt(n, 16)))
  .replace(/&(lt|gt|quot|apos|amp);/g, e => entidades[e]);

function casos(xml) {
  const lista = [];
  const patron = /<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g;
  for (const [, atributos, cuerpo = ''] of xml.matchAll(patron)) {
    const nombre = decodificar((atributos.match(/\bname="([^"]*)"/) || [])[1] || '');
    const estado = /<(failure|error)\b/.test(cuerpo) ? 'fallido' : /<skipped\b/.test(cuerpo) ? 'omitido' : 'aprobado';
    lista.push({nombre, estado});
  }
  return lista;
}

function identificadores(nombre) {
  const vigentes = [...nombre.matchAll(/\bS(0[0-8])-TC-(\d{3})\b/g)].map(m => ({sprint: m[1], id: m[0], heredado: false}));
  if (vigentes.length) return vigentes;
  return [...nombre.matchAll(/(?<![\w-])TC-(\d{3})\b/g)]
    .map(m => ({sprint: catalogo.get(m[0]) || '??', id: m[0], heredado: true}));
}

// resultado[sprint][herramienta][id] = estado agregado
const resultado = {};
const sinId = Object.fromEntries(HERRAMIENTAS.map(h => [h, 0]));
const fuentes = {};
let heredados = 0;

const rutas = {Pest: opciones.pest, Vitest: opciones.vitest, Cypress: opciones.cypress};
for (const herramienta of HERRAMIENTAS) {
  const archivos = archivosJUnit(rutas[herramienta]);
  fuentes[herramienta] = archivos.length ? archivos.map(a => path.relative(root, a)) : `no encontrado (${path.relative(root, rutas[herramienta])})`;
  for (const archivo of archivos) {
    for (const caso of casos(readFileSync(archivo, 'utf8'))) {
      const ids = identificadores(caso.nombre);
      if (!ids.length) { sinId[herramienta]++; continue; }
      for (const {sprint, id, heredado} of ids) {
        if (heredado) heredados++;
        const porId = ((resultado[sprint] ??= {})[herramienta] ??= {});
        const previo = porId[id];
        porId[id] = previo === 'fallido' || caso.estado === 'fallido' ? 'fallido'
          : previo === 'aprobado' || caso.estado === 'aprobado' ? 'aprobado' : 'omitido';
      }
    }
  }
}

const filtro = opciones.sprint ? opciones.sprint.padStart(2, '0') : null;
const resumen = Object.keys(resultado).sort().filter(s => !filtro || s === filtro).map(sprint => {
  const porHerramienta = {};
  const aprobadosTotales = new Set();
  for (const herramienta of HERRAMIENTAS) {
    const ids = resultado[sprint][herramienta] || {};
    const contar = estado => Object.values(ids).filter(e => e === estado).length;
    porHerramienta[herramienta] = {aprobados: contar('aprobado'), fallidos: contar('fallido'), omitidos: contar('omitido'),
      fallidosIds: Object.keys(ids).filter(id => ids[id] === 'fallido').sort()};
    for (const [id, estado] of Object.entries(ids)) if (estado === 'aprobado') aprobadosTotales.add(id);
  }
  const cumple = aprobadosTotales.size >= META.total && HERRAMIENTAS.every(h => porHerramienta[h].aprobados >= META[h]);
  return {sprint, porHerramienta, aprobadosDistintos: aprobadosTotales.size, cumple};
});

if (opciones.json) {
  console.log(JSON.stringify({meta: META, fuentes, pruebasSinId: sinId, idsHeredados: heredados > 0, sprints: resumen}, null, 2));
} else {
  console.log('Reportes JUnit:');
  for (const herramienta of HERRAMIENTAS) {
    const fuente = fuentes[herramienta];
    console.log(`  ${herramienta.padEnd(8)}${Array.isArray(fuente) ? fuente.join(', ') : fuente}`);
  }
  console.log(`\nMeta por sprint: ≥ ${META.total} IDs aprobados distintos (Pest ≥ ${META.Pest}, Cypress ≥ ${META.Cypress}, Vitest ≥ ${META.Vitest}).`);
  console.log('Columnas por herramienta: aprobados / fallidos / omitidos (IDs distintos).\n');
  console.log('Sprint | Pest        | Cypress     | Vitest      | Aprobados | ¿Llega a 60?');
  console.log('-------|-------------|-------------|-------------|-----------|-------------');
  for (const fila of resumen) {
    const celda = h => {
      const {aprobados, fallidos, omitidos} = fila.porHerramienta[h];
      return `${aprobados} / ${fallidos} / ${omitidos}`.padEnd(11);
    };
    const faltan = HERRAMIENTAS.map(h => Math.max(0, META[h] - fila.porHerramienta[h].aprobados));
    const veredicto = fila.cumple ? 'Sí' : `No (faltan ${HERRAMIENTAS.map((h, i) => `${h} ${faltan[i]}`).join(', ')}; total ${Math.max(0, META.total - fila.aprobadosDistintos)})`;
    console.log(`S${fila.sprint.padEnd(5)} | ${celda('Pest')} | ${celda('Cypress')} | ${celda('Vitest')} | ${String(fila.aprobadosDistintos).padEnd(9)} | ${veredicto}`);
    for (const h of HERRAMIENTAS) {
      if (fila.porHerramienta[h].fallidosIds.length) console.log(`         ${h} fallidos: ${fila.porHerramienta[h].fallidosIds.join(', ')}`);
    }
  }
  if (!resumen.length) console.log('(sin IDs en los reportes)');
  console.log(`\nPruebas sin ID (no cuentan): ${HERRAMIENTAS.map(h => `${h} ${sinId[h]}`).join(', ')}.`);
  if (heredados) console.log('Aviso: hay IDs heredados TC-NNN (sprint deducido del catálogo). Renombrar a SNN-TC-NNN [TC-0xx] (AGENTS.md, regla 7).');
}

if (opciones.estricto && resumen.some(fila => !fila.cumple)) process.exitCode = 1;
