import React from 'react';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import AccountApp from '../administration/AccountApp';
import AdminHome from './AdminHome';
import ProfilePage from './ProfilePage';
import VerificationAdmin from '../administration/VerificationAdmin';
import {request} from '../administration/http';
// Adelanto del Sprint 7 (D-73) · Fase 1 del panel: base común, Inicio, tema (D-76), Mi perfil (D-75 y D-77).
vi.mock('../administration/http', () => ({request: vi.fn()}));
vi.mock('../administration/Sprint02Portal', () => ({default: ({user}) => <p>Contenido actual de {user.role.code}</p>}));
vi.mock('../administration/CatalogAdmin', () => ({default: () => <h2>Administrar catálogo</h2>}));
vi.mock('../administration/AnnouncementsAdmin', () => ({default: () => <h2>Administrar comunicados</h2>}));

const admin = {id: '7', name: 'Ana Quispe', given_names: 'Ana', family_names: 'Quispe', phone: null, version: 3,
  role: {code: 'admin'}, theme_preference: null, avatar_url: null,
  permissions: ['catalog.manage', 'announcements.manage', 'technicians.verify', 'dashboard.view', 'users.manage']};
const dashboard = {requests_by_status: {registered: 0, sent: 2, pending_availability: 1, assigned: 1, in_progress: 0, completed: 0,
  closed: 0, unrated: 0, cancelled: 1, expired: 0}, requests_total: 5, technicians_pending_verification: 3,
  new_users: {last_7_days: {client: 2, technician: 1, admin: 0, total: 3}, last_30_days: {client: 4, technician: 2, admin: 1, total: 7}},
  ratings: {available: false, average: null, count: 0, available_from: 'Sprint 6'}, generated_at: '2026-10-26T15:00:00.000000Z'};
// DEF-49: la bandeja tiene la forma real del contrato S4 §7.1 más unread_count (D-90); antes se simulaba un arreglo.
const inbox = (items, unread) => ({items, pagination: {page: 1, per_page: 20, total: items.length, last_page: 1}, unread_count: unread});
const notifications = inbox([{id: 1, title: 'Nuevo técnico por verificar', body: '', read_at: null},
  {id: 2, title: 'Comunicado publicado', body: '', read_at: null}, {id: 3, title: 'Revisión anterior', body: '', read_at: '2026-10-25T10:00:00Z'}], 2);

function routes(user, extra = {}) {
  request.mockImplementation(async (path, body, method) => {
    if (extra[path]) return extra[path](body, method);
    if (path === '/me' && !body) return {data: user};
    if (path === '/admin/dashboard') return {data: dashboard};
    if (path.startsWith('/notifications')) return {data: notifications};
    if (path.startsWith('/admin/technicians')) return {data: []};
    if (path === '/me' && method === 'PATCH') return {data: {...user, ...body, version: user.version + 1}};
    return {data: []};
  });
}
beforeEach(() => {
  window.history.replaceState(null, '', '/#cuenta/administrador');
  vi.stubGlobal('matchMedia', () => ({matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()}));
  try { localStorage.clear(); sessionStorage.clear(); } catch { /* sin almacenamiento */ }
});
afterEach(() => {cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); delete document.documentElement.dataset.theme; window.history.replaceState(null, '', '/');});
const openAdmin = async (user = admin) => { routes(user); render(<AccountApp/>); return screen.findByRole('navigation', {name: 'Administración'}); };

test('S07-TC-057 el panel del administrador muestra su menú según permisos y marca la sección activa', async () => {
  const nav = await openAdmin();

  // Bloque C (D-85): el menú se agrupa en General, Gestión y Contenido (detalle en S07-TC-129). Fase T1 del panel del
  // técnico (D-104): Mi perfil y «Cerrar sesión» pasan al panel de la cuenta, como en el cliente; el menú ya no los lista.
  expect(within(nav).getAllByRole('button').map(b => b.querySelector('.panel-label').textContent))
    .toEqual(['Inicio', 'Estadísticas', 'Usuarios', 'Verificación', 'Solicitudes', 'Catálogo', 'Comunicados']);
  expect(within(nav).getByRole('button', {name: 'Inicio'})).toHaveAttribute('aria-current', 'page');
  expect(document.querySelector('[data-cy=portal-admin]')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: 'Cuenta de Ana Quispe'}));
  expect(screen.getByRole('button', {name: 'Cerrar sesión'})).toHaveAttribute('data-cy', 'logout');
  fireEvent.click(screen.getByRole('button', {name: 'Cerrar panel de la cuenta'}));

  fireEvent.click(within(nav).getByRole('button', {name: 'Catálogo'}));
  expect(await screen.findByRole('heading', {name: 'Administrar catálogo'})).toBeInTheDocument();
  expect(within(nav).getByRole('button', {name: 'Catálogo'})).toHaveAttribute('aria-current', 'page');
  expect(within(nav).getByRole('button', {name: 'Inicio'})).not.toHaveAttribute('aria-current');
  cleanup();

  await openAdmin({...admin, permissions: ['catalog.manage']});
  expect(within(screen.getByRole('navigation', {name: 'Administración'})).getAllByRole('button').map(b => b.querySelector('.panel-label').textContent))
    .toEqual(['Catálogo']);
});

test('S07-TC-058 la barra lateral se contrae, conserva nombres accesibles y recuerda el estado', async () => {
  const nav = await openAdmin();
  const toggle = screen.getByRole('button', {name: 'Contraer menú'});
  expect(toggle).toHaveAttribute('aria-expanded', 'true');

  fireEvent.click(toggle);

  expect(screen.getByRole('button', {name: 'Expandir menú'})).toHaveAttribute('aria-expanded', 'false');
  expect(document.querySelector('.panel-shell')).toHaveClass('is-collapsed');
  expect(within(nav).getByRole('button', {name: 'Catálogo'})).toBeInTheDocument();
  cleanup();
  await openAdmin();
  expect(document.querySelector('.panel-shell')).toHaveClass('is-collapsed');
});

test('S07-TC-059 en móvil el menú es un cajón que se cierra con Escape y devuelve el foco', async () => {
  await openAdmin();
  const open = screen.getByRole('button', {name: 'Abrir menú'});

  fireEvent.click(open);
  expect(open).toHaveAttribute('aria-expanded', 'true');
  expect(document.querySelector('.panel-sidebar')).toHaveClass('is-open');
  await waitFor(() => expect(within(screen.getByRole('navigation', {name: 'Administración'})).getAllByRole('button')[0]).toHaveFocus());

  fireEvent.keyDown(document.querySelector('.panel-sidebar'), {key: 'Escape'});
  expect(document.querySelector('.panel-sidebar')).not.toHaveClass('is-open');
  expect(open).toHaveFocus();
});

test('S07-TC-060 la campana cuenta las notificaciones sin leer y las lista', async () => {
  await openAdmin();
  const bell = await screen.findByRole('button', {name: 'Notificaciones: 2 sin leer'});
  expect(request).toHaveBeenCalledWith('/notifications');

  fireEvent.click(bell);
  const list = screen.getByRole('region', {name: 'Notificaciones recientes'});
  // Rediseño de la campana (Fase 4): el título va en negrita junto al contexto y el tiempo relativo.
  expect(within(list).getAllByRole('listitem').map(i => i.querySelector('.notif-title').textContent)).toEqual(['Nuevo técnico por verificar', 'Comunicado publicado', 'Revisión anterior']);
  cleanup();

  routes(admin, {'/notifications': () => ({data: inbox([], 0)})});
  render(<AccountApp/>);
  fireEvent.click(await screen.findByRole('button', {name: 'Notificaciones: 0 sin leer'}));
  expect(screen.getByText('Estás al día, no tienes notificaciones nuevas')).toBeInTheDocument();
});

// Fase T1 del panel del técnico (D-104): el avatar del administrador abre el mismo panel de la cuenta del cliente, con
// sus pestañas (sin Mis direcciones ni Comunicación); antes abría un menú Mi perfil / Tema / Cerrar sesión.
test('S07-TC-061 el avatar muestra iniciales o la foto y abre el panel de la cuenta con las pestañas del administrador', async () => {
  await openAdmin();
  const avatar = screen.getByRole('button', {name: 'Cuenta de Ana Quispe'});
  expect(avatar).toHaveTextContent('AQ');
  expect(avatar).toHaveAttribute('aria-haspopup', 'dialog');

  fireEvent.click(avatar);
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getAllByRole('tab').map(tab => tab.textContent)).toEqual(['Mi cuenta', 'Seguridad', 'Accesibilidad', 'Apariencia']);
  expect(within(dialog).getByText('Administrador')).toBeInTheDocument();
  expect(within(dialog).queryByText(/Plan (Free|Premium)/)).not.toBeInTheDocument();
  fireEvent.keyDown(dialog, {key: 'Escape'});
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(avatar).toHaveFocus();
  cleanup();

  await openAdmin({...admin, avatar_url: 'http://api.test/api/v1/media/9'});
  expect(screen.getByRole('button', {name: 'Cuenta de Ana Quispe'}).querySelector('img')).toHaveAttribute('src', 'http://api.test/api/v1/media/9');
});

test('S07-TC-062 el tema claro u oscuro se aplica con data-theme y se guarda en /me', async () => {
  await openAdmin();
  expect(document.documentElement.dataset.theme).toBe('dark');

  // Fase T1 (D-104): el tema se elige en la pestaña Apariencia del panel de la cuenta.
  fireEvent.click(screen.getByRole('button', {name: 'Cuenta de Ana Quispe'}));
  fireEvent.click(screen.getByRole('tab', {name: 'Apariencia'}));
  fireEvent.click(screen.getByRole('radio', {name: /Claro/}));

  expect(document.documentElement.dataset.theme).toBe('light');
  await waitFor(() => expect(request).toHaveBeenCalledWith('/me', {theme_preference: 'light', expected_version: 3}, 'PATCH'));
  expect(screen.getByRole('radio', {name: /Claro/})).toHaveAttribute('aria-checked', 'true');
  cleanup();
  expect(document.documentElement.dataset.theme).toBeUndefined();

  await openAdmin({...admin, theme_preference: 'light'});
  expect(document.documentElement.dataset.theme).toBe('light');
});

test('S07-TC-063 sin /me ni almacenamiento el tema funciona igual y avisa que no se guardó', async () => {
  routes(admin, {'/me': (body, method) => { if (method === 'PATCH') throw {status: 0, message: 'Sin conexión'}; return {data: admin}; }});
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloqueado'); });
  render(<AccountApp/>);
  // Fase T1 (D-104): el tema se elige en la pestaña Apariencia del panel de la cuenta.
  fireEvent.click(await screen.findByRole('button', {name: 'Cuenta de Ana Quispe'}));
  fireEvent.click(screen.getByRole('tab', {name: 'Apariencia'}));
  fireEvent.click(screen.getByRole('radio', {name: /Claro/}));

  expect(document.documentElement.dataset.theme).toBe('light');
  expect(await screen.findByText('Usamos el tema claro en este equipo, pero no pudimos guardarlo en tu cuenta.')).toBeInTheDocument();
});

test('S07-TC-064 el Inicio muestra los indicadores reales del dashboard', async () => {
  routes(admin);
  render(<AdminHome/>);

  expect(await screen.findByRole('heading', {name: 'Inicio'})).toBeInTheDocument();
  const requests = screen.getByRole('region', {name: 'Solicitudes'});
  expect(within(requests).getByText('5')).toBeInTheDocument();
  expect(within(requests).getByText('Enviadas').nextSibling).toHaveTextContent('2');
  expect(within(requests).getByText('Pendientes de disponibilidad').nextSibling).toHaveTextContent('1');
  expect(within(screen.getByRole('region', {name: 'Técnicos por verificar'})).getByText('3')).toBeInTheDocument();
  const users = screen.getByRole('region', {name: 'Usuarios nuevos'});
  expect(users).toHaveTextContent('3 en los últimos 7 días');
  expect(users).toHaveTextContent('7 en los últimos 30 días');
  expect(screen.getByRole('region', {name: 'Calificaciones'})).toHaveTextContent('No disponible hasta el Sprint 6');
});

test('S07-TC-065 el Inicio informa con honestidad cuando no hay datos o falla la consulta', async () => {
  const empty = {...dashboard, requests_total: 0, technicians_pending_verification: 0,
    requests_by_status: Object.fromEntries(Object.keys(dashboard.requests_by_status).map(k => [k, 0]))};
  let fail = true;
  request.mockImplementation(async () => { if (fail) throw {status: 0, message: 'No pudimos conectar.'}; return {data: empty}; });
  render(<AdminHome/>);

  expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos conectar.');
  fail = false;
  fireEvent.click(screen.getByRole('button', {name: 'Reintentar'}));

  expect(await screen.findByText('Aún no hay solicitudes registradas.')).toBeInTheDocument();
  expect(screen.getByText('No hay técnicos esperando verificación.')).toBeInTheDocument();
});

test('S07-TC-066 Verificación permite suspender con motivo y confirmación, y reactivar', async () => {
  const technician = {id: 4, display_name: 'Técnico sintético', status: 'active', verification_status: 'approved', version: 5,
    checklist: {}, services: [], districts: [], documents: [], reviews: []};
  const posted = [];
  request.mockImplementation(async (path, body) => {
    if (body) { posted.push([path, body]); return {data: {id: 4, status: path.endsWith('suspension') ? 'suspended' : 'active', version: 6}}; }
    if (path === '/admin/technicians/4') return {data: technician};
    return {data: [technician]};
  });
  render(<VerificationAdmin/>);
  fireEvent.click(await screen.findByRole('button', {name: /Técnico sintético/}));
  fireEvent.click(await screen.findByRole('button', {name: 'Suspender técnico'}));

  fireEvent.change(screen.getByLabelText('Motivo de la suspensión'), {target: {value: 'no'}});
  fireEvent.click(screen.getByRole('button', {name: 'Confirmar suspensión'}));
  expect(screen.getByText('Escribe un motivo de al menos 5 caracteres.')).toBeInTheDocument();
  expect(posted).toEqual([]);

  fireEvent.change(screen.getByLabelText('Motivo de la suspensión'), {target: {value: 'Reclamos verificados de dos clientes'}});
  fireEvent.click(screen.getByRole('button', {name: 'Confirmar suspensión'}));
  await waitFor(() => expect(posted).toEqual([['/admin/technicians/4/suspension', {reason: 'Reclamos verificados de dos clientes', expected_version: 5}]]));
  expect(await screen.findByText('Técnico suspendido. Sus sesiones se cerraron.')).toBeInTheDocument();
});

test('S07-TC-067 Mi perfil edita nombres y apellidos; las cuentas anteriores conservan Nombre completo', async () => {
  routes(admin);
  const onUpdate = vi.fn();
  render(<ProfilePage user={admin} onUpdate={onUpdate} onExpired={vi.fn()}/>);
  expect(screen.queryByLabelText('Nombre completo')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Nombres'), {target: {value: 'Ana Lucía'}});
  fireEvent.change(screen.getByLabelText('Teléfono'), {target: {value: '987654321'}});
  fireEvent.click(screen.getByRole('button', {name: 'Guardar perfil'}));

  await waitFor(() => expect(request).toHaveBeenCalledWith('/me', {given_names: 'Ana Lucía', family_names: 'Quispe', phone: '987654321', expected_version: 3}, 'PATCH'));
  expect(await screen.findByText('Cambios guardados correctamente.')).toBeInTheDocument();
  cleanup();

  render(<ProfilePage user={{...admin, given_names: null, family_names: null}} onUpdate={vi.fn()} onExpired={vi.fn()}/>);
  expect(screen.getByLabelText('Nombre completo')).toHaveAttribute('data-cy', 'profile-name');
});

test('S07-TC-068 la foto de perfil se sube como avatar, se aplica y se puede quitar', async () => {
  const sent = [];
  routes(admin, {
    '/media': body => { sent.push(['media', body.get('purpose'), body.get('file').name]); return {data: {id: 9, url: 'http://api.test/api/v1/media/9'}}; },
  });
  const onUpdate = vi.fn();
  render(<ProfilePage user={admin} onUpdate={onUpdate} onExpired={vi.fn()}/>);
  expect(screen.getByRole('img', {name: 'Iniciales de Ana Quispe'})).toHaveTextContent('AQ');

  fireEvent.change(screen.getByLabelText('Elegir foto'), {target: {files: [new File(['x'], 'nota.pdf', {type: 'application/pdf'})]}});
  expect(screen.getByRole('alert')).toHaveTextContent('Elige una imagen JPG, PNG o WebP de hasta 5 MB.');
  expect(sent).toEqual([]);

  fireEvent.change(screen.getByLabelText('Elegir foto'), {target: {files: [new File(['x'], 'foto.png', {type: 'image/png'})]}});

  await waitFor(() => expect(sent).toEqual([['media', 'avatar', 'foto.png']]));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/me', {avatar_media_id: 9, expected_version: 3}, 'PATCH'));
  expect(await screen.findByText('Foto de perfil actualizada.')).toBeInTheDocument();
});

test('S07-TC-069 el cambio de contraseña pide la actual y muestra el error del servidor en su campo', async () => {
  let attempt = 0;
  routes(admin, {'/me/password': () => {
    attempt++;
    if (attempt === 1) throw {status: 422, message: 'Revisa los campos indicados.', fields: {current_password: ['La contraseña actual no es correcta.']}};
    return {data: {message: 'Tu contraseña se actualizó. Cerramos tus otras sesiones.'}};
  }});
  render(<ProfilePage user={admin} onUpdate={vi.fn()} onExpired={vi.fn()}/>);
  const form = screen.getByRole('form', {name: 'Cambiar contraseña'});

  fireEvent.click(within(form).getByRole('button', {name: 'Cambiar contraseña'}));
  expect(within(form).getByText('Escribe tu contraseña actual.')).toBeInTheDocument();

  fireEvent.change(within(form).getByLabelText('Contraseña actual'), {target: {value: 'equivocada-1'}});
  fireEvent.change(within(form).getByLabelText('Nueva contraseña'), {target: {value: 'Abcdefgh12!x'}});
  fireEvent.change(within(form).getByLabelText('Confirmar nueva contraseña'), {target: {value: 'Abcdefgh12!x'}});
  expect(within(form).getByText('Seguridad: Fuerte')).toBeInTheDocument();
  fireEvent.click(within(form).getByRole('button', {name: 'Cambiar contraseña'}));
  expect(await within(form).findByText('La contraseña actual no es correcta.')).toBeInTheDocument();

  fireEvent.change(within(form).getByLabelText('Contraseña actual'), {target: {value: 'Correcta-123'}});
  fireEvent.click(within(form).getByRole('button', {name: 'Cambiar contraseña'}));
  expect(await within(form).findByText('Tu contraseña se actualizó. Cerramos tus otras sesiones.')).toBeInTheDocument();
  expect(request).toHaveBeenLastCalledWith('/me/password', {current_password: 'Correcta-123', password: 'Abcdefgh12!x', password_confirmation: 'Abcdefgh12!x'});
});

test('S07-TC-070 cliente y técnico usan la misma base con su contenido actual', async () => {
  const technician = {...admin, id: '8', role: {code: 'technician'}, permissions: [], technician_profile: {verification_status: 'pending', declared_subcategories: []}};
  window.history.replaceState(null, '', '/#cuenta/tecnico');
  routes(technician);
  render(<AccountApp/>);

  // Fase T2 del panel del técnico: menú propio (Trabajo, Mi negocio, Mi desempeño y Ayuda) sobre la misma base.
  const nav = await screen.findByRole('navigation', {name: 'Gestión del técnico'});
  expect(within(nav).getAllByRole('button')[0].querySelector('.panel-label').textContent).toBe('Inicio');
  expect(await screen.findByRole('heading', {level: 2, name: /^(Buenos días|Buenas tardes|Buenas noches), Ana$/})).toBeInTheDocument();
  expect(document.querySelector('[data-cy=portal-technician]')).toBeInTheDocument();
  await act(async () => {});
});

test('S07-TC-071 la campana y el menú del avatar se cierran con Escape desde su botón o con un clic fuera', async () => {
  // Defecto visto en las capturas de la Fase 1: Escape solo cerraba si el foco estaba dentro del popover.
  await openAdmin();
  const bell = await screen.findByRole('button', {name: 'Notificaciones: 2 sin leer'});
  fireEvent.click(bell);
  fireEvent.keyDown(bell, {key: 'Escape'});
  expect(screen.queryByRole('region', {name: 'Notificaciones recientes'})).not.toBeInTheDocument();
  expect(bell).toHaveAttribute('aria-expanded', 'false');
  expect(bell).toHaveFocus();

  fireEvent.click(bell);
  fireEvent.pointerDown(screen.getByRole('heading', {name: 'Inicio'}));
  expect(screen.queryByRole('region', {name: 'Notificaciones recientes'})).not.toBeInTheDocument();

  // Fase T1 (D-104): el avatar abre el panel de la cuenta; un clic dentro no lo cierra y un clic en el fondo sí.
  const avatar = screen.getByRole('button', {name: 'Cuenta de Ana Quispe'});
  fireEvent.click(avatar);
  fireEvent.mouseDown(within(screen.getByRole('dialog')).getByRole('tab', {name: 'Seguridad'}));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  fireEvent.mouseDown(document.querySelector('.account-overlay'));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
