// Bloque C (D-85): etiquetas y validación de cliente del panel de administración. El servidor repite cada regla.
import {isValidEmail} from '../administration/forms';
import {PERU_MOBILE} from '../administration/registration';

export const ROLE_LABELS = {client: 'Cliente', technician: 'Técnico', admin: 'Administrador'};
export const USER_STATUS_LABELS = {active: 'Activo', blocked: 'Bloqueado', pending_activation: 'Pendiente de activación', anonymized: 'Eliminado'};
export const REQUEST_STATUS_LABELS = {
  registered: 'Borrador', sent: 'Enviada', pending_availability: 'Pendiente de disponibilidad', assigned: 'Asignada',
  in_progress: 'En curso', completed: 'Completada', closed: 'Cerrada', unrated: 'Sin calificar', cancelled: 'Cancelada', expired: 'Vencida',
};
export const TECHNICIAN_STATUS_LABELS = {pending_verification: 'Por verificar', active: 'Activo', inactive: 'Inactivo', suspended: 'Suspendido'};
export const EVENT_LABELS = {
  'user.created': 'Alta de usuario', 'user.updated': 'Datos de usuario editados', 'user.blocked': 'Cuenta bloqueada',
  'user.unblocked': 'Cuenta desbloqueada', 'user.access_reset': 'Acceso restablecido', 'user.sessions_closed': 'Sesiones cerradas',
  'user.activation_sent': 'Enlace de activación reenviado', 'user.anonymized': 'Cuenta eliminada (anonimizada)',
  'technician.reviewed': 'Técnico revisado', 'technician.suspended': 'Técnico suspendido', 'technician.reactivated': 'Técnico reactivado',
  'announcement.created': 'Comunicado creado', 'announcement.updated': 'Comunicado editado', 'announcement.published': 'Comunicado publicado',
  'announcement.published_edited': 'Comunicado vigente editado', 'announcement.unpublished': 'Comunicado despublicado',
  'announcement.retired': 'Comunicado retirado', 'announcement.restored': 'Comunicado restaurado', 'announcement.deleted': 'Comunicado eliminado',
  'announcement.reordered': 'Orden del carrusel cambiado',
};
export const eventLabel = action => EVENT_LABELS[action] || action;

const dateTime = new Intl.DateTimeFormat('es-PE', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'});
const dateOnly = new Intl.DateTimeFormat('es-PE', {day: 'numeric', month: 'short', year: 'numeric'});
export const formatDateTime = value => (value ? dateTime.format(new Date(value)) : '—');
export const formatDate = value => (value ? dateOnly.format(new Date(value)) : '—');

/** Segundos a texto corto: «45 s», «3 min», «1 h 5 min». */
export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return '—';
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return minutes % 60 ? `${hours} h ${minutes % 60} min` : `${hours} h`;
}
export const formatPercent = rate => (rate === null || rate === undefined ? '—' : `${Math.round(rate * 100)} %`);

/** Lleva los filtros a la consulta: solo los que tienen valor, en orden estable. */
export function toQuery(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== '' && value !== null && value !== undefined) params.set(key, value); });
  const text = params.toString();
  return text ? `?${text}` : '';
}

export function validateReason(reason) {
  return String(reason || '').trim().length >= 5 ? {} : {reason: ['Escribe el motivo (al menos 5 caracteres).']};
}

export const emptyUser = {
  account_type: 'client', given_names: '', family_names: '', email: '', phone: '',
  client_type: 'household', district_id: '', business_name: '', reference_address: '',
  base_district_id: '', district_ids: [], specialty_ids: [], subcategory_ids: [], experience_years: '', reason: '',
};

/** Validación de cliente del alta (o de la edición, con editing: sin rol ni datos de técnico salvo el distrito). */
export function validateUser(values, {editing = false} = {}) {
  const errors = {};
  const required = (name, message) => { if (!String(values[name] ?? '').trim()) errors[name] = [message]; };
  required('given_names', 'Escribe los nombres.');
  required('family_names', 'Escribe los apellidos.');
  if (!isValidEmail(String(values.email || '').trim())) errors.email = ['Escribe un correo válido.'];
  if (!PERU_MOBILE.test(String(values.phone || ''))) errors.phone = ['El teléfono debe tener 9 dígitos y empezar en 9.'];
  if (values.account_type === 'client') required('district_id', 'Elige el distrito.');
  if (values.account_type === 'technician' && !editing) {
    required('base_district_id', 'Elige el distrito base.');
    if (!values.specialty_ids.length) errors.specialty_ids = ['Elige al menos una especialidad.'];
    else if (!values.subcategory_ids.length) errors.subcategory_ids = ['Elige al menos un rubro de cada especialidad.'];
    const years = Number(values.experience_years);
    if (values.experience_years === '' || !Number.isInteger(years) || years < 0 || years > 50) errors.experience_years = ['Indica los años de experiencia (0 a 50).'];
  }
  return {...errors, ...validateReason(values.reason)};
}

/** Cuerpo del alta: sin contraseña; solo los campos del tipo de cuenta. */
export function userPayload(values) {
  const base = {account_type: values.account_type, given_names: values.given_names.trim(), family_names: values.family_names.trim(),
    email: values.email.trim().toLowerCase(), phone: values.phone, reason: values.reason.trim()};
  if (values.account_type === 'client') {
    return {...base, client_type: values.client_type, district_id: Number(values.district_id),
      ...(values.client_type === 'mype' && values.business_name.trim() ? {business_name: values.business_name.trim()} : {}),
      ...(values.reference_address.trim() ? {reference_address: values.reference_address.trim()} : {})};
  }
  if (values.account_type === 'technician') {
    const base_district_id = Number(values.base_district_id);
    return {...base, base_district_id, district_ids: [...new Set([base_district_id, ...values.district_ids.map(Number)])],
      specialty_ids: values.specialty_ids.map(Number), subcategory_ids: values.subcategory_ids.map(Number), experience_years: Number(values.experience_years)};
  }
  return base;
}

/** Cuerpo de la edición: solo lo que cambió, con el motivo y la versión. */
export function userChanges(original, values) {
  const fields = ['given_names', 'family_names', 'email', 'phone', 'district_id', 'client_type', 'business_name', 'reference_address'];
  const changes = {};
  fields.forEach(field => {
    const before = original[field] ?? '';
    const after = values[field] ?? '';
    if (String(before) !== String(after)) changes[field] = field === 'district_id' ? Number(after) : (typeof after === 'string' ? after.trim() : after);
  });
  return changes;
}
