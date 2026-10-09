import React from 'react';

export function Field({name, label, errors = {}, children, ...props}) {
  const message = errors[name]?.[0];
  const accessibility = {'aria-invalid': !!message, 'aria-describedby': message ? `${name}-error` : undefined};
  const id = props.id || `field-${name}`;
  return <div className="form-field"><label htmlFor={id}>{label}</label>{children ? React.cloneElement(children, {...accessibility, id}) : <input id={id} name={name} {...accessibility} {...props}/>}
    {message && <span className="field-error" id={`${name}-error`}>{message}</span>}
  </div>;
}

export function Notice({error, success}) {
  return <>{error && <p className="error" role="alert">{error}</p>}{success && <p className="notice" role="status">{success}</p>}</>;
}

export const EMAIL_MAX_LENGTH = 254;

// Acota el trabajo antes de validar; Laravel sigue siendo la autoridad del formato.
export function isValidEmail(email) {
  if (typeof email !== 'string' || email.length > EMAIL_MAX_LENGTH || /\s/.test(email)) return false;
  const parts = email.split('@');
  if (parts.length !== 2 || !parts[0]) return false;
  const labels = parts[1].split('.');
  return labels.length > 1 && labels.every(label => label.length > 0);
}

export function validateAccount(data, registering) {
  const errors = {};
  const invalid = (name, message) => { errors[name] = [message]; };
  if (!isValidEmail(data.email)) invalid('email', 'Ingresa un correo válido.');
  if (!data.password) invalid('password', 'La contraseña es obligatoria.');
  if (registering) {
    const nameLength = Array.from(data.name?.trim() || '').length;
    if (nameLength < 2 || nameLength > 100) invalid('name', 'El nombre debe tener entre 2 y 100 caracteres.');
    if (Array.from(data.password || '').length < 8 || new TextEncoder().encode(data.password || '').length > 72) invalid('password', 'La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.');
    if (data.password !== data.password_confirmation) invalid('password_confirmation', 'Las contraseñas no coinciden.');
    if (!['client', 'technician'].includes(data.account_type)) invalid('account_type', 'Selecciona un tipo de cuenta válido.');
    if (data.account_type === 'client' && !['household', 'mype'].includes(data.client_type)) invalid('client_type', 'Selecciona un tipo de cliente válido.');
    if (data.account_type === 'technician' && data.client_type !== undefined) invalid('client_type', 'El tipo de cliente no corresponde a una cuenta de técnico.');
  }
  return errors;
}
