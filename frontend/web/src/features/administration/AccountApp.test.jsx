import React from 'react';
import {afterEach, expect, test, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import AccountApp from './AccountApp';
import {request} from './http';
// Estas pruebas aíslan sesión/RBAC; los módulos S2 se prueban por separado.
vi.mock('./Sprint02Portal', () => ({default: () => null}));
// Desde la Fase 1 del panel (D-73) el admin monta Catálogo, Verificación y Comunicados como secciones propias.
vi.mock('./CatalogAdmin', () => ({default: () => null}));
vi.mock('./VerificationAdmin', () => ({default: () => null}));
vi.mock('./AnnouncementsAdmin', () => ({default: () => null}));
vi.mock('./http', () => ({request: vi.fn()}));
afterEach(() => {cleanup(); vi.resetAllMocks(); window.history.replaceState(null, '', '/');});
// Comprobaciones unitarias complementarias: no sustituyen ni acreditan los casos Cypress.
test.each([['S01-TC-016', 'client', 'cliente'], ['S01-TC-017', 'technician', 'tecnico'], ['S01-TC-018', 'admin', 'administrador']])('%s [TC-005] complemento unitario: portal %s desde identidad del servidor', async (id, role, route) => {
  window.history.replaceState(null, '', '/#cuenta/administrador');
  request.mockResolvedValueOnce({data: {id: '1', name: 'Cuenta sintética', role: {code: role}, version: 1, permissions: ['catalog.manage'], technician_profile: {verification_status: 'pending'}}});
  render(<AccountApp/>);
  await screen.findByRole('button', {name: 'Cerrar sesión'});
  await waitFor(() => expect(window.location.hash).toBe(`#cuenta/${route}`));
  expect(document.querySelector(`[data-cy=portal-${role}]`)).toBeInTheDocument();
  if (role === 'technician') expect(screen.getByText(/Estado de verificación:/)).toHaveTextContent('Pendiente de verificación');
  request.mockResolvedValueOnce(null);
  fireEvent.click(screen.getByRole('button', {name: 'Cerrar sesión'}));
  await screen.findByRole('button', {name: 'Ingresar'});
  expect(window.location.hash).toBe('#cuenta');
  expect(screen.queryByText('Cuenta sintética')).not.toBeInTheDocument();
});
test('S01-TC-077 complemento unitario: ruta protegida anónima regresa al acceso', async () => {
  window.history.replaceState(null, '', '/#cuenta/administrador');
  request.mockRejectedValue({status: 401, message: 'Tu sesión no está activa.'});
  render(<AccountApp/>);
  await screen.findByRole('button', {name: 'Ingresar'});
  expect(window.location.hash).toBe('#cuenta');
  expect(document.querySelector('[data-cy=portal-admin]')).not.toBeInTheDocument();
});
test('S01-TC-076 complemento unitario: login consulta /me y logout incierto reconcilia sin falso éxito', async () => {
  request.mockRejectedValueOnce({status: 401}).mockResolvedValueOnce({data: {}})
    .mockResolvedValueOnce({data: {id: '1', name: 'Cliente sintético', version: 1, role: {code: 'client'}}});
  render(<AccountApp/>); await screen.findByRole('button', {name: 'Ingresar'});
  fireEvent.change(screen.getByLabelText('Correo'), {target: {value: 'cliente@example.test'}});
  fireEvent.change(screen.getByLabelText('Contraseña'), {target: {value: 'Sintetica123!'}});
  fireEvent.click(screen.getByRole('button', {name: 'Ingresar'}));
  await screen.findByRole('button', {name: 'Cerrar sesión'});
  request.mockRejectedValueOnce({status: 0, message: 'No pudimos confirmar el resultado.'}).mockRejectedValueOnce({status: 401});
  fireEvent.click(screen.getByRole('button', {name: 'Cerrar sesión'}));
  await screen.findByRole('button', {name: 'Ingresar'});
  expect(screen.getByRole('alert')).toHaveTextContent('No pudimos confirmar el resultado');
});
