import React from 'react';
import {afterEach, expect, test, vi} from 'vitest';
import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import ClientHome from './ClientHome';
import RequestWizard from '../requests/RequestWizard';
import TechnicianSearch from '../matching/TechnicianSearch';
import {PROBLEMS, TIPS} from './homeContent';
import {request} from '../administration/http';
// Inicio del cliente aprobado en la revisión del PR #39 (D-87, D-93). Reemplaza al Inicio de la Parte A: S05-TC-027,
// 028, 029, 034 y 046 se reescribieron con su ID sobre las secciones nuevas; S05-TC-055 a 060 son nuevas.
vi.mock('../administration/http', () => ({request: vi.fn(), serverNow: () => Date.now()}));
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.useRealTimers(); });

const user = (extra = {}) => ({id: '5', name: 'Alias', given_names: 'Carla María', phone: '987654321', avatar_url: null,
  role: {code: 'client'}, client_profile: {district_id: 1, reference_address: 'Jr. Sintético 100'}, ...extra});
const home = {district: {id: 1, name: 'Huancayo'}, technicians_in_zone: 7,
  prices: [{specialty_id: 1, name: 'Cómputo', from_fee: '60.00', currency: 'PEN'}, {specialty_id: 2, name: 'Refrigeración comercial', from_fee: '120.00', currency: 'PEN'}],
  subcategories: [{id: 4, specialty_id: 1, code: 'computo-hardware', name: 'Reparación de hardware'},
    {id: 5, specialty_id: 1, code: 'computo-redes', name: 'Redes e infraestructura'},
    {id: 9, specialty_id: 2, code: 'frio-vitrinas', name: 'Refrigeración comercial (vitrinas)'}]};
const row = (id, phase, status = 'sent') => ({id, status, phase, subcategory: {id: 4, name: 'Reparación de hardware'}, district: {name: 'Huancayo'},
  updated_at: '2026-10-20T15:00:00Z'});
const technician = (id, name, distance) => ({id, display_name: name, experience_years: 3, rating: {average: null, count: 0},
  services: [{subcategory_id: 4, subcategory_name: 'Reparación de hardware', reference_fee: '60.00', currency: 'PEN'}],
  districts: [{id: 1, name: 'Huancayo'}], distance});
const near = [technician(1, 'Técnico Uno', {km: 1, same_district: true, approximate: true, label: 'aproximada por zona'}),
  technician(2, 'Técnico Dos', {km: 3.5, same_district: false, approximate: true, label: 'aproximada por zona'}),
  technician(3, 'Técnico Tres', null)];

function routes({rows = [], fail = {}} = {}) {
  request.mockImplementation(async path => {
    const key = Object.keys(fail).find(prefix => path.startsWith(prefix));
    if (key) throw {status: 0, message: fail[key]};
    if (path === '/client/home') return {data: home};
    if (path === '/requests') return {data: rows};
    if (path.startsWith('/technicians?')) return {data: {items: near, pagination: {page: 1, per_page: 3, total: 3, last_page: 1}}};
    if (path === '/announcements') return {data: []};
    if (path.startsWith('/catalog/suggestions')) return {data: {source: 'keywords', level: 'alta', items: [{subcategory_id: 4,
      subcategory_name: 'Reparación de hardware', specialty_id: 1, specialty_name: 'Cómputo', score: 9}]}};
    return {data: []};
  });
}
const renderHome = (props = {}) => { const navigate = vi.fn(); render(<ClientHome user={user()} navigate={navigate} {...props}/>); return navigate; };

test('S05-TC-046 la bienvenida saluda por nombres, muestra el distrito, los técnicos de la zona y el avance del perfil', async () => {
  routes();
  const navigate = renderHome({user: user({avatar_url: null, phone: null})});
  const welcome = await screen.findByRole('region', {name: 'Bienvenida'});

  expect(within(welcome).getByRole('heading', {name: 'Hola, Carla María'})).toBeInTheDocument();
  expect(await within(welcome).findByText('Huancayo')).toBeInTheDocument();
  expect(within(welcome).getByText('7 técnicos verificados en tu zona')).toBeInTheDocument();
  expect(within(welcome).getByText('Perfil completo 50 %')).toBeInTheDocument();
  fireEvent.click(within(welcome).getByRole('button', {name: 'Completar mi perfil'}));
  expect(navigate).toHaveBeenCalledWith('profile');
  fireEvent.click(within(welcome).getByRole('button', {name: 'Pedir un técnico'}));
  expect(navigate).toHaveBeenCalledWith('new');
  cleanup();

  routes();
  renderHome({user: user({avatar_url: '/media/9'})});
  await screen.findByText('7 técnicos verificados en tu zona');
  expect(screen.queryByText(/Perfil completo/)).toBeNull();
});

test('S05-TC-027 el Inicio no muestra contadores sueltos, «¿Qué necesitas hoy?», citas ni calificaciones', async () => {
  routes({rows: [row(41, 'awaiting_choice')]});
  renderHome();
  await screen.findByRole('region', {name: 'Tu pedido en curso'});

  expect(screen.queryByText('Solicitudes activas')).toBeNull();
  expect(screen.queryByText('¿Qué necesitas hoy?')).toBeNull();
  expect(screen.queryByRole('navigation', {name: 'Buscar por rubro'})).toBeNull();
  expect(screen.queryByText(/Próxima cita/)).toBeNull();
  expect(screen.queryByText(/Calificaciones/)).toBeNull();
  expect(screen.getAllByRole('region').map(region => region.getAttribute('aria-label'))).toEqual(['Bienvenida', '¿Qué se malogró?',
    'Tu pedido en curso', 'Precios de referencia', 'Técnicos cerca de ti', 'Consejo del mes', 'Tu seguridad']);
});

// D-94: el buscador reemplazó a la grilla de atajos; elegir una sugerencia abre el asistente con lo elegido.
test('S05-TC-029 elegir una sugerencia de «¿Qué se malogró?» abre Nueva solicitud con especialidad y subcategoría [D-94]', async () => {
  routes();
  const navigate = renderHome();
  const problems = await screen.findByRole('region', {name: '¿Qué se malogró?'});

  fireEvent.change(within(problems).getByRole('combobox', {name: '¿Qué se malogró?'}), {target: {value: 'mi laptop no prende'}});
  fireEvent.click(await within(problems).findByRole('option', {name: /Reparación de hardware/}));
  expect(navigate).toHaveBeenCalledWith('new', {preset: {specialty_id: 1, subcategory_id: 4}});
  cleanup();

  request.mockImplementation(async path => {
    if (path === '/catalog/specialties') return {data: [{id: 1, name: 'Cómputo'}]};
    if (path.startsWith('/catalog/subcategories')) return {data: [{id: 4, name: 'Reparación de hardware'}]};
    if (path === '/catalog/districts') return {data: [{id: 1, name: 'Huancayo'}]};
    return {data: []};
  });
  render(<RequestWizard preset={{specialty_id: 1, subcategory_id: 4}} defaultDistrictId={1}/>);
  expect(await screen.findByRole('heading', {name: 'Paso 3: Descripción y fotos'})).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: 'Atrás'}));
  expect(await screen.findByRole('radio', {name: 'Reparación de hardware'})).toBeChecked();
});

// D-94: los atajos ahora son chips debajo del buscador (sin íconos).
test('S05-TC-055 «¿Qué se malogró?» oculta los chips cuya subcategoría no existe o está inactiva', async () => {
  routes();
  renderHome();
  const problems = await screen.findByRole('region', {name: '¿Qué se malogró?'});
  const chips = await within(problems).findByRole('group', {name: 'Problemas frecuentes'});

  const visible = within(chips).getAllByRole('button').map(button => button.textContent);
  const expected = PROBLEMS.filter(problem => home.subcategories.some(sub => sub.code === problem.subcategory)).map(problem => problem.label);
  expect(PROBLEMS.length).toBeGreaterThanOrEqual(6);
  expect(PROBLEMS.length).toBeLessThanOrEqual(8);
  expect(visible).toEqual(expected);
  expect(visible).not.toContain('Corte de luz');
});

test('S05-TC-034 «Tu pedido en curso» muestra el más reciente con su paso, qué pasa ahora y su acción', async () => {
  routes({rows: [row(39, 'registered', 'registered'), row(41, 'awaiting_choice'), row(40, 'matching')]});
  const navigate = renderHome();
  const current = await screen.findByRole('region', {name: 'Tu pedido en curso'});

  await within(current).findByText('Reparación de hardware');
  const steps = within(current).getByRole('list', {name: 'Progreso de tu pedido'});
  expect(within(steps).getAllByRole('listitem').map(item => item.textContent)).toEqual(['Enviada', 'Buscando', 'Ofertas', 'Elige técnico', 'Asignada']);
  expect(within(steps).getByText('Elige técnico')).toHaveAttribute('aria-current', 'step');
  expect(current).toHaveTextContent('Uno o más técnicos aceptaron');
  fireEvent.click(within(current).getByRole('button', {name: 'Elegir técnico'}));
  expect(navigate).toHaveBeenCalledWith('requests', {open: 41});
  fireEvent.click(within(current).getByRole('button', {name: 'Ver todas (2)'}));
  expect(navigate).toHaveBeenCalledWith('requests');
});

test('S05-TC-056 sin pedidos activos, «Tu pedido en curso» explica cómo pedir el primer técnico en 3 pasos', async () => {
  routes({rows: [row(38, 'expired', 'expired')]});
  const navigate = renderHome();
  const current = await screen.findByRole('region', {name: 'Tu pedido en curso'});

  expect(await within(current).findByText('Pide tu primer técnico en 3 pasos')).toBeInTheDocument();
  expect(within(current).getAllByRole('listitem')).toHaveLength(3);
  fireEvent.click(within(current).getByRole('button', {name: 'Empezar mi pedido'}));
  expect(navigate).toHaveBeenCalledWith('new');
});

test('S05-TC-028 «Técnicos cerca de ti» muestra 3 por cercanía con distancia, tarifa y «Ver perfil»', async () => {
  routes();
  const navigate = renderHome();
  const nearby = await screen.findByRole('region', {name: 'Técnicos cerca de ti'});

  expect(await within(nearby).findAllByRole('article')).toHaveLength(3);
  expect(request).toHaveBeenCalledWith('/technicians?sort=proximity&per_page=3');
  expect(within(nearby).getByText('En tu distrito')).toBeInTheDocument();
  expect(within(nearby).getByText('A 3,5 km · aproximada por zona')).toBeInTheDocument();
  expect(within(nearby).getAllByText('Desde S/ 60.00')).toHaveLength(3);
  fireEvent.click(within(nearby).getByRole('button', {name: 'Ver perfil de Técnico Dos'}));
  expect(navigate).toHaveBeenCalledWith('search', {technician: near[1]});
  cleanup();

  request.mockResolvedValue({data: {id: 2, display_name: 'Técnico Dos', experience_years: 3, services: [], portfolio: [], reviews: []}});
  render(<TechnicianSearch initialTechnician={near[1]} defaultDistrictId={1}/>);
  expect(await screen.findByRole('region', {name: 'Perfil público'})).toBeInTheDocument();
  expect(request).toHaveBeenCalledWith('/technicians/2');
  await act(async () => {});
});

test('S05-TC-057 «Precios de referencia» lista el desde S/ X por especialidad con su nota', async () => {
  routes();
  renderHome();
  const prices = await screen.findByRole('region', {name: 'Precios de referencia'});

  expect(await within(prices).findByText('Cómputo')).toBeInTheDocument();
  expect(within(prices).getByText('desde S/ 60.00')).toBeInTheDocument();
  expect(within(prices).getByText('desde S/ 120.00')).toBeInTheDocument();
  expect(within(prices).getByText('Orientativos, no son un cobro.')).toBeInTheDocument();
});

test('S05-TC-058 «Consejo del mes» rota según el mes en Lima y «Tu seguridad» da los dos avisos', async () => {
  vi.useFakeTimers({toFake: ['Date']});
  vi.setSystemTime(new Date('2026-11-01T03:00:00Z')); // 31 de octubre, 22:00 en Lima
  routes();
  renderHome();

  const tip = await screen.findByRole('region', {name: 'Consejo del mes'});
  expect(TIPS).toHaveLength(12);
  expect(tip).toHaveTextContent(TIPS[9]);
  const safety = screen.getByRole('region', {name: 'Tu seguridad'});
  expect(safety).toHaveTextContent('Tu dirección solo la ve el técnico asignado');
  expect(safety).toHaveTextContent('No pagues por adelantado fuera de la app');
});

test('S05-TC-059 cada sección carga con su esqueleto y falla por su cuenta con «Reintentar»', async () => {
  routes({fail: {'/client/home': 'No hay conexión con el servidor.'}, rows: [row(41, 'matching')]});
  renderHome();

  const prices = screen.getByRole('region', {name: 'Precios de referencia'});
  expect(prices.querySelector('.client-skeleton')).not.toBeNull();
  expect(await within(prices).findByRole('alert')).toHaveTextContent('No pudimos cargar los precios de referencia.');
  expect(await within(screen.getByRole('region', {name: 'Tu pedido en curso'})).findByText('Reparación de hardware')).toBeInTheDocument();
  expect(await within(screen.getByRole('region', {name: 'Técnicos cerca de ti'})).findAllByRole('article')).toHaveLength(3);

  routes({rows: [row(41, 'matching')]});
  fireEvent.click(within(prices).getByRole('button', {name: 'Reintentar'}));
  expect(await within(prices).findByText('desde S/ 60.00')).toBeInTheDocument();
});

test('S05-TC-060 sin distrito principal la bienvenida invita a registrarlo y no pide técnicos cercanos', async () => {
  routes();
  request.mockImplementation(async path => {
    if (path === '/client/home') return {data: {...home, district: null, technicians_in_zone: null}};
    if (path === '/requests') return {data: []};
    return {data: []};
  });
  renderHome({user: user({client_profile: {district_id: null, reference_address: null}})});
  const welcome = await screen.findByRole('region', {name: 'Bienvenida'});

  expect(await within(welcome).findByText('Registra tu distrito principal para ver técnicos de tu zona.')).toBeInTheDocument();
  expect(within(screen.getByRole('region', {name: 'Técnicos cerca de ti'})).getByText(/Registra tu distrito principal en Mi perfil/)).toBeInTheDocument();
  await waitFor(() => expect(request).toHaveBeenCalledWith('/client/home'));
  expect(request.mock.calls.some(([path]) => path.startsWith('/technicians?'))).toBe(false);
});
