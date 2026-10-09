import {apiMessage} from './labels';
const origin = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, fields = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

async function send(path, options = {}) {
  let response;
  try {
    response = await fetch(`${origin}${path}`, {
      credentials: 'include', signal: AbortSignal.timeout(15000), ...options,
      headers: {Accept: 'application/json', ...options.headers},
    });
  } catch {
    throw new ApiError('No pudimos confirmar el resultado. Revisa tu conexión y consulta el estado antes de repetir la operación.', 0);
  }
  if (response.status === 204) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(apiMessage(body.message || body.error?.message || 'El servicio no está disponible.'), response.status, body.errors || body.error?.fields);
  return body;
}

export async function request(path, body, method = body ? 'POST' : 'GET') {
  const headers = {};
  if (!['GET', 'HEAD'].includes(method)) {
    await send('/sanctum/csrf-cookie');
    const cookie = document.cookie.split('; ').find(item => item.startsWith('XSRF-TOKEN='));
    if (!cookie) throw new ApiError('No se pudo preparar la sesión segura. Permite las cookies y vuelve a intentarlo.', 419);
    headers['X-XSRF-TOKEN'] = decodeURIComponent(cookie.slice('XSRF-TOKEN='.length));
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return send(`/api/v1${path}`, {method, headers, ...(body !== undefined ? {body: JSON.stringify(body)} : {})});
}
