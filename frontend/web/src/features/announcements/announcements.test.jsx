// S07-TC-090 a 097 · Bloque B (D-83) · Editor en dos columnas con vista previa en vivo, selector de imagen con guía
// y recorte, listado en cuadrícula con menú y filtros, orden del carrusel por audiencia y carrusel de cliente y técnico.
import React from 'react';
import {test, expect, vi, beforeEach, afterEach} from 'vitest';
import {render, screen, fireEvent, cleanup, waitFor, within, act} from '@testing-library/react';
import AnnouncementCarousel from './AnnouncementCarousel';
import AnnouncementEditor from './AnnouncementEditor';
import AnnouncementsAdmin from '../administration/AnnouncementsAdmin';
import RoleAnnouncements from '../administration/RoleAnnouncements';
import {request} from '../administration/http';
import {readImage, encodeCrop} from './imageTools';

vi.mock('../administration/http', () => ({request: vi.fn()}));
vi.mock('./imageTools', () => ({readImage: vi.fn(), encodeCrop: vi.fn()}));

const GUIDE = 'Recomendado 1920 × 640 px (3:1), WebP o JPG hasta 600 KB. Mínimo 1440 × 480. Deja el texto importante en el 80 % central. Versión móvil opcional 1080 × 720.';
const admin = [
  {id: 'a', title: 'Promo mantenimiento', body: '', source: 'image', kind: 'promotion', image_url: '/a.jpg', image_media_id: 11, mobile_image_url: null,
    mobile_media_id: null, genially_url: null, alt_text: 'Promoción de mantenimiento', audiences: ['client', 'technician'],
    positions: {client: 1, technician: 2}, status: 'published', phase: 'active', starts_at: '2026-10-26T14:00:00Z', ends_at: '2026-11-02T14:00:00Z',
    link_url: null, link_label: null, version: 3},
  {id: 'b', title: 'Novedades', body: '', source: 'genially', kind: 'news', image_url: null, image_media_id: null, mobile_image_url: null, mobile_media_id: null,
    genially_url: 'https://view.genially.com/abc123def', alt_text: 'Presentación de novedades', audiences: ['client'], positions: {client: 2},
    status: 'draft', phase: 'draft', starts_at: '2026-10-27T14:00:00Z', ends_at: '2026-11-03T14:00:00Z', link_url: null, link_label: null, version: 1},
  {id: 'c', title: 'Sorteo técnicos', body: '', source: 'image', kind: 'raffle', image_url: '/c.jpg', image_media_id: 12, mobile_image_url: null, mobile_media_id: null,
    genially_url: null, alt_text: 'Sorteo para técnicos', audiences: ['technician'], positions: {technician: 1}, status: 'published', phase: 'scheduled',
    starts_at: '2026-11-01T14:00:00Z', ends_at: '2026-11-08T14:00:00Z', link_url: null, link_label: null, version: 2},
  {id: 'd', title: 'Aviso viejo', body: 'Texto', source: 'text', kind: null, image_url: null, image_media_id: null, mobile_image_url: null, mobile_media_id: null,
    genially_url: null, alt_text: null, audiences: ['client'], positions: {client: 0}, status: 'retired', phase: 'retired',
    starts_at: '2026-10-01T14:00:00Z', ends_at: '2026-10-02T14:00:00Z', retired_at: '2026-10-02T14:00:00Z', link_url: null, link_label: null, version: 4},
];
const slides = [
  {id: 's1', title: 'Promo', source: 'image', image_url: '/s1.jpg', mobile_image_url: '/s1-m.jpg', alt_text: 'Promoción de noviembre',
    link_url: 'https://example.test/promo', link_label: 'Ver promoción'},
  {id: 's2', title: 'Interactivo', source: 'genially', genially_url: 'https://view.genially.com/abc123def', image_url: '/s2-cover.jpg',
    alt_text: 'Presentación interactiva', link_url: null, link_label: null},
  {id: 's3', title: 'Aviso de texto', body: 'Mantenimiento el sábado', source: 'text', image_url: null, alt_text: null, link_url: null},
];

let reducedMotion = false;
beforeEach(() => {
  reducedMotion = false;
  window.matchMedia = vi.fn(query => ({matches: query.includes('reduce') && reducedMotion, media: query,
    addEventListener: vi.fn(), removeEventListener: vi.fn()}));
  request.mockImplementation(async (path, body, method) => {
    if (path === '/admin/announcements' && !body) return {data: admin};
    if (path === '/announcements') return {data: []};
    if (path === '/media') return {data: {id: 9, url: '/media/9'}};
    if (method === 'DELETE') return undefined;
    return {data: {id: 'n', version: 1, status: 'draft'}};
  });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.resetAllMocks(); Object.defineProperty(document, 'hidden', {configurable: true, value: false}); });

const card = title => screen.getByRole('heading', {name: title}).closest('article');
const radio = (group, name) => within(screen.getByRole('radiogroup', {name: group})).getByRole('radio', {name});
const fill = (label, value) => fireEvent.change(screen.getByLabelText(label), {target: {value}});
const counter = () => screen.getByTestId('carousel-counter').textContent;

test('S07-TC-090 el editor tiene secciones plegables, origen en tarjetas, audiencia y tipo seleccionables y atajos de vigencia', () => {
  const {container} = render(<AnnouncementEditor onClose={vi.fn()} onSaved={vi.fn()}/>);
  expect([...container.querySelectorAll('details > summary')].map(node => node.textContent))
    .toEqual(['1 Contenido', '2 Audiencia', '3 Vigencia y orden', '4 Enlace']);
  expect(radio('Origen del comunicado', /Imagen/)).toBeChecked();
  expect(screen.getByText(GUIDE)).toBeInTheDocument();
  expect(screen.queryByLabelText('Enlace de Genially')).not.toBeInTheDocument();

  fireEvent.click(radio('Origen del comunicado', /Genially/));
  expect(screen.getByLabelText('Enlace de Genially')).toBeInTheDocument();
  expect(screen.queryByText(GUIDE)).not.toBeInTheDocument();
  expect(screen.getByText('Imagen de portada (opcional)')).toBeInTheDocument();

  expect(within(screen.getByRole('radiogroup', {name: 'Audiencia'})).getAllByRole('radio').map(node => node.labels[0].textContent))
    .toEqual([expect.stringContaining('Solo clientes'), expect.stringContaining('Solo técnicos'), expect.stringContaining('Ambos')]);
  expect(within(screen.getByRole('radiogroup', {name: 'Tipo'})).getAllByRole('radio').map(node => node.labels[0].textContent))
    .toEqual(['Promoción', 'Sorteo', 'Novedad', 'Aviso']);

  fill('Inicio de vigencia', '2026-10-26T09:00');
  fireEvent.click(screen.getByRole('button', {name: '2 semanas'}));
  expect(screen.getByLabelText('Fin de vigencia')).toHaveValue('2026-11-09T09:00');
  fireEvent.click(screen.getByRole('button', {name: '1 mes'}));
  expect(screen.getByLabelText('Fin de vigencia')).toHaveValue('2026-11-26T09:00');

  const actions = container.querySelector('.announcement-editor-actions');
  expect(within(actions).getAllByRole('button').map(node => node.textContent)).toEqual(['Guardar borrador', 'Publicar']);
});

test('S07-TC-091 el selector de imagen muestra las medidas, rechaza las menores al mínimo y recorta a 3:1 con encuadre ajustable', async () => {
  render(<AnnouncementEditor onClose={vi.fn()} onSaved={vi.fn()}/>);
  const input = screen.getByLabelText('Imagen principal');
  readImage.mockResolvedValueOnce({width: 1200, height: 400, image: {}, url: 'blob:small'});
  fireEvent.change(input, {target: {files: [new File(['x'], 'chica.jpg', {type: 'image/jpeg'})]}});
  expect(await screen.findByRole('alert')).toHaveTextContent('La imagen mide 1200 × 400 px; el mínimo es 1440 × 480 px.');
  expect(request).not.toHaveBeenCalledWith('/media', expect.anything());

  readImage.mockResolvedValueOnce({width: 2400, height: 1350, image: {id: 'img'}, url: 'blob:wide'});
  fireEvent.change(input, {target: {files: [new File(['x'], 'ancha.jpg', {type: 'image/jpeg'})]}});
  expect(await screen.findByText(/Medidas: 2400 × 1350 px/)).toBeInTheDocument();
  expect(screen.getByText(/no está en proporción 3:1/)).toBeInTheDocument();
  expect(screen.getByLabelText('Encuadre horizontal')).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Encuadre vertical'), {target: {value: '0'}});
  encodeCrop.mockResolvedValueOnce(new Blob(['webp'], {type: 'image/webp'}));
  fireEvent.click(screen.getByRole('button', {name: 'Usar este recorte'}));
  expect(await screen.findByText('Imagen lista: 1920 × 640 px.')).toBeInTheDocument();
  expect(encodeCrop).toHaveBeenCalledWith({id: 'img'}, {x: 0, y: 0, width: 2400, height: 800}, {width: 1920, height: 640}, 600 * 1024);
  const form = request.mock.calls.find(([path]) => path === '/media')[1];
  expect(form.get('purpose')).toBe('announcement');
  expect(form.get('file').type).toBe('image/webp');

  readImage.mockResolvedValueOnce({width: 1920, height: 640, image: {}, url: 'blob:exact'});
  const exact = new File(['x'], 'exacta.jpg', {type: 'image/jpeg'});
  fireEvent.change(input, {target: {files: [exact]}});
  await waitFor(() => expect(request.mock.calls.filter(([path]) => path === '/media')).toHaveLength(2));
  expect(request.mock.calls.filter(([path]) => path === '/media')[1][1].get('file')).toBe(exact);
  expect(encodeCrop).toHaveBeenCalledTimes(1);
});

test('S07-TC-092 guarda el borrador o publica con doble validación y conserva el formulario ante un error 500', async () => {
  const onSaved = vi.fn();
  render(<AnnouncementEditor onClose={vi.fn()} onSaved={onSaved}/>);
  fireEvent.click(screen.getByRole('button', {name: 'Guardar borrador'}));
  expect(await screen.findByText('Revisa los campos indicados.')).toBeInTheDocument();
  expect(request).not.toHaveBeenCalled();

  fireEvent.click(radio('Origen del comunicado', /Genially/));
  fill('Título interno', 'Novedades de noviembre');
  fill('Enlace de Genially', 'https://view.genially.com/abc123def/novedades');
  fill('Texto alternativo', 'Presentación interactiva de las novedades');
  fireEvent.click(radio('Tipo', 'Novedad'));
  fireEvent.click(radio('Audiencia', /Ambos/));
  fill('Inicio de vigencia', '2026-10-26T09:00');
  fireEvent.click(screen.getByRole('button', {name: '1 semana'}));

  request.mockRejectedValueOnce({status: 500, message: 'No pudimos completar la operación. Referencia: ref-500'});
  fireEvent.click(screen.getByRole('button', {name: 'Guardar borrador'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Referencia: ref-500');
  expect(screen.getByLabelText('Título interno')).toHaveValue('Novedades de noviembre');
  expect(onSaved).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', {name: 'Guardar borrador'}));
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Borrador guardado.'));
  expect(request).toHaveBeenLastCalledWith('/admin/announcements', expect.objectContaining({source: 'genially', kind: 'news',
    genially_url: 'https://view.genially.com/abc123def', audiences: ['client', 'technician'], image_media_id: null}), 'POST');

  fireEvent.click(screen.getByRole('button', {name: 'Publicar'}));
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Comunicado publicado.'));
  expect(request).toHaveBeenCalledWith('/admin/announcements/n/publication', {expected_version: 1});

  cleanup();
  render(<AnnouncementEditor item={admin[1]} onClose={vi.fn()} onSaved={onSaved}/>);
  fireEvent.click(screen.getByRole('button', {name: 'Guardar borrador'}));
  await waitFor(() => expect(request).toHaveBeenLastCalledWith('/admin/announcements/b', expect.objectContaining({expected_version: 1, title: 'Novedades'}), 'PATCH'));
});

test('S07-TC-093 la vista previa en vivo muestra el carrusel como en el panel, con escritorio o móvil y la zona segura', () => {
  render(<AnnouncementEditor item={{...admin[0], status: 'draft', mobile_image_url: '/a-m.jpg', mobile_media_id: 13}} onClose={vi.fn()} onSaved={vi.fn()}/>);
  const preview = screen.getByRole('region', {name: 'Vista previa'});
  expect(within(preview).getByRole('img', {name: 'Promoción de mantenimiento'})).toHaveAttribute('src', '/a.jpg');
  expect(within(preview).getByText('Zona segura (80 %)')).toBeInTheDocument();
  fill('Texto alternativo', 'Promoción: 20 % en mantenimiento');
  expect(within(preview).getByRole('img', {name: 'Promoción: 20 % en mantenimiento'})).toBeInTheDocument();

  expect(within(preview).getByRole('button', {name: 'Escritorio'})).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(within(preview).getByRole('button', {name: 'Móvil'}));
  expect(within(preview).getByRole('button', {name: 'Móvil'})).toHaveAttribute('aria-pressed', 'true');
  expect(preview.querySelector('.carousel')).toHaveClass('is-mobile');
  expect(within(preview).getByRole('img', {name: 'Promoción: 20 % en mantenimiento'})).toHaveAttribute('src', '/a-m.jpg');
});

test('S07-TC-094 el listado es una cuadrícula con miniatura, etiquetas, estado de color, fechas, menú de acciones y filtros', async () => {
  render(<AnnouncementsAdmin/>);
  await screen.findByRole('heading', {name: 'Promo mantenimiento'});
  const promo = within(card('Promo mantenimiento'));
  expect(card('Promo mantenimiento').querySelector('img')).toHaveAttribute('src', '/a.jpg');
  expect(promo.getByText('Clientes')).toBeInTheDocument();
  expect(promo.getByText('Técnicos')).toBeInTheDocument();
  expect(promo.getByText('Promoción')).toBeInTheDocument();
  expect(promo.getByText('Vigente')).toHaveClass('announcement-phase', 'is-active');
  expect(promo.getByText(/–/)).toBeInTheDocument();
  expect(within(card('Sorteo técnicos')).getByText('Programado')).toHaveClass('is-scheduled');
  expect(within(card('Novedades')).getByText('Borrador')).toHaveClass('is-draft');

  const menu = title => { fireEvent.click(screen.getByRole('button', {name: `Acciones de «${title}»`}));
    return within(screen.getByRole('menu')).getAllByRole('menuitem').map(node => node.textContent); };
  expect(menu('Promo mantenimiento')).toEqual(['Duplicar', 'Despublicar', 'Retirar']);
  fireEvent.keyDown(screen.getByRole('menu'), {key: 'Escape'});
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  expect(menu('Novedades')).toEqual(['Editar', 'Publicar', 'Duplicar', 'Retirar']);
  fireEvent.keyDown(screen.getByRole('menu'), {key: 'Escape'});
  expect(menu('Aviso viejo')).toEqual(['Duplicar']);
  fireEvent.keyDown(screen.getByRole('menu'), {key: 'Escape'});

  menu('Promo mantenimiento');
  fireEvent.click(screen.getByRole('menuitem', {name: 'Despublicar'}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/admin/announcements/a/publication', {expected_version: 3}, 'DELETE'));
  expect(await screen.findByText('Comunicado despublicado: volvió a borrador.')).toBeInTheDocument();

  menu('Promo mantenimiento');
  fireEvent.click(screen.getByRole('menuitem', {name: 'Retirar'}));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', {name: 'Cancelar'}));
  expect(request).not.toHaveBeenCalledWith('/admin/announcements/a', undefined, 'DELETE');
  menu('Promo mantenimiento');
  fireEvent.click(screen.getByRole('menuitem', {name: 'Retirar'}));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', {name: 'Confirmar'}));
  expect(await screen.findByText('Contenido retirado.')).toBeInTheDocument();
  expect(request).toHaveBeenCalledWith('/admin/announcements/a', undefined, 'DELETE');

  const titles = () => screen.queryAllByRole('article').map(node => within(node).getByRole('heading').textContent);
  fireEvent.change(screen.getByLabelText('Filtrar por audiencia'), {target: {value: 'technician'}});
  expect(titles()).toEqual(['Promo mantenimiento', 'Sorteo técnicos']);
  fireEvent.change(screen.getByLabelText('Filtrar por estado'), {target: {value: 'scheduled'}});
  expect(titles()).toEqual(['Sorteo técnicos']);
});

test('S07-TC-095 la pestaña Orden del carrusel reordena por audiencia con botones, teclado o arrastrando y guarda el orden', async () => {
  render(<AnnouncementsAdmin/>);
  await screen.findByRole('heading', {name: 'Promo mantenimiento'});
  fireEvent.click(screen.getByRole('tab', {name: 'Orden del carrusel'}));
  const rows = () => screen.getAllByRole('listitem').map(node => node.querySelector('strong').textContent);
  expect(screen.getByRole('button', {name: 'Clientes'})).toHaveAttribute('aria-pressed', 'true');
  expect(rows()).toEqual(['Promo mantenimiento', 'Novedades']);

  fireEvent.click(screen.getByRole('button', {name: 'Bajar «Promo mantenimiento»'}));
  expect(rows()).toEqual(['Novedades', 'Promo mantenimiento']);
  fireEvent.keyDown(screen.getByRole('button', {name: 'Mover «Novedades»'}), {key: 'ArrowDown'});
  expect(rows()).toEqual(['Promo mantenimiento', 'Novedades']);
  expect(screen.getByText('«Novedades»: posición 2 de 2.')).toBeInTheDocument();

  const items = screen.getAllByRole('listitem');
  const dataTransfer = {setData: vi.fn(), getData: vi.fn(), effectAllowed: '', dropEffect: ''};
  fireEvent.dragStart(items[0], {dataTransfer});
  fireEvent.dragOver(items[1], {dataTransfer});
  fireEvent.drop(items[1], {dataTransfer});
  expect(rows()).toEqual(['Novedades', 'Promo mantenimiento']);

  fireEvent.click(screen.getByRole('button', {name: 'Guardar orden'}));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/admin/announcements/order', {audience: 'client', ids: ['b', 'a']}, 'PUT'));
  expect(await screen.findByText('Orden del carrusel guardado.')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', {name: 'Técnicos'}));
  expect(rows()).toEqual(['Sorteo técnicos', 'Promo mantenimiento']);
});

test('S07-TC-096 el carrusel rota cada 6 s (12 s con Genially) y se detiene con pausa, puntero, foco, pestaña oculta o movimiento reducido', () => {
  vi.useFakeTimers();
  const {container, unmount} = render(<AnnouncementCarousel items={slides}/>);
  const root = container.querySelector('.carousel');
  expect(counter()).toBe('1 / 3');
  expect(container.querySelector('.carousel-progress span')).toHaveStyle({animationDuration: '6000ms'});
  act(() => vi.advanceTimersByTime(5999));
  expect(counter()).toBe('1 / 3');
  act(() => vi.advanceTimersByTime(1));
  expect(counter()).toBe('2 / 3');
  expect(container.querySelector('.carousel-progress span')).toHaveStyle({animationDuration: '12000ms'});
  act(() => vi.advanceTimersByTime(6000));
  expect(counter()).toBe('2 / 3');
  act(() => vi.advanceTimersByTime(6000));
  expect(counter()).toBe('3 / 3');

  fireEvent.click(screen.getByRole('button', {name: 'Pausar rotación'}));
  act(() => vi.advanceTimersByTime(20000));
  expect(counter()).toBe('3 / 3');
  fireEvent.click(screen.getByRole('button', {name: 'Reanudar rotación'}));

  fireEvent.mouseEnter(root);
  act(() => vi.advanceTimersByTime(7000));
  expect(counter()).toBe('3 / 3');
  fireEvent.mouseLeave(root);
  act(() => vi.advanceTimersByTime(6000));
  expect(counter()).toBe('1 / 3');

  fireEvent.focus(screen.getByRole('button', {name: 'Comunicado siguiente'}));
  act(() => vi.advanceTimersByTime(7000));
  expect(counter()).toBe('1 / 3');
  fireEvent.blur(screen.getByRole('button', {name: 'Comunicado siguiente'}));

  Object.defineProperty(document, 'hidden', {configurable: true, value: true});
  act(() => { document.dispatchEvent(new Event('visibilitychange')); });
  act(() => vi.advanceTimersByTime(7000));
  expect(counter()).toBe('1 / 3');
  unmount();

  reducedMotion = true;
  Object.defineProperty(document, 'hidden', {configurable: true, value: false});
  render(<AnnouncementCarousel items={slides}/>);
  act(() => vi.advanceTimersByTime(20000));
  expect(counter()).toBe('1 / 3');
  expect(screen.getByRole('button', {name: 'Reanudar rotación'})).toBeInTheDocument();
});

test('S07-TC-097 el carrusel se maneja con flechas, teclado y deslizamiento, abre pantalla completa, enlaza la imagen y aísla Genially', async () => {
  const {container} = render(<AnnouncementCarousel items={slides}/>);
  const root = container.querySelector('.carousel');
  const link = screen.getByRole('link', {name: /Promoción de noviembre/});
  expect(link).toHaveAttribute('href', 'https://example.test/promo');
  expect(link).toHaveAttribute('target', '_blank');
  expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  expect(container.querySelector('picture source')).toHaveAttribute('srcset', '/s1-m.jpg');

  fireEvent.click(screen.getByRole('button', {name: 'Comunicado siguiente'}));
  expect(counter()).toBe('2 / 3');
  const frame = container.querySelector('iframe');
  expect(frame).toHaveAttribute('src', 'https://view.genially.com/abc123def');
  expect(frame).toHaveAttribute('title', 'Presentación interactiva');
  expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
  expect(frame).toHaveAttribute('allowfullscreen');
  expect(frame).toHaveAttribute('loading', 'lazy');
  expect(frame).toHaveAttribute('referrerpolicy', 'no-referrer');

  fireEvent.keyDown(root, {key: 'ArrowRight'});
  expect(counter()).toBe('3 / 3');
  expect(screen.getByText('Mantenimiento el sábado')).toBeInTheDocument();
  fireEvent.keyDown(root, {key: 'ArrowRight'});
  expect(counter()).toBe('1 / 3');
  fireEvent.click(screen.getByRole('button', {name: 'Comunicado anterior'}));
  expect(counter()).toBe('3 / 3');
  fireEvent.touchStart(root, {changedTouches: [{clientX: 300, clientY: 10}]});
  fireEvent.touchEnd(root, {changedTouches: [{clientX: 120, clientY: 12}]});
  expect(counter()).toBe('1 / 3');
  fireEvent.touchStart(root, {changedTouches: [{clientX: 100, clientY: 10}]});
  fireEvent.touchEnd(root, {changedTouches: [{clientX: 300, clientY: 10}]});
  expect(counter()).toBe('3 / 3');

  root.requestFullscreen = vi.fn().mockResolvedValue();
  fireEvent.click(screen.getByRole('button', {name: 'Pantalla completa'}));
  expect(root.requestFullscreen).toHaveBeenCalled();

  cleanup();
  const empty = render(<AnnouncementCarousel items={[]}/>);
  expect(empty.container).toBeEmptyDOMElement();
  empty.unmount();
  const role = render(<RoleAnnouncements/>);
  await waitFor(() => expect(request).toHaveBeenCalledWith('/announcements'));
  expect(role.container.querySelector('.carousel')).toBeNull();
  expect(screen.queryByRole('heading', {name: 'Comunicados'})).not.toBeInTheDocument();
});
