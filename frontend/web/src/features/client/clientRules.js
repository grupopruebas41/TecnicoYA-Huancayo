// Reglas de presentación del panel del cliente (adelanto del S5, D-87 a D-91). Sin llamadas a la API.

// Pestañas de «Mis solicitudes»: la fase de búsqueda (S4) manda sobre el estado guardado.
export const REQUEST_TABS = [
  ['all', 'Todas'],
  ['drafts', 'Borradores'],
  ['searching', 'En búsqueda'],
  ['choice', 'Por elegir'],
  ['assigned', 'Asignadas'],
  ['closed', 'Cerradas'],
];
const SEARCHING = new Set(['sent', 'matching', 'awaiting_responses', 'pending_availability', 'direct_declined']);
const ASSIGNED = new Set(['assigned', 'in_progress']);

export function requestGroup(row) {
  const phase = row.phase || row.status;
  if (row.status === 'registered') return 'drafts';
  if (phase === 'awaiting_choice') return 'choice';
  if (SEARCHING.has(phase)) return 'searching';
  if (ASSIGNED.has(phase)) return 'assigned';
  return 'closed';
}
export const isActive = row => ['searching', 'choice', 'assigned'].includes(requestGroup(row));
export function countByGroup(rows) {
  const counts = Object.fromEntries(REQUEST_TABS.map(([key]) => [key, 0]));
  rows.forEach(row => { counts.all += 1; counts[requestGroup(row)] += 1; });
  return counts;
}

// Siguiente paso en una línea (tarjetas de Mis solicitudes y «Tu última solicitud» del Inicio).
const NEXT_STEPS = {
  drafts: 'Siguiente paso: completa y envía tu solicitud.',
  searching: 'Siguiente paso: espera a que los técnicos respondan; te avisaremos.',
  choice: 'Elige a tu técnico entre los que aceptaron.',
  assigned: 'Tu técnico está asignado; te avisaremos cualquier cambio.',
  closed: 'Sin acciones pendientes.',
};
export const nextStep = row => NEXT_STEPS[requestGroup(row)];

// Clase de color del estado; el texto siempre acompaña al color (nunca solo color).
export const statusTone = row => ({drafts: 'is-draft', searching: 'is-search', choice: 'is-choice', assigned: 'is-assigned', closed: 'is-closed'})[requestGroup(row)];

/** D-88: «En tu distrito», «A 3,5 km · aproximada por zona» o sin distancia (sin distrito base o sin par en la matriz). */
export function distanceLabel(distance) {
  if (!distance) return 'Distancia no disponible';
  if (distance.same_district) return 'En tu distrito';
  // Coma decimal explícita: es-PE usa punto y el resto del panel escribe «3,5 km».
  const km = Number(distance.km);
  return `A ${Number.isInteger(km) ? km : km.toFixed(1).replace('.', ',')} km · ${distance.label}`;
}

/** Dos iniciales del nombre visible (tarjetas y avatares sin foto). */
export function initialsOf(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => Array.from(part)[0]).join('').toUpperCase() || '·';
}

/** Tarifa de referencia más baja de los servicios de la tarjeta; nunca es un cobro (RF-04). */
export function feeLabel(services = []) {
  const fees = services.map(service => Number(service.reference_fee)).filter(Number.isFinite);
  if (!fees.length) return 'Sin tarifa publicada';
  return `Desde S/ ${Math.min(...fees).toFixed(2)}`;
}

// Tarifa máxima del filtro (D-88): valores fijos, así el cliente no puede enviar un monto inválido.
export const MAX_FEES = [50, 80, 100, 150, 200];

// Tipos de notificación que recibe un cliente (S4, contrato §7.1).
export const NOTIFICATION_TYPES = [
  ['request.awaiting_choice', 'Técnicos por elegir'],
  ['request.pending', 'Búsqueda pendiente'],
  ['request.direct_declined', 'Técnico no disponible'],
  ['request.expired', 'Solicitud vencida'],
];

export const ADDRESS_MAX = 255;
/** D-91: validación de cliente de los datos de cliente; el servidor vuelve a validar. */
export function validateClientDetails({district_id: district, reference_address: address}) {
  const errors = {};
  if (!district) errors.district_id = 'Elige tu distrito principal.';
  if (address.trim().length > ADDRESS_MAX) errors.reference_address = `La dirección puede tener hasta ${ADDRESS_MAX} caracteres.`;
  return errors;
}

const LIMA = 'America/Lima';
const limaDay = date => date.toLocaleDateString('en-CA', {timeZone: LIMA});
/** «Hoy», «Ayer» o la fecha larga, según el día en Lima (bandeja agrupada por día). */
export function dayLabel(value, now = new Date()) {
  const day = limaDay(new Date(value));
  if (day === limaDay(now)) return 'Hoy';
  if (day === limaDay(new Date(now.getTime() - 86400000))) return 'Ayer';
  return new Date(value).toLocaleDateString('es-PE', {timeZone: LIMA, day: 'numeric', month: 'long', year: 'numeric'});
}
export const formatTime = value => new Date(value).toLocaleTimeString('es-PE', {timeZone: LIMA, hour: '2-digit', minute: '2-digit'});

export function formatDate(value) {
  return value ? new Date(value).toLocaleString('es-PE', {timeZone: 'America/Lima', dateStyle: 'medium', timeStyle: 'short'}) : '';
}
