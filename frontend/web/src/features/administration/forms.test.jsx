import React from 'react';
import {afterEach, expect, test} from 'vitest';
import {cleanup, render, screen} from '@testing-library/react';
import SessionForm from './SessionForm';
import {isValidEmail, validateAccount} from './forms';
afterEach(cleanup);
const emailOfLength = length => 'a'.repeat(64) + '@' + 'b'.repeat(63) + '.' + 'c'.repeat(63) + '.' + 'd'.repeat(length - 193);
test.each([253, 254])('DEF-10 admite correo de %i caracteres', length => {
  const email = emailOfLength(length);
  expect(email).toHaveLength(length);
  expect(isValidEmail(email)).toBe(true);
});
test.each([255, 100000])('DEF-10 rechaza correo de %i caracteres antes de analizarlo', length => {
  expect(isValidEmail(emailOfLength(length))).toBe(false);
});
test.each(['', 'a@b', '@b.pe', 'a@@b.pe', 'a@.pe', 'a@b..pe', 'a@b.pe.', 'a b@c.pe', 'a@b.pe\n', undefined])('DEF-10 rechaza formato inválido %s', email => {
  expect(validateAccount({email, password: 'ejemplo'}, false).email).toEqual(['Ingresa un correo válido.']);
});
test('DEF-10 acepta subdominios y alias', () => expect(isValidEmail('cliente+soporte@correo.example.pe')).toBe(true));
test('DEF-10 limita el campo de correo en la pantalla', () => {
  render(<SessionForm onLogin={() => {}}/>);
  expect(screen.getByLabelText('Correo')).toHaveAttribute('maxlength', '254');
});
