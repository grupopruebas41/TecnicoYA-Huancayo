// S07-TC-073 a 076 · Ajuste del PR #32 (A2): el catálogo del panel pasa de tarjetas a una lista compacta con
// miniatura, especialidad, tarifa, estado de color, interruptor con confirmación, filtro y buscador.
// La miniatura es decorativa (alt vacío, el nombre está al lado): se busca por su clase y no por el rol img.
import React from 'react';
import {test, expect, vi, beforeEach, afterEach} from 'vitest';
import {render, screen, fireEvent, cleanup, waitFor, within} from '@testing-library/react';
import CatalogAdmin from './CatalogAdmin';
import {request} from './http';

vi.mock('./http', () => ({request: vi.fn()}));

const specialties = [
  {id: 1, name: 'Cómputo', description: 'Equipos y redes', active: true, version: 2, image_url: '/computo.png', subcategories: [
    {id: 7, name: 'Redes', reference_fee: '50.00', image_url: '/redes.png', active: true, version: 3},
    {id: 8, name: 'Impresoras', reference_fee: null, image_url: null, active: false, version: 1},
  ]},
  {id: 2, name: 'Refrigeración', description: '', active: true, version: 1, image_url: null, subcategories: [
    {id: 9, name: 'Cámaras frigoríficas', reference_fee: '120.5', image_url: null, active: true, version: 4},
  ]},
];
const districts = [{id: 4, name: 'Huancayo', active: true, version: 2}, {id: 5, name: 'Chilca', active: false, version: 1}];

beforeEach(() => request.mockImplementation(async (path, body) => {
  if (body) return {data: {id: 7}};
  return {data: path === '/admin/specialties' ? specialties : districts};
}));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

const row = name => screen.getByRole('heading', {name}).closest('article');
async function open(tab) {
  render(<CatalogAdmin/>);
  await screen.findByRole('heading', {name: 'Cómputo'});
  if (tab) fireEvent.click(screen.getByRole('button', {name: tab}));
}

test('S07-TC-073 subcategorías en lista compacta con miniatura o marcador, especialidad, tarifa y estado de color', async () => {
  await open('Subcategorías');
  const redes = within(row('Redes'));
  expect(row('Redes').querySelector('img.catalog-thumb')).toHaveAttribute('src', '/redes.png');
  expect(redes.getByText('Cómputo')).toBeInTheDocument();
  expect(redes.getByText('Desde S/ 50.00')).toBeInTheDocument();
  expect(redes.getByText('Activo')).toHaveClass('catalog-status', 'is-active');
  expect(redes.getByRole('button', {name: 'Editar Redes'})).toHaveTextContent('Editar');

  const impresoras = within(row('Impresoras'));
  expect(row('Impresoras').querySelector('img')).toBeNull();
  expect(row('Impresoras').querySelector('.catalog-thumb.is-empty')).toHaveTextContent('I');
  expect(impresoras.getByText('Sin tarifa')).toBeInTheDocument();
  expect(impresoras.getByText('Inactivo')).toHaveClass('catalog-status', 'is-inactive');

  expect(within(row('Cámaras frigoríficas')).getByText('Desde S/ 120.50')).toBeInTheDocument();
  expect(within(row('Cámaras frigoríficas')).getByText('Refrigeración')).toBeInTheDocument();
});

test('S07-TC-074 filtra las subcategorías por especialidad y busca por nombre sin distinguir tildes', async () => {
  await open('Subcategorías');
  const names = () => screen.queryAllByRole('article').map(item => within(item).getByRole('heading').textContent);
  expect(names()).toEqual(['Redes', 'Impresoras', 'Cámaras frigoríficas']);

  fireEvent.change(screen.getByLabelText('Filtrar por especialidad'), {target: {value: '2'}});
  expect(names()).toEqual(['Cámaras frigoríficas']);
  fireEvent.change(screen.getByLabelText('Filtrar por especialidad'), {target: {value: ''}});

  fireEvent.change(screen.getByLabelText('Buscar subcategorías'), {target: {value: 'camaras'}});
  expect(names()).toEqual(['Cámaras frigoríficas']);
  fireEvent.change(screen.getByLabelText('Buscar subcategorías'), {target: {value: 'RED'}});
  expect(names()).toEqual(['Redes']);
  expect(screen.getByText('1 de 3')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Buscar subcategorías'), {target: {value: 'zzz'}});
  expect(names()).toEqual([]);
  expect(screen.getByText('Ninguna subcategoría coincide con la búsqueda.')).toBeInTheDocument();
});

test('S07-TC-075 el interruptor de estado pide confirmación: cancelar no envía y confirmar guarda con versión', async () => {
  await open('Subcategorías');
  const toggle = within(row('Redes')).getByRole('switch', {name: 'Estado de Redes'});
  expect(toggle).toHaveAttribute('aria-checked', 'true');

  fireEvent.click(toggle);
  const dialog = screen.getByRole('dialog', {name: 'Desactivar subcategoría'});
  expect(dialog).toHaveTextContent('«Redes» dejará de mostrarse');
  fireEvent.click(within(dialog).getByRole('button', {name: 'Cancelar'}));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(request.mock.calls.some(([, body]) => body)).toBe(false);

  fireEvent.click(toggle);
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', {name: 'Confirmar'}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/admin/subcategories/7', {active: false, expected_version: 3}, 'PATCH'));
  expect(await within(row('Redes')).findByText('Cambios guardados.')).toBeInTheDocument();

  request.mockImplementationOnce(async () => { throw {status: 409, message: 'Otro administrador cambió este registro.'}; });
  fireEvent.click(within(row('Impresoras')).getByRole('switch', {name: 'Estado de Impresoras'}));
  fireEvent.click(within(screen.getByRole('dialog', {name: 'Activar subcategoría'})).getByRole('button', {name: 'Confirmar'}));
  expect(await within(row('Impresoras')).findByRole('alert')).toHaveTextContent('Otro administrador cambió este registro.');
});

test('S07-TC-076 especialidades conservan su foto y distritos usan la misma lista sin miniatura', async () => {
  await open();
  expect(row('Cómputo').querySelector('img.catalog-thumb')).toHaveAttribute('src', '/computo.png');
  expect(within(row('Cómputo')).getByText('2 subcategorías')).toBeInTheDocument();
  expect(row('Refrigeración').querySelector('.catalog-thumb.is-empty')).toHaveTextContent('R');
  expect(within(row('Refrigeración')).getByText('1 subcategoría')).toBeInTheDocument();
  expect(screen.queryByLabelText('Filtrar por especialidad')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Buscar especialidades'), {target: {value: 'refri'}});
  expect(screen.getAllByRole('article')).toHaveLength(1);

  fireEvent.click(screen.getByRole('button', {name: 'Distritos'}));
  expect(screen.getAllByRole('article')).toHaveLength(2);
  expect(row('Chilca').querySelector('.catalog-thumb')).toBeNull();
  expect(within(row('Chilca')).getByText('Inactivo')).toHaveClass('is-inactive');
  expect(within(row('Chilca')).getByRole('switch', {name: 'Estado de Chilca'})).toHaveAttribute('aria-checked', 'false');
  expect(within(row('Huancayo')).getByRole('button', {name: 'Editar Huancayo'})).toBeInTheDocument();
});
