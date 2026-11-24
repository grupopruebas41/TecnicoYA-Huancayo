// S07-TC-211 a 220 · Panel del administrador, Fase A3 (Operación): Solicitudes con detalle completo, intervención de D-116
// con las reglas de D-120 (motivo de 10 caracteres o más, confirmación, Idempotency-Key y versión), CSV de la vista
// filtrada; Emparejamiento en vivo con cuenta regresiva, indicador de conexión y respaldo de 30 s; Alertas operativas
// priorizadas con su acción directa.
import React from 'react';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import RequestsAdmin from './RequestsAdmin';
import AdmLive from './AdmLive';
import AdmAlerts from './AdmAlerts';
import {download, request} from '../administration/http';

let connected = false;
vi.mock('../administration/http', () => ({request: vi.fn(), download: vi.fn(), serverNow: () => Date.now()}));
vi.mock('../realtime/Realtime', () => ({useRealtimeResource: () => connected, RealtimeProvider: ({children}) => children}));

const NOW = '2026-11-25T15:00:00.000Z';
const item = (overrides = {}) => ({id: 41, status: 'sent', specialty: 'Electricidad', subcategory: 'Instalaciones residenciales', district: 'Chilca',
  client: 'Cliente Demo', technician: null, created_at: '2026-11-25T14:10:00.000Z', submitted_at: '2026-11-25T14:10:00.000Z', ...overrides});
const detail = (actions = {cancel: true, rematch: true}) => ({
  request: {...item(), version: 4, description: 'El tomacorriente chispea (sintético).', mode: 'asap', subcategories: ['Instalaciones residenciales', 'Tableros'],
    reference_fee: {amount: '65.00', currency: 'PEN'}, cancellation_reason: null},
  client: {id: 9, name: 'Cliente Demo', district: 'Chilca', plan: 'premium'}, technician: null,
  offers: {total: 2, pending: 1, accepted: 0, rejected: 1, expired: 0, withdrawn: 0},
  offer_list: [
    {id: 1, technician: {id: 3, name: 'Técnico Ocupado Demo'}, round_no: 1, search_generation: 1, status: 'rejected',
      available_at: '2026-11-25T14:20:00.000Z', expires_at: '2026-11-25T14:30:00.000Z', responded_at: '2026-11-25T14:21:35.000Z', response_seconds: 95},
    {id: 2, technician: {id: 4, name: 'Luz Demo'}, round_no: 1, search_generation: 1, status: 'pending',
      available_at: '2026-11-25T14:20:00.000Z', expires_at: '2026-11-25T14:30:00.000Z', responded_at: null, response_seconds: null},
  ],
  timeline: [{event_type: 'request.submitted', from_status: 'registered', to_status: 'sent', summary: 'Solicitud enviada.', actor: null, occurred_at: '2026-11-25T14:10:00.000Z'}],
  actions,
});
const live = () => ({
  server_time: NOW,
  searching: [{id: 41, status: 'sent', specialty: 'Electricidad', subcategory: 'Instalaciones residenciales', district: 'Chilca',
    submitted_at: '2026-11-25T14:10:00.000Z', pending_expires_at: null, round: {round_no: 1, status: 'open', opened_at: '2026-11-25T14:59:00.000Z', expires_at: '2026-11-25T15:08:00.000Z'},
    open_offers: [{id: 2, technician: {id: 4, name: 'Luz Demo'}, expires_at: '2026-11-25T15:08:00.000Z'}]}],
  pending: [{id: 43, status: 'pending_availability', specialty: 'Cómputo', subcategory: 'Hardware', district: 'Huancayo',
    submitted_at: '2026-11-24T16:00:00.000Z', pending_expires_at: '2026-11-25T18:20:00.000Z', round: null, open_offers: []}],
  expired_offers: [{id: 7, request_id: 40, subcategory: 'Tableros', technician: {id: 3, name: 'Técnico Ocupado Demo'}, expires_at: '2026-11-25T14:30:00.000Z'}],
});
const alerts = (overrides = {}) => ({available: true, generated_at: NOW, items: [
  {type: 'pending_expiring', priority: 1, request_id: 43, alert_id: null, minutes: 40, actions: ['open', 'rematch']},
  {type: 'unassigned', priority: 2, request_id: 41, alert_id: null, minutes: 90, actions: ['open', 'rematch']},
  {type: 'expired_chain', priority: 3, request_id: 40, alert_id: null, minutes: null, rounds: 2, actions: ['open']},
  {type: 'iot_unattended', priority: 4, request_id: null, alert_id: 8, minutes: 125, actions: ['iot']},
], ...overrides});

let routes;
beforeEach(() => {
  connected = false;
  document.documentElement.dataset.motion = 'reduce';
  vi.stubGlobal('crypto', {...globalThis.crypto, randomUUID: () => 'clave-sintetica'});
  routes = {
    'GET /admin/requests': () => ({data: {items: [item(), item({id: 42, status: 'assigned', technician: {id: 4, name: 'Luz Demo'}})], page: 1, per_page: 20, total: 2}}),
    'GET /admin/requests/41': () => ({data: detail()}),
    'GET /catalog/districts': () => ({data: [{id: 1, name: 'Chilca'}]}),
    'GET /catalog/specialties': () => ({data: [{id: 1, name: 'Electricidad'}]}),
    'GET /admin/matching/live': () => ({data: live()}),
    'GET /admin/alerts': () => ({data: alerts()}),
  };
  request.mockImplementation(async (path, body, method = body ? 'POST' : 'GET') => {
    const key = `${method} ${path.split('?')[0]}`;
    if (routes[key]) return routes[key](body, path);
    return {data: []};
  });
  download.mockResolvedValue({truncated: false});
});
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); delete document.documentElement.dataset.motion; });

const openDetail = async () => {
  render(<RequestsAdmin intent={{request: 41}}/>);
  return screen.findByRole('region', {name: 'Solicitud N.º 41'});
};

test('S07-TC-211 la lista de Solicitudes tiene estado con ícono y texto, etiquetas para la vista en tarjetas y exporta la vista filtrada', async () => {
  render(<RequestsAdmin/>);
  const table = await screen.findByRole('table', {name: /Solicitudes/});
  const rows = within(table).getAllByRole('row').slice(1);
  expect(rows).toHaveLength(2);
  expect(rows[0].querySelectorAll('td[data-label]')).toHaveLength(rows[0].querySelectorAll('td').length);
  expect(within(rows[1]).getByText('Asignada').closest('.adm-status')).toHaveAttribute('data-tone');
  expect(within(rows[0]).getByRole('button', {name: 'Ver la solicitud 41'})).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Estado'), {target: {value: 'sent'}});
  fireEvent.click(screen.getByRole('button', {name: 'Exportar CSV'}));
  await waitFor(() => expect(download).toHaveBeenCalledWith('/admin/requests/export?status=sent', 'solicitudes.csv'));
  expect(await screen.findByText('Descargamos el CSV de la vista filtrada.')).toBeInTheDocument();

  download.mockResolvedValue({truncated: true});
  fireEvent.click(screen.getByRole('button', {name: 'Exportar CSV'}));
  expect(await screen.findByText(/solo las primeras 5000 filas/)).toBeInTheDocument();
});

test('S07-TC-212 el detalle muestra cliente sin datos sensibles, subcategorías, ofertas con sus tiempos y la línea de tiempo', async () => {
  const page = await openDetail();
  const client = within(page).getByRole('region', {name: 'Cliente'});
  expect(client).toHaveTextContent('Cliente Demo');
  expect(client).toHaveTextContent('Chilca');
  expect(client).toHaveTextContent('Premium');
  expect(within(page).getAllByText(/Instalaciones residenciales|Tableros/, {selector: '.adm-chip'})).toHaveLength(2);
  const offers = within(within(page).getByRole('region', {name: 'Ofertas enviadas'})).getByRole('table');
  const [first, second] = within(offers).getAllByRole('row').slice(1);
  expect(first).toHaveTextContent('Técnico Ocupado Demo');
  expect(first).toHaveTextContent('Rechazada');
  expect(first).toHaveTextContent('1 min 35 s');
  expect(second).toHaveTextContent('Pendiente');
  expect(within(page).getByRole('region', {name: 'Línea de tiempo'})).toHaveTextContent('Solicitud enviada.');
  expect(within(page).getByRole('region', {name: 'Técnico asignado'})).toHaveTextContent('Sin técnico asignado');
});

test('S07-TC-213 cancelar pide confirmación con motivo de 10 caracteres o más, envía la versión y una clave, y avisa el resultado [D-116]', async () => {
  const posted = [];
  routes['POST /admin/requests/41/cancellation'] = (body, path) => { posted.push(body); return {data: {id: 41, status: 'cancelled', version: 5}}; };
  const page = await openDetail();
  fireEvent.click(within(page).getByRole('button', {name: 'Cancelar con motivo'}));
  const dialog = screen.getByRole('dialog', {name: 'Cancelar la solicitud N.º 41'});
  fireEvent.change(within(dialog).getByLabelText(/Motivo/), {target: {value: 'Muy corto'}});
  fireEvent.click(within(dialog).getByRole('button', {name: 'Cancelar la solicitud'}));
  expect(within(dialog).getByText('Escribe el motivo (al menos 10 caracteres).')).toBeInTheDocument();
  expect(posted).toHaveLength(0);

  fireEvent.change(within(dialog).getByLabelText(/Motivo/), {target: {value: 'El cliente pidió anular la visita.'}});
  fireEvent.click(within(dialog).getByRole('button', {name: 'Cancelar la solicitud'}));
  await waitFor(() => expect(posted).toEqual([{reason: 'El cliente pidió anular la visita.', expected_version: 4}]));
  expect(request).toHaveBeenCalledWith('/admin/requests/41/cancellation', expect.anything(), 'POST', {headers: {'Idempotency-Key': 'clave-sintetica'}});
  expect(await screen.findByText('Cancelamos la solicitud y avisamos al cliente.')).toBeInTheDocument();
});

test('S07-TC-214 reenviar al emparejamiento muestra el error del servidor en el diálogo; sin permiso no hay botones [D-120]', async () => {
  routes['POST /admin/requests/41/rematch'] = () => { throw Object.assign(new Error('La información cambió. Actualiza y vuelve a intentarlo.'), {status: 409}); };
  const page = await openDetail();
  fireEvent.click(within(page).getByRole('button', {name: 'Reenviar al emparejamiento'}));
  const dialog = screen.getByRole('dialog', {name: 'Reenviar la solicitud N.º 41 al emparejamiento'});
  fireEvent.change(within(dialog).getByLabelText(/Motivo/), {target: {value: 'Nadie aceptó en dos rondas seguidas.'}});
  fireEvent.click(within(dialog).getByRole('button', {name: 'Reenviar'}));
  expect(await within(dialog).findByRole('alert')).toHaveTextContent('La información cambió.');
  cleanup();

  routes['GET /admin/requests/41'] = () => ({data: detail({cancel: false, rematch: false})});
  const readonly = await openDetail();
  expect(within(readonly).queryByRole('button', {name: 'Cancelar con motivo'})).not.toBeInTheDocument();
  expect(within(readonly).queryByRole('button', {name: 'Reenviar al emparejamiento'})).not.toBeInTheDocument();
});

test('S07-TC-215 el tablero en vivo muestra la ronda, la cuenta regresiva de cada oferta, el pendiente y las vencidas', async () => {
  vi.useFakeTimers({toFake: ['Date', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout']});
  vi.setSystemTime(new Date(NOW));
  const navigate = vi.fn();
  render(<AdmLive navigate={navigate}/>);
  await act(async () => { await Promise.resolve(); });
  const searching = screen.getByRole('region', {name: 'Buscando técnico'});
  expect(searching).toHaveTextContent('Ronda 1');
  const timer = within(searching).getByRole('timer', {name: /Luz Demo/});
  expect(timer).toHaveTextContent('08:00');
  act(() => { vi.advanceTimersByTime(1000); });
  expect(timer).toHaveTextContent('07:59');
  expect(screen.getByRole('region', {name: 'En el pendiente de 24 h'})).toHaveTextContent('Vence en 3 h 20 min');
  expect(screen.getByRole('region', {name: 'Ofertas vencidas (24 h)'})).toHaveTextContent('Técnico Ocupado Demo');
  fireEvent.click(within(searching).getByRole('button', {name: 'Ver la solicitud 41'}));
  expect(navigate).toHaveBeenCalledWith('requests', {request: 41});
});

test('S07-TC-216 sin tiempo real el tablero lo dice y se actualiza cada 30 s; con Reverb, «En vivo» y sin consultas periódicas', async () => {
  vi.useFakeTimers({toFake: ['Date', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout']});
  vi.setSystemTime(new Date(NOW));
  render(<AdmLive navigate={vi.fn()}/>);
  await act(async () => { await Promise.resolve(); });
  expect(screen.getByRole('status', {name: 'Conexión'})).toHaveTextContent('Actualiza cada 30 s');
  const calls = () => request.mock.calls.filter(([path]) => path === '/admin/matching/live').length;
  expect(calls()).toBe(1);
  await act(async () => { vi.advanceTimersByTime(30000); await Promise.resolve(); });
  expect(calls()).toBe(2);
  cleanup();

  connected = true;
  request.mockClear();
  render(<AdmLive navigate={vi.fn()}/>);
  await act(async () => { await Promise.resolve(); });
  expect(screen.getByRole('status', {name: 'Conexión'})).toHaveTextContent('En vivo');
  await act(async () => { vi.advanceTimersByTime(60000); await Promise.resolve(); });
  expect(calls()).toBe(1);
});

test('S07-TC-217 las alertas salen en orden de prioridad con color, ícono y texto, y cada una con su acción directa [D-118]', async () => {
  const navigate = vi.fn();
  const posted = [];
  routes['GET /admin/requests/43'] = () => ({data: {...detail(), request: {...detail().request, id: 43, version: 7}}});
  routes['POST /admin/requests/43/rematch'] = body => { posted.push(body); return {data: {id: 43, status: 'sent', version: 8}}; };
  render(<AdmAlerts navigate={navigate}/>);
  const list = await screen.findByRole('list', {name: 'Alertas operativas'});
  const items = within(list).getAllByRole('listitem');
  expect(items.map(li => li.querySelector('.adm-alert-title').textContent)).toEqual([
    'Pendiente de 24 h por vencer', 'Sin técnico hace 1 h 30 min', '2 rondas seguidas sin aceptación', 'Falla de sensor sin atender hace 2 h 5 min']);
  expect(items[0]).toHaveTextContent('Vence en 40 min');
  expect(items.map(li => li.getAttribute('data-tone'))).toEqual(['danger', 'warning', 'warning', 'info']);
  expect(items[0].querySelector('.adm-alert-icon svg')).not.toBeNull();

  fireEvent.click(within(items[1]).getByRole('button', {name: 'Ver la solicitud 41'}));
  expect(navigate).toHaveBeenCalledWith('requests', {request: 41});
  fireEvent.click(within(items[3]).getByRole('button', {name: 'Ver sensores'}));
  expect(navigate).toHaveBeenCalledWith('iot');
  expect(within(items[2]).queryByRole('button', {name: /Reenviar/})).not.toBeInTheDocument();

  fireEvent.click(within(items[0]).getByRole('button', {name: 'Reenviar la solicitud 43'}));
  const dialog = screen.getByRole('dialog', {name: 'Reenviar la solicitud N.º 43 al emparejamiento'});
  fireEvent.change(within(dialog).getByLabelText(/Motivo/), {target: {value: 'El pendiente está por vencer sin técnicos.'}});
  fireEvent.click(within(dialog).getByRole('button', {name: 'Reenviar'}));
  await waitFor(() => expect(posted).toEqual([{reason: 'El pendiente está por vencer sin técnicos.', expected_version: 7}]));
  expect(await screen.findByText('Reenviamos la solicitud al emparejamiento.')).toBeInTheDocument();
});

test('S07-TC-218 sin alertas hay estado vacío con ilustración, y sin umbrales en las reglas se explica en vez de inventar', async () => {
  routes['GET /admin/alerts'] = () => ({data: alerts({items: []})});
  render(<AdmAlerts navigate={vi.fn()}/>);
  expect(await screen.findByText('Todo en orden')).toBeInTheDocument();
  expect(document.querySelector('svg.cx-art')).not.toBeNull();
  cleanup();

  routes['GET /admin/alerts'] = () => ({data: alerts({available: false, items: []})});
  render(<AdmAlerts navigate={vi.fn()}/>);
  expect(await screen.findByText(/Las reglas vigentes no traen los umbrales de las alertas/)).toBeInTheDocument();
});

test('S07-TC-219 la búsqueda por número y el orden por columna funcionan en la lista; la paginación avisa la página', async () => {
  routes['GET /admin/requests'] = (body, path) => ({data: {items: [item({id: 50, created_at: '2026-11-20T10:00:00.000Z'}),
    item({id: 49, created_at: '2026-11-24T10:00:00.000Z'})], page: 1, per_page: 20, total: 45, query: path}});
  render(<RequestsAdmin/>);
  const table = await screen.findByRole('table', {name: /Solicitudes/});
  fireEvent.click(within(table).getByRole('button', {name: /Creada/}));
  expect(within(table).getAllByRole('row').slice(1).map(row => row.querySelector('td').textContent)).toEqual(['50', '49']);
  expect(within(table).getByRole('columnheader', {name: /Creada/})).toHaveAttribute('aria-sort', 'ascending');
  expect(screen.getByText('Página 1 de 3 · 45 solicitudes')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('N.º de solicitud'), {target: {value: '49'}});
  await waitFor(() => expect(request).toHaveBeenCalledWith(expect.stringContaining('q=49')));
});

test('S07-TC-220 abrir una solicitud desde otra sección muestra su detalle y «Volver» regresa a la lista', async () => {
  const page = await openDetail();
  fireEvent.click(within(page).getByRole('button', {name: 'Volver a solicitudes'}));
  expect(await screen.findByRole('table', {name: /Solicitudes/})).toBeInTheDocument();
});
