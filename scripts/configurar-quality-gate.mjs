// Crea o actualiza el Quality Gate «TecnicoYa», lo asigna al proyecto y fija el periodo de
// código nuevo. Idempotente: se puede repetir sin duplicar condiciones.
//
//   node scripts/configurar-quality-gate.mjs
//
// Lee la contraseña de administración de infrastructure/.env.quality.local (ignorado por Git)
// y nunca la imprime. Ver docs/documentacion/calidad/QUALITY-GATE.md.
import {readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';

const env = parseEnv(readFileSync(new URL('../infrastructure/.env.quality.local', import.meta.url), 'utf8'));
const origin = 'http://127.0.0.1:9000';
const project = 'tecnicoya-huancayo';
const gateName = 'TecnicoYa';
const auth = {Authorization: `Basic ${Buffer.from(`admin:${env.SONAR_ADMIN_PASSWORD ?? ''}`).toString('base64')}`};

// Condiciones sobre código nuevo. SonarQube solo ofrece «menor que» (LT) y «mayor que» (GT),
// y falla la condición cuando el valor la cumple. Calificaciones: 1 = A, 2 = B…
const CONDICIONES = [
  {metric: 'new_coverage', op: 'LT', error: '70'},
  {metric: 'new_duplicated_lines_density', op: 'GT', error: '3'},
  {metric: 'new_reliability_rating', op: 'GT', error: '1'},
  {metric: 'new_security_rating', op: 'GT', error: '1'},
  {metric: 'new_maintainability_rating', op: 'GT', error: '1'},
  {metric: 'new_security_hotspots_reviewed', op: 'LT', error: '100'},
];

async function api(method, route, values = {}) {
  const query = new URLSearchParams(values);
  const response = await fetch(`${origin}/api/${route}${method === 'GET' ? `?${query}` : ''}`, {
    method, headers: auth, body: method === 'GET' ? undefined : query, signal: AbortSignal.timeout(30000),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`SonarQube ${route}: HTTP ${response.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

try {
  if (!env.SONAR_ADMIN_PASSWORD) throw new Error('Primero inicializar la instancia (scripts/initialize-quality.mjs).');
  const {qualitygates} = await api('GET', 'qualitygates/list');
  if (!qualitygates.some(gate => gate.name === gateName)) await api('POST', 'qualitygates/create', {name: gateName});

  const {conditions = []} = await api('GET', 'qualitygates/show', {name: gateName});
  for (const wanted of CONDICIONES) {
    const current = conditions.find(condition => condition.metric === wanted.metric);
    if (!current) await api('POST', 'qualitygates/create_condition', {gateName, ...wanted});
    else if (current.op !== wanted.op || current.error !== wanted.error) {
      await api('POST', 'qualitygates/update_condition', {id: current.id, ...wanted});
    }
  }
  for (const extra of conditions.filter(c => !CONDICIONES.some(w => w.metric === c.metric))) {
    await api('POST', 'qualitygates/delete_condition', {id: extra.id});
  }

  await api('POST', 'qualitygates/select', {gateName, projectKey: project});
  // Código nuevo = cambios desde el último análisis con otra sonar.projectVersion (ver QUALITY-GATE.md).
  await api('POST', 'new_code_periods/set', {project, type: 'PREVIOUS_VERSION'});

  const final = await api('GET', 'qualitygates/show', {name: gateName});
  const assigned = await api('GET', 'qualitygates/get_by_project', {project});
  const period = await api('GET', 'new_code_periods/show', {project});
  console.log(JSON.stringify({
    gate: final.name,
    asignadoAlProyecto: assigned.qualityGate?.name,
    condiciones: final.conditions.map(({metric, op, error}) => ({metric, op, error})),
    periodoCodigoNuevo: {type: period.type, value: period.value ?? null, inherited: period.inherited ?? false},
  }, null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
