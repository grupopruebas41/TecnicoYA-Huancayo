import React from 'react';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import AccountApp from '../administration/AccountApp';
import NotificationBell from '../panel/NotificationBell';
import PanelShell from '../panel/PanelShell';
import RequestTracking from '../offers/RequestTracking';
import {RealtimeProvider} from '../realtime/Realtime';
import {request} from '../administration/http';
// Panel del cliente (adelanto del S5, D-87): menú, Inicio, cercanía (D-88), Mis solicitudes con línea de tiempo (D-89),
// Notificaciones con marca de leída (D-90), datos del cliente en Mi perfil (D-91) y la campana con la forma real (DEF-49).
vi.mock('../administration/http', () => ({request: vi.fn()}));
const realtime = vi.hoisted(() => ({handlers: {}}));
vi.mock('../realtime/connection', () => ({
  makeEcho: () => ({}),
  subscribeRealtime: (echo, name, events, onEvent, onRecover, onStatus) => {
    realtime.handlers[name] = onEvent; onStatus(true);
    return () => { delete realtime.handlers[name]; };
  },
}));

const client = {id: '5', name: 'Carla Rojas', given_names: 'Carla', family_names: 'Rojas', phone: '987654321', version: 2,
  role: {code: 'client'}, permissions: [], theme_preference: null, avatar_url: null,
  client_profile: {client_type: 'household', district_id: 1, reference_address: 'Jr. Sintético 100'}};
const row = (id, status, phase, extra = {}) => ({id, status, phase, mode: 'asap', source: 'automatic', version: 3,
  subcategory: {id: 3, name: 'Reparación de hardware'}, district: {id: 1, name: 'Huancayo'},
  created_at: '2026-10-20T14:00:00Z', updated_at: '2026-10-20T15:00:00Z', ...extra});
const rows = [row(41, 'sent', 'awaiting_choice'), row(40, 'sent', 'matching'), row(39, 'registered', 'registered'),
  row(38, 'expired', 'expired'), row(37, 'assigned', 'assigned')];
const technician = (id, name, distance, fee = '60.00') => ({id, display_name: name, provider_type: 'independent', experience_years: 4,
  services: [{subcategory_id: 3, subcategory_name: 'Reparación de hardware', reference_fee: fee, currency: 'PEN'}],
  districts: [{id: 1, name: 'Huancayo'}], rating: {average: null, count: 0}, distance});
const nearby = [technician(1, 'Técnico Huancayo', {km: 1, same_district: true, approximate: true, label: 'aproximada por zona'}),
  technician(2, 'Técnico Tambo', {km: 3.5, same_district: false, approximate: true, label: 'aproximada por zona'}, '80.00'),
  technician(3, 'Técnico sin base', null, '45.50')];
const page = items => ({items, pagination: {page: 1, per_page: 12, total: items.length, last_page: 1}});
const inbox = (items, unread) => ({...page(items), unread_count: unread});
const notice = (id, type, title, readAt = null) => ({id, type, title, body: 'Texto sintético.', subject: {type: 'service_request', id: 41},
  event_id: 'e' + id, created_at: '2026-10-20T15:00:00Z', read_at: readAt});
const notifications = [notice(9, 'request.awaiting_choice', 'Elige a tu técnico'), notice(8, 'request.pending', 'Seguimos buscando'),
  notice(7, 'request.pending', 'Búsqueda anterior', '2026-10-19T10:00:00Z')];
const specialties = [{id: 1, name: 'Cómputo', image_url: null}, {id: 2, name: 'Refrigeración', image_url: null}];
const detail = id => ({...row(id, 'sent', 'awaiting_choice'), description: 'La computadora no enciende.', address: 'Jr. Sintético 100',
  reference_fee: {amount: '60.00', currency: 'PEN', is_reference: true}, attachments: [], search: null, assignment: null,
  timeline: [{type: 'request.submitted', label: 'Solicitud enviada', from_status: 'registered', to_status: 'sent', occurred_at: '2026-10-20T14:00:00Z'},
    {type: 'round.awaiting_choice', label: 'Hay técnicos que aceptaron: elige uno', from_status: 'sent', to_status: 'sent', occurred_at: '2026-10-20T14:30:00Z'}]});

function routes(extra = {}) {
  request.mockImplementation(async (path, body, method) => {
    for (const [prefix, handler] of Object.entries(extra)) if (path === prefix || path.startsWith(prefix + '?')) return handler(path, body, method);
    if (path === '/me' && !body) return {data: client};
    if (path === '/requests') return {data: rows};
    if (/^\/requests\/\d+$/.test(path)) return {data: detail(Number(path.split('/')[2]))};
    if (/^\/requests\/\d+\/candidates$/.test(path)) return {data: {phase: 'awaiting_choice', request_version: 3, accepted: [], alternatives: []}};
    if (path.startsWith('/technicians?')) return {data: page(nearby)};
    if (path.startsWith('/notifications')) return {data: inbox(notifications, 2)};
    if (path === '/catalog/specialties') return {data: specialties};
    if (path === '/catalog/districts') return {data: [{id: 1, name: 'Huancayo'}, {id: 2, name: 'El Tambo'}]};
    return {data: []};
  });
}
beforeEach(() => {
  window.history.replaceState(null, '', '/#cuenta/cliente');
  vi.stubGlobal('matchMedia', () => ({matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()}));
  try { localStorage.clear(); sessionStorage.clear(); } catch { /* sin almacenamiento */ }
});
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); window.history.replaceState(null, '', '/'); });
const openClient = async (extra) => { routes(extra); render(<AccountApp/>); return screen.findByRole('navigation', {name: 'Gestión del cliente'}); };
const navButton = (nav, label) => within(nav).getAllByRole('button').find(b => b.querySelector('.panel-label')?.textContent === label);

test('S05-TC-025 la campana usa la forma real de la bandeja: unread_count e items [DEF-49]', async () => {
  routes();
  render(<NotificationBell/>);

  const bell = await screen.findByRole('button', {name: 'Notificaciones: 2 sin leer'});
  fireEvent.click(bell);
  const list = screen.getByRole('region', {name: 'Notificaciones recientes'});
  expect(within(list).getAllByRole('listitem').map(item => item.textContent)).toEqual(['Elige a tu técnico', 'Seguimos buscando', 'Búsqueda anterior']);
  expect(within(list).getAllByRole('listitem')[2]).not.toHaveClass('is-unread');
});

test('S05-TC-026 el panel del cliente agrupa su menú y conserva los selectores de Cypress', async () => {
  const nav = await openClient();

  expect(within(nav).getAllByRole('group').map(group => group.querySelector('.panel-nav-heading').textContent)).toEqual(['General', 'Servicios', 'Cuenta']);
  expect(within(nav).getAllByRole('button').map(b => b.querySelector('.panel-label').textContent))
    .toEqual(['Inicio', 'Nueva solicitud', 'Buscar técnicos', 'Mis solicitudes', 'Notificaciones', 'Mi perfil']);
  expect(navButton(nav, 'Inicio')).toHaveAttribute('aria-current', 'page');
  expect(document.querySelector('[data-cy=portal-client]')).toBeInTheDocument();
  expect(screen.getByRole('button', {name: 'Cerrar sesión'})).toHaveAttribute('data-cy', 'logout');
  // Contadores: una solicitud por elegir técnico y dos notificaciones sin leer.
  await waitFor(() => expect(navButton(nav, 'Mis solicitudes').querySelector('.panel-nav-badge')).toHaveTextContent('1'));
  expect(navButton(nav, 'Notificaciones').querySelector('.panel-nav-badge')).toHaveTextContent('2');
  expect(screen.getByText('1 solicitud por elegir técnico')).toBeInTheDocument();
});

test('S05-TC-027 el Inicio resume las solicitudes reales y no muestra citas ni calificaciones', async () => {
  await openClient();
  const home = await screen.findByRole('region', {name: 'Resumen de tus solicitudes'});

  await waitFor(() => expect(within(home).getByText('Solicitudes activas').closest('.panel-card')).toHaveTextContent('3'));
  expect(within(home).getByText('Por elegir técnico').closest('.panel-card')).toHaveTextContent('1');
  expect(screen.queryByText(/Próxima cita/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Calificaciones/)).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', {name: 'Pedir un técnico'}));
  expect(await screen.findByRole('region', {name: 'Nueva solicitud'})).toBeInTheDocument();
  expect(navButton(screen.getByRole('navigation', {name: 'Gestión del cliente'}), 'Nueva solicitud')).toHaveAttribute('aria-current', 'page');
});

test('S05-TC-028 «Técnicos cerca de ti» ordena por cercanía y su fallo no tumba el resto del Inicio', async () => {
  await openClient();
  const near = await screen.findByRole('region', {name: 'Técnicos cerca de ti'});

  await within(near).findByText('Técnico Huancayo');
  expect(request).toHaveBeenCalledWith('/technicians?sort=proximity&per_page=4');
  expect(within(near).getByText('En tu distrito')).toBeInTheDocument();
  expect(within(near).getByText('A 3,5 km · aproximada por zona')).toBeInTheDocument();
  expect(within(near).getByText('Desde S/ 80.00')).toBeInTheDocument();
  cleanup();

  await openClient({'/technicians': () => Promise.reject({status: 0, message: 'No hay conexión con el servidor.'})});
  const failed = await screen.findByRole('region', {name: 'Técnicos cerca de ti'});
  expect(await within(failed).findByRole('alert')).toHaveTextContent('No pudimos cargar los técnicos cercanos.');
  expect(within(failed).getByRole('button', {name: 'Reintentar'})).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText('Solicitudes activas').closest('.panel-card')).toHaveTextContent('3'));
});

test('S05-TC-029 los accesos por rubro del Inicio abren la búsqueda filtrada por esa especialidad', async () => {
  await openClient();
  const shortcuts = await screen.findByRole('navigation', {name: 'Buscar por rubro'});

  fireEvent.click(await within(shortcuts).findByRole('button', {name: 'Refrigeración'}));

  await screen.findByRole('region', {name: 'Buscar técnicos'});
  await waitFor(() => expect(request).toHaveBeenCalledWith('/technicians?specialty_id=2&sort=proximity&page=1'));
  expect(screen.getByLabelText('Rubro')).toHaveValue('2');
});

test('S05-TC-030 la búsqueda ordena por cercanía, filtra por tarifa máxima y muestra distancia y tarifa', async () => {
  const nav = await openClient();
  fireEvent.click(navButton(nav, 'Buscar técnicos'));
  const search = await screen.findByRole('region', {name: 'Buscar técnicos'});

  await waitFor(() => expect(request).toHaveBeenCalledWith('/technicians?sort=proximity&page=1'));
  expect(within(search).getByText('Ordenados por cercanía a tu distrito; no es una recomendación.')).toBeInTheDocument();
  fireEvent.change(within(search).getByLabelText('Tarifa máxima'), {target: {value: '80'}});
  await waitFor(() => expect(request).toHaveBeenCalledWith('/technicians?max_fee=80&sort=proximity&page=1'));

  const cards = await within(search).findAllByTestId('technician-card');
  expect(cards).toHaveLength(3);
  cards.forEach(card => expect(card).toHaveAttribute('data-cy', 'technician-card'));
  expect(within(cards[0]).getByText('En tu distrito')).toBeInTheDocument();
  expect(within(cards[2]).getByText('Distancia no disponible')).toBeInTheDocument();
  expect(within(cards[2]).getByText('Desde S/ 45.50')).toBeInTheDocument();
  expect(within(cards[0]).getAllByRole('button')).toHaveLength(1);
});

test('S05-TC-031 sin distrito principal la búsqueda ordena por nombre y lo explica', async () => {
  routes({'/me': () => ({data: {...client, client_profile: {client_type: 'household', district_id: null, reference_address: null}}})});
  render(<AccountApp/>);
  const nav = await screen.findByRole('navigation', {name: 'Gestión del cliente'});
  fireEvent.click(navButton(nav, 'Buscar técnicos'));
  const search = await screen.findByRole('region', {name: 'Buscar técnicos'});

  await waitFor(() => expect(request).toHaveBeenCalledWith('/technicians?page=1'));
  expect(within(search).getByText(/Registra tu distrito principal en Mi perfil/)).toBeInTheDocument();
  fireEvent.change(within(search).getByLabelText('Zona'), {target: {value: '2'}});
  await waitFor(() => expect(request).toHaveBeenCalledWith('/technicians?district_id=2&sort=proximity&page=1'));
});

test('S05-TC-032 Mis solicitudes agrupa por estado en pestañas con contador y estado en texto', async () => {
  const nav = await openClient();
  fireEvent.click(navButton(nav, 'Mis solicitudes'));
  const list = await screen.findByRole('region', {name: 'Mis solicitudes'});
  const tabs = within(list).getByRole('tablist', {name: 'Estados de tus solicitudes'});

  await within(list).findByText('Ver solicitud #41');
  expect(within(tabs).getAllByRole('tab').map(tab => tab.textContent))
    .toEqual(['Todas (5)', 'Borradores (1)', 'En búsqueda (1)', 'Por elegir (1)', 'Asignadas (1)', 'Cerradas (1)']);
  expect(within(tabs).getByRole('tab', {name: 'Todas (5)'})).toHaveAttribute('aria-selected', 'true');
  expect(within(list).getAllByRole('article')).toHaveLength(5);
  expect(within(list).getByText('Registrada')).toBeInTheDocument();

  fireEvent.click(within(tabs).getByRole('tab', {name: 'Por elegir (1)'}));
  const cards = within(list).getAllByRole('article');
  expect(cards).toHaveLength(1);
  expect(within(cards[0]).getByText('Elige a tu técnico')).toHaveClass('client-status', 'is-choice');
  expect(within(cards[0]).getByText(/Reparación de hardware · Huancayo/)).toBeInTheDocument();
});

test('S05-TC-033 el detalle muestra la línea de tiempo y la actualiza con request.updated [TC-067]', async () => {
  routes();
  render(<RealtimeProvider><RequestTracking requestId={41}/></RealtimeProvider>);
  const timeline = await screen.findByRole('list', {name: 'Línea de tiempo de la solicitud'});
  expect(within(timeline).getAllByRole('listitem').map(item => item.querySelector('strong').textContent))
    .toEqual(['Solicitud enviada', 'Hay técnicos que aceptaron: elige uno']);

  routes({'/requests/41': () => ({data: {...detail(41), version: 9, status: 'assigned', phase: 'assigned', timeline: [...detail(41).timeline,
    {type: 'request.assigned', label: 'Elegiste a tu técnico', from_status: 'sent', to_status: 'assigned', occurred_at: '2026-10-20T15:00:00Z'}]}})});
  await act(async () => { realtime.handlers['requests.41']({event_id: 'ev-1', request_id: 41, version: 9}); });

  await waitFor(() => expect(within(screen.getByRole('list', {name: 'Línea de tiempo de la solicitud'})).getAllByRole('listitem')).toHaveLength(3));
  expect(screen.getByText('Elegiste a tu técnico')).toBeInTheDocument();
});

test('S05-TC-034 «Ver solicitud» desde el Inicio abre su detalle en Mis solicitudes', async () => {
  await openClient();
  const active = await screen.findByRole('region', {name: 'Solicitudes en curso'});

  fireEvent.click(await within(active).findByRole('button', {name: 'Ver solicitud #41'}));

  expect(await screen.findByRole('region', {name: 'Seguimiento de solicitud'})).toBeInTheDocument();
  expect(navButton(screen.getByRole('navigation', {name: 'Gestión del cliente'}), 'Mis solicitudes')).toHaveAttribute('aria-current', 'page');
  expect(request).toHaveBeenCalledWith('/requests/41');
});

test('S05-TC-035 la bandeja filtra por estado y tipo y marca una notificación como leída con alerta [TC-106]', async () => {
  const marked = vi.fn(() => ({data: {...notifications[0], read_at: '2026-10-20T16:00:00Z'}}));
  const nav = await openClient({'/notifications/9/read': marked});
  fireEvent.click(navButton(nav, 'Notificaciones'));
  const page = await screen.findByRole('region', {name: 'Notificaciones'});

  await within(page).findByText('Elige a tu técnico');
  fireEvent.change(within(page).getByLabelText('Estado'), {target: {value: 'unread'}});
  await waitFor(() => expect(request).toHaveBeenCalledWith('/notifications?state=unread&per_page=20'));
  fireEvent.change(within(page).getByLabelText('Tipo'), {target: {value: 'request.pending'}});
  await waitFor(() => expect(request).toHaveBeenCalledWith('/notifications?state=unread&type=request.pending&per_page=20'));

  const item = (await within(page).findByText('Elige a tu técnico')).closest('li');
  fireEvent.click(within(item).getByRole('button', {name: 'Marcar como leída'}));

  expect(await within(page).findByText('Marcamos la notificación como leída.')).toBeInTheDocument();
  expect(marked).toHaveBeenCalledWith('/notifications/9/read', {}, 'POST');
  expect(within(item).queryByRole('button', {name: 'Marcar como leída'})).not.toBeInTheDocument();
  expect(within(item).getByText('Leída')).toBeInTheDocument();
});

test('S05-TC-036 marcar todas como leídas actualiza el contador y muestra el error si falla', async () => {
  let fail = false;
  const nav = await openClient({'/notifications/read-all': () => (fail ? Promise.reject({status: 0, message: 'No hay conexión con el servidor.'}) : {data: {updated: 2}})});
  fireEvent.click(navButton(nav, 'Notificaciones'));
  const page = await screen.findByRole('region', {name: 'Notificaciones'});
  await within(page).findByText('Elige a tu técnico');

  routes({'/notifications': () => ({data: inbox(notifications.map(n => ({...n, read_at: n.read_at || '2026-10-20T16:00:00Z'})), 0)}),
    '/notifications/read-all': () => (fail ? Promise.reject({status: 0, message: 'No hay conexión con el servidor.'}) : {data: {updated: 2}})});
  fireEvent.click(within(page).getByRole('button', {name: 'Marcar todas como leídas'}));

  expect(await within(page).findByText('Marcamos 2 notificaciones como leídas.')).toBeInTheDocument();
  await waitFor(() => expect(navButton(nav, 'Notificaciones').querySelector('.panel-nav-badge')).toBeNull());
  expect(within(page).getByRole('button', {name: 'Marcar todas como leídas'})).toBeDisabled();

  fail = true;
  routes({'/notifications/read-all': () => Promise.reject({status: 0, message: 'No hay conexión con el servidor.'})});
  fireEvent.click(navButton(nav, 'Inicio'));
  fireEvent.click(navButton(nav, 'Notificaciones'));
  const again = await screen.findByRole('region', {name: 'Notificaciones'});
  fireEvent.click(await within(again).findByRole('button', {name: 'Marcar todas como leídas'}));
  expect(await within(again).findByRole('alert')).toHaveTextContent('No hay conexión con el servidor.');
});

test('S05-TC-037 Mi perfil guarda el distrito y la dirección del cliente con doble validación y alertas', async () => {
  const saved = vi.fn((path, body) => ({data: {...client, version: 3, client_profile: {...client.client_profile, district_id: Number(body.district_id),
    reference_address: body.reference_address}}}));
  const nav = await openClient({'/me': (path, body, method) => (method === 'PATCH' ? saved(path, body) : {data: client})});
  fireEvent.click(navButton(nav, 'Mi perfil'));
  const form = await screen.findByRole('form', {name: 'Datos de cliente'});
  const address = within(form).getByLabelText('Dirección de referencia (privada)');
  expect(address).toHaveValue('Jr. Sintético 100');

  fireEvent.change(address, {target: {value: 'x'.repeat(256)}});
  fireEvent.click(within(form).getByRole('button', {name: 'Guardar datos de cliente'}));
  expect(await within(form).findByText('La dirección puede tener hasta 255 caracteres.')).toBeInTheDocument();
  expect(saved).not.toHaveBeenCalled();

  fireEvent.change(await within(form).findByLabelText('Distrito principal'), {target: {value: '2'}});
  fireEvent.change(address, {target: {value: '  Av. Sintética 742  '}});
  fireEvent.click(within(form).getByRole('button', {name: 'Guardar datos de cliente'}));

  expect(await within(form).findByText('Guardamos tus datos de cliente.')).toBeInTheDocument();
  expect(saved).toHaveBeenCalledWith('/me', {district_id: 2, reference_address: 'Av. Sintética 742', expected_version: 2});

  routes({'/me': (path, body, method) => (method === 'PATCH' ? Promise.reject({status: 422, message: 'Revisa los datos.', fields: {district_id: ['El distrito no está disponible.']}}) : {data: client})});
  fireEvent.click(within(form).getByRole('button', {name: 'Guardar datos de cliente'}));
  expect(await within(form).findByText('El distrito no está disponible.')).toBeInTheDocument();
});

test('S05-TC-038 la búsqueda que llega desde la portada abre Buscar técnicos con sus filtros', async () => {
  sessionStorage.setItem('tecnicoya.searchIntent', JSON.stringify({specialty_id: '1', district_id: '2'}));
  const nav = await openClient();

  expect(navButton(nav, 'Buscar técnicos')).toHaveAttribute('aria-current', 'page');
  await waitFor(() => expect(request).toHaveBeenCalledWith('/technicians?specialty_id=1&district_id=2&sort=proximity&page=1'));
  expect(sessionStorage.getItem('tecnicoya.searchIntent')).toBeNull();
});

test('S05-TC-039 «Solicitar servicio» desde un perfil abre el asistente dirigido en Nueva solicitud', async () => {
  const nav = await openClient({'/technicians/2': () => ({data: {...nearby[1], bio: 'Perfil sintético', portfolio: []}})});
  fireEvent.click(navButton(nav, 'Buscar técnicos'));
  fireEvent.click(await screen.findByRole('button', {name: 'Ver perfil de Técnico Tambo'}));
  fireEvent.click(await screen.findByRole('button', {name: 'Solicitar servicio'}));

  const wizard = await screen.findByRole('region', {name: 'Nueva solicitud'});
  expect(navButton(nav, 'Nueva solicitud')).toHaveAttribute('aria-current', 'page');
  expect(await within(wizard).findByText(/Solicitud dirigida a Técnico Tambo/)).toBeInTheDocument();
  expect(within(wizard).getByLabelText('Especialidad')).toBeInTheDocument();
});

test('S05-TC-040 mientras el asistente guarda, el menú queda bloqueado y lo anuncia', async () => {
  const sections = [{id: 'home', group: 'General', label: 'Inicio', icon: 'home', render: () => <p>Inicio</p>},
    {id: 'new', group: 'Servicios', label: 'Nueva solicitud', icon: 'plus', render: () => <p>Asistente</p>}];
  routes();
  const {rerender} = render(<PanelShell user={client} role="client" roleLabel="Cliente" navLabel="Gestión del cliente" sections={sections} onLogout={vi.fn()} locked/>);
  const nav = screen.getByRole('navigation', {name: 'Gestión del cliente'});

  within(nav).getAllByRole('button').forEach(button => expect(button).toBeDisabled());
  expect(screen.getByText('Espera a que termine de guardarse tu solicitud.')).toBeInTheDocument();
  expect(screen.getByRole('button', {name: 'Cerrar sesión'})).toBeDisabled();

  rerender(<PanelShell user={client} role="client" roleLabel="Cliente" navLabel="Gestión del cliente" sections={sections} onLogout={vi.fn()}/>);
  within(nav).getAllByRole('button').forEach(button => expect(button).toBeEnabled());
  await act(async () => {});
});
