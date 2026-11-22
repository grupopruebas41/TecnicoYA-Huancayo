import React from 'react';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import TechnicianCard from '../matching/TechnicianCard';
import TechnicianProfile from '../matching/TechnicianProfile';
import MyRequests from '../requests/MyRequests';
import RequestDetailSummary from './RequestDetailSummary';
import ClientHome from './ClientHome';
import {FavoritesPage, FaqPage, NewsPage, PrivacyPage} from './ClientPages';
import {AlertsPage, EquipmentPage, PromotionsPage, SensorsPage, WarrantiesPage, equipmentImage} from '../premium/PremiumPages';
import {relativeTime, shortDate, shortDateTime, soles} from '../../lib/format';
import {SPECIALTY_TIPS, TIPS} from './homeContent';
import {request} from '../administration/http';

// S05-TC-388 a 403 · Pulido final del panel del cliente: tarjeta de técnico sin insignias partidas (DEF-77), favoritos,
// perfil, Mis solicitudes y su detalle, sensores sin datos (DEF-76), alertas, equipos, promociones, garantías, novedades,
// preguntas frecuentes, privacidad, Inicio, formatos y dirección visual común. Datos sintéticos.
const NOW = Date.parse('2026-11-22T15:00:00Z');
vi.mock('../administration/http', () => ({request: vi.fn(), serverNow: () => Date.parse('2026-11-22T15:00:00Z')}));
vi.mock('../administration/RoleAnnouncements', () => ({default: () => null}));
const css = path => readFileSync(resolve(path), 'utf8').replace(/\r\n/g, '\n');
// Reloj fijo (solo Date): las fechas omiten el año actual y «hace X» depende de la hora.
beforeEach(() => {
  vi.useFakeTimers({toFake: ['Date'], now: NOW});
  vi.stubGlobal('matchMedia', () => ({matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()}));
});
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

const technician = (overrides = {}) => ({
  id: 7, display_name: 'Rosa Quispe Huamán de los Andes', experience_years: 9, verified: true, favorite: true,
  specialties: [{id: 2, name: 'Refrigeración comercial'}], rating: {average: null, count: 0}, sample_rating: {average: 4.6, count: 5},
  services: [1, 2, 3, 4, 5].map(n => ({subcategory_id: n, subcategory_name: `Servicio ${n}`, reference_fee: String(40 + n * 10)})),
  districts: [{id: 1, name: 'Huancayo'}], distance: {km: 1, same_district: true}, ...overrides,
});

test('S05-TC-388 Buscar técnicos: cada insignia es una pieza en una sola línea que se ajusta en filas, sin clases del técnico [DEF-77]', () => {
  const {container} = render(<TechnicianCard technician={technician()} onFavorite={() => {}}/>);
  const article = screen.getByRole('article', {name: 'Rosa Quispe Huamán de los Andes'});
  const badges = [...article.querySelector('.tcard-badges').children];
  expect(badges.map(badge => badge.textContent.trim())).toEqual(['Verificado', '4,6', 'Ejemplo']);
  badges.forEach(badge => expect(badge).toHaveClass('cx-badge'));
  expect(within(article).getByLabelText('4,6 de 5 en 5 reseñas de ejemplo')).toHaveClass('cx-badge');
  // Sin las clases que technician.css define como grilla de dos columnas (la causa del texto letra por letra).
  expect(container.querySelector('.tech-card, .tech-badges, .tech-card-title')).toBeNull();
  const polish = css('src/features/client/polish.css');
  expect(polish).toMatch(/\.cx-badge \{[^}]*flex: none[^}]*white-space: nowrap/);
  expect(polish).toMatch(/\.cx-badges \{[^}]*display: flex[^}]*flex-wrap: wrap/);
  const card = css('src/features/matching/technicianCard.css');
  expect(card).toMatch(/\.tcard-name \{[^}]*overflow-wrap: normal[^}]*word-break: normal/);
  expect(card).toMatch(/\.tcard-foot \{[^}]*margin-top: auto/);
  // Máximo 3 servicios y «+N más»; precio en grande con coma decimal; «Ver perfil» al pie.
  expect(within(within(article).getByRole('list', {name: 'Servicios'})).getAllByRole('listitem').map(item => item.textContent))
    .toEqual(['Servicio 1', 'Servicio 2', 'Servicio 3', '+2 más']);
  expect(within(article).getByText('Desde S/ 50,00')).toHaveClass('tcard-fee');
  expect(within(article).getByRole('button', {name: 'Ver perfil de Rosa Quispe Huamán de los Andes'}).closest('.tcard-foot')).not.toBeNull();
});

test('S05-TC-389 Técnicos favoritos: «Pedir de nuevo» abre la solicitud dirigida y quitar el corazón pide confirmación', async () => {
  request.mockImplementation(async (path, body, method) => (path === '/client/favorites' ? {data: {items: [technician()]}} : method === 'DELETE' ? null : {data: []}));
  const navigate = vi.fn();
  render(<FavoritesPage navigate={navigate}/>);
  const card = await screen.findByRole('article', {name: 'Rosa Quispe Huamán de los Andes'});
  fireEvent.click(within(card).getByRole('button', {name: 'Pedir de nuevo a Rosa Quispe Huamán de los Andes'}));
  expect(navigate).toHaveBeenCalledWith('new', {technician: expect.objectContaining({id: 7})});
  fireEvent.click(within(card).getByRole('button', {name: 'Quitar a Rosa Quispe Huamán de los Andes de favoritos'}));
  const confirm = screen.getByRole('group', {name: 'Confirmar: quitar a Rosa Quispe Huamán de los Andes de favoritos'});
  expect(within(confirm).getByRole('button', {name: 'No'})).toHaveFocus();
  fireEvent.click(within(confirm).getByRole('button', {name: 'No'}));
  expect(request).not.toHaveBeenCalledWith('/client/favorites/7', null, 'DELETE');
  expect(screen.getByRole('article', {name: 'Rosa Quispe Huamán de los Andes'})).toBeInTheDocument();
  expect(screen.getByRole('region', {name: 'Técnicos favoritos'}).querySelector('.cx-head-icon')).not.toBeNull();
});

test('S05-TC-390 Perfil público: barra con el resumen y las acciones, tarifa alineada y «Ver más» para un «Qué incluye» largo', async () => {
  const long = 'Limpieza del condensador, revisión del ventilador, medición de presiones del gas refrigerante, ajuste del termostato y prueba de fugas con jabón.';
  request.mockResolvedValue({data: {id: 7, display_name: 'Rosa Quispe', experience_years: 9, verified: true, specialties: [{id: 2, name: 'Refrigeración comercial'}],
    rating: {average: null, count: 0}, sample_rating: null, availability: {available_today: true, week: []}, districts: [], portfolio: [], reviews: [],
    bio: 'Técnica sintética.', work_style: 'Diagnóstico antes de cotizar.', warranty_text: 'Garantía de 30 días.',
    services: [{subcategory_id: 9, subcategory_name: 'Vitrinas', reference_fee: '120.00', includes: long}, {subcategory_id: 10, subcategory_name: 'Cámaras', reference_fee: '150.00'}]}});
  render(<TechnicianProfile id={7} onBack={() => {}} onRequest={() => {}} onFavorite={() => {}}/>);
  const bar = (await screen.findByRole('button', {name: 'Solicitar servicio'})).closest('.profile-cta-bar');
  expect(bar.querySelector('.profile-cta-summary')).toHaveTextContent('Desde S/ 120,00Disponible hoy');
  const services = screen.getByRole('region', {name: 'Servicios'});
  expect(within(services).getAllByRole('listitem')[0]).toHaveTextContent('Referencial S/ 120,00');
  const more = within(services).getByRole('button', {name: 'Ver más'});
  expect(more).toHaveAttribute('aria-expanded', 'false');
  expect(within(services).getByText(long)).toHaveClass('is-clamped');
  fireEvent.click(more);
  expect(within(services).getByRole('button', {name: 'Ver menos'})).toHaveAttribute('aria-expanded', 'true');
  expect(within(services).getByText(long)).not.toHaveClass('is-clamped');
  const about = screen.getByRole('region', {name: 'Sobre mí'});
  expect(within(about).getAllByRole('heading', {level: 4}).map(h => h.textContent)).toEqual(['Quién es', 'Forma de trabajo', 'Garantía']);
  expect(about.querySelectorAll('.profile-about-item .cx-dot svg')).toHaveLength(3);
});

const board = items => ({data: {items: items.map(row => ({order: null, requests: [row]})), counts: {active: items.length, scheduled: 0, completed: 0, cancelled: 0},
  pagination: {page: 1, per_page: 10, total: items.length, last_page: 1}}});
const row = (id, overrides = {}) => ({id, status: 'matching', phase: 'matching', mode: 'asap', specialty: {id: 2, name: 'Refrigeración comercial'},
  subcategories: [{id: 9, name: 'Vitrinas'}, {id: 10, name: 'Cámaras de frío'}], district: {name: 'El Tambo'}, technician: null,
  submitted_at: '2026-11-10T14:00:00Z', created_at: '2026-11-10T13:00:00Z', recent_events: [], can_cancel: true, ...overrides});

test('S05-TC-391 Mis solicitudes: tarjeta con franja de la especialidad, chips, «Buscando técnico · hace 12 días» y mini pasos', async () => {
  request.mockImplementation(async path => (path.startsWith('/client/requests') ? board([row(4)]) : {data: {}}));
  render(<MyRequests navigate={() => {}}/>);
  const card = await screen.findByRole('article', {name: 'Solicitud #4'});
  expect(card).toHaveAttribute('data-tone', 'refrigeracion');
  expect(card.querySelector('.request-stripe')).not.toBeNull();
  expect(card).toHaveTextContent('Buscando técnico · hace 12 días');
  expect(card.querySelector('.request-pulse')).toHaveAttribute('aria-hidden', 'true');
  expect(within(card).getByRole('list', {name: 'Avance de la solicitud #4: paso 2 de 6, Buscando'})).toBeInTheDocument();
  expect(within(within(card).getByRole('list', {name: 'Servicios'})).getAllByRole('listitem')).toHaveLength(2);
  expect(css('src/features/client/polish.css')).toMatch(/\.panel-content \.client-request-list \{[^}]*repeat\(auto-fit, minmax\(min\(100%, 320px\), 1fr\)\)/);
  expect(screen.getByRole('button', {name: 'Nueva solicitud'}).closest('.cx-head-actions')).not.toBeNull();
});

test('S05-TC-392 detalle: resumen con filas ícono + etiqueta + valor, insignia «Desde alerta IoT» y tarifa explicada', () => {
  const record = {id: 4, status: 'sent', phase: 'matching', mode: 'scheduled', preferred_start_at: '2026-12-04 14:00:00.000000', preferred_end_at: '2026-12-04 16:00:00.000000',
    time_slot: 'manana', specialty: {name: 'Refrigeración comercial'}, subcategories: [{name: 'Congeladores industriales'}], district: {name: 'El Tambo'},
    address: 'Av. Sintética 742', urgency: 'urgente', reference_fee: null, description: 'Alerta del sensor (demostración).', from_iot_alert: true};
  const {rerender} = render(<RequestDetailSummary record={record}/>);
  const summary = screen.getByRole('region', {name: 'Resumen de solicitud'});
  expect(within(summary).getByText('Desde alerta IoT')).toHaveClass('cx-badge');
  const terms = [...summary.querySelectorAll('dt')].map(dt => dt.textContent);
  expect(terms).toEqual(['Especialidad y subcategoría', 'Distrito y dirección', 'Franja', 'Urgencia', 'Tarifa', 'Descripción']);
  summary.querySelectorAll('dt').forEach(dt => expect(dt.querySelector('.cx-dot svg')).not.toBeNull());
  expect(summary).toHaveTextContent('Refrigeración comercial · Congeladores industriales');
  expect(summary).toHaveTextContent('El Tambo · Av. Sintética 742');
  expect(summary).toHaveTextContent('Atención programada · viernes, 4 de diciembre · Mañana (08–12)');
  expect(summary).toHaveTextContent('Sin tarifa referencialLa tarifa la propone el técnico al aceptar.');
  rerender(<RequestDetailSummary record={{...record, from_iot_alert: false, reference_fee: {amount: '50.00'}}}/>);
  expect(screen.queryByText('Desde alerta IoT')).toBeNull();
  expect(screen.getByText('Referencial S/ 50,00')).toBeInTheDocument();
});

const sensor = (id, status, value, overrides = {}) => ({id, name: 'Sensor', equipment: {id: 10 + id, name: `Equipo ${id}`}, metric: 'temperature',
  metric_label: 'Temperatura', unit: '°C', target: -18, tolerance: 3, threshold_label: '-18 °C ± 3', online: true, battery: 86, status, value,
  measured_at: value == null ? null : '2026-11-22T14:55:00Z', readings: value == null ? [] : [{value: -18, at: '2026-11-22T10:00:00Z'}, {value, at: '2026-11-22T14:55:00Z'}], ...overrides});

test('S05-TC-393 Sensores: sin lecturas el estado es «Sin datos» con reloj, nunca «Falla»; con lecturas, valor grande y datos del sensor [DEF-76]', async () => {
  request.mockResolvedValue({data: {simulated: true, items: [sensor(1, 'no_data', null), sensor(2, 'normal', -17.5)]}});
  render(<SensorsPage navigate={() => {}} refreshMs={60000}/>);
  const [empty, live] = await screen.findAllByRole('article');
  expect(within(empty).getByText('Sin datos').closest('.cx-badge')).toHaveClass('is-muted');
  expect(within(empty).queryByText('Falla')).toBeNull();
  expect(empty).toHaveClass('is-no_data');
  expect(empty).toHaveTextContent('Sin lecturas en las últimas 24 h');
  expect(within(live).getByText('-17,5', {selector: 'strong'})).toBeInTheDocument();
  expect(live).toHaveTextContent('Última lectura hace 5 min');
  expect(live).toHaveTextContent('Batería 86 %');
  expect(live).toHaveTextContent('En línea');
  expect(live.querySelector('.sensor-gauge-mark')).not.toBeNull();
  expect(live.querySelector('.premium-chart polygon')).not.toBeNull();
});

test('S05-TC-394 Alertas: activas primero y por severidad (Falla primero), ícono por tipo y valor fuera de rango resaltado', async () => {
  const alert = (id, severity, overrides) => ({id, kind: 'threshold', severity, metric: 'temperature', unit: '°C', range: {min: -21, max: -15}, value: -8,
    message: 'Mensaje', equipment: {id, name: `Equipo ${id}`}, started_at: '2026-11-22T10:00:00Z', resolved_at: null, request_id: null, ...overrides});
  request.mockResolvedValue({data: {items: [alert(1, 'info', {kind: 'maintenance', value: null, range: null, message: 'Toca el mantenimiento'}),
    alert(2, 'attention', {value: -13}), alert(3, 'failure', {resolved_at: '2026-11-22T12:00:00Z'}), alert(4, 'failure', {metric: 'power', unit: 'W', range: {min: 65, max: 115}, value: 160})]}});
  render(<AlertsPage navigate={() => {}}/>);
  const active = await screen.findByRole('region', {name: /^Activas/});
  const rows = within(active).getAllByRole('listitem');
  expect(rows.map(row => row.querySelector('.premium-alert-title').textContent.trim())).toEqual(['Falla Equipo 4', 'Atención Equipo 2', 'Recordatorio Equipo 1']);
  expect(within(rows[0]).getByText('160 W')).toHaveClass('alert-value');
  expect(rows[0]).toHaveTextContent('fuera del rango normal 65 a 115 W');
  expect(within(screen.getByRole('region', {name: /^Atendidas/})).getAllByRole('listitem')).toHaveLength(1);
  expect(within(screen.getByRole('region', {name: /^Atendidas/})).queryByRole('button', {name: 'Enviar a mi técnico de confianza'})).toBeNull();
  expect(rows[0]).toHaveTextContent('22 nov · 05:00');
});

test('S05-TC-395 Mis equipos: imagen por tipo, ilustración si falta (nunca rota), insignias del sensor y acciones con ícono y tooltip', async () => {
  expect(equipmentImage({subcategory_code: 'frio-congeladores'})).toBe('congeladora');
  expect(equipmentImage({subcategory_code: 'computo-hardware', name: 'Laptop de caja'})).toBe('laptop');
  expect(equipmentImage({subcategory_code: 'computo-hardware', name: 'PC de caja'})).toBe('computadora-escritorio');
  expect(equipmentImage({subcategory_code: 'electricidad-iluminacion'})).toBe('iluminacion');
  expect(equipmentImage({subcategory_code: 'electricidad-solar'})).toBe('equipo-generico');
  const item = (id, extra) => ({id, name: `Equipo ${id}`, specialty_id: 2, subcategory_id: 9, specialty: 'Refrigeración comercial', subcategory: 'Congeladores industriales',
    subcategory_code: 'frio-congeladores', brand: 'Frigo', model: 'CH-300', year: 2021, address: 'Bodega · Av. Sintética 742', has_sensor: true, sensor_status: 'failure',
    last_service_at: '2026-11-12T15:00:00Z', version: 1, ...extra});
  request.mockResolvedValue({data: {items: [item(1), item(2, {photo_url: '/fotos/mia.webp', has_sensor: false, sensor_status: null, last_service_at: null})]}});
  render(<EquipmentPage navigate={() => {}}/>);
  const [first, second] = await screen.findAllByRole('article');
  const image = within(first).getByRole('img', {name: 'Imagen referencial de Congeladores industriales'});
  expect(image).toHaveAttribute('src', '/img/equipos/congeladora.webp');
  fireEvent.error(image);
  expect(within(first).queryByRole('img', {name: /Imagen referencial/})).toBeNull();
  expect(first.querySelector('.equipment-media svg.equipment-art')).not.toBeNull();
  expect(within(first).getByText('Con sensor')).toBeInTheDocument();
  expect(within(first).getByText('Falla').closest('.cx-badge')).toHaveClass('is-danger');
  expect(first).toHaveTextContent('Último servicio: 12 nov');
  expect(within(second).getByRole('img', {name: 'Foto de Equipo 2'})).toHaveAttribute('src', '/fotos/mia.webp');
  expect(second).toHaveTextContent('Sin servicios todavía');
  for (const [label, tip] of [['Historial de Equipo 1', 'Historial'], ['Editar Equipo 1', 'Editar'], ['Eliminar Equipo 1', 'Eliminar']]) {
    expect(within(first).getByRole('button', {name: label})).toHaveAttribute('data-tip', tip);
  }
  expect(within(first).getByRole('button', {name: 'Pedir servicio para este equipo'})).toHaveClass('primary');
});

test('S05-TC-396 Promociones: cupón con especialidad, vigencia «hasta el 30 nov», condiciones y un solo rótulo de ejemplo', async () => {
  request.mockResolvedValue({data: {sample: true, items: [{id: 'a', title: 'Mantenimiento de refrigeración 20 %', body: 'Ejemplo.', ends_at: '2026-11-30T23:00:00Z'},
    {id: 'b', title: 'Revisión del tablero', body: 'Ejemplo.', ends_at: null}]}});
  render(<PromotionsPage/>);
  const [first, second] = await screen.findAllByRole('article');
  expect(screen.getAllByText('Ejemplo · datos de demostración')).toHaveLength(1);
  expect(first).toHaveTextContent('−20 %');
  expect(first).toHaveTextContent('Refrigeración comercial');
  expect(first).toHaveTextContent('Hasta el 30 nov');
  expect(first.querySelector('.coupon-terms')).toHaveTextContent('Condiciones');
  const use = within(first).getByRole('button', {name: 'Usar promoción'});
  expect(use).toBeDisabled();
  expect(use).toHaveAccessibleDescription('Disponible próximamente');
  expect(second).toHaveTextContent('Electricidad');
  expect(second).toHaveTextContent('Beneficio');
});

test('S05-TC-397 Garantías: «Vigentes» primero con la barra de días restantes; «Vencidas» compactas en su pestaña', async () => {
  request.mockResolvedValue({data: {sample: true, items: [
    {request_id: 5, subcategory: 'Vitrinas', technician: 'Rosa Quispe', days: 30, days_left: 12, active: true, closed_at: '2026-11-04T15:00:00Z', valid_until: '2026-12-04T15:00:00Z', can_claim: false},
    {request_id: 3, subcategory: 'Hardware', technician: null, days: 30, days_left: 0, active: false, closed_at: '2026-09-01T15:00:00Z', valid_until: '2026-10-01T15:00:00Z', can_claim: false}]}});
  render(<WarrantiesPage/>);
  const vigentes = await screen.findByRole('tab', {name: 'Vigentes (1)'});
  expect(vigentes).toHaveAttribute('aria-selected', 'true');
  const bar = screen.getByRole('progressbar', {name: 'Garantía de la solicitud #5'});
  expect(bar).toHaveAttribute('aria-valuetext', 'Quedan 12 de 30 días');
  expect(screen.getByRole('article')).toHaveTextContent('Rosa Quispe');
  expect(screen.getByRole('article')).toHaveTextContent('vence el 4 dic');
  expect(screen.getByRole('button', {name: 'Usar garantía'})).toHaveAccessibleDescription('Disponible en el Sprint 6.');
  fireEvent.click(screen.getByRole('tab', {name: 'Vencidas (1)'}));
  expect(screen.queryByRole('article')).toBeNull();
  expect(screen.getByRole('tabpanel')).toHaveTextContent('Vencida el 1 oct');
});

test('S05-TC-398 Novedades: tarjeta con tipo y fecha, y «Leer más» abre el detalle en un diálogo que Esc cierra', async () => {
  request.mockResolvedValue({data: [{id: 'n1', title: 'Horario de diciembre', body: 'Texto de ejemplo para clientes.', kind: 'news', starts_at: '2026-11-20T15:00:00Z', image_url: null}]});
  render(<NewsPage/>);
  const card = await screen.findByRole('article', {name: 'Horario de diciembre'});
  expect(card).toHaveTextContent('Comunicado');
  expect(card).toHaveTextContent('20 nov');
  const more = within(card).getByRole('button', {name: 'Leer más sobre «Horario de diciembre»'});
  more.focus();
  fireEvent.click(more);
  const dialog = screen.getByRole('dialog', {name: 'Horario de diciembre'});
  expect(dialog).toHaveTextContent('Publicado el 20 nov');
  expect(within(dialog).getByRole('button', {name: 'Cerrar novedad'})).toHaveFocus();
  fireEvent.keyDown(dialog, {key: 'Escape'});
  expect(screen.queryByRole('dialog')).toBeNull();
  await waitFor(() => expect(more).toHaveFocus());
});

test('S05-TC-399 Preguntas frecuentes: buscador, acordeón con aria-expanded y bloque final con «Reportar un problema» próximamente', () => {
  const navigate = vi.fn();
  render(<FaqPage navigate={navigate}/>);
  const question = screen.getByRole('button', {name: '¿Puedo cancelar una solicitud?'});
  expect(question).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(question);
  expect(question).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('region', {name: '¿Puedo cancelar una solicitud?'})).toBeVisible();
  fireEvent.change(screen.getByLabelText('Buscar una pregunta'), {target: {value: 'direccion'}});
  expect(screen.getAllByRole('button', {expanded: false}).map(b => b.textContent)).toEqual(['¿Quién ve mi dirección y mi teléfono?']);
  fireEvent.change(screen.getByLabelText('Buscar una pregunta'), {target: {value: 'zzz'}});
  expect(screen.getByText('No encontramos «zzz»')).toBeInTheDocument();
  expect(screen.getByRole('button', {name: 'Reportar un problema'})).toHaveAccessibleDescription('Próximamente');
  fireEvent.click(screen.getByRole('button', {name: 'Cómo funciona'}));
  expect(navigate).toHaveBeenCalledWith('how');
  expect(css('src/features/client/pages.css')).toMatch(/\.faq-item\.is-open \.faq-chevron \{[^}]*transform: rotate\(180deg\)/);
});

test('S05-TC-400 Privacidad: índice con anclas, fecha de la versión, aviso de borrador contenido y ancho de lectura de 72 caracteres', () => {
  render(<PrivacyPage/>);
  const toc = screen.getByRole('navigation', {name: 'Índice de privacidad y términos'});
  const links = within(toc).getAllByRole('link');
  expect(links).toHaveLength(5);
  const target = document.getElementById(links[3].getAttribute('href').slice(1));
  target.scrollIntoView = vi.fn();
  fireEvent.click(links[3]);
  expect(target).toHaveTextContent('Tus derechos');
  expect(target).toHaveFocus();
  expect(screen.getByRole('note')).toHaveTextContent('Borrador para revisión del equipo');
  expect(screen.getByText(/Versión del/)).toHaveTextContent('Versión del 22 nov · borrador');
  const pages = css('src/features/client/pages.css');
  expect(pages).toMatch(/\.privacy-doc \{[^}]*max-width: 72ch/);
  expect(pages).toMatch(/\.panel-content \.privacy-draft \{[^}]*box-sizing: border-box[^}]*max-width: 100%[^}]*overflow-wrap: anywhere/);
});

test('S05-TC-401 Inicio: «Otro consejo» rota por especialidad y «Tu seguridad» lleva checks en círculo verde', async () => {
  request.mockImplementation(async path => (path === '/client/home' ? {data: {district: null, prices: [], problems: []}} : path === '/requests' ? {data: []} : {data: []}));
  render(<ClientHome user={{id: 1, given_names: 'Cliente', client_profile: {}}} navigate={() => {}}/>);
  const tip = await screen.findByRole('region', {name: 'Consejo del mes'});
  expect(TIPS).toContain(tip.querySelector('.home-tip-text p').textContent);
  fireEvent.click(within(tip).getByRole('button', {name: 'Otro consejo'}));
  expect(tip).toHaveTextContent(SPECIALTY_TIPS[0].text);
  expect(within(tip).getByText(SPECIALTY_TIPS[0].specialty)).toBeInTheDocument();
  fireEvent.click(within(tip).getByRole('button', {name: 'Otro consejo'}));
  expect(tip).toHaveTextContent(SPECIALTY_TIPS[1].text);
  expect(tip.querySelector('[aria-live="polite"]')).not.toBeNull();
  const safety = screen.getByRole('region', {name: 'Tu seguridad'});
  expect(safety.querySelectorAll('.home-check svg')).toHaveLength(2);
  expect(safety.querySelector('.home-feature-icon svg')).not.toBeNull();
});

test('S05-TC-402 formatos del cliente: «S/ 50,00», «4 dic · 09:00» y «hace 12 días» en hora de Lima', () => {
  expect([soles(50), soles('1200.5'), soles(0)]).toEqual(['S/ 50,00', 'S/ 1 200,50', 'S/ 0,00']);
  const now = new Date('2026-11-22T15:00:00Z');
  expect(shortDate('2026-12-04T14:00:00Z', now)).toBe('4 dic');
  expect(shortDate('2025-12-04T14:00:00Z', now)).toBe('4 dic 2025');
  expect(shortDateTime('2026-12-04T14:00:00Z', now)).toBe('4 dic · 09:00');
  expect(['2026-11-22T14:59:40Z', '2026-11-22T14:48:00Z', '2026-11-22T12:00:00Z', '2026-11-21T10:00:00Z', '2026-11-10T14:00:00Z', '2026-08-01T15:00:00Z']
    .map(value => relativeTime(value, now))).toEqual(['hace un momento', 'hace 12 min', 'hace 3 h', 'ayer', 'hace 12 días', 'hace 3 meses']);
  expect(relativeTime(undefined, now)).toBe('');
});

test('S05-TC-403 dirección común: contenido centrado a 1200 px, encabezado con ícono y animaciones apagadas con «Reducir animaciones»', async () => {
  const polish = css('src/features/client/polish.css');
  expect(polish).toMatch(/\.panel-shell\[data-role="client"\] \.panel-content \{ margin-inline: auto; \}/);
  expect(css('src/features/panel/panel.css')).toMatch(/\.panel-content \{[^}]*max-width: 1200px/);
  expect(polish).toMatch(/@media \(prefers-reduced-motion: reduce\) \{[^@]*\.cx-rise, \.cx-card \{ animation: none; transition: none; \}/);
  expect(polish).toMatch(/html\[data-motion="reduce"\] :is\(\.cx-rise, \.cx-card\) \{ animation: none !important; \}/);
  expect(polish).toMatch(/\.cx-icon-button \{[^}]*width: 44px[^}]*height: 44px/);
  request.mockResolvedValue({data: {items: []}});
  render(<EquipmentPage navigate={() => {}}/>);
  const region = await screen.findByRole('region', {name: 'Mis equipos'});
  expect(region.querySelector('.cx-head .cx-head-icon svg')).not.toBeNull();
  expect(within(region).getByRole('button', {name: 'Agregar equipo'}).closest('.cx-head-actions')).not.toBeNull();
  expect(await within(region).findByText('Aún no registras equipos')).toBeInTheDocument();
  expect(region.querySelector('.cx-empty svg.cx-art')).not.toBeNull();
});
