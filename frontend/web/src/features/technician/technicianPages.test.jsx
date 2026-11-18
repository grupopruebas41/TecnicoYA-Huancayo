import React from 'react';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import OffersPage from './OffersPage';
import JobsPage from './JobsPage';
import {AgendaPage, ZonesPage} from './Availability';
import {technicianTarget} from './TechnicianApp';
import {hasCustomSlots, legibleRange, matrixFrom, scheduleSummary, slotsFrom} from './format';
import {request} from '../administration/http';
// S05-TC-318 a 325 · Panel del técnico, Fase T3 (modo rápido): Ofertas (Pendientes e Historial), Mis trabajos (pestañas,
// búsqueda, paginación, dirección solo si es suyo), Zonas y disponibilidad (semana visual, chips, vista previa) y Mi agenda.
vi.mock('../administration/http', () => ({request: vi.fn(), serverNow: () => Date.now()}));
vi.mock('../realtime/Realtime', async importOriginal => ({...(await importOriginal()), useRealtimeResource: () => false}));

const SERVER = '2026-11-12T20:30:00.000Z';
const req = (id, extra = {}) => ({id, specialty: {id: 1, name: 'Cómputo'}, subcategory: {id: 1, name: 'Reparación de hardware'},
  subcategories: [{id: 1, name: 'Reparación de hardware'}], district: {id: 1, name: 'Huancayo'}, mode: 'scheduled',
  preferred_start_at: '2026-11-11T13:00:00.000Z', preferred_end_at: '2026-11-11T15:00:00.000Z', urgency: 'normal',
  description: 'Solicitud sintética.', address: null, symptoms: [], evidence: [], ...extra});
const offer = (id, status, minutes = 5, extra = {}) => ({id, status, version: 1, round: {id, round_no: 1, kind: 'direct'},
  available_at: new Date(Date.parse(SERVER) - (10 - minutes) * 60000).toISOString(),
  expires_at: new Date(Date.parse(SERVER) + minutes * 60000).toISOString(),
  responded_at: status === 'accepted' || status === 'rejected' ? '2026-11-10T13:03:00.000Z' : null,
  reference_fee: {amount: '80.00', currency: 'PEN', is_reference: true}, request: req(100 + id), ...extra});
const job = (id, status, extra = {}) => ({request_id: id, status, specialty: {id: 2, name: 'Refrigeración comercial'},
  subcategories: [{id: 5, name: 'Congeladoras'}], district: {id: 2, name: 'El Tambo'},
  starts_at: '2026-11-13T14:00:00.000Z', ends_at: '2026-11-13T16:00:00.000Z', slot: 'morning',
  reference_fee: {amount: '120.00', currency: 'PEN', is_reference: true},
  address: ['assigned', 'in_progress', 'completed'].includes(status) ? 'Jr. Sintético 320' : null,
  timeline: [{code: 'accepted', label: 'Aceptaste la oferta', at: '2026-11-12T13:01:00.000Z'},
    {code: 'assigned', label: 'El cliente te eligió', at: '2026-11-12T13:20:00.000Z'},
    ...(status === 'cancelled' ? [{code: 'cancelled', label: 'Trabajo cancelado', at: '2026-11-12T15:00:00.000Z'}] : [])], ...extra});
const profile = (slots = [{weekday: 1, start: '08:00', end: '18:00'}, {weekday: 6, start: '08:00', end: '12:00'}]) => ({
  id: 5, display_name: 'Rosa Quispe', version: 7, availability: {slots, district_ids: [1], pause: null}});
const districts = [{id: 1, name: 'Huancayo'}, {id: 2, name: 'El Tambo'}, {id: 3, name: 'Chilca'}];

let handlers;
function routes(extra = {}) {
  handlers = extra;
  request.mockImplementation(async (path, body, method = body ? 'POST' : 'GET') => {
    const key = `${method} ${path.split('?')[0]}`;
    if (handlers[key]) return handlers[key](body, path);
    if (path === '/technicians/me/profile') return {data: profile()};
    if (path === '/catalog/districts') return {data: districts};
    return {data: []};
  });
}
beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()}));
  document.documentElement.dataset.motion = 'reduce';
});
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); delete document.documentElement.dataset.motion; });

test('S05-TC-318 las franjas se leen y se guardan sin perder horas: cubrir entera, unir contiguas y resumir el horario', () => {
  const matrix = matrixFrom([{weekday: 1, start: '08:00', end: '18:00'}, {weekday: 2, start: '09:00', end: '12:00'},
    {weekday: 3, start: '08:00', end: '12:00'}, {weekday: 3, start: '18:00', end: '21:00'}]);
  expect(matrix[1]).toEqual({morning: true, afternoon: true, night: false});
  expect(matrix[2]).toEqual({morning: false, afternoon: false, night: false}); // 09–12 no cubre la mañana entera
  expect(slotsFrom(matrix)).toEqual([{weekday: 1, start: '08:00', end: '18:00'}, {weekday: 3, start: '08:00', end: '12:00'},
    {weekday: 3, start: '18:00', end: '21:00'}]);
  expect(hasCustomSlots([{weekday: 1, start: '08:00', end: '18:00'}])).toBe(false);
  expect(hasCustomSlots([{weekday: 2, start: '09:00', end: '12:00'}])).toBe(true);
  const week = matrixFrom([1, 2, 3, 4, 5, 6].map(day => ({weekday: day, start: '08:00', end: '18:00'})).concat({weekday: 7, start: '08:00', end: '12:00'}));
  expect(scheduleSummary(week)).toBe('Lun a Sáb · Mañana y Tarde; Dom · Mañana');
  expect(legibleRange('2026-11-11T13:00:00.000Z', '2026-11-11T15:00:00.000Z')).toBe('mié 11 nov · 08:00–10:00');
});

test('S05-TC-319 Ofertas tiene Pendientes (la tarjeta del Inicio, por vencimiento) e Historial con el estado como etiqueta de color', async () => {
  routes({
    'GET /offers': (body, path) => (path.includes('status=pending')
      ? {data: {items: [offer(1, 'pending', 8), offer(2, 'pending', 2)]}, meta: {server_time: SERVER}}
      : {data: {items: [offer(3, 'accepted'), offer(4, 'expired')], pagination: {page: 1, per_page: 10, total: 12, last_page: 2}}}),
  });
  render(<OffersPage pendingCount={2}/>);
  expect(screen.getByRole('region', {name: 'Solicitudes entrantes'})).toBeInTheDocument();
  const pending = screen.getByRole('tab', {name: /Pendientes/});
  expect(pending).toHaveAttribute('aria-selected', 'true');
  expect(within(pending).getByText('2')).toBeInTheDocument();
  const cards = await screen.findAllByRole('article');
  expect(cards.map(card => card.getAttribute('aria-label'))).toEqual(['Oferta 2', 'Oferta 1']);
  expect(cards[0]).toHaveTextContent('mié 11 nov · 08:00–10:00 (Mañana)');

  fireEvent.keyDown(pending, {key: 'ArrowRight'});
  expect(screen.getByRole('tab', {name: 'Historial'})).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', {name: 'Historial'})).toHaveFocus();
  const accepted = await screen.findByRole('listitem', {name: 'Oferta 3'});
  expect(within(accepted).getByText('Aceptada').closest('.tech-status')).toHaveAttribute('data-tone', 'ok');
  expect(accepted).toHaveTextContent('Respondiste el mar 10 nov · 08:03');
  expect(within(screen.getByRole('listitem', {name: 'Oferta 4'})).getByText('Vencida').closest('.tech-status')).toHaveAttribute('data-tone', 'warn');
  fireEvent.click(screen.getByRole('button', {name: 'Página 2'}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/offers?status=accepted,rejected,expired,withdrawn&page=2&per_page=10'));
});

test('S05-TC-320 Mis trabajos muestra pestañas con contador, estado con ícono, visita legible, dirección solo si es suyo y la línea de tiempo', async () => {
  routes({'GET /technicians/me/jobs': (body, path) => ({data: {
    items: path.includes('tab=cancelled') ? [job(31, 'cancelled')] : [job(30, 'assigned')],
    counts: {assigned: 1, in_progress: 0, completed: 4, cancelled: 1}, pagination: {page: 1, per_page: 6, total: 1, last_page: 1}}})});
  render(<JobsPage/>);
  const card = await screen.findByRole('listitem', {name: 'Trabajo de la solicitud 30'});
  expect(screen.getAllByRole('tab').map(tab => tab.textContent)).toEqual(['Asignados1', 'En curso0', 'Completados4', 'Cancelados1']);
  expect(within(card).getByText('Asignado').closest('.tech-status').querySelector('svg')).not.toBeNull();
  expect(card).toHaveTextContent('vie 13 nov · 09:00–11:00 (Mañana)');
  expect(card).toHaveTextContent('Jr. Sintético 320');
  expect(within(card).getByRole('list', {name: 'Línea de tiempo'})).toHaveTextContent('El cliente te eligió');

  fireEvent.click(screen.getByRole('tab', {name: /Cancelados/}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/technicians/me/jobs?tab=cancelled&page=1&per_page=6'));
  const cancelled = await screen.findByRole('listitem', {name: 'Trabajo de la solicitud 31'});
  expect(cancelled).not.toHaveTextContent('Jr. Sintético');
  expect(cancelled).toHaveTextContent('La dirección exacta solo se ve en trabajos asignados a ti.');
  expect(within(cancelled).getByRole('list', {name: 'Línea de tiempo'})).toHaveTextContent('Trabajo cancelado');
});

test('S05-TC-321 la búsqueda espera a que termines de escribir, muestra «Sin resultados» y pagina', async () => {
  vi.useFakeTimers({toFake: ['setTimeout', 'clearTimeout']});
  routes({'GET /technicians/me/jobs': (body, path) => ({data: {
    items: path.includes('q=') ? [] : [job(40, 'assigned')], counts: {assigned: 9, in_progress: 0, completed: 0, cancelled: 0},
    pagination: {page: path.includes('page=2') ? 2 : 1, per_page: 6, total: 9, last_page: 2}}})});
  render(<JobsPage/>);
  await act(async () => { await vi.advanceTimersByTimeAsync(350); });
  fireEvent.change(screen.getByRole('searchbox', {name: 'Buscar en mis trabajos'}), {target: {value: 'Congela'}});
  await act(async () => { await vi.advanceTimersByTimeAsync(200); });
  expect(request).not.toHaveBeenCalledWith(expect.stringContaining('q=Congela'));
  await act(async () => { await vi.advanceTimersByTimeAsync(150); });
  expect(request).toHaveBeenCalledWith('/technicians/me/jobs?tab=assigned&page=1&per_page=6&q=Congela');
  await act(async () => { await vi.advanceTimersByTimeAsync(10); });
  expect(screen.getByText('Sin resultados para «Congela»')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: 'Limpiar la búsqueda'}));
  await act(async () => { await vi.advanceTimersByTimeAsync(350); });
  await act(async () => { await vi.advanceTimersByTimeAsync(10); });
  fireEvent.click(screen.getByRole('button', {name: 'Página 2'}));
  await act(async () => { await vi.advanceTimersByTimeAsync(10); });
  expect(request).toHaveBeenCalledWith('/technicians/me/jobs?tab=assigned&page=2&per_page=6');
});

test('S05-TC-322 Zonas y disponibilidad: casillas grandes por franja, chips de distrito, vista previa y guardado con alerta', async () => {
  let saved;
  routes({'PUT /technicians/me/availability': body => { saved = body; return {data: {version: 8}}; }});
  const onSaved = vi.fn();
  render(<ZonesPage onSaved={onSaved}/>);
  const grid = await screen.findByRole('group', {name: 'Disponibilidad por franja'});
  expect(within(grid).getByRole('button', {name: 'Lunes, Tarde (12:00–18:00): disponible'})).toHaveAttribute('aria-pressed', 'true');
  const sundayNight = within(grid).getByRole('button', {name: 'Domingo, Noche (18:00–21:00): no disponible'});
  fireEvent.click(sundayNight);
  expect(within(grid).getByRole('button', {name: 'Domingo, Noche (18:00–21:00): disponible'})).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(within(grid).getByRole('button', {name: 'Sábado, Mañana (08:00–12:00): disponible'}));
  fireEvent.click(screen.getByRole('button', {name: 'El Tambo'}));
  expect(screen.getByRole('button', {name: 'El Tambo'})).toHaveAttribute('aria-pressed', 'true');
  const preview = screen.getByRole('complementary', {name: 'Así te ven los clientes'});
  expect(preview).toHaveTextContent('Atiende en: Huancayo, El Tambo');
  expect(preview).toHaveTextContent('Horario: Lun · Mañana y Tarde; Dom · Noche');
  fireEvent.click(screen.getByRole('button', {name: 'Guardar disponibilidad'}));
  expect(await screen.findByText('Guardamos tu disponibilidad y tus zonas.')).toBeInTheDocument();
  expect(saved).toEqual({slots: [{weekday: 1, start: '08:00', end: '18:00'}, {weekday: 7, start: '18:00', end: '21:00'}],
    district_ids: [1, 2], pause: null, expected_version: 7});
  expect(onSaved).toHaveBeenCalled();
});

test('S05-TC-323 Zonas valida en el cliente (al menos una franja y un distrito) y explica los errores del servidor', async () => {
  let attempt = 0;
  routes({
    '/technicians/me/profile': undefined,
    'PUT /technicians/me/availability': () => {
      attempt += 1;
      if (attempt === 1) throw {status: 409, message: 'Conflicto'};
      throw {status: 422, message: 'El distrito elegido ya no está activo.'};
    },
  });
  request.mockImplementationOnce(async () => ({data: profile([])})).mockImplementationOnce(async () => ({data: districts}));
  render(<ZonesPage/>);
  await screen.findByRole('group', {name: 'Disponibilidad por franja'});
  fireEvent.click(screen.getByRole('button', {name: 'Guardar disponibilidad'}));
  expect(screen.getByRole('alert')).toHaveTextContent('Marca al menos una franja en la semana para recibir ofertas.');
  fireEvent.click(screen.getByRole('button', {name: 'Martes, Mañana (08:00–12:00): no disponible'}));
  fireEvent.click(screen.getByRole('button', {name: 'Huancayo'}));
  fireEvent.click(screen.getByRole('button', {name: 'Guardar disponibilidad'}));
  expect(screen.getByRole('alert')).toHaveTextContent('Elige al menos un distrito donde atiendes.');
  expect(request).not.toHaveBeenCalledWith('/technicians/me/availability', expect.anything(), 'PUT');
  fireEvent.click(screen.getByRole('button', {name: 'Huancayo'}));
  fireEvent.click(screen.getByRole('button', {name: 'Guardar disponibilidad'}));
  expect(await screen.findByText(/Tu perfil cambió en otra pestaña/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: 'Lunes, Noche (18:00–21:00): no disponible'}));
  fireEvent.click(screen.getByRole('button', {name: 'Guardar disponibilidad'}));
  expect(await screen.findByText('El distrito elegido ya no está activo.')).toBeInTheDocument();
});

test('S05-TC-324 Mi agenda muestra la semana con hoy resaltado, cuenta las visitas por franja, cambia de semana y abre el editor', async () => {
  vi.useFakeTimers({toFake: ['Date'], now: new Date(SERVER)});
  const week = start => ({data: {week_start: start, week_end: start === '2026-11-09' ? '2026-11-15' : '2026-11-22',
    visits: start === '2026-11-09' ? [
      {request_id: 50, date: '2026-11-12', slot: 'morning', starts_at: '2026-11-12T14:00:00.000Z', ends_at: '2026-11-12T16:00:00.000Z',
        status: 'in_progress', specialty: 'Cómputo', subcategory: 'Redes', district: 'Chilca'},
      {request_id: 51, date: '2026-11-12', slot: 'morning', starts_at: '2026-11-12T15:00:00.000Z', ends_at: '2026-11-12T17:00:00.000Z',
        status: 'assigned', specialty: 'Cómputo', subcategory: 'Hardware', district: 'Huancayo'}] : []}});
  routes({'GET /technicians/me/agenda': (body, path) => week(path.includes('week=2026-11-16') ? '2026-11-16' : '2026-11-09')});
  render(<AgendaPage/>);
  const grid = await screen.findByRole('group', {name: 'Semana'});
  expect(grid.querySelector('.tech-week-day.is-today')).toHaveTextContent('Jue12');
  expect(within(grid).getByRole('img', {name: 'Jueves, Mañana (08:00–12:00): no disponible, 2 visitas'})).toBeInTheDocument();
  expect(within(grid).getByRole('img', {name: 'Lunes, Tarde (12:00–18:00): disponible'})).toBeInTheDocument();
  expect(screen.getByRole('region', {name: 'Visitas de la semana'})).toHaveTextContent('jue 12 nov · 09:00–11:00');
  expect(screen.getByText('lun 9 nov al dom 15 nov')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: 'Semana siguiente ›'}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/technicians/me/agenda?week=2026-11-16'));
  expect(await screen.findByText('No tienes visitas programadas esta semana.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: 'Esta semana'}));
  await waitFor(() => expect(request).toHaveBeenLastCalledWith('/technicians/me/profile'));
  fireEvent.click(screen.getByRole('button', {name: /Editar disponibilidad y zonas/}));
  expect(screen.getByRole('button', {name: /Cerrar la edición/})).toHaveAttribute('aria-expanded', 'true');
  expect(await screen.findByRole('group', {name: 'Disponibilidad por franja'})).toBeInTheDocument();
});

test('S05-TC-325 los avisos de asignación y cancelación llevan a Mis trabajos', () => {
  expect(technicianTarget({type: 'request.assigned'})).toEqual(['jobs']);
  expect(technicianTarget({type: 'request.cancelled'})).toEqual(['jobs']);
  expect(technicianTarget({type: 'offer.expired'})).toEqual(['offers']);
  expect(technicianTarget({type: 'announcement.published'})).toEqual(['home']);
});
