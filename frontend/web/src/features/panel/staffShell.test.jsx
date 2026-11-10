import React from 'react';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import AccountApp, {staffTarget} from '../administration/AccountApp';
import {ConnectionStatus} from '../realtime/Realtime';
import {request} from '../administration/http';
// S05-TC-282 a 287 · Panel del técnico, Fase T1 (modo rápido, D-104 y D-105): el técnico y el administrador usan la base
// moderna del cliente (☰, campana, «Aa», panel de la cuenta con pestañas por rol), Seguridad con «Cerrar las otras
// sesiones», un solo indicador de conexión en la barra superior y ajustes guardados en /me/preferences.
vi.mock('../administration/http', () => ({request: vi.fn(), serverNow: () => Date.now()}));
vi.mock('../realtime/Realtime', async importOriginal => ({...(await importOriginal()), useRealtimeResource: () => false, RealtimeProvider: ({children}) => children}));
vi.mock('../administration/Sprint02Portal', () => ({default: () => <section><h2>Inicio del técnico</h2><ConnectionStatus connected={false}/></section>}));

const technician = {id: '8', name: 'Técnico Demo', given_names: 'Técnico', family_names: 'Demo', email: 'demo-tecnico@example.test', version: 2,
  theme_preference: 'light', sidebar_collapsed: null, avatar_url: null, role: {code: 'technician'}, permissions: [],
  preferences: {accessibility: {text_size: 130, high_contrast: false, readable_font: false, reduce_motion: false, strong_focus: false,
    read_aloud: false, dictation: false, simple_mode: false}, onboarding_completed_at: null, tour_completed_at: null},
  technician_profile: {verification_status: 'approved', status: 'active', declared_subcategories: []}};
const admin = {...technician, id: '7', name: 'Ana Quispe', given_names: 'Ana', family_names: 'Quispe', role: {code: 'admin'},
  permissions: ['catalog.manage'], technician_profile: undefined, preferences: undefined};
const items = [{id: 1, type: 'offer.created', title: 'Nueva solicitud para ti', body: '', read_at: null, category: 'offer'}];

function routes(user, extra = {}) {
  request.mockImplementation(async (path, body, method = body ? 'POST' : 'GET') => {
    const key = `${method} ${path}`;
    if (extra[key]) return extra[key](body);
    if (path === '/me' && method === 'GET') return {data: user};
    if (path.startsWith('/notifications')) return {data: {items, unread_count: 1, pagination: {page: 1, per_page: 20, total: 1, last_page: 1}}};
    return {data: []};
  });
}
const open = async (user, hash) => {
  window.history.replaceState(null, '', hash);
  render(<AccountApp/>);
  return screen.findByRole('button', {name: `Cuenta de ${user.name}`});
};
beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()}));
  try { localStorage.clear(); sessionStorage.clear(); } catch { /* sin almacenamiento */ }
});
afterEach(() => {
  cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); window.history.replaceState(null, '', '/');
  ['textSize', 'contrast', 'font', 'motion', 'focus', 'simple', 'theme'].forEach(name => delete document.documentElement.dataset[name]);
});

test('S05-TC-282 el técnico tiene la barra del cliente: ☰ junto al logo, campana, «Aa» y avatar, y abajo solo «Ir al sitio»', async () => {
  routes(technician);
  await open(technician, '/#cuenta/tecnico');
  const toggle = screen.getByRole('button', {name: 'Contraer menú'});
  expect(toggle.closest('.panel-brand-row')).not.toBeNull();
  const foot = document.querySelector('.panel-sidebar-foot');
  expect(foot.querySelectorAll('.panel-nav-item')).toHaveLength(1);
  expect(foot).toHaveTextContent('Ir al sitio');
  expect(within(foot).queryByText('Cerrar sesión')).not.toBeInTheDocument();
  expect(await screen.findByRole('button', {name: /Notificaciones: 1 sin leer/})).toBeInTheDocument();
  expect(screen.getByRole('button', {name: /accesibilidad/i})).toBeInTheDocument();
  expect(screen.getByRole('link', {name: 'Saltar al contenido'})).toBeInTheDocument();
  // D-105: los ajustes guardados en la cuenta se aplican al entrar.
  expect(document.documentElement.dataset.textSize).toBe('130');
});

test('S05-TC-283 el panel de la cuenta del técnico tiene sus 5 pestañas, su rol y «Avisos» como Próximamente', async () => {
  routes(technician);
  fireEvent.click(await open(technician, '/#cuenta/tecnico'));
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getAllByRole('tab').map(tab => tab.textContent)).toEqual(['Mi cuenta', 'Seguridad', 'Accesibilidad', 'Avisos', 'Apariencia']);
  expect(within(dialog).getByText('Especialista técnico')).toBeInTheDocument();
  expect(within(dialog).queryByText(/Plan (Free|Premium)/)).not.toBeInTheDocument();
  // Mi cuenta ya no repite la contraseña: va en Seguridad.
  expect(within(dialog).queryByRole('form', {name: 'Cambiar contraseña'})).not.toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('tab', {name: 'Avisos'}));
  expect(within(dialog).getByText('Próximamente')).toBeInTheDocument();
  expect(within(dialog).getByText(/sigue siendo de 10 minutos/)).toBeInTheDocument();
  expect(within(dialog).getByRole('button', {name: /Cerrar sesión/})).toHaveAttribute('data-cy', 'logout');
});

test('S05-TC-284 Seguridad cambia la contraseña y cierra las otras sesiones con confirmación y alertas de éxito y error', async () => {
  let fail = false;
  routes(technician, {'POST /me/sessions/revoke-others': () => {
    if (fail) throw {status: 500, message: 'No pudimos cerrar tus otras sesiones. Inténtalo de nuevo.'};
    return {data: {closed: 2, message: 'Cerramos 2 sesiones en otros equipos.'}};
  }});
  fireEvent.click(await open(technician, '/#cuenta/tecnico'));
  fireEvent.click(screen.getByRole('tab', {name: 'Seguridad'}));
  expect(screen.getByRole('form', {name: 'Cambiar contraseña'})).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', {name: 'Cerrar las otras sesiones'}));
  expect(request).not.toHaveBeenCalledWith('/me/sessions/revoke-others', {}, 'POST');
  const confirm = screen.getByRole('group', {name: 'Confirmar cierre de las otras sesiones'});
  fireEvent.click(within(confirm).getByRole('button', {name: 'Cancelar'}));
  expect(request).not.toHaveBeenCalledWith('/me/sessions/revoke-others', {}, 'POST');

  fireEvent.click(screen.getByRole('button', {name: 'Cerrar las otras sesiones'}));
  fireEvent.click(screen.getByRole('button', {name: 'Sí, cerrarlas'}));
  expect(await screen.findByText('Cerramos 2 sesiones en otros equipos.')).toBeInTheDocument();
  // DEF-62: el foco vuelve al botón, así Esc sigue cerrando el panel de la cuenta.
  expect(screen.getByRole('button', {name: 'Cerrar las otras sesiones'})).toHaveFocus();
  expect(request).toHaveBeenCalledWith('/me/sessions/revoke-others', {}, 'POST');

  fail = true;
  fireEvent.click(screen.getByRole('button', {name: 'Cerrar las otras sesiones'}));
  fireEvent.click(screen.getByRole('button', {name: 'Sí, cerrarlas'}));
  expect(await screen.findByText('No pudimos cerrar tus otras sesiones. Inténtalo de nuevo.')).toBeInTheDocument();
});

test('S05-TC-285 hay un solo indicador de conexión, en la barra superior, con texto y no solo color', async () => {
  routes(technician);
  await open(technician, '/#cuenta/tecnico');
  expect(await screen.findByRole('heading', {name: 'Inicio del técnico'})).toBeInTheDocument();
  const indicator = await waitFor(() => {
    const element = document.querySelector('[data-cy=connection]');
    expect(element).not.toBeNull();
    return element;
  });
  expect(indicator.closest('.panel-topbar')).not.toBeNull();
  expect(indicator).toHaveAttribute('data-state', 'offline');
  expect(indicator).toHaveTextContent('Sin conexión en tiempo real. Actualiza para ver cambios.');
  // La página ya no repite su aviso dentro del panel.
  expect(screen.getAllByText('Sin conexión en tiempo real. Actualiza para ver cambios.')).toHaveLength(1);
  cleanup();

  // Fuera del panel (p. ej. una vista suelta), ConnectionStatus sigue mostrando su aviso.
  render(<ConnectionStatus connected/>);
  expect(screen.getByRole('status')).toHaveTextContent('Conexión en tiempo real activa.');
});

test('S05-TC-286 el administrador tiene sus 4 pestañas y guarda la accesibilidad en /me/preferences [D-105]', async () => {
  routes(admin, {'PUT /me/preferences': body => ({data: {accessibility: {text_size: 100, ...body.accessibility}}})});
  fireEvent.click(await open(admin, '/#cuenta/administrador'));
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getAllByRole('tab').map(tab => tab.textContent)).toEqual(['Mi cuenta', 'Seguridad', 'Accesibilidad', 'Apariencia']);
  fireEvent.click(within(dialog).getByRole('tab', {name: 'Accesibilidad'}));
  fireEvent.click(within(dialog).getByRole('switch', {name: /Alto contraste/}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/me/preferences', {accessibility: {high_contrast: true}}, 'PUT'));
  expect(document.documentElement.dataset.contrast).toBe('high');
  expect(request).not.toHaveBeenCalledWith('/client/me/preferences', expect.anything(), 'PUT');
});

test('S05-TC-287 la campana del técnico abre la página completa de Notificaciones y cada aviso lleva a su sección', async () => {
  routes(technician);
  await open(technician, '/#cuenta/tecnico');
  fireEvent.click(await screen.findByRole('button', {name: /Notificaciones: 1 sin leer/}));
  fireEvent.click(screen.getByRole('button', {name: /Ver todas/}));
  expect(await screen.findByRole('heading', {name: 'Notificaciones'})).toBeInTheDocument();
  await act(async () => {});
  // Hasta la T2 lo del técnico vive en su Inicio; el administrador abre Comunicados desde un comunicado.
  cleanup();
  // El estado vacío habla de lo que recibe cada rol, no de las solicitudes del cliente.
  routes(admin, {'GET /notifications': () => ({data: {items: [], unread_count: 0}})});
  await open(admin, '/#cuenta/administrador');
  fireEvent.click(await screen.findByRole('button', {name: 'Notificaciones: 0 sin leer'}));
  expect(screen.getByText('Te avisaremos aquí cuando haya algo que revisar en la plataforma.')).toBeInTheDocument();
  expect(staffTarget('technician', {type: 'offer.created'})).toEqual(['home']);
  expect(staffTarget('technician', {type: 'technician.verification.approved'})).toEqual(['home']);
  expect(staffTarget('admin', {type: 'announcement.published'})).toEqual(['announcements']);
  expect(staffTarget('admin', {type: 'user.blocked'})).toBeNull();
});
