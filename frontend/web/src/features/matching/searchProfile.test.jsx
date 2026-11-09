import React from 'react';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {afterEach, expect, test, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import TechnicianSearch from './TechnicianSearch';
import TechnicianProfile from './TechnicianProfile';
import TechnicianCard from './TechnicianCard';
import TechnicianPanel from '../administration/TechnicianPanel';
import {request} from '../administration/http';
// S05-TC-197 a 210 · Fase 3 del panel final (D-101, propuesta): Buscar técnicos moderno (encabezado, chips, orden,
// tarjetas, favoritos, skeleton y vacío) y perfil público con seis secciones, visor accesible y reseñas de ejemplo.
vi.mock('../administration/http', () => ({request: vi.fn(), serverNow: () => Date.now()}));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

const SPECIALTIES = [{id: 1, name: 'Cómputo'}, {id: 2, name: 'Refrigeración comercial'}, {id: 3, name: 'Electricidad'}];
const DISTRICTS = [{id: 1, name: 'Huancayo'}, {id: 2, name: 'El Tambo'}];
const card = (overrides = {}) => ({
  id: 7, display_name: 'Rosa Quispe', provider_type: 'person', experience_years: 9, verified: true, favorite: false,
  specialties: [{id: 2, name: 'Refrigeración comercial'}], rating: {average: null, count: 0}, sample_rating: null,
  services: [{subcategory_id: 9, subcategory_name: 'Vitrinas', reference_fee: '120.00', currency: 'PEN'},
    {subcategory_id: 10, subcategory_name: 'Mantenimiento preventivo', reference_fee: '90.00', currency: 'PEN'}],
  districts: [{id: 1, name: 'Huancayo'}, {id: 2, name: 'El Tambo'}],
  distance: {km: 3.5, same_district: false, approximate: true, label: 'aproximada por zona'}, ...overrides,
});
const page = (items) => ({items, pagination: {page: 1, per_page: 12, total: items.length, last_page: 1}});
const searchPaths = () => request.mock.calls.map(([path]) => path).filter(path => path.startsWith('/technicians?'));

function mockSearch(items = [card()], extra = {}) {
  request.mockImplementation(async (path, body, method) => {
    if (extra[path + ' ' + (method || 'GET')]) return extra[path + ' ' + (method || 'GET')]();
    if (path === '/catalog/specialties') return {data: SPECIALTIES};
    if (path === '/catalog/districts') return {data: DISTRICTS};
    if (path.startsWith('/catalog/subcategories')) return {data: [{id: 9, name: 'Vitrinas'}]};
    if (path.startsWith('/technicians?')) return {data: page(items)};
    return {data: []};
  });
}

const profile = (overrides = {}) => ({
  id: 7, display_name: 'Rosa Quispe', provider_type: 'person', experience_years: 9, verified: true, favorite: false,
  bio: 'Técnica en refrigeración comercial con nueve años.', work_style: 'Diagnóstico antes de cotizar.',
  warranty_text: 'Garantía de 30 días en la mano de obra.',
  specialties: [{id: 2, name: 'Refrigeración comercial'}], districts: [{id: 2, name: 'El Tambo'}, {id: 1, name: 'Huancayo'}],
  services: [{subcategory_id: 9, subcategory_name: 'Vitrinas', reference_fee: '120.00', currency: 'PEN', includes: 'Limpieza del condensador.'},
    {subcategory_id: 10, subcategory_name: 'Mantenimiento preventivo', reference_fee: '90.00', currency: 'PEN', includes: null}],
  availability: {available_today: true, week: [
    {weekday: 1, day: 'Lunes', bands: ['morning', 'afternoon']}, {weekday: 2, day: 'Martes', bands: ['afternoon', 'night']},
    {weekday: 3, day: 'Miércoles', bands: []}, {weekday: 4, day: 'Jueves', bands: []}, {weekday: 5, day: 'Viernes', bands: []},
    {weekday: 6, day: 'Sábado', bands: ['morning']}, {weekday: 7, day: 'Domingo', bands: []}]},
  portfolio: [
    {id: 1, title: 'Vitrina recuperada', description: 'Quedó en 4 °C.', performed_on: '2026-10-08', images: [
      {media_id: 11, position: 0, caption: null, stage: 'before', url: '/m/11'}, {media_id: 12, position: 1, caption: 'Vitrina enfriando', stage: 'after', url: '/m/12'}]},
    {id: 2, title: 'Cámara de carnes', description: 'Burletes nuevos.', performed_on: '2026-09-20', images: []},
  ],
  rating: {average: null, count: 0},
  sample_rating: {average: 4.6, count: 5, distribution: {5: 3, 4: 2, 3: 0, 2: 0, 1: 0}},
  reviews: [{id: 1, rating: 5, comment: 'Llegó a la hora.', author_label: 'Bodega en El Tambo', reviewed_on: '2026-10-15', sample: true}],
  ...overrides,
});
function mockProfile(data = profile()) {
  request.mockImplementation(async (path) => (path === '/technicians/7' ? {data} : {data: []}));
}

test('S05-TC-197 el encabezado trae «¿Qué se malogró?» y las 3 especialidades como tarjetas que filtran y se desmarcan', async () => {
  mockSearch();
  render(<TechnicianSearch defaultDistrictId={1}/>);

  expect(screen.getByRole('combobox', {name: '¿Qué se malogró?'})).toBeInTheDocument();
  const group = await screen.findByRole('group', {name: 'Especialidades'});
  const cards = await within(group).findAllByRole('button');
  expect(cards.map(button => button.textContent)).toEqual(['Cómputo', 'Refrigeración comercial', 'Electricidad']);
  expect(cards[1]).toHaveAttribute('aria-pressed', 'false');
  expect(cards[1]).toHaveAttribute('type', 'button');

  fireEvent.click(cards[1]);
  await waitFor(() => expect(searchPaths()).toContain('/technicians?specialty_id=2&sort=proximity&page=1'));
  expect(cards[1]).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(cards[1]);
  await waitFor(() => expect(cards[1]).toHaveAttribute('aria-pressed', 'false'));
  expect(searchPaths().at(-1)).toBe('/technicians?sort=proximity&page=1');
});

test('S05-TC-198 la barra de chips filtra por zona, tarifa, calificación y «Disponible hoy»', async () => {
  mockSearch();
  render(<TechnicianSearch defaultDistrictId={1}/>);
  const bar = await screen.findByRole('group', {name: 'Filtros'});
  await within(bar).findByRole('option', {name: 'El Tambo'});

  fireEvent.change(within(bar).getByLabelText('Zona'), {target: {value: '2'}});
  fireEvent.change(within(bar).getByLabelText('Tarifa máxima'), {target: {value: '100'}});
  fireEvent.change(within(bar).getByLabelText('Calificación mínima'), {target: {value: '4'}});
  const today = within(bar).getByRole('button', {name: 'Disponible hoy'});
  expect(today).toHaveAttribute('aria-pressed', 'false');
  fireEvent.click(today);

  await waitFor(() => expect(searchPaths().at(-1)).toBe('/technicians?district_id=2&max_fee=100&min_rating=4&available_today=1&sort=proximity&page=1'));
  expect(today).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(today);
  await waitFor(() => expect(searchPaths().at(-1)).not.toContain('available_today'));
});

test('S05-TC-199 el orden es por cercanía por defecto, o por precio o experiencia, con el aviso honesto de cada uno', async () => {
  mockSearch();
  const {unmount} = render(<TechnicianSearch defaultDistrictId={1}/>);
  const sort = await screen.findByLabelText('Ordenar por');
  expect([...sort.options].map(option => option.textContent)).toEqual(['Cercanía', 'Precio', 'Experiencia']);
  expect(screen.getByText('Ordenados por cercanía a tu distrito; no es una recomendación.')).toBeInTheDocument();

  fireEvent.change(sort, {target: {value: 'price'}});
  await waitFor(() => expect(searchPaths().at(-1)).toBe('/technicians?sort=price&page=1'));
  expect(screen.getByText('Ordenados por precio referencial, de menor a mayor; no es una recomendación.')).toBeInTheDocument();
  fireEvent.change(sort, {target: {value: 'experience'}});
  await waitFor(() => expect(searchPaths().at(-1)).toBe('/technicians?sort=experience&page=1'));
  expect(screen.getByText('Ordenados por años de experiencia; no es una recomendación.')).toBeInTheDocument();
  unmount();

  // Sin distrito no hay cercanía: el orden empieza por nombre.
  request.mockClear();
  render(<TechnicianSearch/>);
  const plain = await screen.findByLabelText('Ordenar por');
  expect([...plain.options].map(option => option.textContent)).toEqual(['Nombre', 'Precio', 'Experiencia']);
  await waitFor(() => expect(searchPaths().at(-1)).toBe('/technicians?page=1'));
});

test('S05-TC-200 la tarjeta trae portada por especialidad, verificado, «Nuevo», experiencia, «Desde S/», distritos y distancia', () => {
  const {container, rerender} = render(<TechnicianCard technician={card()}/>);
  const article = screen.getByRole('article', {name: 'Rosa Quispe'});

  expect(container.querySelector('.tech-cover')).toHaveAttribute('data-specialty', 'refrigeracion');
  expect(within(article).getByText('Verificado')).toBeInTheDocument();
  expect(within(article).getByText('Nuevo')).toBeInTheDocument();
  expect(within(article).getByText('9 años de experiencia')).toBeInTheDocument();
  expect(within(article).getByText('Desde S/ 90.00')).toBeInTheDocument();
  expect(within(article).getByText('Atiende en Huancayo, El Tambo')).toBeInTheDocument();
  expect(within(article).getByText('A 3,5 km · aproximada por zona')).toBeInTheDocument();

  rerender(<TechnicianCard technician={card({distance: {km: 1, same_district: true}, sample_rating: {average: 4.7, count: 3}})}/>);
  expect(screen.getByText('En tu distrito')).toBeInTheDocument();
  expect(screen.queryByText('Nuevo')).not.toBeInTheDocument();
  expect(screen.getByLabelText('4,7 de 5 en 3 reseñas de ejemplo')).toHaveTextContent('4,7');
  expect(screen.getByText('Ejemplo')).toBeInTheDocument();

  rerender(<TechnicianCard technician={card({rating: {average: 4.2, count: 8}, sample_rating: {average: 5, count: 5}})}/>);
  expect(screen.getByLabelText('4,2 de 5 en 8 calificaciones')).toBeInTheDocument();
  expect(screen.queryByText('Ejemplo')).not.toBeInTheDocument();
});

test('S05-TC-201 el corazón guarda y quita favoritos con su alerta, y si falla vuelve atrás con un error en español', async () => {
  let fail = false;
  mockSearch([card()], {
    '/client/favorites/7 PUT': async () => ({data: {technician_id: 7, favorite: true}}),
    '/client/favorites/7 DELETE': async () => { if (fail) throw new Error('No pudimos quitar el favorito. Inténtalo de nuevo.'); return null; },
  });
  render(<TechnicianSearch defaultDistrictId={1}/>);
  const heart = await screen.findByRole('button', {name: 'Guardar a Rosa Quispe en favoritos'});
  expect(heart).toHaveAttribute('aria-pressed', 'false');

  fireEvent.click(heart);
  expect(await screen.findByText('Guardaste a Rosa Quispe en tus favoritos.')).toBeInTheDocument();
  expect(request).toHaveBeenCalledWith('/client/favorites/7', null, 'PUT');
  const saved = screen.getByRole('button', {name: 'Quitar a Rosa Quispe de favoritos'});
  expect(saved).toHaveAttribute('aria-pressed', 'true');

  fail = true;
  fireEvent.click(saved);
  expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos quitar el favorito. Inténtalo de nuevo.');
  expect(request).toHaveBeenCalledWith('/client/favorites/7', null, 'DELETE');
  expect(screen.getByRole('button', {name: 'Quitar a Rosa Quispe de favoritos'})).toHaveAttribute('aria-pressed', 'true');
});

test('S05-TC-202 muestra un skeleton al cargar y un estado vacío con sugerencias que quitan los filtros', async () => {
  let resolve;
  request.mockImplementation(async (path) => {
    if (path.startsWith('/technicians?')) return new Promise(done => { resolve = done; });
    return {data: path === '/catalog/specialties' ? SPECIALTIES : DISTRICTS};
  });
  const onNewRequest = vi.fn();
  const {container} = render(<TechnicianSearch defaultDistrictId={1} initialFilters={{max_fee: '50'}} onNewRequest={onNewRequest}/>);

  await waitFor(() => expect(container.querySelectorAll('.search-skeleton')).toHaveLength(3));
  expect(screen.getByRole('region', {name: 'Buscar técnicos'})).toHaveAttribute('aria-busy', 'true');
  resolve({data: page([])});

  const empty = (await screen.findByText('No hay técnicos que coincidan con los filtros elegidos.')).closest('.search-empty');
  expect(empty).toHaveAttribute('role', 'status');
  expect(empty).toHaveTextContent('No hay técnicos que coincidan con los filtros elegidos.');
  expect(container.querySelectorAll('.search-skeleton')).toHaveLength(0);
  request.mockImplementation(async (path) => (path.startsWith('/technicians?') ? {data: page([card()])} : {data: []}));
  fireEvent.click(within(empty).getByRole('button', {name: 'Quitar filtros'}));
  await waitFor(() => expect(searchPaths().at(-1)).toBe('/technicians?sort=proximity&page=1'));
  await screen.findByRole('article', {name: 'Rosa Quispe'});
});

test('S05-TC-203 el perfil trae portada, verificado, experiencia, zonas, calificación, «Solicitar servicio» fijo y seis secciones', async () => {
  mockProfile();
  const onRequest = vi.fn();
  const {container} = render(<TechnicianProfile id={7} onRequest={onRequest} onBack={() => {}}/>);
  const head = await screen.findByRole('region', {name: 'Rosa Quispe'});

  expect(container.querySelector('.profile-cover')).toHaveAttribute('data-specialty', 'refrigeracion');
  expect(within(head).getByText('Verificado')).toBeInTheDocument();
  expect(within(head).getByText('9 años de experiencia')).toBeInTheDocument();
  expect(within(head).getByText('El Tambo, Huancayo').closest('p')).toHaveTextContent('Atiende en El Tambo, Huancayo');
  expect(within(head).getByLabelText('4,6 de 5 en 5 reseñas de ejemplo')).toBeInTheDocument();
  expect(within(head).getByText('Disponible hoy')).toBeInTheDocument();
  const cta = screen.getByRole('button', {name: 'Solicitar servicio'});
  expect(cta.closest('.profile-cta-bar')).not.toBeNull();
  fireEvent.click(cta);
  expect(onRequest).toHaveBeenCalledWith(expect.objectContaining({id: 7}));
  expect(screen.getAllByRole('heading', {level: 3}).map(heading => heading.textContent))
    .toEqual(['Sobre mí', 'Servicios', 'Disponibilidad', 'Portafolio', 'Calificaciones', 'Confianza']);
});

test('S05-TC-204 «Sobre mí» muestra forma de trabajo y garantía solo si se declaran, y cada servicio su «qué incluye»', async () => {
  mockProfile();
  const {unmount} = render(<TechnicianProfile id={7} onBack={() => {}}/>);
  const about = await screen.findByRole('region', {name: 'Sobre mí'});
  expect(within(about).getByText('Técnica en refrigeración comercial con nueve años.')).toBeInTheDocument();
  expect(within(about).getByText('Diagnóstico antes de cotizar.')).toBeInTheDocument();
  expect(within(about).getByText('Garantía de 30 días en la mano de obra.')).toBeInTheDocument();
  const services = screen.getByRole('region', {name: 'Servicios'});
  const items = within(services).getAllByRole('listitem');
  expect(items[0]).toHaveTextContent('Vitrinas');
  expect(items[0]).toHaveTextContent('Referencial S/ 120.00');
  expect(items[0]).toHaveTextContent('Qué incluye: Limpieza del condensador.');
  expect(items[1]).not.toHaveTextContent('Qué incluye');
  unmount();

  mockProfile(profile({bio: null, work_style: null, warranty_text: null}));
  render(<TechnicianProfile id={7} onBack={() => {}}/>);
  const bare = await screen.findByRole('region', {name: 'Sobre mí'});
  expect(bare).toHaveTextContent('Este técnico aún no agregó una descripción.');
  expect(within(bare).queryByText('Forma de trabajo')).not.toBeInTheDocument();
  expect(within(bare).queryByText('Garantía')).not.toBeInTheDocument();
});

test('S05-TC-205 la disponibilidad es una tabla de la semana con Mañana 08–12, Tarde 12–18 y Noche 18–21, más los distritos', async () => {
  mockProfile();
  render(<TechnicianProfile id={7} onBack={() => {}}/>);
  const table = await screen.findByRole('table', {name: 'Disponibilidad semanal'});

  expect(within(table).getAllByRole('columnheader').map(cell => cell.textContent)).toEqual(['Día', 'Mañana 08–12', 'Tarde 12–18', 'Noche 18–21']);
  const monday = within(table).getByRole('row', {name: /Lunes/});
  expect(within(monday).getAllByRole('cell').map(cell => cell.textContent)).toEqual(['Disponible', 'Disponible', 'No disponible']);
  const tuesday = within(table).getByRole('row', {name: /Martes/});
  expect(within(tuesday).getAllByRole('cell').map(cell => cell.textContent)).toEqual(['No disponible', 'Disponible', 'Disponible']);
  expect(within(table).getAllByRole('row')).toHaveLength(8);
  expect(screen.getByRole('region', {name: 'Disponibilidad'})).toHaveTextContent('Atiende en El Tambo, Huancayo');
});

test('S05-TC-206 el visor del portafolio abre con clic, navega con flechas, cierra con Esc y devuelve el foco', async () => {
  mockProfile();
  render(<TechnicianProfile id={7} onBack={() => {}}/>);
  const gallery = await screen.findByRole('region', {name: 'Portafolio'});
  const open = within(gallery).getByRole('button', {name: 'Ver el trabajo «Vitrina recuperada»'});
  expect(within(gallery).getByText('Antes')).toBeInTheDocument();
  expect(within(gallery).getByText('Después')).toBeInTheDocument();
  expect(within(gallery).getByRole('img', {name: 'Ilustración del trabajo «Cámara de carnes»'})).toBeInTheDocument();

  fireEvent.click(open);
  const viewer = screen.getByRole('dialog', {name: 'Vitrina recuperada'});
  expect(within(viewer).getByRole('img', {name: 'Antes: Vitrina recuperada'})).toHaveAttribute('src', '/m/11');
  expect(within(viewer).getByRole('img', {name: 'Vitrina enfriando'})).toHaveAttribute('src', '/m/12');
  expect(within(viewer).getByText('Trabajo 1 de 2')).toBeInTheDocument();
  expect(within(viewer).getByRole('button', {name: 'Cerrar visor'})).toHaveFocus();

  fireEvent.keyDown(viewer, {key: 'ArrowRight'});
  expect(screen.getByRole('dialog', {name: 'Cámara de carnes'})).toHaveTextContent('Trabajo 2 de 2');
  fireEvent.keyDown(screen.getByRole('dialog'), {key: 'ArrowLeft'});
  expect(screen.getByRole('dialog', {name: 'Vitrina recuperada'})).toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole('dialog'), {key: 'Escape'});
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(open).toHaveFocus();
});

test('S05-TC-207 las calificaciones muestran promedio, barras de 5★ a 1★ y reseñas rotuladas como datos de demostración', async () => {
  mockProfile();
  const {unmount} = render(<TechnicianProfile id={7} onBack={() => {}}/>);
  const ratings = await screen.findByRole('region', {name: 'Calificaciones'});

  expect(within(ratings).getByText('4,6')).toBeInTheDocument();
  expect(within(ratings).getAllByText('Ejemplo · datos de demostración').length).toBeGreaterThanOrEqual(2);
  expect(within(ratings).getAllByRole('img', {name: /estrellas?: \d+ reseñas?/}).map(bar => bar.getAttribute('aria-label')))
    .toEqual(['5 estrellas: 3 reseñas', '4 estrellas: 2 reseñas', '3 estrellas: 0 reseñas', '2 estrellas: 0 reseñas', '1 estrella: 0 reseñas']);
  const review = within(ratings).getByRole('listitem');
  expect(review).toHaveTextContent('Bodega en El Tambo');
  expect(review).toHaveTextContent('Llegó a la hora.');
  expect(within(review).getByLabelText('5 de 5')).toBeInTheDocument();
  unmount();

  mockProfile(profile({sample_rating: null, reviews: []}));
  render(<TechnicianProfile id={7} onBack={() => {}}/>);
  expect(await screen.findByRole('region', {name: 'Calificaciones'})).toHaveTextContent('Este técnico aún no tiene reseñas');
});

test('S05-TC-208 «Confianza» dice que el administrador verificó la identidad, sin documentos ni datos de contacto', async () => {
  mockProfile(profile({phone: '987654321', email: 'rosa@example.test', documents: [{url: '/doc'}]}));
  const {container, unmount} = render(<TechnicianProfile id={7} onBack={() => {}}/>);
  const trust = await screen.findByRole('region', {name: 'Confianza'});

  expect(trust).toHaveTextContent('Identidad verificada por el administrador');
  expect(trust).toHaveTextContent('TécnicoYa no muestra documentos, teléfono, correo ni dirección del técnico.');
  expect(container.textContent).not.toContain('987654321');
  expect(container.textContent).not.toContain('rosa@example.test');
  expect(container.querySelector('a[href="/doc"]')).toBeNull();
  unmount();

  mockProfile(profile({verified: false}));
  render(<TechnicianProfile id={7} onBack={() => {}}/>);
  expect(await screen.findByRole('region', {name: 'Confianza'})).toHaveTextContent('Verificación pendiente');
});

test('S05-TC-209 el técnico edita forma de trabajo, garantía y «qué incluye» con límites validados en el cliente', async () => {
  const own = {id: 7, version: 3, bio: 'Bio', work_style: 'Antes', warranty_text: null, experience_years: 9, base_district_id: 1,
    status: 'active', verification_status: 'approved', services: [{subcategory_id: 9, subcategory_name: 'Vitrinas', reference_fee: '120.00',
      includes: 'Limpieza.', rate_version: 1, active: true}], declared_subcategories: [], documents: [], portfolio: [],
    availability: {slots: [], district_ids: [], pause: null}};
  request.mockImplementation(async (path) => {
    if (path === '/technicians/me/profile') return {data: own};
    if (path === '/catalog/districts') return {data: DISTRICTS};
    return {data: []};
  });
  render(<TechnicianPanel/>);
  const style = await screen.findByLabelText('Forma de trabajo');
  expect(style).toHaveValue('Antes');
  fireEvent.change(style, {target: {value: 'a'.repeat(501)}});
  fireEvent.change(screen.getByLabelText('Garantía'), {target: {value: 'b'.repeat(301)}});
  fireEvent.click(screen.getAllByRole('button', {name: 'Guardar'})[0]);
  expect((await screen.findAllByText('La forma de trabajo admite hasta 500 caracteres.'))[0]).toBeInTheDocument();
  expect(screen.getAllByText('La garantía admite hasta 300 caracteres.')[0]).toBeInTheDocument();
  expect(request).not.toHaveBeenCalledWith('/technicians/me/profile', expect.anything(), 'PATCH');

  fireEvent.change(style, {target: {value: 'Diagnóstico primero.'}});
  fireEvent.change(screen.getByLabelText('Garantía'), {target: {value: '30 días.'}});
  fireEvent.click(screen.getAllByRole('button', {name: 'Guardar'})[0]);
  await waitFor(() => expect(request).toHaveBeenCalledWith('/technicians/me/profile',
    expect.objectContaining({work_style: 'Diagnóstico primero.', warranty_text: '30 días.', expected_version: 3}), 'PATCH'));

  fireEvent.click(screen.getByRole('button', {name: 'Servicios y tarifas'}));
  const includes = await screen.findByLabelText('Qué incluye Vitrinas');
  expect(includes).toHaveValue('Limpieza.');
  fireEvent.change(includes, {target: {value: 'c'.repeat(301)}});
  const services = includes.closest('form');
  fireEvent.click(within(services).getByRole('button', {name: 'Guardar'}));
  expect(await within(services).findByText('«Qué incluye» admite hasta 300 caracteres.')).toBeInTheDocument();
  fireEvent.change(includes, {target: {value: 'Limpieza y prueba de fugas.'}});
  fireEvent.click(within(services).getByRole('button', {name: 'Guardar'}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/technicians/me/services', {expected_version: 3,
    services: [{subcategory_id: 9, reference_fee: '120.00', includes: 'Limpieza y prueba de fugas.'}]}, 'PUT'));
});

test('S05-TC-210 diseño: chips de 44 px, barra de filtros fija, «Solicitar servicio» abajo en el celular y foco visible', () => {
  const css = readFileSync(resolve('src/features/matching/search.css'), 'utf8');

  expect(css).toMatch(/\.search-filters \{[^}]*position: sticky/);
  expect(css).toMatch(/\.search-chip[^{]*\{[^}]*min-height: 44px/);
  expect(css).toMatch(/\.search-specialty \{[^}]*min-height: 96px/);
  expect(css).toMatch(/\.tech-favorite \{[^}]*min-width: 44px[^}]*min-height: 44px/);
  expect(css).toMatch(/@media \(max-width: 720px\) \{[^@]*\.profile-cta-bar \{[^}]*position: fixed[^}]*bottom: 0/);
  expect(css).toMatch(/\.profile-cta-bar \{[^}]*position: sticky/);
  expect(css).toMatch(/:focus-visible \{[^}]*outline: 3px solid/);
  expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
  expect(css).not.toMatch(/#[0-9a-f]{3,6}\b/i);
});

test('S05-TC-215 defectos vistos en las capturas: chips en una fila, nombre bajo la portada, portada a lo ancho y corazón visible en el celular', async () => {
  const css = readFileSync(resolve('src/features/matching/search.css'), 'utf8');
  // styles.css pone las etiquetas en columna con margen y los select a todo el ancho: el chip lo deshace.
  expect(css).toMatch(/\.search-filters \.search-chip \{[^}]*flex-direction: row[^}]*margin: 0/);
  expect(css).toMatch(/\.search-filters \.search-chip select \{[^}]*width: auto/);
  expect(css).toMatch(/\.search-filters \.search-toggle \{[^}]*padding: 0 16px/);
  // El nombre y las insignias empiezan debajo de la portada; solo el avatar se monta sobre ella.
  expect(css).toMatch(/\.tech-card-title \{[^}]*padding-top: 34px/);
  expect(css).toMatch(/:is\(\.tech-badges, \.client-chips-inline\) \.client-chip \{[^}]*display: inline-flex[^}]*white-space: nowrap/);
  // .client-profile-head es una grilla de tres columnas: el perfil moderno la anula para que la portada vaya a lo ancho.
  expect(css).toMatch(/\.client-profile-head\.tech-profile-head \{[^}]*display: block/);
  expect(css).toMatch(/\.tech-profile-identity \.client-profile-title \{[^}]*padding-top: 44px/);
  expect(css).toMatch(/\.profile-cta-bar \{[^}]*flex-wrap: nowrap/);
  expect(css).toMatch(/\.profile-cta-bar \.tech-favorite \{[^}]*flex: 0 0 48px/);
  expect(css).toMatch(/\.client-block h4 \{[^}]*margin: 12px 0 4px/);

  mockProfile();
  const {container} = render(<TechnicianProfile id={7} onBack={() => {}}/>);
  await screen.findByRole('region', {name: 'Portafolio'});
  expect(container.querySelector('.tech-illustration')).toHaveAttribute('preserveAspectRatio', 'xMidYMid slice');
});

test('S05-TC-216 segunda ronda de capturas: los chips le ganan a la grilla de etiquetas del panel y el botón fijo antiguo no saca al corazón de la barra', () => {
  const css = readFileSync(resolve('src/features/matching/search.css'), 'utf8');
  const panel = readFileSync(resolve('src/features/panel/panel.css'), 'utf8');
  const client = readFileSync(resolve('src/features/client/client.css'), 'utf8');
  // panel.css pone .panel-content label:not(.button) en grilla y los select con 46 px de alto mínimo.
  expect(panel).toMatch(/\.panel-content label:not\(\.button\) \{[^}]*display: grid/);
  expect(css).toMatch(/\.panel-content \.search-filters label\.search-chip \{[^}]*display: inline-flex[^}]*flex-direction: row/);
  expect(css).toMatch(/\.panel-content \.search-filters \.search-chip select \{[^}]*min-height: 36px/);
  // client.css fija el botón «Solicitar servicio» por su cuenta en el celular; dentro de la barra vuelve a su lugar.
  expect(client).toMatch(/\.panel-shell \.client-profile-cta \{[^}]*position: fixed/);
  expect(css).toMatch(/\.panel-shell \.profile-cta-bar \.client-profile-cta \{[^}]*position: static[^}]*box-shadow: none/);
});
