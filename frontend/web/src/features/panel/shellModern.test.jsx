import React from 'react';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import PanelShell from './PanelShell';
import {FaqPage, FavoritesPage, HowItWorksPage, PremiumPage, PrivacyPage, SpecialtiesPage} from '../client/ClientPages';
import {LocationStep} from '../requests/order/OrderSteps';
import {request} from '../administration/http';
// S05-TC-222 a 231 · Fase 4 del panel final (modo rápido): barra superior, menú nuevo, campana, «Aa», panel del avatar
// con 5 pestañas, páginas de Descubre y Ayuda, Premium con candado y direcciones guardadas en el asistente.
vi.mock('../administration/http', () => ({request: vi.fn(), serverNow: () => Date.now()}));
vi.mock('../realtime/Realtime', () => ({useRealtimeResource: () => {}}));

const user = {id: '5', name: 'Cliente Demo', given_names: 'Cliente', family_names: 'Demo', version: 4, sidebar_collapsed: null,
  theme_preference: 'light', role: {code: 'client'}, client_profile: {client_type: 'household', district_id: 1, reference_address: null}};
const page = label => () => <section aria-label={label}><h2>{label}</h2><p>Contenido de {label}.</p></section>;
const sections = [
  {id: 'home', label: 'Inicio', icon: 'home', render: page('Inicio')},
  {id: 'favorites', group: 'Servicios', label: 'Técnicos favoritos', icon: 'heart', render: page('Favoritos')},
  {id: 'appointments', group: 'Servicios', label: 'Mis citas', icon: 'calendar', soon: true},
  {id: 'equipment', group: 'Mi hogar / Mi negocio · Premium', label: 'Mis equipos', icon: 'monitor', premium: true},
  {id: 'premium', nav: false, label: 'Plan Premium', icon: 'star', render: ({intent}) => <PremiumPage intent={intent}/>},
  {id: 'notifications', nav: false, label: 'Notificaciones', icon: 'bell', render: page('Notificaciones')},
];
let addresses;
function routes(extra = {}) {
  request.mockImplementation(async (path, body, method = body ? 'POST' : 'GET') => {
    const key = `${method} ${path}`;
    if (extra[key]) return extra[key](body);
    if (path.startsWith('/notifications')) return {data: {items: [{id: 1, title: 'Elige a tu técnico', read_at: null}], unread_count: 1}};
    if (path === '/client/addresses') return {data: {items: addresses}};
    if (path === '/client/me/communication') return {data: {contact_channel: 'app', notify_before_arrival: true, prefer_messages: false}};
    if (path === '/catalog/districts') return {data: [{id: 1, name: 'Huancayo'}, {id: 2, name: 'El Tambo'}]};
    if (path === '/me' && method === 'PATCH') return {data: {...user, ...body, version: 5}};
    return {data: []};
  });
}
const shell = (props = {}) => render(<PanelShell user={user} role="client" roleLabel="Cliente" navLabel="Gestión del cliente"
  sections={sections} onLogout={props.onLogout || vi.fn()} onUserChange={vi.fn()} modern {...props}/>);
beforeEach(() => {
  addresses = [];
  vi.stubGlobal('matchMedia', () => ({matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()}));
  try { localStorage.clear(); sessionStorage.clear(); } catch { /* sin almacenamiento */ }
});
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); });

test('S05-TC-222 el ☰ junto al logo contrae el menú, lo guarda en la cuenta y ya no hay «Contraer menú» abajo', async () => {
  routes();
  const {container} = shell();
  const toggle = screen.getByRole('button', {name: 'Contraer menú'});
  expect(toggle.closest('.panel-brand-row')).toContainElement(container.querySelector('.panel-brand'));
  expect(container.querySelectorAll('.panel-sidebar-foot .panel-nav-item')).toHaveLength(1);
  expect(container.querySelector('.panel-sidebar-foot')).toHaveTextContent('Ir al sitio');

  fireEvent.click(toggle);
  expect(container.querySelector('.panel-shell')).toHaveClass('is-collapsed');
  expect(screen.getByRole('button', {name: 'Expandir menú'})).toHaveAttribute('aria-expanded', 'false');
  await waitFor(() => expect(request).toHaveBeenCalledWith('/me', {sidebar_collapsed: true, expected_version: 4}, 'PATCH'));
  cleanup();

  render(<PanelShell user={{...user, sidebar_collapsed: true}} role="client" roleLabel="Cliente" navLabel="Gestión del cliente"
    sections={sections} onLogout={vi.fn()} onUserChange={vi.fn()} modern/>);
  expect(document.querySelector('.panel-shell')).toHaveClass('is-collapsed');
});

test('S05-TC-223 lo que no está listo dice «Próximamente» y no navega; lo premium tiene candado y abre el plan', async () => {
  routes();
  shell();
  const nav = screen.getByRole('navigation', {name: 'Gestión del cliente'});
  expect(within(nav).queryByText('Notificaciones')).not.toBeInTheDocument();
  const soon = within(nav).getByRole('button', {name: /Mis citas/});
  expect(soon).toHaveAttribute('aria-disabled', 'true');
  expect(soon).toHaveTextContent('Próximamente');
  fireEvent.click(soon);
  expect(screen.getByRole('region', {name: 'Inicio'})).toBeInTheDocument();

  const locked = within(nav).getByRole('button', {name: /Mis equipos/});
  expect(within(locked).getByRole('img', {name: 'Solo Premium'})).toBeInTheDocument();
  fireEvent.click(locked);
  const premium = await screen.findByRole('region', {name: 'Plan Premium'});
  expect(premium).toHaveTextContent('«Mis equipos» es parte del plan Premium');
  expect(premium).toHaveTextContent('Precio: Por definir');
  expect(premium).toHaveTextContent('no hay pagos en la aplicación');
});

test('S05-TC-224 la campana marca todas como leídas y «Ver todas» abre Notificaciones', async () => {
  routes({'POST /notifications/read-all': () => ({data: {updated: 1}})});
  shell();
  fireEvent.click(await screen.findByRole('button', {name: 'Notificaciones: 1 sin leer'}));
  const popover = screen.getByRole('region', {name: 'Notificaciones recientes'});
  fireEvent.click(within(popover).getByRole('button', {name: 'Marcar todas como leídas'}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/notifications/read-all', {}));
  fireEvent.click(within(popover).getByRole('button', {name: 'Ver todas las notificaciones'}));
  expect(await screen.findByRole('region', {name: 'Notificaciones'})).toBeInTheDocument();
});

test('S05-TC-225 «Aa» cambia el tamaño de texto, el alto contraste y lee la pantalla en voz alta en es-PE', async () => {
  const speak = vi.fn(), cancel = vi.fn();
  vi.stubGlobal('speechSynthesis', {speak, cancel});
  vi.stubGlobal('SpeechSynthesisUtterance', function Utterance(text) { this.text = text; });
  routes();
  shell();
  fireEvent.click(screen.getByRole('button', {name: 'Accesibilidad rápida'}));
  const panel = screen.getByRole('region', {name: 'Accesibilidad rápida'});
  fireEvent.click(within(panel).getByRole('button', {name: '130 %'}));
  expect(document.documentElement.dataset.textSize).toBe('130');
  expect(within(panel).getByRole('button', {name: '130 %'})).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(within(panel).getByRole('switch', {name: 'Alto contraste'}));
  expect(document.documentElement.dataset.contrast).toBe('high');
  // Fase 5 (D-97): la copia local usa las claves de la cuenta y cada cambio se guarda con PUT /client/me/preferences.
  expect(JSON.parse(localStorage.getItem('tecnicoya.accesibilidad'))).toMatchObject({text_size: 130, high_contrast: true});
  await waitFor(() => expect(request).toHaveBeenCalledWith('/client/me/preferences', {accessibility: {high_contrast: true}}, 'PUT'));

  fireEvent.click(within(panel).getByRole('button', {name: 'Leer la pantalla en voz alta'}));
  expect(speak).toHaveBeenCalledTimes(1);
  expect(speak.mock.calls[0][0]).toMatchObject({lang: 'es-PE'});
  expect(speak.mock.calls[0][0].text).toContain('Contenido de Inicio.');
  fireEvent.click(within(panel).getByRole('button', {name: 'Detener la lectura'}));
  expect(cancel).toHaveBeenCalled();
});

test('S05-TC-226 el avatar abre un diálogo con 5 pestañas que atrapa el foco, se cierra con Esc y devuelve el foco', async () => {
  routes();
  const onLogout = vi.fn();
  shell({onLogout});
  const avatar = screen.getByRole('button', {name: 'Cuenta de Cliente Demo'});
  fireEvent.click(avatar);
  const dialog = screen.getByRole('dialog', {name: 'Tu cuenta'});
  const tabs = within(dialog).getAllByRole('tab');
  expect(tabs.map(tab => tab.textContent)).toEqual(['Mi cuenta', 'Mis direcciones', 'Accesibilidad', 'Comunicación', 'Apariencia']);
  expect(tabs[0]).toHaveFocus();
  fireEvent.keyDown(tabs[0], {key: 'ArrowRight'});
  expect(within(dialog).getByRole('tab', {name: 'Mis direcciones'})).toHaveAttribute('aria-selected', 'true');
  expect(within(dialog).getByRole('tab', {name: 'Mis direcciones'})).toHaveFocus();

  const logout = within(dialog).getByRole('button', {name: 'Cerrar sesión'});
  logout.focus();
  fireEvent.keyDown(dialog, {key: 'Tab'});
  expect(within(dialog).getByRole('button', {name: 'Cerrar panel de la cuenta'})).toHaveFocus();
  fireEvent.click(logout);
  expect(onLogout).toHaveBeenCalled();
  fireEvent.keyDown(dialog, {key: 'Escape'});
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(avatar).toHaveFocus();
});

test('S05-TC-227 Mis direcciones valida en el cliente, guarda con alerta y pide confirmación antes de eliminar', async () => {
  const created = vi.fn(body => { addresses = [{id: 3, ...body, label: 'Casa', district_name: 'Huancayo', is_default: true, version: 1}]; return {data: addresses[0]}; });
  const removed = vi.fn(() => { addresses = []; return null; });
  routes({'POST /client/addresses': created, 'DELETE /client/addresses/3': removed});
  shell();
  fireEvent.click(screen.getByRole('button', {name: 'Cuenta de Cliente Demo'}));
  fireEvent.click(screen.getByRole('tab', {name: 'Mis direcciones'}));
  fireEvent.click(await screen.findByRole('button', {name: 'Agregar dirección'}));
  const form = screen.getByRole('form', {name: 'Nueva dirección'});
  fireEvent.click(within(form).getByRole('button', {name: 'Guardar dirección'}));
  expect(within(form).getByText('Elige un distrito.')).toBeInTheDocument();
  expect(within(form).getByText('La dirección debe tener de 5 a 255 caracteres.')).toBeInTheDocument();
  expect(created).not.toHaveBeenCalled();
  fireEvent.click(within(form).getByLabelText('Otra'));
  fireEvent.click(within(form).getByRole('button', {name: 'Guardar dirección'}));
  expect(within(form).getByText('Ponle un nombre a la dirección (hasta 40 caracteres).')).toBeInTheDocument();
  fireEvent.click(within(form).getByLabelText('Casa'));

  await within(form).findByRole('option', {name: 'Huancayo'});
  fireEvent.change(within(form).getByLabelText('Distrito'), {target: {value: '1'}});
  fireEvent.change(within(form).getByLabelText('Dirección'), {target: {value: 'Jr. Sintético 742'}});
  fireEvent.click(within(form).getByRole('button', {name: 'Guardar dirección'}));
  expect(await screen.findByText('Dirección guardada.')).toBeInTheDocument();
  expect(created).toHaveBeenCalledWith({kind: 'home', label: null, district_id: 1, address: 'Jr. Sintético 742', reference: null, is_default: false});

  fireEvent.click(await screen.findByRole('button', {name: 'Eliminar Casa'}));
  expect(removed).not.toHaveBeenCalled();
  const confirm = screen.getByRole('group', {name: 'Confirmar eliminación de Casa'});
  fireEvent.click(within(confirm).getByRole('button', {name: 'Sí, eliminar'}));
  expect(await screen.findByText('Eliminaste «Casa».')).toBeInTheDocument();
  expect(removed).toHaveBeenCalled();
});

test('S05-TC-228 Comunicación guarda las preferencias con su alerta y Apariencia cambia el tema', async () => {
  const saved = vi.fn(body => ({data: body}));
  routes({'PUT /client/me/communication': saved});
  shell();
  fireEvent.click(screen.getByRole('button', {name: 'Cuenta de Cliente Demo'}));
  fireEvent.click(screen.getByRole('tab', {name: 'Comunicación'}));
  fireEvent.click(await screen.findByLabelText('Por llamada'));
  fireEvent.click(screen.getByLabelText('Prefiero mensajes antes que llamadas'));
  fireEvent.click(screen.getByRole('button', {name: 'Guardar preferencias'}));
  expect(await screen.findByText('Preferencias de comunicación guardadas.')).toBeInTheDocument();
  expect(saved).toHaveBeenCalledWith({contact_channel: 'call', notify_before_arrival: true, prefer_messages: true});
  expect(screen.getByRole('tabpanel')).toHaveTextContent('No pedimos datos de salud.');

  fireEvent.click(screen.getByRole('tab', {name: 'Apariencia'}));
  fireEvent.click(screen.getByLabelText('Oscuro'));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/me', {theme_preference: 'dark', expected_version: 4}, 'PATCH'));
  expect(document.documentElement.dataset.theme).toBe('dark');
});

test('S05-TC-229 Especialidades, Cómo funciona, Preguntas frecuentes y Privacidad tienen contenido y ninguna queda vacía', async () => {
  request.mockImplementation(async path => {
    if (path === '/catalog/specialties') return {data: [{id: 2, name: 'Refrigeración comercial'}]};
    if (path.startsWith('/catalog/subcategories')) return {data: [{id: 9, name: 'Vitrinas'}, {id: 10, name: 'Cámaras de frío'}]};
    if (path === '/client/home') return {data: {prices: [{specialty_id: 2, from_fee: '90.00'}]}};
    return {data: []};
  });
  const navigate = vi.fn();
  const {unmount} = render(<SpecialtiesPage navigate={navigate}/>);
  const card = await screen.findByRole('article', {name: 'Refrigeración comercial'});
  expect(await within(card).findByText('Desde S/ 90.00')).toBeInTheDocument();
  expect(await within(card).findByText('Cámaras de frío')).toBeInTheDocument();
  fireEvent.click(within(card).getByRole('button', {name: 'Ver técnicos de Refrigeración comercial'}));
  expect(navigate).toHaveBeenCalledWith('search', {filters: {specialty_id: '2'}});
  unmount();

  render(<><HowItWorksPage navigate={navigate}/><FaqPage/><PrivacyPage/></>);
  expect(screen.getAllByText(/^Paso \d$/)).toHaveLength(4);
  expect(screen.getAllByRole('group').length).toBeGreaterThanOrEqual(6);
  expect(screen.getByText('Borrador para revisión del equipo: este texto todavía no es la versión final.')).toBeInTheDocument();
  expect(screen.getByRole('region', {name: 'Privacidad y términos'})).toHaveTextContent('Ley N.° 29733');
});

test('S05-TC-230 Técnicos favoritos lista los guardados, quita uno con alerta y sin favoritos lleva a Buscar técnicos', async () => {
  const card = {id: 7, display_name: 'Rosa Quispe', experience_years: 9, verified: true, favorite: true, specialties: [{id: 2, name: 'Refrigeración comercial'}],
    rating: {average: null, count: 0}, sample_rating: null, services: [{subcategory_id: 9, subcategory_name: 'Vitrinas', reference_fee: '120.00'}], districts: []};
  request.mockImplementation(async (path, body, method = body ? 'POST' : 'GET') => {
    if (path === '/client/favorites') return {data: {items: [card]}};
    if (method === 'DELETE') return null;
    return {data: []};
  });
  const navigate = vi.fn();
  render(<FavoritesPage navigate={navigate}/>);
  fireEvent.click(await screen.findByRole('button', {name: 'Quitar a Rosa Quispe de favoritos'}));
  expect(await screen.findByText('Quitaste a Rosa Quispe de tus favoritos.')).toBeInTheDocument();
  expect(request).toHaveBeenCalledWith('/client/favorites/7', null, 'DELETE');
  fireEvent.click(screen.getByRole('button', {name: 'Buscar técnicos'}));
  expect(navigate).toHaveBeenCalledWith('search');
});

test('S05-TC-231 el paso 4 del asistente ofrece las direcciones guardadas y las copia al elegirlas', async () => {
  request.mockResolvedValue({data: {items: [{id: 3, kind: 'business', label: 'Negocio', district_id: 2, district_name: 'El Tambo',
    address: 'Av. Sintética 100', reference: 'Frente al mercado', is_default: true}]}});
  const onField = vi.fn();
  render(<LocationStep state={{district_id: '', address: '', address_reference: '', mode: 'immediate', date: '', slot: ''}}
    districts={[{id: 1, name: 'Huancayo'}, {id: 2, name: 'El Tambo'}]} onField={onField} errors={{}}/>);
  const saved = await screen.findByRole('group', {name: 'Mis direcciones'});
  fireEvent.click(within(saved).getByRole('button', {name: /Negocio/}));
  expect(onField.mock.calls).toEqual([['district_id', '2'], ['address', 'Av. Sintética 100'], ['address_reference', 'Frente al mercado']]);
});
