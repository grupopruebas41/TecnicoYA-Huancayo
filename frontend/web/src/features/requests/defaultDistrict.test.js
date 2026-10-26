import {expect, test} from 'vitest';
import {initialWizard, stateFromRecord} from './wizardState';

// Adelanto del Sprint 7 (D-73): el distrito principal del cliente (D-80) precarga la nueva solicitud.
test('S07-TC-030 la nueva solicitud empieza con el distrito principal y un borrador conserva el suyo', () => {
  expect(stateFromRecord(null)).toEqual(initialWizard);
  expect(stateFromRecord(null, {district_id: '2'})).toEqual({...initialWizard, district_id: '2'});

  const draft = {district: {id: 3}, subcategory: {id: 7, specialty_id: 1}, description: 'Falla', address: 'Jr. Uno', mode: 'asap',
    preferred_start_at: null, preferred_end_at: null};
  expect(stateFromRecord(draft, {district_id: '2'}).district_id).toBe('3');
});
