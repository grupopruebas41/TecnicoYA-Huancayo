import React from 'react';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {afterEach, expect, test, vi} from 'vitest';
import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import MyRequests from './MyRequests';
import {request} from '../administration/http';
// S05-TC-162 a 177 y 180 · Fase 2 del panel final: Mis solicitudes completo sobre GET /client/requests (contrato S5 §10).
// S05-TC-169, 170, 171, 177 y 180 se adaptaron a D-100 aprobada: el motivo se elige de una lista cerrada.
vi.mock('../administration/http', () => ({request: vi.fn(), serverNow: () => Date.parse('2026-11-04T20:00:00Z')}));
vi.mock('../offers/RequestTracking', () => ({default: ({requestId}) => <p>Seguimiento de la solicitud {requestId}</p>}));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

const fail = (message, status, code) => Object.assign(new Error(message), {status, code, fields: {}});
const card = (id, overrides = {}) => ({
  id, status: 'sent', phase: 'awaiting_responses', mode: 'asap', source: 'automatic', version: 2, order_id: null, urgency: 'normal',
  specialty: {id: 1, name: 'Cómputo'}, subcategories: [{id: 11, name: 'Reparación de hardware'}], district: {id: 1, name: 'Huancayo'},
  created_at: '2026-11-04T19:00:00.000Z', submitted_at: '2026-11-04T19:40:00.000Z', updated_at: '2026-11-04T19:40:00.000Z',
  preferred_start_at: null, preferred_end_at: null, time_slot: null, technician: null, recent_events: [], can_cancel: true, ...overrides,
});
const board = (items = [], overrides = {}) => ({data: {items, counts: {active: 2, scheduled: 1, completed: 3, cancelled: 4},
  pagination: {page: 1, per_page: 10, total: items.length, last_page: 1}, ...overrides}});
const lone = (...cards) => cards.map(item => ({order: null, requests: [item]}));

function routes(respond = () => board(lone(card(41)))) {
  request.mockImplementation(async (path, body, method, options) => {
    if (path.startsWith('/client/requests')) return respond(path);
    if (path.endsWith('/cancellation')) return routes.cancel(body, options);
    if (path.startsWith('/requests/')) return {data: {id: +path.split('/')[2], status: 'sent', phase: 'awaiting_responses', description: 'Falla sintética suficiente.',
      subcategory: {name: 'Hardware'}, subcategories: [{id: 11, name: 'Hardware'}], district: {name: 'Huancayo'}, reference_fee: {amount: null}, attachments: [], timeline: []}};
    return {data: []};
  });
}
routes.cancel = async () => ({data: {id: 41, status: 'cancelled', phase: 'cancelled', version: 3}});
const boardCalls = () => request.mock.calls.map(([path]) => path).filter(path => path.startsWith('/client/requests'));

test('S05-TC-162 cuatro pestañas con contador, Activas por defecto; cambiar de pestaña pide esa pestaña y se maneja con flechas', async () => {
  routes();
  render(<MyRequests/>);
  const tabs = screen.getByRole('tablist', {name: 'Estados de tus solicitudes'});
  await screen.findByRole('article');

  expect(within(tabs).getAllByRole('tab').map(tab => tab.textContent)).toEqual(['Activas (2)', 'Programadas (1)', 'Completadas (3)', 'Canceladas (4)']);
  expect(within(tabs).getByRole('tab', {name: /Activas/})).toHaveAttribute('aria-selected', 'true');
  expect(boardCalls()[0]).toBe('/client/requests?tab=active&page=1');

  fireEvent.click(within(tabs).getByRole('tab', {name: /Completadas/}));
  await waitFor(() => expect(boardCalls().at(-1)).toBe('/client/requests?tab=completed&page=1'));
  fireEvent.keyDown(within(tabs).getByRole('tab', {name: /Completadas/}), {key: 'ArrowRight'});
  expect(within(tabs).getByRole('tab', {name: /Canceladas/})).toHaveFocus();
  await waitFor(() => expect(boardCalls().at(-1)).toBe('/client/requests?tab=cancelled&page=1'));
});

test('S05-TC-163 agrupa por pedido con su fecha en Lima y número de servicios; una solicitud suelta o un pedido de una sola no llevan grupo', async () => {
  routes(() => board([
    {order: {id: 9, submitted_at: '2026-11-05T03:00:00.000Z', total: 3}, requests: [card(42, {order_id: 9}), card(41, {order_id: 9})]},
    {order: {id: 8, submitted_at: '2026-11-04T15:00:00.000Z', total: 1}, requests: [card(40, {order_id: 8})]},
    {order: null, requests: [card(39)]},
  ]));
  render(<MyRequests/>);

  const group = await screen.findByRole('region', {name: 'Pedido del 4 nov · 3 servicios'});
  expect(within(group).getByRole('heading', {name: 'Pedido del 4 nov · 3 servicios'})).toBeInTheDocument();
  expect(within(group).getAllByRole('article')).toHaveLength(2);
  expect(screen.getAllByRole('region', {name: /^Pedido/})).toHaveLength(1);
  expect(screen.getAllByRole('article')).toHaveLength(4);
});

test('S05-TC-164 la tarjeta muestra especialidad, subcategorías y el estado con ícono y texto, nunca solo color', async () => {
  routes(() => board(lone(card(41, {subcategories: [{id: 11, name: 'Reparación de hardware'}, {id: 12, name: 'Redes'}], phase: 'awaiting_choice'}))));
  render(<MyRequests/>);

  const item = await screen.findByRole('article');
  expect(within(item).getByRole('heading', {name: 'Cómputo'})).toBeInTheDocument();
  expect(within(item).getByText('Reparación de hardware, Redes')).toBeInTheDocument();
  expect(within(item).getByText('Solicitud #41')).toBeInTheDocument();
  const status = within(item).getByText('Elige a tu técnico').closest('.client-status');
  expect(status).toHaveClass('is-choice');
  expect(status.querySelector('svg')).not.toBeNull();
  // Vistos en las capturas: el ícono va al lado del texto y las cuatro pestañas caben en el celular.
  const css = readFileSync(resolve('src/features/client/client.css'), 'utf8').replace(/\r\n/g, '\n');
  expect(css).toMatch(/\.client-card-head \.client-status \{[^}]*display: inline-flex/);
  expect(css).toMatch(/\.client-card-head \.client-status \.panel-svg-icon \{[^}]*flex: none/);
  expect(css).toMatch(/@media \(max-width: 760px\) \{\s*\.panel-shell \.client-requests-page \.client-tabs \{[^}]*grid-template-columns: 1fr 1fr/);
});

test.each([
  ['cancelled', 'Cancelada'], ['expired', 'Expirada'], ['completed', 'Completada'], ['closed', 'Completada'], ['unrated', 'Completada'],
  ['in_progress', 'En atención'], ['assigned', 'Asignada'], ['registered', 'Registrada'], ['pending_availability', 'Pendiente de disponibilidad'],
])('S05-TC-165 cada estado tiene su texto: %s', async (phase, label) => {
  routes(() => board(lone(card(41, {status: phase, phase}))));
  render(<MyRequests/>);
  expect(within(await screen.findByRole('article')).getByText(label)).toBeInTheDocument();
});

test('S05-TC-166 mientras busca muestra «Buscando técnico» con el tiempo transcurrido; asignada, el técnico; por elegir, el siguiente paso', async () => {
  routes(() => board(lone(
    card(41),
    card(42, {phase: 'pending_availability', status: 'pending_availability', submitted_at: '2026-11-04T17:00:00.000Z'}),
    card(43, {phase: 'matching', submitted_at: '2026-11-02T20:00:00.000Z'}),
    card(44, {phase: 'assigned', status: 'assigned', technician: {id: 5, display_name: 'Rosa Sintética'}}),
    card(45, {phase: 'awaiting_choice'}),
    card(46, {phase: 'registered', status: 'registered', submitted_at: null}),
  )));
  render(<MyRequests/>);
  const items = await screen.findAllByRole('article');

  expect(items[0]).toHaveTextContent('Buscando técnico · hace 20 min');
  expect(items[1]).toHaveTextContent('Buscando técnico · hace 3 h');
  expect(items[2]).toHaveTextContent('Buscando técnico · hace 2 d');
  expect(items[3]).toHaveTextContent('Técnico: Rosa Sintética');
  expect(items[3]).not.toHaveTextContent('Buscando técnico');
  expect(items[4]).toHaveTextContent('Elige a tu técnico entre los que aceptaron.');
  expect(items[5]).toHaveTextContent('Completa y envía tu solicitud.');
  expect(items[5]).not.toHaveTextContent('Buscando técnico');
});

test('S05-TC-167 muestra fecha y franja de Lima, «Lo antes posible» y el distrito', async () => {
  routes(() => board(lone(
    card(41),
    card(42, {mode: 'scheduled', time_slot: 'tarde', preferred_start_at: '2026-11-05T17:00:00.000Z', preferred_end_at: '2026-11-05T23:00:00.000Z'}),
    card(43, {mode: 'scheduled', time_slot: null, preferred_start_at: '2026-11-06T15:00:00.000Z', preferred_end_at: '2026-11-06T17:00:00.000Z'}),
  )));
  render(<MyRequests/>);
  const items = await screen.findAllByRole('article');

  expect(items[0]).toHaveTextContent('Lo antes posible · Huancayo');
  expect(items[1]).toHaveTextContent('jueves, 5 de noviembre · Tarde (12–18) · Huancayo');
  expect(items[2]).toHaveTextContent('viernes, 6 de noviembre · 10:00 a 12:00 · Huancayo');
});

test('S05-TC-168 la línea de tiempo resumida va en una lista accesible; sin eventos no se muestra', async () => {
  routes(() => board(lone(
    card(41, {recent_events: [
      {type: 'request.submitted', label: 'Solicitud enviada', occurred_at: '2026-11-04T19:40:00.000Z'},
      {type: 'round.opened', label: 'Enviamos tu solicitud a técnicos disponibles', occurred_at: '2026-11-04T19:41:00.000Z'},
    ]}),
    card(42),
  )));
  render(<MyRequests/>);
  await screen.findAllByRole('article');

  const list = screen.getByRole('list', {name: 'Últimos avances de la solicitud #41'});
  expect(within(list).getAllByRole('listitem').map(item => item.querySelector('strong').textContent))
    .toEqual(['Solicitud enviada', 'Enviamos tu solicitud a técnicos disponibles']);
  expect(screen.queryByRole('list', {name: 'Últimos avances de la solicitud #42'})).toBeNull();
});

test('S05-TC-169 cancelar abre un diálogo accesible con la lista cerrada de motivos en opciones grandes; «Otro motivo» exige texto [D-100]', async () => {
  routes();
  render(<MyRequests/>);
  const open = await screen.findByRole('button', {name: 'Cancelar la solicitud #41'});
  open.focus();
  fireEvent.click(open);

  const dialog = screen.getByRole('dialog', {name: 'Cancelar la solicitud #41'});
  expect(dialog).toHaveAttribute('aria-modal', 'true');
  const group = within(dialog).getByRole('radiogroup', {name: '¿Por qué cancelas?'});
  const options = within(group).getAllByRole('radio');
  expect(options.map(option => option.closest('label').textContent)).toEqual(['Ya se solucionó el problema', 'Encontré otro técnico',
    'Necesito cambiar la fecha u horario', 'El precio no me conviene', 'Me equivoqué al hacer el pedido', 'Otro motivo']);
  options.forEach(option => expect(option.closest('label')).toHaveClass('client-reason-option'));
  await waitFor(() => expect(options[0]).toHaveFocus());

  fireEvent.click(within(dialog).getByRole('button', {name: 'Cancelar solicitud'}));
  expect(await within(dialog).findByText('Elige un motivo.')).toHaveAttribute('id', 'cancel-code-error');
  expect(group).toHaveAttribute('aria-describedby', 'cancel-code-error');
  expect(within(dialog).getByRole('textbox', {name: 'Comentario (opcional)'})).toBeInTheDocument();

  fireEvent.click(within(group).getByRole('radio', {name: 'Otro motivo'}));
  const reason = within(dialog).getByRole('textbox', {name: 'Cuéntanos el motivo'});
  expect(reason).toBeRequired();
  fireEvent.change(reason, {target: {value: 'Nada'}});
  fireEvent.click(within(dialog).getByRole('button', {name: 'Cancelar solicitud'}));
  expect(await within(dialog).findByText('Cuéntanos el motivo: debe tener de 5 a 255 caracteres.')).toHaveAttribute('id', 'cancel-reason-error');
  expect(reason).toHaveAttribute('aria-invalid', 'true');
  expect(reason).toHaveAttribute('aria-describedby', 'cancel-reason-error');
  expect(request.mock.calls.filter(([path]) => path.endsWith('/cancellation'))).toHaveLength(0);
  const css = readFileSync(resolve('src/features/client/client.css'), 'utf8').replace(/\r\n/g, '\n');
  expect(css).toMatch(/\.client-reason-option \{[^}]*min-height: 48px/);

  fireEvent.keyDown(dialog, {key: 'Escape'});
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(open).toHaveFocus();
});

test('S05-TC-170 cancelar envía el motivo con la versión y una clave que se reutiliza al reintentar; luego avisa, recarga y lleva el foco al título', async () => {
  let calls = 0;
  routes.cancel = async () => {
    calls += 1;
    if (calls === 1) throw fail('No pudimos confirmar el resultado.', 0);
    return {data: {id: 41, status: 'cancelled', phase: 'cancelled', version: 3}};
  };
  routes();
  render(<MyRequests/>);
  fireEvent.click(await screen.findByRole('button', {name: 'Cancelar la solicitud #41'}));
  const dialog = screen.getByRole('dialog');
  fireEvent.click(within(dialog).getByRole('radio', {name: 'Ya se solucionó el problema'}));
  fireEvent.change(within(dialog).getByRole('textbox'), {target: {value: '  Ya lo resolví por otro medio.  '}});
  const before = boardCalls().length;

  await act(async () => { fireEvent.click(within(dialog).getByRole('button', {name: 'Cancelar solicitud'})); });
  expect(within(dialog).getByRole('alert')).toHaveTextContent('No pudimos confirmar el resultado.');
  await act(async () => { fireEvent.click(within(dialog).getByRole('button', {name: 'Cancelar solicitud'})); });

  const posts = request.mock.calls.filter(([path]) => path.endsWith('/cancellation'));
  expect(posts).toHaveLength(2);
  expect(posts[0][0]).toBe('/requests/41/cancellation');
  expect(posts[0][1]).toEqual({reason_code: 'solved', reason: 'Ya lo resolví por otro medio.', expected_version: 2});
  expect(posts[0][2]).toBe('POST');
  expect(posts[0][3].headers['Idempotency-Key']).toBe(posts[1][3].headers['Idempotency-Key']);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(await screen.findByText('Cancelaste la solicitud #41.')).toBeInTheDocument();
  await waitFor(() => expect(boardCalls().length).toBeGreaterThan(before));
  expect(screen.getByRole('heading', {name: 'Mis solicitudes'})).toHaveFocus();
});

test('S05-TC-171 si el servidor ya no permite cancelar, avisa con su mensaje, cierra y actualiza la lista', async () => {
  routes.cancel = async () => { throw fail('Esta solicitud ya no se puede cancelar: la atención ya empezó o la solicitud terminó.', 409, 'CANCELLATION_NOT_ALLOWED'); };
  routes();
  render(<MyRequests/>);
  fireEvent.click(await screen.findByRole('button', {name: 'Cancelar la solicitud #41'}));
  const dialog = screen.getByRole('dialog');
  fireEvent.click(within(dialog).getByRole('radio', {name: 'Me equivoqué al hacer el pedido'}));
  const before = boardCalls().length;

  await act(async () => { fireEvent.click(within(dialog).getByRole('button', {name: 'Cancelar solicitud'})); });

  expect(screen.queryByRole('dialog')).toBeNull();
  expect(await screen.findByRole('alert')).toHaveTextContent('ya no se puede cancelar');
  await waitFor(() => expect(boardCalls().length).toBeGreaterThan(before));
});

test('S05-TC-172 sin can_cancel no hay botón; en las completadas, «Calificar» se ve desactivado con su rótulo', async () => {
  routes(() => board(lone(card(41, {status: 'completed', phase: 'completed', can_cancel: false}), card(42, {status: 'in_progress', phase: 'in_progress', can_cancel: false}))));
  render(<MyRequests/>);
  const [done, working] = await screen.findAllByRole('article');

  expect(within(done).queryByRole('button', {name: /Cancelar/})).toBeNull();
  const rate = within(done).getByRole('button', {name: 'Calificar la solicitud #41'});
  expect(rate).toBeDisabled();
  expect(rate).toHaveAttribute('aria-describedby', 'rate-note-41');
  expect(document.getElementById('rate-note-41')).toHaveTextContent('Disponible en el Sprint 6');
  expect(within(working).queryByRole('button', {name: /Calificar/})).toBeNull();
  expect(within(working).queryByRole('button', {name: /Cancelar/})).toBeNull();
});

test('S05-TC-173 la búsqueda consulta tras dejar de escribir y vuelve a la página 1; si no hay resultados ofrece limpiarla', async () => {
  routes(path => (path.includes('q=') ? board([]) : board(lone(card(41)), {pagination: {page: 2, per_page: 10, total: 11, last_page: 2}})));
  render(<MyRequests/>);
  await screen.findByRole('article');
  fireEvent.click(screen.getByRole('button', {name: 'Página 2'}));
  await waitFor(() => expect(boardCalls().at(-1)).toBe('/client/requests?tab=active&page=2'));

  const box = screen.getByRole('searchbox', {name: 'Buscar en tus solicitudes'});
  fireEvent.change(box, {target: {value: 'ne'}});
  fireEvent.change(box, {target: {value: 'nevera'}});

  await waitFor(() => expect(boardCalls().at(-1)).toBe('/client/requests?tab=active&q=nevera&page=1'));
  expect(boardCalls().filter(path => path.includes('q=ne&'))).toHaveLength(0);
  expect(await screen.findByText('Ninguna solicitud coincide con «nevera».')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: 'Limpiar búsqueda'}));
  await waitFor(() => expect(boardCalls().at(-1)).toBe('/client/requests?tab=active&page=1'));
  expect(box).toHaveValue('');
});

test('S05-TC-174 pagina con el mismo control del panel y solo si hay más de una página', async () => {
  routes(path => board(lone(card(path.includes('page=2') ? 51 : 41)), {pagination: {page: path.includes('page=2') ? 2 : 1, per_page: 10, total: 11, last_page: 2}}));
  render(<MyRequests/>);
  await screen.findByText('Solicitud #41');

  fireEvent.click(screen.getByRole('button', {name: 'Página siguiente'}));
  expect(await screen.findByText('Solicitud #51')).toBeInTheDocument();
  expect(screen.getByRole('button', {name: 'Página 2'})).toHaveAttribute('aria-current', 'page');
  cleanup();

  routes();
  render(<MyRequests/>);
  await screen.findByRole('article');
  expect(screen.queryByRole('navigation', {name: 'Páginas de solicitudes'})).toBeNull();
});

test('S05-TC-175 sin solicitudes muestra un estado vacío con «Nueva solicitud»; una pestaña vacía lo dice aparte', async () => {
  const navigate = vi.fn();
  routes(() => board([], {counts: {active: 0, scheduled: 0, completed: 0, cancelled: 0}}));
  render(<MyRequests navigate={navigate}/>);

  expect(await screen.findByText('Aún no tienes solicitudes')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: 'Nueva solicitud'}));
  expect(navigate).toHaveBeenCalledWith('new');
  cleanup();

  routes(() => board([]));
  render(<MyRequests navigate={navigate}/>);
  expect(await screen.findByText('No tienes solicitudes en esta pestaña.')).toBeInTheDocument();
  expect(screen.queryByText('Aún no tienes solicitudes')).toBeNull();
});

test('S05-TC-176 carga con skeleton y aria-busy; un error ofrece Reintentar con el botón del tema', async () => {
  let release;
  routes(() => new Promise(done => { release = () => done(board(lone(card(41)))); }));
  render(<MyRequests/>);

  const panel = screen.getByRole('tabpanel');
  expect(panel).toHaveAttribute('aria-busy', 'true');
  expect(panel.querySelectorAll('.client-board-skeleton')).toHaveLength(3);
  expect(within(panel).getByText('Cargando solicitudes…')).toBeInTheDocument();
  await act(async () => { release(); });
  expect(panel).toHaveAttribute('aria-busy', 'false');
  expect(panel.querySelector('.client-board-skeleton')).toBeNull();
  cleanup();

  let failing = true;
  routes(() => { if (failing) throw fail('No pudimos cargar tus solicitudes.', 500); return board(lone(card(41))); });
  render(<MyRequests/>);
  expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar tus solicitudes.');
  const retry = screen.getByRole('button', {name: 'Reintentar'});
  expect(retry).toHaveClass('button', 'primary');
  failing = false;
  fireEvent.click(retry);
  expect(await screen.findByRole('article')).toBeInTheDocument();
  const css = readFileSync(resolve('src/features/client/client.css'), 'utf8').replace(/\r\n/g, '\n');
  expect(css).toMatch(/prefers-reduced-motion: reduce\) \{[^}]*\.client-board-skeleton/);
  expect(css).toMatch(/\.panel-shell \.client-requests-page \.button\.primary/);
});

test('S05-TC-177 «Ver detalle» abre el seguimiento; desde el Inicio se abre directo; un borrador ofrece continuar; cancelar la abierta la cierra', async () => {
  const onContinue = vi.fn();
  routes(() => board(lone(card(41), card(42, {status: 'registered', phase: 'registered'}))));
  const {rerender} = render(<MyRequests onContinue={onContinue}/>);
  fireEvent.click(await screen.findByRole('button', {name: 'Ver detalle de la solicitud #41'}));
  expect(await screen.findByText('Seguimiento de la solicitud 41')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', {name: 'Cancelar la solicitud #41'}));
  const dialog = screen.getByRole('dialog');
  fireEvent.click(within(dialog).getByRole('radio', {name: 'Me equivoqué al hacer el pedido'}));
  routes.cancel = async () => ({data: {id: 41, status: 'cancelled', phase: 'cancelled', version: 3}});
  await act(async () => { fireEvent.click(within(dialog).getByRole('button', {name: 'Cancelar solicitud'})); });
  await waitFor(() => expect(screen.queryByText('Seguimiento de la solicitud 41')).toBeNull());

  rerender(<MyRequests key="inicio" openId={41} onContinue={onContinue}/>);
  expect(await screen.findByText('Seguimiento de la solicitud 41')).toBeInTheDocument();
});

test('S05-TC-180 si la búsqueda avanzó mientras estaba abierta la lista, cancelar relee la versión y reintenta una sola vez', async () => {
  const bodies = [];
  routes.cancel = async body => {
    bodies.push(body);
    if (bodies.length === 1) throw fail('La información cambió. Actualiza y vuelve a intentarlo.', 409, 'STALE_VERSION');
    return {data: {id: 41, status: 'cancelled', phase: 'cancelled', version: 6}};
  };
  routes();
  const base = request.getMockImplementation();
  request.mockImplementation(async (path, ...rest) => (path === '/requests/41' ? {data: {id: 41, status: 'sent', version: 5}} : base(path, ...rest)));
  render(<MyRequests/>);
  fireEvent.click(await screen.findByRole('button', {name: 'Cancelar la solicitud #41'}));
  const dialog = screen.getByRole('dialog');
  fireEvent.click(within(dialog).getByRole('radio', {name: 'Me equivoqué al hacer el pedido'}));

  await act(async () => { fireEvent.click(within(dialog).getByRole('button', {name: 'Cancelar solicitud'})); });

  expect(bodies.map(body => body.expected_version)).toEqual([2, 5]);
  expect(await screen.findByText('Cancelaste la solicitud #41.')).toBeInTheDocument();

  // Si vuelve a cambiar, no insiste: avisa y recarga.
  bodies.length = 0;
  routes.cancel = async body => { bodies.push(body); throw fail('La información cambió. Actualiza y vuelve a intentarlo.', 409, 'STALE_VERSION'); };
  fireEvent.click(await screen.findByRole('button', {name: 'Cancelar la solicitud #41'}));
  const second = screen.getByRole('dialog');
  fireEvent.click(within(second).getByRole('radio', {name: 'Me equivoqué al hacer el pedido'}));
  await act(async () => { fireEvent.click(within(second).getByRole('button', {name: 'Cancelar solicitud'})); });
  expect(bodies).toHaveLength(2);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(await screen.findByRole('alert')).toHaveTextContent('La información cambió.');
});
