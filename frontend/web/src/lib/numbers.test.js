import {expect, test} from 'vitest';
import {groupThousands} from './numbers';
import {feeLabel} from '../features/offers/CandidateCard';
import {soles} from '../features/technician/format';
import {offerSpeech} from '../features/technician/offerAlerts';

// S05-TC-374 · Cierre S4-S5 (Sonar S8786): las expresiones regulares con retroceso superlineal se reescribieron. Se fijan
// los resultados que daban antes para los casos de la plataforma y uno largo que antes era el peor caso.
test('S05-TC-374 el agrupado de miles y el texto leído en voz alta dan lo mismo que antes, sin expresiones con retroceso', () => {
  expect(['0', '7', '120', '1200', '12000', '123456', '1234567', '-1200'].map(groupThousands))
    .toEqual(['0', '7', '120', '1 200', '12 000', '123 456', '1 234 567', '-1 200']);
  expect(soles(120)).toBe('S/ 120,00');
  expect(soles(1200.5)).toBe('S/ 1 200,50');
  expect(feeLabel(80)).toBe('S/ 80,00 (referencial)');
  expect(feeLabel(1234567)).toBe('S/ 1 234 567,00 (referencial)');
  expect(groupThousands('9'.repeat(30000))).toHaveLength(30000 + 9999);

  const now = Date.parse('2026-11-18T15:00:00Z');
  const offer = {expires_at: '2026-11-18T15:10:00Z', reference_fee: {amount: 80},
    request: {subcategory: {name: 'Cámaras de frío'}, district: {name: 'El Tambo'}}};
  expect(offerSpeech(offer, now)).toBe('Nueva oferta: Cámaras de frío en El Tambo. Tarifa referencial: 80,00 soles. Tienes 10 minutos para responder.');
  // Sin distrito ni tarifa no quedan espacios dobles ni un espacio antes del punto.
  expect(offerSpeech({expires_at: '2026-11-18T15:01:00Z', request: {}}, now)).toBe('Nueva oferta: un trabajo. Tienes 1 minuto para responder.');
});
