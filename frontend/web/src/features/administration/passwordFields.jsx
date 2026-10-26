import React, {useState} from 'react';
import {passwordStrength} from './registration';

/** Contraseña con botón Mostrar/Ocultar (aria-pressed) que no sale del orden de Tab. */
export function PasswordField({name, label, toggleLabel, errors = {}, ...props}) {
  const [visible, setVisible] = useState(false);
  const message = errors[name]?.[0];
  const id = props.id || `field-${name}`;
  return <div className="form-field"><label htmlFor={id}>{label}</label>
    <div className="password-input">
      <input id={id} name={name} type={visible ? 'text' : 'password'} aria-invalid={!!message} aria-describedby={message ? `${name}-error` : undefined} {...props}/>
      <button type="button" className="password-toggle" aria-pressed={visible} aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${toggleLabel}`} onClick={() => setVisible(!visible)}>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{visible && <path d="M3 3l18 18"/>}</svg>
      </button>
    </div>
    {message && <span className="field-error" id={`${name}-error`}>{message}</span>}
  </div>;
}

/** Medidor de 5 niveles; el texto se anuncia sin interrumpir (aria-live polite). */
export function PasswordMeter({password}) {
  const {score, label} = passwordStrength(password);
  return <div className="password-meter" data-score={score}>
    <div className="password-meter-bar" role="meter" aria-label="Seguridad de la contraseña" aria-valuemin={0} aria-valuemax={5} aria-valuenow={score} aria-valuetext={label || 'Sin contraseña'}>
      <span style={{width: `${score * 20}%`}}/>
    </div>
    <span className="password-meter-label" aria-live="polite">{label ? `Seguridad: ${label}` : 'Usa al menos 8 caracteres.'}</span>
  </div>;
}
