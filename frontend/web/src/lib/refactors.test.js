import {expect, test} from 'vitest';
import {cardRotation} from '../ServiceCarousel';
import {navTooltip} from '../features/panel/PanelShell';
import {profileErrors} from '../features/administration/ProfileForm';
import {validateOrderStep} from '../features/requests/order/orderModel';

// S05-TC-375 · Cierre S4-S5 (Sonar S3776): las funciones que se separaron para bajar la complejidad dan lo mismo que antes.
test('S05-TC-375 las piezas separadas por complejidad conservan sus resultados', () => {
  // Giro de las tarjetas del carrusel: 0 en el centro, 25° y luego 15° más por posición, hacia el centro.
  expect([-3, -2, -1, 0, 1, 2, 3].map(cardRotation)).toEqual([55, 40, 25, 0, -25, -40, -55]);

  // Tooltip del menú contraído: sin estado en texto, el nombre; con estado, su texto completo sin repetir el nombre.
  const verification = {id: 'verification', label: 'Verificación'};
  expect(navTooltip(verification, undefined)).toBe('Verificación');
  expect(navTooltip(verification, {count: 3, label: '3 pendientes'})).toBe('Verificación');
  expect(navTooltip(verification, {text: 'Falta 1', label: 'Verificación: Falta un documento'})).toBe('Verificación: Falta un documento');
  expect(navTooltip({id: 'profile-pro', label: 'Perfil profesional'}, {text: '50 %', label: 'Perfil al 50 %'})).toBe('Perfil profesional · Perfil al 50 %');

  // Validación del perfil: mismos mensajes y claves.
  expect(profileErrors({separate: true, givenNames: 'A', familyNames: 'Quispe', name: '', phone: ''}))
    .toEqual({given_names: ['Los nombres deben tener entre 2 y 50 caracteres.']});
  expect(profileErrors({separate: false, givenNames: '', familyNames: '', name: 'X', phone: 'abc'})).toEqual({
    name: ['El nombre debe tener entre 2 y 100 caracteres.'], phone: ['Ingresa un teléfono válido de hasta 20 caracteres.']});
  expect(profileErrors({separate: false, givenNames: '', familyNames: '', name: 'Ana Quispe', phone: '+51 964 000 000'})).toEqual({});

  // Pedido: cada paso valida lo suyo y un paso desconocido no da errores.
  expect(validateOrderStep(1, {specialtyIds: []})).toEqual({specialty_ids: 'Marca al menos una especialidad.'});
  expect(validateOrderStep(5, {confirmed: false})).toEqual({confirmed: 'Confirma que el resumen es correcto.'});
  expect(validateOrderStep(9, {})).toEqual({});
});
