import React, {useEffect, useRef, useState} from 'react';
import {request} from './http';
import {Field, Notice, validateAccount, EMAIL_MAX_LENGTH} from './forms';
import './auth.css';
import {takeAuthIntent} from '../../landing/config';

// Duración del deslizamiento del panel (auth.css); sin animación, el foco se mueve de inmediato.
const SLIDE_MS = 600;
const media = query => window.matchMedia?.(query)?.matches;

const panels = {
  login: {kicker: 'TALENTO LOCAL. CONEXIONES DE CONFIANZA.', title: 'Tu solución', accent: 'empieza aquí.',
    text: 'Conecta con especialistas de Huancayo desde tu cuenta personal.', action: 'Crear una cuenta ↗', cy: 'show-register'},
  register: {kicker: 'BIENVENIDO DE NUEVO', title: '¿Ya tienes cuenta?', accent: 'Vuelve a tu espacio.',
    text: 'Inicia sesión para seguir tus solicitudes y servicios.', action: 'Ya tengo una cuenta ↗', cy: 'show-login'},
};

function PasswordField({name, label, toggleLabel, errors = {}, ...props}) {
  const [visible, setVisible] = useState(false);
  const message = errors[name]?.[0];
  const id = `field-${name}`;
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

export default function SessionForm({onLogin, connectionError = '', onRetry}) {
  const [intent] = useState(takeAuthIntent);
  const [register, setRegister] = useState(intent?.mode === 'register');
  const [type, setType] = useState(intent?.role || 'client');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const formSide = useRef(null);
  const focusTimer = useRef(null);
  useEffect(() => () => clearTimeout(focusTimer.current), []);
  function focusFirstField() {
    clearTimeout(focusTimer.current);
    // En móvil o con movimiento reducido no hay deslizamiento que esperar.
    const delay = media('(prefers-reduced-motion: reduce)') || media('(max-width: 760px)') ? 0 : SLIDE_MS;
    focusTimer.current = setTimeout(() => formSide.current?.querySelector('input, select')?.focus(), delay);
  }
  function changeMode() { setRegister(!register); setErrors({}); setError(''); setSuccess(''); focusFirstField(); }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    data.email = data.email.trim().toLowerCase();
    const invalid = validateAccount(data, register);
    setErrors(invalid); setSuccess(''); setError('');
    if (Object.keys(invalid).length) { setError('Revisa los campos indicados.'); form.elements.namedItem(Object.keys(invalid)[0])?.focus(); return; }
    setBusy(true);
    try {
      await request(register ? '/auth/register' : '/auth/login', data);
      form.reset();
      if (register) {
        setEmail(data.email); setRegister(false); setSuccess('Cuenta creada correctamente. Inicia sesión para continuar.'); focusFirstField();
      } else onLogin((await request('/me')).data);
    } catch (error) {
      setError(error.message); setErrors(error.fields || {});
      if (error.status === 0) {
        // Una respuesta perdida puede haber creado la sesión. Nunca reenviamos el POST.
        try { const current = await request('/me'); if (!register) onLogin(current.data, error.message); }
        catch { /* El aviso incierto permanece; no se afirma que la operación falló. */ }
      }
    }
    finally { setBusy(false); }
  }
  const prefix = register ? 'register' : 'login';
  const submitLabel = register ? 'Registrarme' : 'Ingresar';
  const panel = panels[prefix];
  // El panel va antes del formulario en el DOM (orden de Tab de S01-TC-075); el CSS lo desliza de lado.
  return <div className={`auth-shell ${register ? 'is-register' : ''}`}>
    <aside className="auth-welcome"><span className="auth-emblem" aria-hidden="true">t</span><div className="auth-welcome-copy" key={prefix}>
      <span className="kicker">{panel.kicker}</span><h2>{panel.title}<br/><em>{panel.accent}</em></h2>
      <p>{panel.text}</p>
      <button className="button auth-switch" type="button" data-cy={panel.cy} disabled={busy} onClick={changeMode}>{panel.action}</button>
    </div><span className="auth-location">TÉCNICOYA · HUANCAYO</span></aside>
    <div className="auth-form-side" ref={formSide}>{connectionError && <div className="auth-alert" role="alert"><span className="auth-alert-icon" aria-hidden="true">!</span><p>{connectionError}</p>{onRetry && <button type="button" className="text-button" onClick={onRetry}>Reintentar conexión</button>}</div>}<form key={prefix} className="auth-form" onSubmit={submit} noValidate aria-busy={busy}>
      <span className="kicker">TU ESPACIO EN TÉCNICOYA</span><h1>{register ? 'Crea tu cuenta' : 'Iniciar sesión'}</h1>
      {success && <output className="notice" data-cy="register-success">{success}</output>}
      {register && <>
        <Field name="name" label="Nombre" errors={errors} data-cy="register-name" autoComplete="name"/>
        <div className="auth-row"><Field name="account_type" label="Tipo de cuenta" errors={errors}><select name="account_type" data-cy="register-account-type" value={type} onChange={e => setType(e.target.value)}><option value="client">Cliente</option><option value="technician">Técnico independiente</option></select></Field>
        {type === 'client' && <Field name="client_type" label="Tipo de cliente" errors={errors}><select name="client_type" data-cy="register-client-type"><option value="household">Hogar</option><option value="mype">MYPE</option></select></Field>}
        {type === 'technician' && <p className="muted">Tu perfil quedará pendiente de verificación. Podrás completar tus datos básicos.</p>}</div>
      </>}
      <Field name="email" label="Correo" errors={errors} type="email" maxLength={EMAIL_MAX_LENGTH} autoComplete="email" data-cy={`${prefix}-email`} value={email} onChange={e => setEmail(e.target.value)}/>
      <div className={register ? 'auth-row' : undefined}><PasswordField name="password" label="Contraseña" toggleLabel="contraseña" errors={errors} autoComplete={register ? 'new-password' : 'current-password'} data-cy={`${prefix}-password`}/>
      {register && <PasswordField name="password_confirmation" label="Confirmar contraseña" toggleLabel="confirmación de contraseña" errors={errors} autoComplete="new-password" data-cy="register-password-confirmation"/>}</div>
      <Notice error={error}/><button type="submit" className="button primary submit" data-cy={`${prefix}-submit`} disabled={busy}>{busy ? 'Conectando…' : submitLabel}</button>
    </form></div>
  </div>;
}
