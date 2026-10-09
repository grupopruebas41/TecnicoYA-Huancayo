const verificationLabels = {pending: 'Pendiente de verificación', approved: 'Verificación aprobada', rejected: 'Verificación rechazada'};
const permissionLabels = {
  'catalog.manage': 'Administrar el catálogo',
  'announcements.manage': 'Administrar los comunicados',
  'technicians.verify': 'Revisar y habilitar técnicos',
};
export const verificationLabel = code => verificationLabels[code] || 'Estado no disponible';
export const permissionLabel = code => permissionLabels[code] || 'Permiso adicional habilitado';
const apiMessages = {
  'Unauthenticated.': 'Tu sesión venció. Inicia sesión nuevamente.',
  'This action is unauthorized.': 'No tienes permiso para realizar esta acción.',
  'Too Many Attempts.': 'Demasiados intentos. Espera un momento antes de volver a intentarlo.',
  'CSRF token mismatch.': 'La sesión de seguridad venció. Recarga la página e inténtalo nuevamente.',
  'Server Error': 'El servicio no está disponible. Inténtalo nuevamente más tarde.',
  'The given data was invalid.': 'Revisa los campos indicados.',
};
export const apiMessage = message => apiMessages[message] || message;
