import React from 'react';
import {afterEach, expect, test, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import SessionForm from './SessionForm';
afterEach(() => {cleanup(); vi.unstubAllGlobals(); document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';});
const json = (body, status = 200) => new Response(JSON.stringify(body), {status});
function fillLogin() {
  fireEvent.change(screen.getByLabelText('Correo'), {target: {value: 'cliente@example.test'}});
  fireEvent.change(screen.getByLabelText('Contraseña'), {target: {value: 'Sintetica123!'}});
}
test('S01-TC-083 429 en español sin éxito y botón habilitado nuevamente', async () => {
  document.cookie = 'XSRF-TOKEN=synthetic; path=/';
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(null, {status: 204})).mockResolvedValueOnce(json({message: 'Too Many Attempts.'}, 429)));
  const onLogin = vi.fn(); render(<SessionForm onLogin={onLogin}/>); fillLogin();
  fireEvent.click(screen.getByRole('button', {name: 'Ingresar'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Hay demasiados intentos');
  expect(screen.getByRole('button', {name: 'Ingresar'})).toBeEnabled();
  expect(onLogin).not.toHaveBeenCalled();
});
// Registro en 2 pasos (D-80): el asistente carga el catálogo, por eso fetch responde según la URL.
function routedFetch(register) {
  return vi.fn(async (url, init) => {
    if (url.endsWith('/sanctum/csrf-cookie')) return new Response(null, {status: 204});
    if (url.endsWith('/catalog/districts')) return json({data: [{id: 1, code: 'HUANCAYO', name: 'Huancayo'}]});
    if (url.endsWith('/catalog/specialties')) return json({data: [{id: 10, code: 'computo', name: 'Cómputo'}]});
    if (url.endsWith('/auth/register')) return register(init);
    throw new Error('URL no simulada: ' + url);
  });
}
async function fillWizard(type) {
  fireEvent.click(document.querySelector('[data-cy=show-register]'));
  fireEvent.click(screen.getByRole('radio', {name: type === 'technician' ? /Soy técnico/ : /Necesito un técnico/}));
  fireEvent.click(screen.getByRole('button', {name: 'Continuar'}));
  await screen.findByRole('option', {name: 'Huancayo'});
  const set = (label, value) => fireEvent.change(screen.getByLabelText(label), {target: {value}});
  set('Nombres', 'Persona'); set('Apellidos', 'Sintética'); set('Correo', 'cliente@example.test'); set('Teléfono', '987654321');
  set('Contraseña', 'Sintetica123!'); set('Confirmar contraseña', 'Sintetica123!');
  if (type === 'technician') {
    set('Distrito base', '1'); set('Años de experiencia', '3');
    fireEvent.click(screen.getByRole('checkbox', {name: 'Cómputo'}));
  } else set('Distrito principal', '1');
  fireEvent.click(screen.getByRole('checkbox', {name: /Acepto los Términos/}));
  fireEvent.click(screen.getByRole('button', {name: 'Crear cuenta'}));
}
test('S01-TC-083 contrato D-43: registro rechazado por sesión activa conserva el formulario y no afirma creación', async () => {
  document.cookie = 'XSRF-TOKEN=synthetic; path=/';
  vi.stubGlobal('fetch', routedFetch(() => json({error: {code: 'SESSION_ACTIVE', message: 'Ya tienes una sesión activa. Cierra sesión para crear otra cuenta.'}}, 403)));
  const onLogin = vi.fn(); render(<SessionForm onLogin={onLogin}/>);
  await fillWizard('client');
  expect(await screen.findByRole('alert')).toHaveTextContent('Ya tienes una sesión activa');
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Nombres')).toHaveValue('Persona');
  expect(onLogin).not.toHaveBeenCalled();
});
test('S01-TC-072 [TC-003] complemento unitario: registro técnico sin client_type, creación confirmada sin iniciar sesión', async () => {
  document.cookie = 'XSRF-TOKEN=synthetic; path=/';
  const fetch = routedFetch(() => json({data: {id: '42', technician_profile: {verification_status: 'pending'}}}, 201));
  vi.stubGlobal('fetch', fetch);
  const onLogin = vi.fn(); render(<SessionForm onLogin={onLogin}/>);
  await fillWizard('technician');
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Cuenta creada correctamente'));
  const [, init] = fetch.mock.calls.find(([url]) => url.endsWith('/auth/register'));
  expect(JSON.parse(init.body)).not.toHaveProperty('client_type');
  expect(onLogin).not.toHaveBeenCalled();
});
