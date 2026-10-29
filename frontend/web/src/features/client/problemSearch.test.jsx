import React from 'react';
import {readdirSync, readFileSync, statSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {afterEach, expect, test, vi} from 'vitest';
import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import ProblemSearch from './ProblemSearch';
import RequestWizard from '../requests/RequestWizard';
import KeywordsAdmin from '../admin/KeywordsAdmin';
import ProfileForm from '../administration/ProfileForm';
import {request} from '../administration/http';
// Buscador «¿Qué se malogró?» (D-94, RECO-01): combobox, sin resultados, chips, paso 1 del asistente, Catálogo ›
// Palabras clave, nombres en Mi perfil e íconos de línea en el panel.
vi.mock('../administration/http', () => ({request: vi.fn(), serverNow: () => Date.now()}));
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.useRealTimers(); });

const suggestion = (id, specialtyId, specialty, name) => ({subcategory_id: id, subcategory_name: name, specialty_id: specialtyId, specialty_name: specialty, score: 9});
const three = [suggestion(14, 2, 'Refrigeración comercial', 'Congeladores industriales'), suggestion(12, 2, 'Refrigeración comercial', 'Refrigeración doméstica'),
  suggestion(13, 2, 'Refrigeración comercial', 'Refrigeración comercial (vitrinas)')];
const answer = items => ({data: {source: 'keywords', level: items.length ? 'alta' : null, items}});
const box = () => screen.getByRole('combobox', {name: '¿Qué se malogró?'});

test('S05-TC-077 el buscador espera 300 ms, sugiere hasta 3 con «Más probable» y se maneja con el teclado', async () => {
  vi.useFakeTimers({toFake: ['setTimeout', 'clearTimeout']});
  request.mockResolvedValue(answer(three));
  const onSelect = vi.fn();
  render(<ProblemSearch onSelect={onSelect}/>);

  fireEvent.change(box(), {target: {value: 'mi congeladora'}});
  fireEvent.change(box(), {target: {value: 'mi congeladora no enfría'}});
  act(() => { vi.advanceTimersByTime(299); });
  expect(request).not.toHaveBeenCalled();
  await act(async () => { vi.advanceTimersByTime(1); });
  vi.useRealTimers();

  expect(request).toHaveBeenCalledTimes(1);
  expect(request).toHaveBeenCalledWith('/catalog/suggestions?q=mi+congeladora+no+enfr%C3%ADa');
  const options = await screen.findAllByRole('option');
  // Fila en dos líneas (panel propio): subcategoría y luego especialidad; «Más probable» solo en la primera.
  expect(options.map(option => option.textContent)).toEqual(['Congeladores industrialesRefrigeración comercialMás probable',
    'Refrigeración domésticaRefrigeración comercial', 'Refrigeración comercial (vitrinas)Refrigeración comercial']);
  expect(box()).toHaveAttribute('aria-expanded', 'true');
  expect(box()).toHaveAttribute('aria-activedescendant', options[0].id);

  fireEvent.keyDown(box(), {key: 'ArrowDown'});
  expect(options[1]).toHaveAttribute('aria-selected', 'true');
  fireEvent.keyDown(box(), {key: 'ArrowUp'});
  fireEvent.keyDown(box(), {key: 'ArrowUp'});
  expect(box()).toHaveAttribute('aria-activedescendant', options[2].id);
  fireEvent.keyDown(box(), {key: 'Escape'});
  expect(box()).toHaveAttribute('aria-expanded', 'false');
  fireEvent.keyDown(box(), {key: 'ArrowDown'});
  fireEvent.keyDown(box(), {key: 'Enter'});

  expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({specialty_id: 2, subcategory_id: 14}));
  expect(box()).toHaveValue('Refrigeración comercial › Congeladores industriales');
  expect(screen.getByRole('status')).toHaveTextContent('3 sugerencias.');
});

test('S05-TC-078 sin coincidencias ofrece elegir la categoría y con menos de 3 letras no consulta', async () => {
  request.mockResolvedValue(answer([]));
  const onNoMatch = vi.fn();
  render(<ProblemSearch onSelect={vi.fn()} onNoMatch={onNoMatch}/>);

  fireEvent.change(box(), {target: {value: 'ab'}});
  await act(async () => { await new Promise(done => setTimeout(done, 350)); });
  expect(request).not.toHaveBeenCalled();

  fireEvent.change(box(), {target: {value: 'el quirófano está cerrado'}});
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('No reconocimos el problema. Elige la categoría');
  expect(box()).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(within(alert).getByRole('button', {name: 'Elegir la categoría'}));
  expect(onNoMatch).toHaveBeenCalledTimes(1);
});

test('S05-TC-079 un chip rellena el buscador y muestra sus sugerencias al instante', async () => {
  request.mockResolvedValue(answer([suggestion(1, 1, 'Cómputo', 'Reparación de hardware')]));
  render(<ProblemSearch onSelect={vi.fn()} chips={['Laptop no prende', 'Internet lento']}/>);
  const chips = screen.getByRole('group', {name: 'Problemas frecuentes'});

  fireEvent.click(within(chips).getByRole('button', {name: 'Laptop no prende'}));

  expect(box()).toHaveValue('Laptop no prende');
  expect(request).toHaveBeenCalledWith('/catalog/suggestions?q=Laptop+no+prende');
  expect(await screen.findByRole('option', {name: /Reparación de hardware/})).toBeInTheDocument();
  expect(box()).toHaveFocus();
});

test('S05-TC-080 en el paso 1 del asistente, elegir una sugerencia lleva al paso 3 con especialidad y subcategoría', async () => {
  request.mockImplementation(async path => {
    if (path.startsWith('/catalog/suggestions')) return answer([suggestion(4, 1, 'Cómputo', 'Hardware')]);
    if (path === '/catalog/specialties') return {data: [{id: 1, name: 'Cómputo'}, {id: 2, name: 'Electricidad'}]};
    if (path.startsWith('/catalog/subcategories')) return {data: [{id: 4, name: 'Hardware'}]};
    if (path === '/catalog/districts') return {data: [{id: 1, name: 'Huancayo'}]};
    return {data: []};
  });
  render(<RequestWizard/>);
  const search = await screen.findByRole('combobox', {name: 'Describe el problema o elige la categoría'});

  fireEvent.change(search, {target: {value: 'la laptop no prende'}});
  fireEvent.click(await screen.findByRole('option', {name: /Hardware/}));

  expect(await screen.findByRole('heading', {name: 'Paso 3: Descripción y fotos'})).toBeInTheDocument();
  expect(screen.queryByRole('combobox')).toBeNull();
  fireEvent.click(screen.getByRole('button', {name: 'Atrás'}));
  expect(await screen.findByRole('radio', {name: 'Hardware'})).toBeChecked();
});

const specialties = [{id: 1, name: 'Cómputo', subcategories: [{id: 4, name: 'Reparación de hardware'}]}];
const keyword = {id: 7, subcategory_id: 4, subcategory_name: 'Reparación de hardware', specialty_name: 'Cómputo', phrase: 'laptop',
  normalized_phrase: 'laptop', weight: 6, kind: 'objeto', active: true, version: 1};
function adminRoutes(extra = {}) {
  request.mockImplementation(async (path, body, method) => {
    const key = `${method || 'GET'} ${path.split('?')[0]}`;
    if (extra[key]) return extra[key](path, body);
    if (path === '/admin/specialties') return {data: specialties};
    if (path.startsWith('/admin/keywords?') || path === '/admin/keywords') return {data: {items: [keyword], pagination: {page: 1, last_page: 1}}};
    if (path === '/admin/keyword-misses') return {data: [{id: 1, query: 'quirofano', count: 4, last_seen_at: '2026-10-28'}]};
    if (path === '/admin/keyword-suggestions') return {data: [{id: 5, query: 'pantallita parpadea', subcategory_id: 4,
      subcategory_name: 'Reparación de hardware', specialty_name: 'Cómputo', count: 3}]};
    return {data: {}};
  });
}

test('S05-TC-081 Palabras clave: alta con doble validación, edición con versión y desactivación con confirmación', async () => {
  const created = vi.fn(() => ({data: {...keyword, id: 8, phrase: 'no enfría'}}));
  const patched = vi.fn((path, body) => ({data: {...keyword, ...body}}));
  adminRoutes({'POST /admin/keywords': created, 'PATCH /admin/keywords/7': patched});
  render(<KeywordsAdmin/>);
  const form = await screen.findByRole('form', {name: 'Nueva frase'});
  await within(form).findByRole('option', {name: 'Cómputo › Reparación de hardware'});

  fireEvent.change(within(form).getByLabelText('Peso (1 a 10)'), {target: {value: '11'}});
  fireEvent.click(within(form).getByRole('button', {name: 'Agregar frase'}));
  expect(within(form).getByText('Elige la subcategoría.')).toBeInTheDocument();
  expect(within(form).getByText('La frase debe tener entre 2 y 120 caracteres.')).toBeInTheDocument();
  expect(within(form).getByText('El peso debe estar entre 1 y 10.')).toBeInTheDocument();
  expect(created).not.toHaveBeenCalled();

  fireEvent.change(within(form).getByLabelText('Subcategoría'), {target: {value: '4'}});
  fireEvent.change(within(form).getByLabelText('Frase'), {target: {value: '  no enfría '}});
  fireEvent.change(within(form).getByLabelText('Tipo'), {target: {value: 'sintoma'}});
  fireEvent.change(within(form).getByLabelText('Peso (1 a 10)'), {target: {value: '4'}});
  fireEvent.click(within(form).getByRole('button', {name: 'Agregar frase'}));
  expect(await screen.findByText('Agregamos la frase al diccionario.')).toBeInTheDocument();
  expect(created).toHaveBeenCalledWith('/admin/keywords', {phrase: 'no enfría', kind: 'sintoma', weight: 4, subcategory_id: 4});

  fireEvent.click(await screen.findByRole('button', {name: 'Editar laptop'}));
  const edit = screen.getByRole('form', {name: 'Editar frase'});
  fireEvent.change(within(edit).getByLabelText('Peso (1 a 10)'), {target: {value: '7'}});
  fireEvent.click(within(edit).getByRole('button', {name: 'Guardar cambios'}));
  expect(await screen.findByText('Guardamos los cambios de la frase.')).toBeInTheDocument();
  expect(patched).toHaveBeenLastCalledWith('/admin/keywords/7', {phrase: 'laptop', kind: 'objeto', weight: 7, expected_version: 1});

  fireEvent.click(await screen.findByRole('button', {name: 'Desactivar laptop'}));
  expect(patched).toHaveBeenCalledTimes(1);
  const confirm = screen.getByRole('group', {name: 'Confirmar desactivación de laptop'});
  await waitFor(() => expect(within(confirm).getByRole('button', {name: 'Sí, desactivar'})).toHaveFocus());
  fireEvent.click(within(confirm).getByRole('button', {name: 'Sí, desactivar'}));
  expect(await screen.findByText('Desactivamos la frase: ya no cuenta en el buscador.')).toBeInTheDocument();
  expect(patched).toHaveBeenLastCalledWith('/admin/keywords/7', {active: false, expected_version: 1});
});

test('S05-TC-082 Palabras clave: probar una frase, búsquedas sin resultado y aprobar o descartar sugerencias de la IA', async () => {
  const approved = vi.fn(() => ({data: {id: 5, status: 'approved'}}));
  adminRoutes({'GET /admin/keywords/test': () => ({data: {level: 'alta', items: [{subcategory_id: 4, subcategory_name: 'Reparación de hardware',
    specialty_name: 'Cómputo', score: 9, matched: ['laptop', 'no prende']}]}}), 'POST /admin/keyword-suggestions/5/approval': approved});
  render(<KeywordsAdmin/>);
  const tabs = screen.getByRole('tablist', {name: 'Vistas de palabras clave'});

  fireEvent.click(within(tabs).getByRole('tab', {name: 'Probar una frase'}));
  const test = screen.getByRole('form', {name: 'Probar una frase'});
  fireEvent.change(within(test).getByLabelText('Frase de un cliente'), {target: {value: 'mi laptop no prende'}});
  fireEvent.click(within(test).getByRole('button', {name: 'Probar'}));
  expect(await within(test).findByText('Confianza alta')).toBeInTheDocument();
  expect(test).toHaveTextContent('coincidió: laptop, no prende');
  expect(request).toHaveBeenCalledWith('/admin/keywords/test?q=mi+laptop+no+prende');

  fireEvent.click(within(tabs).getByRole('tab', {name: 'Búsquedas sin resultado'}));
  expect(await screen.findByRole('cell', {name: 'quirofano'})).toBeInTheDocument();

  fireEvent.click(within(tabs).getByRole('tab', {name: 'Frases sugeridas por IA'}));
  fireEvent.click(await screen.findByRole('button', {name: 'Aprobar «pantallita parpadea»'}));
  expect(await screen.findByText('Agregamos «pantallita parpadea» a Reparación de hardware.')).toBeInTheDocument();
  expect(approved).toHaveBeenCalledWith('/admin/keyword-suggestions/5/approval', {});
  await waitFor(() => expect(within(tabs).getByRole('tab', {name: 'Frases sugeridas por IA (1)'})).toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', {name: 'Descartar «pantallita parpadea»'}));
  expect(await screen.findByText('Descartamos «pantallita parpadea».')).toBeInTheDocument();
  expect(request).toHaveBeenCalledWith('/admin/keyword-suggestions/5', undefined, 'DELETE');
});

test('S05-TC-083 una cuenta antigua completa nombres y apellidos en Mi perfil para que el saludo los use', async () => {
  const user = {id: '5', name: 'Cliente Antiguo', given_names: null, family_names: null, phone: null, version: 3};
  const onUpdate = vi.fn();
  request.mockImplementation(async (path, body) => ({data: {...user, ...body, name: `${body.given_names} ${body.family_names}`}}));
  render(<ProfileForm user={user} onUpdate={onUpdate} onExpired={vi.fn()}/>);

  const split = screen.getByRole('group', {name: 'Completa tus nombres y apellidos (opcional)'});
  fireEvent.change(within(split).getByLabelText('Nombres'), {target: {value: 'Carla'}});
  fireEvent.click(screen.getByRole('button', {name: 'Guardar perfil'}));
  expect(await screen.findByText('Los apellidos deben tener entre 2 y 50 caracteres.')).toBeInTheDocument();
  expect(request).not.toHaveBeenCalled();

  fireEvent.change(within(split).getByLabelText('Apellidos'), {target: {value: ' Rojas '}});
  fireEvent.click(screen.getByRole('button', {name: 'Guardar perfil'}));
  expect(await screen.findByText('Cambios guardados correctamente.')).toBeInTheDocument();
  expect(request).toHaveBeenCalledWith('/me', {given_names: 'Carla', family_names: 'Rojas', phone: null, expected_version: 3}, 'PATCH');
});

test('S05-TC-084 el panel usa una sola familia de íconos de línea: no quedan emojis en sus componentes', () => {
  const pictographic = /\p{Extended_Pictographic}/u;
  const found = [];
  const walk = dir => readdirSync(dir).forEach(name => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(jsx|js)$/.test(name) && !/\.test\./.test(name)) {
      readFileSync(path, 'utf8').split(/\r?\n/).forEach((line, index) => { if (pictographic.test(line)) found.push(`${path}:${index + 1}`); });
    }
  });
  ['client', 'panel', 'matching', 'admin', 'requests', 'offers', 'realtime'].forEach(folder => walk(resolve('src/features', folder)));

  expect(found).toEqual([]);
});

test('S05-TC-085 al pasar el cursor, el botón primario del panel conserva su color en el tema claro [DEF-51]', () => {
  const panel = readFileSync(resolve('src/features/panel/panel.css'), 'utf8').replace(/\r\n/g, '\n');
  const global = readFileSync(resolve('src/styles.css'), 'utf8');
  const rule = panel.match(/\.panel-content \.primary:hover[^{]*\{[^}]*\}/)?.[0] || '';

  // La portada pinta de blanco el primario al pasar el cursor; en el tema claro su texto también es blanco.
  expect(global).toContain('.primary:hover{background:#fff}');
  expect(rule).toContain('background: var(--ty-primary)');
  expect(rule).toContain('color: var(--ty-on-accent)');
});

const panelOf = query => screen.getByRole('group', {name: `Sugerencias para «${query}»`});

test('S05-TC-086 las sugerencias se abren en un panel propio justo debajo del campo, en el flujo y antes de los chips', async () => {
  request.mockResolvedValue(answer(three));
  const onNoMatch = vi.fn();
  render(<ProblemSearch onSelect={vi.fn()} onNoMatch={onNoMatch} chips={['Laptop no prende']}/>);

  fireEvent.change(box(), {target: {value: 'mi congeladora no enfría'}});
  await screen.findAllByRole('option');
  const panel = panelOf('mi congeladora no enfría');
  const chips = screen.getByRole('group', {name: 'Problemas frecuentes'});

  // Orden en el documento: campo, panel y chips (el panel empuja hacia abajo los chips y las tarjetas).
  expect(box().compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(panel.compareDocumentPosition(chips) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const rows = within(panel).getAllByRole('option');
  expect(rows).toHaveLength(3);
  expect(within(rows[0]).getByText('Congeladores industriales').tagName).toBe('STRONG');
  expect(within(rows[0]).getByText('Más probable')).toBeInTheDocument();
  expect(within(rows[1]).queryByText('Más probable')).toBeNull();
  rows.forEach(row => expect(row.querySelectorAll('svg')).toHaveLength(2)); // ícono de la especialidad y flecha

  fireEvent.click(within(panel).getByRole('button', {name: '¿No es ninguno? Elegir categoría'}));
  expect(onNoMatch).toHaveBeenCalledTimes(1);

  // Estilos: el panel no flota ni lo recorta su tarjeta; la animación respeta prefers-reduced-motion.
  const css = readFileSync(resolve('src/features/client/client.css'), 'utf8').replace(/\r\n/g, '\n');
  const rule = css.match(/\n\.problem-search-panel \{[^}]*\}/)?.[0] || '';
  expect(rule).not.toBe('');
  expect(rule).not.toMatch(/position:\s*(absolute|fixed)/);
  expect(rule).toMatch(/animation: problem-panel-open 180ms/);
  expect(css).toMatch(/prefers-reduced-motion: reduce\) \{[^@]*\.problem-search-panel \{\s*animation: none/);
  expect(css.match(/\.client-problem-section \{[^}]*\}/)?.[0]).toContain('overflow: visible');
});

test('S05-TC-087 el panel muestra filas de carga, se recorre con el teclado y se cierra con clic fuera o al vaciar el campo', async () => {
  let resolveSearch;
  request.mockImplementation(() => new Promise(done => { resolveSearch = done; }));
  const onSelect = vi.fn();
  render(<><ProblemSearch onSelect={onSelect}/><p>Fuera del buscador</p></>);

  fireEvent.change(box(), {target: {value: 'no enfría'}});
  const panel = await waitFor(() => panelOf('no enfría'));
  const skeletons = panel.querySelectorAll('.problem-search-skeleton');
  expect(skeletons.length).toBeGreaterThanOrEqual(2);
  expect(skeletons.length).toBeLessThanOrEqual(3);
  expect(screen.getByRole('status')).toHaveTextContent('Buscando…');

  await act(async () => resolveSearch(answer(three)));
  const options = within(panelOf('no enfría')).getAllByRole('option');
  expect(panel.querySelector('.problem-search-skeleton')).toBeNull();
  fireEvent.keyDown(box(), {key: 'ArrowDown'});
  fireEvent.keyDown(box(), {key: 'ArrowDown'});
  expect(options[2]).toHaveAttribute('aria-selected', 'true');
  fireEvent.mouseDown(screen.getByText('Fuera del buscador'));
  expect(screen.queryByRole('group', {name: /Sugerencias para/})).toBeNull();
  expect(box()).toHaveAttribute('aria-expanded', 'false');

  request.mockResolvedValue(answer(three));
  fireEvent.change(box(), {target: {value: 'no enfría la vitrina'}});
  await screen.findAllByRole('option');
  fireEvent.change(box(), {target: {value: ''}});
  expect(screen.queryByRole('group', {name: /Sugerencias para/})).toBeNull();

  fireEvent.change(box(), {target: {value: 'no enfría la vitrina'}});
  await screen.findAllByRole('option');
  fireEvent.keyDown(box(), {key: 'ArrowDown'});
  fireEvent.keyDown(box(), {key: 'Enter'});
  expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({subcategory_id: 12}));
});
