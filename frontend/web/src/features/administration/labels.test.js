import {expect, test} from 'vitest';
import {apiMessage, permissionLabel, verificationLabel} from './labels';
test.each([['approved','Verificación aprobada'],['rejected','Verificación rechazada'],['pending','Pendiente de verificación'],['unknown','Estado no disponible']])('S01-TC-031 traduce estado %s', (code,label) => expect(verificationLabel(code)).toBe(label));
test.each([['announcements.manage','Administrar los comunicados'],['technicians.verify','Revisar y habilitar técnicos'],['catalog.manage','Administrar el catálogo'],['unknown','Permiso adicional habilitado']])('S01-TC-032 traduce permiso %s', (code,label) => expect(permissionLabel(code)).toBe(label));
test('S01-TC-033 traduce errores estándar y conserva mensajes del servidor en español', () => {
 expect(apiMessage('Unauthenticated.')).toContain('Tu sesión venció');
 expect(apiMessage('Correo ya registrado.')).toBe('Correo ya registrado.');
});
