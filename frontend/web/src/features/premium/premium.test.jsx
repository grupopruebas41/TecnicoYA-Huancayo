import React from 'react';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import ClientPanel from '../client/ClientPanel';
import UserDetail from '../admin/UserDetail';
import {AlertsPage, EquipmentPage, PromotionsPage, SensorsPage, WarrantiesPage} from './PremiumPages';
import {request} from '../administration/http';
// S05-TC-266 a 271 · Fase 6 del panel final (modo rápido, D-98 y D-99): menú premium, «Mis equipos», sensores simulados,
// alertas con envío al técnico, promociones y garantías de ejemplo, y el plan desde el detalle del usuario.
vi.mock('../administration/http', () => ({request: vi.fn(), serverNow: () => Date.now()}));
vi.mock('../realtime/Realtime', () => ({RealtimeProvider: ({children}) => children, useRealtimeResource: () => {}, ConnectionStatus: () => null}));
vi.mock('../client/ClientHome', () => ({default: () => <p>Inicio del cliente.</p>}));

const done = {accessibility: {}, onboarding_completed_at: '2026-11-10T15:00:00Z', tour_completed_at: '2026-11-10T15:01:00Z'};
const client = plan => ({id: '9', name: 'Cliente Demo MYPE', version: 2, role: {code: 'client'}, theme_preference: 'light',
  client_profile: {client_type: 'mype', district_id: 2, plan, preferences: done}});
const device = (id, status, value) => ({id, name: 'Sensor de temperatura', equipment: {id: 10 + id, name: `Congeladora ${id}`}, metric: 'temperature',
  metric_label: 'Temperatura', unit: '°C', target: -18, tolerance: 3, threshold_label: '-18 °C ± 3', online: true, battery: 86, status, value,
  measured_at: '2026-11-10T20:00:00Z', readings: [{value: -18, at: '2026-11-10T00:00:00Z'}, {value: -16, at: '2026-11-10T10:00:00Z'}, {value, at: '2026-11-10T20:00:00Z'}]});
beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()}));
  try { localStorage.clear(); sessionStorage.clear(); } catch { /* sin almacenamiento */ }
});
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

test('S05-TC-266 con plan free lo premium lleva candado y abre el plan; con Premium abre sus pantallas', async () => {
  request.mockImplementation(async path => (path === '/client/equipment' ? {data: {items: []}} : {data: {items: [], unread_count: 0}}));
  const panel = plan => render(<ClientPanel user={client(plan)} roleLabel="Cliente" onLogout={vi.fn()} onUserChange={vi.fn()}/>);
  const {unmount} = panel('free');
  let nav = screen.getByRole('navigation', {name: 'Gestión del cliente'});
  const locked = within(nav).getByRole('button', {name: /Mis equipos/});
  expect(within(locked).getByRole('img', {name: 'Solo Premium'})).toBeInTheDocument();
  fireEvent.click(locked);
  expect(await screen.findByRole('region', {name: 'Plan Premium'})).toHaveTextContent('Por definir');
  unmount();

  panel('premium');
  nav = screen.getByRole('navigation', {name: 'Gestión del cliente'});
  const open = within(nav).getByRole('button', {name: /Mis equipos/});
  expect(within(open).queryByRole('img', {name: 'Solo Premium'})).toBeNull();
  fireEvent.click(open);
  expect(await screen.findByRole('region', {name: 'Mis equipos'})).toBeInTheDocument();
});

test('S05-TC-267 «Mis equipos» valida, registra, confirma antes de eliminar y pide servicio con el tipo del equipo', async () => {
  let items = [];
  request.mockImplementation(async (path, body, method) => {
    if (path === '/client/equipment' && method === undefined && body) {
      items = [{id: 3, ...body, specialty_id: 2, specialty: 'Refrigeración comercial', subcategory: 'Vitrinas', address: null, has_sensor: false, version: 1}];
      return {data: items[0]};
    }
    if (path === '/client/equipment') return {data: {items}};
    if (path === '/client/equipment/3' && method === 'DELETE') { items = []; return null; }
    if (path === '/catalog/specialties') return {data: [{id: 2, name: 'Refrigeración comercial'}]};
    if (path.startsWith('/catalog/subcategories')) return {data: [{id: 9, name: 'Vitrinas'}]};
    if (path === '/client/addresses') return {data: {items: []}};
    return {data: []};
  });
  const navigate = vi.fn();
  render(<EquipmentPage navigate={navigate}/>);
  fireEvent.click(await screen.findByRole('button', {name: 'Agregar equipo'}));
  const form = screen.getByRole('form', {name: 'Nuevo equipo'});
  fireEvent.change(within(form).getByLabelText('Año (opcional)'), {target: {value: '1950'}});
  fireEvent.click(within(form).getByRole('button', {name: 'Guardar equipo'}));
  expect(within(form).getByText('El nombre del equipo debe tener de 2 a 60 caracteres.')).toBeInTheDocument();
  expect(within(form).getByText('Elige el tipo de equipo.')).toBeInTheDocument();
  expect(within(form).getByText('El año debe estar entre 1980 y el próximo año.')).toBeInTheDocument();

  fireEvent.change(within(form).getByLabelText('Nombre'), {target: {value: 'Vitrina de bebidas'}});
  await within(form).findByRole('option', {name: 'Refrigeración comercial'});
  fireEvent.change(within(form).getByLabelText('Especialidad'), {target: {value: '2'}});
  await within(form).findByRole('option', {name: 'Vitrinas'});
  fireEvent.change(within(form).getByLabelText('Tipo de equipo'), {target: {value: '9'}});
  fireEvent.change(within(form).getByLabelText('Año (opcional)'), {target: {value: '2020'}});
  fireEvent.click(within(form).getByRole('button', {name: 'Guardar equipo'}));
  expect(await screen.findByText('Equipo registrado.')).toBeInTheDocument();
  expect(request).toHaveBeenCalledWith('/client/equipment', {name: 'Vitrina de bebidas', subcategory_id: 9, brand: null, model: null, year: 2020, address_id: null, notes: null});

  const card = await screen.findByRole('article', {name: 'Vitrina de bebidas'});
  fireEvent.click(within(card).getByRole('button', {name: 'Pedir servicio para este equipo'}));
  expect(navigate).toHaveBeenCalledWith('new', {preset: {specialty_id: 2, subcategory_id: 9}});
  fireEvent.click(within(card).getByRole('button', {name: /Eliminar/}));
  expect(request).not.toHaveBeenCalledWith('/client/equipment/3', undefined, 'DELETE');
  fireEvent.click(within(screen.getByRole('group', {name: 'Confirmar eliminación de Vitrina de bebidas'})).getByRole('button', {name: 'Sí, eliminar'}));
  expect(await screen.findByText('Eliminaste «Vitrina de bebidas».')).toBeInTheDocument();
});

test('S05-TC-268 los sensores muestran la franja de demostración, estado con ícono y texto, valor, umbral y resumen del gráfico, y se actualizan cada 30 s', async () => {
  vi.useFakeTimers({toFake: ['setInterval', 'clearInterval']});
  request.mockResolvedValue({data: {simulated: true, items: [device(1, 'normal', -17), device(2, 'attention', -13.5), device(3, 'failure', -8)]}});
  render(<SensorsPage navigate={vi.fn()}/>);
  expect(screen.getByRole('note')).toHaveTextContent('Modo demostración: lecturas simuladas');
  const cards = await screen.findAllByRole('article');
  expect(cards.map(card => card.querySelector('.premium-status').textContent.trim())).toEqual(['Normal', 'Atención', 'Falla']);
  cards.forEach(card => expect(card.querySelector('.premium-status svg')).not.toBeNull());
  expect(within(cards[2]).getByText('-8', {selector: 'strong'})).toBeInTheDocument();
  expect(cards[2]).toHaveTextContent('normal -18 °C ± 3');
  expect(within(cards[2]).getByRole('img')).toHaveAttribute('aria-label',
    'Congeladora 3: en las últimas 24 h, mínimo -18 °C, máximo -8 °C y ahora -8 °C. Rango normal -21 a -15 °C.');
  expect(request).toHaveBeenCalledTimes(1);
  await act(async () => { vi.advanceTimersByTime(30000); });
  expect(request).toHaveBeenCalledTimes(2);

  fireEvent.click(within(cards[2]).getByRole('button', {name: 'Ver detalle de Congeladora 3'}));
  const dialog = screen.getByRole('dialog', {name: 'Congeladora 3'});
  expect(within(dialog).getByRole('note')).toHaveTextContent('Modo demostración: lecturas simuladas');
  fireEvent.keyDown(dialog, {key: 'Escape'});
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('S05-TC-269 una alerta se envía al técnico con clave de idempotencia y avisa si fue dirigida o al matching', async () => {
  const alerts = [{id: 5, kind: 'threshold', severity: 'failure', message: 'Temperatura de Congeladora en -8 °C (rango -18 °C ± 3)',
    equipment: {id: 11, name: 'Congeladora'}, started_at: '2026-11-10T20:00:00Z', resolved_at: null, request_id: null},
  {id: 4, kind: 'maintenance', severity: 'info', message: 'Toca el mantenimiento preventivo de Vitrina', equipment: {id: 12, name: 'Vitrina'},
    started_at: '2026-11-09T20:00:00Z', resolved_at: null, request_id: 30}];
  request.mockImplementation(async (path, body, method, options) => (method === 'POST'
    ? {data: {request_id: 41, directed: true, technician: 'Rosa Quispe', key: options.headers['Idempotency-Key']}} : {data: {items: alerts}}));
  const navigate = vi.fn();
  render(<AlertsPage navigate={navigate}/>);
  const rows = await screen.findAllByRole('listitem');
  expect(rows[0]).toHaveTextContent('Falla Congeladora');
  expect(rows[1]).toHaveTextContent('Recordatorio Vitrina');
  fireEvent.click(within(rows[0]).getByRole('button', {name: 'Enviar a mi técnico de confianza'}));
  expect(await screen.findByText('Enviamos la solicitud #41 a Rosa Quispe, tu técnico de confianza.')).toBeInTheDocument();
  const [, , method, options] = request.mock.calls.find(call => call[2] === 'POST');
  expect([method, typeof options.headers['Idempotency-Key']]).toEqual(['POST', 'string']);
  fireEvent.click(within(rows[1]).getByRole('button', {name: 'Ver solicitud #30'}));
  expect(navigate).toHaveBeenCalledWith('requests', {open: 30});
});

test('S05-TC-270 promociones y garantías van rotuladas como ejemplo y «Usar garantía» queda desactivado hasta el Sprint 6', async () => {
  request.mockImplementation(async path => (path === '/client/promotions'
    ? {data: {sample: true, items: [{id: 'a', title: 'Mantenimiento preventivo', body: 'Ejemplo de promoción.'}]}}
    : {data: {sample: true, items: [{request_id: 8, subcategory: 'Vitrinas', days: 30, active: true, valid_until: '2026-12-01T15:00:00Z', can_claim: false}]}}));
  render(<><PromotionsPage/><WarrantiesPage/></>);
  await waitFor(() => expect(screen.getAllByText('Ejemplo · datos de demostración')).toHaveLength(3));
  const use = await screen.findByRole('button', {name: 'Usar garantía'});
  expect(use).toBeDisabled();
  expect(use).toHaveAccessibleDescription('Disponible en el Sprint 6.');
});

test('S05-TC-271 el administrador activa Premium desde el detalle del usuario con motivo', async () => {
  const detail = plan => ({user: {id: 9, name: 'Cliente Demo MYPE', email: 'demo-mype@example.test', role: 'client', status: 'active', version: 2,
    created_at: '2026-10-20T15:00:00Z', last_login_at: null}, client: {client_type: 'mype', business_name: 'Bodega Demo', reference_address: null, plan},
  technician: null, requests: [], audit: []});
  let plan = 'free';
  request.mockImplementation(async (path, body, method) => {
    if (method === 'PATCH') { plan = body.plan; return {data: detail(plan)}; }
    return {data: detail(plan)};
  });
  render(<UserDetail id={9} currentUserId={1} onBack={vi.fn()}/>);
  expect(await screen.findByText('Free')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: 'Activar Premium'}));
  const dialog = screen.getByRole('dialog', {name: 'Activar el plan Premium'});
  fireEvent.change(within(dialog).getByLabelText('Motivo (queda en la auditoría)'), {target: {value: 'Demostración del plan Premium'}});
  fireEvent.click(within(dialog).getByRole('button', {name: 'Activar Premium'}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/admin/users/9/plan',
    {reason: 'Demostración del plan Premium', expected_version: 2, plan: 'premium'}, 'PATCH'));
  expect(await screen.findByText('Plan Premium activado.')).toBeInTheDocument();
  expect(await screen.findByRole('button', {name: 'Volver a Free'})).toBeInTheDocument();
});
