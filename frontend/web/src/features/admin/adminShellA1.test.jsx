// S07-TC-153 a 162 · Panel del administrador, Fase A1 (PLAN-PANEL-ADMIN.md): menú agrupado en 6 grupos más Próximamente y
// Ayuda, filtrado por permisos (D-119), contadores de Verificación, Solicitudes sin técnico y Alertas operativas (D-118),
// secciones en preparación sin enlaces rotos, bienvenida y tutorial de 5 pasos (D-117) y los 8 ajustes de accesibilidad.
import React from 'react';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import AccountApp from '../administration/AccountApp';
import {request} from '../administration/http';

vi.mock('../administration/http', () => ({request: vi.fn(), serverNow: () => Date.now()}));
vi.mock('../administration/CatalogAdmin', () => ({default: () => <h2>Administrar catálogo</h2>}));
vi.mock('./KeywordsAdmin', () => ({default: () => <h2>Diccionario del buscador</h2>}));
vi.mock('../administration/VerificationAdmin', () => ({default: () => <h2>Verificación de técnicos</h2>}));
vi.mock('../administration/AnnouncementsAdmin', () => ({default: () => <h2>Administrar comunicados</h2>}));

const ALL = ['dashboard.view', 'users.manage', 'technicians.verify', 'catalog.manage', 'announcements.manage', 'requests.intervene',
  'audit.view', 'content.manage'];
const SEEN = {onboarding_completed_at: '2026-11-20T15:00:00.000Z', tour_completed_at: '2026-11-20T15:00:00.000Z'};
const admin = (overrides = {}) => ({id: 7, name: 'Ana Quispe', given_names: 'Ana', family_names: 'Quispe', version: 3, role: {code: 'admin'},
  theme_preference: 'light', avatar_url: null, permissions: ALL, preferences: {accessibility: null, ...SEEN}, ...overrides});
const dashboard = (badges = {verification_pending: 3, requests_unassigned: 1, operational_alerts: 2}) => ({requests_by_status: {sent: 1},
  requests_total: 1, technicians_pending_verification: badges.verification_pending, announcements_active: 0, badges,
  new_users: {last_7_days: {client: 0, technician: 0, admin: 0, total: 0}, last_30_days: {client: 0, technician: 0, admin: 0, total: 0}},
  ratings: {available: false, average: null, count: 0, available_from: 'Sprint 6'}, recent_events: [], generated_at: '2026-11-25T15:00:00.000Z'});

let state;
beforeEach(() => {
  window.history.replaceState(null, '', '/#cuenta/administrador');
  vi.stubGlobal('matchMedia', () => ({matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()}));
  try { localStorage.clear(); sessionStorage.clear(); } catch { /* sin almacenamiento */ }
  state = {user: admin(), dashboard: dashboard()};
  request.mockImplementation(async (path, body, method = 'GET') => {
    if (path === '/me') return {data: state.user};
    if (path === '/admin/dashboard') return {data: state.dashboard};
    // S07-TC-157 abre Solicitudes: su lista paginada vacía (sin ella, RequestsAdmin fallaba fuera de la prueba).
    if (path.startsWith('/admin/requests')) return {data: {items: [], page: 1, per_page: 20, total: 0}};
    if (path === '/me/preferences' && method === 'PUT') return {data: {...SEEN}};
    if (path.startsWith('/notifications')) return {data: {items: [], unread_count: 0}};
    return {data: []};
  });
});
afterEach(() => {
  cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); window.history.replaceState(null, '', '/');
  ['textSize', 'contrast', 'font', 'motion', 'focus', 'simple', 'theme'].forEach(name => delete document.documentElement.dataset[name]);
});

const openAdmin = async (user = admin()) => {
  state.user = user;
  render(<AccountApp/>);
  return screen.findByRole('navigation', {name: 'Administración'});
};
const groupsOf = nav => within(nav).getAllByRole('group').map(group => [group.querySelector('.panel-nav-heading').textContent,
  [...group.querySelectorAll('.panel-nav-item')].map(item => item.querySelector('.panel-label').firstChild.textContent)]);

test('S07-TC-153 el menú agrupa todas las secciones en General, Operación, Personas, Negocio, Contenido, Control, Próximamente y Ayuda', async () => {
  const nav = await openAdmin();
  expect(groupsOf(nav)).toEqual([
    ['General', ['Inicio']],
    ['Operación', ['Solicitudes', 'Emparejamiento en vivo', 'Alertas operativas']],
    ['Personas', ['Usuarios', 'Verificación de técnicos', 'Desempeño de técnicos']],
    ['Negocio', ['Catálogo', 'Zonas y tarifas de referencia', 'Planes y Premium', 'Promociones', 'IoT']],
    ['Contenido', ['Comunicados', 'Palabras clave del buscador', 'Preguntas frecuentes y consejos']],
    ['Control', ['Estadísticas e informes', 'Auditoría', 'Reglas del negocio']],
    ['Próximamente', ['Reseñas', 'Incidencias', 'Pagos']],
    ['Ayuda', ['Cómo funciona el panel']],
  ]);
  // Un ícono SVG por ítem, de una sola familia.
  expect(nav.querySelectorAll('.panel-nav-item .panel-nav-icon svg')).toHaveLength(22);
});

test('S07-TC-154 Reseñas, Incidencias y Pagos son «Próximamente»: aria-disabled, con su sprint y sin navegar', async () => {
  const nav = await openAdmin();
  const soon = within(nav).getAllByRole('group').find(group => group.querySelector('.panel-nav-heading').textContent === 'Próximamente');
  const items = [...soon.querySelectorAll('.panel-nav-item')];
  expect(items.map(item => item.getAttribute('aria-disabled'))).toEqual(['true', 'true', 'true']);
  expect(items.map(item => item.textContent)).toEqual(['ReseñasSprint 6', 'IncidenciasSprint 7', 'PagosSprint 8']);
  const before = screen.getByRole('heading', {level: 2}).textContent;
  fireEvent.click(items[2]);
  expect(screen.getByRole('heading', {level: 2})).toHaveTextContent(before);
  expect(items[2]).not.toHaveAttribute('aria-current');
});

test('S07-TC-155 el menú depende de los permisos: sin grupos vacíos ni secciones sin permiso [D-119]', async () => {
  let nav = await openAdmin(admin({permissions: ['catalog.manage']}));
  expect(groupsOf(nav)).toEqual([['Negocio', ['Catálogo']], ['Contenido', ['Palabras clave del buscador']], ['Ayuda', ['Cómo funciona el panel']]]);
  cleanup();

  nav = await openAdmin(admin({permissions: ALL.filter(code => !['audit.view', 'content.manage', 'users.manage'].includes(code))}));
  const labels = groupsOf(nav).flatMap(([, list]) => list);
  expect(labels).not.toContain('Auditoría');
  expect(labels).not.toContain('Preguntas frecuentes y consejos');
  expect(labels).not.toContain('Usuarios');
  expect(labels).not.toContain('Planes y Premium');
  expect(labels).toContain('Promociones');
  expect(labels).toContain('Reglas del negocio');
});

test('S07-TC-156 los contadores de Verificación, Solicitudes sin técnico y Alertas operativas son accesibles; sin umbrales no hay contador de alertas [D-118]', async () => {
  const nav = await openAdmin();
  await waitFor(() => expect(within(nav).getByRole('button', {name: 'Verificación de técnicos'}))
    .toHaveAccessibleDescription('3 técnicos por verificar'));
  expect(within(nav).getByRole('button', {name: 'Solicitudes'})).toHaveAccessibleDescription('1 solicitud sin técnico');
  expect(within(nav).getByRole('button', {name: 'Alertas operativas'})).toHaveAccessibleDescription('2 alertas operativas');
  cleanup();

  state.dashboard = dashboard({verification_pending: 0, requests_unassigned: 0, operational_alerts: null});
  const quiet = await openAdmin();
  await waitFor(() => expect(request).toHaveBeenCalledWith('/admin/dashboard'));
  expect(within(quiet).getByRole('button', {name: 'Alertas operativas'})).not.toHaveAccessibleDescription();
  expect(quiet.querySelector('[data-section="alerts"] .panel-nav-badge')).toBeNull();
});

test('S07-TC-157 una sección en preparación tiene encabezado, estado vacío con ilustración y un camino a una sección disponible', async () => {
  const nav = await openAdmin();
  fireEvent.click(within(nav).getByRole('button', {name: 'Emparejamiento en vivo'}));
  const page = await screen.findByRole('region', {name: 'Emparejamiento en vivo'});
  expect(page.querySelector('.cx-head-icon svg')).not.toBeNull();
  expect(within(page).getByText('Estamos preparando esta sección.')).toBeInTheDocument();
  expect(page.querySelector('svg.cx-art')).not.toBeNull();
  // Nada de texto de desarrollo para el usuario (DEF-78).
  expect(page.textContent).not.toMatch(/Fase|Sprint|TODO|desarrollo/);
  fireEvent.click(within(page).getByRole('button', {name: 'Ir a Solicitudes'}));
  expect(within(nav).getByRole('button', {name: 'Solicitudes'})).toHaveAttribute('aria-current', 'page');
});

test('S07-TC-158 la primera vez el administrador ve la bienvenida y luego el tutorial; después ya no [D-117]', async () => {
  await openAdmin(admin({preferences: {accessibility: null, onboarding_completed_at: null, tour_completed_at: null}}));
  const welcome = await screen.findByRole('dialog', {name: '¿Cómo prefieres usar TécnicoYa?'});
  fireEvent.click(within(welcome).getByRole('button', {name: 'Omitir'}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/me/preferences', {onboarding_completed: true}, 'PUT'));
  expect(await screen.findByText('Paso 1 de 5')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: 'Omitir tutorial'}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/me/preferences', {tour_completed: true}, 'PUT'));
  cleanup();

  await openAdmin();
  expect(screen.queryByRole('dialog', {name: '¿Cómo prefieres usar TécnicoYa?'})).not.toBeInTheDocument();
  expect(screen.queryByText(/Paso 1 de/)).not.toBeInTheDocument();
});

test('S07-TC-159 el tutorial del administrador tiene 5 pasos: menú, Inicio, Solicitudes, Usuarios y «Aa» con tu cuenta [D-117]', async () => {
  await openAdmin(admin({preferences: {accessibility: null, onboarding_completed_at: SEEN.onboarding_completed_at, tour_completed_at: null}}));
  const titles = [];
  for (let step = 1; step <= 5; step += 1) {
    expect(await screen.findByText(`Paso ${step} de 5`)).toBeInTheDocument();
    titles.push(screen.getByRole('dialog').querySelector('#tour-title').textContent);
    fireEvent.click(screen.getByRole('button', {name: step === 5 ? 'Terminar' : 'Siguiente'}));
  }
  expect(titles).toEqual(['El menú', 'Inicio y tareas pendientes', 'Solicitudes y emparejamiento', 'Usuarios y verificación', '«Aa» y tu cuenta']);
  await waitFor(() => expect(request).toHaveBeenCalledWith('/me/preferences', {tour_completed: true}, 'PUT'));
});

test('S07-TC-160 «Cómo funciona el panel» repite el tutorial sin volver a marcarlo [D-117]', async () => {
  const nav = await openAdmin();
  fireEvent.click(within(nav).getByRole('button', {name: 'Cómo funciona el panel'}));
  const page = await screen.findByRole('region', {name: 'Cómo funciona el panel'});
  fireEvent.click(within(page).getByRole('button', {name: 'Ver el tutorial otra vez'}));
  expect(await screen.findByText('Paso 1 de 5')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: 'Omitir tutorial'}));
  await waitFor(() => expect(screen.queryByText('Paso 1 de 5')).not.toBeInTheDocument());
  expect(request).not.toHaveBeenCalledWith('/me/preferences', {tour_completed: true}, 'PUT');
});

test('S07-TC-161 «Tu cuenta › Accesibilidad» del administrador tiene los 8 ajustes, como el cliente y el técnico', async () => {
  await openAdmin();
  fireEvent.click(screen.getByRole('button', {name: 'Cuenta de Ana Quispe'}));
  const dialog = screen.getByRole('dialog');
  fireEvent.click(within(dialog).getByRole('tab', {name: 'Accesibilidad'}));
  // Ajuste 1: tamaño de texto; ajustes 2 a 8: los 7 interruptores.
  const sizes = within(dialog).getAllByRole('group', {name: 'Tamaño de texto'}).at(-1);
  expect(within(sizes).getAllByRole('button').length).toBeGreaterThanOrEqual(3);
  expect(within(dialog).getAllByRole('switch').map(item => item.closest('label').querySelector('span').firstChild.textContent)).toEqual([
    'Alto contraste', 'Fuente legible y más espacio', 'Reducir animaciones', 'Foco grueso y enlaces subrayados', 'Leer en voz alta',
    'Dictar por voz', 'Modo simple']);
});

test('S07-TC-162 Catálogo y Palabras clave del buscador son secciones separadas, cada una con su encabezado', async () => {
  const nav = await openAdmin();
  fireEvent.click(within(nav).getByRole('button', {name: 'Catálogo'}));
  expect(await screen.findByRole('heading', {name: 'Administrar catálogo'})).toBeInTheDocument();
  expect(screen.queryByRole('tab', {name: 'Palabras clave'})).not.toBeInTheDocument();
  fireEvent.click(within(nav).getByRole('button', {name: 'Palabras clave del buscador'}));
  expect(await screen.findByRole('heading', {name: 'Diccionario del buscador'})).toBeInTheDocument();
  expect(within(nav).getByRole('button', {name: 'Palabras clave del buscador'})).toHaveAttribute('aria-current', 'page');
});
