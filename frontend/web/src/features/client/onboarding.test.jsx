import React from 'react';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import PanelShell from '../panel/PanelShell';
import ClientOnboarding, {WELCOME_CARDS, placeBubble} from './ClientOnboarding';
import ProblemSearch, {DICTATION_NOTICE} from './ProblemSearch';
import {AccessibilityContext, DEFAULT_PREFS, prefersReducedMotion} from '../panel/quickAccessibility';
import {request} from '../administration/http';
// S05-TC-244 a 249 · Fase 5 del panel final (modo rápido, D-97): ajustes en la cuenta, bienvenida, tutorial, dictado con
// aviso y «Saltar al contenido». Fase T1 del técnico (D-105): el guardado pasó de /client/me/preferences a /me/preferences.
vi.mock('../administration/http', () => ({request: vi.fn(), serverNow: () => Date.now()}));
vi.mock('../realtime/Realtime', () => ({useRealtimeResource: () => {}}));

const prefs = (extra = {}) => ({accessibility: {...DEFAULT_PREFS}, onboarding_completed_at: null, tour_completed_at: null, ...extra});
const user = (preferences = prefs()) => ({id: '5', name: 'Cliente Demo', version: 4, role: {code: 'client'}, theme_preference: 'light',
  client_profile: {client_type: 'household', district_id: 1, preferences}});
const sections = [
  {id: 'home', label: 'Inicio', icon: 'home', render: () => <p>Contenido de Inicio.</p>},
  {id: 'new', group: 'Servicios', label: 'Nueva solicitud', icon: 'plus', render: () => <p>Nueva.</p>},
];
const shell = (account = user(), children = null) => render(<PanelShell user={account} role="client" roleLabel="Cliente"
  navLabel="Gestión del cliente" sections={sections} onLogout={vi.fn()} onUserChange={vi.fn()} modern>{children}</PanelShell>);
const html = () => document.documentElement.dataset;
beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()}));
  try { localStorage.clear(); sessionStorage.clear(); } catch { /* sin almacenamiento */ }
  request.mockImplementation(async (path, body, method) => (path === '/me/preferences' && method === 'PUT'
    ? {data: prefs({onboarding_completed_at: '2026-11-10T15:00:00Z'})} : {data: {items: [], unread_count: 0}}));
});
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); });

test('S05-TC-244 la pestaña Accesibilidad trae todos los ajustes, los aplica al instante y los guarda en la cuenta', async () => {
  shell(user(prefs({accessibility: {...DEFAULT_PREFS, text_size: 115}})));
  expect(html().textSize).toBe('115');
  fireEvent.click(screen.getByRole('button', {name: 'Cuenta de Cliente Demo'}));
  fireEvent.click(screen.getByRole('tab', {name: 'Accesibilidad'}));
  const panel = screen.getByRole('tabpanel');
  expect(within(panel).getAllByRole('switch').map(s => s.closest('label').querySelector('span').firstChild.textContent)).toEqual([
    'Alto contraste', 'Fuente legible y más espacio', 'Reducir animaciones', 'Foco grueso y enlaces subrayados', 'Leer en voz alta',
    'Dictar por voz', 'Modo simple']);
  expect(panel).not.toHaveTextContent('próximamente');

  for (const [name, attribute, value] of [['Fuente legible y más espacio', 'font', 'readable'], ['Reducir animaciones', 'motion', 'reduce'],
    ['Foco grueso y enlaces subrayados', 'focus', 'strong'], ['Modo simple', 'simple', 'on']]) {
    fireEvent.click(within(panel).getByRole('switch', {name: new RegExp(name)}));
    expect(html()[attribute]).toBe(value);
  }
  expect(prefersReducedMotion()).toBe(true);
  await waitFor(() => expect(request).toHaveBeenCalledWith('/me/preferences', {accessibility: {simple_mode: true}}, 'PUT'));
  expect(request).toHaveBeenCalledWith('/me/preferences', {accessibility: {readable_font: true}}, 'PUT');
});

test('S05-TC-245 la bienvenida usa tarjetas de preferencia y guarda solo los ajustes que resultan, sin la tarjeta elegida', async () => {
  shell(user(), <ClientOnboarding user={user()}/>);
  const dialog = screen.getByRole('dialog', {name: '¿Cómo prefieres usar TécnicoYa?'});
  const cards = within(dialog).getAllByRole('button').filter(b => b.classList.contains('welcome-card'));
  expect(cards.map(card => card.querySelector('strong').textContent)).toEqual(['Letra grande y alto contraste', 'Lectura más fácil',
    'Uso teclado o voz', 'Pantalla más simple', 'Menos movimiento', 'Ninguna, continuar']);
  expect(dialog.textContent).not.toMatch(/veo poco|me cuesta|discapacidad|me mareo/i);

  fireEvent.click(cards[0]);
  fireEvent.click(cards[4]);
  expect(cards[0]).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(within(dialog).getByRole('button', {name: 'Guardar y continuar'}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/me/preferences',
    {accessibility: {text_size: 130, high_contrast: true, reduce_motion: true}, onboarding_completed: true}, 'PUT'));
  expect(html()).toMatchObject({textSize: '130', contrast: 'high', motion: 'reduce'});
  expect(JSON.stringify(request.mock.calls)).not.toMatch(/grande|movimiento|tarjeta/);
  // Después de la bienvenida empieza el tutorial.
  expect(await screen.findByRole('dialog', {name: 'Servicios'})).toBeInTheDocument();
});

test('S05-TC-246 «Omitir» marca la bienvenida sin ajustes, Esc omite el tutorial y ninguno vuelve a salir', async () => {
  const {unmount} = shell(user(), <ClientOnboarding user={user()}/>);
  fireEvent.click(screen.getByRole('button', {name: 'Omitir'}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/me/preferences', {onboarding_completed: true}, 'PUT'));
  const tour = await screen.findByRole('dialog', {name: 'Servicios'});
  fireEvent.keyDown(tour, {key: 'Escape'});
  await waitFor(() => expect(request).toHaveBeenCalledWith('/me/preferences', {tour_completed: true}, 'PUT'));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  unmount();

  const done = user(prefs({onboarding_completed_at: '2026-11-10T15:00:00Z', tour_completed_at: '2026-11-10T15:01:00Z'}));
  shell(done, <ClientOnboarding user={done}/>);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('S05-TC-247 el tutorial tiene 4 pasos con Atrás, Siguiente y «2 de 4», y repetirlo desde Ayuda no lo vuelve a marcar', async () => {
  const half = user(prefs({onboarding_completed_at: '2026-11-10T15:00:00Z'}));
  const {unmount} = shell(half, <ClientOnboarding user={half}/>);
  const titles = [];
  for (let step = 1; step <= 4; step += 1) {
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent(`Paso ${step} de 4`);
    titles.push(within(dialog).getByRole('heading').textContent);
    const next = within(dialog).getByRole('button', {name: step === 4 ? 'Terminar' : 'Siguiente'});
    await waitFor(() => expect(next).toHaveFocus());
    if (step === 2) {
      fireEvent.click(within(dialog).getByRole('button', {name: 'Atrás'}));
      expect(screen.getByRole('dialog')).toHaveTextContent('Paso 1 de 4');
      fireEvent.click(screen.getByRole('button', {name: 'Siguiente'}));
    }
    fireEvent.click(screen.getByRole('button', {name: step === 4 ? 'Terminar' : 'Siguiente'}));
  }
  expect(titles).toEqual(['Servicios', 'Nueva solicitud', 'Campana y cuenta', 'Accesibilidad rápida']);
  await waitFor(() => expect(request).toHaveBeenCalledWith('/me/preferences', {tour_completed: true}, 'PUT'));
  unmount();

  request.mockClear();
  const onEnd = vi.fn();
  shell(user(prefs({onboarding_completed_at: 'x', tour_completed_at: 'y'})), <ClientOnboarding user={user()} replay onReplayEnd={onEnd}/>);
  fireEvent.click(screen.getByRole('button', {name: 'Omitir tutorial'}));
  await waitFor(() => expect(onEnd).toHaveBeenCalled());
  expect(request).not.toHaveBeenCalledWith('/me/preferences', expect.anything(), 'PUT');
});

test('S05-TC-248 el micrófono solo aparece con el ajuste y soporte, y no dicta sin aceptar el aviso de Google', () => {
  const start = vi.fn();
  function Recognition() { this.start = () => { start(this.lang); this.onresult?.({results: [[{transcript: 'mi laptop no prende'}]]}); }; this.abort = vi.fn(); }
  const withPrefs = (value, node) => <AccessibilityContext.Provider value={{prefs: {...DEFAULT_PREFS, ...value}, update: vi.fn()}}>{node}</AccessibilityContext.Provider>;
  vi.stubGlobal('SpeechRecognition', Recognition);
  const {rerender} = render(withPrefs({dictation: false}, <ProblemSearch/>));
  expect(screen.queryByRole('button', {name: 'Dictar con la voz'})).toBeNull();

  rerender(withPrefs({dictation: true}, <ProblemSearch/>));
  fireEvent.click(screen.getByRole('button', {name: 'Dictar con la voz'}));
  expect(screen.getByRole('alertdialog')).toHaveTextContent(DICTATION_NOTICE);
  fireEvent.click(screen.getByRole('button', {name: 'Cancelar'}));
  expect(start).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', {name: 'Dictar con la voz'}));
  fireEvent.click(screen.getByRole('button', {name: 'Aceptar y dictar'}));
  expect(start).toHaveBeenCalledWith('es-PE');
  expect(screen.getByRole('combobox', {name: '¿Qué se malogró?'})).toHaveValue('mi laptop no prende');
  vi.unstubAllGlobals();
  cleanup();
  render(withPrefs({dictation: true}, <ProblemSearch/>));
  expect(screen.queryByRole('button', {name: 'Dictar con la voz'})).toBeNull(); // navegador sin SpeechRecognition
});

test('S05-TC-249 «Saltar al contenido» lleva el foco al contenido y los ajustes tienen su estilo con la fuente incluida', () => {
  shell();
  const skip = screen.getByRole('link', {name: 'Saltar al contenido'});
  fireEvent.click(skip);
  expect(document.getElementById('contenido')).toHaveFocus();
  expect(window.location.hash).not.toBe('#contenido');

  const css = readFileSync(resolve('src/features/panel/panel.css'), 'utf8');
  expect(css).toMatch(/html\[data-font="readable"\][^{]*\{[^}]*font-family: 'Atkinson Hyperlegible'/);
  expect(css).toMatch(/html\[data-font="readable"\] \.panel-shell :is\(p, li, label, small, span\) \{ line-height: 1\.6; \}/);
  expect(css).toMatch(/html\[data-motion="reduce"\] \*[^{]*\{[^}]*transition-duration: 0\.01ms/);
  expect(css).toMatch(/html\[data-focus="strong"\][^{]*\{[^}]*outline: 3px solid/);
  expect(css).toMatch(/html\[data-simple="on"\][^{]*\{ min-height: 48px; \}/);
  expect(readFileSync(resolve('src/features/panel/quickAccessibility.jsx'), 'utf8')).toContain("import '@fontsource/atkinson-hyperlegible/400.css';");
  expect(WELCOME_CARDS).toHaveLength(5);
});

test('S05-TC-253 vistos en las capturas: micrófono dentro del campo, lupa fija y botones propios en la bienvenida y el tutorial', () => {
  const css = readFileSync(resolve('src/features/panel/panel.css'), 'utf8');
  expect(css).toMatch(/\.panel-shell \.problem-search-box \.problem-search-mic \{[^}]*position: absolute[^}]*right: 6px/);
  expect(css).toMatch(/\.panel-shell \.problem-search-box:has\(\.problem-search-mic\) input \{ padding-right: 60px; \}/);
  expect(css).toMatch(/\.panel-shell \.problem-search-icon \{ top: 28px; \}/);
  expect(css).toMatch(/:is\(\.onboarding-overlay, \.tour-layer\) \.button\.primary \{[^}]*background: var\(--ty-accent\)/);
  expect(css).toMatch(/\.a11y-switch \{ align-items: flex-start; \}/);
});

test('S05-TC-255 el tutorial expande el menú contraído, coloca la burbuja dentro de la pantalla y restaura el menú al terminar', async () => {
  Element.prototype.scrollIntoView = vi.fn();
  const collapsed = {...user(prefs({onboarding_completed_at: '2026-11-10T15:00:00Z'})), sidebar_collapsed: true};
  const {container} = shell(collapsed, <ClientOnboarding user={collapsed}/>);
  await waitFor(() => expect(container.querySelector('.panel-shell')).toHaveClass('is-touring'));
  expect(container.querySelector('.panel-shell')).not.toHaveClass('is-collapsed');
  expect(document.body).toHaveClass('is-touring');
  // jsdom no mide cajas: sin zona visible la burbuja va centrada, nunca fuera de la pantalla.
  await waitFor(() => expect(screen.getByRole('dialog')).toHaveClass('is-center'));
  fireEvent.click(screen.getByRole('button', {name: 'Omitir tutorial'}));
  await waitFor(() => expect(container.querySelector('.panel-shell')).toHaveClass('is-collapsed'));
  expect(document.body).not.toHaveClass('is-touring');

  const viewport = {width: 390, height: 844};
  const size = {width: 320, height: 180};
  expect(placeBubble({top: 100, bottom: 150, left: 300, right: 380}, size, viewport)).toEqual({top: 162, left: 58, side: 'below'});
  expect(placeBubble({top: 700, bottom: 760, left: 10, right: 100}, size, viewport)).toEqual({top: 508, left: 12, side: 'above'});
  expect(placeBubble({top: 100, bottom: 700, left: 10, right: 40}, size, {width: 1366, height: 800})).toMatchObject({left: 52, side: 'right'});
  const center = placeBubble({top: 0, bottom: 844, left: 0, right: 390}, size, viewport);
  expect(center.side).toBe('center');
  expect(center.left).toBeGreaterThanOrEqual(12);
  expect(center.left + size.width).toBeLessThanOrEqual(390 - 12);
});

test('S05-TC-256 el tutorial desplaza la zona con scrollIntoView centrado, e instantáneo con «Reducir animaciones»', async () => {
  const calls = [];
  const original = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function rect() {
    return this.matches?.('.panel-sidebar nav [role=group]') ? {top: 900, bottom: 1000, left: 10, right: 230, width: 220, height: 100} : original.call(this);
  };
  Element.prototype.scrollIntoView = function into(options) { calls.push(options); };
  const half = user(prefs({onboarding_completed_at: '2026-11-10T15:00:00Z', accessibility: {...DEFAULT_PREFS, reduce_motion: true}}));
  shell(half, <ClientOnboarding user={half}/>);
  await waitFor(() => expect(calls[0]).toEqual({block: 'center', inline: 'nearest', behavior: 'auto'}));
  expect(document.querySelector('.tour-highlight')).not.toBeNull();
  Element.prototype.getBoundingClientRect = original;
});

test('S05-TC-257 «Tu cuenta» es un diálogo centrado con avatar, correo y plan, pestañas con ícono y acento, y tarjetas de tema', () => {
  const account = {...user(), email: 'cliente-demo@example.test', given_names: 'Cliente', family_names: 'Demo'};
  shell(account);
  fireEvent.click(screen.getByRole('button', {name: 'Cuenta de Cliente Demo'}));
  const dialog = screen.getByRole('dialog', {name: 'Tu cuenta'});
  expect(dialog.querySelector('.account-head .account-avatar')).toHaveTextContent('CD');
  expect(within(dialog).getByText('cliente-demo@example.test')).toBeInTheDocument();
  expect(within(dialog).getByText('Plan Free')).toBeInTheDocument();
  const tablist = within(dialog).getByRole('tablist');
  expect(tablist).toHaveAttribute('aria-orientation', 'vertical');
  expect(within(tablist).getAllByRole('tab').map(tab => tab.getAttribute('data-accent'))).toEqual(['blue', 'green', 'violet', 'orange', 'teal']);
  within(tablist).getAllByRole('tab').forEach(tab => expect(tab.querySelector('.account-tab-icon svg')).not.toBeNull());
  fireEvent.keyDown(within(tablist).getByRole('tab', {name: 'Mi cuenta'}), {key: 'ArrowDown'});
  expect(tablist.style.getPropertyValue('--tab-index')).toBe('1');
  expect(within(dialog).getByRole('heading', {name: 'Mis direcciones'})).toBeInTheDocument();

  fireEvent.click(within(tablist).getByRole('tab', {name: 'Apariencia'}));
  const themes = within(dialog).getByRole('radiogroup', {name: 'Tema'});
  expect(within(themes).getAllByRole('radio').map(card => card.getAttribute('aria-checked'))).toEqual(['true', 'false']);
  expect(themes.querySelectorAll('.theme-mini')).toHaveLength(2);
  expect(within(dialog).getByRole('button', {name: 'Cerrar sesión'})).toHaveClass('account-logout');

  const css = readFileSync(resolve('src/features/panel/panel.css'), 'utf8');
  expect(css).toMatch(/\.account-panel \{[^}]*width: min\(880px, 100%\)/);
  expect(css).toMatch(/\.account-overlay \{[^}]*backdrop-filter: blur\(6px\)/);
  expect(css).toContain('.account-panel :is(input[type="checkbox"], input[type="radio"]) { accent-color: var(--ty-accent); }');
  expect(css).toContain('.account-tabs { grid-template-columns: repeat(2, minmax(0, 1fr));');
  expect(css).toContain('.account-overlay, .account-panel, .account-pane { animation: none; }');
});
