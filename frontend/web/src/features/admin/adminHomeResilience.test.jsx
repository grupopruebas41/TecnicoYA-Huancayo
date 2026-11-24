// S07-TC-193 y 194 · DEF-83: un error de una parte del Inicio del administrador no tumba todo. Si el servidor informa una
// parte fallida (failed_parts) o una sección falla al dibujarse, esa sección dice «No pudimos cargar esta parte» con
// «Reintentar» y las demás se muestran.
import React from 'react';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import AdminHome from '../panel/AdminHome';
import {request} from '../administration/http';

vi.mock('../administration/http', () => ({request: vi.fn()}));

const items = Array.from({length: 30}, (_, index) => ({date: new Date(Date.UTC(2026, 10, 25) - (29 - index) * 86400000).toISOString().slice(0, 10),
  created: index === 29 ? 2 : 0, assigned: 0, cancelled: 0, expired: 0}));
const full = {
  kpis: {requests_today: 2, searching_now: 1, technicians_verified: 5, avg_assignment_minutes: 20, premium_clients: 1, iot_open_alerts: 0},
  series: {days: 30, items}, tasks: [{key: 'documents_to_review', section: 'verification', count: 1, limit: null}],
  recent_events: [], failed_parts: [], generated_at: '2026-11-25T15:00:00.000Z',
};

beforeEach(() => { document.documentElement.dataset.motion = 'reduce'; });
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.restoreAllMocks(); delete document.documentElement.dataset.motion; });

const open = () => render(<AdminHome navigate={vi.fn()} permissions={['dashboard.view']} user={{given_names: 'Ana'}}/>);

test('S07-TC-193 si el servidor informa que falló el gráfico, ese bloque se puede reintentar y el resto se muestra [DEF-83]', async () => {
  let calls = 0;
  request.mockImplementation(async () => {
    calls += 1;
    return {data: calls === 1 ? {...full, series: null, failed_parts: ['series']} : full};
  });
  open();

  const failed = await screen.findByRole('region', {name: 'Solicitudes por día'});
  expect(within(failed).getByText('No pudimos cargar esta parte.')).toBeInTheDocument();
  expect(within(failed).queryByRole('img')).not.toBeInTheDocument();
  // El resto del Inicio sí se ve.
  expect(screen.getByRole('region', {name: 'Indicadores'})).toBeInTheDocument();
  expect(within(screen.getByRole('region', {name: /Tareas pendientes/})).getByText('Documentos por revisar')).toBeInTheDocument();

  fireEvent.click(within(failed).getByRole('button', {name: 'Reintentar'}));
  await waitFor(() => expect(within(screen.getByRole('region', {name: 'Solicitudes por día'})).getByRole('img')).toBeInTheDocument());
  expect(calls).toBe(2);
});

test('S07-TC-194 si una sección falla al dibujarse, muestra su aviso con «Reintentar» y las demás siguen visibles [DEF-83]', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  // Tareas con una forma inesperada (no es una lista): su sección no puede dibujarse.
  request.mockResolvedValue({data: {...full, tasks: {inesperado: true}}});
  open();

  const tasks = await screen.findByRole('region', {name: /Tareas pendientes/});
  expect(within(tasks).getByText('No pudimos cargar esta parte.')).toBeInTheDocument();
  expect(within(tasks).getByRole('button', {name: 'Reintentar'})).toBeInTheDocument();
  expect(screen.getByRole('region', {name: 'Indicadores'})).toBeInTheDocument();
  expect(screen.getByRole('region', {name: 'Solicitudes por día'})).toBeInTheDocument();
  expect(screen.getByRole('region', {name: 'Actividad reciente'})).toBeInTheDocument();
});
