import {afterEach, expect, test, vi} from 'vitest';
import {request} from './http';
afterEach(() => {vi.unstubAllGlobals(); document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';});
const json = (body, status = 200) => new Response(JSON.stringify(body), {status, headers: {'Content-Type': 'application/json'}});

test('S04-TC-104 complemento: autenticación nativa de Reverb conserva CSRF y sesión sin aceptar respuestas ilegibles de otros recursos', async () => {
  document.cookie = 'XSRF-TOKEN=token-sintetico; path=/';
  const fetch = vi.fn()
    .mockResolvedValueOnce(new Response(null, {status: 204}))
    .mockResolvedValueOnce(json({auth: 'firma-sintetica'}))
    .mockResolvedValueOnce(json({auth: 'firma-sintetica'}));
  vi.stubGlobal('fetch', fetch);
  await expect(request('/broadcasting/auth', {socket_id: '1.2', channel_name: 'private-technicians.7'}))
    .resolves.toEqual({data: {auth: 'firma-sintetica'}});
  expect(fetch.mock.calls[1][1]).toMatchObject({credentials: 'include', headers: {'X-XSRF-TOKEN': 'token-sintetico'}});
  await expect(request('/offers/7')).rejects.toMatchObject({status: 0});
});
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


test('S03-TC-076 complemento: Idempotency-Key atraviesa HTTP junto con CSRF y sesión', async () => {
  document.cookie = 'XSRF-TOKEN=token-sintetico; path=/';
  const fetch=vi.fn().mockResolvedValueOnce(new Response(null,{status:204})).mockResolvedValueOnce(json({data:{id:31,status:'sent'}},202));
  vi.stubGlobal('fetch',fetch);
  await request('/requests/31/submission',{expected_version:1,summary_confirmed:true},'POST',{headers:{'Idempotency-Key':'intento-sintetico'}});
  expect(fetch.mock.calls[1]).toEqual(['/api/v1/requests/31/submission',expect.objectContaining({credentials:'include',headers:expect.objectContaining({'Idempotency-Key':'intento-sintetico','X-XSRF-TOKEN':'token-sintetico'})})]);
});
