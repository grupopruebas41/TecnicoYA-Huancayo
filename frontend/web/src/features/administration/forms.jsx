import React from 'react';

export function Field({name, label, errors = {}, children, ...props}) {
  const message = errors[name]?.[0];
  const accessibility = {'aria-invalid': !!message, 'aria-describedby': message ? `${name}-error` : undefined};
  return <label>{label}{children ? React.cloneElement(children, accessibility) : <input name={name} {...accessibility} {...props}/>}
    {message && <span className="field-error" id={`${name}-error`}>{message}</span>}
  </label>;
}

export function Notice({error, success}) {
  return <>{error && <p className="error" role="alert">{error}</p>}{success && <p className="notice" role="status">{success}</p>}</>;
}

export function validateAccount(data, registering) {
  const errors = {};
  const invalid = (name, message) => { errors[name] = [message]; };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) invalid('email', 'Ingresa un correo válido.');
  if (!data.password) invalid('password', 'La contraseña es obligatoria.');
  if (registering) {
    if (data.name.trim().length < 2 || data.name.length > 100) invalid('name', 'El nombre debe tener entre 2 y 100 caracteres.');
    if (data.password.length < 8 || new TextEncoder().encode(data.password).length > 72) invalid('password', 'La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.');
    if (data.password !== data.password_confirmation) invalid('password_confirmation', 'Las contraseñas no coinciden.');
    if (!['client', 'technician'].includes(data.account_type)) invalid('account_type', 'Selecciona un tipo de cuenta válido.');
    if (data.account_type === 'client' && !['household', 'mype'].includes(data.client_type)) invalid('client_type', 'Selecciona un tipo de cliente válido.');
  }
  return errors;
}
