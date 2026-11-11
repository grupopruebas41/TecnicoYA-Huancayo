import React from 'react';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import TechnicianApp, {technicianBadges} from './TechnicianApp';
import OfferSpotlight, {OfferRing, ringTone} from './OfferSpotlight';
import {greeting} from './TechnicianHome';
import {request} from '../administration/http';
// S05-TC-299 a 306 · Panel del técnico, Fase T2 (modo rápido, D-104 y D-107): menú del técnico, Inicio con la oferta en
// vivo y su anillo de 10 minutos, indicadores, Mi día, progreso e insignias, y la Ayuda propia del técnico.
vi.mock('../administration/http', () => ({request: vi.fn(), serverNow: () => Date.now()}));
vi.mock('../realtime/Realtime', async importOriginal => ({...(await importOriginal()), useRealtimeResource: () => false, RealtimeProvider: ({children}) => children}));

const user = {id: '8', name: 'Rosa Quispe', given_names: 'Rosa', family_names: 'Quispe', version: 2, theme_preference: 'light', sidebar_collapsed: null,
  role: {code: 'technician'}, permissions: [], technician_profile: {verification_status: 'pending', status: 'pending_verification'}};
const home = (overrides = {}) => ({
  verification: {state: 'in_review', label: 'En revisión', missing: []},
  offers: {pending: 2},
  indicators: {jobs_today: 3, offers_answered: 12, acceptance_rate: 75, period_days: 30,
    next_visit: {request_id: 41, starts_at: '2026-11-12T20:00:00.000Z', subcategory: 'Reparación de hardware', district: 'El Tambo'}},
  today: [
    {request_id: 40, starts_at: '2026-11-12T14:00:00.000Z', ends_at: '2026-11-12T16:00:00.000Z', slot: 'morning', status: 'in_progress',
      specialty: 'Cómputo', subcategory: 'Reparación de hardware', district: 'Huancayo'},
    {request_id: 41, starts_at: '2026-11-12T20:00:00.000Z', ends_at: '2026-11-12T22:00:00.000Z', slot: 'afternoon', status: 'assigned',
      specialty: 'Cómputo', subcategory: 'Redes', district: 'El Tambo'},
  ],
  progress: {percent: 63, done: 5, total: 8, tasks: [
    {code: 'about', label: 'Escribe «Sobre mí» con al menos 40 caracteres', section: 'profile-pro', done: true},
    {code: 'portfolio', label: 'Agrega 2 trabajos publicados a tu portafolio', section: 'portfolio', done: false},
    {code: 'photo', label: 'Agrega tu foto de perfil', section: 'account', done: false},
  ]},
  badges: [
    {code: 'verified', label: 'Verificado', earned: false, hint: 'Se obtiene cuando aprobamos tus documentos.'},
    {code: 'fast_response', label: 'Respuesta rápida', earned: true, hint: 'Mediana de tus últimas respuestas: 1 min 18 s.'},
  ],
  ...overrides,
});
const offer = (id, minutes, extra = {}) => ({
  id, status: 'pending', version: 1, available_at: new Date(Date.parse('2026-11-12T20:30:00Z') - (10 - minutes) * 60000).toISOString(),
  expires_at: new Date(Date.parse('2026-11-12T20:30:00Z') + minutes * 60000).toISOString(), responded_at: null,
  reference_fee: {amount: '80.00', currency: 'PEN', is_reference: true}, round: {id: 1, round_no: 1, kind: 'direct'},
  request: {id: 100 + id, specialty: {id: 1, name: 'Cómputo'}, subcategory: {id: 1, name: 'Reparación de hardware'},
    subcategories: [{id: 1, name: 'Reparación de hardware'}, {id: 2, name: 'Mantenimiento preventivo'}], district: {id: 1, name: 'Chilca'},
    mode: 'scheduled', preferred_start_at: '2026-11-13T19:00:00.000Z', preferred_end_at: '2026-11-13T21:00:00.000Z', urgency: 'urgente',
    description: 'Solicitud sintética (demostración).', address: null, symptoms: [], evidence: []},
  ...extra,
});
const SERVER = '2026-11-12T20:30:00.000Z';
let data;
let offers;
function routes(extra = {}) {
  request.mockImplementation(async (path, body, method = body ? 'POST' : 'GET') => {
    const key = `${method} ${path}`;
    if (extra[key]) return extra[key](body);
    if (path === '/technicians/me/home') return {data};
    if (path === '/technicians/me/profile') return {data: {id: 5}};
    if (path.startsWith('/offers?')) return {data: {items: offers}, meta: {server_time: SERVER}};
    if (path.startsWith('/notifications')) return {data: {items: [], unread_count: 0}};
    return {data: []};
  });
}
const app = () => render(<TechnicianApp user={user} roleLabel="Especialista técnico" onLogout={vi.fn()} onUserChange={vi.fn()} onExpired={vi.fn()}/>);
const nav = () => screen.getByRole('navigation', {name: 'Gestión del técnico'});
beforeEach(() => {
  data = home();
  offers = [offer(1, 7), offer(2, 3), offer(3, 9)];
  vi.stubGlobal('matchMedia', () => ({matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()}));
  document.documentElement.dataset.motion = 'reduce';
  try { localStorage.clear(); sessionStorage.clear(); } catch { /* sin almacenamiento */ }
});
afterEach(() => {
  cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers();
  ['motion', 'textSize', 'theme'].forEach(name => delete document.documentElement.dataset[name]);
});

test('S05-TC-299 el menú del técnico agrupa Trabajo, Mi negocio, Mi desempeño y Ayuda, y lo no listo dice «Próximamente»', async () => {
  routes();
  app();
  await screen.findByRole('heading', {level: 2, name: /, Rosa$/});
  const groups = within(nav()).getAllByRole('group').map(group => [group.querySelector('.panel-nav-heading').textContent,
    [...group.querySelectorAll('.panel-nav-item')].map(item => item.querySelector('.panel-label').firstChild.textContent)]);
  expect(groups).toEqual([
    ['Trabajo', ['Inicio', 'Ofertas', 'Mis trabajos', 'Mi agenda']],
    ['Mi negocio', ['Perfil profesional', 'Servicios y tarifas', 'Portafolio', 'Zonas y disponibilidad', 'Verificación']],
    ['Mi desempeño', ['Estadísticas', 'Calificaciones', 'Ganancias']],
    ['Ayuda', ['Cómo funciona', 'Preguntas frecuentes', 'Reportar un problema', 'Privacidad y términos']],
  ]);
  const soon = [...nav().querySelectorAll('[aria-disabled="true"]')].map(item => item.querySelector('.panel-label').firstChild.textContent);
  // Fase T3: Mis trabajos y Mi agenda ya están listos; siguen «Próximamente» los de la T4, el S6 y el S8.
  expect(soon).toEqual(['Estadísticas', 'Calificaciones', 'Ganancias', 'Reportar un problema']);
  fireEvent.click(within(nav()).getByRole('button', {name: /Estadísticas/}));
  expect(within(nav()).getByRole('button', {name: 'Inicio'})).toHaveAttribute('aria-current', 'page');
  const foot = document.querySelector('.panel-sidebar-foot');
  expect(foot.querySelectorAll('.panel-nav-item')).toHaveLength(1);
  expect(foot).toHaveTextContent('Ir al sitio');
});

test('S05-TC-300 el menú muestra las ofertas pendientes con su punto que late, el avance del perfil y el estado de la verificación', async () => {
  routes();
  app();
  const offersItem = within(nav()).getByRole('button', {name: 'Ofertas'});
  await waitFor(() => expect(offersItem).toHaveAccessibleDescription('2 ofertas pendientes'));
  expect(offersItem.querySelector('.panel-nav-badge.is-pulse .panel-nav-pulse')).not.toBeNull();
  expect(within(nav()).getByRole('button', {name: 'Perfil profesional'})).toHaveAccessibleDescription('Perfil al 63 %');
  expect(within(nav()).getByRole('button', {name: 'Perfil profesional'}).querySelector('.is-text')).toHaveTextContent('63 %');
  expect(within(nav()).getByRole('button', {name: 'Verificación'})).toHaveAccessibleDescription('Verificación: En revisión');
  // Sin ofertas no hay punto y con el perfil completo el tono cambia.
  const quiet = technicianBadges(home({offers: {pending: 0}, progress: {...home().progress, percent: 100}, verification: {state: 'missing', label: 'Falta un documento'}}));
  expect(quiet.offers).toMatchObject({count: 0, pulse: false});
  expect(quiet['profile-pro']).toMatchObject({text: '100 %', tone: 'ok'});
  expect(quiet.verification).toMatchObject({text: 'Falta un documento', tone: 'warn'});
});

test('S05-TC-301 el anillo pasa de verde a ámbar y a rojo en sus bordes y dice el tiempo en texto', () => {
  expect([601, 301, 300, 121, 120, 1].map(ringTone)).toEqual(['ok', 'ok', 'warn', 'warn', 'danger', 'danger']);
  const {container, rerender} = render(<OfferRing seconds={125} total={600}/>);
  expect(container.querySelector('.offer-ring')).toHaveAttribute('data-tone', 'warn');
  expect(screen.getByRole('timer')).toHaveTextContent('02:05');
  expect(screen.getByText('Quedan pocos minutos')).toBeInTheDocument();
  expect(screen.getByText('Quedan 3 minutos para responder')).toBeInTheDocument();
  rerender(<OfferRing seconds={60} total={600}/>);
  expect(container.querySelector('.offer-ring')).toHaveAttribute('data-tone', 'danger');
  expect(screen.getByText('Quedan 1 minuto para responder')).toBeInTheDocument();
  expect(screen.getByText('Responde ya')).toBeInTheDocument();
  // El arco refleja lo que falta: a la mitad del plazo queda media circunferencia.
  rerender(<OfferRing seconds={300} total={600}/>);
  const bar = container.querySelector('.offer-ring-bar');
  expect(Number(bar.getAttribute('stroke-dashoffset'))).toBeCloseTo(Number(bar.getAttribute('stroke-dasharray')) / 2, 3);
});

test('S05-TC-302 la cuenta regresiva de 10 minutos llega a cero con el reloj controlado y desactiva los botones', async () => {
  vi.useFakeTimers({toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'performance']});
  render(<OfferSpotlight offer={offer(1, 10)} serverTime={SERVER} onChange={vi.fn()}/>);
  expect(screen.getByRole('timer')).toHaveTextContent('10:00');
  await act(async () => { vi.advanceTimersByTime(9 * 60 * 1000 + 59 * 1000); });
  expect(screen.getByRole('timer')).toHaveTextContent('00:01');
  expect(screen.getByRole('button', {name: /Aceptar/})).toBeEnabled();
  await act(async () => { vi.advanceTimersByTime(1000); });
  expect(screen.getByRole('timer')).toHaveTextContent('00:00');
  expect(screen.getAllByText('Plazo vencido').length).toBeGreaterThan(0);
  expect(screen.getByRole('button', {name: /Aceptar/})).toBeDisabled();
  expect(screen.getByRole('button', {name: /Rechazar/})).toBeDisabled();
});

test('S05-TC-303 la oferta en vivo muestra lo necesario sin la dirección y responde con idempotencia; rechazar pide confirmación', async () => {
  routes({'POST /offers/1/response': () => ({data: {status: 'accepted'}}), 'POST /offers/2/response': () => ({data: {status: 'rejected'}}),
    'GET /offers/1': () => ({data: {...offer(1, 7), status: 'accepted', version: 2}, meta: {server_time: SERVER}}),
    'GET /offers/2': () => ({data: {...offer(2, 3), status: 'rejected', version: 2}, meta: {server_time: SERVER}})});
  const onChange = vi.fn(async () => true);
  render(<OfferSpotlight offer={offer(1, 7)} serverTime={SERVER} onChange={onChange}/>);
  const card = screen.getByRole('article', {name: 'Oferta 1'});
  expect(within(card).getByRole('heading', {name: 'Cómputo · Solicitud #101'})).toBeInTheDocument();
  expect(within(card).getByRole('list', {name: 'Trabajos pedidos'})).toHaveTextContent('Mantenimiento preventivo');
  expect(card).toHaveTextContent('Chilca');
  // Fase T3: fecha legible «vie 13 nov · 14:00–16:00 (Tarde)».
  expect(card).toHaveTextContent(/vie 13 nov · 14:00–16:00 \(Tarde\)/);
  expect(card).toHaveTextContent('S/ 80,00 (referencial)');
  expect(within(card).getByText('Urgente')).toBeInTheDocument();
  expect(card).not.toHaveTextContent(/Dirección|Jr\.|Av\./);

  fireEvent.click(within(card).getByRole('button', {name: /Aceptar/}));
  await screen.findByText('Aceptaste la oferta. El cliente elegirá cuando cierre la ronda.');
  const [path, body, method, options] = request.mock.calls.find(([p]) => p === '/offers/1/response');
  expect([path, body, method]).toEqual(['/offers/1/response', {decision: 'accept', expected_version: 1, reason: null}, 'POST']);
  expect(options.headers['Idempotency-Key']).toMatch(/[0-9a-f-]{36}/);
  expect(onChange).toHaveBeenCalledWith(1);
  cleanup();

  render(<OfferSpotlight offer={offer(2, 3)} serverTime={SERVER} onChange={onChange}/>);
  fireEvent.click(screen.getByRole('button', {name: /Rechazar/}));
  expect(request).not.toHaveBeenCalledWith('/offers/2/response', expect.anything(), 'POST', expect.anything());
  // DEF-64: el motivo va dentro del diálogo y recibe el foco (detrás del fondo modal no se podía escribir).
  expect(within(screen.getByRole('dialog')).getByLabelText('Motivo del rechazo (opcional)')).toHaveFocus();
  fireEvent.change(screen.getByLabelText('Motivo del rechazo (opcional)'), {target: {value: 'Estoy fuera de la zona hoy'}});
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', {name: /Rechazar|Confirmar|Sí/}));
  await screen.findByText('Rechazaste la oferta.');
  expect(request.mock.calls.find(([p]) => p === '/offers/2/response')[1]).toEqual({decision: 'reject', expected_version: 1, reason: 'Estoy fuera de la zona hoy'});
});

test('S05-TC-304 el Inicio saluda, destaca la oferta que vence primero, lista las demás y sin ofertas muestra su estado vacío', async () => {
  routes();
  app();
  expect(await screen.findByRole('heading', {level: 2, name: /^(Buenos días|Buenas tardes|Buenas noches), Rosa$/})).toBeInTheDocument();
  expect(screen.getByRole('button', {name: /Verificación: En revisión/})).toBeInTheDocument();
  // La que vence primero (3 min) es la destacada; las otras van por vencimiento.
  expect(await screen.findByRole('article', {name: 'Oferta 2'})).toHaveTextContent('Oferta en vivo');
  // Corrección del #57: el título lleva el contador («2 ofertas en espera»).
  const queue = screen.getByRole('region', {name: '2 ofertas en espera · por vencimiento'});
  expect(within(queue).getAllByRole('button').map(button => button.textContent)).toEqual(['Ver la oferta 1', 'Ver la oferta 3']);
  fireEvent.click(within(queue).getByRole('button', {name: 'Ver la oferta 3'}));
  expect(screen.getByRole('article', {name: 'Oferta 3'})).toBeInTheDocument();
  expect([greeting(7), greeting(12), greeting(18), greeting(19)]).toEqual(['Buenos días', 'Buenas tardes', 'Buenas tardes', 'Buenas noches']);
  cleanup();

  offers = [];
  routes();
  app();
  expect(await screen.findByText('No tienes ofertas pendientes')).toBeInTheDocument();
  expect(screen.getByText(/Te avisaremos apenas llegue una/)).toBeInTheDocument();
});

test('S05-TC-305 indicadores, Mi día por franja, progreso con tareas que llevan a su sección e insignias con texto', async () => {
  routes();
  app();
  const kpis = await screen.findByRole('region', {name: 'Tu actividad'});
  // Con «Reducir animaciones» los indicadores muestran el valor final sin contar.
  expect(within(kpis).getByText('Trabajos de hoy').parentElement).toHaveTextContent('3');
  expect(within(kpis).getByText('Tasa de aceptación').parentElement).toHaveTextContent('75 %');
  expect(within(kpis).getByText('Próxima visita').parentElement).toHaveTextContent('El Tambo');
  const day = screen.getByRole('region', {name: 'Mi día'});
  expect([...day.querySelectorAll('.tech-slot')].map(slot => slot.dataset.slot)).toEqual(['morning', 'afternoon', 'night']);
  expect(day.querySelector('[data-slot="night"]')).toHaveTextContent('Libre');
  expect(day.querySelector('[data-slot="morning"]')).toHaveTextContent('En curso');
  expect(day).not.toHaveTextContent(/Jr\.|Av\./);
  const progress = screen.getByRole('region', {name: 'Completa tu perfil'});
  expect(within(progress).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '63');
  expect(within(progress).queryByText(/Sobre mí/)).not.toBeInTheDocument();
  expect(within(progress).getByText('Obtenida').closest('li')).toHaveTextContent('Respuesta rápida');
  expect(within(progress).getByText('Pendiente').closest('li')).toHaveTextContent('Verificado');
  fireEvent.click(within(progress).getByRole('button', {name: /^Hacerlo\s*: Agrega 2 trabajos publicados a tu portafolio$/}));
  expect(await screen.findByRole('heading', {name: 'Portafolio'})).toBeInTheDocument();
  expect(within(nav()).getByRole('button', {name: 'Portafolio'})).toHaveAttribute('aria-current', 'page');
  fireEvent.click(within(nav()).getByRole('button', {name: 'Inicio'}));
  fireEvent.click(await screen.findByRole('button', {name: /^Hacerlo\s*: Agrega tu foto de perfil$/}));
  expect(screen.getByRole('dialog', {name: 'Tu cuenta'})).toBeInTheDocument();
  cleanup();

  // Sin reducir animaciones los indicadores cuentan hasta su valor; una tasa sin datos se muestra como «—».
  delete document.documentElement.dataset.motion;
  data = home({indicators: {...home().indicators, acceptance_rate: null, next_visit: null}});
  routes();
  app();
  const live = await screen.findByRole('region', {name: 'Tu actividad'});
  await waitFor(() => expect(within(live).getByText('Ofertas respondidas').parentElement.querySelector('.tech-kpi-value')).toHaveTextContent('12'));
  expect(within(live).getByText('Tasa de aceptación').parentElement).toHaveTextContent('Sin datos todavía');
  expect(within(live).getByText('Sin visitas programadas')).toBeInTheDocument();
});

test('S05-TC-306 la Ayuda del técnico explica el flujo de la oferta y responde sus dudas', async () => {
  routes();
  app();
  fireEvent.click(within(nav()).getByRole('button', {name: 'Cómo funciona'}));
  const steps = await screen.findAllByRole('listitem');
  expect(steps.filter(step => step.closest('.how-steps')).map(step => step.querySelector('h3').textContent))
    .toEqual(['Te llega una oferta', 'Tienes 10 minutos para responder', 'El cliente elige', 'Atiendes la visita']);
  fireEvent.click(screen.getByRole('button', {name: 'Ver mis ofertas'}));
  expect(within(nav()).getByRole('button', {name: 'Ofertas'})).toHaveAttribute('aria-current', 'page');
  fireEvent.click(within(nav()).getByRole('button', {name: 'Preguntas frecuentes'}));
  expect(await screen.findByText('¿Quién ve mis documentos de verificación?')).toBeInTheDocument();
  expect(screen.getByText(/Nunca se muestran a los clientes ni a otros técnicos/)).toBeInTheDocument();
});

test('S05-TC-310 cada oferta en espera es una tarjeta con ícono, tiempo restante con color, hora de vencimiento y «Ver» primario', async () => {
  offers = [offer(1, 7), offer(2, 9), offer(3, 1, {request: {...offer(3, 1).request, specialty: {id: 3, name: 'Electricidad'}}})];
  routes();
  app();
  const queue = await screen.findByRole('region', {name: '2 ofertas en espera · por vencimiento'});
  const cards = within(queue).getAllByRole('listitem');
  // La de 1 minuto es la destacada; en espera quedan la de 7 (verde) y la de 9 (verde), por vencimiento.
  expect(cards.map(card => card.dataset.tone)).toEqual(['ok', 'ok']);
  expect(cards[0]).toHaveTextContent(/Vence a las \d{2}:\d{2}/);
  expect(cards[0]).toHaveTextContent(/Quedan 0[67]:\d{2}/);
  expect(cards[0].querySelector('.tech-wait-icon svg')).not.toBeNull();
  expect(within(cards[0]).getByRole('button', {name: 'Ver la oferta 1'})).toHaveClass('button', 'primary');
  expect(screen.getByRole('article', {name: 'Oferta 3'})).toBeInTheDocument();
  fireEvent.click(within(cards[1]).getByRole('button', {name: 'Ver la oferta 2'}));
  // La que pasa a esperar (1 minuto) se ve en rojo.
  await waitFor(() => expect(within(queue).getAllByRole('listitem').find(card => card.textContent.includes('Electricidad'))).toHaveAttribute('data-tone', 'danger'));
});
