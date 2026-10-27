// S07-TC-129 a 139 · Bloque C (D-85) · Menú agrupado con contadores y tooltips, Inicio con accesos rápidos y eventos,
// Estadísticas con gráficos accesibles, Usuarios (listado, alta, detalle y acciones con motivo), Solicitudes en solo
// lectura y activación de una cuenta creada por un administrador.
import React from 'react';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import AccountApp from '../administration/AccountApp';
import StatisticsPage from './StatisticsPage';
import UsersAdmin from './UsersAdmin';
import RequestsAdmin from './RequestsAdmin';
import {request} from '../administration/http';

vi.mock('../administration/http', () => ({request: vi.fn()}));
vi.mock('../administration/CatalogAdmin', () => ({default: () => <h2>Administrar catálogo</h2>}));
vi.mock('../administration/VerificationAdmin', () => ({default: () => <h2>Verificación de técnicos</h2>}));
vi.mock('../administration/AnnouncementsAdmin', () => ({default: ({intent}) => <h2>{intent === 'create' ? 'Crear comunicado' : 'Administrar comunicados'}</h2>}));

const admin = {id: 7, name: 'Ana Quispe', given_names: 'Ana', family_names: 'Quispe', version: 3, role: {code: 'admin'}, theme_preference: null,
  avatar_url: null, permissions: ['catalog.manage', 'announcements.manage', 'technicians.verify', 'dashboard.view', 'users.manage']};
const dashboard = {requests_by_status: {sent: 1}, requests_total: 1, technicians_pending_verification: 3, announcements_active: 1,
  new_users: {last_7_days: {client: 0, technician: 0, admin: 0, total: 0}, last_30_days: {client: 0, technician: 0, admin: 0, total: 0}},
  ratings: {available: false, average: null, count: 0, available_from: 'Sprint 6'}, generated_at: '2026-10-27T15:00:00.000000Z',
  recent_events: [{action: 'user.blocked', reason: 'Reportes repetidos.', actor: 'Ana Quispe', subject_type: 'user', occurred_at: '2026-10-27T14:00:00.000000Z'},
    {action: 'announcement.published', reason: 'Campaña de noviembre.', actor: 'Ana Quispe', subject_type: 'announcement', occurred_at: '2026-10-27T13:00:00.000000Z'}]};
const districts = [{id: 1, name: 'Huancayo'}, {id: 2, name: 'El Tambo'}];
const specialties = [{id: 10, name: 'Cómputo'}, {id: 11, name: 'Electricidad'}];
const user = (overrides = {}) => ({id: 21, name: 'Rosa Huamán', given_names: 'Rosa', family_names: 'Huamán', email: 'rosa@example.test', phone: '987654321',
  role: 'client', status: 'active', district: {id: 1, name: 'Huancayo'}, created_at: '2026-10-20T15:00:00.000000Z', version: 2, ...overrides});
const detail = (overrides = {}) => ({user: user(overrides), client: {client_type: 'household', business_name: null, reference_address: null}, technician: null,
  requests: [{id: 5, status: 'completed', subcategory: 'Reparación de hardware', district: 'Huancayo', created_at: '2026-10-21T15:00:00.000000Z'}],
  audit: [{action: 'user.created', reason: 'Alta por soporte.', actor: 'Ana Quispe', occurred_at: '2026-10-20T15:00:00.000000Z'}]});
const days = count => Array.from({length: count}, (_, index) => ({date: new Date(Date.UTC(2026, 9, 27) - (count - 1 - index) * 86400000).toISOString().slice(0, 10),
  total: index === count - 1 ? 3 : 0}));
const statistics = (count = 7, overrides = {}) => ({range: {days: count, from: days(count)[0].date, to: '2026-10-27'}, requests_per_day: days(count),
  requests_by_specialty: [{id: 10, name: 'Cómputo', total: 2}, {id: 11, name: 'Electricidad', total: 1}],
  requests_by_district: [{id: 1, name: 'Huancayo', total: 3}], funnel: {sent: 2, with_offers: 2, assigned: 1, completed: 1},
  offers: {total: 2, accepted: 1, rejected: 1, expired: 0, acceptance_rate: 0.5, avg_response_seconds: 180},
  technicians_by_status: {pending_verification: 2, active: 1, inactive: 0, suspended: 1},
  new_users_by_role: {client: 0, technician: 4, admin: 1, total: 5}, active_announcements_by_audience: {client: 2, technician: 1},
  generated_at: '2026-10-27T15:00:00.000000Z', ...overrides});

let routes;
beforeEach(() => {
  window.history.replaceState(null, '', '/#cuenta/administrador');
  vi.stubGlobal('matchMedia', () => ({matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()}));
  try { localStorage.clear(); sessionStorage.clear(); } catch { /* sin almacenamiento */ }
  routes = {};
  request.mockImplementation(async (path, body, method) => {
    const key = Object.keys(routes).find(prefix => path === prefix || path.startsWith(`${prefix}?`) || path.startsWith(prefix));
    if (key) return routes[key](path, body, method);
    if (path === '/me') return {data: admin};
    if (path === '/admin/dashboard') return {data: dashboard};
    if (path === '/catalog/districts') return {data: districts};
    if (path === '/catalog/specialties') return {data: specialties};
    if (path.startsWith('/catalog/subcategories')) return {data: [{id: 100, name: 'Reparación de hardware'}]};
    if (path.startsWith('/notifications')) return {data: []};
    return {data: []};
  });
});
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); delete document.documentElement.dataset.theme; window.history.replaceState(null, '', '/'); });

const openAdmin = async (person = admin) => {
  routes['/me'] = () => ({data: person});
  render(<AccountApp/>);
  return screen.findByRole('navigation', {name: 'Administración'});
};
const fill = (label, value) => fireEvent.change(screen.getByLabelText(label), {target: {value}});

test('S07-TC-129 el menú agrupa las secciones con título, muestra contadores accesibles y tooltips con el menú contraído', async () => {
  const nav = await openAdmin();
  const groups = within(nav).getAllByRole('group').map(group => [group.querySelector('.panel-nav-heading').textContent,
    within(group).getAllByRole('button').map(button => button.querySelector('.panel-label').textContent)]);
  expect(groups).toEqual([['General', ['Inicio', 'Estadísticas']], ['Gestión', ['Usuarios', 'Verificación', 'Solicitudes']],
    ['Contenido', ['Catálogo', 'Comunicados']], ['Cuenta', ['Mi perfil']]]);
  const verification = await within(nav).findByRole('button', {name: 'Verificación'});
  await waitFor(() => expect(verification).toHaveAccessibleDescription('3 técnicos por verificar'));
  expect(within(nav).getByRole('button', {name: 'Comunicados'})).toHaveAccessibleDescription('1 comunicado vigente');
  expect(nav.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(8);

  fireEvent.click(screen.getByRole('button', {name: 'Contraer menú'}));
  expect(within(nav).getByRole('button', {name: 'Usuarios'})).toHaveAttribute('data-tooltip', 'Usuarios');
  expect(screen.getByRole('button', {name: 'Expandir menú'})).toHaveAttribute('data-tooltip', 'Expandir menú');
  cleanup();

  // Sin permisos de Usuarios ni del Inicio: no hay grupos vacíos ni enlaces sin destino.
  const limited = await openAdmin({...admin, permissions: ['catalog.manage']});
  expect(within(limited).getAllByRole('group').map(group => group.querySelector('.panel-nav-heading').textContent)).toEqual(['Contenido', 'Cuenta']);
  expect(within(limited).queryByRole('button', {name: 'Usuarios'})).not.toBeInTheDocument();
});

test('S07-TC-130 el Inicio ofrece accesos rápidos según permisos y lista los últimos eventos', async () => {
  routes['/admin/users'] = () => ({data: {items: [], page: 1, per_page: 20, total: 0}});
  await openAdmin();
  const quick = await screen.findByRole('navigation', {name: 'Accesos rápidos'});
  expect(within(quick).getAllByRole('button').map(button => button.textContent)).toEqual(['Verificar técnicos', 'Crear comunicado', 'Crear usuario']);
  const events = await screen.findByRole('region', {name: 'Últimos eventos'});
  expect(within(events).getByText('Cuenta bloqueada')).toBeInTheDocument();
  expect(within(events).getByText('Reportes repetidos.')).toBeInTheDocument();
  expect(within(events).getByText('Comunicado publicado')).toBeInTheDocument();

  fireEvent.click(within(quick).getByRole('button', {name: 'Crear usuario'}));
  expect(await screen.findByRole('heading', {name: 'Crear usuario'})).toBeInTheDocument();
  expect(within(screen.getByRole('navigation', {name: 'Administración'})).getByRole('button', {name: 'Usuarios'})).toHaveAttribute('aria-current', 'page');
  fireEvent.click(within(screen.getByRole('navigation', {name: 'Administración'})).getByRole('button', {name: 'Inicio'}));
  fireEvent.click(within(await screen.findByRole('navigation', {name: 'Accesos rápidos'})).getByRole('button', {name: 'Crear comunicado'}));
  expect(await screen.findByRole('heading', {name: 'Crear comunicado'})).toBeInTheDocument();
  cleanup();

  dashboard.recent_events = [];
  await openAdmin({...admin, permissions: ['dashboard.view']});
  expect(await screen.findByText('Todavía no hay acciones registradas en el panel.')).toBeInTheDocument();
  expect(screen.queryByRole('navigation', {name: 'Accesos rápidos'})).toBeEmptyDOMElement();
  dashboard.recent_events = [{action: 'user.blocked', reason: 'Reportes repetidos.', actor: 'Ana Quispe', occurred_at: '2026-10-27T14:00:00.000000Z'}];
});

test('S07-TC-131 las estadísticas cambian de período, dibujan con equivalente en tabla y formatean tasa y tiempo', async () => {
  routes['/admin/statistics'] = path => ({data: statistics(Number(new URLSearchParams(path.split('?')[1]).get('days')))});
  render(<StatisticsPage/>);
  const chart = await screen.findByRole('img', {name: /Solicitudes por día: 3 solicitudes en 30 días/});
  expect(request).toHaveBeenCalledWith('/admin/statistics?days=30');
  expect(screen.getByRole('button', {name: '30 días'})).toHaveAttribute('aria-pressed', 'true');
  expect(within(screen.getByRole('table', {name: 'Solicitudes por día'})).getAllByRole('row')).toHaveLength(31);
  expect(within(screen.getByRole('table', {name: 'Solicitudes por especialidad'})).getByRole('rowheader', {name: 'Cómputo'}).closest('tr')).toHaveTextContent('2');
  expect(within(screen.getByRole('table', {name: /Embudo/})).getByRole('rowheader', {name: 'Asignadas'}).closest('tr')).toHaveTextContent('1 · 50 %');
  expect(screen.getByText('Tasa de aceptación').nextSibling).toHaveTextContent('50 %');
  expect(screen.getByText('Tiempo medio de respuesta').nextSibling).toHaveTextContent('3 min');

  const lastBar = chart.querySelectorAll('g[tabindex="0"]')[29];
  fireEvent.focus(lastBar);
  expect(screen.getByText(/: 3 solicitudes$/, {selector: 'output'})).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', {name: '7 días'}));
  expect(await screen.findByRole('img', {name: /en 7 días/})).toBeInTheDocument();
  expect(request).toHaveBeenLastCalledWith('/admin/statistics?days=7');
  expect(screen.getByRole('button', {name: '7 días'})).toHaveAttribute('aria-pressed', 'true');
});

test('S07-TC-132 las estadísticas sin datos muestran estados vacíos honestos y el error permite reintentar', async () => {
  const empty = statistics(7, {requests_per_day: days(7).map(point => ({...point, total: 0})), requests_by_specialty: [], requests_by_district: [],
    funnel: {sent: 0, with_offers: 0, assigned: 0, completed: 0}, offers: {total: 0, accepted: 0, rejected: 0, expired: 0, acceptance_rate: null, avg_response_seconds: null},
    technicians_by_status: {pending_verification: 0, active: 0, inactive: 0, suspended: 0}, new_users_by_role: {client: 0, technician: 0, admin: 0, total: 0},
    active_announcements_by_audience: {client: 0, technician: 0}});
  let fail = true;
  routes['/admin/statistics'] = () => { if (fail) { fail = false; throw Object.assign(new Error('No pudimos cargar las estadísticas.'), {status: 500}); } return {data: empty}; };
  render(<StatisticsPage/>);
  fireEvent.click(within(await screen.findByRole('alert')).getByRole('button', {name: 'Reintentar'}));
  expect(await screen.findAllByText('Sin solicitudes en este período.')).toHaveLength(3);
  expect(screen.getByText('Sin solicitudes enviadas en este período.')).toBeInTheDocument();
  expect(screen.getByText('Sin ofertas en este período.')).toBeInTheDocument();
  expect(screen.getByText('Aún no hay técnicos registrados.')).toBeInTheDocument();
  expect(screen.getByText('No hay comunicados vigentes ahora.')).toBeInTheDocument();
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
});

test('S07-TC-133 el listado de usuarios busca y filtra con la consulta del servidor y pagina', async () => {
  const calls = [];
  routes['/admin/users'] = path => { calls.push(path); return {data: {items: [user(), user({id: 22, name: 'Luis Rojas', status: 'pending_activation', role: 'technician'})], page: 1, per_page: 20, total: 45}}; };
  render(<UsersAdmin currentUserId={7}/>);
  const table = await screen.findByRole('table', {name: 'Usuarios (45)'});
  expect(within(table).getByText('Pendiente de activación')).toHaveClass('admin-status', 'is-pending_activation');
  expect(within(table).getByText('Técnico')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Rol'), {target: {value: 'client'}});
  fireEvent.change(screen.getByLabelText('Estado'), {target: {value: 'blocked'}});
  fireEvent.change(screen.getByLabelText('Distrito'), {target: {value: '2'}});
  fireEvent.change(screen.getByLabelText('Alta desde'), {target: {value: '2026-10-01'}});
  fireEvent.change(screen.getByLabelText('Buscar por nombre o correo'), {target: {value: ' rosa '}});
  fireEvent.submit(screen.getByRole('search', {name: 'Buscar usuarios'}));
  await waitFor(() => expect(calls.at(-1)).toBe('/admin/users?q=rosa&role=client&status=blocked&district_id=2&created_from=2026-10-01&page=1&per_page=20'));
  fireEvent.click(screen.getByRole('button', {name: 'Siguiente'}));
  await waitFor(() => expect(calls.at(-1)).toContain('page=2'));
  expect(screen.getByText(/Página 2 de 3/)).toBeInTheDocument();
});

test('S07-TC-134 el alta valida en el cliente, no pide contraseña y envía solo los datos del tipo de cuenta', async () => {
  let sent = null;
  routes['/admin/users/30'] = () => ({data: detail({id: 30, status: 'pending_activation'})});
  routes['/admin/users'] = (path, body, method) => {
    if (method === 'POST') { sent = body; return {data: user({id: 30, status: 'pending_activation'})}; }
    return {data: {items: [], page: 1, per_page: 20, total: 0}};
  };
  render(<UsersAdmin currentUserId={7} intent="create"/>);
  expect(await screen.findByRole('heading', {name: 'Crear usuario'})).toBeInTheDocument();
  expect(screen.queryByLabelText(/Contraseña/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: 'Crear y enviar activación'}));
  expect(await screen.findByText('Revisa los campos indicados.')).toBeInTheDocument();
  expect(screen.getByText('El teléfono debe tener 9 dígitos y empezar en 9.')).toBeInTheDocument();
  expect(screen.getByText('Escribe el motivo (al menos 5 caracteres).')).toBeInTheDocument();
  expect(sent).toBeNull();

  fireEvent.click(screen.getByRole('radio', {name: 'Técnico'}));
  expect(await screen.findByLabelText('Distrito base')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox', {name: 'Cómputo'}));
  fireEvent.click(await screen.findByRole('checkbox', {name: 'Reparación de hardware'}));
  fill('Nombres', 'Jorge'); fill('Apellidos', 'Rivera'); fill('Correo', 'Jorge@Example.test'); fill('Teléfono', '912345678');
  fill('Distrito base', '2'); fill('Años de experiencia', '3'); fill('Motivo (queda en la auditoría)', 'Técnico captado en feria.');
  fireEvent.click(screen.getByRole('button', {name: 'Crear y enviar activación'}));
  await waitFor(() => expect(sent).toEqual({account_type: 'technician', given_names: 'Jorge', family_names: 'Rivera', email: 'jorge@example.test',
    phone: '912345678', reason: 'Técnico captado en feria.', base_district_id: 2, district_ids: [2], specialty_ids: [10], subcategory_ids: [100], experience_years: 3}));
  expect(await screen.findByText('Usuario creado: le enviamos el enlace de activación a su correo.')).toBeInTheDocument();
  expect(await screen.findByRole('button', {name: 'Reenviar activación'})).toBeInTheDocument();
});

test('S07-TC-135 el alta muestra los errores del servidor por campo y conserva el formulario', async () => {
  routes['/admin/users'] = (path, body, method) => {
    if (method === 'POST') throw Object.assign(new Error('Revisa los datos enviados.'), {status: 422, fields: {email: ['El correo ya está registrado.']}});
    return {data: {items: [], page: 1, per_page: 20, total: 0}};
  };
  render(<UsersAdmin currentUserId={7} intent="create"/>);
  await screen.findByRole('heading', {name: 'Crear usuario'});
  fill('Nombres', 'Rosa'); fill('Apellidos', 'Huamán'); fill('Correo', 'rosa@example.test'); fill('Teléfono', '987654321');
  fill('Distrito', '1'); fill('Motivo (queda en la auditoría)', 'Alta por soporte.');
  fireEvent.click(screen.getByRole('button', {name: 'Crear y enviar activación'}));
  expect(await screen.findByText('El correo ya está registrado.')).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent('Revisa los datos enviados.');
  expect(screen.getByLabelText('Correo')).toHaveValue('rosa@example.test');
  expect(screen.getByLabelText('Correo')).toHaveAttribute('aria-invalid', 'true');
});

test('S07-TC-136 el detalle muestra datos, historial y auditoría, con acciones según el estado y sin acciones sobre la propia cuenta', async () => {
  routes['/admin/users/21'] = () => ({data: detail({status: 'blocked'})});
  routes['/admin/users/7'] = () => ({data: detail({id: 7, name: 'Ana Quispe', role: 'admin'})});
  routes['/admin/users'] = () => ({data: {items: [user({status: 'blocked'}), user({id: 7, name: 'Ana Quispe', role: 'admin'})], page: 1, per_page: 20, total: 2}});
  render(<UsersAdmin currentUserId={7}/>);
  fireEvent.click(await screen.findByRole('button', {name: 'Rosa Huamán'}));
  const actions = await screen.findByRole('group', {name: 'Acciones de la cuenta'});
  expect(within(actions).getAllByRole('button').map(button => button.textContent)).toEqual(['Editar', 'Desbloquear', 'Restablecer acceso', 'Cerrar sesiones', 'Eliminar']);
  expect(screen.getByRole('region', {name: 'Historial de solicitudes'})).toHaveTextContent('Reparación de hardware · Huancayo');
  expect(screen.getByRole('region', {name: 'Auditoría de la cuenta'})).toHaveTextContent('Alta de usuario');
  expect(screen.getByRole('region', {name: 'Auditoría de la cuenta'})).toHaveTextContent('Alta por soporte.');

  fireEvent.click(screen.getByRole('button', {name: '← Volver a usuarios'}));
  fireEvent.click(await screen.findByRole('button', {name: 'Ana Quispe'}));
  const own = await screen.findByRole('group', {name: 'Acciones de la cuenta'});
  expect(within(own).getByRole('button', {name: 'Editar'})).toBeEnabled();
  expect(within(own).getByRole('button', {name: 'Bloquear'})).toBeDisabled();
  expect(within(own).getByRole('button', {name: 'Eliminar'})).toHaveAccessibleDescription('Es tu propia cuenta: estas acciones se hacen desde Mi perfil.');
});

test('S07-TC-137 bloquear exige motivo y confirmación, envía la versión y muestra el éxito o el error del servidor', async () => {
  let blocked = false;
  routes['/admin/users/21/block'] = (path, body, method) => {
    if (body.reason === 'Intento con conflicto.') throw Object.assign(new Error('Otro administrador cambió este contenido. Recarga para ver la versión actual.'), {status: 409});
    blocked = {path, body, method};
    return {data: user({status: 'blocked', version: 3})};
  };
  routes['/admin/users/21'] = () => ({data: detail({status: blocked ? 'blocked' : 'active'})});
  routes['/admin/users'] = () => ({data: {items: [user()], page: 1, per_page: 20, total: 1}});
  render(<UsersAdmin currentUserId={7}/>);
  fireEvent.click(await screen.findByRole('button', {name: 'Rosa Huamán'}));
  fireEvent.click(await screen.findByRole('button', {name: 'Bloquear'}));
  let dialog = screen.getByRole('dialog', {name: 'Bloquear cuenta'});
  expect(within(dialog).getByLabelText('Motivo (queda en la auditoría)')).toHaveFocus();
  fireEvent.click(within(dialog).getByRole('button', {name: 'Bloquear'}));
  expect(within(dialog).getByText('Escribe el motivo (al menos 5 caracteres).')).toBeInTheDocument();
  fireEvent.change(within(dialog).getByLabelText('Motivo (queda en la auditoría)'), {target: {value: 'Intento con conflicto.'}});
  fireEvent.click(within(dialog).getByRole('button', {name: 'Bloquear'}));
  expect(await within(dialog).findByRole('alert')).toHaveTextContent('Otro administrador cambió este contenido.');

  fireEvent.keyDown(dialog, {key: 'Escape'});
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: 'Bloquear'}));
  dialog = screen.getByRole('dialog', {name: 'Bloquear cuenta'});
  fireEvent.change(within(dialog).getByLabelText('Motivo (queda en la auditoría)'), {target: {value: '  Reportes de suplantación.  '}});
  fireEvent.click(within(dialog).getByRole('button', {name: 'Bloquear'}));
  await waitFor(() => expect(blocked).toEqual({path: '/admin/users/21/block', body: {reason: 'Reportes de suplantación.', expected_version: 2}, method: 'POST'}));
  expect(await screen.findByText('Cuenta bloqueada.')).toBeInTheDocument();
  expect(await screen.findByRole('button', {name: 'Desbloquear'})).toBeInTheDocument();
});

test('S07-TC-138 eliminar pide motivo y escribir ELIMINAR; editar envía solo lo que cambió con motivo y versión', async () => {
  const sent = [];
  routes['/admin/users/21'] = (path, body, method) => {
    if (method) { sent.push({body, method}); return {data: user({version: 3})}; }
    return {data: detail()};
  };
  routes['/admin/users'] = () => ({data: {items: [user()], page: 1, per_page: 20, total: 1}});
  render(<UsersAdmin currentUserId={7}/>);
  fireEvent.click(await screen.findByRole('button', {name: 'Rosa Huamán'}));
  fireEvent.click(await screen.findByRole('button', {name: 'Eliminar'}));
  const dialog = screen.getByRole('dialog', {name: 'Eliminar cuenta'});
  expect(dialog).toHaveTextContent('Sus solicitudes se conservan sin datos personales.');
  fireEvent.change(within(dialog).getByLabelText('Motivo (queda en la auditoría)'), {target: {value: 'Pedido del titular.'}});
  const confirm = within(dialog).getByRole('button', {name: 'Eliminar cuenta'});
  expect(confirm).toBeDisabled();
  fireEvent.change(within(dialog).getByLabelText('Escribe ELIMINAR para confirmar'), {target: {value: 'eliminar'}});
  expect(confirm).toBeDisabled();
  fireEvent.change(within(dialog).getByLabelText('Escribe ELIMINAR para confirmar'), {target: {value: 'ELIMINAR'}});
  fireEvent.click(confirm);
  await waitFor(() => expect(sent[0]).toEqual({body: {reason: 'Pedido del titular.', expected_version: 2, confirmation: 'ELIMINAR'}, method: 'DELETE'}));
  expect(await screen.findByText('Cuenta eliminada: sus datos personales se anonimizaron.')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', {name: 'Editar'}));
  expect(await screen.findByRole('heading', {name: 'Editar a Rosa Huamán'})).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: 'Guardar cambios'}));
  expect(await screen.findByText('Escribe el motivo (al menos 5 caracteres).')).toBeInTheDocument();
  fill('Teléfono', '911222333'); fill('Distrito', '2'); fill('Motivo (queda en la auditoría)', 'Corrigió sus datos.');
  fireEvent.click(screen.getByRole('button', {name: 'Guardar cambios'}));
  await waitFor(() => expect(sent[1]).toEqual({body: {phone: '911222333', district_id: 2, reason: 'Corrigió sus datos.', expected_version: 2}, method: 'PATCH'}));
  expect(await screen.findByText('Datos del usuario guardados.')).toBeInTheDocument();
});

test('S07-TC-139 las solicitudes se filtran y su detalle muestra la línea de tiempo sin acciones de escritura', async () => {
  const calls = [];
  routes['/admin/requests/5'] = () => ({data: {request: {id: 5, status: 'assigned', specialty: 'Cómputo', subcategory: 'Reparación de hardware', district: 'Huancayo',
    mode: 'asap', description: 'La computadora no enciende.', reference_fee: {amount: '80.00', currency: 'PEN'}, cancellation_reason: null, created_at: '2026-10-27T14:00:00Z'},
  client: {id: 21, name: 'Rosa Huamán'}, technician: {id: 3, name: 'Técnico ABCDE'}, offers: {total: 2, pending: 0, accepted: 1, rejected: 1, expired: 0, withdrawn: 0},
  timeline: [{event_type: 'request.submitted', from_status: 'registered', to_status: 'sent', summary: 'Solicitud enviada.', actor: 'Rosa Huamán', occurred_at: '2026-10-27T14:00:00Z'},
    {event_type: 'request.assigned', from_status: 'sent', to_status: 'assigned', summary: 'Técnico asignado.', actor: null, occurred_at: '2026-10-27T14:10:00Z'}]}});
  routes['/admin/requests'] = path => { calls.push(path); return {data: {items: [{id: 5, status: 'assigned', specialty: 'Cómputo', subcategory: 'Reparación de hardware',
    district: 'Huancayo', client: 'Rosa Huamán', technician: {id: 3, name: 'Técnico ABCDE'}, created_at: '2026-10-27T14:00:00Z'}], page: 1, per_page: 20, total: 1}}; };
  render(<RequestsAdmin/>);
  expect(await screen.findByRole('table', {name: 'Solicitudes (1)'})).toHaveTextContent('Técnico ABCDE');
  fireEvent.change(screen.getByLabelText('Estado'), {target: {value: 'assigned'}});
  fireEvent.change(await screen.findByLabelText('Especialidad'), {target: {value: '10'}});
  fireEvent.change(screen.getByLabelText('N.º de solicitud'), {target: {value: '5'}});
  await waitFor(() => expect(calls.at(-1)).toBe('/admin/requests?status=assigned&specialty_id=10&q=5&page=1&per_page=20'));

  fireEvent.click(screen.getByRole('button', {name: 'Ver la solicitud 5'}));
  const timeline = await screen.findByRole('region', {name: 'Línea de tiempo'});
  expect(within(timeline).getAllByRole('listitem').map(item => item.querySelector('strong').textContent)).toEqual(['Solicitud enviada.', 'Técnico asignado.']);
  expect(within(timeline).getAllByRole('listitem')[1]).toHaveTextContent('Asignada');
  expect(screen.getByRole('region', {name: 'Datos'})).toHaveTextContent('1 aceptadas · 1 rechazadas');
  expect(screen.getByText('Solo lectura')).toBeInTheDocument();
  expect(screen.getAllByRole('button').map(button => button.textContent)).toEqual(['← Volver a solicitudes']);
});

test('S07-TC-140 la activación de una cuenta creada por un administrador define la contraseña desde #cuenta/activar', async () => {
  window.history.replaceState(null, '', '/#cuenta/activar?token=tok123&email=rosa%40example.test');
  let sent = null;
  routes['/me'] = () => { throw Object.assign(new Error('Inicia sesión.'), {status: 401}); };
  routes['/auth/password/reset'] = (path, body) => { sent = body; return {data: {message: 'Tu contraseña se actualizó.'}}; };
  render(<AccountApp/>);
  expect(await screen.findByRole('heading', {name: 'Activa tu cuenta'})).toBeInTheDocument();
  expect(screen.getByText(/Elige la contraseña de rosa@example.test/)).toBeInTheDocument();
  fill('Nueva contraseña', 'Clave-segura-2026'); fill('Confirmar contraseña', 'Clave-segura-2026');
  fireEvent.click(screen.getByRole('button', {name: 'Activar mi cuenta'}));
  await waitFor(() => expect(sent).toEqual({email: 'rosa@example.test', token: 'tok123', password: 'Clave-segura-2026', password_confirmation: 'Clave-segura-2026'}));
  expect(await screen.findByRole('heading', {name: 'Cuenta activada'})).toBeInTheDocument();
  expect(screen.getByText('Tu cuenta está activa. Ya puedes iniciar sesión con tu contraseña.')).toBeInTheDocument();
  expect(window.location.hash).toBe('#cuenta/activar?token=tok123&email=rosa%40example.test');
});

test('S07-TC-143 crear un administrador pide reingresar tu contraseña, la envía solo en ese caso y la borra si falla', async () => {
  const sent = [];
  routes['/admin/users/31'] = () => ({data: detail({id: 31, role: 'admin', status: 'pending_activation'})});
  routes['/admin/users'] = (path, body, method) => {
    if (method !== 'POST') return {data: {items: [], page: 1, per_page: 20, total: 0}};
    sent.push(body);
    if (sent.length === 1) throw Object.assign(new Error('Revisa los datos enviados.'), {status: 422, fields: {current_password: ['La contraseña actual no es correcta.']}});
    return {data: user({id: 31, role: 'admin', status: 'pending_activation'})};
  };
  render(<UsersAdmin currentUserId={7} intent="create"/>);
  await screen.findByRole('heading', {name: 'Crear usuario'});
  expect(screen.queryByLabelText('Tu contraseña (para confirmar)')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('radio', {name: 'Administrador'}));
  const password = screen.getByLabelText('Tu contraseña (para confirmar)');
  expect(password).toHaveAttribute('type', 'password');
  expect(password).toHaveAttribute('autocomplete', 'current-password');
  fill('Nombres', 'Carla'); fill('Apellidos', 'Paredes'); fill('Correo', 'carla@example.test'); fill('Teléfono', '923456789');
  fill('Motivo (queda en la auditoría)', 'Nueva integrante de soporte.');
  fireEvent.click(screen.getByRole('button', {name: 'Crear y enviar activación'}));
  expect(await screen.findByText('Escribe tu contraseña para confirmar el alta de un administrador.')).toBeInTheDocument();
  expect(sent).toHaveLength(0);

  fill('Tu contraseña (para confirmar)', 'clave-equivocada');
  fireEvent.click(screen.getByRole('button', {name: 'Crear y enviar activación'}));
  expect(await screen.findByText('La contraseña actual no es correcta.')).toBeInTheDocument();
  expect(sent[0]).toMatchObject({account_type: 'admin', current_password: 'clave-equivocada'});
  expect(screen.getByLabelText('Tu contraseña (para confirmar)')).toHaveValue('');
  expect(screen.getByLabelText('Correo')).toHaveValue('carla@example.test');

  fill('Tu contraseña (para confirmar)', 'Clave-Correcta-2026');
  fireEvent.click(screen.getByRole('button', {name: 'Crear y enviar activación'}));
  expect(await screen.findByText('Usuario creado: le enviamos el enlace de activación a su correo.')).toBeInTheDocument();
  expect(sent[1].current_password).toBe('Clave-Correcta-2026');
  cleanup();

  // Al volver a Cliente, el campo desaparece y la contraseña no viaja.
  sent.length = 0;
  routes['/admin/users/30'] = () => ({data: detail({id: 30, status: 'pending_activation'})});
  routes['/admin/users'] = (path, body, method) => {
    if (method === 'POST') { sent.push(body); return {data: user({id: 30, status: 'pending_activation'})}; }
    return {data: {items: [], page: 1, per_page: 20, total: 0}};
  };
  render(<UsersAdmin currentUserId={7} intent="create"/>);
  await screen.findByRole('heading', {name: 'Crear usuario'});
  fireEvent.click(screen.getByRole('radio', {name: 'Administrador'}));
  fill('Tu contraseña (para confirmar)', 'Clave-Correcta-2026');
  fireEvent.click(screen.getByRole('radio', {name: 'Cliente'}));
  expect(screen.queryByLabelText('Tu contraseña (para confirmar)')).not.toBeInTheDocument();
  fill('Nombres', 'Rosa'); fill('Apellidos', 'Huamán'); fill('Correo', 'rosa@example.test'); fill('Teléfono', '987654321');
  fill('Distrito', '1'); fill('Motivo (queda en la auditoría)', 'Alta por soporte.');
  fireEvent.click(screen.getByRole('button', {name: 'Crear y enviar activación'}));
  await waitFor(() => expect(sent).toHaveLength(1));
  expect(sent[0]).not.toHaveProperty('current_password');
});
