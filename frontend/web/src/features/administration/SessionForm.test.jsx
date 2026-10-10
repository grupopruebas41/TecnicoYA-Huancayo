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
test('S01-TC-083 contrato D-43: registro rechazado por sesión activa conserva el formulario y no afirma creación', async () => {
  document.cookie = 'XSRF-TOKEN=synthetic; path=/';
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(null, {status: 204})).mockResolvedValueOnce(json({error: {code: 'SESSION_ACTIVE', message: 'Ya tienes una sesión activa. Cierra sesión para crear otra cuenta.'}}, 403)));
  const onLogin = vi.fn(); render(<SessionForm onLogin={onLogin}/>);
  fireEvent.click(document.querySelector('[data-cy=show-register]'));
  fillLogin();
  fireEvent.change(screen.getByLabelText('Nombre'), {target: {value: 'Cliente sintético'}});
  fireEvent.change(screen.getByLabelText('Confirmar contraseña'), {target: {value: 'Sintetica123!'}});
  fireEvent.click(screen.getByRole('button', {name: 'Registrarme'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Ya tienes una sesión activa');
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(onLogin).not.toHaveBeenCalled();
});
test('S01-TC-072 [TC-003] complemento unitario: registro técnico sin client_type, creación confirmada sin iniciar sesión', async () => {
  document.cookie = 'XSRF-TOKEN=synthetic; path=/';
  const fetch = vi.fn().mockResolvedValueOnce(new Response(null, {status: 204})).mockResolvedValueOnce(json({data: {id: '42', technician_profile: {verification_status: 'pending'}}}, 201));
  vi.stubGlobal('fetch', fetch);
  const onLogin = vi.fn(); render(<SessionForm onLogin={onLogin}/>);
  fireEvent.click(document.querySelector('[data-cy=show-register]'));
  fireEvent.change(screen.getByLabelText('Tipo de cuenta'), {target: {value: 'technician'}});
  fillLogin();
  fireEvent.change(screen.getByLabelText('Nombre'), {target: {value: 'Técnico sintético'}});
  fireEvent.change(screen.getByLabelText('Confirmar contraseña'), {target: {value: 'Sintetica123!'}});
  fireEvent.click(screen.getByRole('button', {name: 'Registrarme'}));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Cuenta creada correctamente'));
  expect(JSON.parse(fetch.mock.calls[1][1].body)).not.toHaveProperty('client_type');
  expect(onLogin).not.toHaveBeenCalled();
});
