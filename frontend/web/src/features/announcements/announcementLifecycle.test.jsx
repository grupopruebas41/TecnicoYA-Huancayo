// S07-TC-105 a 108 · Bloque B (D-84) · Editar un comunicado en cualquier estado, restaurar un retirado como borrador
// y eliminarlo de forma definitiva escribiendo ELIMINAR. «Retirar» sigue como en S07-TC-094.
import React from 'react';
import {test, expect, vi, beforeEach, afterEach} from 'vitest';
import {render, screen, fireEvent, cleanup, waitFor, within} from '@testing-library/react';
import AnnouncementEditor from './AnnouncementEditor';
import AnnouncementsAdmin from '../administration/AnnouncementsAdmin';
import {request} from '../administration/http';

vi.mock('../administration/http', () => ({request: vi.fn()}));
vi.mock('./imageTools', () => ({readImage: vi.fn(), encodeCrop: vi.fn()}));

const base = {body: '', mobile_image_url: null, mobile_media_id: null, genially_url: null, link_url: null, link_label: null, retired_at: null};
const items = [
  {...base, id: 'a', title: 'Promo mantenimiento', source: 'image', kind: 'promotion', image_url: '/a.jpg', image_media_id: 11,
    alt_text: 'Promoción de mantenimiento', audiences: ['client'], positions: {client: 1}, status: 'published', phase: 'active',
    starts_at: '2026-10-26T14:00:00Z', ends_at: '2026-11-02T14:00:00Z', version: 3},
  {...base, id: 'b', title: 'Encuesta', source: 'image', kind: 'news', image_url: '/b.jpg', image_media_id: 12, alt_text: 'Encuesta del servicio',
    audiences: ['client'], positions: {client: 2}, status: 'draft', phase: 'draft', starts_at: '2026-10-27T14:00:00Z', ends_at: '2026-11-03T14:00:00Z', version: 1},
  {...base, id: 'c', title: 'Sorteo técnicos', source: 'image', kind: 'raffle', image_url: '/c.jpg', image_media_id: 13, alt_text: 'Sorteo para técnicos',
    audiences: ['technician'], positions: {technician: 1}, status: 'published', phase: 'scheduled', starts_at: '2026-11-01T14:00:00Z', ends_at: '2026-11-08T14:00:00Z', version: 2},
  {...base, id: 'e', title: 'Campaña de octubre', source: 'image', kind: 'promotion', image_url: '/e.jpg', image_media_id: 14, alt_text: 'Campaña de octubre vencida',
    audiences: ['client'], positions: {client: 3}, status: 'published', phase: 'expired', starts_at: '2026-10-01T14:00:00Z', ends_at: '2026-10-08T14:00:00Z', version: 2},
  {...base, id: 'd', title: 'Aviso viejo', source: 'image', kind: 'notice', image_url: '/d.jpg', image_media_id: 15, alt_text: 'Aviso de horario anterior',
    audiences: ['client'], positions: {client: 0}, status: 'retired', phase: 'retired', starts_at: '2026-10-01T14:00:00Z', ends_at: '2026-10-02T14:00:00Z',
    retired_at: '2026-10-02T14:00:00Z', version: 4},
];

beforeEach(() => {
  window.matchMedia = vi.fn(query => ({matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn()}));
  request.mockImplementation(async (path, body) => {
    if (path === '/admin/announcements' && !body) return {data: items};
    return {data: {id: 'n', version: 1, status: 'draft'}};
  });
});
afterEach(() => { cleanup(); vi.resetAllMocks(); });

const titles = () => screen.queryAllByRole('article').map(node => within(node).getByRole('heading').textContent);
const openMenu = title => { fireEvent.click(screen.getByRole('button', {name: `Acciones de «${title}»`})); return screen.getByRole('menu'); };
const menuItems = title => within(openMenu(title)).getAllByRole('menuitem');
const closeMenu = () => fireEvent.keyDown(screen.getByRole('menu'), {key: 'Escape'});

test('S07-TC-105 el menú ofrece Editar en todo estado y Eliminar solo en borrador, vencido y retirado; la tarjeta abre el editor', async () => {
  render(<AnnouncementsAdmin/>);
  await screen.findByRole('heading', {name: 'Promo mantenimiento'});
  expect(titles()).toEqual(['Promo mantenimiento', 'Encuesta', 'Sorteo técnicos', 'Campaña de octubre']);
  fireEvent.click(screen.getByLabelText('Mostrar retirados'));
  expect(titles()).toContain('Aviso viejo');

  const expected = {
    'Promo mantenimiento': ['Editar', 'Duplicar', 'Despublicar', 'Retirar', 'Eliminar'],
    Encuesta: ['Editar', 'Publicar', 'Duplicar', 'Retirar', 'Eliminar'],
    'Sorteo técnicos': ['Editar', 'Duplicar', 'Despublicar', 'Retirar', 'Eliminar'],
    'Campaña de octubre': ['Editar', 'Duplicar', 'Despublicar', 'Retirar', 'Eliminar'],
    'Aviso viejo': ['Editar', 'Duplicar', 'Eliminar'],
  };
  for (const [title, labels] of Object.entries(expected)) {
    const entries = menuItems(title);
    expect(entries.map(node => node.textContent)).toEqual(labels);
    const remove = entries.find(node => node.textContent === 'Eliminar');
    const blocked = ['Promo mantenimiento', 'Sorteo técnicos'].includes(title);
    expect(remove).toHaveAttribute('aria-disabled', String(blocked));
    if (blocked) expect(remove).toHaveAccessibleDescription('Despublícalo antes de eliminarlo.');
    closeMenu();
  }
  fireEvent.click(within(openMenu('Promo mantenimiento')).getByRole('menuitem', {name: 'Eliminar'}));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  closeMenu();

  fireEvent.click(screen.getByLabelText('Mostrar retirados'));
  expect(titles()).not.toContain('Aviso viejo');
  fireEvent.change(screen.getByLabelText('Filtrar por estado'), {target: {value: 'retired'}});
  expect(titles()).toEqual(['Aviso viejo']);
  fireEvent.change(screen.getByLabelText('Filtrar por estado'), {target: {value: ''}});

  fireEvent.click(screen.getByRole('article', {name: 'Campaña de octubre'}).querySelector('img'));
  expect(screen.getByRole('heading', {name: 'Editar comunicado'})).toBeInTheDocument();
  expect(screen.getByLabelText('Título interno')).toHaveValue('Campaña de octubre');
});

test('S07-TC-106 eliminar muestra miniatura y título, exige escribir ELIMINAR y borra con su versión', async () => {
  render(<AnnouncementsAdmin/>);
  await screen.findByRole('heading', {name: 'Campaña de octubre'});
  fireEvent.click(within(openMenu('Campaña de octubre')).getByRole('menuitem', {name: 'Eliminar'}));
  let dialog = screen.getByRole('dialog', {name: 'Eliminar comunicado'});
  expect(within(dialog).getByRole('img', {hidden: true})).toHaveAttribute('src', '/e.jpg');
  expect(within(dialog).getByText('Campaña de octubre')).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', {name: 'Cancelar'}));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(request).not.toHaveBeenCalledWith('/admin/announcements/e/permanent', expect.anything(), 'DELETE');

  fireEvent.click(within(openMenu('Campaña de octubre')).getByRole('menuitem', {name: 'Eliminar'}));
  dialog = screen.getByRole('dialog', {name: 'Eliminar comunicado'});
  const confirm = within(dialog).getByRole('button', {name: 'Eliminar definitivamente'});
  expect(confirm).toBeDisabled();
  fireEvent.change(within(dialog).getByLabelText('Escribe ELIMINAR para confirmar'), {target: {value: 'eliminar'}});
  expect(confirm).toBeDisabled();
  fireEvent.change(within(dialog).getByLabelText('Escribe ELIMINAR para confirmar'), {target: {value: 'ELIMINAR'}});
  expect(confirm).toBeEnabled();
  fireEvent.click(confirm);
  await waitFor(() => expect(request).toHaveBeenCalledWith('/admin/announcements/e/permanent', {expected_version: 2, confirmation: 'ELIMINAR'}, 'DELETE'));
  expect(await screen.findByText('Comunicado eliminado definitivamente.')).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  request.mockRejectedValueOnce(Object.assign(new Error('Un comunicado vigente o programado no se elimina: despublícalo primero.'), {status: 409}));
  fireEvent.click(within(openMenu('Encuesta')).getByRole('menuitem', {name: 'Eliminar'}));
  dialog = screen.getByRole('dialog', {name: 'Eliminar comunicado'});
  fireEvent.change(within(dialog).getByLabelText('Escribe ELIMINAR para confirmar'), {target: {value: 'ELIMINAR'}});
  fireEvent.click(within(dialog).getByRole('button', {name: 'Eliminar definitivamente'}));
  expect(await screen.findByText('Un comunicado vigente o programado no se elimina: despublícalo primero.')).toBeInTheDocument();
});

test('S07-TC-107 al editar un vigente avisa que los cambios se ven de inmediato y guarda con su versión', async () => {
  const onSaved = vi.fn();
  render(<AnnouncementEditor item={items[0]} onClose={vi.fn()} onSaved={onSaved}/>);
  expect(screen.getByText('Los cambios se verán de inmediato en los paneles.')).toBeInTheDocument();
  expect(screen.queryByRole('button', {name: 'Publicar'})).not.toBeInTheDocument();
  expect(screen.queryByRole('button', {name: 'Guardar borrador'})).not.toBeInTheDocument();
  expect(screen.getByText('Cambiar imagen')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Texto alternativo'), {target: {value: 'Promoción de mantenimiento con 25 %'}});
  request.mockRejectedValueOnce(Object.assign(new Error('Otro administrador cambió este contenido. Recarga para ver la versión actual.'), {status: 409}));
  fireEvent.click(screen.getByRole('button', {name: 'Guardar cambios'}));
  expect(await screen.findByText('Otro administrador cambió este contenido. Recarga para ver la versión actual.')).toBeInTheDocument();
  expect(onSaved).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Texto alternativo')).toHaveValue('Promoción de mantenimiento con 25 %');

  fireEvent.click(screen.getByRole('button', {name: 'Guardar cambios'}));
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Cambios guardados.'));
  expect(request).toHaveBeenLastCalledWith('/admin/announcements/a',
    expect.objectContaining({alt_text: 'Promoción de mantenimiento con 25 %', image_media_id: 11, expected_version: 3}), 'PATCH');
  expect(request).not.toHaveBeenCalledWith('/admin/announcements/a/publication', expect.anything());

  cleanup();
  render(<AnnouncementEditor item={items[2]} onClose={vi.fn()} onSaved={vi.fn()}/>);
  expect(screen.getByRole('button', {name: 'Guardar cambios'})).toBeInTheDocument();
  expect(screen.queryByText('Los cambios se verán de inmediato en los paneles.')).not.toBeInTheDocument();
});

test('S07-TC-108 un retirado se ve en solo lectura hasta restaurarlo como borrador, y luego se corrige y publica', async () => {
  request.mockResolvedValueOnce({data: {...items[4], status: 'draft', phase: 'draft', retired_at: null, version: 5}});
  render(<AnnouncementEditor item={items[4]} onClose={vi.fn()} onSaved={vi.fn()}/>);
  expect(screen.getByText('Este comunicado está retirado. Restáuralo como borrador para corregirlo y publicarlo de nuevo.')).toBeInTheDocument();
  expect(screen.getByLabelText('Título interno')).toBeDisabled();
  expect(screen.queryByRole('button', {name: 'Publicar'})).not.toBeInTheDocument();
  expect(screen.queryByRole('button', {name: 'Guardar cambios'})).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', {name: 'Restaurar como borrador'}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/admin/announcements/d/restoration', {expected_version: 4}));
  expect(await screen.findByText('Restaurado como borrador: ya puedes corregirlo y publicarlo.')).toBeInTheDocument();
  expect(screen.getByLabelText('Título interno')).toBeEnabled();
  expect(screen.getByRole('button', {name: 'Publicar'})).toBeInTheDocument();
  expect(screen.queryByRole('button', {name: 'Restaurar como borrador'})).not.toBeInTheDocument();
});
