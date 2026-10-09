import {expect, test} from 'vitest';
import {validateAccount} from './forms';

const account = overrides => ({name: 'Cliente sintético', email: 'cliente@example.test', password: 'Sintetica123!', password_confirmation: 'Sintetica123!', account_type: 'client', client_type: 'household', ...overrides});
test.each([[1, true], [2, false], [100, false], [101, true]])('S01-TC-078 nombre de %i caracteres', (length, invalid) => {
  expect(!!validateAccount(account({name: 'a'.repeat(length)}), true).name).toBe(invalid);
});
test.each([['á'.repeat(36), false], ['á'.repeat(36) + 'a', true], ['á'.repeat(37), true]])('S01-TC-079 límite UTF-8 de contraseña', (password, invalid) => {
  expect(!!validateAccount(account({password, password_confirmation: password}), true).password).toBe(invalid);
});
test('S01-TC-080 tipo de cliente requerido para cliente y prohibido para técnico', () => {
  expect(validateAccount(account({client_type: undefined}), true)).toHaveProperty('client_type');
  expect(validateAccount(account({account_type: 'technician', client_type: undefined}), true)).toEqual({});
  expect(validateAccount(account({account_type: 'technician'}), true)).toHaveProperty('client_type');
});
