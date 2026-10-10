import {afterEach, expect, test, vi} from 'vitest';
import {request} from './http';
afterEach(() => {vi.unstubAllGlobals(); document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';});
const json = (body, status = 200) => new Response(JSON.stringify(body), {status, headers: {'Content-Type': 'application/json'}});
test('S01-TC-082 CSRF previo, cookie decodificada y sesión incluida; sin cookie no hay PATCH', async () => {
  document.cookie = 'XSRF-TOKEN=token%3Dseguro; path=/';
  const fetch = vi.fn().mockResolvedValueOnce(new Response(null, {status: 204})).mockResolvedValueOnce(json({data: {version: 2}}));
  vi.stubGlobal('fetch', fetch);
  await request('/me', {name: 'Cliente', expected_version: 1}, 'PATCH');
  expect(fetch.mock.calls[0][0]).toBe('/sanctum/csrf-cookie');
  expect(fetch.mock.calls[1]).toEqual(['/api/v1/me', expect.objectContaining({method: 'PATCH', credentials: 'include', headers: expect.objectContaining({'X-XSRF-TOKEN': 'token=seguro'})})]);
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
  fetch.mockClear().mockResolvedValue(new Response(null, {status: 204}));
  await expect(request('/me', {}, 'PATCH')).rejects.toMatchObject({status: 419, message: expect.stringContaining('sesión segura')});
  expect(fetch).toHaveBeenCalledTimes(1);
});
test('S01-TC-082 contrato: prioriza error.message, código y campos; red sin respuesta es incierta', async () => {
  const fetch = vi.fn().mockResolvedValueOnce(json({message: 'Forbidden', error: {code: 'SESSION_ACTIVE', message: 'Ya tienes una sesión activa.', fields: {email: ['Revisa el correo.']}}}, 403)).mockRejectedValueOnce(new TypeError('Failed to fetch'));
  vi.stubGlobal('fetch', fetch);
  await expect(request('/me')).rejects.toMatchObject({status: 403, code: 'SESSION_ACTIVE', message: 'Ya tienes una sesión activa.', fields: {email: ['Revisa el correo.']}});
  await expect(request('/me')).rejects.toMatchObject({status: 0, message: expect.stringContaining('No pudimos confirmar el resultado')});
});
