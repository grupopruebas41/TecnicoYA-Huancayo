import {isValidEmail} from './forms';

// D-80: reglas del registro detallado. Son las mismas del servidor (RegisterAccountRequest), que sigue siendo la autoridad.
export const PERU_MOBILE = /^9\d{8}$/;
const length = value => Array.from((value || '').trim()).length;
const bytes = value => new TextEncoder().encode(value || '').length;

export const emptyRegistration = {
  account_type: '', given_names: '', family_names: '', email: '', phone: '',
  client_type: 'household', district_id: '', business_name: '', reference_address: '',
  base_district_id: '', district_ids: [], specialty_ids: [], experience_years: '', whatsapp: '',
  password: '', password_confirmation: '', terms_accepted: false,
};

/** Puntaje de 0 a 5: longitud (8 y 12), mayúsculas y minúsculas, números y símbolos. */
export function passwordStrength(password = '') {
  if (!password) return {score: 0, label: ''};
  const score = [password.length >= 8, password.length >= 12, /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  const label = score <= 1 ? 'Débil' : score === 2 ? 'Aceptable' : score <= 4 ? 'Buena' : 'Fuerte';
  return {score, label};
}

export function validatePassword(password, confirmation) {
  const errors = {};
  if (Array.from(password || '').length < 8 || bytes(password) > 72) {
    errors.password = ['La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.'];
  }
  if (password !== confirmation) errors.password_confirmation = ['Las contraseñas no coinciden.'];
  return errors;
}

export function validateRegistration(values) {
  const errors = {};
  const invalid = (name, message) => { errors[name] = [message]; };
  if (length(values.given_names) < 2 || length(values.given_names) > 50) invalid('given_names', 'Los nombres deben tener entre 2 y 50 caracteres.');
  if (length(values.family_names) < 2 || length(values.family_names) > 50) invalid('family_names', 'Los apellidos deben tener entre 2 y 50 caracteres.');
  if (!isValidEmail(values.email.trim().toLowerCase())) invalid('email', 'Ingresa un correo válido.');
  if (!PERU_MOBILE.test(values.phone)) invalid('phone', 'El teléfono debe tener 9 dígitos y empezar en 9.');
  Object.assign(errors, validatePassword(values.password, values.password_confirmation));
  if (!values.terms_accepted) invalid('terms_accepted', 'Debes aceptar los Términos y la Privacidad.');
  if (values.account_type === 'client') {
    if (!values.district_id) invalid('district_id', 'Elige tu distrito.');
    if (!['household', 'mype'].includes(values.client_type)) invalid('client_type', 'Selecciona un tipo de cliente válido.');
    if (length(values.business_name) > 180) invalid('business_name', 'La razón social admite hasta 180 caracteres.');
    if (length(values.reference_address) > 255) invalid('reference_address', 'La dirección admite hasta 255 caracteres.');
  } else {
    if (!values.base_district_id) invalid('base_district_id', 'Elige tu distrito base.');
    if (!values.specialty_ids.length) invalid('specialty_ids', 'Elige al menos una especialidad.');
    const years = Number(values.experience_years);
    if (values.experience_years === '' || !Number.isInteger(years) || years < 0 || years > 50) {
      invalid('experience_years', 'Indica tus años de experiencia, de 0 a 50.');
    }
    if (values.whatsapp && !PERU_MOBILE.test(values.whatsapp)) invalid('whatsapp', 'El WhatsApp debe tener 9 dígitos y empezar en 9.');
  }
  return errors;
}

/** Cuerpo de POST /auth/register: solo los campos del tipo de cuenta; el distrito base siempre va entre los atendidos. */
export function registrationPayload(values) {
  const payload = {
    account_type: values.account_type, given_names: values.given_names.trim(), family_names: values.family_names.trim(),
    email: values.email.trim().toLowerCase(), phone: values.phone, password: values.password,
    password_confirmation: values.password_confirmation, terms_accepted: true,
  };
  if (values.account_type === 'client') {
    payload.district_id = Number(values.district_id);
    payload.client_type = values.client_type;
    if (values.client_type === 'mype' && values.business_name.trim()) payload.business_name = values.business_name.trim();
    if (values.reference_address.trim()) payload.reference_address = values.reference_address.trim();
  } else {
    const base = Number(values.base_district_id);
    payload.base_district_id = base;
    payload.district_ids = [base, ...values.district_ids.map(Number).filter(id => id !== base)];
    payload.specialty_ids = values.specialty_ids.map(Number);
    payload.experience_years = Number(values.experience_years);
    if (values.whatsapp) payload.whatsapp = values.whatsapp;
  }
  return payload;
}
