import React from 'react';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import ProfessionalProfile from './ProfessionalProfile';
import ServicesPage from './ServicesPage';
import PortfolioPage from './PortfolioPage';
import VerificationPage from './VerificationPage';
import StatsPage, {duration, segments, statsSummary} from './StatsPage';
import {request, uploadWithProgress} from '../administration/http';
// S05-TC-340 a 349 · Panel del técnico, Fase T4 (modo rápido): Perfil profesional con vista previa en vivo, Servicios y
// tarifas, Portafolio (antes y después, texto alternativo, orden y retiro), Verificación (estados de cada documento,
// lista de tipos y subida con progreso) y Estadísticas (gráficos con su resumen en texto).
vi.mock('../administration/http', () => ({request: vi.fn(), uploadWithProgress: vi.fn(), serverNow: () => Date.now()}));

const districts = [{id: 1, name: 'Huancayo'}, {id: 2, name: 'El Tambo'}];
const specialties = [{id: 1, name: 'Cómputo'}, {id: 2, name: 'Refrigeración comercial'}, {id: 3, name: 'Electricidad'}];
const subcategories = {1: [{id: 11, specialty_id: 1, name: 'Reparación de hardware', description: 'Placas, discos y fuentes.', reference_fee: '70.00'},
  {id: 12, specialty_id: 1, name: 'Impresoras', description: null, reference_fee: '60.00'}],
  2: [{id: 21, specialty_id: 2, name: 'Vitrinas', description: 'Vitrinas exhibidoras de bodegas.', reference_fee: null}],
  3: [{id: 31, specialty_id: 3, name: 'Tableros eléctricos', description: 'Revisión y cambio de llaves.', reference_fee: '90.00'}]};
const image = (id, stage, caption = `Foto ${id}`) => ({media_id: id, url: `/api/v1/media/${id}`, stage, caption, position: 0});
let profile;
const own = () => ({
  id: 5, display_name: 'Rosa Quispe', version: 4, bio: 'Técnica en refrigeración.', work_style: '', warranty_text: '', experience_years: 6,
  base_district_id: 1, verification_status: 'approved',
  declared_subcategories: [{subcategory_id: 21, subcategory_name: 'Vitrinas', specialty_id: 2, specialty_name: 'Refrigeración comercial', has_rate: true}],
  services: [{subcategory_id: 11, subcategory_name: 'Reparación de hardware', reference_fee: '80.00', currency: 'PEN', includes: 'Diagnóstico y limpieza.', active: true}],
  portfolio: [
    {id: 1, title: 'Vitrina recuperada', description: 'Cambio de compresor.', status: 'published', version: 1, performed_on: '2026-10-01',
      images: [image(101, 'before'), image(102, 'after')]},
    {id: 2, title: 'Laptop sin pantalla', description: '', status: 'draft', version: 1, performed_on: null, images: [image(103, null)]},
  ],
});
const verification = (extra = {}) => ({
  state: 'observed', label: 'Observado', missing: [], in_queue: false, can_request_review: true, version: 9,
  last_review: {decision: 'reject', reason: 'El certificado no se lee.', reviewed_at: '2026-11-10T15:00:00.000Z'},
  required: [
    {key: 'identity', label: 'Documento de identidad', state: 'approved', state_label: 'Aprobado', note: null,
      document: {id: 1, document_type: 'Documento de identidad', file_name: 'dni.pdf', uploaded_at: '2026-11-01T15:00:00.000Z',
        review_status: 'approved', state: 'approved', state_label: 'Aprobado', note: null, url: '/api/v1/media/501'}},
    {key: 'certificate', label: 'Certificado o constancia técnica', state: 'observed', state_label: 'Observado', note: 'El certificado no se lee.',
      document: {id: 2, document_type: 'Certificado o constancia técnica', file_name: 'certificado.pdf', uploaded_at: '2026-11-02T15:00:00.000Z',
        review_status: 'rejected', state: 'observed', state_label: 'Observado', note: 'El certificado no se lee.', url: '/api/v1/media/502'}},
  ],
  others: [],
  types: [{value: 'Documento de identidad', required: true, hint: 'DNI'}, {value: 'Certificado o constancia técnica', required: true, hint: 'Título'},
    {value: 'Otro documento de respaldo', required: false, hint: 'Constancia'}],
  limits: {current: 1, max: 5, max_bytes: 5242880, accept: ['application/pdf']},
  ...extra,
});
const bucket = (key, label, values = {}) => ({key, label, start: key, accepted: 0, rejected: 0, expired: 0, completed: 0, acceptance_rate: null,
  avg_response_seconds: null, ...values});
const stats = period => (period === 'month'
  ? {period, buckets: [bucket('2026-10', 'oct 2026', {accepted: 4, expired: 1, acceptance_rate: 80, avg_response_seconds: 70, completed: 3}),
    bucket('2026-11', 'nov 2026', {accepted: 2, acceptance_rate: 100, avg_response_seconds: 50, completed: 1})],
  totals: {accepted: 6, rejected: 0, expired: 1, completed: 4, acceptance_rate: 86, avg_response_seconds: 63}}
  : {period, buckets: [bucket('2026-11-02', '2 nov', {accepted: 1, rejected: 1, acceptance_rate: 50, avg_response_seconds: 90}),
    bucket('2026-11-09', '9 nov', {accepted: 3, expired: 1, acceptance_rate: 75, avg_response_seconds: 65, completed: 2})],
  totals: {accepted: 4, rejected: 1, expired: 1, completed: 2, acceptance_rate: 67, avg_response_seconds: 70}});

let handlers;
function routes(extra = {}) {
  handlers = extra;
  request.mockImplementation(async (path, body, method = body ? 'POST' : 'GET') => {
    const key = `${method} ${path.split('?')[0]}`;
    if (handlers[key]) return handlers[key](body, path);
    if (path === '/technicians/me/profile') return {data: profile};
    if (path === '/catalog/districts') return {data: districts};
    if (path === '/catalog/specialties') return {data: specialties};
    if (path.startsWith('/catalog/subcategories')) return {data: subcategories[path.split('=')[1]] || []};
    if (path === '/technicians/me/verification') return {data: verification()};
    if (path.startsWith('/technicians/me/stats')) return {data: stats(new URLSearchParams(path.split('?')[1]).get('period'))};
    return {data: {}};
  });
}
const type = (label, value) => fireEvent.change(screen.getByLabelText(label), {target: {value}});
const file = (name, kind, size = 2048) => Object.defineProperty(new File(['x'], name, {type: kind}), 'size', {value: size});
beforeEach(() => {
  profile = own();
  vi.stubGlobal('matchMedia', () => ({matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()}));
  document.documentElement.dataset.motion = 'reduce';
});
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); delete document.documentElement.dataset.motion; });

test('S05-TC-340 Perfil profesional: una tarjeta por sección, contador de caracteres y vista previa en vivo sin llamar al perfil público', async () => {
  routes();
  render(<ProfessionalProfile user={{name: 'Rosa Quispe'}}/>);
  await screen.findByRole('heading', {name: 'Sobre mí', level: 3});
  expect(screen.getAllByRole('heading', {level: 3}).map(heading => heading.textContent)).toEqual(['Sobre mí', 'Forma de trabajo', 'Garantía', 'Experiencia']);
  const bio = screen.getByLabelText(/Cuéntales quién eres/);
  expect(bio).toHaveAccessibleDescription(/25 de 2000 caracteres · mínimo 40/);
  type(/Cuéntales quién eres/, 'Reparo vitrinas y cámaras de frío en bodegas de El Tambo.');
  type(/Qué garantía ofreces/, 'Treinta días en mano de obra.');
  const preview = screen.getByRole('complementary', {name: /Vista previa/});
  expect(within(preview).getByText('Reparo vitrinas y cámaras de frío en bodegas de El Tambo.')).toBeInTheDocument();
  expect(within(preview).getByRole('heading', {name: 'Garantía'})).toBeInTheDocument();
  expect(within(preview).getByText('Verificado')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: /Sumar un año/}));
  expect(within(preview).getByText('7 años de experiencia')).toBeInTheDocument();
  type(/Cómo atiendes/, 'x'.repeat(460));
  expect(screen.getByLabelText(/Cómo atiendes/)).toHaveAccessibleDescription(/460 de 500 caracteres/);
  expect(document.querySelector('.tech-counter[data-state="near"]')).not.toBeNull();
  expect(request.mock.calls.some(([path]) => /^\/technicians\/\d+/.test(path))).toBe(false);
});

test('S05-TC-341 Perfil profesional valida en el cliente, guarda con PATCH y muestra alertas de éxito y de error', async () => {
  let fail = false;
  routes({'PATCH /technicians/me/profile': async () => { if (fail) throw Object.assign(new Error('x'), {status: 409}); return {data: profile}; }});
  const onSaved = vi.fn();
  render(<ProfessionalProfile user={{name: 'Rosa'}} onSaved={onSaved}/>);
  await screen.findByLabelText(/Qué garantía ofreces/);
  type(/Qué garantía ofreces/, 'g'.repeat(301));
  fireEvent.click(screen.getByRole('button', {name: 'Guardar perfil'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Revisa los campos marcados');
  expect(screen.getByText('La garantía admite hasta 300 caracteres.')).toBeInTheDocument();
  expect(request).not.toHaveBeenCalledWith('/technicians/me/profile', expect.anything(), 'PATCH');

  type(/Qué garantía ofreces/, ' Garantía de 30 días. ');
  fireEvent.click(screen.getByRole('button', {name: 'Guardar perfil'}));
  expect(await screen.findByRole('status')).toHaveTextContent('Guardamos tu perfil profesional.');
  expect(request).toHaveBeenCalledWith('/technicians/me/profile', expect.objectContaining({warranty_text: 'Garantía de 30 días.',
    experience_years: 6, base_district_id: 1, expected_version: 4, work_style: null}), 'PATCH');
  expect(onSaved).toHaveBeenCalled();
  fail = true;
  fireEvent.click(screen.getByRole('button', {name: 'Guardar perfil'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Tu perfil cambió en otra pestaña');
});

test('S05-TC-342 Servicios: tarjeta con ícono, tarifa grande con «S/», «Qué incluye», editar y quitar con confirmación', async () => {
  routes({'PUT /technicians/me/services': async () => ({data: {}})});
  render(<ServicesPage/>);
  const card = (await screen.findByRole('heading', {name: 'Reparación de hardware', level: 3})).closest('li');
  expect(card.querySelector('.tech-card-icon .panel-svg-icon')).not.toBeNull();
  // Formato peruano, igual que en el resto de la plataforma.
  expect(within(card).getByText('S/ 80,00')).toBeInTheDocument();
  expect(within(card).getByText('Diagnóstico y limpieza.')).toBeInTheDocument();

  fireEvent.click(within(card).getByRole('button', {name: 'Editar Reparación de hardware'}));
  type(/^Tarifa referencial/, '95,5');
  fireEvent.click(screen.getByRole('button', {name: 'Guardar servicio'}));
  expect(await screen.findByRole('status')).toHaveTextContent('Actualizamos «Reparación de hardware».');
  expect(request).toHaveBeenCalledWith('/technicians/me/services', {services: [{subcategory_id: 11, reference_fee: '95.5',
    includes: 'Diagnóstico y limpieza.'}], expected_version: 4}, 'PUT');

  request.mockClear();
  fireEvent.click(screen.getByRole('button', {name: 'Quitar Reparación de hardware'}));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', {name: 'Cancelar'}));
  expect(request).not.toHaveBeenCalledWith('/technicians/me/services', expect.anything(), 'PUT');
  fireEvent.click(screen.getByRole('button', {name: 'Quitar Reparación de hardware'}));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', {name: 'Confirmar'}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/technicians/me/services', {services: [], expected_version: 4}, 'PUT'));
  expect(await screen.findByText('Quitamos «Reparación de hardware» de tus servicios.')).toBeInTheDocument();
});

test('S05-TC-343 «Añadir servicio» filtra por especialidad, agrupa tarjetas, marca «Ya lo ofreces», elige con el teclado y valida la tarifa', async () => {
  routes({'PUT /technicians/me/services': async () => ({data: {}})});
  render(<ServicesPage/>);
  fireEvent.click(await screen.findByRole('button', {name: /Añadir servicio/}));
  const dialog = screen.getByRole('dialog', {name: 'Añadir servicio'});
  await waitFor(() => expect(within(dialog).getAllByRole('radio')).toHaveLength(4));
  expect(within(dialog).getAllByRole('heading', {level: 3}).map(heading => heading.textContent)).toEqual(['Cómputo', 'Refrigeración comercial', 'Electricidad']);
  const filters = within(dialog).getByRole('group', {name: 'Filtrar por especialidad'});
  expect(within(filters).getAllByRole('button').map(button => button.textContent.trim())).toEqual(['Todas', 'Cómputo', 'Refrigeración comercial', 'Electricidad']);
  expect(within(filters).getByRole('button', {name: 'Electricidad'})).toHaveAttribute('data-tone', 'electricidad');
  const taken = within(dialog).getByRole('radio', {name: /Reparación de hardware/});
  expect(taken).toBeDisabled();
  expect(taken).toHaveTextContent('Ya lo ofreces');
  expect(within(dialog).getByRole('radio', {name: /Vitrinas/})).toHaveTextContent('Lo declaraste al registrarte');

  fireEvent.click(within(filters).getByRole('button', {name: 'Electricidad'}));
  expect(within(dialog).getAllByRole('radio').map(radio => radio.querySelector('strong').textContent)).toEqual(['Tableros eléctricos']);
  fireEvent.click(within(filters).getByRole('button', {name: 'Todas'}));
  type('Buscar subcategoría', 'impres');
  expect(within(dialog).getByRole('radio', {name: /Impresoras/})).toHaveTextContent('Tarifa sugerida desde S/ 60,00');
  type('Buscar subcategoría', 'zzz');
  expect(within(dialog).getByText('No encontramos “zzz”. Prueba con otra palabra.')).toBeInTheDocument();
  type('Buscar subcategoría', '');

  // Teclado: la primera opción libre recibe el foco, las flechas avanzan y Enter elige.
  const printers = within(dialog).getByRole('radio', {name: /Impresoras/});
  expect(printers).toHaveAttribute('tabindex', '0');
  printers.focus();
  fireEvent.keyDown(printers, {key: 'ArrowDown'});
  const fridges = within(dialog).getByRole('radio', {name: /Vitrinas/});
  expect(fridges).toHaveFocus();
  fireEvent.keyDown(fridges, {key: 'Enter'});
  expect(fridges).toHaveAttribute('aria-checked', 'true');
  // El formulario aparece debajo del grupo de la tarjeta elegida, fuera del grupo de opciones.
  expect(fridges.closest('section')).toContainElement(within(dialog).getByLabelText(/^Tarifa referencial/));
  expect(fridges.closest('[role="radiogroup"]')).not.toContainElement(within(dialog).getByLabelText(/^Tarifa referencial/));
  type(/^Tarifa referencial/, '0');
  fireEvent.click(within(dialog).getByRole('button', {name: 'Guardar servicio'}));
  expect(within(dialog).getByText('La tarifa debe estar entre S/ 1,00 y S/ 5 000,00.')).toBeInTheDocument();
  expect(request).not.toHaveBeenCalledWith('/technicians/me/services', expect.anything(), 'PUT');
  type(/^Tarifa referencial/, '120,50');
  type(/^Qué incluye/, 'Limpieza del condensador.');
  fireEvent.click(within(dialog).getByRole('button', {name: 'Guardar servicio'}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/technicians/me/services', expect.objectContaining({
    services: [expect.objectContaining({subcategory_id: 11}), {subcategory_id: 21, reference_fee: '120.50', includes: 'Limpieza del condensador.'}]}), 'PUT'));
  expect(await screen.findByRole('status')).toHaveTextContent('Añadimos «Vitrinas» a tus servicios.');
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('S05-TC-344 Portafolio: antes y después con su etiqueta, cambia el orden con Subir y Bajar y quita con confirmación', async () => {
  routes({'PATCH /technicians/me/portfolio/order': async body => ({data: body}), 'DELETE /technicians/me/portfolio/2': async () => null});
  render(<PortfolioPage/>);
  const list = await screen.findByRole('list', {name: /Tus trabajos/});
  const first = within(list).getAllByRole('listitem')[0];
  expect(within(first).getByText('Antes')).toBeInTheDocument();
  expect(within(first).getByText('Después')).toBeInTheDocument();
  expect(within(first).getByRole('img', {name: 'Foto 101'})).toBeInTheDocument();
  expect(within(first).getByText('Publicado')).toBeInTheDocument();
  expect(within(list).getAllByRole('listitem')[1]).toHaveTextContent('Borrador');
  expect(screen.getByRole('button', {name: 'Subir «Vitrina recuperada»'})).toBeDisabled();

  fireEvent.click(screen.getByRole('button', {name: 'Bajar «Vitrina recuperada»'}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/technicians/me/portfolio/order', {ids: [2, 1]}, 'PATCH'));
  expect(await screen.findByRole('status')).toHaveTextContent('Movimos «Vitrina recuperada» al puesto 2 de 2.');

  fireEvent.click(screen.getByRole('button', {name: 'Quitar «Laptop sin pantalla»'}));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', {name: 'Cancelar'}));
  expect(request).not.toHaveBeenCalledWith('/technicians/me/portfolio/2', undefined, 'DELETE');
  fireEvent.click(screen.getByRole('button', {name: 'Quitar «Laptop sin pantalla»'}));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', {name: 'Confirmar'}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/technicians/me/portfolio/2', undefined, 'DELETE'));
  expect(await screen.findByText('Quitamos «Laptop sin pantalla» de tu portafolio.')).toBeInTheDocument();
});

test('S05-TC-345 un trabajo nuevo pide el texto alternativo de cada foto antes de guardarlo y envía etapas y textos', async () => {
  routes({'POST /technicians/me/portfolio': async () => ({data: {id: 9}})});
  uploadWithProgress.mockImplementation(async (form, progress) => { progress(40); return {data: {id: 700 + uploadWithProgress.mock.calls.length,
    url: '/api/v1/media/700'}}; });
  render(<PortfolioPage/>);
  fireEvent.click(await screen.findByRole('button', {name: /Añadir trabajo/}));
  type('Título del trabajo', 'Cámara de frío revisada');
  fireEvent.change(screen.getByTestId('drop-portfolio'), {target: {files: [file('antes.png', 'image/png')]}});
  await screen.findByLabelText(/^Texto alternativo de la foto 1/);
  fireEvent.change(screen.getByTestId('drop-portfolio'), {target: {files: [file('despues.png', 'image/png')]}});
  await screen.findByLabelText(/^Texto alternativo de la foto 2/);
  fireEvent.click(screen.getByRole('button', {name: 'Guardar trabajo'}));
  expect(screen.getAllByText('Escribe el texto alternativo: qué se ve en la foto.')).toHaveLength(2);
  expect(request).not.toHaveBeenCalledWith('/technicians/me/portfolio', expect.anything(), 'POST');
  type(/^Texto alternativo de la foto 1/, 'Cámara con hielo acumulado');
  // Al escribirlo, su error desaparece; el de la otra foto sigue.
  expect(screen.getAllByText('Escribe el texto alternativo: qué se ve en la foto.')).toHaveLength(1);
  type(/^Texto alternativo de la foto 2/, 'Cámara limpia y funcionando');
  fireEvent.click(screen.getByRole('button', {name: 'Guardar trabajo'}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/technicians/me/portfolio', expect.objectContaining({
    title: 'Cámara de frío revisada', status: 'published', media_ids: [701, 702], image_stages: ['before', 'after'],
    image_captions: ['Cámara con hielo acumulado', 'Cámara limpia y funcionando']}), 'POST'));
  expect(await screen.findByText('Añadimos «Cámara de frío revisada» a tu portafolio.')).toBeInTheDocument();
});

test('S05-TC-346 Verificación muestra cada documento obligatorio con su estado, ícono y nota, y el estado general coincide con el menú', async () => {
  routes();
  render(<VerificationPage/>);
  const docs = await screen.findByRole('list', {name: 'Documentos obligatorios'});
  const [identity, certificate] = within(docs).getAllByRole('listitem');
  expect(within(identity).getByText('Aprobado').closest('.tech-status')).toHaveAttribute('data-tone', 'ok');
  expect(within(identity).getByText('Aprobado').closest('.tech-status').querySelector('.panel-svg-icon')).not.toBeNull();
  expect(within(identity).getByRole('link', {name: 'dni.pdf'})).toHaveAttribute('href', '/api/v1/media/501');
  expect(within(certificate).getByText('Observado').closest('.tech-status')).toHaveAttribute('data-tone', 'danger');
  expect(within(certificate).getByText('El certificado no se lee.')).toBeInTheDocument();
  expect(within(certificate).getByRole('button', {name: /Subir otra vez/})).toBeInTheDocument();
  expect(document.querySelector('.tech-verify-banner')).toHaveAttribute('data-tone', 'danger');
  const select = screen.getByLabelText(/^Tipo de documento/);
  expect([...select.options].map(option => option.textContent)).toEqual(['Elige el tipo de documento', 'Documento de identidad (obligatorio)',
    'Certificado o constancia técnica (obligatorio)', 'Otro documento de respaldo']);
  fireEvent.click(within(certificate).getByRole('button', {name: /Subir otra vez/}));
  expect(select).toHaveValue('Certificado o constancia técnica');
  cleanup();
  routes({'GET /technicians/me/verification': async () => ({data: verification({state: 'missing', label: 'Falta un documento', can_request_review: false,
    last_review: null, required: [verification().required[0], {key: 'certificate', label: 'Certificado o constancia técnica', state: 'missing',
      state_label: 'Falta subirlo', note: null, document: null}]})})});
  render(<VerificationPage/>);
  expect(await screen.findByText('Falta subirlo')).toBeInTheDocument();
  expect(screen.getByText('Todavía no lo subes.')).toBeInTheDocument();
  expect(screen.queryByRole('button', {name: 'Pedir nueva revisión'})).toBeNull();
});

test('S05-TC-347 la subida admite arrastrar y soltar, muestra el nombre y la barra de progreso y valida tipo y archivo', async () => {
  let finish;
  uploadWithProgress.mockImplementation((form, progress) => new Promise(resolve => { progress(55); finish = () => { progress(100);
    resolve({data: {id: 900, url: '/api/v1/media/900'}}); }; }));
  routes({'POST /technicians/me/documents': async () => ({data: {id: 3}}), 'POST /technicians/me/verification-request': async () => ({data: {}})});
  const onSaved = vi.fn();
  render(<VerificationPage onSaved={onSaved}/>);
  const zone = (await screen.findByText('Archivo del documento')).closest('.tech-drop');
  fireEvent.drop(zone, {dataTransfer: {files: [file('foto.gif', 'image/gif')]}});
  expect(within(zone).getByRole('alert')).toHaveTextContent('Selecciona PDF, JPG o PNG.');
  expect(uploadWithProgress).not.toHaveBeenCalled();
  fireEvent.dragOver(zone);
  expect(zone).toHaveClass('is-over');
  fireEvent.drop(zone, {dataTransfer: {files: [file('certificado-nuevo.pdf', 'application/pdf')]}});
  expect(within(zone).getByText('certificado-nuevo.pdf')).toBeInTheDocument();
  const bar = within(zone).getByRole('progressbar', {name: 'Subida de certificado-nuevo.pdf'});
  expect(bar).toHaveAttribute('aria-valuenow', '55');
  expect(within(zone).getByText('Subiendo… 55 %')).toBeInTheDocument();
  await act(async () => finish());
  expect(bar).toHaveAttribute('aria-valuenow', '100');
  fireEvent.click(screen.getByRole('button', {name: 'Adjuntar documento'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Elige el tipo de documento de la lista.');
  expect(request).not.toHaveBeenCalledWith('/technicians/me/documents', expect.anything());
  type(/^Tipo de documento/, 'Certificado o constancia técnica');
  fireEvent.click(screen.getByRole('button', {name: 'Adjuntar documento'}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/technicians/me/documents', {media_id: 900, document_type: 'Certificado o constancia técnica'}));
  expect(await screen.findByRole('status')).toHaveTextContent('Recibimos tu «Certificado o constancia técnica».');
  expect(onSaved).toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', {name: 'Pedir nueva revisión'}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/technicians/me/verification-request', {expected_version: 9}));
});

test('S05-TC-348 Estadísticas: indicadores, resumen en texto, gráficos con descripción, tabla y cambio a «Por mes»', async () => {
  routes();
  render(<StatsPage/>);
  const kpis = await screen.findByRole('list', {name: 'Resumen del período'});
  expect(within(kpis).getAllByRole('listitem').map(item => item.textContent)).toEqual(['Tasa de aceptación67 %',
    'Tiempo medio de respuesta1 min 10 s', 'Trabajos completados2', 'Ofertas vencidas1']);
  expect(screen.getByText(/En las últimas 8 semanas aceptaste 4 de 6 ofertas \(67 %\), dejaste vencer 1 y completaste 2 trabajos\./)).toBeInTheDocument();
  expect(document.querySelectorAll('.tech-chart svg[role="group"]')).toHaveLength(4);
  expect(screen.getByRole('group', {name: /^Ofertas por semana Cada barra suma/})).toBeInTheDocument();
  expect(screen.getByRole('list', {name: 'Leyenda'})).toHaveTextContent('AceptadasRechazadasVencidas');
  expect(screen.getByText(/la más alta fue 75 % en la semana del 9 nov/, {selector: '.tech-chart-summary'})).toBeInTheDocument();
  const table = screen.getByRole('table', {name: 'Datos por semana'});
  expect(within(table).getAllByRole('row')[2]).toHaveTextContent('9 nov30175 %1 min 05 s2');
  fireEvent.click(screen.getByRole('tab', {name: 'Por mes'}));
  expect(await screen.findByRole('table', {name: 'Datos por mes'})).toBeInTheDocument();
  expect(request).toHaveBeenCalledWith('/technicians/me/stats?period=month');
  expect(screen.getByRole('tab', {name: 'Por mes'})).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByText(/En los últimos 6 meses aceptaste 6 de 7 ofertas/)).toBeInTheDocument();
});

test('S05-TC-349 cada barra del gráfico muestra su detalle al enfocarla; sin datos lo dice en texto', async () => {
  routes();
  render(<StatsPage/>);
  await screen.findByRole('list', {name: 'Resumen del período'});
  const bar = screen.getByRole('img', {name: '9 nov: Aceptadas 3, Rechazadas 0, Vencidas 1'});
  fireEvent.focus(bar);
  const tip = document.querySelector('.tech-chart-tip');
  expect(tip).toHaveTextContent('9 novAceptadas: 3Rechazadas: 0Vencidas: 1');
  fireEvent.blur(bar);
  expect(document.querySelector('.tech-chart-tip')).toBeNull();
  expect(screen.getAllByRole('img', {name: /2 nov: Completados 0/})).toHaveLength(1);
  // La línea de la tasa se corta en los períodos sin datos en lugar de unirlos.
  expect(segments([[1, 50], [2, null], [3, 75], [4, 80]])).toEqual([[[1, 50]], [[3, 75], [4, 80]]]);
  expect(duration(null)).toBe('—');
  expect(duration(45)).toBe('45 s');
  expect(duration(125)).toBe('2 min 05 s');
  expect(statsSummary({period: 'month', buckets: [bucket], totals: {accepted: 0, rejected: 0, expired: 0, completed: 0,
    acceptance_rate: null, avg_response_seconds: null}})).toBe('En los últimos 6 meses todavía no tienes ofertas respondidas ni trabajos completados.');
});

test('S05-TC-353 los diálogos «Añadir servicio» y «Nuevo trabajo» atrapan el foco, se cierran con Esc o el fondo y devuelven el foco al botón que los abrió', async () => {
  routes();
  render(<ServicesPage/>);
  const open = await screen.findByRole('button', {name: /Añadir servicio/});
  open.focus();
  fireEvent.click(open);
  const dialog = screen.getByRole('dialog', {name: 'Añadir servicio'});
  expect(dialog).toHaveAttribute('aria-modal', 'true');
  expect(screen.getByLabelText('Buscar subcategoría')).toHaveFocus();
  expect(document.body).toHaveClass('tech-dialog-open');
  // Foco atrapado: desde el último control, Tab vuelve al primero (Cerrar), y Mayús+Tab al revés.
  const cancel = within(dialog).getByRole('button', {name: 'Cancelar'});
  cancel.focus();
  fireEvent.keyDown(dialog, {key: 'Tab'});
  expect(within(dialog).getByRole('button', {name: 'Cerrar'})).toHaveFocus();
  fireEvent.keyDown(dialog, {key: 'Tab', shiftKey: true});
  expect(cancel).toHaveFocus();
  fireEvent.keyDown(dialog, {key: 'Escape'});
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(open).toHaveFocus();
  expect(document.body).not.toHaveClass('tech-dialog-open');
  cleanup();

  render(<PortfolioPage/>);
  const add = await screen.findByRole('button', {name: /Añadir trabajo/});
  add.focus();
  fireEvent.click(add);
  const work = screen.getByRole('dialog', {name: 'Nuevo trabajo'});
  expect(screen.getByLabelText('Título del trabajo')).toHaveFocus();
  expect(within(work).getByRole('button', {name: 'Guardar trabajo'}).closest('footer')).not.toBeNull();
  // Cierre S4-S5 (Sonar S6848): el fondo es un botón nativo «Cerrar al tocar fuera»; antes se probaba con mousedown en el div.
  fireEvent.click(within(work.parentElement).getByRole('button', {name: 'Cerrar al tocar fuera'}));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(add).toHaveFocus();
});
