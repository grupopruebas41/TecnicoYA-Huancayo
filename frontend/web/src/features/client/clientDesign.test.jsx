import React from 'react';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {afterEach, expect, test, vi} from 'vitest';
import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import TechnicianSearch from '../matching/TechnicianSearch';
import TechnicianProfile from '../matching/TechnicianProfile';
import RequestWizard from '../requests/RequestWizard';
import MyRequests from '../requests/MyRequests';
import RequestProgress from './RequestProgress';
import NotificationsPage from './NotificationsPage';
import ClientHome from './ClientHome';
import {request} from '../administration/http';
// Rediseño del panel del cliente (revisión del PR #39): DEF-50, paginación, progreso del seguimiento, tarjetas del
// asistente, Inicio, bandeja por día, fotos ampliables y perfil del técnico. Adelanto del S5 (D-87).
vi.mock('../administration/http', () => ({request: vi.fn(), serverNow: () => Date.now()}));
vi.mock('../realtime/connection', () => ({makeEcho: () => null, subscribeRealtime: (echo, name, events, onEvent, onRecover, onStatus) => { onStatus(false); return () => {}; }}));
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.useRealTimers(); });

const page = (items, current = 1, last = 1) => ({items, pagination: {page: current, per_page: 12, total: items.length, last_page: last}});
const technician = (id, name) => ({id, display_name: name, experience_years: 4, rating: {average: null, count: 0},
  services: [{subcategory_id: 3, subcategory_name: 'Reparación de hardware', reference_fee: '60.00', currency: 'PEN'}],
  districts: [{id: 1, name: 'Huancayo'}], distance: {km: 1, same_district: true, approximate: true, label: 'aproximada por zona'}});

test('S05-TC-041 las opciones de los select del panel usan los colores del tema, no el fondo oscuro global [DEF-50]', () => {
  const panel = readFileSync(resolve('src/features/panel/panel.css'), 'utf8');
  const global = readFileSync(resolve('src/styles.css'), 'utf8');
  const rule = panel.slice(panel.indexOf('.panel-shell option {'), panel.indexOf('}', panel.indexOf('.panel-shell option {')));

  // La regla global option{background:#1d2629} existe para la portada oscura; el panel la reemplaza con sus tokens.
  expect(global).toContain('option{background:#1d2629}');
  expect(rule).toContain('background: var(--ty-surface)');
  expect(rule).toContain('color: var(--ty-text)');
  expect(panel).toMatch(/\[data-theme="light"\][^{]*\.panel-shell[^{]*\{[^}]*color-scheme: light/);
});

test('S05-TC-042 la búsqueda pagina con números, página actual marcada y extremos deshabilitados', async () => {
  request.mockImplementation(async path => {
    if (path.startsWith('/technicians?')) {
      const current = Number(new URLSearchParams(path.split('?')[1]).get('page'));
      return {data: page([technician(current, 'Técnico página ' + current)], current, 3)};
    }
    return {data: []};
  });
  render(<TechnicianSearch defaultDistrictId={1}/>);
  const pages = await screen.findByRole('navigation', {name: 'Páginas de técnicos'});
  await within(pages).findByRole('button', {name: 'Página 1'});

  expect(within(pages).getByRole('button', {name: 'Página anterior'})).toBeDisabled();
  expect(within(pages).getByRole('button', {name: 'Página anterior'})).toHaveTextContent('‹ Anterior');
  expect(within(pages).getByRole('button', {name: 'Página 1'})).toHaveAttribute('aria-current', 'page');
  expect(within(pages).getAllByRole('button', {name: /^Página \d$/})).toHaveLength(3);

  fireEvent.click(within(pages).getByRole('button', {name: 'Página 3'}));
  await screen.findByText('Técnico página 3');
  expect(request).toHaveBeenCalledWith('/technicians?sort=proximity&page=3');
  expect(within(pages).getByRole('button', {name: 'Página 3'})).toHaveAttribute('aria-current', 'page');
  expect(within(pages).getByRole('button', {name: 'Página siguiente'})).toBeDisabled();
  expect(within(pages).getByRole('button', {name: 'Página siguiente'})).toHaveTextContent('Siguiente ›');
});

test('S05-TC-043 el progreso del seguimiento marca el paso actual según la fase y la búsqueda vencida', () => {
  const steps = () => screen.getAllByRole('listitem').map(item => [item.textContent, item.getAttribute('aria-current'), item.className.includes('is-done')]);
  const {rerender} = render(<RequestProgress record={{id: 41, status: 'sent', phase: 'awaiting_choice'}}/>);

  expect(screen.getByRole('list', {name: 'Progreso de la solicitud'})).toBeInTheDocument();
  expect(steps()).toEqual([['Registrada', null, true], ['Enviada', null, true], ['Buscando técnicos', null, true],
    ['Ofertas recibidas', null, true], ['Elige a tu técnico', 'step', false], ['Asignada', null, false]]);

  rerender(<RequestProgress record={{id: 41, status: 'registered', phase: 'registered'}}/>);
  expect(steps()[0]).toEqual(['Registrada', 'step', false]);
  rerender(<RequestProgress record={{id: 41, status: 'sent', phase: 'pending_availability'}}/>);
  expect(steps()[2]).toEqual(['Buscando técnicos', 'step', false]);
  rerender(<RequestProgress record={{id: 41, status: 'assigned', phase: 'assigned'}}/>);
  expect(steps()[5]).toEqual(['Asignada', 'step', false]);
  rerender(<RequestProgress record={{id: 41, status: 'expired', phase: 'expired'}}/>);
  expect(steps().filter(([, current]) => current)).toHaveLength(0);
  expect(screen.getByRole('region', {name: '¿Qué pasa ahora?'})).toHaveTextContent('La búsqueda venció sin técnico asignado');
});

test('S05-TC-044 «¿Qué pasa ahora?» explica el estado y ofrece la acción que corresponde', () => {
  const onChoose = vi.fn();
  const {rerender} = render(<RequestProgress record={{id: 41, status: 'sent', phase: 'matching'}} onChoose={onChoose}/>);
  const next = () => screen.getByRole('region', {name: '¿Qué pasa ahora?'});

  expect(next()).toHaveTextContent('Estamos enviando tu pedido a técnicos verificados; te avisaremos cuando acepten.');
  expect(within(next()).queryByRole('button')).toBeNull();

  rerender(<RequestProgress record={{id: 41, status: 'sent', phase: 'awaiting_choice'}} onChoose={onChoose}/>);
  fireEvent.click(within(next()).getByRole('button', {name: 'Ver técnicos que aceptaron'}));
  expect(onChoose).toHaveBeenCalledTimes(1);

  rerender(<RequestProgress record={{id: 39, status: 'registered', phase: 'registered'}}>
    <button type="button">Continuar solicitud #39</button></RequestProgress>);
  expect(next()).toHaveTextContent('Tu solicitud está guardada como borrador');
  expect(within(next()).getByRole('button', {name: 'Continuar solicitud #39'})).toBeInTheDocument();
});

test('S05-TC-045 el asistente elige especialidad y subcategoría en tarjetas con imagen y enfoca el título de cada paso', async () => {
  request.mockImplementation(async path => {
    if (path === '/catalog/specialties') return {data: [{id: 1, name: 'Cómputo', image_url: '/media/1'}, {id: 2, name: 'Electricidad', image_url: null}]};
    if (path.startsWith('/catalog/subcategories')) return {data: [{id: 4, name: 'Hardware', image_url: '/media/4'}]};
    if (path === '/catalog/districts') return {data: [{id: 1, name: 'Huancayo'}]};
    return {data: []};
  });
  render(<RequestWizard/>);
  const specialties = await screen.findByRole('group', {name: 'Especialidad'});
  await within(specialties).findByRole('radio', {name: 'Cómputo'});

  expect(screen.getByText('Elige el tipo de servicio que necesitas.')).toBeInTheDocument();
  expect(specialties.querySelector('img[src="/media/1"]')).toHaveAttribute('alt', '');
  expect(screen.queryByRole('combobox', {name: 'Especialidad'})).toBeNull();
  fireEvent.click(within(specialties).getByRole('radio', {name: 'Cómputo'}));
  expect(within(specialties).getByRole('radio', {name: 'Cómputo'})).toBeChecked();
  expect(within(specialties).getByRole('radio', {name: 'Cómputo'}).closest('label')).toHaveClass('is-checked');
  fireEvent.click(screen.getByRole('button', {name: 'Siguiente'}));

  const subcategories = await screen.findByRole('group', {name: 'Subcategoría'});
  await within(subcategories).findByRole('radio', {name: 'Hardware'});
  expect(screen.getByRole('heading', {name: 'Paso 2: Subcategoría'})).toHaveFocus();
  const steps = screen.getByRole('list', {name: 'Pasos de la solicitud'});
  expect(within(steps).getAllByRole('listitem')[0]).toHaveClass('is-done');
  expect(within(steps).getAllByRole('listitem')[1]).toHaveAttribute('aria-current', 'step');
});

test('S05-TC-046 el Inicio saluda por nombre y distrito, muestra estados vacíos con acción y la última solicitud', async () => {
  const user = {id: '5', name: 'Alias', given_names: 'Carla María', role: {code: 'client'}, client_profile: {district_id: 2}};
  const navigate = vi.fn();
  let rows = [];
  request.mockImplementation(async path => {
    if (path === '/requests') return {data: rows};
    if (path === '/catalog/districts') return {data: [{id: 1, name: 'Huancayo'}, {id: 2, name: 'El Tambo'}]};
    if (path === '/catalog/specialties') return {data: [{id: 1, name: 'Cómputo', image_url: '/media/1'}]};
    if (path.startsWith('/technicians?')) return {data: page([])};
    return {data: []};
  });
  const view = render(<ClientHome user={user} navigate={navigate}/>);

  expect(await screen.findByRole('heading', {name: 'Hola, Carla María'})).toBeInTheDocument();
  expect(await screen.findByText('El Tambo')).toBeInTheDocument();
  const summary = screen.getByRole('region', {name: 'Resumen de tus solicitudes'});
  expect(await within(summary).findByText('Aún no tienes solicitudes activas.')).toBeInTheDocument();
  expect(within(summary).queryByText('0')).toBeNull();
  fireEvent.click(within(summary).getByRole('button', {name: 'Crear mi primera solicitud'}));
  expect(navigate).toHaveBeenCalledWith('new');
  expect(screen.queryByRole('region', {name: 'Tu última solicitud'})).toBeNull();
  expect(within(screen.getByRole('navigation', {name: 'Buscar por rubro'})).getByRole('button', {name: 'Cómputo'}).querySelector('img')).toHaveAttribute('src', '/media/1');
  view.unmount();

  rows = [{id: 41, status: 'sent', phase: 'awaiting_choice', subcategory: {name: 'Reparación de hardware'}, district: {name: 'El Tambo'}, updated_at: '2026-10-20T15:00:00Z'}];
  render(<ClientHome user={user} navigate={navigate}/>);
  const last = await screen.findByRole('region', {name: 'Tu última solicitud'});
  expect(last).toHaveTextContent('Reparación de hardware');
  expect(last).toHaveTextContent('Elige a tu técnico entre los que aceptaron.');
  fireEvent.click(within(last).getByRole('button', {name: 'Ver seguimiento'}));
  expect(navigate).toHaveBeenCalledWith('requests', {open: 41});
});

test('S05-TC-047 la bandeja agrupa por día (Hoy, Ayer y fecha) y filtra con chips', async () => {
  vi.useFakeTimers({toFake: ['Date']});
  vi.setSystemTime(new Date('2026-10-20T23:00:00Z')); // 18:00 en Lima
  const item = (id, created, read = null) => ({id, type: 'request.pending', title: 'Aviso ' + id, body: 'Texto.', subject: {type: 'service_request', id: 1},
    event_id: 'e' + id, created_at: created, read_at: read});
  request.mockImplementation(async () => ({data: {...page([item(3, '2026-10-20T15:00:00Z'), item(2, '2026-10-19T20:00:00Z', '2026-10-19T21:00:00Z'),
    item(1, '2026-10-15T15:00:00Z')]), unread_count: 2}}));
  render(<NotificationsPage userId="5"/>);

  await screen.findByText('Aviso 3');
  expect(screen.getAllByRole('heading', {level: 3}).map(heading => heading.textContent)).toEqual(['Hoy', 'Ayer', '15 de octubre de 2026']);
  expect(screen.getByText('Aviso 3').closest('li')).toHaveClass('is-unread');
  expect(screen.getByText('Aviso 2').closest('li').querySelector('.client-unread-dot')).toBeNull();

  const filters = screen.getByRole('group', {name: 'Filtrar por estado'});
  fireEvent.click(within(filters).getByRole('button', {name: 'No leídas'}));
  expect(within(filters).getByRole('button', {name: 'No leídas'})).toHaveAttribute('aria-pressed', 'true');
  await waitFor(() => expect(request).toHaveBeenCalledWith('/notifications?state=unread&per_page=20'));
});

test('S05-TC-048 las fotos de la solicitud se amplían al clic y se cierran con Escape devolviendo el foco', async () => {
  request.mockImplementation(async path => {
    if (path === '/requests') return {data: [{id: 39, status: 'registered', phase: 'registered'}]};
    return {data: {id: 39, status: 'registered', phase: 'registered', description: 'Falla sintética suficiente.', subcategory: {name: 'Hardware'},
      district: {name: 'Huancayo'}, reference_fee: {amount: null}, attachments: [{media_id: 7, url: '/media/7', caption: null}], timeline: []}};
  });
  render(<MyRequests/>);
  fireEvent.click(await screen.findByText('Ver solicitud #39'));
  const thumbnail = await screen.findByRole('button', {name: 'Ampliar foto 1'});

  fireEvent.click(thumbnail);
  const dialog = screen.getByRole('dialog', {name: 'Foto 1 de la solicitud #39'});
  expect(within(dialog).getByRole('img')).toHaveAttribute('src', '/media/7');
  await waitFor(() => expect(within(dialog).getByRole('button', {name: 'Cerrar'})).toHaveFocus());
  fireEvent.keyDown(dialog, {key: 'Escape'});

  expect(screen.queryByRole('dialog')).toBeNull();
  expect(thumbnail).toHaveFocus();
});

test('S05-TC-049 el perfil del técnico muestra cabecera verificada, servicios referenciales y estados vacíos formales', async () => {
  request.mockResolvedValue({data: {id: 2, display_name: 'Técnico Tambo', bio: 'Perfil sintético.', experience_years: 6, portfolio: [], reviews: [],
    services: [{subcategory_id: 3, subcategory_name: 'Reparación de hardware', reference_fee: '80.00', currency: 'PEN'}]}});
  const onRequest = vi.fn();
  render(<TechnicianProfile id={2} preview={technician(2, 'Técnico Tambo')} onRequest={onRequest} onBack={() => {}}/>);
  const header = await screen.findByRole('region', {name: 'Técnico Tambo'});

  expect(within(header).getByText('Verificado')).toBeInTheDocument();
  expect(within(header).getByText('6 años de experiencia')).toBeInTheDocument();
  expect(within(header).getByText('Huancayo')).toBeInTheDocument();
  expect(within(header).getByRole('button', {name: 'Solicitar servicio'})).toHaveClass('primary');
  expect(screen.getByText('Referencial S/ 80.00')).toBeInTheDocument();
  expect(screen.getByText(/orientativa/)).toBeInTheDocument();
  expect(screen.getByText('Este técnico aún no publicó trabajos.')).toBeInTheDocument();
  expect(screen.getByText('Este técnico aún no tiene reseñas')).toBeInTheDocument();
  expect(screen.getByText(/Sin reseñas publicadas todavía\./)).toBeInTheDocument();
  expect(screen.getByRole('button', {name: 'Volver a la búsqueda'})).toHaveClass('outline');
  await act(async () => {});
});
