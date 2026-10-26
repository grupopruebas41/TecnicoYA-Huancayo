import React, {useState} from 'react';
import {request} from './http';
import {Field, EMAIL_MAX_LENGTH, isValidEmail} from './forms';
import {PasswordField, PasswordMeter} from './passwordFields';
import {validatePassword} from './registration';

const NEUTRAL = 'Si el correo existe, te enviamos un enlace para restablecer tu contraseña.';

/** D-80: pide el enlace; la respuesta es la misma exista o no la cuenta. */
export function ForgotPassword({onBack}) {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const normalized = email.trim().toLowerCase();
    setError(''); setSent('');
    if (!isValidEmail(normalized)) { setErrors({email: ['Ingresa un correo válido.']}); return; }
    setErrors({}); setBusy(true);
    try { setSent((await request('/auth/password/forgot', {email: normalized}))?.data?.message || NEUTRAL); }
    catch (failure) { setError(failure.message); setErrors(failure.fields || {}); }
    finally { setBusy(false); }
  }
  return <form className="auth-form" onSubmit={submit} noValidate aria-busy={busy}>
    <span className="kicker">TU ESPACIO EN TÉCNICOYA</span><h1>Recupera tu acceso</h1>
    <p className="muted">Escribe el correo de tu cuenta y te enviaremos un enlace para elegir una nueva contraseña. Vence en 60 minutos.</p>
    {sent && <output className="notice" data-cy="forgot-sent">{sent}</output>}
    <Field name="email" label="Correo" errors={errors} type="email" maxLength={EMAIL_MAX_LENGTH} autoComplete="email" data-cy="forgot-email" value={email} onChange={event => setEmail(event.target.value)}/>
    {error && <p className="error" role="alert">{error}</p>}
    <button type="submit" className="button primary submit" data-cy="forgot-submit" disabled={busy}>{busy ? 'Enviando…' : 'Enviar enlace'}</button>
    <button type="button" className="text-button" data-cy="forgot-back" onClick={onBack}>Volver a iniciar sesión</button>
  </form>;
}

/** D-80: pantalla del enlace (#cuenta/restablecer?token=…&email=…). Al guardar se cierran las demás sesiones. */
export function ResetPassword({token, email}) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const invalid = validatePassword(password, confirmation);
    setErrors(invalid); setError('');
    if (Object.keys(invalid).length) return;
    setBusy(true);
    try {
      const response = await request('/auth/password/reset', {email, token, password, password_confirmation: confirmation});
      setDone(response?.data?.message || 'Tu contraseña se actualizó.');
    } catch (failure) {
      const {token: tokenError, ...fields} = failure.fields || {};
      setErrors(fields); setError(tokenError?.[0] || failure.message);
    } finally { setBusy(false); }
  }
  return <div className="auth-status auth-reset">
    <span className="auth-emblem" aria-hidden="true">t</span>
    {done ? <>
      <h1>Contraseña actualizada</h1>
      <output className="notice" data-cy="reset-done">{done}</output>
      <a className="button primary submit" href="#cuenta">Ir a iniciar sesión</a>
    </> : <form className="auth-form" onSubmit={submit} noValidate aria-busy={busy}>
      <h1>Elige una nueva contraseña</h1>
      <p className="muted">Al guardarla se cerrarán las sesiones abiertas de tu cuenta.</p>
      {error && <div className="auth-alert" role="alert"><span className="auth-alert-icon" aria-hidden="true">!</span><p>{error}</p><a className="text-button" href="#cuenta">Pedir un enlace nuevo</a></div>}
      <PasswordField name="password" label="Nueva contraseña" toggleLabel="nueva contraseña" errors={errors} autoComplete="new-password" data-cy="reset-password" value={password} onChange={event => setPassword(event.target.value)}/>
      <PasswordField name="password_confirmation" label="Confirmar contraseña" toggleLabel="confirmación de contraseña" errors={errors} autoComplete="new-password" data-cy="reset-password-confirmation" value={confirmation} onChange={event => setConfirmation(event.target.value)}/>
      <PasswordMeter password={password}/>
      <button type="submit" className="button primary submit" data-cy="reset-submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar contraseña'}</button>
    </form>}
  </div>;
}
