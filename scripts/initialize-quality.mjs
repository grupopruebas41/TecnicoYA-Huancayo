import {readFileSync, writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {parseEnv} from 'node:util';
import {fileURLToPath} from 'node:url';

const file = fileURLToPath(new URL('../infrastructure/.env.quality.local', import.meta.url));
const env = parseEnv(readFileSync(file, 'utf8'));
const origin = 'http://127.0.0.1:9000';
const key = 'tecnicoya-huancayo';
let password = env.SONAR_ADMIN_PASSWORD;
function save() {
  writeFileSync(file, Object.entries(env).map(([name, value]) => `${name}=${value}`).join('\n') + '\n');
}
async function post(route, values, credential = password) {
  const response = await fetch(`${origin}/api/${route}`, {
    method: 'POST', headers: {Authorization: `Basic ${Buffer.from(`admin:${credential}`).toString('base64')}`},
    body: new URLSearchParams(values), signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`SonarQube ${route}: HTTP ${response.status}. No se muestran datos de credenciales.`);
  return response.status === 204 ? {} : response.json();
}
try {
  const {status} = await (await fetch(`${origin}/api/system/status`)).json();
  if (status !== 'UP') throw new Error('SonarQube todavía no está disponible.');
  if (!password) {
    // Solo para la instalación local nueva de docker-compose.quality.yml.
    const next = `Aa1!${randomBytes(32).toString('base64url')}`;
    await post('users/change_password', {login: 'admin', previousPassword: 'admin', password: next}, 'admin');
    password = next; env.SONAR_ADMIN_PASSWORD = next; save();
  }
  const auth = {Authorization: `Basic ${Buffer.from(`admin:${password}`).toString('base64')}`};
  const project = await fetch(`${origin}/api/components/show?component=${key}`, {headers: auth});
  if (project.status === 404) await post('projects/create', {project: key, name: 'TecnicoYa Huancayo', visibility: 'private'});
  else if (!project.ok) throw new Error(`No se pudo comprobar el proyecto: HTTP ${project.status}.`);
  if (!env.SONAR_TOKEN) {
    const expirationDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const result = await post('user_tokens/generate', {
      name: `sprint01-${Date.now()}`, type: 'PROJECT_ANALYSIS_TOKEN', projectKey: key, expirationDate,
    });
    env.SONAR_TOKEN = result.token; save();
  }
  console.log('SonarQube local: contraseña inicial cambiada, proyecto privado y token limitado al análisis preparados.');
  console.log('Credenciales guardadas únicamente en infrastructure/.env.quality.local, ignorado por Git.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
