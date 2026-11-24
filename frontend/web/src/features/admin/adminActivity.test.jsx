// S07-TC-195 a 198 · Revisión del #69 (Pimentel): «Actividad reciente» del Inicio del administrador como línea de tiempo.
// Hora de Lima en su columna (con «hace N h» en el title), agrupada por día («Hoy», «Ayer», «22 nov»), color e ícono por
// tipo de acción siempre con texto, etiqueta de tipo, motivo en una línea con el texto completo en el title, chips de
// filtro (en el cliente, sobre los 10 eventos), pie «Ver toda la actividad» hacia Auditoría y estado vacío.
import React from 'react';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import AdminHome from '../panel/AdminHome';
import {request} from '../administration/http';

vi.mock('../administration/http', () => ({request: vi.fn()}));

// Reloj: 2026-11-25 10:00 en Lima (15:00 UTC).
const at = (day, hour, minute = 0) => new Date(Date.UTC(2026, 10, day, hour + 5, minute)).toISOString(); // hora de Lima a UTC
const EVENTS = [
  {action: 'user.blocked', subject_type: 'user', reason: 'Cuenta de prueba duplicada (demostración).', actor: 'Ana Quispe', occurred_at: at(25, 8, 0)},
  {action: 'technician.reactivated', subject_type: 'technician', reason: 'Confirmó su disponibilidad.', actor: 'Ana Quispe', occurred_at: at(25, 7, 30)},
  {action: 'announcement.published', subject_type: 'announcement', reason: 'Campaña de mantenimiento preventivo para bodegas y minimarkets de El Tambo y Chilca.',
    actor: 'Luis Rojas', occurred_at: at(24, 18, 15)},
  {action: 'user.updated', subject_type: 'user', reason: 'Teléfono corregido.', actor: 'Ana Quispe', occurred_at: at(22, 11, 5)},
];
const dashboard = events => ({kpis: {requests_today: 0, searching_now: 0, technicians_verified: 0, avg_assignment_minutes: null,
  premium_clients: 0, iot_open_alerts: 0}, series: {days: 30, items: []}, tasks: [], recent_events: events, failed_parts: [],
  generated_at: '2026-11-25T15:00:00.000Z'});

beforeEach(() => {
  vi.useFakeTimers({toFake: ['Date']});
  vi.setSystemTime(new Date('2026-11-25T15:00:00.000Z'));
  document.documentElement.dataset.motion = 'reduce';
  request.mockResolvedValue({data: dashboard(EVENTS)});
});
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.useRealTimers(); delete document.documentElement.dataset.motion; });

const open = async (permissions = ['dashboard.view', 'audit.view']) => {
  const navigate = vi.fn();
  render(<AdminHome navigate={navigate} permissions={permissions} user={{given_names: 'Ana'}}/>);
  return {navigate, activity: await screen.findByRole('region', {name: 'Actividad reciente'})};
};

test('S07-TC-195 la actividad es una línea de tiempo agrupada por día de Lima, con la hora en su columna y «hace N h» en el title', async () => {
  const {activity} = await open();
  expect(within(activity).getAllByRole('heading', {level: 4}).map(heading => heading.textContent)).toEqual(['Hoy', 'Ayer', '22 nov']);
  const today = within(activity).getByRole('heading', {name: 'Hoy'}).closest('.adm-day');
  const [first, second] = within(today).getAllByRole('listitem');
  const time = first.querySelector('time');
  expect(time).toHaveTextContent('08:00');
  expect(time).toHaveAttribute('title', 'hace 2 h');
  expect(time).toHaveAttribute('datetime', EVENTS[0].occurred_at);
  expect(second.querySelector('time')).toHaveAttribute('title', 'hace 2 h 30 min');
  expect(activity.querySelector('.adm-timeline-line')).not.toBeNull();
  // El motivo va en una línea; el texto completo queda en el title.
  const reason = within(activity).getByText(EVENTS[2].reason);
  expect(reason).toHaveClass('adm-event-reason');
  expect(reason).toHaveAttribute('title', EVENTS[2].reason);
  expect(within(activity).getByText('Luis Rojas')).toHaveClass('adm-event-actor');
});

test('S07-TC-196 cada acción lleva color, ícono y una etiqueta de tipo en texto: bloqueos en rojo, reactivaciones en verde, contenido en azul y usuarios en ámbar', async () => {
  const {activity} = await open();
  const item = title => within(activity).getByText(title).closest('li');
  const expectations = [
    ['Cuenta bloqueada', 'danger', 'Usuarios'], ['Técnico reactivado', 'success', 'Técnicos'],
    ['Comunicado publicado', 'info', 'Contenido'], ['Datos de usuario editados', 'warning', 'Usuarios'],
  ];
  for (const [title, tone, type] of expectations) {
    const li = item(title);
    expect(li).toHaveAttribute('data-tone', tone);
    expect(li.querySelector('.adm-event-dot svg')).not.toBeNull();
    expect(li.querySelector('.adm-event-type')).toHaveTextContent(type);
    expect(li.querySelector('.adm-event-title').tagName).toBe('STRONG');
  }
});

test('S07-TC-197 los chips filtran en el cliente los 10 eventos por tipo, sin volver a pedirlos', async () => {
  const {activity} = await open();
  const chips = within(activity).getByRole('group', {name: 'Filtrar actividad'});
  expect(within(chips).getAllByRole('button').map(button => button.textContent)).toEqual(['Todo', 'Usuarios', 'Técnicos', 'Contenido']);
  expect(within(chips).getByRole('button', {name: 'Todo'})).toHaveAttribute('aria-pressed', 'true');

  fireEvent.click(within(chips).getByRole('button', {name: 'Técnicos'}));
  expect(within(chips).getByRole('button', {name: 'Técnicos'})).toHaveAttribute('aria-pressed', 'true');
  expect(within(activity).getAllByRole('listitem').map(li => li.querySelector('.adm-event-title').textContent)).toEqual(['Técnico reactivado']);
  expect(within(activity).getAllByRole('heading', {level: 4}).map(heading => heading.textContent)).toEqual(['Hoy']);

  fireEvent.click(within(chips).getByRole('button', {name: 'Usuarios'}));
  expect(within(activity).getAllByRole('listitem')).toHaveLength(2);
  expect(request).toHaveBeenCalledTimes(1);
  cleanup();

  request.mockResolvedValue({data: dashboard([EVENTS[0]])});
  const {activity: only} = await open();
  fireEvent.click(within(only).getByRole('button', {name: 'Contenido'}));
  expect(within(only).getByText('No hay actividad de este tipo en las últimas acciones.')).toBeInTheDocument();
});

test('S07-TC-198 el pie «Ver toda la actividad» lleva a Auditoría con su permiso, y sin actividad hay estado vacío con ilustración', async () => {
  const {activity, navigate} = await open();
  fireEvent.click(within(activity).getByRole('button', {name: 'Ver toda la actividad'}));
  expect(navigate).toHaveBeenCalledWith('audit');
  cleanup();

  const {activity: limited} = await open(['dashboard.view']);
  expect(within(limited).queryByRole('button', {name: 'Ver toda la actividad'})).not.toBeInTheDocument();
  cleanup();

  request.mockResolvedValue({data: dashboard([])});
  const {activity: empty} = await open();
  expect(within(empty).getByText('Todavía no hay actividad')).toBeInTheDocument();
  expect(empty.querySelector('svg.cx-art')).not.toBeNull();
  expect(within(empty).queryByRole('group', {name: 'Filtrar actividad'})).not.toBeInTheDocument();
});
