import React from 'react';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import {request} from '../administration/http';
import {AccessibilityContext} from '../panel/quickAccessibility';
import OfferSpotlight from './OfferSpotlight';
import ProfessionalProfile from './ProfessionalProfile';
import {TechnicianHowItWorks} from './TechnicianHelp';
import TechnicianOnboarding, {FirstSteps, TECHNICIAN_TOUR_STEPS, TECHNICIAN_WELCOME_CARDS} from './TechnicianOnboarding';
import {ALERT_DEFAULTS, OfferAlertWatcher, OfferAlertsTab, alertOffer, getOfferAlerts, loadOfferAlerts, offerSpeech} from './offerAlerts';
// S05-TC-357 a 368 · Panel del técnico, Fase T5 (modo rápido, D-105 y D-112): pestaña «Avisos», avisos de oferta nueva
// (sonido, vibración, destello y voz), lectura de la oferta, modo simple, bienvenida y tutorial del técnico, «Primeros
// pasos», dictado en el perfil y la base de accesibilidad de lo nuevo.
vi.mock('../administration/http', () => ({request: vi.fn(), uploadWithProgress: vi.fn(), serverNow: () => Date.now()}));
const realtime = vi.hoisted(() => ({handlers: []}));
vi.mock('../realtime/Realtime', async importOriginal => ({...(await importOriginal()), RealtimeProvider: ({children}) => children,
  useRealtimeResource: (channel, events, onEvent) => { if (channel) realtime.handlers.push(onEvent); return true; }}));

const NOW = Date.parse('2026-11-18T15:00:00.000Z');
const offer = (id, extra = {}) => ({id, status: 'pending', version: 1, round: {id, round_no: 1, kind: 'direct'},
  available_at: new Date(NOW - 150000).toISOString(), expires_at: new Date(NOW + 450000).toISOString(), responded_at: null,
  reference_fee: {amount: '80.00', currency: 'PEN', is_reference: true},
  request: {id: 100 + id, specialty: {id: 1, name: 'Cómputo'}, subcategory: {id: 1, name: 'Reparación de hardware'},
    subcategories: [{id: 1, name: 'Reparación de hardware'}], district: {id: 1, name: 'Huancayo'}, mode: 'asap', urgency: 'normal',
    description: 'Solicitud sintética.', address: null, symptoms: [], evidence: []}, ...extra});
let pending;
const user = (preferences = {}) => ({id: 9, name: 'Técnico Nuevo', given_names: 'Técnico', preferences: {accessibility: {},
  onboarding_completed_at: null, tour_completed_at: null, offer_alerts: ALERT_DEFAULTS, ...preferences}});
function routes(extra = {}) {
  request.mockImplementation(async (path, body, method = body ? 'POST' : 'GET') => {
    const key = `${method} ${path.split('?')[0]}`;
    if (extra[key]) return extra[key](body, path);
    if (path === '/technicians/me/profile') return {data: {id: 5, display_name: 'Técnico Nuevo', version: 2, bio: 'Hola.', work_style: '',
      warranty_text: '', experience_years: 2, base_district_id: null, verification_status: 'pending', declared_subcategories: []}};
    if (path.startsWith('/offers?')) return {data: {items: pending}, meta: {server_time: new Date(NOW).toISOString()}};
    if (path.startsWith('/offers/')) return {data: pending.find(item => item.id === Number(path.split('/')[2])), meta: {server_time: new Date(NOW).toISOString()}};
    if (path === '/catalog/districts') return {data: [{id: 1, name: 'Huancayo'}]};
    if (path === '/me/preferences') return {data: {offer_alerts: {...getOfferAlerts(), ...(body?.offer_alerts || {})}}};
    return {data: {}};
  });
}

let audio, speech;
class FakeUtterance { constructor(text) { this.text = text; } }
function installDevices({sound = true, vibrate = true, voice = true} = {}) {
  audio = {oscillators: []};
  if (sound) {
    window.AudioContext = class {
      constructor() { this.currentTime = 0; this.destination = {}; }
      createOscillator() { const node = {frequency: {}, connect: vi.fn(), start: vi.fn(), stop: vi.fn()}; audio.oscillators.push(node); return node; }
      createGain() { return {gain: {}, connect: vi.fn()}; }
    };
  } else delete window.AudioContext;
  if (vibrate) navigator.vibrate = vi.fn(); else delete navigator.vibrate;
  speech = {speak: vi.fn(), cancel: vi.fn()};
  if (voice) { window.speechSynthesis = speech; window.SpeechSynthesisUtterance = FakeUtterance; }
  else { delete window.speechSynthesis; delete window.SpeechSynthesisUtterance; }
}
const withA11y = (node, prefs = {}) => <AccessibilityContext.Provider value={{prefs, update: vi.fn(() => Promise.resolve())}}>{node}</AccessibilityContext.Provider>;

beforeEach(() => {
  pending = [offer(1)];
  realtime.handlers.length = 0;
  vi.stubGlobal('matchMedia', () => ({matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()}));
  installDevices();
  loadOfferAlerts(ALERT_DEFAULTS);
  try { sessionStorage.clear(); } catch { /* sin almacenamiento */ }
});
afterEach(() => {
  cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers();
  delete document.documentElement.dataset.motion;
  delete window.AudioContext; delete navigator.vibrate; delete window.speechSynthesis; delete window.SpeechSynthesisUtterance;
  delete window.SpeechRecognition;
});

test('S05-TC-357 la pestaña «Avisos» guarda cada interruptor en la cuenta con su alerta y vuelve atrás si falla [D-112]', async () => {
  let fail = false;
  routes({'PUT /me/preferences': async body => { if (fail) throw new Error('No pudimos guardar tus avisos.'); return {data: {offer_alerts: {...getOfferAlerts(), ...body.offer_alerts}}}; }});
  render(<OfferAlertsTab/>);
  const switches = screen.getAllByRole('switch');
  expect(switches.map(item => item.closest('label').querySelector('.tech-alert-label').textContent.trim()))
    .toEqual(['Sonido', 'Vibración', 'Destello en pantalla', 'Leer la oferta en voz alta']);
  expect(switches.map(item => item.checked)).toEqual([false, false, true, false]);
  expect(screen.getByRole('switch', {name: /Sonido/})).toHaveAccessibleDescription(/sonido corto de dos tonos/);
  expect(screen.getByText(/sigue siendo de 10 minutos/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('switch', {name: /Sonido/}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/me/preferences', {offer_alerts: {sound: true}}, 'PUT'));
  expect(await screen.findByRole('status')).toHaveTextContent('Guardamos tus avisos de ofertas.');
  expect(screen.getByRole('switch', {name: /Sonido/})).toBeChecked();

  fail = true;
  fireEvent.click(screen.getByRole('switch', {name: /Vibración/}));
  expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos guardar tus avisos.');
  expect(screen.getByRole('switch', {name: /Vibración/})).not.toBeChecked();
});

test('S05-TC-358 una oferta nueva dispara sonido, vibración, destello y voz; la primera carga no avisa', async () => {
  routes();
  loadOfferAlerts({sound: true, vibration: true, flash: true, speak: true});
  render(<OfferAlertWatcher/>);
  await waitFor(() => expect(realtime.handlers.length).toBeGreaterThan(0));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/offers?status=pending'));
  expect(audio.oscillators).toHaveLength(0);
  expect(navigator.vibrate).not.toHaveBeenCalled();
  expect(document.querySelector('.tech-offer-flash')).toBeNull();

  pending = [offer(2, {request: {...offer(2).request, subcategories: [{id: 2, name: 'Vitrinas'}], district: {id: 2, name: 'El Tambo'}}}), offer(1)];
  await act(async () => { await realtime.handlers.at(-1)({offer_id: 2}); });
  await waitFor(() => expect(audio.oscillators).toHaveLength(2));
  expect(audio.oscillators.map(node => node.frequency.value)).toEqual([880, 1320]);
  expect(navigator.vibrate).toHaveBeenCalledWith([250, 120, 250]);
  expect(document.querySelector('.tech-offer-flash')).not.toBeNull();
  expect(document.querySelector('.tech-offer-flash')).toHaveAttribute('aria-hidden', 'true');
  expect(speech.speak).toHaveBeenCalledTimes(1);
  expect(speech.speak.mock.calls[0][0]).toMatchObject({lang: 'es-PE'});
  expect(speech.speak.mock.calls[0][0].text).toMatch(/^Nueva oferta: Vitrinas en El Tambo/);
  expect(screen.getByRole('status')).toHaveTextContent('Llegó una oferta nueva. Tienes 10 minutos para responder.');
});

test('S05-TC-359 «Leer la oferta en voz alta» lee el trabajo, el distrito, la tarifa y los minutos que quedan (es-PE)', async () => {
  expect(offerSpeech(offer(1), NOW)).toBe('Nueva oferta: Reparación de hardware en Huancayo. Tarifa referencial: 80,00 soles. Tienes 8 minutos para responder.');
  expect(offerSpeech({...offer(1), expires_at: new Date(NOW + 30000).toISOString(), reference_fee: null}, NOW))
    .toBe('Nueva oferta: Reparación de hardware en Huancayo. Tienes 1 minuto para responder.');
  render(withA11y(<OfferSpotlight offer={offer(1)} serverTime={new Date(NOW).toISOString()} onChange={vi.fn()}/>));
  fireEvent.click(screen.getByRole('button', {name: 'Leer la oferta en voz alta'}));
  expect(speech.cancel).toHaveBeenCalled();
  expect(speech.speak.mock.calls[0][0]).toMatchObject({lang: 'es-PE'});
  expect(speech.speak.mock.calls[0][0].text).toContain('Reparación de hardware en Huancayo');
});

test('S05-TC-360 en «Modo simple» Aceptar y Rechazar son extragrandes; el plazo de 10 minutos no cambia', () => {
  const {unmount} = render(withA11y(<OfferSpotlight offer={offer(1)} serverTime={new Date(NOW).toISOString()} onChange={vi.fn()}/>, {simple_mode: true}));
  const actions = screen.getByRole('button', {name: /Aceptar/}).closest('.offer-actions');
  expect(actions).toHaveClass('is-xl');
  expect(actions).toHaveAttribute('data-size', 'xl');
  expect(screen.getByRole('timer')).toBeInTheDocument();
  unmount();
  render(withA11y(<OfferSpotlight offer={offer(1)} serverTime={new Date(NOW).toISOString()} onChange={vi.fn()}/>, {simple_mode: false}));
  expect(screen.getByRole('button', {name: /Aceptar/}).closest('.offer-actions')).not.toHaveClass('is-xl');
});

test('S05-TC-361 la bienvenida del técnico suma «Avisos de ofertas más notorios» y guarda ajustes y avisos, nunca la tarjeta', async () => {
  routes({'PUT /me/preferences': async () => ({data: {}})});
  render(<TechnicianOnboarding user={user()}/>);
  const dialog = screen.getByRole('dialog', {name: '¿Cómo prefieres usar TécnicoYa?'});
  const cards = within(dialog).getAllByRole('button', {pressed: false}).map(button => button.querySelector('strong')?.textContent).filter(Boolean);
  expect(cards).toEqual([...TECHNICIAN_WELCOME_CARDS.map(card => card[1])]);
  expect(cards).toContain('Avisos de ofertas más notorios');
  fireEvent.click(within(dialog).getByRole('button', {name: /Avisos de ofertas más notorios/}));
  fireEvent.click(within(dialog).getByRole('button', {name: /Letra grande y alto contraste/}));
  fireEvent.click(within(dialog).getByRole('button', {name: 'Guardar y continuar'}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/me/preferences', {accessibility: {text_size: 130, high_contrast: true},
    offer_alerts: {sound: true, vibration: true, flash: true}, onboarding_completed: true}, 'PUT'));
  expect(JSON.stringify(request.mock.calls)).not.toMatch(/"avisos"|"grande"|welcome_card/);
  expect(getOfferAlerts()).toMatchObject({sound: true, vibration: true, flash: true});
  // Sin el tutorial visto, sigue el tutorial de 5 pasos.
  expect(await screen.findByText('Paso 1 de 5')).toBeInTheDocument();
});

test('S05-TC-362 la bienvenida y el tutorial salen solo la primera vez', () => {
  const {unmount} = render(<TechnicianOnboarding user={user({onboarding_completed_at: '2026-11-18T14:00:00.000Z', tour_completed_at: '2026-11-18T14:01:00.000Z'})}/>);
  expect(screen.queryByRole('dialog')).toBeNull();
  unmount();
  render(<TechnicianOnboarding user={user({onboarding_completed_at: '2026-11-18T14:00:00.000Z'})}/>);
  expect(screen.queryByRole('dialog', {name: '¿Cómo prefieres usar TécnicoYa?'})).toBeNull();
  expect(screen.getByText('Paso 1 de 5')).toBeInTheDocument();
});

test('S05-TC-363 el tutorial del técnico tiene 5 pasos, se puede omitir y al terminar queda marcado', async () => {
  routes({'PUT /me/preferences': async () => ({data: {}})});
  const {unmount} = render(<TechnicianOnboarding user={user({onboarding_completed_at: '2026-11-18T14:00:00.000Z'})}/>);
  const titles = [];
  for (let step = 0; step < 5; step += 1) {
    titles.push(screen.getByRole('dialog').querySelector('h2').textContent);
    fireEvent.click(screen.getByRole('button', {name: step === 4 ? 'Terminar' : 'Siguiente'}));
  }
  expect(titles).toEqual(TECHNICIAN_TOUR_STEPS.map(step => step.title));
  expect(titles).toEqual(['Tus ofertas', 'Primeros pasos', 'Mi negocio', 'Campana y cuenta', 'Accesibilidad rápida']);
  await waitFor(() => expect(request).toHaveBeenCalledWith('/me/preferences', {tour_completed: true}, 'PUT'));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  unmount();
  request.mockClear();
  render(<TechnicianOnboarding user={user({onboarding_completed_at: '2026-11-18T14:00:00.000Z'})}/>);
  fireEvent.click(screen.getByRole('button', {name: 'Omitir tutorial'}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/me/preferences', {tour_completed: true}, 'PUT'));
});

test('S05-TC-364 «Cómo funciona» repite el tutorial sin volver a marcarlo', async () => {
  routes();
  const onTour = vi.fn();
  const {unmount} = render(<TechnicianHowItWorks navigate={vi.fn()} onTour={onTour}/>);
  fireEvent.click(screen.getByRole('button', {name: /Ver el tutorial otra vez/}));
  expect(onTour).toHaveBeenCalled();
  unmount();
  const onReplayEnd = vi.fn();
  render(<TechnicianOnboarding replay onReplayEnd={onReplayEnd}
    user={user({onboarding_completed_at: '2026-11-18T14:00:00.000Z', tour_completed_at: '2026-11-18T14:01:00.000Z'})}/>);
  expect(screen.getByText('Paso 1 de 5')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: 'Omitir tutorial'}));
  await waitFor(() => expect(onReplayEnd).toHaveBeenCalled());
  expect(request).not.toHaveBeenCalledWith('/me/preferences', expect.anything(), 'PUT');
});

test('S05-TC-365 «Primeros pasos» muestra los 4 pasos con su estado, lleva a cada sección y desaparece al completarlos', () => {
  const steps = (done = [true, false, false, true]) => ({total: 4, completed: done.filter(Boolean).length, done: done.every(Boolean), steps: [
    {code: 'profile', label: 'Completa tu perfil: «Sobre mí» y distrito base', section: 'profile-pro', done: done[0]},
    {code: 'documents', label: 'Sube tus 2 documentos de verificación', section: 'verification', done: done[1]},
    {code: 'zones', label: 'Elige tus zonas y tus horarios', section: 'zones', done: done[2]},
    {code: 'services', label: 'Agrega un servicio con su tarifa', section: 'services', done: done[3]}]});
  const navigate = vi.fn();
  const {rerender} = render(<FirstSteps data={steps()} navigate={navigate}/>);
  const section = screen.getByRole('region', {name: /Primeros pasos/});
  expect(within(section).getByText('2 de 4')).toBeInTheDocument();
  expect(within(section).getAllByRole('listitem').map(item => item.querySelector('.tech-first-state').textContent)).toEqual(['Hecho', 'Pendiente', 'Pendiente', 'Hecho']);
  expect(within(section).getAllByRole('button', {name: /^Hacerlo/})).toHaveLength(2);
  fireEvent.click(within(section).getByRole('button', {name: /^Hacerlo ?: Sube tus 2 documentos/}));
  expect(navigate).toHaveBeenCalledWith('verification');
  fireEvent.click(within(section).getByRole('button', {name: /^Hacerlo ?: Elige tus zonas/}));
  expect(navigate).toHaveBeenCalledWith('zones');
  rerender(<FirstSteps data={steps([true, true, true, true])} navigate={navigate}/>);
  expect(screen.queryByRole('region', {name: /Primeros pasos/})).toBeNull();
});

test('S05-TC-366 con «Dictar por voz», el perfil profesional muestra el micrófono (es-PE) y agrega lo dictado al texto', async () => {
  routes();
  const engines = [];
  window.SpeechRecognition = class { constructor() { engines.push(this); this.start = vi.fn(); this.stop = vi.fn(); this.abort = vi.fn(); } };
  render(withA11y(<ProfessionalProfile user={{name: 'Técnico Nuevo'}}/>, {dictation: true}));
  await screen.findByRole('heading', {name: 'Sobre mí', level: 3});
  expect(screen.getAllByRole('button', {name: 'Dictar con la voz'})).toHaveLength(3);
  fireEvent.click(screen.getAllByRole('button', {name: 'Dictar con la voz'})[0]);
  fireEvent.click(screen.getByRole('button', {name: 'Aceptar y dictar'}));
  expect(engines[0]).toMatchObject({lang: 'es-PE'});
  expect(engines[0].start).toHaveBeenCalled();
  act(() => engines[0].onresult({results: [[{transcript: 'reparo laptops y computadoras'}]]}));
  expect(screen.getByLabelText(/Cuéntales quién eres/)).toHaveValue('Hola. reparo laptops y computadoras');
  cleanup();
  render(withA11y(<ProfessionalProfile user={{name: 'Técnico Nuevo'}}/>, {dictation: false}));
  await screen.findByRole('heading', {name: 'Sobre mí', level: 3});
  expect(screen.queryByRole('button', {name: 'Dictar con la voz'})).toBeNull();
});

test('S05-TC-367 base WCAG de lo nuevo: botones con type, nombres y descripciones accesibles, y estado con ícono y texto', async () => {
  routes();
  render(<>
    <OfferAlertsTab/>
    <FirstSteps navigate={vi.fn()} data={{total: 4, completed: 1, done: false, steps: [{code: 'profile', label: 'Perfil', section: 'profile-pro', done: true},
      {code: 'documents', label: 'Documentos', section: 'verification', done: false}]}}/>
    <TechnicianOnboarding user={user()}/>
  </>);
  for (const button of document.querySelectorAll('button')) {
    expect(button).toHaveAttribute('type');
    expect(button).toHaveAccessibleName();
  }
  for (const item of screen.getAllByRole('switch')) expect(item).toHaveAccessibleDescription();
  // El estado de cada paso va con su marca y con texto, nunca solo con color.
  const done = document.querySelector('.tech-first-list li[data-done="true"]');
  expect(done.querySelector('.tech-first-mark .panel-svg-icon')).not.toBeNull();
  expect(done).toHaveTextContent('Hecho');
  expect(screen.getByRole('dialog', {name: '¿Cómo prefieres usar TécnicoYa?'})).toHaveAttribute('aria-modal', 'true');
});

test('S05-TC-368 sin sonido, vibración ni voz en el equipo, la pestaña lo explica y el aviso queda en el destello', () => {
  installDevices({sound: false, vibrate: false, voice: false});
  render(<>
    <OfferAlertsTab/>
    <OfferSpotlight offer={offer(1)} serverTime={new Date(NOW).toISOString()} onChange={vi.fn()}/>
  </>);
  expect(screen.getByRole('switch', {name: /Vibración/})).toHaveAccessibleDescription(/Tu equipo no permite vibrar\./);
  expect(screen.getByRole('switch', {name: /Leer la oferta/})).toHaveAccessibleDescription(/Tu navegador no permite leer en voz alta\./);
  expect(screen.getByRole('switch', {name: /Sonido/})).toHaveAccessibleDescription(/Tu navegador no permite reproducir el sonido\./);
  expect(screen.queryByRole('button', {name: 'Leer la oferta en voz alta'})).toBeNull();
  const flash = vi.fn();
  expect(alertOffer(offer(1), {sound: true, vibration: true, flash: true, speak: true}, {flash})).toEqual(['flash']);
  expect(flash).toHaveBeenCalledTimes(1);
});
