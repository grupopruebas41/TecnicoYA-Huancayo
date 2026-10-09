import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const env = parseEnv(readFileSync(new URL('../infrastructure/.env.quality.local', import.meta.url), 'utf8'));
const project = 'tecnicoya-huancayo';
// Carpeta de salida opcional (por ejemplo docs/documentacion/evidencias/sprint-00/calidad/sonar).
const output = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(new URL('../docs/documentacion/evidencias/sprint-01/continuacion/sonar/', import.meta.url));
async function get(route, values = {}) {
  const response = await fetch(`http://127.0.0.1:9000/api/${route}?${new URLSearchParams(values)}`, {
    headers: {Authorization: `Basic ${Buffer.from(`admin:${env.SONAR_ADMIN_PASSWORD}`).toString('base64')}`},
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`${route}: HTTP ${response.status}`);
  return response.json();
}
try {
  if (!env.SONAR_ADMIN_PASSWORD) throw new Error('Primero inicializar la instancia local de calidad.');
  mkdirSync(output, {recursive: true});
  const gate = await get('qualitygates/project_status', {projectKey: project});
  const measures = await get('measures/component', {component: project,
    metricKeys: 'ncloc,bugs,vulnerabilities,code_smells,security_hotspots,coverage,duplicated_lines_density,sqale_index,alert_status,reliability_rating,security_rating,sqale_rating,'
      + 'new_coverage,new_duplicated_lines_density,new_reliability_rating,new_security_rating,new_maintainability_rating,new_security_hotspots_reviewed,new_lines',
  });
  const issues = [];
  for (let page = 1; ; page++) {
    const result = await get('issues/search', {componentKeys: project, ps: '500', p: String(page), resolved: 'false'});
    issues.push(...result.issues);
    const total = result.paging?.total ?? result.total;
    if (!Number.isInteger(total)) throw new Error('Respuesta de incidencias sin total válido.');
    if (issues.length >= total) break;
  }
  const hotspots = await get('hotspots/search', {projectKey: project, ps: '500'});
  // Sin autores ni asignados: pueden ser correos (DEF-17).
  for (const hotspot of hotspots.hotspots ?? []) { delete hotspot.author; delete hotspot.assignee; }
  const analyses = await get('project_analyses/search', {project, ps: '10'});
  for (const [name, data] of Object.entries({gate, measures, issues, hotspots, analyses})) {
    writeFileSync(`${output}/${name}.json`, JSON.stringify(data, null, 2) + '\n');
  }
  console.log(JSON.stringify({gate: gate.projectStatus, measures: measures.component.measures, issues: issues.length, hotspots: hotspots.paging.total}, null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
