import React from 'react';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import OrderWizard from './OrderWizard';
import MyRequests from '../MyRequests';
import {request} from '../../administration/http';
// Pedido con varios rubros (D-92, PEDIDO-01): selección múltiple, límite y cupo, detalle por rubro, ubicación y
// horario, resumen con «Editar», envío atómico con clave idempotente y Mis solicitudes agrupadas por pedido.
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
const SYMPTOMS = {11: [{id: 101, name: 'No prende'}, {id: 102, name: 'Pantalla negra o rota'}], 31: [{id: 301, name: 'El tablero salta'}]};
const fail = (message, status, code) => Object.assign(new Error(message), {status, code, fields: {}});

function routes({quota = {max: 3, active: 0, available: 3, max_items: 3}, order, suggestions = []} = {}) {
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
  await heading('Paso 3: Detalle por rubro');
}
const describe = text => fireEvent.change(screen.getByRole('textbox', {name: 'Descripción de la falla'}), {target: {value: text}});
async function toSummary() {
  await toDetail(['Cómputo', 'Electricidad'], ['Reparación de hardware', 'Tableros eléctricos']);
  fireEvent.click(await screen.findByRole('button', {name: 'No prende'}));
  fireEvent.click(screen.getByRole('radio', {name: 'Urgente'}));
  describe('La laptop no prende desde ayer en la tienda.');
  fireEvent.click(screen.getByRole('tab', {name: /Tableros eléctricos/}));
  describe('El tablero salta cuando prendemos la congeladora.');
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
  expect(screen.getByText('Ningún rubro elegido · Cómputo, Electricidad')).toBeInTheDocument();
});

test('S05-TC-104 hasta 3 rubros: al llegar al límite las demás se deshabilitan con el motivo, y el cupo de D-11 lo reduce', async () => {
  routes();
  await mount();
  await toSubcategories(['Cómputo', 'Electricidad']);
  for (const name of ['Reparación de hardware', 'Redes e infraestructura', 'Recuperación de datos']) fireEvent.click(await checkbox(name));

  expect(screen.getByText('3 de 3')).toBeInTheDocument();
  const blocked = await checkbox('Tableros eléctricos');
  expect(blocked).toBeDisabled();
  expect(blocked).toHaveAttribute('aria-describedby', 'order-limit-reason');
  expect(document.getElementById('order-limit-reason')).toHaveTextContent('Puedes pedir hasta 3 rubros a la vez');
  cleanup();

  routes({quota: {max: 3, active: 1, available: 2, max_items: 3}});
  await mount();
  expect(screen.getByText('Tienes 1 solicitud activa: puedes agregar 2 rubros.')).toBeInTheDocument();
  await toSubcategories(['Cómputo']);
  expect(screen.getByText('0 de 2')).toBeInTheDocument();
  fireEvent.click(await checkbox('Reparación de hardware'));
  fireEvent.click(await checkbox('Redes e infraestructura'));
  expect(await checkbox('Recuperación de datos')).toBeDisabled();
  expect(document.getElementById('order-limit-reason')).toHaveTextContent('Tienes 1 solicitud activa: puedes agregar 2 rubros.');
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
  expect(screen.getByText('1 rubro elegido · Cómputo')).toBeInTheDocument();

  fireEvent.click(await checkbox('Cómputo'));
  dialog = screen.getByRole('dialog', {name: 'Quitar especialidad'});
  fireEvent.click(within(dialog).getByRole('button', {name: 'Confirmar'}));
  expect(await checkbox('Cómputo')).not.toBeChecked();
  expect(screen.getByText('Ningún rubro elegido')).toBeInTheDocument();
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
  expect(await heading('Paso 3: Detalle por rubro')).toHaveFocus();
});

test('S05-TC-107 paso 3: un bloque por rubro en pestañas con indicador, síntomas, validación y misma descripción para todos', async () => {
  routes();
  await mount();
  await toDetail(['Cómputo', 'Electricidad'], ['Reparación de hardware', 'Tableros eléctricos']);
  const tabs = screen.getByRole('tablist', {name: 'Rubros del pedido'});
  expect(within(tabs).getAllByRole('tab').map(tab => tab.textContent)).toEqual(['Reparación de hardware (pendiente)', 'Tableros eléctricos (pendiente)']);

  const symptom = await screen.findByRole('button', {name: 'No prende'});
  fireEvent.click(symptom);
  expect(symptom).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(within(tabs).getByRole('tab', {name: /Tableros/}));
  describe('a'.repeat(19));
  expect(screen.getByText('19/1000 caracteres')).toBeInTheDocument();
  next();
  expect(within(tabs).getByRole('tab', {name: /Reparación de hardware/})).toHaveAttribute('aria-selected', 'true');
  expect(await screen.findByText('La descripción debe tener al menos 20 caracteres.')).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole('textbox', {name: 'Descripción de la falla'})).toHaveFocus());

  describe('La laptop no prende desde ayer en la tienda.');
  fireEvent.click(screen.getByRole('checkbox', {name: 'Usar la misma descripción para todos'}));
  expect(within(tabs).getAllByRole('tab').map(tab => tab.textContent)).toEqual(['Reparación de hardware (completo)', 'Tableros eléctricos (completo)']);
  fireEvent.keyDown(within(tabs).getByRole('tab', {name: /Reparación/}), {key: 'ArrowRight'});
  expect(within(tabs).getByRole('tab', {name: /Tableros/})).toHaveFocus();
  expect(screen.getByRole('textbox', {name: 'Descripción de la falla'})).toHaveValue('La laptop no prende desde ayer en la tienda.');
  expect(screen.getByRole('button', {name: 'El tablero salta'})).toHaveAttribute('aria-pressed', 'false');
  next();
  expect(await heading('Paso 4: Ubicación y horario')).toBeInTheDocument();
});

test('S05-TC-108 fotos por rubro: arrastrar y soltar, vista previa, máximo 5 y quitar con confirmación', async () => {
  routes();
  await mount();
  await toDetail(['Cómputo'], ['Reparación de hardware']);
  const photo = name => new File(['x'], name, {type: 'image/png'});
  const zone = screen.getByText('Arrastra tus fotos aquí o elige archivos').closest('label');

  await act(async () => { fireEvent.drop(zone, {dataTransfer: {files: [photo('a.png')]}}); });
  expect(await screen.findByRole('img', {name: 'Foto 1 de Reparación de hardware'})).toHaveAttribute('src', 'blob:a.png');
  await act(async () => {
    fireEvent.change(screen.getByLabelText('Agregar fotos de Reparación de hardware'),
      {target: {files: ['b', 'c', 'd', 'e', 'f'].map(name => photo(name + '.png'))}});
  });
  expect(await screen.findByText('La solicitud admite como máximo 5 fotos.')).toBeInTheDocument();
  expect(screen.getAllByRole('img', {name: /Foto \d de Reparación de hardware/})).toHaveLength(5);
  expect(request.mock.calls.filter(([path]) => path === '/media')).toHaveLength(5);
  expect(screen.getByText('Llegaste al máximo de 5 fotos.')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', {name: 'Quitar foto 1'}));
  const dialog = screen.getByRole('dialog', {name: 'Quitar foto'});
  await act(async () => { fireEvent.click(within(dialog).getByRole('button', {name: 'Confirmar'})); });
  expect(request).toHaveBeenCalledWith('/media/501', undefined, 'DELETE');
  expect(await screen.findByText('Foto quitada.')).toBeInTheDocument();
  expect(screen.getAllByRole('img', {name: /Foto \d de Reparación de hardware/})).toHaveLength(4);
});

test('S05-TC-109 paso 4: distrito del perfil, «Lo antes posible» o fecha y franja de Lima, sin franjas que ya empezaron', async () => {
  vi.useFakeTimers({toFake: ['Date']});
  vi.setSystemTime(new Date('2026-10-20T14:00:00Z')); // 09:00 en Lima
  routes();
  await mount();
  await toDetail(['Cómputo'], ['Reparación de hardware']);
  describe('La laptop no prende desde ayer en la tienda.');
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

test('S05-TC-110 resumen: una tarjeta por rubro con «Editar» que lleva a su paso y el aviso de cuántas solicitudes se crearán', async () => {
  routes();
  await mount();
  await toSummary();

  expect(screen.getByRole('note')).toHaveTextContent('Se crearán 2 solicitudes, una por rubro, y cada una buscará su técnico.');
  const first = screen.getByRole('article', {name: 'Rubro Reparación de hardware'});
  expect(first).toHaveTextContent('Cómputo › Reparación de hardware');
  expect(first).toHaveTextContent('No prende');
  expect(first).toHaveTextContent('Urgente');
  expect(screen.getByRole('article', {name: 'Ubicación y horario'})).toHaveTextContent('Huancayo · Jr. Sintético 742');
  next();
  expect(await screen.findByText('Confirma que el resumen es correcto.')).toBeInTheDocument();
  expect(request).not.toHaveBeenCalledWith('/orders', expect.anything(), 'POST', expect.anything());

  fireEvent.click(screen.getByRole('button', {name: 'Editar Tableros eléctricos'}));
  await heading('Paso 3: Detalle por rubro');
  expect(screen.getByRole('tab', {name: /Tableros eléctricos/})).toHaveAttribute('aria-selected', 'true');
  next();
  next();
  await heading('Paso 5: Resumen y envío');
  fireEvent.click(screen.getByRole('button', {name: 'Editar ubicación y horario'}));
  expect(await heading('Paso 4: Ubicación y horario')).toHaveFocus();
});

test('S05-TC-111 envío: POST /orders con el pedido y una clave idempotente que se reutiliza al reintentar; confirma con N seguimientos', async () => {
  let calls = 0;
  routes({order: () => {
    calls += 1;
    if (calls === 1) throw fail('No pudimos confirmar el resultado.', 0);
    return {data: {id: 9, status: 'sent', requests: [{id: 41, status: 'sent', subcategory: {id: 11, name: 'Reparación de hardware'}},
      {id: 42, status: 'sent', subcategory: {id: 31, name: 'Tableros eléctricos'}}]}};
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
      {subcategory_id: 11, description: 'La laptop no prende desde ayer en la tienda.', urgency: 'urgente', brand: null, model: null, symptom_ids: [101], media_ids: []},
      {subcategory_id: 31, description: 'El tablero salta cuando prendemos la congeladora.', urgency: 'normal', brand: null, model: null, symptom_ids: [], media_ids: []},
    ]});
  expect(await screen.findByRole('heading', {name: 'Pedido enviado'})).toHaveFocus();
  expect(screen.getByText('Creamos 2 solicitudes, una por rubro. Cada una busca su técnico por separado.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: 'Ver seguimiento de la solicitud #42'}));
  expect(navigate).toHaveBeenCalledWith('requests', {open: 42});
  fireEvent.click(screen.getByRole('button', {name: 'Ir a Mis solicitudes'}));
  expect(navigate).toHaveBeenLastCalledWith('requests');
});

test('S05-TC-112 un pedido que no cabe en las solicitudes activas se rechaza entero con su mensaje y actualiza el cupo', async () => {
  const message = 'Tu pedido tiene 2 rubros y tienes 2 solicitudes activas: puedes agregar 1 como máximo (límite de 3).';
  routes({order: () => { throw fail(message, 409, 'ACTIVE_REQUEST_LIMIT'); }});
  await mount();
  await toSummary();
  fireEvent.click(screen.getByRole('checkbox', {name: 'Confirmo que el resumen es correcto'}));

  await act(async () => { next(); });

  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(screen.queryByRole('heading', {name: 'Pedido enviado'})).toBeNull();
  await waitFor(() => expect(request.mock.calls.filter(([path]) => path === '/orders/quota')).toHaveLength(2));
  expect(screen.getByRole('button', {name: 'Enviar pedido'})).toBeEnabled();
});

test('S05-TC-113 Mis solicitudes agrupa las solicitudes del mismo pedido', async () => {
  const row = (id, order, name) => ({id, order_id: order, status: 'sent', phase: 'awaiting_responses', subcategory: {id, name},
    district: {id: 1, name: 'Huancayo'}, updated_at: '2026-10-20T14:00:00Z'});
  request.mockImplementation(async path => (path === '/requests'
    ? {data: [row(42, 9, 'Tableros eléctricos'), row(41, 9, 'Reparación de hardware'), row(40, null, 'Iluminación'), row(39, 7, 'Redes')]}
    : {data: []}));
  render(<MyRequests/>);

  const order = await screen.findByRole('region', {name: 'Pedido #9'});
  expect(within(order).getByRole('heading', {name: 'Pedido #9 · 2 rubros'})).toBeInTheDocument();
  expect(within(order).getAllByRole('button', {name: /Ver solicitud/}).map(button => button.textContent)).toEqual(['Ver solicitud #42', 'Ver solicitud #41']);
  expect(screen.queryByRole('region', {name: 'Pedido #7'})).toBeNull(); // un pedido de un solo rubro no se agrupa
  expect(within(order).queryByText('Iluminación')).toBeNull();
});

test('S05-TC-114 barra inferior con resumen vivo, stepper con pasos completados y transición que respeta movimiento reducido', async () => {
  routes();
  await mount();
  await toSubcategories(['Cómputo', 'Electricidad']);
  fireEvent.click(await checkbox('Reparación de hardware'));
  fireEvent.click(await checkbox('Tableros eléctricos'));

  expect(screen.getByText('2 rubros elegidos · Cómputo, Electricidad')).toHaveAttribute('aria-live', 'polite');
  const steps = within(screen.getByRole('list', {name: 'Pasos del pedido'})).getAllByRole('listitem');
  expect(steps[0]).toHaveClass('is-done');
  expect(steps[0]).toHaveTextContent('(completado)');
  expect(steps[1]).toHaveAttribute('aria-current', 'step');
  expect(screen.getByRole('heading', {name: 'Paso 2: Subcategorías'})).toHaveFocus();
  const css = readFileSync(resolve('src/features/requests/order/order.css'), 'utf8').replace(/\r\n/g, '\n');
  expect(css).toMatch(/\.order-step \{[^}]*animation: order-in-forward 200ms/);
  expect(css).toMatch(/prefers-reduced-motion: reduce\) \{\s*\.order-step,[^}]*animation: none/);
});
