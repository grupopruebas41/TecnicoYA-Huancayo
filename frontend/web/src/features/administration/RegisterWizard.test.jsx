import React from 'react';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import SessionForm from './SessionForm';
import AccountApp from './AccountApp';
import {passwordStrength} from './registration';
import {request} from './http';
import {setAuthIntent} from '../../landing/config';
// Adelanto del Sprint 7 (D-73): registro en 2 pasos (D-80) y recuperación de contraseña.
vi.mock('./Sprint02Portal', () => ({default: () => null}));
vi.mock('./http', () => ({request: vi.fn()}));

const districts = [{id: 1, code: 'HUANCAYO', name: 'Huancayo'}, {id: 2, code: 'EL-TAMBO', name: 'El Tambo'}, {id: 3, code: 'CHILCA', name: 'Chilca'}];
const specialties = [{id: 10, code: 'computo', name: 'Cómputo'}, {id: 11, code: 'electricidad', name: 'Electricidad'}];
// Rubros por especialidad (GET /catalog/subcategories?specialty_id=).
const rubros = {
  10: [{id: 101, name: 'Reparación de hardware'}, {id: 102, name: 'Redes e infraestructura'}, {id: 103, name: 'Recuperación de datos'}],
  11: [{id: 201, name: 'Tableros eléctricos'}, {id: 202, name: 'Iluminación'}],
};
const catalogRoute = path => {
  if (path === '/catalog/districts') return {data: districts};
  if (path === '/catalog/specialties') return {data: specialties};
  const rubro = path.match(/^\/catalog\/subcategories\?specialty_id=(\d+)$/);
  return rubro ? {data: rubros[rubro[1]].map(item => ({...item, specialty_id: Number(rubro[1])}))} : null;
};
let submitted;

beforeEach(() => {
  submitted = [];
  request.mockImplementation(async (path, body) => {
    if (body === undefined && catalogRoute(path)) return catalogRoute(path);
    if (body !== undefined) { submitted.push([path, body]); return {data: {id: '9'}}; }
    throw {status: 401, message: 'Tu sesión no está activa.'};
  });
});
afterEach(() => {cleanup(); vi.resetAllMocks(); window.history.replaceState(null, '', '/');});

async function openWizard(role) {
  setAuthIntent('register', role);
  render(<SessionForm onLogin={vi.fn()}/>);
  if (role) fireEvent.click(screen.getByRole('button', {name: 'Continuar'}));
  if (role) await screen.findByRole('heading', {name: 'Tus datos'});
}
const type = (label, value) => fireEvent.change(screen.getByLabelText(label), {target: {value}});
const leave = label => fireEvent.blur(screen.getByLabelText(label));

function fillCommon() {
  type('Nombres', 'Ana Lucía'); type('Apellidos', 'Quispe Rojas');
  type('Correo', 'ana@example.test'); type('Teléfono', '987654321');
  type('Contraseña', 'Sintetica-123!'); type('Confirmar contraseña', 'Sintetica-123!');
  fireEvent.click(screen.getByRole('checkbox', {name: /Acepto los Términos y la Privacidad/}));
}

test('S07-TC-017 el paso 1 pregunta quién eres con dos tarjetas y un indicador 1 de 2', () => {
  // Desde el botón del panel no hay rol previo; los botones de la landing sí lo traen (setAuthIntent).
  render(<SessionForm onLogin={vi.fn()}/>);
  fireEvent.click(screen.getByRole('button', {name: 'Crear una cuenta ↗'}));

  expect(screen.getByText('Paso 1 de 2')).toBeInTheDocument();
  expect(screen.getByRole('heading', {name: '¿Quién eres?'})).toBeInTheDocument();
  const client = screen.getByRole('radio', {name: /Necesito un técnico/});
  const technician = screen.getByRole('radio', {name: /Soy técnico/});
  expect(client).not.toBeChecked(); expect(technician).not.toBeChecked();
  expect(screen.getByRole('button', {name: 'Continuar'})).toBeDisabled();

  fireEvent.click(technician);
  expect(technician).toBeChecked();
  expect(screen.getByRole('button', {name: 'Continuar'})).toBeEnabled();
});

test('S07-TC-018 el cliente ve distrito del catálogo, tipo y razón social solo si es MYPE', async () => {
  await openWizard('client');

  expect(screen.getByText('Paso 2 de 2')).toBeInTheDocument();
  const district = await screen.findByLabelText('Distrito principal');
  expect(within(district).getAllByRole('option').map(o => o.textContent)).toEqual(['Elige tu distrito', 'Huancayo', 'El Tambo', 'Chilca']);
  expect(screen.queryByLabelText('Razón social (opcional)')).not.toBeInTheDocument();
  type('Tipo de cliente', 'mype');
  expect(screen.getByLabelText('Razón social (opcional)')).toBeInTheDocument();
  expect(screen.getByLabelText('Dirección de referencia (opcional)')).toBeInTheDocument();
  expect(screen.queryByLabelText('Distrito base')).not.toBeInTheDocument();
});

test('S07-TC-019 el técnico declara distrito base, distritos que atiende, especialidades y experiencia', async () => {
  await openWizard('technician');

  type('Distrito base', '2');
  const served = screen.getByRole('group', {name: 'Distritos que atiendes'});
  expect(within(served).getByRole('checkbox', {name: 'El Tambo'})).toBeChecked();
  expect(within(served).getByRole('checkbox', {name: 'El Tambo'})).toBeDisabled();
  expect(within(screen.getByRole('group', {name: 'Especialidades que ofreces'})).getAllByRole('checkbox').map(c => c.closest('label').textContent))
    .toEqual(['Cómputo', 'Electricidad']);
  expect(screen.getByLabelText('Años de experiencia')).toHaveAttribute('max', '50');
  expect(screen.getByLabelText('WhatsApp (opcional)')).toBeInTheDocument();
  expect(screen.queryByLabelText('Tipo de cliente')).not.toBeInTheDocument();
});

test('S07-TC-020 valida en vivo cada campo al salir de él y limpia el error al corregirlo', async () => {
  await openWizard('client');

  type('Teléfono', '98765432'); leave('Teléfono');
  expect(screen.getByLabelText('Teléfono')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByText('El teléfono debe tener 9 dígitos y empezar en 9.')).toBeInTheDocument();
  type('Teléfono', '987654321');
  expect(screen.getByLabelText('Teléfono')).toHaveAttribute('aria-invalid', 'false');
  expect(screen.queryByText('El teléfono debe tener 9 dígitos y empezar en 9.')).not.toBeInTheDocument();

  type('Nombres', 'A'); leave('Nombres');
  expect(screen.getByText('Los nombres deben tener entre 2 y 50 caracteres.')).toBeInTheDocument();
});

test('S07-TC-021 el medidor de seguridad de la contraseña sube con longitud y variedad', async () => {
  expect(passwordStrength('').label).toBe('');
  expect(passwordStrength('abc').label).toBe('Débil');
  expect(passwordStrength('abcdefgh1').label).toBe('Aceptable');
  expect(passwordStrength('Abcdefgh12').label).toBe('Buena');
  expect(passwordStrength('Abcdefgh12!x').label).toBe('Fuerte');

  await openWizard('client');
  type('Contraseña', 'Abcdefgh12!x');
  expect(screen.getByRole('meter', {name: 'Seguridad de la contraseña'})).toHaveAttribute('aria-valuenow', '5');
  expect(screen.getByText('Seguridad: Fuerte')).toBeInTheDocument();
});

test('S07-TC-022 volver al paso 1 no pierde lo escrito', async () => {
  await openWizard('client');
  type('Nombres', 'Ana Lucía'); type('Teléfono', '987654321');

  fireEvent.click(screen.getByRole('button', {name: 'Atrás'}));
  expect(screen.getByRole('radio', {name: /Necesito un técnico/})).toBeChecked();
  fireEvent.click(screen.getByRole('button', {name: 'Continuar'}));

  expect(await screen.findByLabelText('Nombres')).toHaveValue('Ana Lucía');
  expect(screen.getByLabelText('Teléfono')).toHaveValue('987654321');
});

test('S07-TC-023 la casilla de Términos es obligatoria y abre el texto vigente', async () => {
  await openWizard('client');
  await screen.findByLabelText('Distrito principal');
  type('Nombres', 'Ana Lucía'); type('Apellidos', 'Quispe Rojas'); type('Correo', 'ana@example.test');
  type('Teléfono', '987654321'); type('Distrito principal', '1');
  type('Contraseña', 'Sintetica-123!'); type('Confirmar contraseña', 'Sintetica-123!');

  fireEvent.click(screen.getByRole('button', {name: 'Crear cuenta'}));
  expect(screen.getByText('Debes aceptar los Términos y la Privacidad.')).toBeInTheDocument();
  expect(submitted).toEqual([]);

  fireEvent.click(screen.getByRole('button', {name: 'Leer Términos y Privacidad'}));
  const dialog = screen.getByRole('dialog', {name: 'Términos y Privacidad'});
  expect(dialog).toHaveTextContent('Versión académica MVP');
  expect(dialog).toHaveTextContent('Las evidencias son privadas');
  fireEvent.click(within(dialog).getByRole('button', {name: 'Cerrar'}));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('S07-TC-024 el cliente envía solo sus campos y queda listo para iniciar sesión', async () => {
  await openWizard('client');
  await screen.findByLabelText('Distrito principal');
  fillCommon(); type('Distrito principal', '1'); type('Tipo de cliente', 'mype'); type('Razón social (opcional)', 'Bodega Sintética');

  fireEvent.click(screen.getByRole('button', {name: 'Crear cuenta'}));

  await waitFor(() => expect(submitted).toHaveLength(1));
  expect(submitted[0]).toEqual(['/auth/register', {
    account_type: 'client', given_names: 'Ana Lucía', family_names: 'Quispe Rojas', email: 'ana@example.test',
    phone: '987654321', password: 'Sintetica-123!', password_confirmation: 'Sintetica-123!', terms_accepted: true,
    district_id: 1, client_type: 'mype', business_name: 'Bodega Sintética',
  }]);
  expect(await screen.findByText(/Cuenta creada correctamente/)).toBeInTheDocument();
  expect(screen.getByRole('heading', {name: 'Iniciar sesión'})).toBeInTheDocument();
});

test('S07-TC-025 el técnico envía distritos con el base, especialidades y años, y queda pendiente de verificación', async () => {
  await openWizard('technician');
  await screen.findByLabelText('Distrito base');
  fillCommon(); type('Distrito base', '2'); type('Años de experiencia', '4');
  fireEvent.click(screen.getByRole('checkbox', {name: 'Huancayo'}));
  fireEvent.click(screen.getByRole('checkbox', {name: 'Cómputo'}));
  fireEvent.click(await screen.findByRole('checkbox', {name: 'Reparación de hardware'}));

  fireEvent.click(screen.getByRole('button', {name: 'Crear cuenta'}));

  await waitFor(() => expect(submitted).toHaveLength(1));
  expect(submitted[0][1]).toEqual({
    account_type: 'technician', given_names: 'Ana Lucía', family_names: 'Quispe Rojas', email: 'ana@example.test',
    phone: '987654321', password: 'Sintetica-123!', password_confirmation: 'Sintetica-123!', terms_accepted: true,
    base_district_id: 2, district_ids: [2, 1], specialty_ids: [10], subcategory_ids: [101], experience_years: 4,
  });
  expect(await screen.findByText(/Tu cuenta quedó pendiente de verificación. Sube tus documentos desde tu panel./)).toBeInTheDocument();
});

test('S07-TC-026 sin especialidad el técnico no envía y los errores del servidor se muestran en su campo', async () => {
  await openWizard('technician');
  await screen.findByLabelText('Distrito base');
  fillCommon(); type('Distrito base', '2'); type('Años de experiencia', '4');

  fireEvent.click(screen.getByRole('button', {name: 'Crear cuenta'}));
  expect(screen.getByText('Elige al menos una especialidad.')).toBeInTheDocument();
  expect(submitted).toEqual([]);

  request.mockImplementation(async (path, body) => {
    if (!body && catalogRoute(path)) return catalogRoute(path);
    if (body) throw {status: 422, message: 'Revisa los campos indicados.', fields: {email: ['El correo ya está registrado.']}};
    throw {status: 401};
  });
  fireEvent.click(screen.getByRole('checkbox', {name: 'Cómputo'}));
  fireEvent.click(await screen.findByRole('checkbox', {name: 'Redes e infraestructura'}));
  fireEvent.click(screen.getByRole('button', {name: 'Crear cuenta'}));

  expect(await screen.findByText('El correo ya está registrado.')).toBeInTheDocument();
  expect(screen.getByLabelText('Correo')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByText('Paso 2 de 2')).toBeInTheDocument();
});

test('S07-TC-027 «¿Olvidaste tu contraseña?» pide el correo y responde siempre de forma neutra', async () => {
  render(<SessionForm onLogin={vi.fn()}/>);
  fireEvent.click(screen.getByRole('button', {name: '¿Olvidaste tu contraseña?'}));
  expect(screen.getByRole('heading', {name: 'Recupera tu acceso'})).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', {name: 'Enviar enlace'}));
  expect(screen.getByText('Ingresa un correo válido.')).toBeInTheDocument();
  expect(submitted).toEqual([]);

  request.mockImplementation(async (path, body) => { submitted.push([path, body]); return {data: {message: 'Si el correo existe, te enviamos un enlace para restablecer tu contraseña.'}}; });
  type('Correo', 'Ana@Example.test ');
  fireEvent.click(screen.getByRole('button', {name: 'Enviar enlace'}));

  expect(await screen.findByText('Si el correo existe, te enviamos un enlace para restablecer tu contraseña.')).toBeInTheDocument();
  expect(submitted).toEqual([['/auth/password/forgot', {email: 'ana@example.test'}]]);
  fireEvent.click(screen.getByRole('button', {name: 'Volver a iniciar sesión'}));
  expect(screen.getByRole('heading', {name: 'Iniciar sesión'})).toBeInTheDocument();
});

test('S07-TC-028 el enlace abre la pantalla de nueva contraseña con medidor y la guarda', async () => {
  window.history.replaceState(null, '', '/#cuenta/restablecer?token=abc123&email=ana%40example.test');
  render(<AccountApp/>);
  expect(await screen.findByRole('heading', {name: 'Elige una nueva contraseña'})).toBeInTheDocument();
  expect(window.location.hash).toBe('#cuenta/restablecer?token=abc123&email=ana%40example.test');

  type('Nueva contraseña', 'Abcdefgh12!x'); type('Confirmar contraseña', 'otra');
  expect(screen.getByText('Seguridad: Fuerte')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: 'Guardar contraseña'}));
  expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument();
  expect(submitted).toEqual([]);

  type('Confirmar contraseña', 'Abcdefgh12!x');
  request.mockImplementation(async (path, body) => { submitted.push([path, body]); return {data: {message: 'Tu contraseña se actualizó. Inicia sesión con la nueva contraseña.'}}; });
  fireEvent.click(screen.getByRole('button', {name: 'Guardar contraseña'}));

  expect(await screen.findByText('Tu contraseña se actualizó. Inicia sesión con la nueva contraseña.')).toBeInTheDocument();
  expect(submitted).toEqual([['/auth/password/reset', {email: 'ana@example.test', token: 'abc123', password: 'Abcdefgh12!x', password_confirmation: 'Abcdefgh12!x'}]]);
  expect(screen.getByRole('link', {name: 'Ir a iniciar sesión'})).toHaveAttribute('href', '#cuenta');
});

test('S07-TC-029 un enlace vencido o usado muestra el error y ofrece pedir otro', async () => {
  window.history.replaceState(null, '', '/#cuenta/restablecer?token=viejo&email=ana%40example.test');
  render(<AccountApp/>);
  await screen.findByRole('heading', {name: 'Elige una nueva contraseña'});
  request.mockImplementation(async () => { throw {status: 422, message: 'Revisa los campos indicados.', fields: {token: ['El enlace no es válido o venció. Pide uno nuevo.']}}; });

  type('Nueva contraseña', 'Abcdefgh12!x'); type('Confirmar contraseña', 'Abcdefgh12!x');
  await act(async () => { fireEvent.click(screen.getByRole('button', {name: 'Guardar contraseña'})); });

  expect(screen.getByRole('alert')).toHaveTextContent('El enlace no es válido o venció. Pide uno nuevo.');
  expect(screen.getByRole('link', {name: 'Pedir un enlace nuevo'})).toHaveAttribute('href', '#cuenta');
});

// Selección en dos niveles: especialidad → rubros (D-80, ajuste del PR #31).
async function technicianStep2() {
  await openWizard('technician');
  await screen.findByLabelText('Distrito base');
}
const panelOf = name => screen.getByRole('group', {name: `Rubros de ${name} en los que trabajas`});

test('S07-TC-036 marcar una especialidad despliega sus rubros reales y enfoca el primero', async () => {
  await technicianStep2();
  const computo = screen.getByRole('checkbox', {name: 'Cómputo'});
  expect(computo).toHaveAttribute('aria-expanded', 'false');

  fireEvent.click(computo);

  expect(computo).toHaveAttribute('aria-expanded', 'true');
  const first = await screen.findByRole('checkbox', {name: 'Reparación de hardware'});
  expect(request).toHaveBeenCalledWith('/catalog/subcategories?specialty_id=10');
  expect(within(panelOf('Cómputo')).getAllByRole('checkbox').map(c => c.closest('label').textContent))
    .toEqual(['Reparación de hardware', 'Redes e infraestructura', 'Recuperación de datos']);
  await waitFor(() => expect(first).toHaveFocus());
  expect(document.getElementById(computo.getAttribute('aria-controls'))).toContainElement(panelOf('Cómputo'));
});

test('S07-TC-037 el buscador filtra los rubros por nombre sin perder los elegidos', async () => {
  await technicianStep2();
  fireEvent.click(screen.getByRole('checkbox', {name: 'Cómputo'}));
  fireEvent.click(await screen.findByRole('checkbox', {name: 'Reparación de hardware'}));
  const panel = panelOf('Cómputo');

  fireEvent.change(within(panel).getByRole('searchbox', {name: 'Buscar rubro de Cómputo'}), {target: {value: 'recu'}});
  expect(within(panel).getAllByRole('checkbox').map(c => c.closest('label').textContent)).toEqual(['Recuperación de datos']);
  expect(within(panel).getByText('1 de 3 seleccionadas')).toBeInTheDocument();

  fireEvent.change(within(panel).getByRole('searchbox'), {target: {value: 'plomería'}});
  expect(within(panel).getByText('Ningún rubro coincide con «plomería».')).toBeInTheDocument();
  fireEvent.change(within(panel).getByRole('searchbox'), {target: {value: ''}});
  expect(within(panel).getByRole('checkbox', {name: 'Reparación de hardware'})).toBeChecked();
});

test('S07-TC-038 «Seleccionar todas» y «Quitar todas» actualizan el contador', async () => {
  await technicianStep2();
  fireEvent.click(screen.getByRole('checkbox', {name: 'Cómputo'}));
  await screen.findByRole('checkbox', {name: 'Redes e infraestructura'});
  const panel = panelOf('Cómputo');
  expect(within(panel).getByText('0 de 3 seleccionadas')).toBeInTheDocument();

  fireEvent.click(within(panel).getByRole('button', {name: 'Seleccionar todas'}));
  expect(within(panel).getByText('3 de 3 seleccionadas')).toBeInTheDocument();
  expect(within(panel).getAllByRole('checkbox').every(c => c.checked)).toBe(true);

  fireEvent.click(within(panel).getByRole('button', {name: 'Quitar todas'}));
  expect(within(panel).getByText('0 de 3 seleccionadas')).toBeInTheDocument();
  expect(within(panel).getByText('Elige al menos un rubro de Cómputo.')).toBeInTheDocument();
});

test('S07-TC-039 una especialidad sin rubros muestra su error y no deja enviar', async () => {
  await technicianStep2();
  fillCommon(); type('Distrito base', '2'); type('Años de experiencia', '4');
  fireEvent.click(screen.getByRole('checkbox', {name: 'Cómputo'}));
  fireEvent.click(await screen.findByRole('checkbox', {name: 'Redes e infraestructura'}));
  fireEvent.click(screen.getByRole('checkbox', {name: 'Electricidad'}));
  await screen.findByRole('checkbox', {name: 'Iluminación'});

  fireEvent.click(screen.getByRole('button', {name: 'Crear cuenta'}));

  expect(within(panelOf('Electricidad')).getByText('Elige al menos un rubro de Electricidad.')).toBeInTheDocument();
  expect(within(panelOf('Cómputo')).queryByText(/Elige al menos un rubro/)).not.toBeInTheDocument();
  expect(submitted).toEqual([]);
});

test('S07-TC-040 desmarcar una especialidad con rubros pide confirmación y luego los limpia', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
  await technicianStep2();
  const computo = screen.getByRole('checkbox', {name: 'Cómputo'});
  fireEvent.click(computo);
  fireEvent.click(await screen.findByRole('checkbox', {name: 'Redes e infraestructura'}));

  fireEvent.click(computo);
  expect(confirm).toHaveBeenCalledWith('Se quitará 1 rubro elegido de Cómputo. ¿Continuar?');
  expect(computo).toBeChecked();
  expect(screen.getByRole('checkbox', {name: 'Redes e infraestructura'})).toBeChecked();

  fireEvent.click(computo);
  expect(computo).not.toBeChecked();
  expect(screen.queryByRole('group', {name: /Rubros de Cómputo/})).not.toBeInTheDocument();
  fireEvent.click(computo);
  expect(await screen.findByRole('checkbox', {name: 'Redes e infraestructura'})).not.toBeChecked();
  confirm.mockRestore();
});

test('S07-TC-041 el resumen cuenta rubros y especialidades y el envío incluye los rubros', async () => {
  await technicianStep2();
  fillCommon(); type('Distrito base', '2'); type('Años de experiencia', '4');
  fireEvent.click(screen.getByRole('checkbox', {name: 'Cómputo'}));
  await screen.findByRole('checkbox', {name: 'Reparación de hardware'});
  fireEvent.click(within(panelOf('Cómputo')).getByRole('button', {name: 'Seleccionar todas'}));
  expect(screen.getByText('Ofrecerás 3 rubros en 1 especialidad')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox', {name: 'Electricidad'}));
  fireEvent.click(await screen.findByRole('checkbox', {name: 'Tableros eléctricos'}));
  expect(screen.getByText('Ofrecerás 4 rubros en 2 especialidades')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', {name: 'Crear cuenta'}));

  await waitFor(() => expect(submitted).toHaveLength(1));
  expect(submitted[0][1]).toMatchObject({specialty_ids: [10, 11], subcategory_ids: [101, 102, 103, 201]});
});

test('S07-TC-042 volver con «Atrás» conserva especialidades y rubros elegidos', async () => {
  await technicianStep2();
  fireEvent.click(screen.getByRole('checkbox', {name: 'Cómputo'}));
  fireEvent.click(await screen.findByRole('checkbox', {name: 'Recuperación de datos'}));

  fireEvent.click(screen.getByRole('button', {name: 'Atrás'}));
  fireEvent.click(screen.getByRole('button', {name: 'Continuar'}));

  expect(await screen.findByRole('checkbox', {name: 'Cómputo'})).toBeChecked();
  expect(screen.getByRole('checkbox', {name: 'Recuperación de datos'})).toBeChecked();
  expect(screen.getByText('Ofrecerás 1 rubro en 1 especialidad')).toBeInTheDocument();
});

test('S07-TC-043 si no cargan los rubros se informa el error y se puede reintentar', async () => {
  let fail = true;
  request.mockImplementation(async (path, body) => {
    if (path.startsWith('/catalog/subcategories') && fail) throw {status: 0, message: 'Sin conexión'};
    if (body === undefined && catalogRoute(path)) return catalogRoute(path);
    throw {status: 401};
  });
  await technicianStep2();
  fireEvent.click(screen.getByRole('checkbox', {name: 'Electricidad'}));

  expect(await within(panelOf('Electricidad')).findByRole('alert')).toHaveTextContent('No pudimos cargar los rubros de Electricidad.');
  fail = false;
  fireEvent.click(within(panelOf('Electricidad')).getByRole('button', {name: 'Reintentar'}));
  expect(await screen.findByRole('checkbox', {name: 'Iluminación'})).toBeInTheDocument();
});
