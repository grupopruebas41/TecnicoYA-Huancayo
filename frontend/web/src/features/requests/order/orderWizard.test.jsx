import React from 'react';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import OrderWizard from './OrderWizard';
import {liveSummary} from './orderModel';
import MyRequests from '../MyRequests';
import TechnicianProfile from '../../matching/TechnicianProfile';
import {Notice} from '../../administration/forms';
import {request} from '../../administration/http';
// Pedido por especialidades (D-92 y D-95): selección múltiple sin límite de trabajos, detalle por especialidad, ubicación y
// horario, resumen con «Editar», envío atómico con clave idempotente y Mis solicitudes agrupadas por pedido. S05-TC-104 a
// 112 y 114 se adaptaron a D-95: una solicitud por especialidad, sin aviso de cupo ni contador de rubros.
vi.mock('../../administration/http', () => ({request: vi.fn(), serverNow: () => Date.now()}));
beforeEach(() => { globalThis.URL.createObjectURL = vi.fn(file => 'blob:' + file.name); });
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.useRealTimers(); });

const SPECIALTIES = [
  {id: 1, name: 'Cómputo', description: 'Equipos, redes y programas.', subcategory_count: 3},
  {id: 2, name: 'Refrigeración comercial', description: 'Frío para hogares y negocios.', subcategory_count: 2},
  {id: 3, name: 'Electricidad', description: 'Instalaciones y tableros.', subcategory_count: 2},
];
const SUBCATEGORIES = {
  1: [{id: 11, name: 'Reparación de hardware', reference_fee: '50.00'}, {id: 12, name: 'Redes e infraestructura', reference_fee: null},
    {id: 13, name: 'Recuperación de datos', reference_fee: '80.00'}],
  2: [{id: 21, name: 'Refrigeración doméstica', reference_fee: '70.00'}, {id: 22, name: 'Congeladores industriales', reference_fee: null}],
  3: [{id: 31, name: 'Tableros eléctricos', reference_fee: '100.00'}, {id: 32, name: 'Iluminación', reference_fee: null}],
};
const SYMPTOMS = {11: [{id: 101, name: 'No prende'}, {id: 102, name: 'Pantalla negra o rota'}], 12: [{id: 121, name: 'Sin internet'}], 31: [{id: 301, name: 'El tablero salta'}]};
const fail = (message, status, code) => Object.assign(new Error(message), {status, code, fields: {}});

function routes({quota = {max: 3, active: 0, available: 3}, order, suggestions = []} = {}) {
  request.mockImplementation(async (path, body, method) => {
    if (path === '/catalog/specialties') return {data: SPECIALTIES};
    if (path === '/catalog/districts') return {data: [{id: 1, name: 'Huancayo'}, {id: 2, name: 'El Tambo'}]};
    if (path === '/orders/quota') return {data: quota};
    if (path.startsWith('/catalog/subcategories?')) return {data: SUBCATEGORIES[new URLSearchParams(path.split('?')[1]).get('specialty_id')]};
    if (path.endsWith('/symptoms')) return {data: SYMPTOMS[path.split('/')[3]] || []};
    if (path.startsWith('/catalog/suggestions')) return {data: {source: 'keywords', level: 'alta', items: suggestions}};
    if (path === '/media' && method === undefined) return {data: {id: 500 + request.mock.calls.filter(([p]) => p === '/media').length}};
    if (path.startsWith('/media/') && method === 'DELETE') return null;
    if (path === '/orders') return order ? order(body) : {data: {id: 9, status: 'sent', requests: []}};
    return {data: []};
  });
}
const checkbox = name => screen.findByRole('checkbox', {name: new RegExp('^' + name)});
const next = () => fireEvent.click(screen.getByRole('button', {name: /^(Siguiente|Enviar pedido)$/}));
const heading = name => screen.findByRole('heading', {name});
async function mount(props = {}) {
  const view = render(<OrderWizard defaultDistrictId={1} {...props}/>);
  await checkbox('Cómputo');
  return view;
}
async function toSubcategories(specialties) {
  for (const name of specialties) fireEvent.click(await checkbox(name));
  next();
  await heading('Paso 2: Subcategorías');
}
async function toDetail(specialties, subcategories) {
  await toSubcategories(specialties);
  for (const name of subcategories) fireEvent.click(await checkbox(name));
  next();
  await heading('Paso 3: Detalle por especialidad');
}
const describeFault = text => fireEvent.change(screen.getByRole('textbox', {name: 'Descripción de la falla'}), {target: {value: text}});
async function toSummary() {
  await toDetail(['Cómputo', 'Electricidad'], ['Reparación de hardware', 'Redes e infraestructura', 'Tableros eléctricos']);
  fireEvent.click(await screen.findByRole('button', {name: 'No prende'}));
  fireEvent.click(screen.getByRole('radio', {name: 'Urgente'}));
  describeFault('La laptop no prende desde ayer en la tienda.');
  fireEvent.click(screen.getByRole('tab', {name: /Electricidad/}));
  describeFault('El tablero salta cuando prendemos la congeladora.');
  next();
  await heading('Paso 4: Ubicación y horario');
  fireEvent.change(screen.getByRole('textbox', {name: 'Dirección'}), {target: {value: 'Jr. Sintético 742'}});
  next();
  await heading('Paso 5: Resumen y envío');
}

test('S05-TC-103 paso 1: especialidades como casillas accesibles de selección múltiple, sin fotos y con su número de subcategorías', async () => {
  routes();
  await mount();
  const group = screen.getByRole('group', {name: 'Especialidades'});

  next();
  expect(await within(group).findByText('Marca al menos una especialidad.')).toBeInTheDocument();
  await waitFor(() => expect(within(group).getAllByRole('checkbox')[0]).toHaveFocus());
  fireEvent.click(await checkbox('Cómputo'));
  fireEvent.click(await checkbox('Electricidad'));

  expect(await checkbox('Cómputo')).toBeChecked();
  expect(await checkbox('Electricidad')).toBeChecked();
  expect(await checkbox('Refrigeración comercial')).not.toBeChecked();
  expect((await checkbox('Cómputo')).closest('label')).toHaveClass('is-checked');
  expect(within(group).getByText('3 subcategorías')).toBeInTheDocument();
  expect(within(group).getByText('Equipos, redes y programas.')).toBeInTheDocument();
  expect(group.querySelector('img')).toBeNull();
  expect(group.querySelectorAll('svg.panel-svg-icon').length).toBeGreaterThanOrEqual(6); // ícono y casilla por tarjeta
});

test('S05-TC-104 se pueden marcar las 3 especialidades y todas las subcategorías: ninguna se deshabilita y no hay contador [D-95]', async () => {
  routes({quota: {max: 3, active: 2, available: 1}});
  await mount();
  await toSubcategories(['Cómputo', 'Refrigeración comercial', 'Electricidad']);

  for (const list of Object.values(SUBCATEGORIES)) {
    for (const {name} of list) fireEvent.click(await checkbox(name));
  }

  for (const list of Object.values(SUBCATEGORIES)) {
    for (const {name} of list) {
      const box = await checkbox(name);
      expect(box).toBeChecked();
      expect(box).toBeEnabled();
    }
  }
  expect(screen.getByText('3 especialidades · 7 trabajos: Cómputo (3), Refrigeración comercial (2), Electricidad (2)')).toBeInTheDocument();
  expect(screen.queryByText(/ de \d+$/)).toBeNull();
  expect(document.querySelector('.order-counter, .order-limit')).toBeNull();
  next();
  expect(await heading('Paso 3: Detalle por especialidad')).toBeInTheDocument();
});

test('S05-TC-105 desmarcar una especialidad con subcategorías elegidas pide confirmación y las quita', async () => {
  routes();
  await mount();
  await toSubcategories(['Cómputo']);
  fireEvent.click(await checkbox('Reparación de hardware'));
  fireEvent.click(screen.getByRole('button', {name: 'Atrás'}));
  await heading('Paso 1: Especialidades');

  fireEvent.click(await checkbox('Cómputo'));
  let dialog = screen.getByRole('dialog', {name: 'Quitar especialidad'});
  expect(dialog).toHaveTextContent('Se quitarán las subcategorías elegidas de Cómputo.');
  fireEvent.click(within(dialog).getByRole('button', {name: 'Cancelar'}));
  expect(await checkbox('Cómputo')).toBeChecked();
  expect(screen.getByText('1 especialidad · 1 trabajo: Cómputo (1)')).toBeInTheDocument();

  fireEvent.click(await checkbox('Cómputo'));
  dialog = screen.getByRole('dialog', {name: 'Quitar especialidad'});
  fireEvent.click(within(dialog).getByRole('button', {name: 'Confirmar'}));
  expect(await checkbox('Cómputo')).not.toBeChecked();
  expect(screen.getByText('Aún no eliges especialidades')).toBeInTheDocument();
});

test('S05-TC-106 paso 2: subcategorías agrupadas por especialidad, con tarifa desde, filtro y validación por especialidad', async () => {
  routes();
  await mount();
  await toSubcategories(['Cómputo', 'Electricidad']);
  const computo = await screen.findByRole('region', {name: 'Cómputo'});
  const electricidad = screen.getByRole('region', {name: 'Electricidad'});

  expect(await within(computo).findByText('Desde S/ 50.00')).toBeInTheDocument();
  expect((await checkbox('Redes e infraestructura')).closest('label')).not.toHaveTextContent('Desde');
  expect(within(electricidad).getByText('Tableros eléctricos')).toBeInTheDocument();
  fireEvent.click(await checkbox('Reparación de hardware'));
  next();
  expect(await screen.findByText('Elige al menos una subcategoría de Electricidad o desmarca esa especialidad.')).toBeInTheDocument();

  fireEvent.change(screen.getByRole('searchbox', {name: 'Filtrar subcategorías'}), {target: {value: 'tab'}});
  expect(within(computo).getByText('Ninguna subcategoría coincide con el filtro.')).toBeInTheDocument();
  expect(within(electricidad).getAllByRole('checkbox')).toHaveLength(1);
  fireEvent.click(await checkbox('Tableros eléctricos'));
  next();
  expect(await heading('Paso 3: Detalle por especialidad')).toHaveFocus();
});

test('S05-TC-107 paso 3: una pestaña por especialidad con indicador, síntomas de todos sus trabajos, validación y misma descripción', async () => {
  routes();
  await mount();
  await toDetail(['Cómputo', 'Electricidad'], ['Reparación de hardware', 'Redes e infraestructura', 'Tableros eléctricos']);
  const tabs = screen.getByRole('tablist', {name: 'Especialidades del pedido'});
  expect(within(tabs).getAllByRole('tab').map(tab => tab.textContent)).toEqual(['Cómputo (pendiente)', 'Electricidad (pendiente)']);
  expect(screen.getByText('Reparación de hardware, Redes e infraestructura')).toBeInTheDocument();

  const symptom = await screen.findByRole('button', {name: 'No prende'});
  expect(await screen.findByRole('button', {name: 'Sin internet'})).toBeInTheDocument();
  fireEvent.click(symptom);
  expect(symptom).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(within(tabs).getByRole('tab', {name: /Electricidad/}));
  describeFault('a'.repeat(19));
  expect(screen.getByText('19/1000 caracteres')).toBeInTheDocument();
  next();
  expect(within(tabs).getByRole('tab', {name: /Cómputo/})).toHaveAttribute('aria-selected', 'true');
  expect(await screen.findByText('La descripción debe tener al menos 20 caracteres.')).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole('textbox', {name: 'Descripción de la falla'})).toHaveFocus());

  describeFault('La laptop no prende desde ayer en la tienda.');
  fireEvent.click(screen.getByRole('checkbox', {name: 'Usar la misma descripción para todas'}));
  expect(within(tabs).getAllByRole('tab').map(tab => tab.textContent)).toEqual(['Cómputo (completo)', 'Electricidad (completo)']);
  fireEvent.keyDown(within(tabs).getByRole('tab', {name: /Cómputo/}), {key: 'ArrowRight'});
  expect(within(tabs).getByRole('tab', {name: /Electricidad/})).toHaveFocus();
  expect(screen.getByRole('textbox', {name: 'Descripción de la falla'})).toHaveValue('La laptop no prende desde ayer en la tienda.');
  expect(screen.getByRole('button', {name: 'El tablero salta'})).toHaveAttribute('aria-pressed', 'false');
  next();
  expect(await heading('Paso 4: Ubicación y horario')).toBeInTheDocument();
});

test('S05-TC-108 fotos por especialidad: arrastrar y soltar, vista previa, máximo 5 y quitar con confirmación', async () => {
  routes();
  await mount();
  await toDetail(['Cómputo'], ['Reparación de hardware']);
  const photo = name => new File(['x'], name, {type: 'image/png'});
  const zone = screen.getByText('Arrastra tus fotos aquí o elige archivos').closest('label');

  await act(async () => { fireEvent.drop(zone, {dataTransfer: {files: [photo('a.png')]}}); });
  expect(await screen.findByRole('img', {name: 'Foto 1 de Cómputo'})).toHaveAttribute('src', 'blob:a.png');
  await act(async () => {
    fireEvent.change(screen.getByLabelText('Agregar fotos de Cómputo'),
      {target: {files: ['b', 'c', 'd', 'e', 'f'].map(name => photo(name + '.png'))}});
  });
  expect(await screen.findByText('La solicitud admite como máximo 5 fotos.')).toBeInTheDocument();
  expect(screen.getAllByRole('img', {name: /Foto \d de Cómputo/})).toHaveLength(5);
  expect(request.mock.calls.filter(([path]) => path === '/media')).toHaveLength(5);
  expect(screen.getByText('Llegaste al máximo de 5 fotos.')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', {name: 'Retirar foto 1'}));
  const dialog = screen.getByRole('dialog', {name: 'Quitar foto'});
  await act(async () => { fireEvent.click(within(dialog).getByRole('button', {name: 'Confirmar'})); });
  expect(request).toHaveBeenCalledWith('/media/501', undefined, 'DELETE');
  expect(await screen.findByText('Quitaste la foto.')).toBeInTheDocument();
  expect(screen.getAllByRole('img', {name: /Foto \d de Cómputo/})).toHaveLength(4);
});

test('S05-TC-109 paso 4: distrito del perfil, «Lo antes posible» o fecha y franja de Lima, sin franjas que ya empezaron', async () => {
  vi.useFakeTimers({toFake: ['Date']});
  vi.setSystemTime(new Date('2026-10-20T14:00:00Z')); // 09:00 en Lima
  routes();
  await mount();
  await toDetail(['Cómputo'], ['Reparación de hardware']);
  describeFault('La laptop no prende desde ayer en la tienda.');
  next();
  await heading('Paso 4: Ubicación y horario');

  expect(screen.getByRole('combobox', {name: 'Distrito'})).toHaveValue('1');
  expect(screen.getByRole('radio', {name: 'Lo antes posible'})).toBeChecked();
  fireEvent.change(screen.getByRole('textbox', {name: 'Dirección'}), {target: {value: 'Jr.'}});
  fireEvent.click(screen.getByRole('radio', {name: 'Programar'}));
  next();
  expect(await screen.findByText('La dirección debe tener de 5 a 255 caracteres.')).toBeInTheDocument();
  expect(screen.getByText('Elige una fecha desde hoy.')).toBeInTheDocument();
  expect(screen.getByText('Elige una franja.')).toBeInTheDocument();

  fireEvent.change(screen.getByRole('textbox', {name: 'Dirección'}), {target: {value: 'Jr. Sintético 742'}});
  fireEvent.change(screen.getByLabelText('Fecha'), {target: {value: '2026-10-20'}});
  fireEvent.click(screen.getByRole('radio', {name: /Mañana/}));
  next();
  expect(await screen.findByText('Esa franja ya empezó. Elige una franja que aún no empiece.')).toBeInTheDocument();
  expect(screen.getByText('Hora de Lima. La disponibilidad del técnico se confirma en el matching.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('radio', {name: /Tarde/}));
  next();
  await heading('Paso 5: Resumen y envío');
  expect(screen.getByRole('article', {name: 'Ubicación y horario'})).toHaveTextContent('Tarde (12–18)');
});

test('S05-TC-110 resumen: una tarjeta por especialidad con sus subcategorías y «Editar», y el aviso de cuántas solicitudes se crearán', async () => {
  routes();
  await mount();
  await toSummary();

  expect(screen.getByRole('note')).toHaveTextContent('Se crearán 2 solicitudes, una por especialidad.');
  const first = screen.getByRole('article', {name: 'Especialidad Cómputo'});
  expect(within(first).getByRole('heading', {name: 'Cómputo'})).toBeInTheDocument();
  expect(within(first).getAllByRole('listitem').map(item => item.textContent)).toEqual(['Reparación de hardware', 'Redes e infraestructura']);
  expect(first).toHaveTextContent('No prende');
  expect(first).toHaveTextContent('Urgente');
  expect(screen.getByRole('article', {name: 'Ubicación y horario'})).toHaveTextContent('Huancayo · Jr. Sintético 742');
  next();
  expect(await screen.findByText('Confirma que el resumen es correcto.')).toBeInTheDocument();
  expect(request).not.toHaveBeenCalledWith('/orders', expect.anything(), 'POST', expect.anything());

  fireEvent.click(screen.getByRole('button', {name: 'Editar Electricidad'}));
  await heading('Paso 3: Detalle por especialidad');
  expect(screen.getByRole('tab', {name: /Electricidad/})).toHaveAttribute('aria-selected', 'true');
  next();
  next();
  await heading('Paso 5: Resumen y envío');
  fireEvent.click(screen.getByRole('button', {name: 'Editar ubicación y horario'}));
  expect(await heading('Paso 4: Ubicación y horario')).toHaveFocus();
});

test('S05-TC-111 envío: POST /orders por especialidad con sus subcategorías y una clave que se reutiliza al reintentar; confirma con N seguimientos', async () => {
  let calls = 0;
  routes({order: () => {
    calls += 1;
    if (calls === 1) throw fail('No pudimos confirmar el resultado.', 0);
    return {data: {id: 9, status: 'sent', requests: [
      {id: 41, status: 'sent', specialty: {id: 1, name: 'Cómputo'}, subcategory: {id: 11, name: 'Reparación de hardware'},
        subcategories: [{id: 11, name: 'Reparación de hardware'}, {id: 12, name: 'Redes e infraestructura'}]},
      {id: 42, status: 'sent', specialty: {id: 3, name: 'Electricidad'}, subcategory: {id: 31, name: 'Tableros eléctricos'}, subcategories: [{id: 31, name: 'Tableros eléctricos'}]},
    ]}};
  }});
  const navigate = vi.fn();
  await mount({navigate});
  await toSummary();
  fireEvent.click(screen.getByRole('checkbox', {name: 'Confirmo que el resumen es correcto'}));

  await act(async () => { next(); });
  expect(await screen.findByText(/No pudimos confirmar el envío/)).toBeInTheDocument();
  await act(async () => { fireEvent.click(screen.getByRole('button', {name: 'Reintentar envío'})); });

  const posts = request.mock.calls.filter(([path]) => path === '/orders');
  expect(posts).toHaveLength(2);
  expect(posts[0][3].headers['Idempotency-Key']).toBe(posts[1][3].headers['Idempotency-Key']);
  expect(posts[0][1]).toEqual({district_id: 1, address: 'Jr. Sintético 742', address_reference: null, mode: 'asap', summary_confirmed: true,
    items: [
      {specialty_id: 1, subcategory_ids: [11, 12], description: 'La laptop no prende desde ayer en la tienda.', urgency: 'urgente', brand: null, model: null, symptom_ids: [101], media_ids: []},
      {specialty_id: 3, subcategory_ids: [31], description: 'El tablero salta cuando prendemos la congeladora.', urgency: 'normal', brand: null, model: null, symptom_ids: [], media_ids: []},
    ]});
  expect(await screen.findByRole('heading', {name: 'Pedido enviado'})).toHaveFocus();
  expect(screen.getByText('Creamos 2 solicitudes, una por especialidad. Cada una busca su técnico por separado.')).toBeInTheDocument();
  expect(screen.getByText('Reparación de hardware, Redes e infraestructura')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: 'Ver seguimiento de la solicitud #42'}));
  expect(navigate).toHaveBeenCalledWith('requests', {open: 42});
  fireEvent.click(screen.getByRole('button', {name: 'Ir a Mis solicitudes'}));
  expect(navigate).toHaveBeenLastCalledWith('requests');
});

test('S05-TC-112 si al enviar ya tiene 3 pedidos activos, el pedido se rechaza con su mensaje y el asistente pasa al bloqueo', async () => {
  const message = 'Ya tienes 3 pedidos activos, el máximo permitido. Podrás hacer otro cuando alguno se cierre.';
  const quotas = [{max: 3, active: 2, available: 1}, {max: 3, active: 3, available: 0}];
  routes({order: () => { throw fail(message, 409, 'ACTIVE_REQUEST_LIMIT'); }});
  const base = request.getMockImplementation();
  request.mockImplementation(async (path, ...rest) => (path === '/orders/quota' ? {data: quotas.shift()} : base(path, ...rest)));
  await mount();
  await toSummary();
  fireEvent.click(screen.getByRole('checkbox', {name: 'Confirmo que el resumen es correcto'}));

  await act(async () => { next(); });

  expect(screen.queryByRole('heading', {name: 'Pedido enviado'})).toBeNull();
  expect(await screen.findByRole('heading', {name: 'Ya tienes 3 pedidos activos'})).toBeInTheDocument();
  expect(request.mock.calls.filter(([path]) => path === '/orders/quota')).toHaveLength(2);
});

test('S05-TC-113 Mis solicitudes agrupa las solicitudes del mismo pedido y muestra todos sus trabajos', async () => {
  const row = (id, order, ...names) => ({id, order_id: order, status: 'sent', phase: 'awaiting_responses', subcategory: {id, name: names[0]},
    subcategories: names.map((name, index) => ({id: id * 10 + index, name})), district: {id: 1, name: 'Huancayo'}, updated_at: '2026-10-20T14:00:00Z'});
  request.mockImplementation(async path => (path === '/requests'
    ? {data: [row(42, 9, 'Tableros eléctricos'), row(41, 9, 'Reparación de hardware', 'Redes e infraestructura'), row(40, null, 'Iluminación'), row(39, 7, 'Redes')]}
    : {data: []}));
  render(<MyRequests/>);

  const order = await screen.findByRole('region', {name: 'Pedido #9'});
  expect(within(order).getByRole('heading', {name: 'Pedido #9 · 2 solicitudes'})).toBeInTheDocument();
  expect(within(order).getAllByRole('button', {name: /Ver solicitud/}).map(button => button.textContent)).toEqual(['Ver solicitud #42', 'Ver solicitud #41']);
  expect(within(order).getByRole('heading', {name: 'Reparación de hardware, Redes e infraestructura'})).toBeInTheDocument();
  expect(screen.queryByRole('region', {name: 'Pedido #7'})).toBeNull(); // un pedido de una sola solicitud no se agrupa
  expect(within(order).queryByText('Iluminación')).toBeNull();
});

test('S05-TC-114 barra inferior con resumen vivo, stepper con pasos completados y transición que respeta movimiento reducido', async () => {
  routes();
  await mount();
  await toSubcategories(['Cómputo', 'Electricidad']);
  fireEvent.click(await checkbox('Reparación de hardware'));
  fireEvent.click(await checkbox('Tableros eléctricos'));

  expect(screen.getByText('2 especialidades · 2 trabajos: Cómputo (1), Electricidad (1)')).toHaveAttribute('aria-live', 'polite');
  const steps = within(screen.getByRole('list', {name: 'Pasos del pedido'})).getAllByRole('listitem');
  expect(steps[0]).toHaveClass('is-done');
  expect(steps[0]).toHaveTextContent('(completado)');
  expect(steps[1]).toHaveAttribute('aria-current', 'step');
  expect(screen.getByRole('heading', {name: 'Paso 2: Subcategorías'})).toHaveFocus();
  const css = readFileSync(resolve('src/features/requests/order/order.css'), 'utf8').replace(/\r\n/g, '\n');
  expect(css).toMatch(/\.order-step \{[^}]*animation: order-in-forward 200ms/);
  expect(css).toMatch(/prefers-reduced-motion: reduce\) \{\s*\.order-step,[^}]*animation: none/);
});

test('S05-TC-134 el pie resume especialidades y trabajos con los nombres y conteos correctos [DEF-56]', () => {
  const item = (specialty_id, specialty_name, count) => ({specialty_id, specialty_name, subcategories: Array.from({length: count}, (_, id) => ({id}))});
  const state = (specialtyIds, items) => ({specialtyIds, items});

  expect(liveSummary(state([], []), SPECIALTIES)).toBe('Aún no eliges especialidades');
  expect(liveSummary(state([1], []), SPECIALTIES)).toBe('1 especialidad · Sin trabajos aún: Cómputo');
  expect(liveSummary(state([1, 2], []), SPECIALTIES)).toBe('2 especialidades · Sin trabajos aún: Cómputo, Refrigeración comercial');
  expect(liveSummary(state([1, 3], [item(1, 'Cómputo', 1)]), SPECIALTIES)).toBe('2 especialidades · 1 trabajo: Cómputo (1), Electricidad (0)');
  expect(liveSummary(state([1, 2, 3], [item(1, 'Cómputo', 2), item(2, 'Refrigeración comercial', 2), item(3, 'Electricidad', 1)]), SPECIALTIES))
    .toBe('3 especialidades · 5 trabajos: Cómputo (2), Refrigeración comercial (2), Electricidad (1)');
});

test('S05-TC-135 con pedidos activos no hay aviso amarillo en ningún paso, ni repetido [DEF-55]', async () => {
  routes({quota: {max: 3, active: 2, available: 1}});
  await mount();
  expect(screen.queryByText(/activa/)).toBeNull();
  expect(document.querySelector('.order-quota')).toBeNull();

  await toSubcategories(['Cómputo']);

  expect(screen.queryByText(/activa/)).toBeNull();
  expect(document.querySelector('.order-quota')).toBeNull();
});

test('S05-TC-136 el filtro no pierde lo marcado: el pie sigue contando las subcategorías que quedan ocultas', async () => {
  routes();
  await mount();
  await toSubcategories(['Cómputo', 'Electricidad']);
  fireEvent.click(await checkbox('Reparación de hardware'));
  fireEvent.click(await checkbox('Tableros eléctricos'));

  fireEvent.change(screen.getByRole('searchbox', {name: 'Filtrar subcategorías'}), {target: {value: 'tab'}});

  expect(screen.queryByRole('checkbox', {name: /Reparación de hardware/})).toBeNull();
  expect(screen.getByText('2 especialidades · 2 trabajos: Cómputo (1), Electricidad (1)')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('searchbox', {name: 'Filtrar subcategorías'}), {target: {value: ''}});
  expect(await checkbox('Reparación de hardware')).toBeChecked();
});

test('S05-TC-137 al desmarcar una subcategoría se quitan sus síntomas y se conserva lo demás de la especialidad', async () => {
  routes();
  await mount();
  await toDetail(['Cómputo'], ['Reparación de hardware', 'Redes e infraestructura']);
  fireEvent.click(await screen.findByRole('button', {name: 'No prende'}));
  fireEvent.click(await screen.findByRole('button', {name: 'Sin internet'}));
  describeFault('La laptop no prende y se cae el internet.');

  fireEvent.click(screen.getByRole('button', {name: 'Atrás'}));
  await heading('Paso 2: Subcategorías');
  fireEvent.click(await checkbox('Redes e infraestructura'));
  next();
  await heading('Paso 3: Detalle por especialidad');

  expect(screen.queryByRole('button', {name: 'Sin internet'})).toBeNull();
  expect(screen.getByRole('button', {name: 'No prende'})).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('textbox', {name: 'Descripción de la falla'})).toHaveValue('La laptop no prende y se cae el internet.');
  next();
  await heading('Paso 4: Ubicación y horario');
  fireEvent.change(screen.getByRole('textbox', {name: 'Dirección'}), {target: {value: 'Jr. Sintético 742'}});
  next();
  await heading('Paso 5: Resumen y envío');
  fireEvent.click(screen.getByRole('checkbox', {name: 'Confirmo que el resumen es correcto'}));
  await act(async () => { next(); });
  const post = request.mock.calls.find(([path]) => path === '/orders');
  expect(post[1].items[0]).toMatchObject({subcategory_ids: [11], symptom_ids: [101]});
});

test('S05-TC-138 con 3 pedidos activos el asistente bloquea desde el inicio, con mensaje claro y enlace a Mis solicitudes [D-95]', async () => {
  routes({quota: {max: 3, active: 3, available: 0}});
  const navigate = vi.fn();
  render(<OrderWizard navigate={navigate}/>);

  const title = await heading('Ya tienes 3 pedidos activos');
  expect(title).toHaveFocus();
  expect(screen.getByText('Podrás hacer otro cuando alguno se cierre.')).toBeInTheDocument();
  expect(screen.queryByRole('checkbox')).toBeNull();
  expect(screen.queryByRole('button', {name: 'Siguiente'})).toBeNull();
  fireEvent.click(screen.getByRole('button', {name: 'Ver Mis solicitudes'}));
  expect(navigate).toHaveBeenCalledWith('requests');
  cleanup();

  routes({quota: {max: 3, active: 2, available: 1}});
  await mount();
  expect(screen.queryByRole('heading', {name: /pedidos activos/})).toBeNull();
});

test('S05-TC-139 si el cupo no se puede leer, el asistente sigue y el servidor decide al enviar', async () => {
  routes();
  const base = request.getMockImplementation();
  request.mockImplementation(async (path, ...rest) => {
    if (path === '/orders/quota') throw fail('Sin conexión', 0);
    return base(path, ...rest);
  });
  await mount();

  expect(screen.queryByRole('heading', {name: /pedidos activos/})).toBeNull();
  fireEvent.click(await checkbox('Cómputo'));
  next();
  expect(await heading('Paso 2: Subcategorías')).toBeInTheDocument();
});

test('S05-TC-140 la sugerencia del buscador agrega el trabajo a su especialidad sin límite y no lo repite', async () => {
  routes({quota: {max: 3, active: 2, available: 1}, suggestions: [
    {subcategory_id: 12, subcategory_name: 'Redes e infraestructura', specialty_id: 1, specialty_name: 'Cómputo', level: 'alta'},
  ]});
  await mount();
  await toSubcategories(['Cómputo']);
  fireEvent.click(await checkbox('Reparación de hardware'));
  fireEvent.click(screen.getByRole('button', {name: 'Atrás'}));
  await heading('Paso 1: Especialidades');
  fireEvent.change(screen.getByRole('combobox'), {target: {value: 'internet caído'}});
  fireEvent.click(await screen.findByRole('option', {name: /Redes e infraestructura/}));

  expect(await screen.findByText('Agregado: Cómputo › Redes e infraestructura.')).toBeInTheDocument();
  expect(screen.getByText('1 especialidad · 2 trabajos: Cómputo (2)')).toBeInTheDocument();
});

test('S05-TC-141 un atajo del Inicio deja la subcategoría marcada y abre el detalle de su especialidad', async () => {
  routes();
  render(<OrderWizard defaultDistrictId={1} preset={{specialty_id: 3, subcategory_id: 31}}/>);

  expect(await heading('Paso 3: Detalle por especialidad')).toBeInTheDocument();
  expect(screen.getByRole('tab', {name: /Electricidad/})).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByText('1 especialidad · 1 trabajo: Electricidad (1)')).toBeInTheDocument();
});

test('S05-TC-142 la confirmación con una sola solicitud lo dice en singular y nombra su especialidad', async () => {
  routes({order: () => ({data: {id: 9, status: 'sent', requests: [
    {id: 41, status: 'sent', specialty: {id: 1, name: 'Cómputo'}, subcategory: {id: 11, name: 'Reparación de hardware'}, subcategories: [{id: 11, name: 'Reparación de hardware'}]},
  ]}})});
  await mount();
  await toDetail(['Cómputo'], ['Reparación de hardware']);
  describeFault('La laptop no prende desde ayer en la tienda.');
  next();
  await heading('Paso 4: Ubicación y horario');
  fireEvent.change(screen.getByRole('textbox', {name: 'Dirección'}), {target: {value: 'Jr. Sintético 742'}});
  next();
  await heading('Paso 5: Resumen y envío');
  expect(screen.getByRole('note')).toHaveTextContent('Se creará 1 solicitud.');
  fireEvent.click(screen.getByRole('checkbox', {name: 'Confirmo que el resumen es correcto'}));

  await act(async () => { next(); });

  expect(await screen.findByText('Creamos 1 solicitud. Ya está buscando su técnico.')).toBeInTheDocument();
  expect(screen.getByRole('listitem')).toHaveTextContent('Cómputo');
});

test('S05-TC-143 el error se muestra en una alerta con la referencia aparte y en tamaño pequeño [D-95]', () => {
  render(<Notice error="No pudimos completar la operación. Inténtalo de nuevo. Referencia: 35cabaef-dcb0-414e-87ca-55b65e66dccd"/>);

  const alert = screen.getByRole('alert');
  expect(alert).toHaveTextContent('No pudimos completar la operación. Inténtalo de nuevo.');
  const reference = within(alert).getByText('Referencia: 35cabaef-dcb0-414e-87ca-55b65e66dccd');
  expect(reference.tagName).toBe('SMALL');
  expect(reference).toHaveClass('error-reference');
  cleanup();

  render(<Notice error="La dirección no es válida."/>);
  expect(screen.getByRole('alert')).toHaveTextContent('La dirección no es válida.');
  expect(document.querySelector('.error-reference')).toBeNull();
});

test('S05-TC-144 el aviso de error del panel no es texto rojo sobre gris: usa texto normal sobre fondo de error', () => {
  const css = readFileSync(resolve('src/features/panel/panel.css'), 'utf8').replace(/\r\n/g, '\n');
  const rule = css.match(/\.panel-shell \.error \{[^}]*\}/)[0];

  expect(rule).toContain('color: var(--ty-text)');
  expect(rule).toContain('background: var(--ty-error-bg)');
  expect(rule).not.toContain('var(--ty-raised)');
  expect(css).toMatch(/\.panel-shell \.error-reference \{[^}]*font-size/);
  const tokens = readFileSync(resolve('src/styles/tokens.css'), 'utf8').match(/--ty-error-bg:/g) || [];
  expect(tokens.length).toBeGreaterThanOrEqual(2); // tema claro y oscuro
});

test('S05-TC-145 un técnico sin descripción muestra un estado vacío, sin texto de desarrollo [DEF-57]', async () => {
  request.mockImplementation(async () => ({data: {id: 5, display_name: 'Técnico Sintético', bio: null, experience_years: 2, services: [], portfolio: [], reviews: []}}));
  render(<TechnicianProfile id={5}/>);

  expect(await screen.findByText('Este técnico aún no agregó una descripción.')).toBeInTheDocument();
  cleanup();

  request.mockImplementation(async () => ({data: {id: 5, display_name: 'Técnico Sintético', bio: 'Reparo equipos desde 2015.', experience_years: 2, services: [], portfolio: [], reviews: []}}));
  render(<TechnicianProfile id={5}/>);
  expect(await screen.findByText('Reparo equipos desde 2015.')).toBeInTheDocument();
  expect(screen.queryByText('Este técnico aún no agregó una descripción.')).toBeNull();
});
