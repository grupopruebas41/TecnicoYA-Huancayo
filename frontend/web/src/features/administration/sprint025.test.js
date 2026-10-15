import { afterEach, test, expect, vi } from 'vitest';
import { validateReferenceFee, validatePerformedOn } from './sprint02Validation';

afterEach(() => vi.useRealTimers());

// Complementos del catálogo v1.1; no agregan IDs al conteo del sprint.
test('S02-TC-076 complemento: referencia orientativa, límites y decimales v1.1', () => {
  for (const value of ['', null, '0', '100000.00']) expect(validateReferenceFee(value)).toBe('');
  for (const value of ['-1', '100000.01', '1.123']) expect(validateReferenceFee(value)).toBeTruthy();
});

test('S02-TC-088 complemento de portafolio: fecha opcional y no futura UTC', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-13T02:00:00Z'));
  expect(validatePerformedOn('')).toBe('');
  expect(validatePerformedOn('2026-10-13')).toBe('');
  expect(validatePerformedOn('2026-10-14')).toBe('La fecha del trabajo no puede ser futura.');
  expect(validatePerformedOn('2026-02-30')).toBe('Indica una fecha válida.');
});
