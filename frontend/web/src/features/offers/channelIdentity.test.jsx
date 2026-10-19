import React from 'react';
import {test, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, waitFor} from '@testing-library/react';
import OffersInbox from './OffersInbox';
import {request} from '../administration/http';
import {useRealtimeResource} from '../realtime/Realtime';

vi.mock('../administration/http', () => ({request: vi.fn()}));
vi.mock('../realtime/Realtime', async original => ({
  ...(await original()), useRealtimeResource: vi.fn(() => false),
}));
afterEach(() => {cleanup(); vi.clearAllMocks();});

test('S04-TC-104 complemento: el canal usa el perfil propio cuando /me no incluye su ID', async () => {
  request.mockImplementation(async path => path === '/technicians/me/profile'
    ? {data: {id: 7}}
    : {data: {items: []}, meta: {server_time: '2030-01-01T10:00:00Z'}});
  render(<OffersInbox />);
  await screen.findByText('No tienes ofertas pendientes ni aceptadas.');
  await waitFor(() => expect(useRealtimeResource).toHaveBeenCalledWith(
    'technicians.7', ['offer.created', 'offer.updated'], expect.any(Function), expect.any(Function),
  ));
  expect(useRealtimeResource.mock.calls.some(([name]) => name === 'technicians.undefined')).toBe(false);
});

test('S04-TC-104 complemento: si falla la identidad del canal conserva la bandeja HTTP y avisa desconexión', async () => {
  request.mockImplementation(async path => {
    if (path === '/technicians/me/profile') throw {status: 503};
    return {data: {items: []}, meta: {server_time: '2030-01-01T10:00:00Z'}};
  });
  render(<OffersInbox />);
  await screen.findByText('No tienes ofertas pendientes ni aceptadas.');
  expect(screen.getByRole('status')).toHaveTextContent('Sin conexión en tiempo real. Actualiza para ver cambios.');
  expect(useRealtimeResource.mock.calls.every(([name]) => name === null)).toBe(true);
});
