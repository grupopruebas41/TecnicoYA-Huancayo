import React from 'react';
import {afterEach, expect, test, vi} from 'vitest';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import Catalog from './Catalog';
import {request} from './http';
vi.mock('./http', () => ({request: vi.fn()}));
afterEach(() => {cleanup(); vi.resetAllMocks();});
test('S01-TC-085 [TC-012] error, reintento real y subcategorías desde API', async () => {
  request.mockRejectedValueOnce({message: 'No se pudo conectar.'}).mockResolvedValueOnce({data: [{id: 1, name: 'Cómputo'}]}).mockResolvedValueOnce({data: [{id: 2, name: 'Mantenimiento'}]});
  render(<Catalog/>);
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar');
  expect(screen.queryByRole('option', {name: 'Cómputo'})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: 'Reintentar'}));
  await screen.findByRole('option', {name: 'Cómputo'});
  expect(request.mock.calls.slice(0, 2)).toEqual([['/catalog/specialties'], ['/catalog/specialties']]);
  fireEvent.change(screen.getByLabelText('Especialidad'), {target: {value: '1'}});
  await screen.findByText('Mantenimiento');
  expect(request).toHaveBeenLastCalledWith('/catalog/subcategories?specialty_id=1');
});
test('S01-TC-085 [TC-012] catálogo: especialidades vacías se comunican sin inventar datos', async () => {
  request.mockResolvedValue({data: []}); render(<Catalog/>);
  await screen.findByText('No hay especialidades disponibles.');
  expect(screen.getAllByRole('option')).toHaveLength(1);
});
