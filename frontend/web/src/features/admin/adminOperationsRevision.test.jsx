// S07-TC-230 a 236 · Revisión del #70 (Fase A3 del panel del administrador): contador del menú en la misma línea (DEF-87,
// los tres roles comparten PanelShell), detalle con franja de estado, barra de acciones y línea de tiempo por día,
// tablero en vivo con urgencia, anillo y resumen (DEF-86) y alertas con nivel, tiempos legibles, grupos y chips.
import React from 'react';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {act, cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import PanelShell from '../panel/PanelShell';
import RequestsAdmin from './RequestsAdmin';
import AdmLive from './AdmLive';
import AdmAlerts from './AdmAlerts';
import {request} from '../administration/http';

let connected = false;
vi.mock('../administration/http', () => ({request: vi.fn(), download: vi.fn(), serverNow: () => Date.now()}));
vi.mock('../realtime/Realtime', () => ({useRealtimeResource: () => connected, RealtimeProvider: ({children}) => children}));

const NOW = '2026-11-25T15:00:00.000Z';
const css = path => readFileSync(resolve(path), 'utf8').replace(/\r\n/g, '\n');
const rule = (source, selector) => {
  const start = source.indexOf(`${selector} {`);
  return start < 0 ? '' : source.slice(start, source.indexOf('}', start));
};

const detail = (overrides = {}) => ({
  request: {id: 91, status: 'pending_availability', specialty: 'Cómputo', subcategory: 'Hardware', district: 'Huancayo', version: 6,
    created_at: '2026-11-24T14:00:00.000Z', description: 'La computadora no enciende (sintético).', mode: 'asap', subcategories: ['Hardware'],
    reference_fee: {amount: '50.00', currency: 'PEN'}, cancellation_reason: null},
  client: {id: 9, name: 'Cliente Demo', district: 'Huancayo', plan: 'free'}, technician: null,
  offers: {total: 0}, offer_list: [],
  timeline: [
    {event_type: 'request.registered', from_status: null, to_status: 'registered', summary: 'Solicitud registrada por el cliente.', reason: null, actor: 'Cliente Demo', occurred_at: '2026-11-24T13:58:00.000Z'},
    {event_type: 'request.submitted', from_status: 'registered', to_status: 'sent', summary: 'Solicitud enviada por el cliente.', reason: null, actor: 'Cliente Demo', occurred_at: '2026-11-24T14:00:00.000Z'},
    {event_type: 'offer.expired', from_status: 'pending', to_status: 'expired', summary: 'La oferta venció sin respuesta.', reason: null, actor: null, occurred_at: '2026-11-24T14:10:00.000Z'},
    {event_type: 'request.admin_rematched', from_status: 'pending_availability', to_status: 'sent', summary: 'Un administrador reenvió la solicitud al emparejamiento.',
      reason: 'Se liberó un técnico en la zona (sintético).', actor: 'Administración Demo', occurred_at: '2026-11-25T14:30:00.000Z'},
  ],
  actions: {cancel: true, rematch: false},
  action_reasons: {cancel: null, rematch: 'Ya tiene un técnico asignado: si hace falta, cancélala con motivo.'},
  ...overrides,
});
const live = () => ({
  server_time: NOW,
  searching: [
    {id: 41, status: 'sent', specialty: 'Electricidad', specialty_code: 'electricidad', subcategory: 'Instalaciones residenciales', district: 'Chilca',
      submitted_at: '2026-11-25T14:10:00.000Z', pending_expires_at: null,
      round: {round_no: 1, status: 'open', opened_at: '2026-11-25T14:58:00.000Z', expires_at: '2026-11-25T15:08:00.000Z', open_count: 2, expired_count: 1},
      open_offers: [{id: 2, technician: {id: 4, name: 'Luz Demo'}, available_at: '2026-11-25T14:58:00.000Z', expires_at: '2026-11-25T15:08:00.000Z'},
        {id: 3, technician: {id: 5, name: 'Raúl Demo'}, available_at: '2026-11-25T14:58:00.000Z', expires_at: '2026-11-25T15:08:00.000Z'}]},
    {id: 44, status: 'sent', specialty: 'Cómputo', specialty_code: 'computo', subcategory: 'Hardware', district: 'Huancayo',
      submitted_at: '2026-11-25T14:50:00.000Z', pending_expires_at: null,
      round: {round_no: 2, status: 'open', opened_at: '2026-11-25T14:51:00.000Z', expires_at: '2026-11-25T15:03:00.000Z', open_count: 1, expired_count: 0},
      open_offers: [{id: 6, technician: {id: 7, name: 'Ana Demo'}, available_at: '2026-11-25T14:53:00.000Z', expires_at: '2026-11-25T15:03:00.000Z'}]},
  ],
  pending: [{id: 43, status: 'pending_availability', specialty: 'Cómputo', specialty_code: 'computo', subcategory: 'Hardware', district: 'Huancayo',
    submitted_at: '2026-11-24T16:00:00.000Z', pending_expires_at: '2026-11-25T18:20:00.000Z', round: null, open_offers: []}],
  pending_overdue: [{id: 39, specialty: 'Cómputo', specialty_code: 'computo', subcategory: 'Redes', district: 'El Tambo', pending_expires_at: '2026-11-25T14:15:00.000Z'}],
  expired_offers: [],
});
const alerts = () => ({available: true, generated_at: NOW, items: [
  {type: 'pending_expiring', level: 'attention', priority: 1, request_id: 43, alert_id: null, minutes: 40, actions: ['open', 'rematch'],
    request: {specialty: 'Cómputo', subcategory: 'Hardware', district: 'Huancayo'}, rounds_without_acceptance: 1},
  {type: 'unassigned', level: 'urgent', priority: 2, request_id: 12, alert_id: null, minutes: 38893, actions: ['open', 'rematch'],
    request: {specialty: 'Cómputo', subcategory: 'Hardware', district: 'Huancayo'}, rounds_without_acceptance: 3},
  {type: 'unassigned', level: 'attention', priority: 2, request_id: 41, alert_id: null, minutes: 200, actions: ['open'],
    request: {specialty: 'Electricidad', subcategory: 'Tableros', district: 'Chilca'}, rounds_without_acceptance: 0},
  {type: 'iot_unattended', level: 'urgent', priority: 4, request_id: null, alert_id: 8, minutes: 125, device: 'Vitrina 1', message: 'Temperatura fuera de rango', actions: ['iot']},
  {type: 'low_performance', level: 'follow_up', priority: 5, request_id: null, alert_id: null, minutes: null, technician: {id: 3, name: 'Técnico Ocupado Demo'},
    offers: 6, accepted: 1, expired: 4, days: 30, actions: ['review']},
]});

let routes;
beforeEach(() => {
  connected = false;
  document.documentElement.dataset.motion = 'reduce';
  vi.stubGlobal('matchMedia', () => ({matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()}));
  routes = {
    'GET /admin/requests/91': () => ({data: detail()}),
    'GET /admin/matching/live': () => ({data: live()}),
    'GET /admin/alerts': () => ({data: alerts()}),
  };
  request.mockImplementation(async (path, body, method = body ? 'POST' : 'GET') => {
    const key = `${method} ${path.split('?')[0]}`;
    return routes[key] ? routes[key](body, path) : {data: []};
  });
});
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); delete document.documentElement.dataset.motion; });

test('S07-TC-230 el contador del menú queda a la derecha en la misma línea aunque el texto se parta en dos [DEF-87]', () => {
  // Cliente, técnico y administrador usan el mismo PanelShell: basta con un ítem activo con contador y texto largo.
  const page = label => () => <section aria-label={label}><h2>{label}</h2></section>;
  render(<PanelShell user={{id: '1', name: 'Admin Demo', role: {code: 'admin'}, sidebar_collapsed: null}} role="admin" roleLabel="Administración"
    navLabel="Administración" modern onLogout={vi.fn()} onUserChange={vi.fn()} initialSection="alerts"
    badges={{alerts: {count: 13, label: '13 alertas operativas'}}}
    sections={[{id: 'alerts', group: 'Operación', label: 'Alertas operativas del día', icon: 'alert', render: page('Alertas')}]}/>);
  const item = screen.getByRole('button', {name: /Alertas operativas del día/});
  const text = item.querySelector('.panel-nav-text');
  expect(item).toHaveAttribute('aria-current', 'page');
  expect(text).toHaveClass('has-count');
  expect(text.querySelector(':scope > .panel-label')).not.toBeNull();
  expect(text.querySelector(':scope > .panel-nav-badge')).toHaveTextContent('13');

  const panel = css('src/features/panel/panel.css');
  const row = rule(panel, '.panel-nav-text.has-count');
  expect(row).toMatch(/flex-wrap:\s*nowrap/);
  expect(row).toMatch(/align-items:\s*center/);
  expect(rule(panel, '.panel-nav-text.has-count > .panel-label')).toMatch(/min-width:\s*0/);
  expect(rule(panel, '.panel-nav-text.has-count > .panel-nav-badge')).toMatch(/flex-shrink:\s*0/);
});

test('S07-TC-231 el detalle tiene franja y estado grande, barra de acciones con primaria y peligro, y la que no aplica desactivada con su motivo [D-120]', async () => {
  render(<RequestsAdmin intent={{request: 91}}/>);
  const page = await screen.findByRole('region', {name: 'Solicitud N.º 91'});
  const head = page.querySelector('.adm-request-head');
  expect(head).toHaveAttribute('data-tone', 'warning');
  expect(within(head).getByText('Pendiente de disponibilidad').closest('.adm-status')).toHaveClass('is-large');

  const bar = within(page).getByRole('toolbar', {name: 'Acciones de la solicitud'});
  const rematch = within(bar).getByRole('button', {name: 'Reenviar al emparejamiento'});
  const cancel = within(bar).getByRole('button', {name: 'Cancelar con motivo'});
  expect(rematch).toHaveClass('adm-btn-primary');
  expect(rematch).toBeDisabled();
  expect(rematch).toHaveAttribute('title', 'Ya tiene un técnico asignado: si hace falta, cancélala con motivo.');
  expect(cancel).toHaveClass('adm-btn-danger');
  expect(cancel).toBeEnabled();
  expect(rematch.querySelector('svg')).not.toBeNull();
  expect(cancel.querySelector('svg')).not.toBeNull();

  ['Resumen', 'Cliente', 'Técnico asignado'].forEach(name => {
    const card = within(page).getByRole('region', {name});
    expect(card.querySelector('h3 .adm-icon-circle svg')).not.toBeNull();
    expect(card.querySelectorAll('.adm-rows dt svg').length).toBeGreaterThan(0);
  });
  // Sin ofertas: estado vacío con ilustración.
  const offers = within(page).getByRole('region', {name: 'Ofertas enviadas'});
  expect(offers.querySelector('svg.cx-art')).not.toBeNull();
  expect(offers).toHaveTextContent('Todavía no se enviaron ofertas');
});

test('S07-TC-232 la línea de tiempo del detalle va por día, con hora, ícono y color por tipo y el motivo del administrador', async () => {
  vi.useFakeTimers({toFake: ['Date']});
  vi.setSystemTime(new Date(NOW));
  render(<RequestsAdmin intent={{request: 91}}/>);
  const page = await screen.findByRole('region', {name: 'Solicitud N.º 91'});
  const timeline = within(page).getByRole('region', {name: 'Línea de tiempo'});
  expect([...timeline.querySelectorAll('.adm-day-label')].map(label => label.textContent)).toEqual(['Ayer', 'Hoy']);
  const events = [...timeline.querySelectorAll('.adm-event')];
  expect(events.map(event => event.querySelector('.adm-event-title').textContent)).toEqual(
    ['Solicitud registrada', 'Solicitud enviada', 'Oferta vencida', 'Reenviada por el administrador']);
  expect(events.map(event => event.getAttribute('data-tone'))).toEqual(['slate', 'info', 'warning', 'info']);
  expect(events[0].querySelector('.adm-event-time')).toHaveTextContent('08:58');
  expect(events.every(event => event.querySelector('.adm-event-dot svg'))).toBe(true);
  expect(events[3]).toHaveTextContent('Motivo: Se liberó un técnico en la zona (sintético).');
  expect(events[3]).toHaveTextContent('Administración Demo');
});

test('S07-TC-233 el tablero en vivo resume arriba y cada tarjeta muestra urgencia, especialidad, espera, ronda y anillo con mm:ss', async () => {
  vi.useFakeTimers({toFake: ['Date', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout']});
  vi.setSystemTime(new Date(NOW));
  render(<AdmLive navigate={vi.fn()}/>);
  await act(async () => { await Promise.resolve(); });
  const summary = screen.getByRole('group', {name: 'Resumen del emparejamiento'});
  expect([...summary.querySelectorAll('.adm-kpi')].map(kpi => kpi.textContent)).toEqual(
    ['2Buscando ahora', '3Ofertas abiertas', '1Pendientes de 24 h']);
  const searching = screen.getByRole('region', {name: 'Buscando técnico'});
  expect(searching.querySelector('.adm-live-count')).toHaveTextContent('2');
  const [first, second] = within(searching).getAllByRole('listitem').filter(li => li.classList.contains('adm-live-card'));
  expect(first).toHaveAttribute('data-urgency', 'ok');
  expect(second).toHaveAttribute('data-urgency', 'soon');
  expect(first.querySelector('.adm-live-specialty svg')).not.toBeNull();
  expect(first).toHaveTextContent('N.º 41 · Instalaciones residenciales');
  expect(first).toHaveTextContent('Buscando hace 50 min');
  expect(first).toHaveTextContent('Ronda 1 · 2 ofertas abiertas · 1 vencida');
  expect(second).toHaveTextContent('Ronda 2 · 1 oferta abierta');
  const offer = within(first).getAllByRole('listitem')[0];
  expect(offer.querySelector('svg.adm-mini-ring')).not.toBeNull();
  expect(within(offer).getByText('Pendiente').closest('.adm-status')).toHaveAttribute('data-tone');
  expect(within(offer).getByRole('timer')).toHaveTextContent('08:00');
  act(() => { vi.advanceTimersByTime(3 * 60000 + 1000); });
  expect(first).toHaveAttribute('data-urgency', 'soon');
  act(() => { vi.advanceTimersByTime(5 * 60000); });
  expect(first).toHaveAttribute('data-urgency', 'expired');
  expect(within(first).getByRole('button', {name: 'Ver la solicitud 41'})).toHaveClass('adm-btn-secondary');
});

test('S07-TC-234 el pendiente vencido no queda en su columna ni dice «Vence en 0 min»: sale aparte con «Venció hace» [DEF-86]', async () => {
  vi.useFakeTimers({toFake: ['Date', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout']});
  vi.setSystemTime(new Date(NOW));
  render(<AdmLive navigate={vi.fn()}/>);
  await act(async () => { await Promise.resolve(); });
  const pending = screen.getByRole('region', {name: 'En el pendiente de 24 h'});
  expect(pending).toHaveTextContent('Vence en 3 h 20 min');
  expect(pending).not.toHaveTextContent('N.º 39');
  const overdue = screen.getByRole('region', {name: 'Pendientes ya vencidos'});
  expect(overdue).toHaveTextContent('N.º 39 · Redes');
  expect(overdue).toHaveTextContent('Venció hace 45 min');
  expect(document.body).not.toHaveTextContent('Vence en 0 min');
  // Un pendiente que llega a su plazo mientras se mira el tablero deja de decir «Vence en …».
  act(() => { vi.advanceTimersByTime((3 * 60 + 21) * 60000); });
  expect(pending).not.toHaveTextContent('Vence en 0 min');
  expect(pending).toHaveTextContent('Venció hace 1 min');
});

test('S07-TC-235 las alertas tienen nivel con color e ícono, tiempos legibles, detalle del servicio y van agrupadas con chips', async () => {
  const navigate = vi.fn();
  render(<AdmAlerts navigate={navigate}/>);
  const urgent = (await screen.findAllByRole('listitem')).find(li => li.textContent.includes('N.º 12'));
  expect(urgent).toHaveAttribute('data-level', 'urgent');
  expect(urgent).toHaveAttribute('data-tone', 'danger');
  expect(urgent.querySelector('.adm-alert-icon svg')).not.toBeNull();
  expect(within(urgent).getByText('Urgente')).toHaveClass('adm-level');
  expect(urgent).toHaveTextContent('Sin técnico hace 27 días');
  expect(urgent).toHaveTextContent('Cómputo · Huancayo · 3 rondas sin aceptar');
  const attention = screen.getAllByRole('listitem').find(li => li.textContent.includes('N.º 41'));
  expect(attention).toHaveAttribute('data-tone', 'warning');
  expect(attention).toHaveTextContent('Sin técnico hace 3 h 20 min');
  expect(attention).toHaveTextContent('Atención');
  expect(document.body).not.toHaveTextContent(/\d{3,} h/);

  const groups = screen.getAllByRole('region').filter(region => region.classList.contains('adm-alert-group'));
  expect(groups.map(group => group.querySelector('h3').textContent)).toEqual(
    ['Pendientes por vencer1', 'Sin técnico asignado2', 'Sensores con falla1', 'Desempeño bajo1']);
  const chips = screen.getByRole('group', {name: 'Filtrar alertas'});
  fireEvent.click(within(chips).getByRole('button', {name: 'Sin técnico asignado (2)'}));
  expect(within(chips).getByRole('button', {name: 'Sin técnico asignado (2)'})).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getAllByRole('region').filter(region => region.classList.contains('adm-alert-group'))).toHaveLength(1);
  fireEvent.click(within(chips).getByRole('button', {name: 'Todas (5)'}));

  const rematch = within(urgent).getByRole('button', {name: 'Reenviar la solicitud 12'});
  const open = within(urgent).getByRole('button', {name: 'Ver la solicitud 12'});
  expect(rematch).toHaveClass('adm-btn-primary');
  expect(open).toHaveClass('adm-btn-secondary');
});

test('S07-TC-236 el desempeño bajo es seguimiento en azul con «Revisar», y la falla IoT es urgente con «Ver sensores»', async () => {
  const navigate = vi.fn();
  render(<AdmAlerts navigate={navigate}/>);
  const items = await screen.findAllByRole('listitem');
  const low = items.find(li => li.textContent.includes('Técnico Ocupado Demo'));
  expect(low).toHaveAttribute('data-tone', 'info');
  expect(within(low).getByText('Seguimiento')).toHaveClass('adm-level');
  expect(low).toHaveTextContent('6 ofertas en 30 días · 1 aceptada · 4 vencidas');
  fireEvent.click(within(low).getByRole('button', {name: 'Revisar el desempeño de Técnico Ocupado Demo'}));
  expect(navigate).toHaveBeenCalledWith('performance', {technician: 3});
  const iot = items.find(li => li.textContent.includes('Vitrina 1'));
  expect(iot).toHaveAttribute('data-tone', 'danger');
  expect(iot).toHaveTextContent('Falla de sensor sin atender hace 2 h 5 min');
  expect(within(iot).getByRole('button', {name: 'Ver sensores'})).toHaveClass('adm-btn-primary');
});
