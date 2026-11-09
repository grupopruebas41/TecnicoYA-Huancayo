import React from 'react';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import NotificationBell from './NotificationBell';
import {collapse, dayGroup, relativeTime} from './notificationView';
import {request} from '../administration/http';
// S05-TC-236 a 239 · Rediseño de la campana (Fase 4, modo rápido): encabezado, pestañas, contexto, tiempo relativo,
// grupos, agrupación de repetidos, abrir y marcar como leída, estado vacío y panel a pantalla completa en el celular.
vi.mock('../administration/http', () => ({request: vi.fn()}));
vi.mock('../realtime/Realtime', () => ({useRealtimeResource: () => {}}));

const NOW = new Date('2026-10-20T20:00:00Z'); // 15:00 en Lima
const ctx = id => ({request_id: id, order_id: 12, specialty: 'Cómputo', subcategories: ['Reparación de hardware'],
  label: `Pedido #12 · Solicitud #${id} · Cómputo · Reparación de hardware`});
const notice = (id, type, title, created, extra = {}) => ({id, type, title, body: 'Texto.', category: undefined,
  subject: {type: 'service_request', id: extra.request ?? 41}, context: ctx(extra.request ?? 41), created_at: created, read_at: extra.read ?? null});
const items = [
  notice(9, 'request.awaiting_choice', 'Elige a tu técnico', '2026-10-20T19:55:00Z'),
  notice(8, 'request.pending', 'Buscando técnicos disponibles', '2026-10-20T18:00:00Z'),
  notice(7, 'request.pending', 'Buscando técnicos disponibles', '2026-10-20T17:00:00Z'),
  notice(6, 'request.cancelled', 'Cancelaste la solicitud', '2026-10-19T15:00:00Z', {request: 40, read: '2026-10-19T16:00:00Z'}),
  notice(5, 'system.notice', 'Aviso del sistema', '2026-10-10T15:00:00Z', {request: 39, read: '2026-10-10T16:00:00Z'}),
];
beforeEach(() => { vi.useFakeTimers({toFake: ['Date']}); vi.setSystemTime(NOW); });
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.useRealTimers(); });

function routes(list = items, unread = 3) {
  request.mockImplementation(async (path, body, method) => {
    if (path.includes('state=unread')) return {data: {items: list.filter(item => !item.read_at), unread_count: unread}};
    if (path.startsWith('/notifications/') && path.endsWith('/read')) return {data: {}};
    if (path === '/notifications/read-all') return {data: {updated: unread}};
    return {data: {items: list, unread_count: unread}};
  });
}

test('S05-TC-236 el panel trae «N nuevas», marcar todas, pestañas Todas y No leídas, y Esc devuelve el foco a la campana', async () => {
  routes();
  render(<NotificationBell userId="5" onOpenAll={vi.fn()}/>);
  const bell = await screen.findByRole('button', {name: 'Notificaciones: 3 sin leer'});
  expect(screen.getByText('3 notificaciones sin leer')).toHaveAttribute('aria-live', 'polite');
  fireEvent.click(bell);
  const panel = screen.getByRole('region', {name: 'Notificaciones recientes'});
  expect(within(panel).getByRole('heading', {name: 'Notificaciones'})).toBeInTheDocument();
  expect(within(panel).getByText('3 nuevas')).toBeInTheDocument();
  expect(within(panel).getByRole('tab', {name: 'Todas'})).toHaveFocus();

  fireEvent.keyDown(within(panel).getByRole('tab', {name: 'Todas'}), {key: 'ArrowRight'});
  expect(within(panel).getByRole('tab', {name: 'No leídas'})).toHaveAttribute('aria-selected', 'true');
  await waitFor(() => expect(request).toHaveBeenCalledWith('/notifications?state=unread&per_page=20'));

  fireEvent.click(within(panel).getByRole('button', {name: 'Marcar todas como leídas'}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/notifications/read-all', {}));
  expect(within(panel).getByRole('button', {name: 'Ver todas las notificaciones'})).toHaveClass('notif-all');

  fireEvent.keyDown(panel, {key: 'Escape'});
  expect(screen.queryByRole('region', {name: 'Notificaciones recientes'})).not.toBeInTheDocument();
  expect(bell).toHaveFocus();
});

test('S05-TC-237 cada aviso muestra categoría con texto, contexto del pedido, tiempo relativo y «Nueva»; agrupa Hoy, Ayer y Anteriores', async () => {
  routes();
  render(<NotificationBell userId="5"/>);
  fireEvent.click(await screen.findByRole('button', {name: 'Notificaciones: 3 sin leer'}));
  const panel = screen.getByRole('region', {name: 'Notificaciones recientes'});

  expect(within(panel).getAllByRole('heading', {level: 3}).map(h => h.textContent)).toEqual(['Hoy', 'Ayer', 'Anteriores']);
  const rows = within(panel).getAllByRole('button').filter(b => b.classList.contains('notif-item'));
  // Los dos «Buscando técnicos disponibles» de la solicitud #41 se muestran como uno solo, el más reciente.
  expect(rows.map(row => row.querySelector('.notif-title').textContent))
    .toEqual(['Elige a tu técnico', 'Buscando técnicos disponibles', 'Cancelaste la solicitud', 'Aviso del sistema']);
  expect(rows[0]).toHaveAttribute('data-category', 'offer');
  expect(rows[0]).toHaveTextContent('Técnico · hace 5 min');
  expect(rows[0]).toHaveTextContent('Pedido #12 · Solicitud #41 · Cómputo · Reparación de hardware');
  expect(rows[0]).toHaveClass('is-unread');
  expect(within(rows[0]).getByText('Nueva')).toBeInTheDocument();
  expect(rows[1]).toHaveAttribute('data-category', 'search');
  expect(rows[1]).toHaveTextContent('Búsqueda de técnico · hace 2 h · 1 aviso anterior');
  expect(rows[2]).toHaveAttribute('data-category', 'cancel');
  expect(rows[2]).toHaveTextContent('Cancelación · ayer');
  expect(rows[2]).not.toHaveClass('is-unread');
  expect(within(rows[2]).queryByText('Nueva')).toBeNull();
  expect(rows[3]).toHaveTextContent('Sistema · hace 10 días');
});

test('S05-TC-238 abrir un aviso marca como leídos él y sus repetidos y lleva a su solicitud; sin avisos se ve el estado vacío', async () => {
  routes();
  const onOpen = vi.fn();
  render(<NotificationBell userId="5" onOpen={onOpen}/>);
  fireEvent.click(await screen.findByRole('button', {name: 'Notificaciones: 3 sin leer'}));
  fireEvent.click(screen.getByText('Buscando técnicos disponibles').closest('button'));
  await waitFor(() => expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({id: 8, context: expect.objectContaining({request_id: 41})})));
  expect(request).toHaveBeenCalledWith('/notifications/8/read', {}, 'POST');
  expect(request).toHaveBeenCalledWith('/notifications/7/read', {}, 'POST');
  expect(screen.queryByRole('region', {name: 'Notificaciones recientes'})).not.toBeInTheDocument();
  cleanup();

  routes([], 0);
  render(<NotificationBell userId="5"/>);
  fireEvent.click(await screen.findByRole('button', {name: 'Notificaciones: 0 sin leer'}));
  expect(screen.getByText('Estás al día, no tienes notificaciones nuevas')).toBeInTheDocument();
  expect(screen.getByRole('button', {name: 'Marcar todas como leídas'})).toBeDisabled();
});

test('S05-TC-239 tiempo relativo y grupos en hora de Lima, repetidos agrupados y panel con alto máximo y pantalla completa en el celular', () => {
  const now = NOW.getTime();
  expect(relativeTime('2026-10-20T19:59:40Z', now)).toBe('hace un momento');
  expect(relativeTime('2026-10-20T19:15:00Z', now)).toBe('hace 45 min');
  expect(relativeTime('2026-10-20T06:00:00Z', now)).toBe('hace 14 h'); // 01:00 en Lima, mismo día
  expect(relativeTime('2026-10-20T04:00:00Z', now)).toBe('ayer'); // 23:00 del 19 en Lima
  expect(dayGroup('2026-10-20T04:00:00Z', now)).toBe('Ayer');
  expect(dayGroup('2026-10-20T06:00:00Z', now)).toBe('Hoy');
  expect(dayGroup('2026-10-17T15:00:00Z', now)).toBe('Anteriores');
  const grouped = collapse(items);
  expect(grouped.map(item => item.id)).toEqual([9, 8, 6, 5]);
  expect(grouped[1].related.map(item => item.id)).toEqual([7]);

  const css = readFileSync(resolve('src/features/panel/panel.css'), 'utf8');
  expect(css).toMatch(/\.notif-panel \{[^}]*max-height: min\(640px/);
  expect(css).toMatch(/\.notif-body \{[^}]*overflow-y: auto/);
  expect(css).toMatch(/@media \(max-width: 760px\) \{\s*\.notif-panel \{[^}]*position: fixed[^}]*inset: 0[^}]*height: 100dvh/);
});
