import React from 'react';
import {afterEach, expect, test, vi} from 'vitest';
import {act, cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import AccountApp from './AccountApp';
import SessionForm from './SessionForm';
import {request} from './http';
import {setAuthIntent} from '../../landing/config';
// Encuadre de la pantalla #cuenta (2026-10-26): el aviso de conexión vive dentro de la tarjeta.
vi.mock('./Sprint02Portal', () => ({default: () => null}));
vi.mock('./http', () => ({request: vi.fn()}));
afterEach(() => {cleanup(); vi.resetAllMocks(); window.history.replaceState(null, '', '/');});

test('S01-TC-084 complemento: el error de conexión y Reintentar quedan dentro de la tarjeta, sobre el formulario', async () => {
  request.mockRejectedValueOnce({status: 0, message: 'No se pudo conectar.'});
  render(<AccountApp/>);
  const retry = await screen.findByRole('button', {name: 'Reintentar conexión'});
  const card = document.querySelector('.auth-shell');
  const alert = screen.getByRole('alert');

  expect(card).toContainElement(alert);
  expect(alert).toHaveTextContent('No se pudo conectar.');
  expect(alert).toContainElement(retry);
  const heading = within(card).getByRole('heading', {name: 'Iniciar sesión'});
  expect(alert.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(document.querySelector('.auth-page')).toContainElement(card);

  request.mockRejectedValueOnce({status: 401, message: 'Tu sesión no está activa.'});
  fireEvent.click(retry);
  await screen.findByRole('button', {name: 'Ingresar'});
  expect(request).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole('button', {name: 'Reintentar conexión'})).not.toBeInTheDocument();
});

test('S01-TC-084 complemento: Comprobando tu sesión usa el mismo encuadre centrado', () => {
  request.mockReturnValue(new Promise(() => {}));
  render(<AccountApp/>);
  const status = screen.getByRole('status');

  expect(status).toHaveTextContent('Comprobando tu sesión…');
  expect(status.closest('.auth-status')).not.toBeNull();
  expect(status.closest('.auth-page')).not.toBeNull();
});

test('S01-TC-075 complemento: el registro agrupa campos en filas sin cambiar el orden de tabulación', () => {
  setAuthIntent('register', 'client');
  render(<SessionForm onLogin={vi.fn()}/>);
  const order = [...document.querySelectorAll('.auth-shell [data-cy]')].map(node => node.dataset.cy)
    .filter(cy => cy.startsWith('register-'));

  expect(order).toEqual(['register-name', 'register-account-type', 'register-client-type', 'register-email',
    'register-password', 'register-password-confirmation', 'register-submit']);
  const rows = [...document.querySelectorAll('.auth-row')].map(row => [...row.querySelectorAll('[data-cy]')].map(node => node.dataset.cy));
  expect(rows).toEqual([['register-account-type', 'register-client-type'], ['register-password', 'register-password-confirmation']]);
  // El panel de marca va antes del formulario en el DOM: Cypress S01-TC-075 tabula marca → Volver → Crear/Ya tengo cuenta.
  const panel = document.querySelector('.auth-welcome');
  expect(panel.compareDocumentPosition(document.querySelector('.auth-form')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test('S01-TC-075 complemento: el cambio de modo vive solo en el botón del panel, que cambia su texto', () => {
  render(<SessionForm onLogin={vi.fn()}/>);
  const card = document.querySelector('.auth-shell');

  expect(card.querySelector('.auth-form .text-button')).toBeNull();
  const toRegister = within(card).getByRole('button', {name: 'Crear una cuenta ↗'});
  expect(toRegister).toHaveAttribute('data-cy', 'show-register');
  expect(toRegister).toHaveClass('auth-switch');

  fireEvent.click(toRegister);
  expect(card).toHaveClass('is-register');
  expect(within(card).getByRole('heading', {name: /¿Ya tienes cuenta\?/})).toBeInTheDocument();
  expect(within(card).getByText('Vuelve a tu espacio.')).toBeInTheDocument();
  const toLogin = within(card).getByRole('button', {name: 'Ya tengo una cuenta ↗'});
  expect(toLogin).toHaveAttribute('data-cy', 'show-login');
  expect(within(card).queryByRole('button', {name: 'Iniciar sesión'})).not.toBeInTheDocument();

  fireEvent.click(toLogin);
  expect(card).not.toHaveClass('is-register');
  expect(within(card).getByRole('heading', {name: /Tu solución/})).toBeInTheDocument();
});

test('S01-TC-075 complemento: tras la animación el foco va al primer campo del formulario visible', () => {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', () => ({matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()}));
  try {
    render(<SessionForm onLogin={vi.fn()}/>);
    fireEvent.click(screen.getByRole('button', {name: 'Crear una cuenta ↗'}));
    act(() => vi.advanceTimersByTime(599));
    expect(document.querySelector('[data-cy=register-name]')).not.toHaveFocus();
    act(() => vi.advanceTimersByTime(1));
    expect(document.querySelector('[data-cy=register-name]')).toHaveFocus();

    fireEvent.click(screen.getByRole('button', {name: 'Ya tengo una cuenta ↗'}));
    act(() => vi.advanceTimersByTime(600));
    expect(document.querySelector('[data-cy=login-email]')).toHaveFocus();
  } finally {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  }
});

test('S01-TC-075 complemento: con movimiento reducido el cambio de modo enfoca sin esperar el deslizamiento', () => {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', () => ({matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn()}));
  try {
    render(<SessionForm onLogin={vi.fn()}/>);
    fireEvent.click(screen.getByRole('button', {name: 'Crear una cuenta ↗'}));
    act(() => vi.advanceTimersByTime(0));
    expect(document.querySelector('[data-cy=register-name]')).toHaveFocus();
  } finally {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  }
});

test('S01-TC-084 complemento: cada contraseña tiene su botón Mostrar/Ocultar accesible', () => {
  setAuthIntent('register', 'client');
  render(<SessionForm onLogin={vi.fn()}/>);
  const password = document.querySelector('[data-cy=register-password]');
  const confirmation = document.querySelector('[data-cy=register-password-confirmation]');
  const showPassword = screen.getByRole('button', {name: 'Mostrar contraseña'});
  const showConfirmation = screen.getByRole('button', {name: 'Mostrar confirmación de contraseña'});

  for (const toggle of [showPassword, showConfirmation]) {
    expect(toggle).toHaveAttribute('type', 'button');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  }
  fireEvent.click(showPassword);
  expect(password).toHaveAttribute('type', 'text');
  expect(confirmation).toHaveAttribute('type', 'password');
  expect(showPassword).toHaveAttribute('aria-pressed', 'true');
  expect(showPassword).toHaveAccessibleName('Ocultar contraseña');

  fireEvent.click(showPassword);
  expect(password).toHaveAttribute('type', 'password');
  expect(showPassword).toHaveAccessibleName('Mostrar contraseña');
});
