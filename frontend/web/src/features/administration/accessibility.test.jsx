import React from 'react';
import {afterEach, expect, test, vi} from 'vitest';
import {cleanup, render, screen} from '@testing-library/react';
import AccountApp from './AccountApp';
import Catalog from './Catalog';
import {request} from './http';
vi.mock('./http', () => ({request: vi.fn()}));
afterEach(() => {cleanup(); vi.resetAllMocks();});
const checkButtons = () => screen.getAllByRole('button').forEach(button => expect(['button', 'submit', 'reset']).toContain(button.getAttribute('type')));
test.each(['client', 'unknown'])('S01-TC-084 AccountApp: botones explícitos con rol %s', async role => {
  request.mockResolvedValue({data: {name: 'Cuenta sintética', role: {code: role}, version: 1}});
  render(<AccountApp/>);
  await screen.findByRole('button', {name: 'Cerrar sesión'}); checkButtons();
});
test('S01-TC-084 AccountApp: botones explícitos al fallar la sesión', async () => {
  request.mockRejectedValue({status: 0, message: 'No se pudo conectar.'});
  render(<AccountApp/>); await screen.findByRole('button', {name: 'Reintentar conexión'}); checkButtons();
});
test('S01-TC-084 Catalog: reintento con type explícito', async () => {
  request.mockRejectedValue({message: 'No se pudo conectar.'});
  render(<Catalog/>); await screen.findByRole('button', {name: 'Reintentar'}); checkButtons();
});
