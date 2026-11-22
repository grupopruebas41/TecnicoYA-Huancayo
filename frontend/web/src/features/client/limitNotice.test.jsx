import React from 'react';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {act, cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import {AlertsPage} from '../premium/PremiumPages';
import RequestSummary from '../requests/RequestSummary';
import TechnicianProfile from '../matching/TechnicianProfile';
import {isActive} from './clientRules';
import {request} from '../administration/http';

// S05-TC-415 a 419 · Revisión del #66 (Pimentel, 2026-11-22): el límite de 3 pedidos activos se avisa con un mensaje amable
// (ícono, texto y «Ver mis solicitudes») y nunca con el recuadro rojo con «Referencia», que queda para errores reales del
// servidor; «Responde en ~N min» en el perfil (D-114); el contador del menú usa los mismos estados vivos que el límite (DEF-80).
vi.mock('../administration/http', () => ({request: vi.fn(), serverNow: () => Date.parse('2026-11-22T15:00:00Z')}));
vi.mock('../requests/requestsApi', () => ({createSubmissionAttempt: () => ({send: () => request('/submit'), resetVersion: () => {}})}));
beforeEach(() => { vi.stubGlobal('matchMedia', () => ({matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()})); });
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); });

const LIMIT = 'Ya tienes 3 pedidos activos. Podrás hacer otro cuando alguno se cierre.';
const apiError = (message, status, code) => Object.assign(new Error(message), {status, code});
const limitError = () => apiError('Ya tienes 3 pedidos activos, el máximo permitido. Podrás hacer otro cuando alguno se cierre. Referencia: 16b5544d-ce20-4c0a-a1a8-de24695ea73a', 409, 'ACTIVE_REQUEST_LIMIT');
const alert = {id: 4, kind: 'maintenance', severity: 'info', message: 'Toca el mantenimiento', equipment: {id: 1, name: 'Vitrina'}, started_at: '2026-11-22T10:00:00Z',
  resolved_at: null, request_id: null};

test('S05-TC-415 Alertas: con el límite alcanzado muestra el aviso amable con «Ver mis solicitudes», sin «Referencia»', async () => {
  request.mockImplementation(async (path, body, method) => { if (method === 'POST') throw limitError(); return {data: {items: [alert]}}; });
  const navigate = vi.fn();
  render(<AlertsPage navigate={navigate}/>);
  const send = await screen.findByRole('button', {name: 'Enviar a mi técnico de confianza'});
  await act(async () => { fireEvent.click(send); });
  const notice = await screen.findByRole('status', {name: 'Límite de pedidos activos'});
  expect(notice).toHaveTextContent(LIMIT);
  expect(notice.querySelector('svg')).not.toBeNull();
  expect(screen.queryByText(/Referencia/)).toBeNull();
  expect(screen.queryByRole('alert')).toBeNull();
  fireEvent.click(within(notice).getByRole('button', {name: 'Ver mis solicitudes'}));
  expect(navigate).toHaveBeenCalledWith('requests');
});

test('S05-TC-416 Alertas: un error real del servidor sigue en el recuadro de error con su «Referencia»', async () => {
  request.mockImplementation(async (path, body, method) => { if (method === 'POST') throw apiError('Ocurrió un error en el servidor. Referencia: abc-123', 500); return {data: {items: [alert]}}; });
  render(<AlertsPage navigate={() => {}}/>);
  const send = await screen.findByRole('button', {name: 'Enviar a mi técnico de confianza'});
  await act(async () => { fireEvent.click(send); });
  expect(await screen.findByRole('alert')).toHaveTextContent('Referencia: abc-123');
  expect(screen.queryByRole('status', {name: 'Límite de pedidos activos'})).toBeNull();
});

test('S05-TC-417 asistente dirigido: al enviar con el límite alcanzado muestra el aviso amable y lleva a Mis solicitudes', async () => {
  request.mockImplementation(async path => { if (path === '/submit') throw limitError(); return {data: {id: 9, status: 'registered', version: 2}}; });
  const onRequests = vi.fn();
  render(<RequestSummary record={{id: 9, status: 'registered', version: 2, subcategory: {name: 'Vitrinas'}, district: {name: 'Huancayo'}, mode: 'asap', reference_fee: null}}
    onRequests={onRequests}/>);
  fireEvent.click(screen.getByRole('checkbox', {name: 'Confirmo que el resumen es correcto'}));
  await act(async () => { fireEvent.click(screen.getByRole('button', {name: 'Enviar solicitud'})); });
  const notice = await screen.findByRole('status', {name: 'Límite de pedidos activos'});
  expect(notice).toHaveTextContent(LIMIT);
  expect(screen.queryByText(/Referencia/)).toBeNull();
  fireEvent.click(within(notice).getByRole('button', {name: 'Ver mis solicitudes'}));
  expect(onRequests).toHaveBeenCalled();
});

test('S05-TC-418 perfil: «Responde en ~N min» o «~N h» con la mediana del servidor, y nada si no hay datos suficientes [D-114]', async () => {
  const base = {id: 7, display_name: 'Rosa Quispe', experience_years: 9, verified: true, specialties: [], rating: {average: null, count: 0}, sample_rating: null,
    availability: {available_today: false, week: []}, districts: [], portfolio: [], reviews: [], services: [{subcategory_id: 9, subcategory_name: 'Vitrinas', reference_fee: '120.00'}]};
  for (const [minutes, text] of [[3, 'Responde en ~3 min'], [90, 'Responde en ~2 h'], [null, null]]) {
    request.mockResolvedValue({data: {...base, response_minutes: minutes}});
    render(<TechnicianProfile id={7} onBack={() => {}} onRequest={() => {}}/>);
    const summary = (await screen.findByRole('button', {name: 'Solicitar servicio'})).closest('.profile-cta-bar').querySelector('.profile-cta-summary');
    if (text) expect(summary).toHaveTextContent(text);
    else expect(summary).not.toHaveTextContent('Responde en');
    cleanup();
  }
});

test('S05-TC-419 el contador del menú cuenta como activas solo las solicitudes vivas, como el límite [DEF-80]', () => {
  const row = (status, phase = null) => ({status, phase});
  const live = [row('sent', 'matching'), row('sent', 'awaiting_responses'), row('sent', 'awaiting_choice'), row('sent', 'direct_declined'),
    row('pending_availability', 'pending_availability'), row('assigned', 'assigned'), row('in_progress', 'in_progress')];
  const ended = [row('registered'), row('completed'), row('closed'), row('unrated'), row('cancelled'), row('expired'), row('expired', 'expired')];
  expect(live.map(isActive)).toEqual(live.map(() => true));
  expect(ended.map(isActive)).toEqual(ended.map(() => false));
});

test('S05-TC-420 cada subcategoría del catálogo tiene su imagen de equipo en public/img/equipos y se usan las 11 imágenes', async () => {
  const {readFileSync, readdirSync} = await import('node:fs');
  const {resolve} = await import('node:path');
  const {equipmentImage} = await import('../premium/PremiumPages');
  const codes = readFileSync(resolve('../../backend/api/database/seeders/data/catalog.csv'), 'utf8').split(/\r?\n/).slice(1).filter(Boolean).map(line => line.split(',')[1]);
  const files = readdirSync(resolve('public/img/equipos')).filter(name => name.endsWith('.webp')).map(name => name.replace('.webp', ''));
  expect(files).toHaveLength(11);
  const used = new Set();
  codes.forEach(code => { const image = equipmentImage({subcategory_code: code, name: 'Equipo'}); expect(files, code).toContain(image); used.add(image); });
  used.add(equipmentImage({subcategory_code: 'computo-hardware', name: 'Laptop de caja'}));
  expect([...used].sort()).toEqual([...files].sort());
});
