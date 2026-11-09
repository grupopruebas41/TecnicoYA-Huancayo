import React from 'react';
import {afterEach, expect, test, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import AccountApp from './AccountApp';
import Catalog from './Catalog';
import {request} from './http';
// Estas pruebas aíslan sesión/RBAC; los módulos S2 se prueban por separado.
vi.mock('./Sprint02Portal', () => ({default: () => null}));
vi.mock('./http', () => ({request: vi.fn()}));
afterEach(() => {cleanup(); vi.resetAllMocks();});
// Fase 4 del panel final: en el portal del cliente «Cerrar sesión» está al pie del panel del avatar.
const logoutButton = async () => {
  await waitFor(() => expect(screen.queryByRole('button', {name: 'Cerrar sesión'}) || screen.queryByRole('button', {name: /^Cuenta de /})).not.toBeNull());
  if (!screen.queryByRole('button', {name: 'Cerrar sesión'})) fireEvent.click(screen.getByRole('button', {name: /^Cuenta de /}));
  return screen.getByRole('button', {name: 'Cerrar sesión'});
};
const checkButtons = () => screen.getAllByRole('button').forEach(button => expect(['button', 'submit', 'reset']).toContain(button.getAttribute('type')));
test.each(['client', 'unknown'])('S01-TC-084 AccountApp: botones explícitos con rol %s', async role => {
  request.mockResolvedValue({data: {name: 'Cuenta sintética', role: {code: role}, version: 1}});
  render(<AccountApp/>);
  await logoutButton(); checkButtons();
});
test('S01-TC-084 AccountApp: botones explícitos al fallar la sesión', async () => {
  request.mockRejectedValue({status: 0, message: 'No se pudo conectar.'});
  render(<AccountApp/>); await screen.findByRole('button', {name: 'Reintentar conexión'}); checkButtons();
});
test('S01-TC-084 Catalog: reintento con type explícito', async () => {
  request.mockRejectedValue({message: 'No se pudo conectar.'});
  render(<Catalog/>); await screen.findByRole('button', {name: 'Reintentar'}); checkButtons();
});


test('S01-TC-084 complemento: carga de sesión con salida semántica', () => {
  request.mockReturnValue(new Promise(() => {}));
  render(<AccountApp/>);
  expect(screen.getByRole('status').tagName).toBe('OUTPUT');
});
test('S01-TC-084 complemento: catálogo vacío con salida semántica', async () => {
  request.mockResolvedValue({data: []});
  render(<Catalog/>);
  expect((await screen.findByText('No hay especialidades disponibles.')).tagName).toBe('OUTPUT');
});
