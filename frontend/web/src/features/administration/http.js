import {apiMessage} from './labels';
const origin = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, fields = {}, code) {
    super(message);
    this.status = status;
    this.fields = fields;
    this.code = code;
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
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(apiMessage(body?.error?.message || body?.message || statusMessage(response.status)), response.status, body?.error?.fields || body?.errors, body?.error?.code);
  // Un 200 ilegible no confirma una operación: consultamos el estado sin repetir la escritura.
  if (!body || typeof body !== 'object' || !('data' in body)) throw new ApiError('No pudimos confirmar el resultado. Revisa tu conexión y consulta el estado antes de repetir la operación.', 0);
  return body;
}

function statusMessage(status) {
  const messages = {
    401: 'Tu sesión no está activa. Inicia sesión nuevamente.',
    403: 'No tienes permiso para realizar esta acción.',
    409: 'La información cambió. Actualiza y vuelve a intentarlo.',
    419: 'Tu sesión venció. Actualiza la página e inicia sesión nuevamente.',
    422: 'Revisa los campos indicados.',
    429: 'Hay demasiados intentos. Espera antes de volver a intentarlo.',
  };
  return messages[status] || 'El servicio no está disponible. Inténtalo nuevamente más tarde.';
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
