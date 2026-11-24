// S07-TC-179 a 186 · Panel del administrador, Fase A2 (PLAN-PANEL-ADMIN.md): Inicio tipo panel de control con saludo y
// fecha de Lima, 6 indicadores animados que respetan «Reducir animaciones», gráfico de 7 y 30 días con resumen y tabla,
// «Tareas pendientes» con acceso directo (umbrales de D-118), actividad reciente y accesos rápidos según permisos.
import React from 'react';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import AdminHome from '../panel/AdminHome';
import {request} from '../administration/http';

vi.mock('../administration/http', () => ({request: vi.fn()}));

const ALL = ['dashboard.view', 'users.manage', 'technicians.verify', 'announcements.manage'];
const day = (offset, values = {}) => ({date: new Date(Date.UTC(2026, 10, 25) - offset * 86400000).toISOString().slice(0, 10),
  created: 0, assigned: 0, cancelled: 0, expired: 0, ...values});
const series = () => ({days: 30, items: Array.from({length: 30}, (_, index) => day(29 - index, index === 29 ? {created: 3, assigned: 2}
  : index === 25 ? {created: 4, assigned: 1, cancelled: 1, expired: 1} : index === 10 ? {created: 5, expired: 2} : {}))});
const tasks = (counts = {}) => [
  ['documents_to_review', 'verification', null], ['unassigned_requests', 'alerts', 30], ['pending_expiring', 'alerts', 120],
  ['keyword_misses', 'keywords', 7], ['iot_unattended', 'iot', 60], ['low_performance', 'performance', 30],
].map(([key, section, limit]) => ({key, section, limit, count: counts[key] ?? 0}));
const dashboard = (overrides = {}) => ({
  kpis: {requests_today: 3, searching_now: 2, technicians_verified: 14, avg_assignment_minutes: 65, premium_clients: 12, iot_open_alerts: 2},
  series: series(), tasks: tasks({documents_to_review: 1, unassigned_requests: 2, keyword_misses: 3}),
  recent_events: Array.from({length: 10}, (_, index) => ({action: index ? 'user.updated' : 'technician.reviewed', reason: `Motivo ${index + 1}.`,
    actor: 'Ana Quispe', subject_type: 'user', occurred_at: new Date(Date.UTC(2026, 10, 25, 14, 0) - index * 3600000).toISOString()})),
  generated_at: '2026-11-25T15:00:00.000Z', ...overrides});

let data;
beforeEach(() => {
  vi.useFakeTimers({toFake: ['Date']});
  vi.setSystemTime(new Date('2026-11-25T15:00:00.000Z')); // 10:00 en Lima, miércoles
  document.documentElement.dataset.motion = 'reduce';
  data = dashboard();
  request.mockImplementation(async () => ({data}));
});
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.useRealTimers(); delete document.documentElement.dataset.motion; });

const open = async (props = {}) => {
  const navigate = vi.fn();
  render(<AdminHome navigate={navigate} permissions={ALL} user={{given_names: 'Ana', name: 'Ana Quispe'}} {...props}/>);
  await screen.findByRole('region', {name: 'Indicadores'});
  return navigate;
};

test('S07-TC-179 saluda según la hora de Lima con el nombre y la fecha de hoy', async () => {
  await open();
  expect(screen.getByRole('heading', {level: 2})).toHaveTextContent('Buenos días, Ana');
  expect(screen.getByText(/miércoles, 25 de noviembre/i)).toBeInTheDocument();
  cleanup();

  vi.setSystemTime(new Date('2026-11-26T00:30:00.000Z')); // 19:30 del 25 en Lima
  await open();
  expect(screen.getByRole('heading', {level: 2})).toHaveTextContent('Buenas noches, Ana');
  expect(screen.getByText(/miércoles, 25 de noviembre/i)).toBeInTheDocument();
});

test('S07-TC-180 los 6 indicadores muestran el valor del servidor con su formato; sin asignaciones en 30 días dice «—»', async () => {
  await open();
  const kpis = screen.getByRole('region', {name: 'Indicadores'});
  const value = name => within(kpis).getByText(name).closest('.adm-kpi').querySelector('.adm-kpi-value').textContent;
  expect(within(kpis).getAllByRole('listitem')).toHaveLength(6);
  expect(value('Solicitudes de hoy')).toBe('3');
  expect(value('Buscando técnico ahora')).toBe('2');
  expect(value('Técnicos activos y verificados')).toBe('14');
  expect(value('Tiempo medio de asignación')).toBe('1 h 5 min');
  expect(value('Clientes Premium')).toBe('12');
  expect(value('Alertas IoT abiertas')).toBe('2');
  cleanup();

  data = dashboard({kpis: {...dashboard().kpis, avg_assignment_minutes: null}});
  await open();
  const empty = within(screen.getByRole('region', {name: 'Indicadores'})).getByText('Tiempo medio de asignación').closest('.adm-kpi');
  expect(empty.querySelector('.adm-kpi-value')).toHaveTextContent('—');
  expect(empty).toHaveTextContent('Sin asignaciones en 30 días');
});

test('S07-TC-181 los contadores suben con animación y, con «Reducir animaciones», muestran el valor final de inmediato', async () => {
  delete document.documentElement.dataset.motion;
  vi.stubGlobal('matchMedia', () => ({matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()}));
  const frames = [];
  vi.stubGlobal('requestAnimationFrame', callback => { frames.push(callback); return frames.length; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  const start = performance.now();
  await open();
  const value = () => within(screen.getByRole('region', {name: 'Indicadores'})).getByText('Técnicos activos y verificados')
    .closest('.adm-kpi').querySelector('.adm-kpi-value');
  expect(value()).toHaveTextContent('0');
  // El nombre accesible ya trae el valor final: el lector de pantalla no oye la cuenta.
  expect(value().closest('.adm-kpi')).toHaveAccessibleName(/14/);
  act(() => { frames.splice(0).forEach(callback => callback(start + 2000)); });
  expect(value()).toHaveTextContent('14');
  cleanup();
  vi.unstubAllGlobals();

  document.documentElement.dataset.motion = 'reduce';
  await open();
  expect(value()).toHaveTextContent('14');
});

test('S07-TC-182 el gráfico cambia entre 7 y 30 días, resume en texto y trae su tabla equivalente', async () => {
  await open();
  const chart = screen.getByRole('region', {name: 'Solicitudes por día'});
  expect(within(chart).getByRole('button', {name: '7 días'})).toHaveAttribute('aria-pressed', 'true');
  expect(within(chart).getByText('En los últimos 7 días: 7 creadas, 3 asignadas, 1 cancelada y 1 vencida.')).toBeInTheDocument();
  expect(within(chart).getByRole('img', {name: /últimos 7 días/})).toBeInTheDocument();
  expect(within(within(chart).getByRole('table')).getAllByRole('row')).toHaveLength(8);
  // Leyenda: cada serie con su nombre (el color nunca es lo único).
  expect(within(chart).getByRole('list', {name: 'Leyenda'})).toHaveTextContent('CreadasAsignadasCanceladasVencidas');

  fireEvent.click(within(chart).getByRole('button', {name: '30 días'}));
  expect(within(chart).getByRole('button', {name: '30 días'})).toHaveAttribute('aria-pressed', 'true');
  expect(within(chart).getByText('En los últimos 30 días: 12 creadas, 3 asignadas, 1 cancelada y 3 vencidas.')).toBeInTheDocument();
  expect(within(within(chart).getByRole('table')).getAllByRole('row')).toHaveLength(31);
});

test('S07-TC-183 el gráfico se recorre con el teclado y muestra el detalle del día con los 4 valores', async () => {
  await open();
  const plot = within(screen.getByRole('region', {name: 'Solicitudes por día'})).getByRole('img', {name: /últimos 7 días/});
  plot.focus();
  fireEvent.keyDown(plot, {key: 'End'});
  const tip = await screen.findByRole('status', {name: 'Detalle del día'});
  expect(tip).toHaveTextContent('25 nov');
  expect(tip).toHaveTextContent('Creadas3');
  expect(tip).toHaveTextContent('Asignadas2');
  fireEvent.keyDown(plot, {key: 'ArrowLeft'});
  fireEvent.keyDown(plot, {key: 'ArrowLeft'});
  fireEvent.keyDown(plot, {key: 'ArrowLeft'});
  fireEvent.keyDown(plot, {key: 'ArrowLeft'});
  expect(screen.getByRole('status', {name: 'Detalle del día'})).toHaveTextContent('Canceladas1');
  fireEvent.keyDown(plot, {key: 'Escape'});
  expect(screen.queryByRole('status', {name: 'Detalle del día'})).not.toBeInTheDocument();
});

test('S07-TC-184 «Tareas pendientes» muestra solo las que tienen algo, con su umbral y su acceso directo; sin nada, «Todo al día» [D-118]', async () => {
  const navigate = await open();
  const panel = screen.getByRole('region', {name: /Tareas pendientes/});
  expect(within(panel).getByText('6', {selector: '.adm-count'})).toBeInTheDocument();
  const items = within(panel).getAllByRole('listitem');
  expect(items.map(item => item.querySelector('.adm-task-label').textContent)).toEqual([
    'Documentos por revisar', 'Solicitudes sin técnico hace más de 30 min', 'Búsquedas sin resultado de los últimos 7 días']);
  fireEvent.click(within(items[1]).getByRole('button', {name: 'Revisar: Solicitudes sin técnico hace más de 30 min'}));
  expect(navigate).toHaveBeenCalledWith('alerts');
  fireEvent.click(within(items[2]).getByRole('button', {name: /Búsquedas sin resultado/}));
  expect(navigate).toHaveBeenLastCalledWith('keywords');
  cleanup();

  // Sin umbrales en las reglas (null) o sin pendientes: no se inventan contadores.
  data = dashboard({tasks: tasks().map(task => (task.key === 'documents_to_review' ? task : {...task, count: null}))});
  await open();
  const done = screen.getByRole('region', {name: /Tareas pendientes/});
  expect(within(done).getByText('Todo al día')).toBeInTheDocument();
  expect(within(done).queryByRole('listitem')).not.toBeInTheDocument();
});

// Rediseño de la línea de tiempo (revisión del #69, 2026-11-25): la hora va en su columna («09:00»), el día en un
// separador («Hoy») y el vacío dice «Todavía no hay actividad». El caso sigue probando las 10 acciones con nombre, motivo
// y autor; el detalle del diseño nuevo lo prueban S07-TC-195 a 198.
test('S07-TC-185 la actividad reciente lista las 10 acciones con su nombre, motivo, autor y hora de Lima', async () => {
  await open();
  const activity = screen.getByRole('region', {name: 'Actividad reciente'});
  const items = within(activity).getAllByRole('listitem');
  expect(items).toHaveLength(10);
  expect(within(activity).getByRole('heading', {name: 'Hoy'})).toBeInTheDocument();
  expect(items[0]).toHaveTextContent('Técnico revisado');
  expect(items[0]).toHaveTextContent('Motivo 1.');
  expect(items[0]).toHaveTextContent('Ana Quispe');
  expect(items[0].querySelector('time')).toHaveTextContent('09:00');
  cleanup();

  data = dashboard({recent_events: []});
  await open();
  expect(within(screen.getByRole('region', {name: 'Actividad reciente'})).getByText('Todavía no hay actividad')).toBeInTheDocument();
});

test('S07-TC-186 los accesos rápidos dependen de los permisos y un error se puede reintentar', async () => {
  const navigate = await open();
  const quick = screen.getByRole('navigation', {name: 'Accesos rápidos'});
  expect(within(quick).getAllByRole('button').map(button => button.textContent)).toEqual(['Crear comunicado', 'Crear usuario', 'Revisar verificación']);
  fireEvent.click(within(quick).getByRole('button', {name: 'Crear usuario'}));
  expect(navigate).toHaveBeenCalledWith('users', 'create');
  cleanup();

  await open({permissions: ['dashboard.view']});
  expect(screen.queryByRole('navigation', {name: 'Accesos rápidos'})).not.toBeInTheDocument();
  cleanup();

  let fail = true;
  request.mockImplementation(async () => { if (fail) throw {status: 0, message: 'No pudimos conectar.'}; return {data}; });
  render(<AdminHome navigate={vi.fn()} permissions={ALL} user={{given_names: 'Ana'}}/>);
  expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos conectar.');
  fail = false;
  fireEvent.click(screen.getByRole('button', {name: 'Reintentar'}));
  await waitFor(() => expect(screen.getByRole('region', {name: 'Indicadores'})).toBeInTheDocument());
});
