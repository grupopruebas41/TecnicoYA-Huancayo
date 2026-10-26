import React from 'react';
import {afterEach, expect, test, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import ServicesEditor from './ServicesEditor';
import {request} from './http';
// Adelanto del Sprint 7 (D-73): los rubros declarados al registrarse quedan pendientes de tarifa (D-80).
vi.mock('./http', () => ({request: vi.fn()}));
afterEach(() => {cleanup(); vi.resetAllMocks();});

test('S07-TC-044 «Servicios y tarifas» muestra los rubros declarados pendientes de tarifa', async () => {
  request.mockImplementation(async path => (path === '/catalog/specialties'
    ? {data: [{id: 10, name: 'Cómputo'}]}
    : {data: [{id: 101, name: 'Reparación de hardware'}, {id: 102, name: 'Redes e infraestructura'}]}));
  const profile = {version: 3, services: [{subcategory_id: 102, subcategory_name: 'Redes e infraestructura', reference_fee: '60.00', rate_version: 1, active: true}],
    declared_subcategories: [
      {subcategory_id: 101, subcategory_name: 'Reparación de hardware', specialty_id: 10, specialty_name: 'Cómputo', has_rate: false},
      {subcategory_id: 102, subcategory_name: 'Redes e infraestructura', specialty_id: 10, specialty_name: 'Cómputo', has_rate: true},
    ]};
  render(<ServicesEditor profile={profile} reload={vi.fn()}/>);

  const pending = screen.getByRole('region', {name: 'Rubros pendientes de tarifa'});
  expect(within(pending).getAllByRole('heading').map(h => h.textContent)).toEqual(['Reparación de hardware']);
  expect(within(pending).getByText('Agrega tu tarifa para empezar a recibir solicitudes de este rubro.')).toBeInTheDocument();

  fireEvent.click(within(pending).getByRole('button', {name: 'Agregar tarifa de Reparación de hardware'}));

  expect(screen.getByLabelText('Tarifa de Reparación de hardware (S/)')).toHaveValue('');
  expect(screen.queryByRole('region', {name: 'Rubros pendientes de tarifa'})).not.toBeInTheDocument();
});
